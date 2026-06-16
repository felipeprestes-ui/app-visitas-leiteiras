import { Controller, Get } from "@nestjs/common";
import { CatalogsService } from "./catalogs.service";

@Controller("catalogs")
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get("areas")
  getAreas() {
    return this.catalogsService.getAreas();
  }

  @Get("client-types")
  getClientTypes() {
    return this.catalogsService.getClientTypes();
  }

  @Get("service-types")
  getServiceTypes() {
    return this.catalogsService.getServiceTypes();
  }

  @Get("consultants")
  getConsultants() {
    return this.catalogsService.getConsultants();
  }
}