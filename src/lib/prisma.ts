import { PrismaClient } from '@prisma/client';

// Log the database URL (without sensitive info) for debugging
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const maskedUrl = dbUrl.replace(/\/\/[^@]+@/, '//****:****@');
  console.log('Database URL format:', maskedUrl);
} else {
  console.error('DATABASE_URL is not set!');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize database connection
async function initDatabase() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
    
    // Test the connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection test successful');
    
  } catch (e) {
    console.error('Failed to connect to the database:', e);
    // Don't exit the process, let the application handle the error
    throw e;
  }
}

// Initialize the database connection
initDatabase().catch(console.error);

export default prisma; 