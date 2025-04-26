import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import openai from '@/lib/openai';

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

const systemPrompt = `You are an enthusiastic and supportive fitness coach providing personalized motivation to users who complete their workouts. Your responses should be:
1. Short and impactful (2-3 sentences max)
2. Personalized to their progress and workout type
3. Encouraging and positive
4. Include relevant fitness emojis
5. Focus on consistency and long-term success
6. Acknowledge their specific achievement (e.g., completing a strength training day)`;

// Fallback motivational messages
const fallbackMessages = [
  "Great job on completing your workout! 💪",
  "You're crushing it! Keep up the amazing work! 🎯",
  "Another workout in the books! You're making progress! 🌟",
  "Strong work today! Your dedication is inspiring! 💫",
  "Way to go! You're building a stronger version of yourself! 🏋️‍♂️",
  "Excellent effort! Every workout counts! 🎉",
  "You're on fire! Keep pushing your limits! 🔥",
  "Fantastic work! Your consistency is paying off! ⭐",
  "Amazing job! You're making great progress! 🚀",
  "Incredible effort! You're getting stronger every day! 💪"
];

function getRandomFallbackMessage() {
  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
}

export async function POST(request: Request) {
  try {
    const { dayIndex, totalDays, workoutType } = await request.json();

    // If OpenAI is not available, return a fallback message immediately
    if (!openai) {
      return NextResponse.json({ 
        message: getRandomFallbackMessage(),
        error: 'OpenAI API key not configured'
      });
    }

    // Calculate progress percentage
    const progress = Math.round(((dayIndex + 1) / totalDays) * 100);

    // Try to get user data if available
    let userData = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;

      if (token) {
        const decoded = verify(token, JWT_SECRET) as { id: string };
        userData = await prisma.user.findUnique({
          where: { id: decoded.id },
          include: { profile: true },
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Continue without user data
    }

    // Prepare user prompt with available data
    const userPrompt = `Generate a motivational message for ${userData?.name || 'a user'} who just completed Day ${dayIndex + 1} of their ${totalDays}-day workout plan.
Additional context:
- Overall progress: ${progress}% complete
${userData ? `- Total workouts completed: ${await prisma.completedWorkout.count({ where: { userId: userData.id } })}
- Fitness goal: ${userData.profile?.goals || 'general fitness'}
- Experience level: ${userData.profile?.experience || 'beginner'}` : ''}
- Workout type: ${workoutType || 'general training'}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const message = response.choices[0].message.content || getRandomFallbackMessage();

      return NextResponse.json({ message });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json({ 
        message: getRandomFallbackMessage(),
        error: 'Using fallback message due to API error'
      });
    }
  } catch (error) {
    console.error('Error generating motivational message:', error);
    return NextResponse.json({ 
      message: getRandomFallbackMessage(),
      error: 'Using fallback message due to error'
    });
  }
} 