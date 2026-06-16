import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: 'primary' | 'gold' | 'green' | 'red';
}

const accentMap = {
  primary: 'bg-primary text-white',
  gold: 'bg-gold text-white',
  green: 'bg-emerald-500 text-white',
  red: 'bg-red-500 text-white',
};

export function KpiCard({ title, value, sub, icon: Icon, accent = 'primary' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`rounded-lg p-2.5 flex-shrink-0 ${accentMap[accent]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
