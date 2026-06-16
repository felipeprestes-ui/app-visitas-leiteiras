import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const manager = await prisma.user.upsert({
    where: {
      email: "gestor@visitasleiteiras.com"
    },
    create: {
      id: "user-gestor-seed",
      name: "Gestor Base",
      email: "gestor@visitasleiteiras.com",
      passwordHash,
      role: "gestor",
      active: true
    },
    update: {
      name: "Gestor Base",
      passwordHash,
      role: "gestor",
      active: true
    }
  });

  const technician = await prisma.user.upsert({
    where: {
      email: "tecnico@visitasleiteiras.com"
    },
    create: {
      id: "user-tecnico-seed",
      name: "Lucas Siqueira",
      email: "tecnico@visitasleiteiras.com",
      passwordHash,
      role: "tecnico",
      consultantArea: "011",
      active: true
    },
    update: {
      name: "Lucas Siqueira",
      passwordHash,
      role: "tecnico",
      consultantArea: "011",
      active: true
    }
  });

  const client = await prisma.client.upsert({
    where: {
      id: "client-seed-001"
    },
    create: {
      id: "client-seed-001",
      name: "Fazenda Boa Esperanca",
      clientType: "B"
    },
    update: {
      name: "Fazenda Boa Esperanca",
      clientType: "B"
    }
  });

  const property = await prisma.property.upsert({
    where: {
      id: "property-seed-001"
    },
    create: {
      id: "property-seed-001",
      clientId: client.id,
      name: "Unidade Principal",
      consultantName: technician.name,
      consultantArea: technician.consultantArea ?? "011",
      latitude: -18.9186,
      longitude: -48.2772,
      city: "Uberlandia",
      state: "MG"
    },
    update: {
      clientId: client.id,
      name: "Unidade Principal",
      consultantName: technician.name,
      consultantArea: technician.consultantArea ?? "011",
      latitude: -18.9186,
      longitude: -48.2772,
      city: "Uberlandia",
      state: "MG"
    }
  });

  await prisma.schedule.upsert({
    where: {
      id: "schedule-seed-001"
    },
    create: {
      id: "schedule-seed-001",
      propertyId: property.id,
      assignedUserId: technician.id,
      createdByUserId: manager.id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "agendada",
      notes: "Agenda inicial para teste do tecnico"
    },
    update: {
      propertyId: property.id,
      assignedUserId: technician.id,
      createdByUserId: manager.id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "agendada",
      notes: "Agenda inicial para teste do tecnico"
    }
  });
}

seed()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });