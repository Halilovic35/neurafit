import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

// Badge types and their requirements
const BADGES = {
  FIRST_WEEK: {
    type: 'first_week',
    name: 'First Week Completed',
    description: 'Completed your first week of workouts!',
    requirement: 1
  },
  CONSISTENT_TRAINER: {
    type: 'consistent_trainer',
    name: 'Consistent Trainer',
    description: 'Completed 4 weeks of workouts!',
    requirement: 4
  },
  STRENGTH_BOOSTER: {
    type: 'strength_booster',
    name: 'Strength Booster',
    description: 'Completed an advanced workout cycle!',
    requirement: 1
  }
};

// User levels and their requirements
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const WEEKS_PER_LEVEL = 4;

export async function POST(request: Request) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error('No authentication token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let userId: string;
    try {
      const decoded = verify(token, JWT_SECRET) as { id: string; email: string; role: string };
      if (!decoded.id) {
        throw new Error('Invalid token');
      }
      userId = decoded.id;
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received request body:', body);

    if (!body.completedWorkout) {
      console.error('Missing completedWorkout in request body');
      return NextResponse.json(
        { error: 'Missing completedWorkout data' },
        { status: 400 }
      );
    }

    const { dayIndex, completedAt, workoutPlanId, difficulty } = body.completedWorkout;

    if (typeof dayIndex !== 'number') {
      console.error('Invalid dayIndex:', dayIndex);
      return NextResponse.json(
        { error: 'Invalid dayIndex format' },
        { status: 400 }
      );
    }

    // Get or create workout history
    let workoutHistory = await prisma.workoutHistory.findFirst({
      where: {
        userId,
        workoutPlanId,
        status: 'in_progress'
      }
    });

    if (!workoutHistory) {
      workoutHistory = await prisma.workoutHistory.create({
        data: {
          userId,
          workoutPlanId,
          startDate: new Date(),
          difficulty,
          status: 'in_progress'
        }
      });
    }

    // Save the completed workout
    const savedWorkout = await prisma.completedWorkout.create({
      data: {
        userId,
        workoutHistoryId: workoutHistory.id,
        dayIndex,
        completedAt: new Date(completedAt),
      },
    });

    // Get the workout plan to check total days
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: workoutPlanId },
      select: { exercises: true }
    });

    if (!workoutPlan) {
      console.error('Workout plan not found:', workoutPlanId);
      return NextResponse.json(
        { error: 'Workout plan not found' },
        { status: 404 }
      );
    }

    // Count completed workouts for this plan
    const completedWorkouts = await prisma.completedWorkout.count({
      where: { workoutHistoryId: workoutHistory.id }
    });

    const totalDays = workoutPlan.exercises.length;
    const isPlanCompleted = completedWorkouts === totalDays;

    if (isPlanCompleted) {
      // Update workout history status
      await prisma.workoutHistory.update({
        where: { id: workoutHistory.id },
        data: {
          status: 'completed',
          endDate: new Date()
        }
      });

      // Update user's weeks completed and check for progression
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          weeksCompleted: { increment: 1 }
        }
      });

      // Check and award badges
      await checkAndAwardBadges(userId, user.weeksCompleted, difficulty);

      // Check for level progression
      const nextLevel = await checkAndUpdateUserLevel(userId, user.weeksCompleted, user.currentLevel);

      return NextResponse.json({
        message: 'Workout plan completed!',
        completedWorkout: savedWorkout,
        isPlanCompleted: true,
        nextLevel,
        badges: await getUserBadges(userId)
      });
    }

    // Return success response for single workout completion
    return NextResponse.json({
      message: 'Workout marked as completed',
      completedWorkout: savedWorkout,
      isPlanCompleted: false,
      progress: {
        completed: completedWorkouts,
        total: totalDays,
        percentage: Math.round((completedWorkouts / totalDays) * 100)
      }
    });
  } catch (error) {
    console.error('Error marking workout as completed:', error);
    return NextResponse.json(
      { error: 'Failed to mark workout as completed' },
      { status: 500 }
    );
  }
}

async function checkAndAwardBadges(userId: string, weeksCompleted: number, difficulty: string) {
  try {
    // Check for first week badge
    if (weeksCompleted === BADGES.FIRST_WEEK.requirement) {
      await awardBadge(userId, BADGES.FIRST_WEEK.type);
    }

    // Check for consistent trainer badge
    if (weeksCompleted === BADGES.CONSISTENT_TRAINER.requirement) {
      await awardBadge(userId, BADGES.CONSISTENT_TRAINER.type);
    }

    // Check for strength booster badge
    if (difficulty === 'advanced') {
      await awardBadge(userId, BADGES.STRENGTH_BOOSTER.type);
    }
  } catch (error) {
    console.error('Error awarding badges:', error);
  }
}

async function awardBadge(userId: string, badgeType: string) {
  try {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeType
      }
    });
  } catch (error) {
    // Ignore unique constraint violations (badge already awarded)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return;
    }
    throw error;
  }
}

async function checkAndUpdateUserLevel(userId: string, weeksCompleted: number, currentLevel: string) {
  const currentIndex = LEVELS.indexOf(currentLevel);
  const nextLevelIndex = Math.floor(weeksCompleted / WEEKS_PER_LEVEL);

  if (nextLevelIndex > currentIndex && nextLevelIndex < LEVELS.length) {
    const newLevel = LEVELS[nextLevelIndex];
    await prisma.user.update({
      where: { id: userId },
      data: { currentLevel: newLevel }
    });
    return newLevel;
  }

  return null;
}

async function getUserBadges(userId: string) {
  return prisma.userBadge.findMany({
    where: { userId },
    select: { badgeType: true, earnedAt: true }
  });
} 