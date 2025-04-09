import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Kosarka123', 10);

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'dzanhalilovic35@gmail.com',
      password: hashedPassword,
      name: 'Dzan Halilovic',
      role: 'USER',
      profile: {
        create: {
          name: 'Dzan Halilovic',
          height: 180,
          weight: 75,
          age: 25,
          gender: 'MALE',
          goals: 'Build muscle and improve fitness',
          experience: 'INTERMEDIATE'
        }
      },
      subscription: {
        create: {
          isPremium: false,
          plan: 'FREE',
          status: 'ACTIVE'
        }
      }
    }
  });

  console.log('Seed data created:', { user });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 