const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all users with their profiles
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        subscription: true
      }
    });

    console.log('Found users:', users.length);
    users.forEach(user => {
      console.log('\nUser Details:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Password Hash:', user.password.substring(0, 20) + '...');
      console.log('Profile:', user.profile);
      console.log('Subscription:', user.subscription);
    });
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 