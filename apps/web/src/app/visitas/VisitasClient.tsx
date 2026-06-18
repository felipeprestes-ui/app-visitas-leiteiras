'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Eye, Search, Upload } from 'lucide-react';
import { fetchUsers, upsertVisit } from '@/lib/supabase';
import { parseCSVFile, type CSVError } from '@/lib/csv-import';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import type { Visit, TechUser } from '@/types/portal';
import { AREAS, CLIENT_TYPES, SERVICE_TYPES, CONSULTORES, MONTHS } from '@/types/portal';
import { getPendingVisits } from '@/lib/offline/storage';
import { deleteVisitOfflineFirst, loadVisitsOfflineFirst, registerOnlineSync, saveVisitOfflineFirst } from '@/lib/offline/sync';

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
  if (!d) return '\u2014';
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
}

const emptyForm = (techName?: string): Partial<Visit> => ({
  technician_name: techName || '',
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  // CSV Import
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Partial<Visit>[]>([]);
  const [csvErrors, setCsvErrors] = useState<CSVError[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportProgress, setCsvImportProgress] = useState({ current: 0, total: 0 });
  const [csvImportResult, setCsvImportResult] = useState('');

  const userRole = session?.role || 'tecnico';
  const userName = session?.name || '';

  const loadData = useCallback(async () => {
    setLoading(true);
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

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('visit-saved', handler);
    return () => window.removeEventListener('visit-saved', handler);
  }, [loadData]);

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
    setForm(emptyForm(userName));
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
      setFormError('Preencha: tecnico, cliente e data.');
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
    const res = await saveVisitOfflineFirst(payload);
    setSaving(false);
    if (!res.ok) {
      setFormError('Erro ao salvar');
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

  async function handleCsvSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const result = await parseCSVFile(file);
      setCsvPreview(result.visits.slice(0, 5));
      setCsvErrors(result.errors);
      setCsvFile(file);
      setCsvModalOpen(true);
      setCsvImportResult('');
    } catch (err) {
      setCsvImportResult(`Erro ao ler arquivo: ${err instanceof Error ? err.message : 'desconhecido'}`);
    }
  }

  async function handleConfirmCsvImport() {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvImportProgress({ current: 0, total: 0 });
    setCsvImportResult('');

    try {
      const result = await parseCSVFile(csvFile);
      const visitsToImport = result.visits;
      if (visitsToImport.length === 0) {
        setCsvImportResult('Nenhuma visita valida encontrada no arquivo.');
        setCsvImporting(false);
        return;
      }

      setCsvImportProgress({ current: 0, total: visitsToImport.length });
      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < visitsToImport.length; i++) {
        const visit = visitsToImport[i];
        setCsvImportProgress({ current: i + 1, total: visitsToImport.length });
        const res = await upsertVisit(visit);
        if (res.ok) {
          imported++;
        } else {
          errors.push(`Linha ${i + 1}: ${res.error || 'Erro ao salvar'}`);
        }
      }

      if (imported > 0) {
        await loadData();
      }

      if (errors.length > 0) {
        setCsvImportResult(`${imported} visita(s) importada(s). ${errors.length} erro(s): ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`);
      } else {
        setCsvImportResult(`${imported} visita(s) importada(s) com sucesso.`);
      }
      setCsvModalOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
    } catch (err) {
      setCsvImportResult(`Erro na importacao: ${err instanceof Error ? err.message : 'desconhecido'}`);
    } finally {
      setCsvImporting(false);
      setCsvImportProgress({ current: 0, total: 0 });
    }
  }

  const consultoresForArea = form.area ? (CONSULTORES[form.area] || []) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Gerenciar Visitas</h1>
        <div className="flex gap-2">
          {userRole === 'gestor' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleCsvSelected}
                disabled={csvImporting}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={csvImporting}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <Upload size={16} /> Importar CSV
              </button>
            </>
          )}
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} /> Nova Visita
          </button>
        </div>
      </div>

      {csvImportResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${csvImportResult.includes('Erro') || csvImportResult.includes('erro') ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {csvImportResult}
        </div>
      )}

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {pendingCount > 0
          ? `${pendingCount} visita(s) pendente(s) de sincronizacao offline.`
          : 'Todas as visitas locais estao sincronizadas.'}
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
            <option value="">Todos os tecnicos</option>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Tecnico</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden md:table-cell">Area</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden lg:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden lg:table-cell">Servico</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide hidden md:table-cell">Animais</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Fechado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">Acoes</th>
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
                      <td className="px-4 py-3 text-gray-500 text-center hidden md:table-cell">{v.animals ?? '\u2014'}</td>
                      <td className="px-4 py-3 text-center">
                        {v.deal_closed ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Fechado" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300" title="Nao fechado" />
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

      {/* CSV Preview Modal */}
      <Modal
        open={csvModalOpen}
        onClose={() => { if (!csvImporting) setCsvModalOpen(false); }}
        title="Preview da Importacao CSV"
        size="lg"
      >
        {csvErrors.length > 0 && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-3 py-2">
            <p className="font-semibold">{csvErrors.length} erro(s) encontrado(s):</p>
            <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {csvErrors.slice(0, 5).map((err, i) => (
                <li key={i}>Linha {err.line}: {err.message}</li>
              ))}
              {csvErrors.length > 5 && <li>...e mais {csvErrors.length - 5} erro(s)</li>}
            </ul>
          </div>
        )}

        {csvPreview.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Preview das primeiras {csvPreview.length} linha(s) validas:</p>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Data</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Tecnico</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Cliente</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Cidade</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Servico</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((v, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-700">{fmtDate(v.date || '')}</td>
                      <td className="px-3 py-2 text-gray-700">{v.technician_name}</td>
                      <td className="px-3 py-2 text-gray-700">{v.client_name}</td>
                      <td className="px-3 py-2 text-gray-600">{v.city || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{v.service_type || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {csvImporting && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all"
                style={{ width: `${csvImportProgress.total > 0 ? (csvImportProgress.current / csvImportProgress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1 text-center">
              Importando {csvImportProgress.current} de {csvImportProgress.total}...
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setCsvModalOpen(false)}
            disabled={csvImporting}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCsvImport}
            disabled={csvImporting || csvPreview.length === 0}
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {csvImporting ? 'Importando...' : 'Confirmar Importacao'}
          </button>
        </div>
      </Modal>

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
            <label className="field-label">Area</label>
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
            <label className="field-label">Tecnico *</label>
            <input
              list="tech-list"
              value={form.technician_name || ''}
              onChange={(e) => setForm({ ...form, technician_name: e.target.value })}
              placeholder="Nome do tecnico"
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
            <label className="field-label">Tipo Servico</label>
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
              placeholder="Observacoes..."
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
              Negocio Fechado
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
              ['Tecnico', detailTarget.technician_name],
              ['Area', detailTarget.area],
              ['Consultor', detailTarget.consultant || '\u2014'],
              ['Cliente', detailTarget.client_name],
              ['Cidade', detailTarget.city || '\u2014'],
              ['Tipo Cliente', detailTarget.client_type],
              ['Servico', detailTarget.service_type],
              ['Animais', detailTarget.animals ?? '\u2014'],
              ['Rebanho', detailTarget.herd_size ?? '\u2014'],
              ['Negocio Fechado', detailTarget.deal_closed ? 'Sim' : 'Nao'],
              ['Notas', detailTarget.notes || '\u2014'],
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
        message={`Confirma a exclusao da visita de "${deleteTarget?.technician_name}" para "${deleteTarget?.client_name}"? Esta acao e irreversivel.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
