'use client';

import { useAuth } from '@/hooks/useAuth';
import { preloadOfflineData } from '@/lib/offline/sync';
import { Sidebar } from './Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [preloading, setPreloading] = useState(false);

  useEffect(() => {
    if (ready && !session && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [ready, session, router]);

  useEffect(() => {
    if (!ready || !session || typeof window === 'undefined' || !navigator.onLine) {
      return;
    }

    let active = true;

    const runPreload = async () => {
      setPreloading(true);
      try {
        await preloadOfflineData();
      } finally {
        if (active) {
          setPreloading(false);
        }
      }
    };

    runPreload();
    return () => {
      active = false;
    };
  }, [ready, session]);

  // Aguarda checagem do localStorage antes de qualquer decisão
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session?.name} />
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
          {preloading && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Sincronizando dados...
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
