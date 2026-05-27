const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, area } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'tecnico', area: area || '' },
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar usuario' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Usuario nao encontrado' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, area: user.area } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// POST /auth/setup — inicializa o banco com usuários padrão (protegido por SETUP_SECRET)
router.post('/setup', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== process.env.SETUP_SECRET) {
      return res.status(403).json({ error: 'Secret invalido' });
    }

    const users = [
      { name: 'Gestor', email: 'gestor@crv4all.com.br', password: '123456', role: 'gestor', area: '' },
      { name: 'Erica', email: 'erica@crv4all.com.br', password: '123456', role: 'tecnico', area: '011/012' },
      { name: 'Cesar', email: 'cesar@crv4all.com.br', password: '123456', role: 'tecnico', area: '011/012/019/020' },
      { name: 'Henrique', email: 'henrique@crv4all.com.br', password: '123456', role: 'tecnico', area: '018' },
      { name: 'Leandro', email: 'leandro@crv4all.com.br', password: '123456', role: 'tecnico', area: '015' },
      { name: 'Felipe', email: 'felipe@crv4all.com.br', password: '123456', role: 'tecnico', area: '' },
    ];

    for (const u of users) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        const hashed = await bcrypt.hash(u.password, 10);
        await prisma.user.create({
          data: { ...u, password: hashed },
        });
      }
    }

    res.json({ message: 'Banco inicializado com sucesso', users: users.map(u => u.email) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao inicializar banco' });
  }
});

module.exports = router;
