import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure the prisma client is properly initialized
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch((e: Error) => {
    console.error('Failed to connect to the database:', e);
    process.exit(1);
  });

export { prisma };
export default prisma; 