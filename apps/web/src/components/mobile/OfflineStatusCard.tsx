'use client';

interface Props {
  online: boolean;
  pendingCount?: number;
  lastSync?: string | null;
}

export function OfflineStatusCard({ online, pendingCount = 0, lastSync }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Status de sincronização</p>
          <p className="text-xs text-gray-500">
            {online ? 'Online — dados podem ser sincronizados agora.' : 'Offline — alterações serão guardadas localmente.'}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pendências</p>
          <p className="mt-1 text-2xl font-bold text-primary">{pendingCount}</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Última sincronização</p>
          <p className="mt-1 text-sm font-semibold text-gray-700">{lastSync || 'Ainda não sincronizado'}</p>
        </div>
      </div>
    </div>
  );
}