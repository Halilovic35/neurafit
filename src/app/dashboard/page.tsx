import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardContent from './DashboardContent';

interface WorkoutData {
  id: string;
  name: string;
  description?: string;
  exercises: any[];
}

interface MealPlanData {
  id: string;
  name: string;
  description?: string;
  meals: any[];
}

interface PrismaMealPlan {
  id: string;
  name: string;
  description: string | null;
  meals: any[];
}

interface MealPlanResponse {
  id: string;
  name: string;
  description?: string;
  meals: any[] | null;
}

interface UserData {
  currentLevel: string;
  weeksCompleted: number;
  badges: any[];
}

async function getDashboardData(userId: string) {
  try {
    const [workouts, mealPlans, workoutHistory, user] = await Promise.all([
      prisma.workoutPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          description: true,
          exercises: true,
        },
      }),
      prisma.mealPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          description: true,
          meals: true,
        },
      }).then((plans: PrismaMealPlan[]) => plans.map(plan => ({
        ...plan,
        description: plan.description || undefined,
        meals: plan.meals && Array.isArray(plan.meals) && plan.meals.length > 0 ? plan.meals[0] : null
      }))),
      prisma.workoutHistory.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
        take: 5,
        include: {
          completedWorkouts: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          currentLevel: true,
          weeksCompleted: true,
          badges: true,
        },
      }),
    ]);

    // Get workout plan names for workout history
    const workoutPlanIds = workoutHistory.map(history => history.workoutPlanId);
    const workoutPlans = await prisma.workoutPlan.findMany({
      where: { id: { in: workoutPlanIds } },
      select: { id: true, name: true },
    });

    // Map workout plan names to history
    const workoutHistoryWithNames = workoutHistory.map(history => ({
      ...history,
      workoutPlanName: workoutPlans.find(plan => plan.id === history.workoutPlanId)?.name || 'Unknown Workout Plan',
    }));

    // Ensure user data is not null
    const userData: UserData = {
      currentLevel: user?.currentLevel || 'Beginner',
      weeksCompleted: user?.weeksCompleted || 0,
      badges: user?.badges || [],
    };

    return { workouts, mealPlans, workoutHistory: workoutHistoryWithNames, userData };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    return <div>Please log in to view your dashboard.</div>;
  }

  try {
    const { workouts, mealPlans, workoutHistory, userData } = await getDashboardData(session.id);

    return (
      <ProtectedRoute>
        <DashboardContent 
          workouts={workouts}
          mealPlans={mealPlans}
          workoutHistory={workoutHistory}
          userData={userData}
        />
      </ProtectedRoute>
    );
  } catch (error) {
    console.error('Error in DashboardPage:', error);
    return <div>Error loading dashboard data. Please try again later.</div>;
  }
} 