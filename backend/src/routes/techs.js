const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, gestorOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /techs - listar tecnicos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { area } = req.query;
    const where = { role: 'tecnico' };
    if (area) where.area = area;

    const techs = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, area: true, phone: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    res.json(techs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar tecnicos' });
  }
});

// POST /techs - criar tecnico (gestor only)
router.post('/', authMiddleware, gestorOnly, async (req, res) => {
  try {
    const { email, password, name, area, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome sao obrigatorios' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: 'Email ja cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const tech = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: 'tecnico', area, phone },
      select: { id: true, email: true, name: true, role: true, area: true, phone: true, createdAt: true },
    });

    res.status(201).json(tech);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar tecnico' });
  }
});

// PUT /techs/:id - atualizar tecnico (gestor only)
router.put('/:id', authMiddleware, gestorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, area, phone, active, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Tecnico nao encontrado' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (area !== undefined) updateData.area = area;
    if (phone !== undefined) updateData.phone = phone;
    if (active !== undefined) updateData.active = active;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const tech = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, area: true, phone: true, active: true, createdAt: true },
    });

    res.json(tech);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar tecnico' });
  }
});

module.exports = router;
