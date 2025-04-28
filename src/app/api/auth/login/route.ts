import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createAuthResponse } from '@/lib/auth';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

interface LoginRequest {
  email: string;
  password: string;
}

// Helper function to get CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS() {
  const corsHeaders = getCorsHeaders();
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  console.log('Login request received');
  const corsHeaders = getCorsHeaders();

  try {
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);
    
    const body = JSON.parse(rawBody) as LoginRequest;
    console.log('Parsed request body:', body);
    
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      // Find user with profile and subscription
      console.log('Looking up user:', email);
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          subscription: true,
        },
      });

      if (!user) {
        console.log('User not found:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401, headers: corsHeaders }
        );
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      console.log('Password validation result:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('Invalid password for user:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401, headers: corsHeaders }
        );
      }

      // Create JWT token with user role
      const token = sign(
        { 
          id: user.id,
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Create the response
      const response = NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            subscription: user.subscription,
          },
        },
        { status: 200, headers: corsHeaders }
      );

      // Set cookie in the response
      const cookieStore = await cookies();
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      console.log('Login successful for user:', email);
      return response;
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400, headers: corsHeaders }
    );
  }
} 