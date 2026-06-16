'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setSession } from '@/hooks/useAuth';

// Local user store matching standalone App.js (gestor only)
const LOCAL_USERS = [
  { id: 'local-gestor-1', email: 'gestor@crv4all.com.br', password: 'Luisa@0510', name: 'Felipe Prestes', role: 'gestor' },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://egmradntktqzpuedxqhg.supabase.co/rest/v1';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbXJhZG50a3RxenB1ZWR4cWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTcwMTMsImV4cCI6MjA5NTQ5MzAxM30.f2mnogv5_EHVgEU-wUktMfVn7i28sf_vLhl1Baimtnk';

function supabaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loginUser(email: string, password: string): Promise<{ ok: boolean; name?: string; error?: string }> {
    const e = email.trim().toLowerCase();
    const p = password;

    // 1. Check local hardcoded gestors
    const local = LOCAL_USERS.find(
      (u) => u.email.toLowerCase() === e && u.password === p && u.role === 'gestor'
    );
    if (local) {
      return { ok: true, name: local.name };
    }

    // 2. Fallback: query Supabase /User table for gestor
    try {
      const supaRes = await fetch(
        `${SUPABASE_URL}/User?email=eq.${encodeURIComponent(e)}&select=id,name,email,role,password`,
        { headers: supabaseHeaders() }
      );
      if (supaRes.ok) {
        const users = await supaRes.json();
        if (Array.isArray(users) && users.length > 0) {
          const user = users[0] as { id: string; name: string; email: string; role: string; password?: string };
          const storedPwd = user.password || '';
          if (storedPwd === p && user.role === 'gestor') {
            return { ok: true, name: user.name };
          }
        }
      }
    } catch {
      // Supabase unavailable — fall through
    }

    return { ok: false, error: 'Email ou senha invalidos, ou usuario nao e gestor' };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      if (!result.ok) {
        setError(result.error || 'Erro ao fazer login');
      } else {
        // Create session
        const session = { id: 'session-' + Date.now(), name: result.name || 'Gestor', email, role: 'gestor' };
        setSession(session);
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Erro de conexao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <span className="text-white font-bold text-xl">CRV</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">CRV LAGOA</h1>
          <p className="text-muted text-sm mt-1">Portal de Gestao</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-7">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Acesso do Gestor</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gestor@crv4all.com.br"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-4">
          Acesso exclusivo para gestores
        </p>
      </div>
    </div>
  );
}
