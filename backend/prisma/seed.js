const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const USERS = [
  { email: 'gestor@crv4all.com.br',    password: '123456', name: 'Felipe Prestes',      role: 'gestor',  area: null },
  { email: 'cesar@crv4all.com.br',     password: '123456', name: 'Cesar Oliveira',       role: 'tecnico', area: '20' },
  { email: 'erica@crv4all.com.br',     password: '123456', name: 'Erica Fonseca',        role: 'tecnico', area: '12' },
  { email: 'henrique@crv4all.com.br',  password: '123456', name: 'Henrique Froehlich',   role: 'tecnico', area: null },
  { email: 'leandro@crv4all.com.br',   password: '123456', name: 'Leandro Teixeira',     role: 'tecnico', area: '15' },
  { email: 'prestes@crv4all.com.br',   password: '123456', name: 'Felipe Prestes',       role: 'tecnico', area: '15' },
  { email: 'phillippe@crv4all.com.br', password: '123456', name: 'Phillippe Monteiro',   role: 'tecnico', area: '18' },
];

async function main() {
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashed, name: u.name, role: u.role, area: u.area, active: true },
      create: {
        email: u.email,
        password: hashed,
        name: u.name,
        role: u.role,
        area: u.area,
        active: true,
      },
    });
    console.log(`[seed] Upserted: ${user.email} (${user.role})`);
  }
  console.log('[seed] Concluido.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
