import { hash } from 'bcryptjs';
import { prisma } from './prisma';

export async function initializeDatabase() {
  try {
    // Create admin user if it doesn't exist
    const adminEmail = 'admin@neurafit.com';
    const adminPassword = 'Admin123!';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await hash(adminPassword, 12);
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
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
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 