'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  MapPin, TrendingUp, Users, CheckCircle2, Target, Activity,
  Plus, FileText
} from 'lucide-react';
import Link from 'next/link';
import { fetchVisits, fetchSales, fetchUsers } from '@/lib/supabase';
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

  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const currentMonth = format(today, 'M-yyyy'); // format used in App.js e.g. "5-2026"

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [visitsMonth, allSales, users] = await Promise.all([
        fetchVisits({ 'visit_date': `gte.${monthStart}`, 'visit_date_2': `lte.${monthEnd}` }),
        fetchSales({ 'month': `eq.${currentMonth}` }),
        fetchUsers({ 'role': 'eq.tecnico' }),
      ]);
      setVisits(visitsMonth);
      setSales(allSales);
      setTechCount(users.length);

      // Build chart: last 12 months — fetch all visits then group
      const allVisits = await fetchVisits({ 'select': 'visit_date', 'limit': '5000' });
      const countByMonth: Record<string, number> = {};
      for (const v of allVisits) {
        if (!v.visit_date) continue;
        const d = new Date(v.visit_date);
        const key = `${d.getMonth()}-${d.getFullYear()}`;
        countByMonth[key] = (countByMonth[key] || 0) + 1;
      }
      const chart: MonthlyChartData[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(today, i);
        const label = format(d, 'MMM/yy', { locale: ptBR });
        const key = `${d.getMonth()}-${d.getFullYear()}`;
        chart.push({ mes: label, visitas: countByMonth[key] || 0 });
      }
      setChartData(chart);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          </p>
        </div>
        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/visitas?new=1"
            className="flex items-center gap-1.5 bg-primary text-white text-sm px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={15} /> Lançar Visita
          </Link>
          <Link
            href="/vendas?new=1"
            className="flex items-center gap-1.5 bg-gold text-white text-sm px-3 py-2 rounded-lg hover:bg-gold-dark transition-colors"
          >
            <TrendingUp size={15} /> Lançar Vendas
          </Link>
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
        <KpiCard title="Negócios Fechados" value={closedDeals} icon={CheckCircle2} accent="green" />
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
    </div>
  );
}
