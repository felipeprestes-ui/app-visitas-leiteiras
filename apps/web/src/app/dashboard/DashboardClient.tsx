'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MapPin, TrendingUp, Users, CheckCircle2, Target, Activity,
  Plus, FileText, RefreshCw, CalendarDays, Wifi, X
} from 'lucide-react';
import Link from 'next/link';
import { fetchVisits, fetchSales, fetchUsers } from '@/lib/supabase';
import { getSession } from '@/hooks/useAuth';
import { KpiCard } from '@/components/ui/KpiCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Visit, MonthlySale } from '@/types/portal';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface MonthlyChartData {
  mes: string;
  visitas: number;
}

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [sales, setSales] = useState<MonthlySale[]>([]);
  const [techCount, setTechCount] = useState(0);
  const [chartData, setChartData] = useState<MonthlyChartData[]>([]);
  const [lastSync, setLastSync] = useState<string>('');
  const [showClosedModal, setShowClosedModal] = useState(false);
  
  const session = getSession();
  const userRole = session?.role || 'tecnico';
  const userName = session?.name || '';

  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const currentMonth = format(today, 'M-yyyy');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Se for técnico, filtra apenas as próprias visitas
      const visitParams: Record<string, string> = { 
        'and': `(date.gte.${monthStart},date.lte.${monthEnd})`,
      };
      
      if (userRole === 'tecnico' && userName) {
        visitParams['techName'] = `eq.${userName}`;
      }
      
      const [visitsMonth, allSales, users] = await Promise.all([
        fetchVisits(visitParams),
        userRole === 'gestor' ? fetchSales({ 'month': `eq.${currentMonth}` }).catch(() => []) : Promise.resolve([]),
        userRole === 'gestor' ? fetchUsers().then(all => all.filter(u => u.role === 'tecnico' || u.role === 'gestor')).catch(() => []) : Promise.resolve([]),
      ]);
      
      setVisits(visitsMonth);
      setSales(allSales);
      setTechCount(users.length);
      setLastSync(new Date().toLocaleTimeString('pt-BR'));

      // Build chart: last 12 months (apenas do técnico se for técnico)
      const chartParams: Record<string, string> = { 'select': 'date', 'limit': '5000' };
      if (userRole === 'tecnico' && userName) {
        chartParams['techName'] = `eq.${userName}`;
      }
      
      const allVisits = await fetchVisits(chartParams);
      const countByMonth: Record<string, number> = {};
      for (const v of allVisits) {
        if (!v.date) continue;
        const d = new Date(v.date);
        const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
        countByMonth[key] = (countByMonth[key] || 0) + 1;
      }
      const chart: MonthlyChartData[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(today, i);
        const label = format(d, 'MMM/yy', { locale: ptBR });
        const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
        chart.push({ mes: label, visitas: countByMonth[key] || 0 });
      }
      setChartData(chart);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, userName]);

  useEffect(() => { load(); }, [load]);

  const totalVisits = visits.length;
  const closedDeals = visits.filter((v) => v.deal_closed).length;
  const convRate = totalVisits > 0 ? Math.round((closedDeals / totalVisits) * 100) : 0;
  const totalAnimais = visits.reduce((s, v) => s + (v.animals || 0), 0);

  const dosesNovos = sales.reduce((s, x) => s + (Number(x.dosesNovos) || 0), 0);
  const dosesAtivos = sales.reduce((s, x) => s + (Number(x.dosesAtivos) || 0), 0);
  const totalMeta = sales.reduce((s, x) => s + (Number(x.meta) || 0), 0);
  const pctMeta = totalMeta > 0 ? Math.round((dosesNovos / totalMeta) * 100) : 0;
  const fatNovos = sales.reduce((s, x) => s + (Number(x.faturamentoNovos) || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {format(today, 'MMMM yyyy', { locale: ptBR })} — dados em tempo real
            {lastSync && <span className="ml-2 text-xs text-gray-400">(sinc. {lastSync})</span>}
          </p>
        </div>
        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={load}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Sincronizar
          </button>
          <Link
            href="/visitas/nova"
            className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={15} /> Lançar Visita
          </Link>
          <Link
            href="/agenda"
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <CalendarDays size={15} /> Agenda
          </Link>
          {userRole === 'gestor' && (
            <Link
              href="/vendas?new=1"
              className="flex items-center gap-1.5 bg-gold text-white text-sm px-3 py-2 rounded-lg hover:bg-gold-dark transition-colors"
            >
              <TrendingUp size={15} /> Lançar Vendas
            </Link>
          )}
          <Link
            href="/relatorios"
            className="flex items-center gap-1.5 bg-gray-700 text-white text-sm px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FileText size={15} /> Exportar
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard title="Visitas no Mês" value={totalVisits} icon={MapPin} accent="primary" />
        <KpiCard title="Negócios Fechados" value={closedDeals} icon={CheckCircle2} accent="green" onClick={() => setShowClosedModal(true)} />
        <KpiCard title="Taxa Conversão" value={`${convRate}%`} icon={Activity} accent="primary" />
        <KpiCard title="Doses Novas" value={dosesNovos} icon={TrendingUp} accent="gold" />
        <KpiCard title="Doses Ativas" value={dosesAtivos} icon={TrendingUp} accent="primary" />
        <KpiCard
          title="Meta do Mês"
          value={`${pctMeta}%`}
          sub={`${dosesNovos}/${totalMeta} doses`}
          icon={Target}
          accent={pctMeta >= 80 ? 'green' : pctMeta >= 50 ? 'gold' : 'red'}
        />
        <KpiCard title="Técnicos Ativos" value={techCount} icon={Users} accent="primary" />
        <KpiCard
          title="Animais Acasalados"
          value={totalAnimais.toLocaleString('pt-BR')}
          icon={Activity}
          accent="primary"
        />
      </div>

      {/* Faturamento */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Faturamento Novos (mês)</h2>
        <p className="text-3xl font-bold text-primary">{fmtBRL(fatNovos)}</p>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Evolução de Visitas — Últimos 12 Meses
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="visitasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a3c7a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1a3c7a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="visitas"
                stroke="#1a3c7a"
                strokeWidth={2}
                fill="url(#visitasGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Modal Negocios Fechados */}
      {showClosedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowClosedModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Negocios Fechados</h2>
              <button onClick={() => setShowClosedModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {visits.filter((v) => v.deal_closed).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum negocio fechado neste mes.</p>
              ) : (
                <div className="space-y-3">
                  {visits.filter((v) => v.deal_closed).map((v) => (
                    <div key={v.id} className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{v.client_name}</p>
                          <p className="text-sm text-gray-600">{v.technician_name} &middot; {v.city || 'Sem cidade'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-emerald-700">{format(new Date(v.date), 'dd/MM/yyyy')}</p>
                          <p className="text-xs text-gray-500">{v.service_type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
