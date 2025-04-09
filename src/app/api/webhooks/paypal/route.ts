import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('PayPal webhook payload:', payload);

    // Verify webhook authenticity (implement proper verification)
    // This is a placeholder - you should implement proper PayPal webhook verification

    // Handle different webhook event types
    switch (payload.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = payload.resource.id;
        const payerEmail = payload.resource.payer.email_address;
        const amount = payload.resource.amount.value;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: payerEmail
          }
        });

        if (!user) {
          console.error('User not found for email:', payerEmail);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Update user's subscription
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            subscription: {
              update: {
                isPremium: true,
                plan: 'PREMIUM',
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              },
            },
          },
          include: {
            subscription: true,
          },
        });

        return NextResponse.json({
          message: 'Payment processed successfully',
          subscription: updatedUser.subscription,
        });
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED': {
        const payerEmail = payload.resource.payer.email_address;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: payerEmail
          }
        });

        if (user) {
          // Update user's subscription status
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscription: {
                update: {
                  isPremium: false,
                  plan: 'FREE',
                  status: 'INACTIVE',
                },
              },
            },
          });
        }

        return NextResponse.json({
          message: 'Payment reversal processed',
        });
      }

      default:
        console.log('Unhandled PayPal webhook event:', payload.event_type);
        return NextResponse.json({
          message: 'Unhandled event type',
        });
    }
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 