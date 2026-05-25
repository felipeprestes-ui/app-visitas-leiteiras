require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const visitsRoutes = require('./routes/visits');
const schedulesRoutes = require('./routes/schedules');
const clientsRoutes = require('./routes/clients');
const techsRoutes = require('./routes/techs');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
