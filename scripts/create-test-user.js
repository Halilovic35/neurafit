const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    const userEmail = 'dzanhalilovic35@gmail.com';
    const userPassword = 'Kosarka123';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      console.log('User already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
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

    console.log('User created successfully:', user.email);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 