const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, gestorOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /visits - gestor ve todas, tecnico ve as suas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, area, technicianId, startDate, endDate } = req.query;

    const where = {};

    // Tecnico so ve suas proprias visitas
    if (req.user.role === 'tecnico') {
      where.technicianId = req.user.id;
    } else {
      // Gestor pode filtrar por tecnico ou area
      if (technicianId) where.technicianId = technicianId;
      if (area) where.area = area;
    }

    if (startDate || endDate) {
      where.visitedAt = {};
      if (startDate) where.visitedAt.gte = new Date(startDate);
      if (endDate) where.visitedAt.lte = new Date(endDate);
    }

    const [total, visits] = await Promise.all([
      prisma.visit.count({ where }),
      prisma.visit.findMany({
        where,
        orderBy: { visitedAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          technician: { select: { id: true, name: true, area: true } },
        },
      }),
    ]);

    res.json({ total, page: Number(page), limit: Number(limit), data: visits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar visitas' });
  }
});

// POST /visits - criar visita
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = req.body;

    // Se tecnico, garante que é vinculado a ele
    if (req.user.role === 'tecnico') {
      data.technicianId = req.user.id;
      data.technicianName = req.user.name;
    }

    data.syncedAt = new Date();

    const visit = await prisma.visit.create({ data });
    res.status(201).json(visit);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Visita com esse localId ja existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar visita' });
  }
});

// PUT /visits/:id - atualizar visita
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.visit.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Visita nao encontrada' });

    // Tecnico so pode editar as proprias visitas
    if (req.user.role === 'tecnico' && existing.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    data.syncedAt = new Date();
    delete data.id;

    const visit = await prisma.visit.update({ where: { id }, data });
    res.json(visit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar visita' });
  }
});

// DELETE /visits/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.visit.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Visita nao encontrada' });

    if (req.user.role === 'tecnico' && existing.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.visit.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover visita' });
  }
});

// POST /visits/sync - sincronizacao em lote do mobile
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { visits: localVisits = [], lastSyncAt } = req.body;

    const results = { created: 0, updated: 0, errors: [] };

    for (const visit of localVisits) {
      try {
        const { localId, id: _id, ...visitData } = visit;

        if (req.user.role === 'tecnico') {
          visitData.technicianId = req.user.id;
          visitData.technicianName = req.user.name;
        }

        visitData.syncedAt = new Date();
        if (visitData.visitedAt) visitData.visitedAt = new Date(visitData.visitedAt);

        if (localId) {
          const existing = await prisma.visit.findUnique({ where: { localId } });
          if (existing) {
            await prisma.visit.update({ where: { localId }, data: visitData });
            results.updated++;
          } else {
            await prisma.visit.create({ data: { ...visitData, localId } });
            results.created++;
          }
        } else {
          await prisma.visit.create({ data: visitData });
          results.created++;
        }
      } catch (e) {
        results.errors.push({ localId: visit.localId, error: e.message });
      }
    }

    // Retorna visitas atualizadas do servidor desde a ultima sincronizacao
    const where = req.user.role === 'tecnico' ? { technicianId: req.user.id } : {};
    if (lastSyncAt) {
      where.syncedAt = { gte: new Date(lastSyncAt) };
    }

    const serverVisits = await prisma.visit.findMany({
      where,
      orderBy: { syncedAt: 'desc' },
      take: 500,
    });

    res.json({ ...results, serverVisits, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na sincronizacao' });
  }
});

module.exports = router;
