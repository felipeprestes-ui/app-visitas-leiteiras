# PASSO A PASSO - Atualizar Portal Web no GitHub

## Arquivos que precisam ser atualizados:

1. `src/lib/supabase.ts` - CORRIGIDO (anexado neste arquivo)
2. `src/app/visitas/VisitasClient.tsx` - MOSTRAR NOME DO CLIENTE
3. `src/app/tecnicos/TecnicosClient.tsx` - NORMALIZAR AREA
4. `src/app/vendas/VendasClient.tsx` - META DOSES NOVOS

---

## PASSO 1: Atualizar supabase.ts

Va em: https://github.com/felipeprestes-ui/app-visitas-leiteiras/tree/main/src/lib

Clique no arquivo `supabase.ts`
Clique no lapis (Edit this file)
APAGUE TODO O CONTEUDO e cole o codigo abaixo:

```typescript
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

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function supabaseFetch<T>(
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
      const errData = data as Record<string, unknown> | null;
      const msg =
        (errData && (errData.message || errData.error || errData.hint)) ||
        `HTTP ${res.status}`;
      return { ok: false, error: msg as string };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message || 'Sem conexao',
    };
  }
}

// ── Helpers: map Supabase columns → Portal columns ────────────────────────

export function mapSupabaseToVisit(raw: Record<string, unknown>): Visit {
  return {
    id: String(raw.id || ''),
    technician_name: String(raw.techName || raw.technician_name || ''),
    client_name: String(raw.client_name || raw.clientName || ''),
    service_type: String(raw.objetivo || raw.service_type || raw.serviceType || ''),
    area: String(raw.areas || raw.area || '').trim().padStart(3, '0'),
    client_type: String(raw.tipo || raw.client_type || raw.clientType || ''),
    animals: (raw.mudas as number) ?? (raw.animals as number) ?? (raw.animalCount as number) ?? null,
    deal_closed: Boolean(raw.deal_closed || raw.dealClosed),
    herd_size: (raw.animaisAcasalados as number) ?? (raw.animaisColeta as number) ?? (raw.herd_size as number) ?? (raw.herdSize as number) ?? null,
    consultant: String(raw.consultant || raw.CONSULTOR || ''),
    notes: String(raw.notes || ''),
    date: String(raw.date || raw.visitDate || raw.visit_date || raw.visited_at || ''),
    local_id: (raw.local_id as string) || null,
    lat: (raw.lat as number) ?? null,
    lng: (raw.lng as number) ?? null,
  };
}

// ── Visits ──────────────────────────────────────────────────────────────

export async function fetchVisits(params: Record<string, string> = {}): Promise<Visit[]> {
  const base: Record<string, string> = { select: '*', order: 'date.desc' };
  const converted: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...params })) {
    const realKey = k.startsWith('visit_date') ? k.replace('visit_date', 'date') : k;
    const finalKey = realKey.replace(/_\d+$/, '');
    const finalVal = v.replace(/visit_date/g, 'date');
    converted[finalKey] = finalVal;
  }
  const parts: string[] = [];
  for (const [k, v] of Object.entries(converted)) {
    parts.push(`${k}=${v}`);
  }
  const res = await supabaseFetch<Record<string, unknown>[]>(`/Visit?${parts.join('&')}`);
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data.map(mapSupabaseToVisit);
}

export async function upsertVisit(payload: Partial<Visit>): Promise<ApiResult<Visit>> {
  const method = payload.id ? 'PATCH' : 'POST';
  const path = payload.id ? `/Visit?id=eq.${payload.id}` : '/Visit';
  const body = { ...payload };
  if (method === 'POST') delete body.id;

  // Map portal fields back to Supabase columns (ONLY columns that exist in Supabase)
  const mapped = {
    techName: body.technician_name,
    areas: body.area,
    objetivo: body.service_type,
    tipo: body.client_type,
    mudas: body.animals,
    animaisAcasalados: body.herd_size,
    deal_closed: body.deal_closed,
    consultant: body.consultant,
    notes: body.notes,
    date: body.date,
    client_name: body.client_name,
    local_id: body.local_id,
    lat: body.lat,
    lng: body.lng,
  };

  return supabaseFetch<Visit>(path, {
    method,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(mapped),
  });
}

export async function deleteVisit(id: string): Promise<ApiResult<void>> {
  return supabaseFetch(`/Visit?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// ── Sales ───────────────────────────────────────────────────────────────

