CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "consultantArea" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "clientType" TEXT NOT NULL,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Property" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "consultantName" TEXT NOT NULL,
  "consultantArea" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Schedule" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "assignedUserId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Visit" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "technicianUserId" TEXT NOT NULL,
  "scheduleId" TEXT,
  "herdSize" INTEGER NOT NULL,
  "clientType" TEXT NOT NULL,
  "serviceType" TEXT NOT NULL,
  "animalCount" INTEGER,
  "milkAverageLitersPerDay" DOUBLE PRECISION NOT NULL,
  "lactatingAnimals" INTEGER NOT NULL,
  "dealClosed" BOOLEAN NOT NULL,
  "notes" TEXT,
  "visitedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RefreshToken"
ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Property"
ADD CONSTRAINT "Property_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Schedule"
ADD CONSTRAINT "Schedule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Schedule"
ADD CONSTRAINT "Schedule_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Schedule"
ADD CONSTRAINT "Schedule_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Visit"
ADD CONSTRAINT "Visit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Visit"
ADD CONSTRAINT "Visit_technicianUserId_fkey" FOREIGN KEY ("technicianUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Visit"
ADD CONSTRAINT "Visit_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;