const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, gestorOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /sales - cria ou atualiza dados de um mes (gestor only)
router.post('/', authMiddleware, gestorOnly, async (req, res) => {
  try {
    const { month, technicianName, dosesNovos, dosesAtivos, faturamentoNovos, faturamentoAtivos } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Campo "month" obrigatorio no formato YYYY-MM' });
    }
    if (!technicianName) {
      return res.status(400).json({ error: 'Campo "technicianName" obrigatorio' });
    }
    if (dosesNovos === undefined || dosesAtivos === undefined) {
      return res.status(400).json({ error: 'Campos dosesNovos e dosesAtivos sao obrigatorios' });
    }
    if (faturamentoNovos === undefined || faturamentoAtivos === undefined) {
      return res.status(400).json({ error: 'Campos faturamentoNovos e faturamentoAtivos sao obrigatorios' });
    }

    const record = await prisma.monthlySales.upsert({
      where: { month_technicianName: { month, technicianName } },
      update: {
        dosesNovos: parseInt(dosesNovos),
        dosesAtivos: parseInt(dosesAtivos),
        faturamentoNovos: parseFloat(faturamentoNovos),
        faturamentoAtivos: parseFloat(faturamentoAtivos),
        updatedBy: req.user.name,
      },
      create: {
        month,
        technicianName,
        dosesNovos: parseInt(dosesNovos),
        dosesAtivos: parseInt(dosesAtivos),
        faturamentoNovos: parseFloat(faturamentoNovos),
        faturamentoAtivos: parseFloat(faturamentoAtivos),
        updatedBy: req.user.name,
      },
    });

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar dados de vendas' });
  }
});

// GET /sales/:month - retorna dados de um mes especifico
router.get('/:month', authMiddleware, async (req, res) => {
  try {
    const { month } = req.params;
    const { technicianName } = req.query;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Formato de mes invalido. Use YYYY-MM' });
    }

    if (technicianName) {
      const record = await prisma.monthlySales.findUnique({
        where: { month_technicianName: { month, technicianName } },
      });
      if (!record) {
        return res.status(404).json({ error: 'Dados nao encontrados para este mes e tecnico' });
      }
      return res.json(record);
    }

    const records = await prisma.monthlySales.findMany({
      where: { month },
      orderBy: { technicianName: 'asc' },
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados de vendas' });
  }
});

// GET /sales - lista todos os meses ordenados por month desc
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { technicianName } = req.query;
    const where = technicianName ? { technicianName } : {};
    const records = await prisma.monthlySales.findMany({
      where,
      orderBy: { month: 'desc' },
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar dados de vendas' });
  }
});

module.exports = router;
