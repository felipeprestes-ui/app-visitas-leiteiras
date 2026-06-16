import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { CatalogsModule } from "./catalogs/catalogs.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SyncModule } from "./sync/sync.module";
import { VisitsModule } from "./visits/visits.module";

@Module({
  imports: [PrismaModule, AuthModule, CatalogsModule, VisitsModule, SyncModule]
})
export class AppModule {}