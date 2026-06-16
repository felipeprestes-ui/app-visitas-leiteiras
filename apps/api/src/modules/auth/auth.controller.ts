import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("refresh")
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() request: Request & { user: { sub: string } }) {
    return this.authService.me(request.user.sub);
  }
}