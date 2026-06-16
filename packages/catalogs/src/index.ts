import type { ClientType, ConsultantArea, ServiceType } from "@app/types";

export const consultantAreas: ConsultantArea[] = [
  "011",
  "012",
  "013",
  "014",
  "015",
  "018",
  "019",
  "020"
];

export const clientTypes: ClientType[] = [
  "B",
  "C",
  "Conexao Leite",
  "KAM",
  "Lagoa+"
];

export const serviceTypes: ServiceType[] = [
  "Clarifide Go",
  "Curso IA",
  "Coleta Herd",
  "Entrega Herd",
  "Indicacao Touro",
  "Prospec",
  "Prospec Lagoa+",
  "SireMatch",
  "Visita Lagoa+",
  "Venda Herd"
];

export const consultantsByArea: Record<ConsultantArea, string[]> = {
  "011": ["Lucas Siqueira", "Murilo Canedo", "Juarez"],
  "012": ["Leonardo Soares", "Lucas Valeriano", "Jose Raimundo", "Eduardo Soares"],
  "013": ["Fernando Manica", "Renata"],
  "014": ["Thiago Nogueira", "Jose A Tenorio", "Marcos Fiel", "Elmo", "Jalmir Daniel S", "Fernando F."],
  "015": ["Kevelan Almeida", "Kourbany Luiz C"],
  "018": ["Andres Hauers", "Frederico Guerr", "Mauricio Pinto"],
  "019": ["Faber Monteiro", "Moaciir Duarte", "Rodrigo Almeida", "Edivan", "Paulo Henrique"],
  "020": ["Gustavo Andrade", "Junior Alves", "Rubens Rudrigue", "Gustavo Americo", "Paulo Barros", "Raafel Verner H", "Thaymisson Lira", "Robson da Silva", "Luiz Harliton C"]
};