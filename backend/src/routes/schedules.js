const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /schedules
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, area, startDate, endDate } = req.query;

    const where = {};

    if (req.user.role === 'tecnico') {
      where.technicianId = req.user.id;
    } else {
      if (area) where.area = area;
    }

    if (status) where.status = status;

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate);
      if (endDate) where.scheduledAt.lte = new Date(endDate);
    }

    const [total, schedules] = await Promise.all([
      prisma.schedule.count({ where }),
      prisma.schedule.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          technician: { select: { id: true, name: true, area: true } },
        },
      }),
    ]);

    res.json({ total, page: Number(page), limit: Number(limit), data: schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar agendas' });
  }
});

// POST /schedules
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = req.body;

    if (req.user.role === 'tecnico') {
      data.technicianId = req.user.id;
      data.technicianName = req.user.name;
    }

    data.syncedAt = new Date();
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);

    const schedule = await prisma.schedule.create({ data });
    res.status(201).json(schedule);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Agenda com esse localId ja existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar agenda' });
  }
});

// PUT /schedules/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Agenda nao encontrada' });

    if (req.user.role === 'tecnico' && existing.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    data.syncedAt = new Date();
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
    delete data.id;

    const schedule = await prisma.schedule.update({ where: { id }, data });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar agenda' });
  }
});

// DELETE /schedules/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Agenda nao encontrada' });

    if (req.user.role === 'tecnico' && existing.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.schedule.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover agenda' });
  }
});

// POST /schedules/sync
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { schedules: localSchedules = [], lastSyncAt } = req.body;

    const results = { created: 0, updated: 0, errors: [] };

    for (const schedule of localSchedules) {
      try {
        const { localId, id: _id, ...scheduleData } = schedule;

        if (req.user.role === 'tecnico') {
          scheduleData.technicianId = req.user.id;
          scheduleData.technicianName = req.user.name;
        }

        scheduleData.syncedAt = new Date();
        if (scheduleData.scheduledAt) scheduleData.scheduledAt = new Date(scheduleData.scheduledAt);

        if (localId) {
          const existing = await prisma.schedule.findUnique({ where: { localId } });
          if (existing) {
            await prisma.schedule.update({ where: { localId }, data: scheduleData });
            results.updated++;
          } else {
            await prisma.schedule.create({ data: { ...scheduleData, localId } });
            results.created++;
          }
        } else {
          await prisma.schedule.create({ data: scheduleData });
          results.created++;
        }
      } catch (e) {
        results.errors.push({ localId: schedule.localId, error: e.message });
      }
    }

    const where = req.user.role === 'tecnico' ? { technicianId: req.user.id } : {};
    if (lastSyncAt) where.syncedAt = { gte: new Date(lastSyncAt) };

    const serverSchedules = await prisma.schedule.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: 500,
    });

    res.json({ ...results, serverSchedules, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na sincronizacao de agendas' });
  }
});

module.exports = router;
