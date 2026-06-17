'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { fetchSales, upsertSale, deleteSale, fetchUsers } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { MonthlySale, TechUser } from '@/types/portal';
import { MONTHS } from '@/types/portal';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const CURRENT_MONTH = MONTHS[MONTHS.length - 1]?.value || '';

function normalizeMonthValue(value: string) {
  if (!value) return '';
  const trimmed = value.trim();
  const numericMatch = trimmed.match(/^(\d{1,2})-(\d{4})$/);
  if (numericMatch) {
    return `${Number(numericMatch[1])}-${numericMatch[2]}`;
  }
  const slashMatch = trimmed.match(/^([A-Za-zÀ-ÿ]{3})\/(\d{2,4})$/);
  if (slashMatch) {
    const monthMap: Record<string, number> = {
      jan: 0,
      fev: 1,
      mar: 2,
      abr: 3,
      mai: 4,
      jun: 5,
      jul: 6,
      ago: 7,
      set: 8,
      out: 9,
      nov: 10,
      dez: 11,
    };
    const monthIndex = monthMap[slashMatch[1].toLowerCase()];
    if (monthIndex !== undefined) {
      const year = slashMatch[2].length === 2 ? `20${slashMatch[2]}` : slashMatch[2];
      return `${monthIndex}-${year}`;
    }
  }
  return trimmed;
}

const emptyForm = (): Partial<MonthlySale> => ({
  technicianName: '',
  month: CURRENT_MONTH,
  dosesNovos: 0,
  dosesAtivos: 0,
  faturamentoNovos: 0,
  faturamentoAtivos: 0,
  meta: 0,
});

