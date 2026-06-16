import type { ClientType, ServiceType } from "@app/types";

export type VisitFormValues = {
  propertyId: string;
  herdSize: number;
  clientType: ClientType;
  serviceType: ServiceType;
  animalCount?: number;
  milkAverageLitersPerDay: number;
  lactatingAnimals: number;
  dealClosed: boolean;
  notes?: string;
};