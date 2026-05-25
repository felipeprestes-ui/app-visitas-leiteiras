const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, gestorOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /dashboard/stats - estatisticas gerais
router.get('/stats', authMiddleware, gestorOnly, async (req, res) => {
  try {
    const { startDate, endDate, area } = req.query;

    const visitWhere = {};
    if (area) visitWhere.area = area;
    if (startDate || endDate) {
      visitWhere.visitedAt = {};
      if (startDate) visitWhere.visitedAt.gte = new Date(startDate);
      if (endDate) visitWhere.visitedAt.lte = new Date(endDate);
    }

    const [
      totalVisits,
      visitasComNegocio,
      totalTecnicos,
      totalClientes,
      agendamentosAtivos,
      visitsData,
    ] = await Promise.all([
      prisma.visit.count({ where: visitWhere }),
      prisma.visit.count({ where: { ...visitWhere, dealClosed: true } }),
      prisma.user.count({ where: { role: 'tecnico', active: true } }),
      prisma.client.count(),
      prisma.schedule.count({ where: { status: 'agendada' } }),
      prisma.visit.findMany({
        where: visitWhere,
        select: { dosesConvencional: true, dosesSexado: true, milkAverage: true, area: true },
      }),
    ]);

    const totalDosesConvencional = visitsData.reduce((sum, v) => sum + (v.dosesConvencional || 0), 0);
    const totalDosesSexado = visitsData.reduce((sum, v) => sum + (v.dosesSexado || 0), 0);
    const mediaLeite = visitsData.length > 0
      ? visitsData.reduce((sum, v) => sum + (v.milkAverage || 0), 0) / visitsData.filter(v => v.milkAverage).length
      : 0;

    res.json({
      totalVisits,
      visitasComNegocio,
      taxaConversao: totalVisits > 0 ? ((visitasComNegocio / totalVisits) * 100).toFixed(1) : '0',
      totalTecnicos,
      totalClientes,
      agendamentosAtivos,
      totalDosesConvencional,
      totalDosesSexado,
      totalDoses: totalDosesConvencional + totalDosesSexado,
      mediaLeite: isNaN(mediaLeite) ? 0 : mediaLeite.toFixed(1),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatisticas' });
  }
});

// GET /dashboard/ranking - ranking de tecnicos
router.get('/ranking', authMiddleware, gestorOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const visitWhere = {};
    if (startDate || endDate) {
      visitWhere.visitedAt = {};
      if (startDate) visitWhere.visitedAt.gte = new Date(startDate);
      if (endDate) visitWhere.visitedAt.lte = new Date(endDate);
    }

    const tecnicos = await prisma.user.findMany({
      where: { role: 'tecnico', active: true },
      select: { id: true, name: true, area: true },
    });

    const ranking = await Promise.all(
      tecnicos.map(async (tech) => {
        const where = { ...visitWhere, technicianId: tech.id };
        const [total, negociadas, visits] = await Promise.all([
          prisma.visit.count({ where }),
          prisma.visit.count({ where: { ...where, dealClosed: true } }),
          prisma.visit.findMany({
            where,
            select: { dosesConvencional: true, dosesSexado: true },
          }),
        ]);

        const doses = visits.reduce(
          (sum, v) => sum + (v.dosesConvencional || 0) + (v.dosesSexado || 0),
          0
        );

        return {
          id: tech.id,
          name: tech.name,
          area: tech.area,
          totalVisitas: total,
          visitasNegociadas: negociadas,
          taxaConversao: total > 0 ? ((negociadas / total) * 100).toFixed(1) : '0',
          totalDoses: doses,
        };
      })
    );

    // Ordena por total de visitas
    ranking.sort((a, b) => b.totalVisitas - a.totalVisitas);

    res.json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// GET /dashboard/vendas - dados de vendas/doses
router.get('/vendas', authMiddleware, gestorOnly, async (req, res) => {
  try {
    const { startDate, endDate, area } = req.query;

    const where = { dealClosed: true };
    if (area) where.area = area;
    if (startDate || endDate) {
      where.visitedAt = {};
      if (startDate) where.visitedAt.gte = new Date(startDate);
      if (endDate) where.visitedAt.lte = new Date(endDate);
    }

    const visits = await prisma.visit.findMany({
      where,
      select: {
        id: true,
        clientName: true,
        technicianName: true,
        area: true,
        dosesConvencional: true,
        dosesSexado: true,
        visitedAt: true,
        serviceType: true,
      },
      orderBy: { visitedAt: 'desc' },
      take: 200,
    });

    const totalConvencional = visits.reduce((sum, v) => sum + (v.dosesConvencional || 0), 0);
    const totalSexado = visits.reduce((sum, v) => sum + (v.dosesSexado || 0), 0);

    res.json({
      vendas: visits,
      resumo: {
        totalConvencional,
        totalSexado,
        totalDoses: totalConvencional + totalSexado,
        totalNegociadas: visits.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados de vendas' });
  }
});

module.exports = router;
