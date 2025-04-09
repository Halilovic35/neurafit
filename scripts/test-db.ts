import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test connection by counting users
    const userCount = await prisma.user.count();
    console.log('Current user count:', userCount);

    // Create a test user
    const testEmail = 'test@neurafit.com';
    const hashedPassword = await hash('Test123!', 12);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        role: 'USER',
        profile: {
          create: {
            name: 'Test User',
          },
        },
        subscription: {
          create: {
            isPremium: false,
          },
        },
      },
      include: {
        profile: true,
        subscription: true,
      },
    });

    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    });

  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 