'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AREAS, CLIENT_TYPES, CONSULTORES, SERVICE_TYPES } from '@/types/portal';
import type { Visit } from '@/types/portal';
import { saveVisitOfflineFirst } from '@/lib/offline/sync';

const initialForm: Partial<Visit> = {
  client_name: '',
  herd_size: null,
  client_type: 'B',
  service_type: 'Prospec',
  area: '',
  consultant: '',
  deal_closed: false,
  doses_convencional: null,
  doses_sexado: null,
  notes: '',
  date: new Date().toISOString().slice(0, 10),
};

interface Props {
  onSaved?: (result: { offline: boolean }) => void;
}

export function MobileVisitForm({ onSaved }: Props) {
  const { session } = useAuth();
  const [form, setForm] = useState<Partial<Visit>>(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const consultores = useMemo(() => {
    if (!form.area) return [];
    return CONSULTORES[form.area] || [];
  }, [form.area]);

  function update<K extends keyof Visit>(key: K, value: Visit[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    if (!form.client_name || !form.area || !form.service_type) {
      setError('Preencha propriedade, área e serviço.');
      setSaving(false);
      return;
    }

    const result = await saveVisitOfflineFirst({
      ...form,
      technician_name: session?.name || 'Gestor',
    });

    setSaving(false);
    setForm({
      ...initialForm,
      area: form.area,
      consultant: '',
      technician_name: session?.name || 'Gestor',
    });
    setMessage(result.offline ? 'Visita salva offline e pendente de sincronização.' : 'Visita salva e sincronizada com sucesso.');
    onSaved?.({ offline: result.offline });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Propriedade visitada *</label>
          <input value={form.client_name || ''} onChange={(event) => update('client_name', event.target.value)} className="field-input" placeholder="Nome da propriedade" />
        </div>

        <div>
          <label className="field-label">Nº rebanho</label>
          <input type="number" min={0} value={form.herd_size ?? ''} onChange={(event) => update('herd_size', event.target.value ? Number(event.target.value) : null)} className="field-input" placeholder="0" />
        </div>

        <div>
          <label className="field-label">Área *</label>
          <select value={form.area || ''} onChange={(event) => update('area', event.target.value)} className="field-input">
            <option value="">Selecione</option>
            {AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Tipo de cliente</label>
          <div className="flex flex-wrap gap-2">
            {CLIENT_TYPES.map((type) => (
              <button key={type} type="button" onClick={() => update('client_type', type)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${form.client_type === type ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Serviço</label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((service) => (
              <button key={service} type="button" onClick={() => update('service_type', service)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${form.service_type === service ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
                {service}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Consultor</label>
          <select value={form.consultant || ''} onChange={(event) => update('consultant', event.target.value)} className="field-input">
            <option value="">Selecione</option>
            {consultores.map((consultor) => <option key={consultor} value={consultor}>{consultor}</option>)}
          </select>
        </div>

        <div>
          <label className="field-label">Data</label>
          <input type="date" value={form.date || ''} onChange={(event) => update('date', event.target.value)} className="field-input" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 sm:col-span-2">
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-gray-700">
            Negócio fechado
            <input type="checkbox" checked={Boolean(form.deal_closed)} onChange={(event) => update('deal_closed', event.target.checked)} className="h-5 w-5 accent-primary" />
          </label>
        </div>

        <div>
          <label className="field-label">Doses convencional</label>
          <input type="number" min={0} value={form.doses_convencional ?? ''} onChange={(event) => update('doses_convencional', event.target.value ? Number(event.target.value) : null)} className="field-input" placeholder="0" />
        </div>

        <div>
          <label className="field-label">Doses sexado</label>
          <input type="number" min={0} value={form.doses_sexado ?? ''} onChange={(event) => update('doses_sexado', event.target.value ? Number(event.target.value) : null)} className="field-input" placeholder="0" />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Observações</label>
          <textarea value={form.notes || ''} onChange={(event) => update('notes', event.target.value)} className="field-input min-h-28 resize-y" placeholder="Detalhes da visita" />
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
        {saving ? 'Salvando...' : 'Salvar visita'}
      </button>
    </form>
  );
}