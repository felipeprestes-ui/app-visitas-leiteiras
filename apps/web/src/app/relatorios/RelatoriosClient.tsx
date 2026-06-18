'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { FileDown, Table2, BarChart3 } from 'lucide-react';
import { fetchVisits, fetchSales, fetchUsers } from '@/lib/supabase';
import { getSession } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Visit, MonthlySale, TechUser } from '@/types/portal';
import { MONTHS } from '@/types/portal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function normalizeMonthValue(value: string) {
  if (!value) return '';
  const trimmed = value.trim();
  // Formato ISO: 2025-11 (YYYY-MM) -> 10-2025 (base 0)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    const monthIndex = Number(isoMatch[2]) - 1;
    return `${monthIndex}-${isoMatch[1]}`;
  }
  // Formato interno: 10-2025 (base 0 - ano)
  const numericMatch = trimmed.match(/^(\d{1,2})-(\d{4})$/);
  if (numericMatch) {
    return `${Number(numericMatch[1])}-${numericMatch[2]}`;
  }
  return trimmed;
}

interface TechRow {
  nome: string;
  area: string;
  email: string;
  visitas: number;
  negFechados: number;
  taxaNeg: number;
  totalAnimais: number;
  topServico: string;
  dosesNovos: number;
  dosesAtivos: number;
  totalDoses: number;
  fatNovos: number;
  fatAtivos: number;
  totalFat: number;
  meta: number;
  pctMeta: number;
}

function buildRows(
  visits: Visit[],
  sales: MonthlySale[],
  techUsers: TechUser[]
): TechRow[] {
  const techNames = Array.from(new Set([
    ...visits.map((v) => v.technician_name),
    ...sales.map((s) => s.technicianName),
    ...techUsers.map((u) => u.name),
  ])).filter(Boolean).sort();

  return techNames.map((nome) => {
    const techVisits = visits.filter((v) => v.technician_name === nome);
    const techSales = sales.filter((s) => s.technicianName === nome);
    const techUser = techUsers.find((u) => u.name === nome);

    const negFechados = techVisits.filter((v) => v.deal_closed).length;
    const taxaNeg = techVisits.length > 0 ? Math.round((negFechados / techVisits.length) * 100) : 0;
    const totalAnimais = techVisits.reduce((s, v) => s + (v.animals || 0), 0);

    // Top service
    const svcCount: Record<string, number> = {};
    techVisits.forEach((v) => { if (v.service_type) svcCount[v.service_type] = (svcCount[v.service_type] || 0) + 1; });
    const topServico = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    const dosesNovos = techSales.reduce((s, x) => s + (Number(x.dosesNovos) || 0), 0);
    const dosesAtivos = techSales.reduce((s, x) => s + (Number(x.dosesAtivos) || 0), 0);
    const fatNovos = techSales.reduce((s, x) => s + (Number(x.faturamentoNovos) || 0), 0);
    const fatAtivos = techSales.reduce((s, x) => s + (Number(x.faturamentoAtivos) || 0), 0);
    const meta = techSales.length > 0 ? techSales[techSales.length - 1].meta || 0 : 0;
    const pctMeta = meta > 0 ? Math.round((dosesNovos / meta) * 100) : 0;

    return {
      nome,
      area: techUser?.area || techVisits[0]?.area || '—',
      email: techUser?.email || '—',
      visitas: techVisits.length,
      negFechados,
      taxaNeg,
      totalAnimais,
      topServico,
      dosesNovos,
      dosesAtivos,
      totalDoses: dosesNovos + dosesAtivos,
      fatNovos,
      fatAtivos,
      totalFat: fatNovos + fatAtivos,
      meta,
      pctMeta,
    };
  });
}

