import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SyncService } from "./sync.service";
import { SyncPushDto } from "./sync.types";

@UseGuards(JwtAuthGuard)
@Controller("sync")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post("push")
  push(
    @Req() request: Request & { user: { sub: string } },
    @Body() body: SyncPushDto
  ) {
    return this.syncService.push(request.user.sub, body.items);
  }

  @Get("pull")
  pull(
    @Req() request: Request & { user: { sub: string } },
    @Query("since") since?: string
  ) {
    return this.syncService.pull(request.user.sub, since);
  }
}