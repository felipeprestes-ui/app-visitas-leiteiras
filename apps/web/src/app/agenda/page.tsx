'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import { OfflineStatusCard } from '@/components/mobile/OfflineStatusCard';
import { useAuth } from '@/hooks/useAuth';
import { getPendingVisits } from '@/lib/offline/storage';
import { getLastSync, loadScheduleOfflineFirst } from '@/lib/offline/sync';
import type { ScheduleItem } from '@/types/portal';

function normalizeTechnicianName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export default function AgendaPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncingData, setSyncingData] = useState(false);
  const [filterTech, setFilterTech] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const [scheduleResult, pending, syncAt] = await Promise.all([
        loadScheduleOfflineFirst(),
        getPendingVisits(),
        getLastSync('schedule'),
      ]);

      if (!active) return;
      setItems(scheduleResult.items);
      setFromCache(scheduleResult.fromCache);
      setSyncingData(scheduleResult.fromCache && typeof navigator !== 'undefined' && navigator.onLine);
      setPendingCount(pending.length);
      setLastSync(syncAt);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [session?.name]);

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
    for (const item of items) {
      const label = item.technician_name?.trim();
      if (!label) continue;
      const normalized = normalizeTechnicianName(label);
      if (!map.has(normalized)) map.set(normalized, label);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
      .map(([value, label]) => ({ value, label }));
  }, [items]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-sm text-gray-500">
            Exibe os agendamentos do Supabase com leitura local imediata e atualização em segundo plano.
          </p>
        </div>

        <OfflineStatusCard online={typeof navigator !== 'undefined' ? navigator.onLine : true} pendingCount={pendingCount} lastSync={lastSync} />

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

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
                          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                            Área {item.area || '—'}
                          </span>
                        </div>
                        {item.notes && <p className="mt-3 text-sm text-gray-600">{item.notes}</p>}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}