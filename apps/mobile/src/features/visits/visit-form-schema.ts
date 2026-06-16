import { serviceTypes } from "@app/catalogs";
import type { ClientType, ServiceType } from "@app/types";
import type { VisitFormValues } from "./types";

export const visitServiceTypesRequiringAnimalCount: ServiceType[] = [
  "SireMatch",
  "Coleta Herd",
  "Venda Herd"
];

export function validateVisitForm(form: VisitFormValues) {
  const errors: string[] = [];

  if (!form.propertyId) {
    errors.push("Selecione a propriedade.");
  }

  if (form.herdSize <= 0) {
    errors.push("Informe o número do rebanho.");
  }

  if (!serviceTypes.includes(form.serviceType)) {
    errors.push("Serviço realizado inválido.");
  }

  if (!isClientType(form.clientType)) {
    errors.push("Tipo de cliente inválido.");
  }

  if (visitServiceTypesRequiringAnimalCount.includes(form.serviceType)) {
    if (!form.animalCount || form.animalCount <= 0) {
      errors.push("Informe o número de animais para este serviço.");
    }
  }

  if (form.milkAverageLitersPerDay <= 0) {
    errors.push("Informe a produção média de leite.");
  }

  if (form.lactatingAnimals <= 0) {
    errors.push("Informe os animais em lactação.");
  }

  if (errors.length > 0) {
    return {
      success: false as const,
      errors
    };
  }

  return {
    success: true as const,
    data: form
  };
}

function isClientType(value: string): value is ClientType {
  return ["B", "C", "Conexao Leite", "KAM", "Lagoa+"].includes(value);
}