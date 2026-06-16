export type UserRole = "tecnico" | "gestor";

export type ConsultantArea =
  | "011"
  | "012"
  | "013"
  | "014"
  | "015"
  | "018"
  | "019"
  | "020";

export type ClientType = "B" | "C" | "Conexao Leite" | "KAM" | "Lagoa+";

export type ServiceType =
  | "Clarifide Go"
  | "Curso IA"
  | "Coleta Herd"
  | "Entrega Herd"
  | "Indicacao Touro"
  | "Prospec"
  | "Prospec Lagoa+"
  | "SireMatch"
  | "Visita Lagoa+"
  | "Venda Herd";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  consultantArea?: ConsultantArea | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ClientRecord = {
  id: string;
  name: string;
  clientType: ClientType;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PropertyRecord = {
  id: string;
  clientId: string;
  name: string;
  consultantName: string;
  consultantArea: ConsultantArea;
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleStatus = "agendada" | "realizada" | "cancelada" | "reagendada";

export type ScheduleRecord = {
  id: string;
  propertyId: string;
  assignedUserId: string;
  createdByUserId: string;
  scheduledAt: string;
  status: ScheduleStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VisitRecord = {
  id: string;
  propertyId: string;
  technicianUserId: string;
  scheduleId?: string | null;
  herdSize: number;
  clientType: ClientType;
  serviceType: ServiceType;
  animalCount?: number | null;
  milkAverageLitersPerDay: number;
  lactatingAnimals: number;
  dealClosed: boolean;
  notes?: string | null;
  visitedAt: string;
  createdAt: string;
  updatedAt: string;
};