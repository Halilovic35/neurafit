import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

// Helper function to get CORS headers
const getCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
});

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('token');

  return NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );
}

export async function OPTIONS() {
  const headersList = await headers();
  const origin = headersList.get('origin') || '*';
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
} 