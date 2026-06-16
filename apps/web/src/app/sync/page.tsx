'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { OfflineStatusCard } from '@/components/mobile/OfflineStatusCard';
import { getPendingVisits } from '@/lib/offline/storage';
import { getLastSync, registerOnlineSync, syncPendingVisits } from '@/lib/offline/sync';
import type { Visit } from '@/types/portal';

export default function SyncPage() {
  const [pending, setPending] = useState<Visit[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  async function refresh() {
    const [pendingVisits, syncAt] = await Promise.all([getPendingVisits(), getLastSync('visits')]);
    setPending(pendingVisits);
    setLastSync(syncAt);
  }

  useEffect(() => {
    refresh();
    const unregister = registerOnlineSync(refresh);
    return unregister;
  }, []);

  async function handleSync() {
    setSyncing(true);
    setMessage('');
    const result = await syncPendingVisits();
    await refresh();
    setSyncing(false);
    setMessage(result.failed.length > 0 ? `${result.synced.length} visita(s) sincronizada(s), ${result.failed.length} com erro.` : `${result.synced.length} visita(s) sincronizada(s) com sucesso.`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sincronização offline</h1>
          <p className="text-sm text-gray-500">
            Gerencie as visitas salvas localmente e envie para o Supabase quando houver conexão.
          </p>
        </div>

        <OfflineStatusCard online={typeof navigator !== 'undefined' ? navigator.onLine : true} pendingCount={pending.length} lastSync={lastSync} />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Fila pendente</h2>
              <p className="text-sm text-gray-500">As visitas abaixo serão enviadas assim que a sincronização for executada online.</p>
            </div>
            <button onClick={handleSync} disabled={syncing || (typeof navigator !== 'undefined' && !navigator.onLine)} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
              {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          </div>

          {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

          <div className="mt-5 space-y-3">
            {pending.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Nenhuma visita pendente no momento.
              </div>
            ) : (
              pending.map((visit) => (
                <article key={visit.local_id || visit.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">{visit.client_name}</h3>
                      <p className="text-sm text-gray-600">{visit.service_type} • Área {visit.area || '—'}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pendente
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <p><span className="font-medium text-gray-700">Técnico:</span> {visit.technician_name}</p>
                    <p><span className="font-medium text-gray-700">Data:</span> {visit.date}</p>
                    <p><span className="font-medium text-gray-700">Consultor:</span> {visit.consultant || '—'}</p>
                    <p><span className="font-medium text-gray-700">Negócio fechado:</span> {visit.deal_closed ? 'Sim' : 'Não'}</p>
                  </div>
                  {visit.sync_error && <p className="mt-3 text-sm text-red-600">Último erro: {visit.sync_error}</p>}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}