import { Injectable } from "@nestjs/common";
import type { VisitPayload } from "./visit.types";

@Injectable()
export class VisitsService {
  list(technicianId?: string) {
    return {
      items: [],
      filters: {
        technicianId: technicianId ?? null
      }
    };
  }

  create(payload: VisitPayload) {
    return {
      id: "visit-seed-id",
      ...payload
    };
  }
}