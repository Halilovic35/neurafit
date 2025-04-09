import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

export async function DELETE() {
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

    // First, delete all completed workouts for the user
    await prisma.completedWorkout.deleteMany({
      where: { userId }
    });

    // Then delete all workout history
    await prisma.workoutHistory.deleteMany({
      where: { userId }
    });

    // Delete all workout plans
    await prisma.workoutPlan.deleteMany({
      where: { userId }
    });

    // Delete all meal plans
    await prisma.mealPlan.deleteMany({
      where: { userId }
    });

    // Reset user's weeks completed
    await prisma.user.update({
      where: { id: userId },
      data: {
        weeksCompleted: 0
      }
    });

    return NextResponse.json({
      message: 'All workout and meal plan data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
} 