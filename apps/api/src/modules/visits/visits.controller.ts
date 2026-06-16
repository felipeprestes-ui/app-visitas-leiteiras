import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { VisitsService } from "./visits.service";
import type { VisitPayload } from "./visit.types";

@Controller("visits")
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  list(@Query("technicianId") technicianId?: string) {
    return this.visitsService.list(technicianId);
  }

  @Post()
  create(@Body() body: VisitPayload) {
    return this.visitsService.create(body);
  }
}