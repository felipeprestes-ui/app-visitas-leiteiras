const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, gestorOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /clients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 100, area, search } = req.query;

    const where = {};
    if (area) where.area = area;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { propertyName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
    ]);

    res.json({ total, page: Number(page), limit: Number(limit), data: clients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// POST /clients
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const client = await prisma.client.create({ data });
    res.status(201).json(client);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Cliente com esse localId ja existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT /clients/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Cliente nao encontrado' });

    const client = await prisma.client.update({ where: { id }, data });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// POST /clients/sync
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { clients: localClients = [], lastSyncAt } = req.body;

    const results = { created: 0, updated: 0, errors: [] };

    for (const client of localClients) {
      try {
        const { localId, id: _id, ...clientData } = client;

        if (localId) {
          const existing = await prisma.client.findUnique({ where: { localId } });
          if (existing) {
            await prisma.client.update({ where: { localId }, data: clientData });
            results.updated++;
          } else {
            await prisma.client.create({ data: { ...clientData, localId } });
            results.created++;
          }
        } else {
          await prisma.client.create({ data: clientData });
          results.created++;
        }
      } catch (e) {
        results.errors.push({ localId: client.localId, error: e.message });
      }
    }

    const where = {};
    if (lastSyncAt) where.updatedAt = { gte: new Date(lastSyncAt) };

    const serverClients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 1000,
    });

    res.json({ ...results, serverClients, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na sincronizacao de clientes' });
  }
});

module.exports = router;
