'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OfflineStatusCard } from '@/components/mobile/OfflineStatusCard';
import { useAuth } from '@/hooks/useAuth';
import { getPendingSchedule } from '@/lib/offline/storage';
import { deleteScheduleOfflineFirst, getLastSync, loadClientsOfflineFirst, loadScheduleOfflineFirst, loadTechniciansOfflineFirst, registerOnlineSync, saveScheduleOfflineFirst } from '@/lib/offline/sync';
import type { ClientRecord, ScheduleItem, TechUser } from '@/types/portal';
import { AREAS, CONSULTORES } from '@/types/portal';

function normalizeTechnicianName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  const normalized = value?.trim();
  if (!normalized) return '';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

export default function AgendaPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [technicians, setTechnicians] = useState<TechUser[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncingData, setSyncingData] = useState(false);
  const [filterTech, setFilterTech] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editTarget, setEditTarget] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<Partial<ScheduleItem>>({
    technician_name: '',
    property_name: '',
    scheduled_date: '',
    area: '',
    consultant: '',
    city: '',
    notes: '',
  });

  const isTechnician = session?.role === 'tecnico';

  function resetForm(target?: ScheduleItem | null) {
    setForm(target ? {
      id: target.id,
      local_id: target.local_id,
      technician_name: target.technician_name,
      property_name: target.property_name,
      scheduled_date: toDateTimeLocalValue(target.scheduled_date),
      area: target.area,
      consultant: target.consultant || '',
      city: target.city || '',
      notes: target.notes,
    } : {
      technician_name: isTechnician ? session?.name || '' : '',
      property_name: '',
      scheduled_date: '',
      area: '',
      consultant: '',
      city: '',
      notes: '',
    });
    setError('');
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const techFilter = session?.role === 'tecnico' && session?.name ? session.name : undefined;
        const [scheduleResult, pending, syncAt, techniciansResult, clientsResult] = await Promise.all([
          loadScheduleOfflineFirst(techFilter).catch(() => ({ items: [] as ScheduleItem[], fromCache: true, syncing: false })),
          getPendingSchedule().catch(() => [] as ScheduleItem[]),
          getLastSync('schedule').catch(() => null),
          loadTechniciansOfflineFirst().catch(() => ({ items: [] as TechUser[], fromCache: true, syncing: false })),
          loadClientsOfflineFirst().catch(() => ({ items: [] as ClientRecord[], fromCache: true, syncing: false })),
        ]);

        if (!active) return;
        setItems(scheduleResult.items);
        setFromCache(scheduleResult.fromCache);
        setSyncingData(scheduleResult.fromCache && typeof navigator !== 'undefined' && navigator.onLine);
        setPendingCount(pending.length);
        setLastSync(syncAt);
        setTechnicians(techniciansResult.items);
        setClients(clientsResult.items);
      } catch (err) {
        console.error('Agenda load error:', err);
        if (active) setError('Erro ao carregar agenda.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const unregister = registerOnlineSync(load);
    return () => {
      active = false;
      unregister();
    };
  }, [session?.name, session?.role]);

  const grouped = useMemo(() => {
    const filteredItems = filterTech
      ? items.filter((item) => normalizeTechnicianName(item.technician_name || '') === filterTech)
      : items;

    return filteredItems.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
      const key = item.scheduled_date ? item.scheduled_date.slice(0, 10) : 'Sem data';
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items, filterTech]);

  const technicianOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const tech of technicians) {
      const label = tech.name?.trim();
      if (!label) continue;
      const normalized = normalizeTechnicianName(label);
      if (!map.has(normalized)) map.set(normalized, label);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[1] || '').localeCompare(b[1] || '', 'pt-BR'))
      .map(([value, label]) => ({ value, label }));
  }, [technicians]);

  const clientOptions = useMemo(() => {
    return [...clients]
      .filter((c) => c && c.name)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'))
      .map((client) => ({ value: client.name, label: client.name, area: client.area || '' }));
  }, [clients]);

  const filteredGroups = useMemo(() => {
    return Object.entries(grouped).filter(([, dayItems]) => dayItems.length > 0);
  }, [grouped]);

  async function reload() {
    const techFilter = session?.role === 'tecnico' && session?.name ? session.name : undefined;
    const [scheduleResult, pending, syncAt] = await Promise.all([
      loadScheduleOfflineFirst(techFilter),
      getPendingSchedule(),
      getLastSync('schedule'),
    ]);
    setItems(scheduleResult.items);
    setFromCache(scheduleResult.fromCache);
    setSyncingData(scheduleResult.fromCache && typeof navigator !== 'undefined' && navigator.onLine);
    setPendingCount(pending.length);
    setLastSync(syncAt);
  }

  function openNew() {
    setEditTarget(null);
    resetForm(null);
    setSuccessMessage('');
    setModalOpen(true);
  }

  function openEdit(item: ScheduleItem) {
    setEditTarget(item);
    resetForm(item);
    setSuccessMessage('');
    setModalOpen(true);
  }

  async function handleSave() {
    const technicianName = normalizeText(String(form.technician_name || ''));
    const propertyName = normalizeText(String(form.property_name || ''));
    const scheduledDate = toIsoDateTime(String(form.scheduled_date || ''));
    const area = String(form.area || '').trim();
    const consultant = String(form.consultant || '').trim();
    const city = String(form.city || '').trim();

    if (!technicianName || !propertyName || !scheduledDate || !area) {
      setError('Preencha técnico, propriedade, área e data.');
      return;
    }

    if (!AREAS.includes(area as (typeof AREAS)[number])) {
      setError('Selecione uma área válida.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const payload: Partial<ScheduleItem> = {
        ...form,
        technician_name: technicianName,
        property_name: propertyName,
        area,
        consultant,
        city,
        scheduled_date: scheduledDate,
        notes: String(form.notes || '').trim(),
      };
      const result = await saveScheduleOfflineFirst(payload);
      setSaving(false);
      if (!result.ok) {
        setError('Erro ao salvar agendamento.');
        return;
      }
      setModalOpen(false);
      setSuccessMessage(result.offline ? 'Agendamento salvo offline e pendente de sincronização.' : 'Agendamento salvo com sucesso.');
      await reload();
    } catch (err) {
      console.error('Save schedule error:', err);
      setSaving(false);
      setError('Erro inesperado ao salvar. Tente novamente.');
    }
  }

  async function handleDelete(item: ScheduleItem) {
    const confirmed = typeof window === 'undefined' ? true : window.confirm(`Excluir agendamento de ${item.property_name}?`);
    if (!confirmed) return;
    const result = await deleteScheduleOfflineFirst(item);
    if (!result.ok) {
      setError(result.error || 'Erro ao excluir agendamento.');
      return;
    }
    setSuccessMessage('Agendamento excluído com sucesso.');
    await reload();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
            <p className="text-sm text-gray-500">
              Exibe os agendamentos do Supabase com leitura local imediata e atualização em segundo plano.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            <CalendarPlus size={16} />
            Novo agendamento
          </button>
        </div>

        <OfflineStatusCard online={typeof navigator !== 'undefined' ? navigator.onLine : true} pendingCount={pendingCount} lastSync={lastSync} />

        {session?.role === 'gestor' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <select
              value={filterTech}
              onChange={(event) => setFilterTech(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-xs"
            >
              <option value="">Todos os técnicos</option>
              {technicianOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {successMessage && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}
          {syncingData && <p className="mb-4 text-sm text-blue-700">Sincronizando dados...</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Carregando agenda...</p>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              {filterTech
                ? 'Nenhum agendamento encontrado para o técnico selecionado.'
                : fromCache
                  ? 'Nenhum agendamento encontrado no cache local.'
                  : 'Nenhum agendamento encontrado no Supabase.'}
            </div>
          ) : (
            <div className="space-y-5">
              {filteredGroups.map(([date, dayItems]) => (
                <section key={date} className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                      {date === 'Sem data' ? date : format(new Date(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {dayItems.map((item) => (
                      <article key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-gray-800">{item.property_name || 'Propriedade não informada'}</h3>
                            <p className="text-sm text-gray-600">{item.technician_name || 'Técnico não informado'}</p>
                            {item.consultant && <p className="text-sm text-gray-500">{item.consultant}</p>}
                            {item.city && <p className="text-sm text-gray-500">{item.city}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                              Área {item.area || '—'}
                            </span>
                            <button onClick={() => openEdit(item)} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-100" aria-label="Editar agendamento">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(item)} className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50" aria-label="Excluir agendamento">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {item.notes && <p className="mt-3 text-sm text-gray-600">{item.notes}</p>}
                        {(item.pending_sync || item.sync_error) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.pending_sync && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Pendente de sincronização</span>}
                            {item.sync_error && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">{item.sync_error}</span>}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSave();
                }}
              >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{editTarget ? 'Editar agendamento' : 'Novo agendamento'}</h2>
                  <p className="text-sm text-gray-500">Salva localmente offline e sincroniza com o Supabase quando houver conexão.</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Fechar</button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-700">
                  <span>Técnico</span>
                  {isTechnician ? (
                    <input
                      value={session?.name || ''}
                      disabled
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2"
                    />
                  ) : (
                    <select
                      value={form.technician_name || ''}
                      onChange={(event) => setForm((current) => ({ ...current, technician_name: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Selecione</option>
                      {technicianOptions.map((option) => (
                        <option key={option.value} value={option.label}>{option.label}</option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span>Área</span>
                  <select
                    value={form.area || ''}
                    onChange={(event) => setForm((current) => ({ ...current, area: event.target.value, consultant: '' }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione</option>
                    {AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span>Consultor</span>
                  <select
                    value={form.consultant || ''}
                    onChange={(event) => setForm((current) => ({ ...current, consultant: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione</option>
                    {(form.area ? (CONSULTORES[form.area] || []) : []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span>Propriedade / cliente</span>
                  <input
                    list="agenda-client-options"
                    value={form.property_name || ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      const normalizedValue = normalizeText(value).toLowerCase();
                      const matched = clientOptions.find((client) => normalizeText(client.value).toLowerCase() === normalizedValue);
                      setForm((current) => ({
                        ...current,
                        property_name: value,
                        ...(matched?.area ? { area: matched.area } : {}),
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nome da propriedade"
                  />
                  <datalist id="agenda-client-options">
                    {clientOptions.map((client) => (
                      <option key={client.value} value={client.value} />
                    ))}
                  </datalist>
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span>Cidade</span>
                  <input
                    value={form.city || ''}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nome da cidade"
                  />
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span>Data e hora</span>
                  <input
                    type="datetime-local"
                    value={form.scheduled_date || ''}
                    onChange={(event) => setForm((current) => ({ ...current, scheduled_date: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>

                <label className="space-y-1 text-sm text-gray-700 sm:col-span-2">
                  <span>Observações</span>
                  <textarea
                    value={form.notes || ''}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Detalhes do agendamento"
                  />
                </label>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar agendamento'}
                </button>
              </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}



