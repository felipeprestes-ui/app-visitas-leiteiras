const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Cria gestor padrao
  const hashedPassword = await bcrypt.hash('gestor123', 10);

  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@visitas.com' },
    update: {},
    create: {
      email: 'gestor@visitas.com',
      password: hashedPassword,
      name: 'Gestor Principal',
      role: 'gestor',
    },
  });

  console.log('Seed concluido. Gestor criado:', gestor.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
