import type { Visit, MonthlySale, TechUser } from '@/types/portal';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://egmradntktqzpuedxqhg.supabase.co/rest/v1';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbXJhZG50a3RxenB1ZWR4cWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTcwMTMsImV4cCI6MjA5NTQ5MzAxM30.f2mnogv5_EHVgEU-wUktMfVn7i28sf_vLhl1Baimtnk';

export function supabaseHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function supabaseFetch<T = unknown>(
  path: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
): Promise<ApiResult<T>> {
  try {
    const headers = supabaseHeaders(options.headers || {});
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      const errData = data as Record<string, string> | null;
      const msg =
        (errData && (errData.message || errData.error || errData.hint)) ||
        `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Sem conexao' };
  }
}

// ── Visits ───────────────────────────────────────────────────────────────────

export async function fetchVisits(params: Record<string, string> = {}): Promise<Visit[]> {
  // Build query string manually to support Supabase operators like visit_date=gte.X&visit_date=lte.Y
  const base: Record<string, string> = { select: '*', order: 'visit_date.desc' };
  const merged = { ...base, ...params };
  const parts: string[] = [];
  for (const [k, v] of Object.entries(merged)) {
    // keys ending in _N (e.g. visit_date_2) map to their base key — enables duplicate filter params
    const realKey = k.replace(/_\d+$/, '');
    parts.push(`${realKey}=${v}`);
  }
  const res = await supabaseFetch<Visit[]>(`/Visit?${parts.join('&')}`);
  return res.ok && Array.isArray(res.data) ? res.data : [];
}

export async function upsertVisit(payload: Partial<Visit>): Promise<ApiResult<Visit>> {
  const method = payload.id ? 'PATCH' : 'POST';
  const path = payload.id ? `/Visit?id=eq.${payload.id}` : '/Visit';
  const body = { ...payload };
  if (method === 'POST') delete body.id;
  return supabaseFetch<Visit>(path, {
    method,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
}

export async function deleteVisit(id: string): Promise<ApiResult> {
  return supabaseFetch(`/Visit?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Monthly Sales ─────────────────────────────────────────────────────────────

export async function fetchSales(params: Record<string, string> = {}): Promise<MonthlySale[]> {
  const base: Record<string, string> = { select: '*', order: 'month.desc,technicianName.asc' };
  const merged = { ...base, ...params };
  const parts: string[] = [];
  for (const [k, v] of Object.entries(merged)) {
    parts.push(`${k}=${v}`);
  }
  const res = await supabaseFetch<MonthlySale[]>(`/monthly_sales?${parts.join('&')}`);
  return res.ok && Array.isArray(res.data) ? res.data : [];
}

export async function upsertSale(payload: Partial<MonthlySale>): Promise<ApiResult<MonthlySale>> {
  return supabaseFetch<MonthlySale>('/monthly_sales?on_conflict=month,technicianName', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload),
  });
}

export async function deleteSale(id: string): Promise<ApiResult> {
  return supabaseFetch(`/monthly_sales?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Users / Técnicos ──────────────────────────────────────────────────────────

export async function fetchUsers(params: Record<string, string> = {}): Promise<TechUser[]> {
  const base: Record<string, string> = { select: '*', order: 'name.asc' };
  const merged = { ...base, ...params };
  const parts: string[] = [];
  for (const [k, v] of Object.entries(merged)) {
    parts.push(`${k}=${v}`);
  }
  const res = await supabaseFetch<TechUser[]>(`/User?${parts.join('&')}`);
  return res.ok && Array.isArray(res.data) ? res.data : [];
}

export async function upsertUser(payload: Partial<TechUser>): Promise<ApiResult<TechUser>> {
  const method = payload.id ? 'PATCH' : 'POST';
  const path = payload.id ? `/User?id=eq.${payload.id}` : '/User';
  const body = { ...payload };
  if (method === 'POST') delete body.id;
  return supabaseFetch<TechUser>(path, {
    method,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
}

export async function deleteUser(id: string): Promise<ApiResult> {
  return supabaseFetch(`/User?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function loginUser(email: string, password: string): Promise<TechUser | null> {
  const res = await supabaseFetch<TechUser[]>(
    `/User?email=eq.${encodeURIComponent(email)}&select=*`
  );
  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) return null;
  const user = res.data[0];
  const storedPwd = (user as unknown as Record<string, string>).password || '';
  if (storedPwd !== password) return null;
  return user;
}
