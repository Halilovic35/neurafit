const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  try {
    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@neurafit.com',
        password: hashedPassword,
        role: 'ADMIN',
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
          },
        },
        subscription: {
          create: {
            status: 'PREMIUM',
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