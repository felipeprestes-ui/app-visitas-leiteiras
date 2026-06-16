import { Injectable } from "@nestjs/common";
import {
  clientTypes,
  consultantAreas,
  consultantsByArea,
  serviceTypes
} from "@app/catalogs";

@Injectable()
export class CatalogsService {
  getAreas() {
    return consultantAreas;
  }

  getClientTypes() {
    return clientTypes;
  }

  getServiceTypes() {
    return serviceTypes;
  }

  getConsultants() {
    return consultantsByArea;
  }
}