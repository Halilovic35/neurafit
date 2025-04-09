import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

interface UserProfile {
  id: string;
  userId: string;
  name?: string | null;
  imageUrl?: string | null;
}

interface UserSubscription {
  id: string;
  userId: string;
  isPremium: boolean;
  expiresAt?: Date | null;
}

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  profile?: UserProfile | null;
  subscription?: UserSubscription | null;
}

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

// GET /api/admin/users
export async function GET(request: NextRequest) {
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

    const users = await prisma.user.findMany({
      include: {
        profile: true,
        subscription: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!users) {
      return NextResponse.json([], { status: 200 });
    }

    // Filter out sensitive information
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      profile: user.profile,
      subscription: user.subscription
    }));

    return NextResponse.json(sanitizedUsers, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users
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

    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete the user and all related data
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 