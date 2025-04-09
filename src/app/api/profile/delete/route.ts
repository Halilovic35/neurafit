import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
    };

    // Delete user and all related data
    await prisma.user.delete({
      where: { id: decoded.userId },
    });

    // Clear auth cookie
    const response = NextResponse.json({
      message: 'Account deleted successfully',
    });

    response.cookies.delete('token');

    return response;
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 