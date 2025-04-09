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

// POST /api/admin/premium
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
    const { userId, action } = data;

    if (!userId || !action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
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

    if (action === 'activate') {
      if (user.subscription) {
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'ACTIVE', isPremium: true },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            status: 'ACTIVE',
            isPremium: true,
          },
        });
      }
    } else {
      if (user.subscription) {
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'INACTIVE', isPremium: false },
        });
      }
    }

    const updatedSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error managing premium status:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to manage premium status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/premium
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    await prisma.subscription.delete({
      where: { userId },
    });

    return NextResponse.json({
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
} 