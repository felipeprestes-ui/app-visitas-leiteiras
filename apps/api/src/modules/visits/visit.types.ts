export type VisitPayload = {
  propertyId: string;
  herdSize: number;
  clientType: string;
  serviceType: string;
  animalCount?: number;
  milkAverageLitersPerDay: number;
  lactatingAnimals: number;
  dealClosed: boolean;
  notes?: string;
};