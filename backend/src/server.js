require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Valida variaveis de ambiente criticas na inicializacao
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET nao configurado. Defina a variavel de ambiente JWT_SECRET.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL nao configurado. Defina a variavel de ambiente DATABASE_URL.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const visitsRoutes = require('./routes/visits');
const schedulesRoutes = require('./routes/schedules');
const clientsRoutes = require('./routes/clients');
const techsRoutes = require('./routes/techs');
const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');
const setupRoutes = require('./routes/setup');

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Auto-migration: cria/atualiza tabela monthly_sales
async function runMigrations() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "monthly_sales" (
        "id" TEXT NOT NULL,
        "month" TEXT NOT NULL,
        "dosesNovos" INTEGER NOT NULL,
        "dosesAtivos" INTEGER NOT NULL,
        "faturamentoNovos" DOUBLE PRECISION NOT NULL,
        "faturamentoAtivos" DOUBLE PRECISION NOT NULL,
        "updatedBy" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "monthly_sales_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "monthly_sales"
      ADD COLUMN IF NOT EXISTS "technicianName" TEXT NOT NULL DEFAULT '';
    `);

    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS "monthly_sales_month_key";
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "monthly_sales_month_technicianName_key"
      ON "monthly_sales"("month", "technicianName");
    `);

    console.log('[Migration] Tabela monthly_sales verificada/atualizada com sucesso');
  } catch (err) {
    console.error('[Migration] Erro ao atualizar tabela monthly_sales:', err.message);
  }
}

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API Visitas Leiteiras', version: '1.0.0' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/visits', visitsRoutes);
app.use('/schedules', schedulesRoutes);
app.use('/clients', clientsRoutes);
app.use('/techs', techsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/sales', salesRoutes);
app.use('/', setupRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server + run migrations
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await runMigrations();
});

module.exports = app;
