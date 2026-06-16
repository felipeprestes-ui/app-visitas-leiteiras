'use client';

import { fetchClients, fetchSchedule, fetchUsers, fetchVisits, upsertVisit } from '@/lib/supabase';
import type { ClientRecord, ScheduleItem, TechUser, Visit } from '@/types/portal';
import {
  cacheClients,
  cacheSchedule,
  cacheTechnicians,
  cacheVisits,
  getCachedClients,
  getCachedSchedule,
  getCachedTechnicians,
  getCachedVisits,
  getMeta,
  getPendingVisits,
  isOffline,
  queuePendingVisit,
  removePendingVisit,
  setMeta,
} from './storage';

export interface SyncResult {
  synced: Visit[];
  failed: Visit[];
}

export interface OfflineFirstResult<T> {
  items: T[];
  fromCache: boolean;
  syncing: boolean;
}

export interface PreloadResult {
  visits: Visit[];
  schedule: ScheduleItem[];
  technicians: TechUser[];
  clients: ClientRecord[];
}

export async function loadVisitsOfflineFirst(technicianName?: string): Promise<OfflineFirstResult<Visit>> {
  const cached = await getCachedVisits();
  const filteredCached = technicianName
    ? cached.filter((visit) => visit.technician_name === technicianName)
    : cached;
  if (isOffline()) {
    return { items: filteredCached, fromCache: true, syncing: false };
  }

  const remote = await fetchVisits({
    limit: '2000',
    ...(technicianName ? { techName: `eq.${encodeURIComponent(technicianName)}` } : {}),
  });
  if (remote.length > 0) {
    await cacheVisits(remote);
    await setMeta('visits-last-sync', new Date().toISOString());
    return { items: remote, fromCache: false, syncing: false };
  }

  return { items: filteredCached, fromCache: true, syncing: false };
}

export async function saveVisitOfflineFirst(payload: Partial<Visit>): Promise<{ ok: boolean; offline: boolean; visit: Visit }> {
  const visit: Visit = {
    id: payload.id || payload.local_id || crypto.randomUUID?.() || `visit-${Date.now()}`,
    technician_name: payload.technician_name || '',
    client_name: payload.client_name || '',
    service_type: payload.service_type || '',
    area: payload.area || '',
    client_type: payload.client_type || '',
    animals: payload.animals ?? null,
    deal_closed: Boolean(payload.deal_closed),
    herd_size: payload.herd_size ?? null,
    consultant: payload.consultant || null,
    notes: payload.notes || '',
    date: payload.date || new Date().toISOString().slice(0, 10),
    doses_convencional: payload.doses_convencional ?? null,
    doses_sexado: payload.doses_sexado ?? null,
    local_id: payload.local_id || crypto.randomUUID?.() || `local-${Date.now()}`,
    pending_sync: false,
    sync_error: null,
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
  };

  if (isOffline()) {
    await queuePendingVisit(visit);
    return { ok: true, offline: true, visit: { ...visit, pending_sync: true } };
  }

  const response = await upsertVisit(visit);
  if (!response.ok) {
    await queuePendingVisit({ ...visit, sync_error: response.error || 'Falha ao sincronizar' });
    return { ok: true, offline: true, visit: { ...visit, pending_sync: true, sync_error: response.error || null } };
  }

  const refreshed = await loadVisitsOfflineFirst(visit.technician_name);
  return { ok: true, offline: false, visit: response.data || refreshed.items[0] || visit };
}

export async function syncPendingVisits(): Promise<SyncResult> {
  const pending = await getPendingVisits();
  if (pending.length === 0 || isOffline()) {
    return { synced: [], failed: pending };
  }

  const synced: Visit[] = [];
  const failed: Visit[] = [];

  for (const visit of pending) {
    const response = await upsertVisit({ ...visit, id: undefined });
    if (response.ok) {
      synced.push(visit);
      if (visit.local_id) {
        await removePendingVisit(visit.local_id);
      }
    } else {
      failed.push({ ...visit, sync_error: response.error || 'Falha ao sincronizar' });
    }
  }

  const remote = await fetchVisits({ limit: '2000' });
  if (remote.length > 0) {
    await cacheVisits(remote);
  }
  await setMeta('visits-last-sync', new Date().toISOString());

  return { synced, failed };
}

export async function loadScheduleOfflineFirst(technicianName?: string): Promise<OfflineFirstResult<ScheduleItem>> {
  const cached = await getCachedSchedule();
  if (isOffline()) {
    return {
      items: technicianName ? cached.filter((item) => item.technician_name === technicianName) : cached,
      fromCache: true,
      syncing: false,
    };
  }

  const remote = await fetchSchedule(technicianName ? { technician_name: `eq.${encodeURIComponent(technicianName)}` } : {});
  if (remote.length > 0) {
    await cacheSchedule(remote);
    await setMeta('schedule-last-sync', new Date().toISOString());
    return { items: remote, fromCache: false, syncing: false };
  }

  return {
    items: technicianName ? cached.filter((item) => item.technician_name === technicianName) : cached,
    fromCache: true,
    syncing: false,
  };
}

export async function loadTechniciansOfflineFirst(): Promise<OfflineFirstResult<TechUser>> {
  const cached = await getCachedTechnicians();
  if (isOffline()) {
    return { items: cached, fromCache: true, syncing: false };
  }

  const remote = await fetchUsers();
  if (remote.length > 0) {
    await cacheTechnicians(remote);
    await setMeta('technicians-last-sync', new Date().toISOString());
    return { items: remote, fromCache: false, syncing: false };
  }

  return { items: cached, fromCache: true, syncing: false };
}

export async function loadClientsOfflineFirst(): Promise<OfflineFirstResult<ClientRecord>> {
  const cached = await getCachedClients();
  if (isOffline()) {
    return { items: cached, fromCache: true, syncing: false };
  }

  const remote = await fetchClients();
  if (remote.length > 0) {
    await cacheClients(remote);
    await setMeta('clients-last-sync', new Date().toISOString());
    return { items: remote, fromCache: false, syncing: false };
  }

  return { items: cached, fromCache: true, syncing: false };
}

export async function preloadOfflineData(technicianName?: string): Promise<PreloadResult> {
  const [visitsResult, scheduleResult, techniciansResult, clientsResult] = await Promise.all([
    loadVisitsOfflineFirst(technicianName),
    loadScheduleOfflineFirst(technicianName),
    loadTechniciansOfflineFirst(),
    loadClientsOfflineFirst(),
  ]);

  return {
    visits: visitsResult.items,
    schedule: scheduleResult.items,
    technicians: techniciansResult.items,
    clients: clientsResult.items,
  };
}

export async function getLastSync(type: 'visits' | 'schedule') {
  return getMeta<string>(`${type}-last-sync`);
}

export function registerOnlineSync(callback?: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const handler = async () => {
    await syncPendingVisits();
    callback?.();
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}