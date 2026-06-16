'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { VisitasClient } from './VisitasClient';

function VisitasContent() {
  const searchParams = useSearchParams();
  const initialNew = searchParams.get('new') === '1';
  return <VisitasClient initialNew={initialNew} />;
}

export default function VisitasPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <VisitasContent />
      </Suspense>
    </AppShell>
  );
}
