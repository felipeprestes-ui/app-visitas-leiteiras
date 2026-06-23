'use client';

import { deleteSchedule, deleteVisit, fetchClients, fetchSchedule, fetchUsers, fetchVisits, upsertSchedule, upsertVisit } from '@/lib/supabase';
import type { ApiResult } from '@/lib/supabase';
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
  getPendingSchedule,
  getPendingVisits,
  isOffline,
  queuePendingSchedule,
  queuePendingVisit,
  removeCachedSchedule,
  removeCachedVisit,
  removePendingSchedule,
  removePendingVisit,
  removeScheduleEverywhere,
  removeVisitEverywhere,
  setMeta,
  upsertCachedSchedule,
} from './storage';

export interface SyncResult {
  synced: Visit[];
  failed: Visit[];
}

export interface ScheduleSyncResult {
  synced: ScheduleItem[];
  failed: ScheduleItem[];
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

export async function loadVisitsOfflineFirst(technicianName?: string, options?: { allTechnicians?: boolean }): Promise<OfflineFirstResult<Visit>> {
  function normalizeTechnicianName(name: string) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  const cached = await getCachedVisits();
  const shouldFilterByTechnician = Boolean(technicianName && !options?.allTechnicians);
  const normalizedTechName = shouldFilterByTechnician ? normalizeTechnicianName(technicianName) : null;
  const filteredCached = shouldFilterByTechnician
    ? cached.filter((visit) => {
        const visitName = normalizeTechnicianName(visit.technician_name || '');
        return visitName === normalizedTechName || normalizedTechName!.startsWith(visitName) || visitName.startsWith(normalizedTechName!);
      })
    : cached;
  if (isOffline()) {
    return { items: filteredCached, fromCache: true, syncing: false };
  }

  const remote = await fetchVisits({
    limit: '2000',
  });
  await cacheVisits(remote);
  await setMeta('visits-last-sync', new Date().toISOString());
  const filteredRemote = shouldFilterByTechnician
    ? remote.filter((visit) => {
        const visitName = normalizeTechnicianName(visit.technician_name || '');
        return visitName === normalizedTechName || normalizedTechName!.startsWith(visitName) || visitName.startsWith(normalizedTechName!);
      })
    : remote;
  return {
    items: filteredRemote,
    fromCache: false,
    syncing: false,
  };
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
    city: payload.city || null,
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
    // Também salva no cache local para aparecer na lista imediatamente
    const cached = await getCachedVisits();
    await cacheVisits([visit, ...cached]);
    return { ok: true, offline: true, visit: { ...visit, pending_sync: true } };
  }

  const response = await upsertVisit(visit);
  if (!response.ok) {
    await queuePendingVisit({ ...visit, sync_error: response.error || 'Falha ao sincronizar' });
    // Também salva no cache local para aparecer na lista mesmo com erro
    const cached = await getCachedVisits();
    await cacheVisits([{ ...visit, pending_sync: true, sync_error: response.error || null }, ...cached]);
    return { ok: true, offline: true, visit: { ...visit, pending_sync: true, sync_error: response.error || null } };
  }

  // Se o Supabase retornou a visita criada, usa ela. Senão, usa a visita original
  const returnedVisit = response.data || visit;
  
  // Garante que a visita tenha um id antes de salvar no cache
  const visitWithId = {
    ...returnedVisit,
    id: returnedVisit.id || crypto.randomUUID?.() || `${Date.now()}`,
    local_id: returnedVisit.local_id || crypto.randomUUID?.() || `${Date.now()}`,
    pending_sync: false,
    sync_error: null,
  };
  
  // Atualiza o cache com a nova visita
  const cached = await getCachedVisits();
  const updatedCache = [visitWithId, ...cached.filter((v) => v.id !== visitWithId.id && v.local_id !== visitWithId.local_id)];
  await cacheVisits(updatedCache);
  
  return { ok: true, offline: false, visit: visitWithId };
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
  await cacheVisits(remote);
  await setMeta('visits-last-sync', new Date().toISOString());

  return { synced, failed };
}

export async function loadScheduleOfflineFirst(technicianName?: string): Promise<OfflineFirstResult<ScheduleItem>> {
  function matchesTech(itemName?: string | null) {
    if (!technicianName || !itemName) return !technicianName;
    const a = itemName.trim().toLowerCase();
    const b = technicianName.trim().toLowerCase();
    return a === b || a.startsWith(b) || b.startsWith(a);
  }
  const cached = await getCachedSchedule();
  if (isOffline()) {
    return {
      items: technicianName ? cached.filter((item) => matchesTech(item.technician_name)) : cached,
      fromCache: true,
      syncing: false,
    };
  }

  const remote = await fetchSchedule({ limit: '2000' });
  await cacheSchedule(remote);
  await setMeta('schedule-last-sync', new Date().toISOString());
  return {
    items: technicianName
      ? remote.filter((item) => matchesTech(item.technician_name))
      : remote,
    fromCache: false,
    syncing: false,
  };
}

