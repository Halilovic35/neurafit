const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Provjeri da li Prisma prepoznaje modele
  console.log("Dostupni modeli u Prisma klijentu:", Object.keys(prisma));

  // Obriši postojeće podatke
  await prisma.workoutPlan.deleteMany().catch(() => console.log("❌ workoutPlan ne postoji"));
  await prisma.mealPlan.deleteMany().catch(() => console.log("❌ mealPlan ne postoji"));
  await prisma.user.deleteMany().catch(() => console.log("❌ user ne postoji"));

  // Kreiraj testnog korisnika
  const user = await prisma.user.create({
    data: {
      email: 'dzanhalilovic35@gmail.com',
      password: 'Kosarka123',
      role: 'USER',
      workoutPlans: {
        create: [
          {
            name: 'Beginner Workout',
            description: 'A simple beginner workout plan.',
          },
        ],
      },
      mealPlans: {
        create: [
          {
            name: 'Basic Meal Plan',
            description: 'A healthy meal plan for beginners.',
            calories: 2000,
          },
        ],
      },
    },
  });

  console.log('✅ Database has been seeded successfully!');
  console.log('👤 Created user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