export function VendasClient({ initialNew }: { initialNew?: boolean }) {
  const [sales, setSales] = useState<MonthlySale[]>([]);
  const [filtered, setFiltered] = useState<MonthlySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [techs, setTechs] = useState<TechUser[]>([]);
  const [loadError, setLoadError] = useState('');

  const [filterMonth, setFilterMonth] = useState('');
  const [filterTech, setFilterTech] = useState('');

  const [modalOpen, setModalOpen] = useState(initialNew || false);
  const [editTarget, setEditTarget] = useState<MonthlySale | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonthlySale | null>(null);
  const [form, setForm] = useState<Partial<MonthlySale>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [s, users] = await Promise.all([fetchSales(), fetchUsers()]);
      setSales(s);
      setTechs(users);
    } catch (error) {
      setSales([]);
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar vendas.');
      const users = await fetchUsers();
      setTechs(users);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let list = [...sales];
    if (filterMonth) list = list.filter((s) => normalizeMonthValue(s.month) === normalizeMonthValue(filterMonth));
    if (filterTech) list = list.filter((s) =>
      s.technicianName?.toLowerCase().includes(filterTech.toLowerCase())
    );
    setFiltered(list);
  }, [sales, filterMonth, filterTech]);

  // KPI totals for filtered month
  const totDN = filtered.reduce((s, x) => s + (Number(x.dosesNovos) || 0), 0);
  const totDA = filtered.reduce((s, x) => s + (Number(x.dosesAtivos) || 0), 0);
  const totFN = filtered.reduce((s, x) => s + (Number(x.faturamentoNovos) || 0), 0);
  const totFA = filtered.reduce((s, x) => s + (Number(x.faturamentoAtivos) || 0), 0);
  const totMeta = filtered.reduce((s, x) => s + (Number(x.meta) || 0), 0);

  const techNames = Array.from(
    new Set([...sales.map((s) => s.technicianName), ...techs.map((t) => t.name)])
  ).filter(Boolean).sort();

  function openNew() {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(s: MonthlySale) {
    setEditTarget(s);
    setForm({ ...s });
    setFormError('');
    setModalOpen(true);
  }

  // Auto-fill meta when tech+month changes
  async function autoFillMeta(techName: string, month: string) {
    if (!techName || !month) return;
    const existing = sales.find((s) => s.technicianName === techName && normalizeMonthValue(s.month) === normalizeMonthValue(month));
    if (existing) {
      setForm((prev) => ({ ...prev, meta: existing.meta, id: existing.id }));
    }
  }

  async function handleSave() {
    if (!form.technicianName || !form.month) {
      setFormError('Preencha: técnico e mês.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload: Partial<MonthlySale> = {
      ...form,
      dosesNovos: Number(form.dosesNovos || 0),
      dosesAtivos: Number(form.dosesAtivos || 0),
      faturamentoNovos: Number(form.faturamentoNovos || 0),
      faturamentoAtivos: Number(form.faturamentoAtivos || 0),
      meta: Number(form.meta || 0),
      updatedBy: 'gestor',
    };
    const res = await upsertSale(payload);
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error || 'Erro ao salvar');
      return;
    }
    setModalOpen(false);
    await loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteSale(deleteTarget.id);
    setDeleteOpen(false);
    setDeleteTarget(null);
    await loadData();
  }

  const monthLabel = (v: string) => MONTHS.find((m) => normalizeMonthValue(m.value) === normalizeMonthValue(v))?.label || v;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Gerenciar Vendas / Metas</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-gold text-white text-sm px-4 py-2 rounded-lg hover:bg-gold-dark transition-colors"
        >
          <Plus size={16} /> Lançar Vendas do Mês
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap gap-3">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os meses</option>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <select
          value={filterTech}
          onChange={(e) => setFilterTech(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os técnicos</option>
          {techNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      {/* KPI totals */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Doses Novos', value: totDN },
            { label: 'Doses Ativos', value: totDA },
            { label: 'Fat. Novos', value: fmtBRL(totFN) },
            { label: 'Fat. Ativos', value: fmtBRL(totFA) },
            { label: 'Meta Total', value: totMeta },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex flex-col items-start">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold text-primary mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-light border-b border-gray-200">
                  {['Técnico', 'Mês', 'Doses Nov.', 'Doses At.', 'Fat. Nov.', 'Fat. At.', 'Meta', '% Meta', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">
                      Nenhum lançamento encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => {
                    const pct = s.meta > 0 ? Math.round((s.dosesNovos / s.meta) * 100) : 0;
                    return (
                      <tr key={s.id || i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-700">{s.technicianName}</td>
                        <td className="px-4 py-3 text-gray-500">{monthLabel(s.month)}</td>
                        <td className="px-4 py-3 text-right">{s.dosesNovos}</td>
                        <td className="px-4 py-3 text-right">{s.dosesAtivos}</td>
                        <td className="px-4 py-3 text-right">{fmtBRL(s.faturamentoNovos)}</td>
                        <td className="px-4 py-3 text-right">{fmtBRL(s.faturamentoAtivos)}</td>
                        <td className="px-4 py-3 text-right">{s.meta}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${pct >= 100 ? 'text-emerald-600' : pct >= 50 ? 'text-gold-dark' : 'text-red-500'}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(s)} className="p-1 rounded text-gray-400 hover:text-gold hover:bg-gold-light transition-colors" title="Editar">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => { setDeleteTarget(s); setDeleteOpen(true); }} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Lançamento' : 'Lançar Vendas do Mês'} size="md">
        {formError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{formError}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Técnico *</label>
            <select
              value={form.technicianName || ''}
              onChange={async (e) => {
                setForm({ ...form, technicianName: e.target.value });
                await autoFillMeta(e.target.value, form.month || '');
              }}
              className="field-input"
            >
              <option value="">Selecione</option>
              {techNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Mês *</label>
            <select
              value={form.month || ''}
              onChange={async (e) => {
                setForm({ ...form, month: e.target.value });
                await autoFillMeta(form.technicianName || '', e.target.value);
              }}
              className="field-input"
            >
              <option value="">Selecione</option>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {[
            { key: 'dosesNovos', label: 'Doses Novos' },
            { key: 'dosesAtivos', label: 'Doses Ativos' },
            { key: 'faturamentoNovos', label: 'Fat. Novos (R$)' },
            { key: 'faturamentoAtivos', label: 'Fat. Ativos (R$)' },
            { key: 'meta', label: 'Meta (doses)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input
                type="number"
                step={key.startsWith('fat') ? '0.01' : '1'}
                value={(form as Record<string, unknown>)[key] as number ?? 0}
                onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                min={0}
                className="field-input"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-gold text-white rounded-lg hover:bg-gold-dark disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando...' : editTarget ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir Lançamento"
        message={`Excluir o lançamento de "${deleteTarget?.technicianName}" em ${monthLabel(deleteTarget?.month || '')}?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
