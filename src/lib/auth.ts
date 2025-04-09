import { verify, sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';
const TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;
const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function getCurrentUser() {
  const session = await getServerSession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      profile: true,
      subscription: true,
    },
  });

  return user;
}

export async function verifyAuth(token: string): Promise<AuthUser> {
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error('Unauthorized');
  }
}

export async function verifyAdmin(token: string): Promise<AuthUser> {
  const user = await verifyAuth(token);
  if (user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return user;
}

export async function getAuthUser(request: Request) {
  const token = request.headers.get('cookie')?.split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  
  if (!token) {
    return null;
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function createAuthToken(user: { id: string; email: string; role: string }): Promise<string> {
  return sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = await cookieStore.get('token');

  if (!token) {
    return null;
  }

  try {
    const decoded = await verifyAuth(token.value);
    return decoded;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, userId: string) {
  const token = sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
  
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return token;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete('token');
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function createAuthResponse(userId: string) {
  const token = sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
  const response = NextResponse.json({ success: true });
  
  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  
  return response;
}

export function createLogoutResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('token');
  return response;
} 