'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { fetchUsers, upsertVisit } from '@/lib/supabase';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import type { Visit, TechUser } from '@/types/portal';
import { AREAS, CLIENT_TYPES, SERVICE_TYPES, CONSULTORES, MONTHS } from '@/types/portal';
import { getPendingVisits } from '@/lib/offline/storage';
import { deleteVisitOfflineFirst, loadVisitsOfflineFirst, registerOnlineSync } from '@/lib/offline/sync';
import { getSession } from '@/hooks/useAuth';

const PAGE_SIZE = 50;

function normalizeTechnicianName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeMonthValue(value: string) {
  if (!value) return '';
  const [month, year] = value.split('-');
  if (month === undefined || year === undefined) return value;
  return `${Number(month)}-${year}`;
}

function fmtDate(d: string) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
}

const emptyForm = (): Partial<Visit> => ({
  technician_name: '',
  client_name: '',
  city: '',
  service_type: '',
  area: '',
  client_type: '',
  animals: null,
  herd_size: null,
  deal_closed: false,
  consultant: '',
  notes: '',
  date: format(new Date(), 'yyyy-MM-dd'),
});

export function VisitasClient({ initialNew }: { initialNew?: boolean }) {
  const { session } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filtered, setFiltered] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [techList, setTechList] = useState<TechUser[]>([]);

  // Filters
  const [filterMonth, setFilterMonth] = useState('');
  const [filterTech, setFilterTech] = useState('');
  const [searchClient, setSearchClient] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(initialNew || false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Visit | null>(null);
  const [detailTarget, setDetailTarget] = useState<Visit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Visit | null>(null);
  const [form, setForm] = useState<Partial<Visit>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [syncingData, setSyncingData] = useState(false);

  const session = getSession();
  const userRole = session?.role || 'tecnico';
  const userName = session?.name || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    
    // Se for técnico, carrega apenas as próprias visitas
    const options = userRole === 'tecnico' ? undefined : { allTechnicians: true };
    const techFilter = userRole === 'tecnico' && userName ? userName : undefined;
    
    const [visitsResult, users, pending] = await Promise.all([
      loadVisitsOfflineFirst(techFilter, options),
      userRole === 'gestor' ? fetchUsers() : Promise.resolve([]),
      getPendingVisits(),
    ]);
    setVisits(visitsResult.items);
    setTechList(users);
    setPendingCount(pending.length);
    setSyncingData(visitsResult.fromCache && !visitsResult.syncing && typeof navigator !== 'undefined' && navigator.onLine);
    setLoading(false);
  }, [userRole, userName]);

  useEffect(() => {
    loadData();
    return registerOnlineSync(loadData);
  }, [loadData]);

  // Escuta evento de nova visita salva
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('visit-saved', handler);
    return () => window.removeEventListener('visit-saved', handler);
  }, [loadData]);

  // Apply filters
  useEffect(() => {
    let list = [...visits];
    if (filterMonth) {
      list = list.filter((v) => {
        if (!v.date) return false;
        const d = new Date(v.date);
        return normalizeMonthValue(`${d.getMonth()}-${d.getFullYear()}`) === normalizeMonthValue(filterMonth);
      });
    }
    if (filterTech) {
      list = list.filter((v) => normalizeTechnicianName(v.technician_name || '') === filterTech);
    }
    if (searchClient) {
      const q = searchClient.toLowerCase();
      list = list.filter((v) => v.client_name?.toLowerCase().includes(q));
    }
    setFiltered(list);
    setPage(1);
  }, [visits, filterMonth, filterTech, searchClient]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Unique technician names from loaded visits
  const techNames = Array.from(
    [...visits.map((v) => v.technician_name), ...techList.map((t) => t.name)].reduce((map, name) => {
      const label = name?.trim();
      if (!label) return map;
      const normalized = normalizeTechnicianName(label);
      if (!map.has(normalized)) map.set(normalized, label);
      return map;
    }, new Map<string, string>())
  ).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

  function openNew() {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(v: Visit) {
    setEditTarget(v);
    setForm({
      id: v.id,
      technician_name: v.technician_name,
      client_name: v.client_name,
      city: v.city,
      service_type: v.service_type,
      area: v.area,
      client_type: v.client_type,
      animals: v.animals,
      herd_size: v.herd_size,
      deal_closed: v.deal_closed,
      consultant: v.consultant,
      notes: v.notes,
      date: v.date ? v.date.substring(0, 10) : '',
      doses_convencional: v.doses_convencional,
      doses_sexado: v.doses_sexado,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.technician_name || !form.client_name || !form.date) {
      setFormError('Preencha: técnico, cliente e data.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload: Partial<Visit> = {
      ...form,
      animals: form.animals ? Number(form.animals) : null,
      herd_size: form.herd_size ? Number(form.herd_size) : null,
      deal_closed: Boolean(form.deal_closed),
    };
    const res = await upsertVisit(payload);
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
    const result = await deleteVisitOfflineFirst(deleteTarget);
    if (!result.ok) {
      setFormError(result.error || 'Erro ao excluir');
      return;
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
    await loadData();
  }

  const consultoresForArea = form.area ? (CONSULTORES[form.area] || []) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Gerenciar Visitas</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Nova Visita
        </button>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {pendingCount > 0
          ? `${pendingCount} visita(s) pendente(s) de sincronização offline.`
          : 'Todas as visitas locais estão sincronizadas.'}
      </div>

      {syncingData && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Sincronizando dados...
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os meses</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os técnicos</option>
            {techNames.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>

          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {filtered.length} visita{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-light border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Técnico</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden md:table-cell">Área</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden lg:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden lg:table-cell">Serviço</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden md:table-cell">Animais</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Fechado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">
                      Nenhuma visita encontrada
                    </td>
                  </tr>
                ) : (
                  pageData.map((v, i) => (
                    <tr
                      key={v.id || i}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => { setDetailTarget(v); setDetailOpen(true); }}
                    >
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDate(v.date)}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate" title={v.technician_name}>{v.technician_name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{v.area}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={v.client_name}>{v.client_name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{v.client_type}</td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell max-w-[120px] truncate" title={v.service_type}>{v.service_type}</td>
                      <td className="px-4 py-3 text-gray-500 text-center hidden md:table-cell">{v.animals ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {v.deal_closed ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Fechado" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300" title="Não fechado" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailTarget(v); setDetailOpen(true); }}
                            className="p-1 rounded text-gray-400 hover:text-primary hover:bg-primary-light transition-colors"
                            title="Detalhes"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(v); }}
                            className="p-1 rounded text-gray-400 hover:text-gold hover:bg-gold-light transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); setDeleteOpen(true); }}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </div>
      </div>

      {/* New/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar Visita' : 'Nova Visita'}
        size="lg"
      >
        {formError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Data *</label>
            <input
              type="date"
              value={form.date || ''}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="field-input"
            />
          </div>

          <div>
            <label className="field-label">Área</label>
            <select
              value={form.area || ''}
              onChange={(e) => setForm({ ...form, area: e.target.value, consultant: '' })}
              className="field-input"
            >
              <option value="">Selecione</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Consultor</label>
            <select
              value={form.consultant || ''}
              onChange={(e) => setForm({ ...form, consultant: e.target.value })}
              className="field-input"
            >
              <option value="">Selecione</option>
              {consultoresForArea.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Técnico *</label>
            <input
              list="tech-list"
              value={form.technician_name || ''}
              onChange={(e) => setForm({ ...form, technician_name: e.target.value })}
              placeholder="Nome do técnico"
              className="field-input"
            />
            <datalist id="tech-list">
              {techNames.map(([, label]) => <option key={label} value={label} />)}
            </datalist>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Cliente *</label>
            <input
              value={form.client_name || ''}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              placeholder="Nome do cliente / fazenda"
              className="field-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Cidade</label>
            <input
              value={form.city || ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Cidade"
              className="field-input"
            />
          </div>

          <div>
            <label className="field-label">Tipo Cliente</label>
            <select
              value={form.client_type || ''}
              onChange={(e) => setForm({ ...form, client_type: e.target.value })}
              className="field-input"
            >
              <option value="">Selecione</option>
              {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Tipo Serviço</label>
            <select
              value={form.service_type || ''}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
              className="field-input"
            >
              <option value="">Selecione</option>
              {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Animais Acasalados</label>
            <input
              type="number"
              value={form.animals ?? ''}
              onChange={(e) => setForm({ ...form, animals: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              min={0}
              className="field-input"
            />
          </div>

          <div>
            <label className="field-label">Rebanho (Herd Size)</label>
            <input
              type="number"
              value={form.herd_size ?? ''}
              onChange={(e) => setForm({ ...form, herd_size: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              min={0}
              className="field-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Notas</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações..."
              rows={2}
              className="field-input resize-none"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="deal-closed"
              checked={Boolean(form.deal_closed)}
              onChange={(e) => setForm({ ...form, deal_closed: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="deal-closed" className="text-sm text-gray-700 font-medium">
              Negócio Fechado
            </label>
          </div>

          {form.deal_closed && (
            <>
              <div>
                <label className="field-label">Doses Convencional</label>
                <input
                  type="number"
                  min={0}
                  value={form.doses_convencional ?? ''}
                  onChange={(e) => setForm({ ...form, doses_convencional: e.target.value ? Number(e.target.value) : null })}
                  className="field-input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="field-label">Doses Sexado</label>
                <input
                  type="number"
                  min={0}
                  value={form.doses_sexado ?? ''}
                  onChange={(e) => setForm({ ...form, doses_sexado: e.target.value ? Number(e.target.value) : null })}
                  className="field-input"
                  placeholder="0"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando...' : editTarget ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalhes da Visita"
        size="md"
      >
        {detailTarget && (
          <div className="space-y-3 text-sm">
            {([
              ['Data', fmtDate(detailTarget.date)],
              ['Técnico', detailTarget.technician_name],
              ['Área', detailTarget.area],
              ['Consultor', detailTarget.consultant || '—'],
              ['Cliente', detailTarget.client_name],
              ['Cidade', detailTarget.city || '—'],
              ['Tipo Cliente', detailTarget.client_type],
              ['Serviço', detailTarget.service_type],
              ['Animais', detailTarget.animals ?? '—'],
              ['Rebanho', detailTarget.herd_size ?? '—'],
              ['Negócio Fechado', detailTarget.deal_closed ? 'Sim' : 'Não'],
              ['Notas', detailTarget.notes || '—'],
            ] as [string, unknown][]).map(([label, val]) => (
              <div key={label} className="flex gap-2">
                <span className="font-semibold text-gray-600 w-32 flex-shrink-0">{label}:</span>
                <span className="text-gray-800">{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Excluir Visita"
        message={`Confirma a exclusão da visita de "${deleteTarget?.technician_name}" para "${deleteTarget?.client_name}"? Esta ação é irreversível.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
