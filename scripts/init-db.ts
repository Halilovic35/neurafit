import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@neurafit.com',
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Admin User',
        profile: {
          create: {
            name: 'Admin User',
          },
        },
        subscription: {
          create: {
            status: 'ACTIVE',
            isPremium: true,
          },
        },
      },
    });

    console.log('Admin user created:', admin.email);
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 