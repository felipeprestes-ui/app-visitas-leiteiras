'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!session && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [session, router]);

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
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
