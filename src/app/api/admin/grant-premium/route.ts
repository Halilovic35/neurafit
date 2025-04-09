import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

// Helper function to verify admin status
async function verifyAdmin(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    return true;
  } catch (error) {
    console.error('Admin verification error:', error);
    throw new Error('Unauthorized');
  }
}

// POST /api/admin/grant-premium
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await verifyAdmin(token);

    const data = await request.json();
    const { userId } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        status: 'ACTIVE',
        isPremium: true,
        plan: 'PREMIUM',
      },
      update: {
        status: 'ACTIVE',
        isPremium: true,
        plan: 'PREMIUM',
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error granting premium:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to grant premium' },
      { status: 500 }
    );
  }
} 