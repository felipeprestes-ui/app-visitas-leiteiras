import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SyncItemDto } from "./sync.types";

@Injectable()
export class SyncService {
  constructor(private readonly prismaService: PrismaService) {}

  async push(userId: string, items: SyncItemDto[]) {
    const results = [];

    for (const item of items) {
      const record = item.record as Record<string, unknown> & { id: string };

      if (item.entityType === "client") {
        const saved = await this.prismaService.client.upsert({
          where: {
            id: record.id
          },
          create: {
            id: record.id,
            name: String(record.name),
            clientType: String(record.clientType),
            phone: record.phone ? String(record.phone) : null
          },
          update: {
            name: String(record.name),
            clientType: String(record.clientType),
            phone: record.phone ? String(record.phone) : null
          }
        });

        results.push({
          localId: item.localId,
          remoteId: saved.id,
          entityType: item.entityType,
          status: "synced"
        });
        continue;
      }

      if (item.entityType === "property") {
        const saved = await this.prismaService.property.upsert({
          where: {
            id: record.id
          },
          create: {
            id: record.id,
            clientId: String(record.clientId),
            name: String(record.name),
            consultantName: String(record.consultantName),
            consultantArea: String(record.consultantArea),
            latitude: Number(record.latitude),
            longitude: Number(record.longitude),
            address: record.address ? String(record.address) : null,
            city: record.city ? String(record.city) : null,
            state: record.state ? String(record.state) : null
          },
          update: {
            clientId: String(record.clientId),
            name: String(record.name),
            consultantName: String(record.consultantName),
            consultantArea: String(record.consultantArea),
            latitude: Number(record.latitude),
            longitude: Number(record.longitude),
            address: record.address ? String(record.address) : null,
            city: record.city ? String(record.city) : null,
            state: record.state ? String(record.state) : null
          }
        });

        results.push({
          localId: item.localId,
          remoteId: saved.id,
          entityType: item.entityType,
          status: "synced"
        });
        continue;
      }

      if (item.entityType === "schedule") {
        const saved = await this.prismaService.schedule.upsert({
          where: {
            id: record.id
          },
          create: {
            id: record.id,
            propertyId: String(record.propertyId),
            assignedUserId: record.assignedUserId ? String(record.assignedUserId) : userId,
            createdByUserId: record.createdByUserId ? String(record.createdByUserId) : userId,
            scheduledAt: new Date(String(record.scheduledAt)),
            status: record.status ? String(record.status) : "agendada",
            notes: record.notes ? String(record.notes) : null
          },
          update: {
            propertyId: String(record.propertyId),
            assignedUserId: record.assignedUserId ? String(record.assignedUserId) : userId,
            scheduledAt: new Date(String(record.scheduledAt)),
            status: record.status ? String(record.status) : "agendada",
            notes: record.notes ? String(record.notes) : null
          }
        });

        results.push({
          localId: item.localId,
          remoteId: saved.id,
          entityType: item.entityType,
          status: "synced"
        });
        continue;
      }

      if (item.entityType === "visit") {
        const saved = await this.prismaService.visit.upsert({
          where: {
            id: record.id
          },
          create: {
            id: record.id,
            propertyId: String(record.propertyId),
            technicianUserId: record.technicianUserId ? String(record.technicianUserId) : userId,
            herdSize: Number(record.herdSize),
            clientType: String(record.clientType),
            serviceType: String(record.serviceType),
            animalCount: record.animalCount ? Number(record.animalCount) : null,
            milkAverageLitersPerDay: Number(record.milkAverageLitersPerDay),
            lactatingAnimals: Number(record.lactatingAnimals),
            dealClosed: Boolean(record.dealClosed),
            notes: record.notes ? String(record.notes) : null,
            visitedAt: new Date(String(record.visitedAt)),
            scheduleId: record.scheduleId ? String(record.scheduleId) : null
          },
          update: {
            propertyId: String(record.propertyId),
            herdSize: Number(record.herdSize),
            clientType: String(record.clientType),
            serviceType: String(record.serviceType),
            animalCount: record.animalCount ? Number(record.animalCount) : null,
            milkAverageLitersPerDay: Number(record.milkAverageLitersPerDay),
            lactatingAnimals: Number(record.lactatingAnimals),
            dealClosed: Boolean(record.dealClosed),
            notes: record.notes ? String(record.notes) : null,
            visitedAt: new Date(String(record.visitedAt)),
            scheduleId: record.scheduleId ? String(record.scheduleId) : null
          }
        });

        results.push({
          localId: item.localId,
          remoteId: saved.id,
          entityType: item.entityType,
          status: "synced"
        });
      }
    }

    return {
      syncedAt: new Date().toISOString(),
      results
    };
  }

  async pull(userId: string, since?: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId
      }
    });

    const sinceDate = since ? new Date(since) : new Date(0);

    const clients = await this.prismaService.client.findMany({
      where: {
        updatedAt: {
          gte: sinceDate
        }
      },
      orderBy: {
        updatedAt: "asc"
      }
    });

    const properties = await this.prismaService.property.findMany({
      where: {
        updatedAt: {
          gte: sinceDate
        }
      },
      orderBy: {
        updatedAt: "asc"
      }
    });

    const schedules = await this.prismaService.schedule.findMany({
      where: {
        updatedAt: {
          gte: sinceDate
        },
        ...(user?.role === "tecnico"
          ? {
              assignedUserId: userId
            }
          : {})
      },
      orderBy: {
        updatedAt: "asc"
      }
    });

    const visits = await this.prismaService.visit.findMany({
      where: {
        updatedAt: {
          gte: sinceDate
        },
        ...(user?.role === "tecnico"
          ? {
              technicianUserId: userId
            }
          : {})
      },
      orderBy: {
        updatedAt: "asc"
      }
    });

    return {
      syncedAt: new Date().toISOString(),
      clients,
      properties,
      schedules,
      visits
    };
  }
}