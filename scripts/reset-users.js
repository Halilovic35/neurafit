const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete existing users
    await prisma.user.deleteMany({});
    console.log('Deleted all existing users');

    // Create admin user
    const adminEmail = 'admin@neurafit.com';
    const adminPassword = 'Admin123!!'; // Note: two exclamation marks as used in the login attempt
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminHashedPassword,
        role: 'ADMIN',
        profile: {
          create: {
            name: 'Admin',
          },
        },
        subscription: {
          create: {
            isPremium: true,
          },
        },
      },
    });
    console.log('Admin user created:', admin.email);

    // Create regular user
    const userEmail = 'dzanhalilovic35@gmail.com';
    const userPassword = 'Kosarka123';
    const userHashedPassword = await bcrypt.hash(userPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: userHashedPassword,
        role: 'USER',
        profile: {
          create: {
            name: 'Dzan Halilovic',
          },
        },
        subscription: {
          create: {
            isPremium: false,
          },
        },
      },
    });
    console.log('Regular user created:', user.email);

  } catch (error) {
    console.error('Error resetting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 