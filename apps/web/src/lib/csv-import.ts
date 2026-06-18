import type { Visit } from '@/types/portal';

export interface CSVError {
  line: number;
  message: string;
  raw: Record<string, string>;
}

export interface CSVParseResult {
  visits: Partial<Visit>[];
  errors: CSVError[];
}

function normalizeStr(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const MONTH_ALIASES: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

function parseDate(s: string): string {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; // já ISO
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(t)) {
    const [d, m, y] = t.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Formato: fev-26, mar-26, jan/25, out 2025 etc.
  const mesAnoMatch = t.match(/^([a-z]+)[-/.\s]?(\d{2,4})$/i);
  if (mesAnoMatch) {
    const [, mesStr, anoStr] = mesAnoMatch;
    const mes = MONTH_ALIASES[normalizeStr(mesStr)];
    if (mes !== undefined) {
      const ano = anoStr.length === 2 ? '20' + anoStr : anoStr;
      const mesNum = String(mes + 1).padStart(2, '0');
      return `${ano}-${mesNum}-01`;
    }
  }
  return t;
}

function parseBool(v: string): boolean | null {
  const t = normalizeStr(v);
  if (['sim', 's', '1', 'true'].includes(t)) return true;
  if (['nao', 'n', '0', 'false'].includes(t)) return false;
  return null;
}

function parseIntOrNull(v: string): number | null {
  const n = Number(v.trim().replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseHeader(rawHeaders: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    date: ['data', 'date', 'data da visita', 'mes visita', 'mes'],
    technician_name: ['tecnico', 'tecnico responsavel', 'responsavel', 'nome do tecnico', 'especialista'],
    client_name: ['cliente', 'nome do cliente', 'cliente nome'],
    city: ['cidade'],
    area: ['area'],
    client_type: ['tipo de cliente', 'tipo cliente', 'client_type'],
    service_type: ['servico', 'tipo de servico', 'service_type', 'objetivo', 'atividade', 'servico realizado'],
    animals: ['animais', 'qtd animais', 'quantidade animais', 'n animais fazenda'],
    herd_size: ['rebanho', 'qtd rebanho', 'quantidade rebanho', 'tamanho rebanho', 'n animais pessoas atendida', 'pessoas atendida'],
    deal_closed: ['fechado', 'negocio fechado', 'deal_closed', 'negocio', 'fechado negocio'],
    consultant: ['consultor'],
    doses_convencional: ['doses convencional', 'doses conv', 'dosesconvencional'],
    doses_sexado: ['doses sexado', 'doses sx', 'dosessexado'],
    notes: ['notas', 'observacoes', 'observação', 'note'],
  };

  for (let i = 0; i < rawHeaders.length; i++) {
    const normalized = normalizeStr(rawHeaders[i]);
    for (const [field, possible] of Object.entries(aliases)) {
      if (map[field] === undefined && possible.some((p) => normalized.includes(p))) {
        map[field] = i;
      }
    }
  }
  return map;
}

function parseLine(
  row: string[],
  colMap: Record<string, number>,
  lineNum: number
): { visit?: Partial<Visit>; error?: CSVError } {
  const get = (key: string): string => {
    const idx = colMap[key];
    return idx !== undefined ? (row[idx] ?? '') : '';
  };

  const dateRaw = get('date');
  const date = parseDate(dateRaw);
  const technician_name = get('technician_name').trim();
  const client_name = get('client_name').trim();

  const errors: string[] = [];
  if (!dateRaw.trim()) errors.push('Data é obrigatória');
  if (!technician_name) errors.push('Técnico é obrigatório');
  if (!client_name) errors.push('Cliente é obrigatório');

  if (errors.length > 0) {
    return {
      error: {
        line: lineNum,
        message: errors.join('; '),
        raw: row.reduce((acc, val, idx) => {
          acc[`col_${idx}`] = val;
          return acc;
        }, {} as Record<string, string>),
      },
    };
  }

  const deal_closed_val = get('deal_closed');
  let deal_closed: boolean | undefined = undefined;
  if (deal_closed_val.trim()) {
    const parsed = parseBool(deal_closed_val);
    if (parsed !== null) deal_closed = parsed;
  }

  const visit: Partial<Visit> = {
    date,
    technician_name,
    client_name,
    city: get('city').trim() || null,
    area: get('area').trim() || '',
    client_type: get('client_type').trim() || '',
    service_type: get('service_type').trim() || '',
    animals: parseIntOrNull(get('animals')),
    herd_size: parseIntOrNull(get('herd_size')),
    deal_closed,
    consultant: get('consultant').trim() || null,
    notes: get('notes').trim() || '',
  };

  return { visit };
}

function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export function parseCSVContent(content: string): CSVParseResult {
  const lines = content.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2)
    return { visits: [], errors: [{ line: 0, message: 'Arquivo CSV vazio ou sem dados', raw: {} }] };

  const delimiter = detectDelimiter(lines[0]);
  const header = splitCSVLine(lines[0], delimiter);
  const colMap = parseHeader(header);
  const visits: Partial<Visit>[] = [];
  const errors: CSVError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i], delimiter);
    if (row.every((c) => c.trim() === '')) continue;
    const res = parseLine(row, colMap, i + 1);
    if (res.visit) visits.push(res.visit);
    if (res.error) errors.push(res.error);
  }

  return { visits, errors };
}

export function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        resolve(parseCSVContent(text));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
}