function downloadCSV(rows: TechRow[], month: string) {
  const monthLabel = MONTHS.find((m) => m.value === month)?.label || month || 'Todos';
  const header = 'Técnico;Área;Email;Visitas;Neg.Fechados;Taxa%;Animais;Top Serviço;Doses Nov.;Doses At.;Total Doses;Fat.Nov.;Fat.At.;Total Fat.;Meta;%Meta\n';
  const body = rows.map((r) =>
    [r.nome, r.area, r.email, r.visitas, r.negFechados, `${r.taxaNeg}%`, r.totalAnimais, r.topServico,
      r.dosesNovos, r.dosesAtivos, r.totalDoses, r.fatNovos.toFixed(2), r.fatAtivos.toFixed(2),
      r.totalFat.toFixed(2), r.meta, `${r.pctMeta}%`].join(';')
  ).join('\n');
  const csv = '\uFEFF' + header + body; // BOM for Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${monthLabel.replace('/', '-')}_${format(new Date(), 'yyyyMMdd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPDF(rows: TechRow[], month: string) {
  const monthLabel = MONTHS.find((m) => m.value === month)?.label || month || 'Todos';
  // Dynamic import to avoid SSR issues
  const jsPDF = (await import('jspdf')).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { default: autoTable } = (await import('jspdf-autotable')) as any;
  const html2canvas = (await import('html2canvas')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(26, 60, 122);
  doc.rect(0, 0, 297, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CRV LAGOA — Relatório de Técnicos', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mês: ${monthLabel}   Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 200, 13);

  doc.setTextColor(0, 0, 0);

  // Tenta capturar graficos da tela
  try {
    const chartElements = document.querySelectorAll('[data-chart="true"]');
    let yPos = 25;
    for (let i = 0; i < chartElements.length; i++) {
      const el = chartElements[i] as HTMLElement;
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 120;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (yPos + imgHeight > 180) {
        doc.addPage();
        yPos = 20;
      }
      doc.addImage(imgData, 'PNG', 14 + (i % 2) * 130, yPos, imgWidth, imgHeight);
      if (i % 2 === 1) yPos += imgHeight + 10;
    }
    if (chartElements.length > 0) {
      doc.addPage();
    }
  } catch (e) {
    console.warn('Erro ao capturar graficos:', e);
  }

  autoTable(doc, {
    startY: 25,
    head: [['Técnico', 'Área', 'Visitas', 'Neg.', 'Taxa%', 'Animais', 'Top Serviço', 'D.Nov', 'D.At', 'T.Doses', 'Fat.Nov.', 'Fat.At.', 'T.Fat.', 'Meta', '%Meta']],
    body: rows.map((r) => [
      r.nome, r.area, r.visitas, r.negFechados, `${r.taxaNeg}%`, r.totalAnimais, r.topServico,
      r.dosesNovos, r.dosesAtivos, r.totalDoses,
      fmtBRL(r.fatNovos), fmtBRL(r.fatAtivos), fmtBRL(r.totalFat),
      r.meta, `${r.pctMeta}%`,
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [26, 60, 122], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [238, 242, 251] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 14) {
        const val = parseInt(String(data.cell.raw || '0'));
        if (val >= 100) data.cell.styles.textColor = [5, 150, 105];
        else if (val >= 50) data.cell.styles.textColor = [180, 130, 50];
        else data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  doc.save(`relatorio_${monthLabel.replace('/', '-')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

export function RelatoriosClient() {
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterTech, setFilterTech] = useState('');
  const [rows, setRows] = useState<TechRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  
  const session = getSession();
  const userRole = session?.role || 'tecnico';
  const userName = session?.name || '';

  const loadData = useCallback(async () => {
    setLoading(true);

    // Se for técnico, carrega apenas os próprios dados
    const visitParams: Record<string, string> = { limit: '5000' };
    if (userRole === 'tecnico' && userName) {
      visitParams['techName'] = `eq.${userName}`;
    }

    const [visits, sales, users] = await Promise.all([
      fetchVisits(visitParams),
      userRole === 'gestor' ? fetchSales() : Promise.resolve([]),
      userRole === 'gestor' ? fetchUsers() : Promise.resolve([{ id: '1', name: userName, email: '', role: 'tecnico' }]),
    ]);

    // Filter by month
    const visitsFiltered = filterMonth
      ? visits.filter((v) => {
          if (!v.date) return false;
          const d = new Date(v.date);
          return `${d.getMonth()}-${d.getFullYear()}` === filterMonth;
        })
      : visits;

    const salesFiltered = filterMonth
      ? sales.filter((s) => normalizeMonthValue(s.month) === filterMonth)
      : sales;

    const techFiltered = filterTech
      ? users.filter((u) => u.name.toLowerCase().includes(filterTech.toLowerCase()))
      : users;

    let r = buildRows(visitsFiltered, salesFiltered, filterTech ? techFiltered : users);
    if (filterTech) r = r.filter((row) => row.nome.toLowerCase().includes(filterTech.toLowerCase()));

    setRows(r);
    setLoaded(true);
    setLoading(false);
  }, [filterMonth, filterTech]);

  useEffect(() => { loadData(); }, [loadData]);

  const techNames = Array.from(new Set(rows.map((r) => r.nome))).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Relatórios</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(rows, filterMonth)}
            disabled={rows.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <FileDown size={16} /> Exportar CSV
          </button>
          <button
            onClick={() => downloadPDF(rows, filterMonth)}
            disabled={rows.length === 0}
            className="flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <FileDown size={16} /> Exportar PDF
          </button>
        </div>
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

      {/* Summary KPIs */}
      {loaded && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Visitas', value: rows.reduce((s, r) => s + r.visitas, 0) },
            { label: 'Neg. Fechados', value: rows.reduce((s, r) => s + r.negFechados, 0) },
            { label: 'Total Animais', value: rows.reduce((s, r) => s + r.totalAnimais, 0).toLocaleString('pt-BR') },
            { label: 'Faturamento', value: fmtBRL(rows.reduce((s, r) => s + r.totalFat, 0)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold text-primary mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {loaded && rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm" data-chart="true">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-primary" />
              <span className="text-sm font-semibold text-gray-700">Visitas por Técnico</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="visitas" fill="#1a3c7a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm" data-chart="true">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-primary" />
              <span className="text-sm font-semibold text-gray-700">Doses Novos vs Meta</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="dosesNovos" fill="#10b981" name="Doses Novos" />
                <Bar dataKey="meta" fill="#f59e0b" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <Table2 size={16} className="text-primary" />
          <span className="text-sm font-semibold text-gray-700">
            Preview — {rows.length} técnico{rows.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-primary-light border-b border-gray-200">
                  {['Técnico', 'Área', 'Visitas', 'Neg.', 'Taxa%', 'Animais', 'Top Serviço',
                    'D.Nov', 'D.At', 'T.Doses', 'Fat.Nov.', 'Fat.At.', 'T.Fat.', 'Meta', '%Meta'].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-primary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="text-center py-10 text-gray-400">
                      Nenhum dado encontrado
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700 max-w-[140px] truncate" title={r.nome}>{r.nome}</td>
                      <td className="px-3 py-2 text-gray-500">{r.area}</td>
                      <td className="px-3 py-2 text-right">{r.visitas}</td>
                      <td className="px-3 py-2 text-right">{r.negFechados}</td>
                      <td className="px-3 py-2 text-right">{r.taxaNeg}%</td>
                      <td className="px-3 py-2 text-right">{r.totalAnimais.toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-2 max-w-[100px] truncate" title={r.topServico}>{r.topServico}</td>
                      <td className="px-3 py-2 text-right">{r.dosesNovos}</td>
                      <td className="px-3 py-2 text-right">{r.dosesAtivos}</td>
                      <td className="px-3 py-2 text-right font-medium">{r.totalDoses}</td>
                      <td className="px-3 py-2 text-right">{fmtBRL(r.fatNovos)}</td>
                      <td className="px-3 py-2 text-right">{fmtBRL(r.fatAtivos)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmtBRL(r.totalFat)}</td>
                      <td className="px-3 py-2 text-right">{r.meta}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <span className={
                          r.pctMeta >= 100 ? 'text-emerald-600' :
                          r.pctMeta >= 50 ? 'text-yellow-600' : 'text-red-500'
                        }>
                          {r.pctMeta}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
