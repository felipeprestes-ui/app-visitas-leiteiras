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
import { AREAS, SERVICE_TYPES } from '@/types/portal';

function normalizeTechnicianName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
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
  const [editTarget, setEditTarget] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<Partial<ScheduleItem>>({
    technician_name: '',
    title: '',
    property_name: '',
    scheduled_date: '',
    area: '',
    notes: '',
  });

  const isTechnician = session?.role === 'tecnico';

  function resetForm(target?: ScheduleItem | null) {
    setForm(target ? {
      id: target.id,
      local_id: target.local_id,
      technician_name: target.technician_name,
      title: target.title,
      property_name: target.property_name,
      scheduled_date: target.scheduled_date ? target.scheduled_date.slice(0, 16) : '',
      area: target.area,
      notes: target.notes,
    } : {
      technician_name: isTechnician ? session?.name || '' : '',
      title: '',
      property_name: '',
      scheduled_date: '',
      area: '',
      notes: '',
    });
    setError('');
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const techFilter = session?.role === 'tecnico' && session?.name ? session.name : undefined;
      const [scheduleResult, pending, syncAt, techniciansResult, clientsResult] = await Promise.all([
        loadScheduleOfflineFirst(techFilter),
        getPendingSchedule(),
        getLastSync('schedule'),
        loadTechniciansOfflineFirst(),
        loadClientsOfflineFirst(),
      ]);

      if (!active) return;
      setItems(scheduleResult.items);
      setFromCache(scheduleResult.fromCache);
      setSyncingData(scheduleResult.fromCache && typeof navigator !== 'undefined' && navigator.onLine);
      setPendingCount(pending.length);
      setLastSync(syncAt);
      setTechnicians(techniciansResult.items);
      setClients(clientsResult.items);
      setLoading(false);
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
    for (const item of items) {
      const label = item.technician_name?.trim();
      if (!label) continue;
      const normalized = normalizeTechnicianName(label);
      if (!map.has(normalized)) map.set(normalized, label);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
      .map(([value, label]) => ({ value, label }));
  }, [items, technicians]);

  const clientOptions = useMemo(() => {
    return [...clients]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((client) => ({ value: client.name, label: client.name, area: client.area || '' }));
  }, [clients]);

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
    setModalOpen(true);
  }

  function openEdit(item: ScheduleItem) {
    setEditTarget(item);
    resetForm(item);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.technician_name || !form.title || !form.property_name || !form.scheduled_date) {
      setError('Preencha técnico, título, propriedade e data.');
      return;
    }
    setSaving(true);
    setError('');
    const payload: Partial<ScheduleItem> = {
      ...form,
      area: form.area ? String(form.area).trim().padStart(3, '0') : '',
      scheduled_date: form.scheduled_date?.includes('T') ? form.scheduled_date : `${form.scheduled_date}:00`,
    };
    const result = await saveScheduleOfflineFirst(payload);
    setSaving(false);
    if (!result.ok) {
      setError('Erro ao salvar agendamento.');
      return;
    }
    setModalOpen(false);
    await reload();
  }

  async function handleDelete(item: ScheduleItem) {
    const confirmed = typeof window === 'undefined' ? true : window.confirm(`Excluir agendamento de ${item.property_name || item.title}?`);
    if (!confirmed) return;
    const result = await deleteScheduleOfflineFirst(item);
    if (!result.ok) {
      setError(result.error || 'Erro ao excluir agendamento.');
      return;
    }
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
          {syncingData && <p className="mb-4 text-sm text-blue-700">Sincronizando dados...</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Carregando agenda...</p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              {fromCache ? 'Nenhum agendamento encontrado no cache local.' : 'Nenhum agendamento encontrado no Supabase.'}
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([date, dayItems]) => (
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
                            <h3 className="text-base font-semibold text-gray-800">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.property_name || 'Propriedade não informada'}</p>
                            <p className="text-sm text-gray-500">{item.technician_name || 'Técnico não informado'}</p>
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
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{editTarget ? 'Editar agendamento' : 'Novo agendamento'}</h2>
                  <p className="text-sm text-gray-500">Salva localmente offline e sincroniza com o Supabase quando houver conexão.</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Fechar</button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-700">
                  <span>Técnico</span>
                  <select
                    value={form.technician_name || ''}
                    disabled={isTechnician}
                    onChange={(event) => setForm((current) => ({ ...current, technician_name: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione</option>
                    {technicianOptions.map((option) => (
                      <option key={option.value} value={option.label}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span>Título</span>
                  <select
                    value={form.title || ''}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione</option>
                    {SERVICE_TYPES.map((service) => (
                      <option key={service} value={service}>{service}</option>
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
                      const matched = clientOptions.find((client) => client.value === value);
                      setForm((current) => ({ ...current, property_name: value, area: current.area || matched?.area || '' }));
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
                  <span>Data e hora</span>
                  <input
                    type="datetime-local"
                    value={form.scheduled_date || ''}
                    onChange={(event) => setForm((current) => ({ ...current, scheduled_date: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>

                <label className="space-y-1 text-sm text-gray-700">
                  <span>Área</span>
                  <select
                    value={form.area || ''}
                    onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione</option>
                    {AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-gray-700 sm:col-span-2">
                  <span>Observações</span>
                  <textarea
                    value={form.notes || ''}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Detalhes do agendamento"
                  />
                </label>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setModalOpen(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar agendamento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}