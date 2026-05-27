require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

// Rota temporaria para popular banco (SEM autenticacao)
app.post('/setup-db', async (req, res) => {
  try {
    const USERS = [
      { email: 'gestor@crv4all.com.br',    password: '123456', name: 'Felipe Prestes',    role: 'gestor',  area: null },
      { email: 'cesar@crv4all.com.br',     password: '123456', name: 'Cesar Oliveira',     role: 'tecnico', area: '20' },
      { email: 'erica@crv4all.com.br',     password: '123456', name: 'Erica Fonseca',      role: 'tecnico', area: '12' },
      { email: 'henrique@crv4all.com.br',  password: '123456', name: 'Henrique Froehlich', role: 'tecnico', area: null },
      { email: 'leandro@crv4all.com.br',   password: '123456', name: 'Leandro Teixeira',   role: 'tecnico', area: '15' },
      { email: 'prestes@crv4all.com.br',   password: '123456', name: 'Felipe Prestes',     role: 'tecnico', area: '15' },
      { email: 'phillippe@crv4all.com.br', password: '123456', name: 'Phillippe Monteiro', role: 'tecnico', area: '18' },
    ];

    const created = [];
    for (const u of USERS) {
      const hashed = await bcrypt.hash(u.password, 10);
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { password: hashed, name: u.name, role: u.role, area: u.area, active: true },
        create: { email: u.email, password: hashed, name: u.name, role: u.role, area: u.area, active: true },
        select: { email: true, name: true, role: true, area: true },
      });
      created.push(user);
    }

    res.status(201).json({ message: 'Usuarios criados com sucesso', users: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao inicializar usuarios' });
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/visits', visitsRoutes);
app.use('/schedules', schedulesRoutes);
app.use('/clients', clientsRoutes);
app.use('/techs', techsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/sales', salesRoutes);

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
