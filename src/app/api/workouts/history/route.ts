import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

export async function GET() {
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

    // Fetch workout history for the user
    const workoutHistory = await prisma.workoutHistory.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      include: {
        completedWorkouts: true,
      },
    });

    // Extract completed workouts from the most recent workout history
    const completedWorkouts = workoutHistory.length > 0 
      ? workoutHistory[0].completedWorkouts 
      : [];

    return NextResponse.json({
      workoutHistory,
      completedWorkouts,
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout history' },
      { status: 500 }
    );
  }
} 