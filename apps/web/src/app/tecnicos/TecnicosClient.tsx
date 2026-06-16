'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { fetchUsers, upsertUser, deleteUser } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { TechUser } from '@/types/portal';
import { AREAS } from '@/types/portal';

const emptyForm = (): Partial<TechUser> => ({
  name: '',
  email: '',
  area: '',
  phone: '',
  role: 'tecnico',
  active: true,
});

export function TecnicosClient() {
  const [techs, setTechs] = useState<TechUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TechUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TechUser | null>(null);
  const [form, setForm] = useState<Partial<TechUser>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const users = await fetchUsers();
    setTechs(users);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openNew() {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(t: TechUser) {
    setEditTarget(t);
    setForm({ id: t.id, name: t.name, email: t.email, area: t.area, phone: t.phone, role: t.role, active: t.active });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.email) {
      setFormError('Nome e email são obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    const res = await upsertUser({ ...form });
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
    await deleteUser(deleteTarget.id);
    setDeleteOpen(false);
    setDeleteTarget(null);
    await loadData();
  }

  const roleLabel = (r: string) => r === 'gestor' ? 'Gestor' : 'Técnico';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Gerenciar Técnicos</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Adicionar Técnico
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : techs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum técnico cadastrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-light border-b border-gray-200">
                  {['Nome', 'Email', 'Área', 'Telefone', 'Perfil', 'Status', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techs.map((t, i) => (
                  <tr key={t.id || i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-primary flex-shrink-0">
                        <User size={13} />
                      </div>
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.email}</td>
                    <td className="px-4 py-3 text-gray-500">{t.area || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{t.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        t.role === 'gestor' ? 'bg-gold-light text-gold-dark' : 'bg-primary-light text-primary'
                      }`}>
                        {roleLabel(t.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full ${t.active !== false ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(t)} className="p-1 rounded text-gray-400 hover:text-gold hover:bg-gold-light transition-colors" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => { setDeleteTarget(t); setDeleteOpen(true); }} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar Técnico' : 'Novo Técnico'} size="md">
        {formError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{formError}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="field-label">Nome *</label>
            <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" className="field-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Email *</label>
            <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@crv4all.com.br" className="field-input" />
          </div>
          <div>
            <label className="field-label">Área Principal</label>
            <select value={form.area || ''} onChange={(e) => setForm({ ...form, area: e.target.value })} className="field-input">
              <option value="">Selecione</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Telefone</label>
            <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className="field-input" />
          </div>
          <div>
            <label className="field-label">Perfil</label>
            <select value={form.role || 'tecnico'} onChange={(e) => setForm({ ...form, role: e.target.value })} className="field-input">
              <option value="tecnico">Técnico</option>
              <option value="gestor">Gestor</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="active" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-primary" />
            <label htmlFor="active" className="text-sm text-gray-700 font-medium">Ativo</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors">
            {saving ? 'Salvando...' : editTarget ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir Técnico"
        message={`Excluir o técnico "${deleteTarget?.name}" (${deleteTarget?.email})?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
