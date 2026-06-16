'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  CalendarDays,
  Wifi,
  PlusSquare,
} from 'lucide-react';
import { useState } from 'react';
import { clearSession } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/visitas/nova', label: 'Nova Visita', icon: PlusSquare },
  { href: '/visitas', label: 'Visitas', icon: MapPin },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/sync', label: 'Sincronização', icon: Wifi },
  { href: '/vendas', label: 'Vendas', icon: TrendingUp },
  { href: '/tecnicos', label: 'Técnicos', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
];

export function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    clearSession();
    router.push('/login');
    router.refresh();
  }

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-white text-primary shadow-sm'
                : 'text-blue-100 hover:bg-primary-dark hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-primary min-h-screen fixed left-0 top-0 z-30">
        <div className="px-4 py-5 border-b border-primary-dark">
          <div className="text-white font-bold text-lg leading-tight">CRV LAGOA</div>
          <div className="text-blue-200 text-xs mt-0.5">Portal Gestor</div>
        </div>
        <NavLinks />
        <div className="px-3 py-4 border-t border-primary-dark">
          {userName && (
            <div className="text-blue-200 text-xs px-3 mb-2 truncate">{userName}</div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-primary px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold">CRV LAGOA</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-56 bg-primary flex flex-col pt-14">
            <NavLinks />
            <div className="px-3 py-4 border-t border-primary-dark">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
