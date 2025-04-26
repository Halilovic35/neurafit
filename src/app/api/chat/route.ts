import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import openai from '@/lib/openai';

export const runtime = 'nodejs';

// Add allowed methods
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

// Helper function to verify user
async function verifyUser(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new Error('Unauthorized');
    }

    return user;
  } catch (error) {
    console.error('User verification error:', error);
    throw new Error('Unauthorized');
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/chat
export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      console.error('OpenAI client not initialized');
      return NextResponse.json(
        { error: 'Chat service is currently unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await verifyUser(token);
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get user's profile
    const userWithDetails = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
      },
    });

    if (!userWithDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare system message with user context
    const systemMessage = `You are a helpful fitness assistant for NeuraFit. The user's name is ${userWithDetails.name || 'there'}. 
Their fitness level is ${userWithDetails.currentLevel || 'beginner'}. They have completed ${userWithDetails.weeksCompleted || 0} weeks of training.
If they have a profile, here are their details: ${JSON.stringify(userWithDetails.profile)}`;

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      return NextResponse.json({ role: 'assistant', content: reply });
    } catch (openaiError: any) {
      console.error('OpenAI API call failed:', openaiError);
      return NextResponse.json(
        { error: 'OpenAI is currently unavailable or rate limited. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 