export async function saveScheduleOfflineFirst(payload: Partial<ScheduleItem>): Promise<{ ok: boolean; offline: boolean; schedule: ScheduleItem }> {
  const schedule: ScheduleItem = {
    id: payload.id || payload.local_id || crypto.randomUUID?.() || `schedule-${Date.now()}`,
    technician_name: payload.technician_name || '',
    title: payload.title || 'Agendamento',
    property_name: payload.property_name || '',
    scheduled_date: payload.scheduled_date || new Date().toISOString(),
    area: payload.area || '',
    consultant: payload.consultant || '',
    city: payload.city || '',
    notes: payload.notes || '',
    local_id: payload.local_id || crypto.randomUUID?.() || `schedule-local-${Date.now()}`,
    pending_sync: false,
    sync_error: null,
  };

  if (isOffline()) {
    await queuePendingSchedule(schedule);
    // Também salva no cache local para aparecer na lista imediatamente
    await upsertCachedSchedule({ ...schedule, pending_sync: true });
    return { ok: true, offline: true, schedule: { ...schedule, pending_sync: true } };
  }

  const response = await upsertSchedule(schedule);
  if (!response.ok) {
    await queuePendingSchedule({ ...schedule, sync_error: response.error || 'Falha ao sincronizar' });
    // Também salva no cache local para aparecer na lista mesmo com erro
    await upsertCachedSchedule({ ...schedule, pending_sync: true, sync_error: response.error || null });
    return { ok: true, offline: true, schedule: { ...schedule, pending_sync: true, sync_error: response.error || null } };
  }

  const returned = Array.isArray(response.data) ? response.data[0] || schedule : (response.data || schedule);
  const normalized: ScheduleItem = {
    ...schedule,
    ...returned,
    id: returned.id || schedule.id,
    local_id: returned.local_id || schedule.local_id,
    pending_sync: false,
    sync_error: null,
  };
  await upsertCachedSchedule(normalized);
  await setMeta('schedule-last-sync', new Date().toISOString());
  return { ok: true, offline: false, schedule: normalized };
}

export async function syncPendingSchedule(): Promise<ScheduleSyncResult> {
  const pending = await getPendingSchedule();
  if (pending.length === 0 || isOffline()) {
    return { synced: [], failed: pending };
  }

  const synced: ScheduleItem[] = [];
  const failed: ScheduleItem[] = [];

  for (const item of pending) {
    const response = await upsertSchedule({ ...item, id: undefined });
    if (response.ok) {
      synced.push(item);
      if (item.local_id) {
        await removePendingSchedule(item.local_id);
      }
    } else {
      failed.push({ ...item, sync_error: response.error || 'Falha ao sincronizar' });
      await upsertCachedSchedule({ ...item, pending_sync: true, sync_error: response.error || 'Falha ao sincronizar' });
    }
  }

  const remote = await fetchSchedule({ limit: '2000' });
  await cacheSchedule(remote);
  await setMeta('schedule-last-sync', new Date().toISOString());
  return { synced, failed };
}

export async function loadTechniciansOfflineFirst(): Promise<OfflineFirstResult<TechUser>> {
  const cached = await getCachedTechnicians();
  if (isOffline()) {
    return { items: cached, fromCache: true, syncing: false };
  }

  const remote = await fetchUsers();
  const techs = remote.filter((u) => u.role === 'tecnico' || u.role === 'gestor');
  if (techs.length > 0) {
    await cacheTechnicians(techs);
    await setMeta('technicians-last-sync', new Date().toISOString());
    return { items: techs, fromCache: false, syncing: false };
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

export async function deleteVisitOfflineFirst(visit: Visit): Promise<ApiResult> {
  const hasServerId = Boolean(visit.id);

  if (!hasServerId || isOffline()) {
    await removeVisitEverywhere(visit);
    return { ok: true };
  }

  const response = await deleteVisit(visit.id);
  if (!response.ok) {
    return response;
  }

  await removeCachedVisit(visit.id);
  if (visit.local_id) {
    await removePendingVisit(visit.local_id);
  }
  return response;
}

export async function getLastSync(type: 'visits' | 'schedule') {
  return getMeta<string>(`${type}-last-sync`);
}

export function registerOnlineSync(callback?: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const handler = async () => {
    await syncPendingVisits();
    await syncPendingSchedule();
    callback?.();
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

export async function deleteScheduleOfflineFirst(item: ScheduleItem): Promise<ApiResult> {
  const hasServerId = Boolean(item.id && !String(item.id).startsWith('schedule-local-'));

  if (!hasServerId || isOffline()) {
    await removeScheduleEverywhere(item);
    return { ok: true };
  }

  const response = await deleteSchedule(item.id);
  if (!response.ok) {
    return response;
  }

  await removeCachedSchedule(item.id);
  if (item.local_id) {
    await removePendingSchedule(item.local_id);
  }
  return response;
}