export async function fetchSales(params: Record<string, string> = {}): Promise<MonthlySale[]> {
  const base: Record<string, string> = { select: '*', order: 'month.desc' };
  const merged = { ...base, ...params };
  const parts: string[] = [];
  for (const [k, v] of Object.entries(merged)) {
    parts.push(`${k}=${v}`);
  }
  const res = await supabaseFetch<MonthlySale[]>(`/monthly_sales?${parts.join('&')}`);
  return res.ok && Array.isArray(res.data) ? res.data : [];
}

export async function upsertSale(payload: Partial<MonthlySale>): Promise<ApiResult<MonthlySale>> {
  const body = { ...payload };
  // Gera UUID automatico se for insercao nova sem id
  if (!body.id) {
    body.id = crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  return supabaseFetch<MonthlySale>('/monthly_sales?on_conflict=month,technicianName', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(body),
  });
}

export async function deleteSale(id: string): Promise<ApiResult<void>> {
  return supabaseFetch(`/monthly_sales?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// ── Users ────────────────────────────────────────────────────────────

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
  // Removemos 'areas' que pode nao existir no Supabase e normalizamos area
  if ((body as Record<string, unknown>).areas !== undefined) delete (body as Record<string, unknown>).areas;
  if (body.area) body.area = String(body.area).trim().padStart(3, '0');
  return supabaseFetch<TechUser>(path, {
    method,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
}

export async function deleteUser(id: string): Promise<ApiResult<void>> {
  return supabaseFetch(`/User?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
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
```

Clique em "Commit changes..."
Mensagem: "Correcoes: visitas, vendas, tecnicos - portal web"
Clique "Commit changes"

---

## PASSO 2: Aguardar deploy automatico

O GitHub Actions vai detectar a mudanca e fazer o deploy automaticamente.
Va em: https://github.com/felipeprestes-ui/app-visitas-leiteiras/actions

Aguarde o workflow "Deploy to GitHub Pages" ficar verde (✅)

---

## PASSO 3: Testar

Acesse: https://felipeprestes-ui.github.io/app-visitas-leiteiras/login

Teste:
1. Lançar nova visita → nao deve dar erro
2. Lançar nova venda → nao deve dar erro
3. Editar tecnico → deve salvar
4. Verificar se area aparece padronizada (ex: 012)

---

## PROBLEMA: Visitas antigas nao aparecem

As visitas antigas estao no celular dos tecnicos, nao no servidor.
Solucao: Cada tecnico precisa abrir o app e tocar em "Sincronizar agora".

Se ainda nao subir, o app precisa ser atualizado (nova APK).

---

## PROXIMA ETAPA: Meta de doses

Inserir metas no Supabase SQL Editor:

```sql
INSERT INTO monthly_sales (id, month, dosesNovos, dosesAtivos, meta, faturamentoNovos, faturamentoAtivos, technicianName, updatedBy)
VALUES
  (gen_random_uuid(), '2025-09', 0, 0, 3381, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2025-10', 0, 0, 3063, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2025-11', 0, 0, 2946, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2025-12', 0, 0, 2097, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-01', 0, 0, 2610, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-02', 0, 0, 2712, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-03', 0, 0, 1503, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-04', 0, 0, 2650, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-05', 0, 0, 3100, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-06', 0, 0, 3123, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-07', 0, 0, 3232, 0, 0, 'EQUIPE', 'gestor'),
  (gen_random_uuid(), '2026-08', 0, 0, 4100, 0, 0, 'EQUIPE', 'gestor');
```

---

## PDF COM GRAFICOS

Requer implementacao adicional. Nao e possivel apenas com a API do navegador.
Sera necessario usar biblioteca jsPDF + html2canvas.

---

## APP MOBILE - Proxima versao

Correcoes pendentes:
1. Mostrar nome do tecnico no card de agendamentos
2. Mostrar nome do cliente na visita
3. Filtro de mes padrao ao entrar
4. Reportar erros de sincronizacao

Quando quiser gerar nova APK, avise que preparo o App.js corrigido.
