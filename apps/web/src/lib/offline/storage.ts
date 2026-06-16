'use client';

import type { ClientRecord, ScheduleItem, TechUser, Visit } from '@/types/portal';

const DB_NAME = 'vl-offline-db';
const DB_VERSION = 1;
const VISITS_STORE = 'visits';
const PENDING_STORE = 'pending-visits';
const SCHEDULE_STORE = 'schedule';
const TECHNICIANS_STORE = 'technicians';
const CLIENTS_STORE = 'clients';
const META_STORE = 'meta';

type MetaValue = string | number | boolean | null;

function hasIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir IndexedDB'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VISITS_STORE)) {
        db.createObjectStore(VISITS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: 'local_id' });
      }
      if (!db.objectStoreNames.contains(SCHEDULE_STORE)) {
        db.createObjectStore(SCHEDULE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(TECHNICIANS_STORE)) {
        db.createObjectStore(TECHNICIANS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CLIENTS_STORE)) {
        db.createObjectStore(CLIENTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => void
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let settled = false;

    transaction.oncomplete = () => {
      if (!settled) {
        resolve(undefined as T);
      }
      db.close();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error('Falha na transação IndexedDB'));
    };

    handler(store);

    const originalResolve = resolve;
    resolve = ((value: T) => {
      settled = true;
      originalResolve(value);
    }) as typeof resolve;
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha no IndexedDB'));
  });
}

export function isOffline() {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

export async function cacheVisits(visits: Visit[]) {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  const transaction = db.transaction(VISITS_STORE, 'readwrite');
  const store = transaction.objectStore(VISITS_STORE);
  visits.forEach((visit) => store.put(visit));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Falha ao salvar visitas'));
  });
  db.close();
}

export async function getCachedVisits(): Promise<Visit[]> {
  if (!hasIndexedDb()) return [];
  const db = await openDb();
  const transaction = db.transaction(VISITS_STORE, 'readonly');
  const store = transaction.objectStore(VISITS_STORE);
  const result = await requestToPromise(store.getAll());
  db.close();
  return (result as Visit[]).sort((a, b) => b.date.localeCompare(a.date));
}

export async function queuePendingVisit(visit: Visit) {
  if (!hasIndexedDb()) return;
  const payload = {
    ...visit,
    pending_sync: true,
    local_id: visit.local_id || crypto.randomUUID?.() || `local-${Date.now()}`,
  };
  const db = await openDb();
  const transaction = db.transaction([PENDING_STORE, VISITS_STORE], 'readwrite');
  transaction.objectStore(PENDING_STORE).put(payload);
  transaction.objectStore(VISITS_STORE).put(payload);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Falha ao enfileirar visita'));
  });
  db.close();
}

export async function getPendingVisits(): Promise<Visit[]> {
  if (!hasIndexedDb()) return [];
  const db = await openDb();
  const transaction = db.transaction(PENDING_STORE, 'readonly');
  const store = transaction.objectStore(PENDING_STORE);
  const result = await requestToPromise(store.getAll());
  db.close();
  return result as Visit[];
}

export async function removePendingVisit(localId: string) {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  const transaction = db.transaction(PENDING_STORE, 'readwrite');
  transaction.objectStore(PENDING_STORE).delete(localId);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Falha ao remover pendência'));
  });
  db.close();
}

export async function cacheSchedule(items: ScheduleItem[]) {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  const transaction = db.transaction(SCHEDULE_STORE, 'readwrite');
  const store = transaction.objectStore(SCHEDULE_STORE);
  items.forEach((item) => store.put(item));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Falha ao salvar agenda'));
  });
  db.close();
}

export async function getCachedSchedule(): Promise<ScheduleItem[]> {
  if (!hasIndexedDb()) return [];
  const db = await openDb();
  const transaction = db.transaction(SCHEDULE_STORE, 'readonly');
  const store = transaction.objectStore(SCHEDULE_STORE);
  const result = await requestToPromise(store.getAll());
  db.close();
  return (result as ScheduleItem[]).sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
}

export async function cacheTechnicians(items: TechUser[]) {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  const transaction = db.transaction(TECHNICIANS_STORE, 'readwrite');
  const store = transaction.objectStore(TECHNICIANS_STORE);
  items.forEach((item) => store.put(item));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Falha ao salvar técnicos'));
  });
  db.close();
}

export async function getCachedTechnicians(): Promise<TechUser[]> {
  if (!hasIndexedDb()) return [];
  const db = await openDb();
  const transaction = db.transaction(TECHNICIANS_STORE, 'readonly');
  const store = transaction.objectStore(TECHNICIANS_STORE);
  const result = await requestToPromise(store.getAll());
  db.close();
  return (result as TechUser[]).sort((a, b) => a.name.localeCompare(b.name));
}

export async function cacheClients(items: ClientRecord[]) {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  const transaction = db.transaction(CLIENTS_STORE, 'readwrite');
  const store = transaction.objectStore(CLIENTS_STORE);
  items.forEach((item) => store.put(item));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Falha ao salvar clientes'));
  });
  db.close();
}

export async function getCachedClients(): Promise<ClientRecord[]> {
  if (!hasIndexedDb()) return [];
  const db = await openDb();
  const transaction = db.transaction(CLIENTS_STORE, 'readonly');
  const store = transaction.objectStore(CLIENTS_STORE);
  const result = await requestToPromise(store.getAll());
  db.close();
  return (result as ClientRecord[]).sort((a, b) => a.name.localeCompare(b.name));
}

export async function setMeta(key: string, value: MetaValue) {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  const transaction = db.transaction(META_STORE, 'readwrite');
  transaction.objectStore(META_STORE).put({ key, value });
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Falha ao salvar metadado'));
  });
  db.close();
}

export async function getMeta<T extends MetaValue>(key: string): Promise<T | null> {
  if (!hasIndexedDb()) return null;
  const db = await openDb();
  const transaction = db.transaction(META_STORE, 'readonly');
  const store = transaction.objectStore(META_STORE);
  const result = await requestToPromise(store.get(key));
  db.close();
  return (result?.value as T) ?? null;
}