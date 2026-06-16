import {
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
  private readonly accessExpiresIn = process.env.JWT_ACCESS_TTL ?? "15m";
  private readonly refreshTtlDays = Number(process.env.JWT_REFRESH_TTL_DAYS ?? "30");

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email
      }
    });

    if (!user || !user.active) {
      throw new UnauthorizedException("Credenciais invalidas.");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Credenciais invalidas.");
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let decoded: { sub: string };

    try {
      decoded = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.refreshSecret
      });
    } catch {
      throw new UnauthorizedException("Refresh token invalido.");
    }

    const storedTokens = await this.prismaService.refreshToken.findMany({
      where: {
        userId: decoded.sub,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const matchedToken = await this.findMatchingRefreshToken(storedTokens, refreshToken);

    if (!matchedToken) {
      throw new UnauthorizedException("Refresh token invalido.");
    }

    await this.prismaService.refreshToken.update({
      where: {
        id: matchedToken.id
      },
      data: {
        revokedAt: new Date()
      }
    });

    const user = await this.prismaService.user.findUnique({
      where: {
        id: decoded.sub
      }
    });

    if (!user || !user.active) {
      throw new UnauthorizedException("Usuario invalido.");
    }

    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new UnauthorizedException("Sessao invalida.");
    }

    return this.serializeUser(user);
  }

  private async issueTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: `${this.refreshTtlDays}d`
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prismaService.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: this.serializeUser(user)
    };
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      consultantArea: user.consultantArea
    };
  }

  private async findMatchingRefreshToken(
    storedTokens: Array<{ id: string; tokenHash: string }>,
    refreshToken: string
  ) {
    for (const storedToken of storedTokens) {
      const matched = await bcrypt.compare(refreshToken, storedToken.tokenHash);

      if (matched) {
        return storedToken;
      }
    }

    return null;
  }
}