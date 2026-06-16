export interface Visit {
  id: string;
  technician_name: string;
  client_name: string;
  service_type: string;
  area: string;
  client_type: string;
  animals: number | null;
  deal_closed: boolean;
  herd_size: number | null;
  consultant: string | null;
  notes: string;
  date: string;
  doses_convencional?: number | null;
  doses_sexado?: number | null;
  pending_sync?: boolean;
  sync_error?: string | null;
  local_id?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface MonthlySale {
  id: string;
  month: string;
  technicianName: string;
  dosesNovos: number;
  dosesAtivos: number;
  faturamentoNovos: number;
  faturamentoAtivos: number;
  meta: number;
  updatedBy?: string;
}

export interface TechUser {
  id: string;
  name: string;
  email: string;
  area: string | null;
  areas: string[] | null;
  role: string;
  phone?: string | null;
  active?: boolean;
  login?: string;
  password?: string;
  createdAt?: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  technician_name?: string | null;
  area?: string | null;
}

export interface GestorSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ScheduleItem {
  id: string;
  technician_name: string;
  title: string;
  property_name: string;
  scheduled_date: string;
  area: string;
  notes: string;
}

export type ClientType = 'B' | 'C' | 'Conexao Leite' | 'KAM' | 'Lagoa+';
export type ServiceType =
  | 'Clarifide Go'
  | 'Curso IA'
  | 'Coleta Herd'
  | 'Entrega Herd'
  | 'Indicacao Touro'
  | 'Prospec'
  | 'Prospec Lagoa+'
  | 'SireMatch'
  | 'Visita Lagoa+'
  | 'Venda Herd';

export const AREAS = ['011', '012', '013', '014', '015', '018', '019', '020'] as const;

export const CLIENT_TYPES: ClientType[] = ['B', 'C', 'Conexao Leite', 'KAM', 'Lagoa+'];

export const SERVICE_TYPES: ServiceType[] = [
  'Clarifide Go',
  'Curso IA',
  'Coleta Herd',
  'Entrega Herd',
  'Indicacao Touro',
  'DPS',
  'Prospec',
  'Prospec Lagoa+',
  'Silagem',
  'SireMatch',
  'Visita Lagoa+',
  'Venda Herd',
];

export const MONTHS = [
  { label: 'Set/25', value: '8-2025' },
  { label: 'Out/25', value: '9-2025' },
  { label: 'Nov/25', value: '10-2025' },
  { label: 'Dez/25', value: '11-2025' },
  { label: 'Jan/26', value: '0-2026' },
  { label: 'Fev/26', value: '1-2026' },
  { label: 'Mar/26', value: '2-2026' },
  { label: 'Abr/26', value: '3-2026' },
  { label: 'Mai/26', value: '4-2026' },
  { label: 'Jun/26', value: '5-2026' },
];

export const CONSULTORES: Record<string, string[]> = {
  '011': ['ELVIS G S LOPES','FERNANDO HENRIQ','FRANCISCO HENRI','FREDERICO ARANT','GIVANILDO JACIN','JEFFERSON','JEFFERSON DOS S','JOAO MACHADO','JUAREZ','JUSCELIO RAIMUN','LEANDRO VILELLA','LEONARDO TUFI','LUCAS DUARTE','LUCAS GONCALVES','LUCAS SIQUEIRA','LUIS HUMBERTO R','MURILO CANEDO','PAULO GARCIA SI','PAULO SOUSA','RAFAEL AUGUSTO','RICARDO BONATO','VILTON MODESTO','VINICIUS JOSE','VINICIUS MARTIN','VIRGILIO RODRIG','WILLY JOSE DE','WILSON VAGNER V'],
  '012': ['ANNY QUEIROZ SI','BRUNO FONSECA','CARLOS (SP)','CEZAR','EDUARDO SOARES','FABIO PACHECO','FELIPE SCARDUA','FERNANDO MOREIR','HUGO LEONARDO','JOAO ANT GUEDES','JOAO PEDRO MELO','JOSE RAIMUNDO','LEONARDO SOARES','LUCAS VALERIANO','LUCIANO FERREIR','LUIS HENRIQUE','MARIO CEZAR','MAYCON CEZAR','MIGUEL HADDAD','RODRIGO LIMA','RODRIGO PIVARI','RONALD DIAS TRO','VITOR','WLADIMIR LEON'],
  '013': ['ALEXANDRE MAZZO','DALTON LUIZ DE','FELIPE GUIZELIN','FERNANDO MANICA','JOSE ROB RANGEL','JOSE ROSA FILHO','LEANDRO PAVANEL','LEONARDO GODOY','MARCEL BERTONHA','MARINA PIPERAS','MARLON COSTA','NAUR SOUZA','OSVADO DE LAB.J','PAULO CEZAR OLI','PAULO SERGIO G','RAFAEL BRUNO','RAFAEL JOSE DE','RENATA','VALSAIR DE MATO','VINICIUS GABRIE','WILSON MARIANO'],
  '014': ['ALESSANDRO MAGN','ALEXANDRE TENOR','ANGELO ANTONELL','BRUNO CERQUEIRA','CELIO THEODORO','DARLAN DORIGHET','ELMO','ELTON MATOS','EVERTON DO PATR','FERNANDO F.','FRANCISCO OCTAV','GABRYEL TEIXEIR','GENILDO BORGES','ITAMAR','JAIR MILANEZI','JALMIR DANIEL S','JOAO DIOGO NETO','JORGE GOMES','JOSE A TENORIO','JOSE C BAMBINI','JOSE CLAUDIO','JUAREZ PEDRO DO','LAIR GABRIEL','MARCOS FIEL','NATALIA ANTONEL','PAULO GUSTAVO','ROBERTO GREG.','ROBSON RODRIGUE','RODOLFO REIS AL','SINARA MARTINS','THIAGO NOGUEIRA','UZIEL AMARAL','VALTER ALMEIDA','VITOR ALMEIDA'],
  '015': ['ALEXANDRE CEZER','ANDRE SOLEK MAC','CLAITON','DENILSON SEIDEL','EDUARDO MONT.','EDUARDO TOSHIHI','EMERSON HENRI','EVANDRO TELLES','FABIO (PR)','FILIPE ROPELATO','GUILHERME ROCHA','JEAN MICHEL ROT','KEVELAN ALMEIDA','KOURBANY LUIZ C','LAUDEMIR','LOURIAN TELEGIN','RAFAEL RUZA','RONALDO ROSA','VINICIUS MUCHIN'],
  '018': ['ALEX BRANDALISE','ANDRES HAURERS','DARLAN CARLETI','DIEGO BORBA MUL','EDUARDO LUIZ','EVANDRO','FRANCIANO','FREDERICO DE ME','FREDERICO GUERR','GUILHERME RODRI','HUGO FILHO','JOAO THOMAZ','LEANDRO GRAFF','LUCAS RUAS','LUCIANO WEBER','LUIS PANIZ','LUIZ AUGUSTO','LUIZ FELIPE','MARCELO BECKER','MARIANY DA PAIX','MAURICIO PINTO','RENAN MARSARO','RENAN MOROSSINO','RICARDO MOREIRA','RODRIGO BORGES'],
  '019': ['ADRIANO BOLOGNE','ADRIELLY LOPES','ALEXANDRE LOUZA','ANDRE HENRIQUE','BRENO DIAS','CASSIO ROBERTO','DANIEL GUSTAVO','EDIVALDO BATIST','EDIVAN','EVANILDO NUNES','FABER MONTEIRO','FABRICIO GARCES','GUSTAVO HENRIQU','IGOR/PAULO','IODOMIR CARVALH','ISMAEL DOS SANT','MAYLON DIOGO','MOACIIR DUARTE','NICOLE COLUCCI','PAULO HENRIQUE','RAI DAMASCENO E','RAYCON ROBERTO','RODRIGO ALMEIDA','WAGNER PESCA'],
  '020': ['ALOYSIO FRANCA','ANDERSON JOSE','ANDRE CARREIRA','ARTHUR NEGRAO','CLAUDIO FELIPE','DIEGO MOURA','EDUARDO FURTADO','FELIPE NAIS','GILMAR','GUSTAVO AMERICO','GUSTAVO ANDRADE','JALES','JULIANO MACHADO','JUNIOR ALVES','LUCAS DE SOUSA','LUCIANO ILTON','LUIZ HARLITON C','MARCELO CARNEIR','MARCOS VINICIUS','MAX MARIANO','OLICIO BATISTA','PAULO BARROS','PAULO NASCIPE','RAAFAEL VERNER H','ROBSON DA SILVA','RUBENS RUDRIGUE','THAYMISSON LIRA','THIAGO RESENDE'],
};
