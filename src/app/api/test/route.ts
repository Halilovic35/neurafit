import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const runtime = 'nodejs';

// Helper function to get CORS headers
function getCorsHeaders() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
  return corsHeaders;
}

export async function OPTIONS() {
  const corsHeaders = getCorsHeaders();
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  const corsHeaders = getCorsHeaders();
  return NextResponse.json(
    { message: 'Test endpoint working!' },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders();
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: 'POST request received',
      data: body 
    }, { 
      headers: corsHeaders
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { 
        status: 400,
        headers: corsHeaders
      }
    );
  }
} 