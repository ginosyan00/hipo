import pkg from '@prisma/client';
const { PrismaClient } = pkg;

/**
 * Prisma Client Instance
 * Singleton pattern для БД
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };

