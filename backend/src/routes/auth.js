const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, gestorOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        area: user.area,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// POST /auth/register - apenas gestor
router.post('/register', authMiddleware, gestorOnly, async (req, res) => {
  try {
    const { email, password, name, role, area, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome sao obrigatorios' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: 'Email ja cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'tecnico',
        area,
        phone,
      },
      select: { id: true, email: true, name: true, role: true, area: true, phone: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar usuario' });
  }
});

// POST /auth/setup - cria usuarios iniciais se o banco estiver vazio (sem autenticacao)
// Protegida por SETUP_SECRET para evitar uso indevido em producao.
router.post('/setup', async (req, res) => {
  try {
    const { secret } = req.body;
    const setupSecret = process.env.SETUP_SECRET;

    if (!setupSecret || secret !== setupSecret) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // So executa se nao existir nenhum gestor
    const existingGestor = await prisma.user.findFirst({ where: { role: 'gestor' } });
    if (existingGestor) {
      return res.status(409).json({ error: 'Usuarios ja existem. Use /auth/register para adicionar mais.', email: existingGestor.email });
    }

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

// POST /auth/setup-simple - cria usuarios iniciais SEM secret (temporario, remover depois)
router.post('/setup-simple', async (req, res) => {
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

// GET /auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, area: true, phone: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuario' });
  }
});

module.exports = router;
