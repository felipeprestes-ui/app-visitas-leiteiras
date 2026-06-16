# PASSO A PASSO COMPLETO - ATUALIZAR PORTAL WEB + APP MOBILE

## RESUMO DAS CORRECOES

### Portal Web
- ✅ Nova visita: gera id automatico (corrige "null id")
- ✅ Nova venda: gera id automatico (corrige "null id")
- ✅ Editar tecnico: remove campo areas e normaliza area
- ✅ PDF com graficos: adiciona html2canvas + graficos recharts

### App Mobile
- ✅ Sincronizacao forcada: envia TODAS as visitas, nao apenas pendentes
- ✅ Nome cliente: preenche automaticamente ao salvar visita
- ✅ Agenda mostra tecnico: adicionado no card de agendamentos
- ✅ Filtro mes atual: gestor e tecnico iniciam no mes corrente

---

## PARTE 1: PORTAL WEB (3 arquivos)

### ARQUIVO 1: src/lib/supabase.ts

**URL para editar:** https://github.com/felipeprestes-ui/app-visitas-leiteiras/edit/main/src/lib/supabase.ts

**Passos:**
1. Acesse o link acima
2. Selecione TODO o conteudo (Ctrl+A) e apague
3. Cole o codigo abaixo EXATAMENTE:

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
  if (method === 'POST') {
    delete body.id;
    // Gera UUID automatico para insercao nova (Supabase exige id NOT NULL)
    body.local_id = body.local_id || crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Map portal fields back to Supabase columns (ONLY columns that exist in Supabase)
  const mapped = {
    id: body.local_id, // Usa local_id como id primario
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

4. Role para baixo, mensagem de commit: `Fix: gera id automatico + corrige tecnicos`
5. Clique **"Commit changes"**

---

### ARQUIVO 2: apps/web/package.json

**URL para editar:** https://github.com/felipeprestes-ui/app-visitas-leiteiras/edit/main/apps/web/package.json

**Passos:**
1. Acesse o link acima
2. Localize a secao `"dependencies"`
3. Adicione esta linha APOS `"date-fns": "^3.6.0",`:

```json
    "html2canvas": "^1.4.1",
```

4. A secao dependencies deve ficar assim:

```json
  "dependencies": {
    "date-fns": "^3.6.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "lucide-react": "^0.400.0",
    "next": "^14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7"
  },
```

5. Commit: `Add html2canvas para PDF com graficos`

---

### ARQUIVO 3: apps/web/src/app/relatorios/RelatoriosClient.tsx

**URL para editar:** https://github.com/felipeprestes-ui/app-visitas-leiteiras/edit/main/apps/web/src/app/relatorios/RelatoriosClient.tsx

**Passos:**
1. Acesse o link acima
2. Selecione TODO o conteudo (Ctrl+A) e apague
3. Cole o codigo completo (muito longo para colar aqui, mas posso gerar um arquivo separado)

**Alternativa mais facil:** Como este arquivo e muito grande, recomendo:
1. Baixar o arquivo do meu PC: `C:\Users\prestesf\Projects\app-visitas-leiteiras\apps\web\src\app\relatorios\RelatoriosClient.tsx`
2. Fazer upload direto no GitHub (Add file → Upload files)

---

## PARTE 2: APP MOBILE (1 arquivo)

### ARQUIVO: standalone/App.js

**Como subir:**
1. Vá em https://github.com/felipeprestes-ui/app-visitas-leiteiras
2. Clique **"Add file" → "Upload files"**
3. Selecione o arquivo `standalone/App.js` do meu PC
4. Commit: `Correcao app: sincronizacao forcada + nome tecnico + filtro mes`

**Como gerar APK:**
1. Vá em https://github.com/felipeprestes-ui/app-visitas-leiteiras/actions
2. Procure workflow **"Build APK"** ou **"Build Android"**
3. Clique em **"Run workflow"**
4. Aguarde ~5 minutos
5. Baixe a APK gerada na aba "Artifacts"

---

## PARTE 3: VERIFICAR DEPLOY

1. Acesse: https://github.com/felipeprestes-ui/app-visitas-leiteiras/actions
2. Aguarde todos os workflows ficarem verdes (✅)
3. Teste o portal: https://felipeprestes-ui.github.io/app-visitas-leiteiras/login

---

## PARTE 4: DISTRIBUIR APP

1. Envie a APK nova para os tecnicos via WhatsApp
2. Peça para instalarem por cima do app antigo
3. **IMPORTANTE**: Peça para cada tecnico apertar **"Sincronizar agora"**
4. Verifique se as visitas antigas aparecem no portal

---

## SUPABASE SQL (ja aplicado)

```sql
-- Gerar id automaticamente na tabela Visit
ALTER TABLE "Visit" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Liberar colunas de vendas
ALTER TABLE "monthly_sales" ALTER COLUMN "updatedAt" DROP NOT NULL;
ALTER TABLE "monthly_sales" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "monthly_sales" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "monthly_sales" ALTER COLUMN "createdAt" SET DEFAULT now();
```

---

Precisa que eu gere os arquivos como ZIP para download facil?
