import { AppShell } from '@/components/layout/AppShell';
import { MobileVisitForm } from '@/components/mobile/MobileVisitForm';

export default function NovaVisitaPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nova visita</h1>
          <p className="text-sm text-gray-500">
            Registre visitas mesmo sem internet. Quando a conexão voltar, a sincronização poderá ser feita automaticamente ou pela tela de sync.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <MobileVisitForm />
        </div>
      </div>
    </AppShell>
  );
}