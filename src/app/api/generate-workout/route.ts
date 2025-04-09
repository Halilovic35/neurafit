import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import openai from '@/lib/openai';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

// Types for workout generation
type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';
type FocusArea = 'Full Body' | 'Upper Body & Core' | 'Lower Body & Core' | 'Endurance & Cardio';

type Exercise = {
  name: string;
  sets: number;
  reps: number;
  restTime: string;
  description?: string;
  difficulty?: string;
  equipment?: string[];
  muscles?: string[];
  setup?: string;
  execution?: {
    starting_position: string;
    movement: string;
    breathing: string;
    tempo: string;
    form_cues: string[];
  };
  progression?: {
    next_steps: string;
    variations: string[];
    scaling_options: string[];
  };
};

type WarmUpCoolDown = {
  name: string;
  duration: string;
  description?: string;
  purpose?: string;
};

type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

type WorkoutDay = {
  name: string;
  focus: string;
  exercises: Exercise[];
  warmup: {
    duration: string;
    exercises: WarmUpCoolDown[];
  };
  cooldown: {
    duration: string;
    exercises: WarmUpCoolDown[];
  };
  notes?: string;
};

type WorkoutPlan = {
  name: string;
  description: string;
  days: WorkoutDay[];
  goal?: string;
  level?: FitnessLevel;
  daysPerWeek?: number;
  equipment?: string[];
  notes?: string;
  tips?: string[];
};

// Basic exercise database by focus area and fitness level
const exercisesByFocus: Record<FocusArea, Record<FitnessLevel, Exercise[]>> = {
  'Full Body': {
    beginner: [
      {
        name: 'Bodyweight Squats',
        sets: 3,
        reps: 10,
        restTime: '60 seconds',
        description: 'Basic squat movement'
      }
    ],
    intermediate: [
      {
        name: 'Push-Ups',
        sets: 3,
        reps: 12,
        restTime: '60 seconds',
        description: 'Standard push-up'
      }
    ],
    advanced: [
      {
        name: 'Burpees',
        sets: 4,
        reps: 15,
        restTime: '45 seconds',
        description: 'Full body explosive movement'
      }
    ]
  },
  'Upper Body & Core': {
    beginner: [
      {
        name: 'Wall Push-Ups',
        sets: 3,
        reps: 10,
        restTime: '60 seconds',
        description: 'Modified push-up against wall'
      }
    ],
    intermediate: [
      {
        name: 'Diamond Push-Ups',
        sets: 3,
        reps: 12,
        restTime: '60 seconds',
        description: 'Push-up with hands forming diamond shape'
      }
    ],
    advanced: [
      {
        name: 'Handstand Push-Ups',
        sets: 3,
        reps: 8,
        restTime: '90 seconds',
        description: 'Advanced upper body push exercise'
      }
    ]
  },
  'Lower Body & Core': {
    beginner: [
      {
        name: 'Lunges',
        sets: 3,
        reps: 10,
        restTime: '60 seconds',
        description: 'Basic lunge movement'
      }
    ],
    intermediate: [
      {
        name: 'Jump Squats',
        sets: 3,
        reps: 15,
        restTime: '60 seconds',
        description: 'Explosive squat jump'
      }
    ],
    advanced: [
      {
        name: 'Pistol Squats',
        sets: 3,
        reps: 8,
        restTime: '90 seconds',
        description: 'Single leg squat'
      }
    ]
  },
  'Endurance & Cardio': {
    beginner: [
      {
        name: 'Walking',
        sets: 1,
        reps: 20,
        restTime: '60 seconds',
        description: 'Brisk walking'
      }
    ],
    intermediate: [
      {
        name: 'Jogging',
        sets: 1,
        reps: 20,
        restTime: '60 seconds',
        description: 'Steady state jogging'
      }
    ],
    advanced: [
      {
        name: 'Sprinting',
        sets: 6,
        reps: 30,
        restTime: '90 seconds',
        description: 'High intensity sprints'
      }
    ]
  }
};

// Helper function to calculate BMI
function calculateBMI(weight: number, height: number): number {
  // Convert height from cm to meters
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// Helper function to get BMI category
function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

// ... existing code ...

function generateWorkoutTemplate(
  daysPerWeek: string,
  goal: string,
  fitnessLevel: FitnessLevel,
  bmiCategory: BMICategory,
  exerciseGuidance: string,
  progressionGuidance: string
): string {
  return `You are a professional fitness trainer tasked with creating personalized workout plans. Create a ${daysPerWeek}-day workout plan for a ${fitnessLevel} level trainee with the following parameters:

1. Goal: ${goal}
2. Exercise Selection:
   - Each day must have unique exercises (no repeats across days)
   - For ${bmiCategory} individuals at ${fitnessLevel} level, prioritize ${exerciseGuidance}

3. Progression:
   - ${progressionGuidance}
   - Provide clear progression paths for each exercise

4. Structure:
   - Include warmup and cooldown routines
   - Specify sets, reps, and rest periods
   - Note form cues and common mistakes to avoid
   - Include alternative exercises for each movement

Please provide the workout plan in the following JSON format:
{
  "name": "string",
  "description": "string",
  "days": [
    {
      "name": "string",
      "focus": "string",
      "warmup": {
        "duration": "string",
        "exercises": [
          {
            "name": "string",
            "duration": "string",
            "description": "string",
            "purpose": "string"
          }
        ]
      },
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string",
          "rest": "string",
          "notes": "string",
          "difficulty": "string",
          "equipment": ["string"],
          "muscles": ["string"],
          "setup": "string",
          "execution": {
            "starting_position": "string",
            "movement": "string",
            "breathing": "string",
            "tempo": "string",
            "form_cues": ["string"]
          },
          "progression": {
            "next_steps": "string",
            "variations": ["string"],
            "scaling_options": ["string"]
          }
        }
      ],
      "cooldown": {
        "duration": "string",
        "exercises": [
          {
            "name": "string",
            "duration": "string",
            "description": "string",
            "purpose": "string"
          }
        ]
      },
      "notes": "string"
    }
  ]
}`;
}

function generateSystemPrompt(
  daysPerWeek: string,
  goal: string,
  fitnessLevel: FitnessLevel,
  bmiCategory: BMICategory
): string {
  const getExerciseGuidance = (bmiCat: BMICategory) => {
    switch (bmiCat) {
      case 'underweight':
        return 'strength and resistance exercises';
      case 'obese':
        return 'low-impact, joint-friendly exercises';
      default:
        return 'balanced exercises';
    }
  };

  const getProgressionGuidance = (level: FitnessLevel) => {
    switch (level) {
      case 'beginner':
        return 'Focus on form and basic movements';
      case 'intermediate':
        return 'Introduce complex movements and increase intensity';
      case 'advanced':
        return 'Advanced techniques and high-intensity workouts';
    }
  };

  const exerciseGuidance = getExerciseGuidance(bmiCategory);
  const progressionGuidance = getProgressionGuidance(fitnessLevel);

  return `You are a professional fitness trainer creating a personalized ${daysPerWeek}-day workout plan. The client's goal is ${goal}, their fitness level is ${fitnessLevel}, and their BMI category is ${bmiCategory}.

Key requirements:
1. Each workout day MUST have at least 4 main exercises (this is mandatory)
2. Exercises should be appropriate for the client's fitness level (${fitnessLevel})
3. Consider the client's BMI category (${bmiCategory}) when selecting exercises
4. Include proper warmup and cooldown routines

${getExerciseGuidance(bmiCategory)}

${getProgressionGuidance(fitnessLevel)}

Structure the workout plan in this exact JSON format:
{
  "name": "string (catchy name for the workout plan)",
  "description": "string (2-3 sentences describing the plan)",
  "days": [
    {
      "name": "string (e.g., 'Day 1: Lower Body Focus')",
      "focus": "string (main focus area)",
      "exercises": [
        // MINIMUM 4 exercises per day, each with this structure:
        {
          "name": "string",
          "sets": number,
          "reps": "string (e.g., '12-15' or '30 seconds')",
          "rest": "string (e.g., '60 seconds')",
          "notes": "string",
          "difficulty": "string",
          "equipment": ["string"],
          "muscles": ["string"],
          "setup": "string",
          "execution": {
            "starting_position": "string",
            "movement": "string",
            "breathing": "string",
            "tempo": "string",
            "form_cues": ["string"]
          },
  "progression": {
            "next_steps": "string",
            "variations": ["string"],
            "scaling_options": ["string"]
          }
        }
      ],
      "warmup": {
        "duration": "string",
        "exercises": [
          {
            "name": "string",
            "duration": "string",
            "description": "string",
            "purpose": "string"
          }
        ]
      },
      "cooldown": {
        "duration": "string",
        "exercises": [
          {
            "name": "string",
            "duration": "string",
            "description": "string",
            "purpose": "string"
          }
        ]
      },
      "notes": "string"
    }
  ]
}`
}

// At the top of the file, add or update type definitions
type WorkoutPlanResponse = {
  name: string;
  description: string;
  days: Array<{
    name: string;
    focus: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: string;
      notes: string;
      difficulty: string;
      equipment: string[];
      muscles: string[];
      setup: string;
      execution: {
        starting_position: string;
        movement: string;
        breathing: string;
        tempo: string;
        form_cues: string[];
      };
      progression: {
        next_steps: string;
        variations: string[];
        scaling_options: string[];
      };
    }>;
    warmup: {
      duration: string;
      exercises: Array<{
        name: string;
        duration: string;
        description: string;
        purpose: string;
      }>;
    };
    cooldown: {
      duration: string;
      exercises: Array<{
        name: string;
        duration: string;
        description: string;
        purpose: string;
      }>;
    };
    notes: string;
  }>;
};

// Update the validation function
function validateDay(day: WorkoutPlanResponse['days'][0], index: number, expectedExercises: number = 4, allowFallback: boolean = true): void {
  if (!day.name || !day.focus || !Array.isArray(day.exercises)) {
    throw new Error(`Invalid structure for day ${index + 1}`);
  }
  if (day.exercises.length < expectedExercises) {
    throw new Error(`Day ${index + 1} has fewer than ${expectedExercises} exercises (found ${day.exercises.length})`);
  }
  if (!day.warmup?.exercises || !Array.isArray(day.warmup.exercises)) {
    throw new Error(`Invalid warmup structure for day ${index + 1}`);
  }
  if (!day.cooldown?.exercises || !Array.isArray(day.cooldown.exercises)) {
    throw new Error(`Invalid cooldown structure for day ${index + 1}`);
  }
}

// Update the validation function to check for exercise repetition
function validateWorkoutDay(day: WorkoutDay, index: number, expectedExercises: number = 4, allowFallback: boolean = true): string[] {
  const errors: string[] = [];
  
  if (!day.name || !day.focus || !Array.isArray(day.exercises)) {
    throw new Error(`Invalid structure for day ${index + 1}`);
  }
  
  if (day.exercises.length < expectedExercises) {
    throw new Error(`Day ${index + 1} has fewer than ${expectedExercises} exercises (found ${day.exercises.length})`);
  }
  
  if (!day.warmup?.exercises || !Array.isArray(day.warmup.exercises)) {
    throw new Error(`Invalid warmup structure for day ${index + 1}`);
  }
  
  if (!day.cooldown?.exercises || !Array.isArray(day.cooldown.exercises)) {
    throw new Error(`Invalid cooldown structure for day ${index + 1}`);
  }
  
  return errors;
}

function validateWorkoutPlan(plan: WorkoutPlan, expectedDays: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allExercises = new Set<string>();
  
  if (!plan.name) errors.push('Missing workout plan name');
  if (!plan.description) errors.push('Missing workout plan description');
  if (!plan.days) errors.push('Missing workout days');
  
  if (!Array.isArray(plan.days) || plan.days.length !== expectedDays) {
    errors.push(`Expected ${expectedDays} workout days but received ${plan.days?.length || 0}`);
  }
  
  if (plan.days) {
    plan.days.forEach((day, index) => {
      const dayErrors = validateWorkoutDay(day, index, 4, true);
      if (dayErrors.length > 0) {
        errors.push(`Day ${index + 1} validation errors:`, ...dayErrors.map(err => `  - ${err}`));
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

async function generateWorkoutPlan(
  messages: ChatCompletionMessageParam[],
  retryCount = 0,
  daysPerWeek: string,
  goal: string,
  fitnessLevel: FitnessLevel,
  bmiCategory: BMICategory
): Promise<WorkoutPlan> {
  const maxRetries = 3;
  
  try {
    console.log('Generating workout plan with OpenAI...');
    
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }
    
    // Adjust model and parameters based on retry count
    const model = retryCount === 0 ? "gpt-4-turbo-preview" : "gpt-3.5-turbo";
    const maxTokens = retryCount === 0 ? 4000 : 2000;
    const temperature = retryCount === 0 ? 0.7 : 0.3; // Lower temperature for retries
    
      const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('Received response from OpenAI, attempting to parse...');
    console.log('Raw response:', content.substring(0, 500) + '...'); // Log first 500 chars for debugging
    
    try {
      const parsedContent = JSON.parse(content);
      console.log('Successfully parsed JSON response');
      return parsedContent as WorkoutPlan;
    } catch (parseError: unknown) {
      console.error('JSON parsing error:', parseError);
      console.error('Invalid JSON content:', content);
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error: unknown) {
    console.error('Error generating workout plan:', error);
    
    // Check if we should retry
    if (retryCount < maxRetries) {
      console.log(`Retry attempt ${retryCount + 1} of ${maxRetries}`);
      
      // Simplify the prompt for retries
      const simplifiedPrompt = `Generate a simpler ${daysPerWeek}-day workout plan. Focus on basic exercises and structure. Return ONLY valid JSON.`;
      
      messages.push({
        role: "user",
        content: simplifiedPrompt
      });
      
      return generateWorkoutPlan(messages, retryCount + 1, daysPerWeek, goal, fitnessLevel, bmiCategory);
    }
    
    // If all retries failed, generate a fallback plan
    return generateFallbackPlan(daysPerWeek, goal, fitnessLevel, bmiCategory);
  }
}

// Remove both existing generateFallbackPlan functions and replace with this one
function generateFallbackPlan(
  daysPerWeek: string,
  goal: string,
  fitnessLevel: FitnessLevel,
  bmiCategory: BMICategory
): WorkoutPlan {
  const days = [];
  const numDays = parseInt(daysPerWeek);
  
  // Create a workout for each day
  for (let i = 0; i < numDays; i++) {
    const dayNumber = i + 1;
    const focusArea = getFocusAreaForDay(dayNumber, numDays);
    const exercises = getExercisesForFocusArea(focusArea, fitnessLevel, 4); // Get 4 exercises per day
    
    days.push({
      day: dayNumber,
      name: `Day ${dayNumber}: ${focusArea}`,
      focus: focusArea,
      warmup: generateWarmup(focusArea),
      exercises: exercises,
      cooldown: generateCooldown(focusArea),
      notes: `Focus on proper form and controlled movements. Rest as needed between exercises.`
    });
  }

  return {
    name: `${numDays}-Day ${goal.charAt(0).toUpperCase() + goal.slice(1)} Workout Plan`,
    description: `A ${fitnessLevel} level workout plan designed for ${goal} with ${numDays} workouts per week. Tailored for ${bmiCategory} BMI range.`,
    goal: goal,
    level: fitnessLevel,
    daysPerWeek: numDays,
    days: days,
    equipment: ["None", "Resistance Bands (optional)", "Light Dumbbells (optional)"],
    notes: "Start with proper form before increasing intensity. Listen to your body and rest when needed.",
    tips: [
      "Stay hydrated throughout your workout",
      "Focus on proper form over speed",
      "Breathe steadily during exercises",
      "If you feel pain (not normal muscle fatigue), stop and consult a professional"
    ]
  };
}

function getFocusAreaForDay(dayNumber: number, totalDays: number): FocusArea {
  if (totalDays <= 3) {
    // For 1-3 days per week, rotate through full body workouts
    return "Full Body";
  } else if (totalDays <= 5) {
    // For 4-5 days, alternate between upper and lower body
    return dayNumber % 2 === 0 ? "Upper Body & Core" : "Lower Body & Core";
  } else {
    // For 6-7 days, use a mix of all focus areas
    switch (dayNumber % 6) {
      case 1: return "Upper Body & Core";
      case 2: return "Lower Body & Core";
      case 3: return "Full Body";
      case 4: return "Endurance & Cardio";
      case 5: return "Upper Body & Core";
      default: return "Lower Body & Core";
    }
  }
}

function getExercisesForFocusArea(focusArea: FocusArea, fitnessLevel: FitnessLevel, count: number): Exercise[] {
  const availableExercises = exercisesByFocus[focusArea][fitnessLevel];
  const selected = [];
  
  // Randomly select 'count' number of exercises
  for (let i = 0; i < count && i < availableExercises.length; i++) {
    const randomIndex = Math.floor(Math.random() * availableExercises.length);
    selected.push(availableExercises[randomIndex]);
  }
  
  return selected;
}

function generateWarmup(focusArea: FocusArea): { duration: string; exercises: WarmUpCoolDown[] } {
  return {
    duration: "10 minutes",
    exercises: [
      {
        name: "Light Jogging in Place",
        duration: "2 minutes",
        description: "Start with a light jog to increase heart rate",
        purpose: "Cardiovascular warm-up"
      },
      {
        name: "Dynamic Stretches",
        duration: "4 minutes",
        description: "Perform arm circles, leg swings, and torso rotations",
        purpose: "Joint mobility"
      },
      {
        name: "Bodyweight Exercises",
        duration: "4 minutes",
        description: "Light jumping jacks, arm rotations, and knee lifts",
        purpose: "Muscle activation"
      }
    ]
  };
}

function generateCooldown(focusArea: FocusArea): { duration: string; exercises: WarmUpCoolDown[] } {
  return {
    duration: "5-10 minutes",
    exercises: [
      {
        name: "Light Walking",
        duration: "2-3 minutes",
        description: "Walk in place or around the room",
        purpose: "Lower heart rate gradually"
      },
      {
        name: "Static Stretches",
        duration: "3-5 minutes",
        description: "Hold stretches for major muscle groups",
        purpose: "Improve flexibility and reduce muscle tension"
      },
      {
        name: "Deep Breathing",
        duration: "2 minutes",
        description: "Practice deep breathing exercises",
        purpose: "Relaxation and recovery"
      }
    ]
  };
}

// Add this function at the top of the file
async function ensureDefaultUser() {
  try {
    const defaultUser = await prisma.user.findUnique({
      where: { id: 'anonymous' }
    });

    if (!defaultUser) {
      await prisma.user.create({
          data: {
          id: 'anonymous',
          email: 'anonymous@example.com',
          name: 'Anonymous User',
          password: 'anonymous' // Add required password field
        }
      });
    }
    return true;
  } catch (error) {
    console.error('Error ensuring default user:', error);
    throw new Error('Failed to ensure default user exists');
  }
}

// Update the type guard function
function isOpenAIAvailable(client: typeof openai): client is NonNullable<typeof openai> {
  return client !== null && client !== undefined;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const decoded = verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get request data
    const {
      daysPerWeek,
      goal,
      fitnessLevel,
      weight,
      height,
    } = await req.json();

    // Validate required fields
    if (!daysPerWeek || !goal || !fitnessLevel || !weight || !height) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate BMI
    const bmi = calculateBMI(parseFloat(weight), parseFloat(height));
    const bmiCategory = getBMICategory(bmi);

    // Check if OpenAI is available and properly initialized
    if (!openai) {
      console.log('OpenAI client not initialized, using fallback plan');
      const fallbackPlan = generateFallbackPlan(
        daysPerWeek,
        goal,
        fitnessLevel as FitnessLevel,
        bmiCategory
      );

      // Save fallback plan
      const savedPlan = await savePlanToDatabase(fallbackPlan, decoded.id, {
        bmi,
        bmiCategory,
        fitnessLevel,
        goal,
        daysPerWeek
      });

      return NextResponse.json({
        workoutPlan: fallbackPlan,
        planId: savedPlan.id,
        message: 'Using fallback workout plan (OpenAI not configured)'
      });
    }

    try {
      console.log('Generating workout plan with OpenAI...');
      const systemPrompt = generateSystemPrompt(daysPerWeek, goal, fitnessLevel as FitnessLevel, bmiCategory);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a ${daysPerWeek}-day workout plan for a ${fitnessLevel} level person with BMI category ${bmiCategory}, focusing on ${goal}.` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('OpenAI returned empty response');
      }

      // Parse and validate the response
      const workoutPlan = JSON.parse(content);
      
      // Validate workout plan structure
      if (!workoutPlan.days || !Array.isArray(workoutPlan.days)) {
        throw new Error('Invalid workout plan format: missing or invalid days array');
      }

      if (workoutPlan.days.length !== parseInt(daysPerWeek)) {
        throw new Error(`Invalid workout plan: expected ${daysPerWeek} days but got ${workoutPlan.days.length}`);
      }

      // Save the plan to the database
      const savedPlan = await savePlanToDatabase(workoutPlan, decoded.id, {
        bmi,
        bmiCategory,
        fitnessLevel,
        goal,
        daysPerWeek
      });

      return NextResponse.json({
        workoutPlan,
        planId: savedPlan.id
      });

    } catch (error: any) {
      console.error('Error generating workout plan:', error);
      return NextResponse.json(
        { error: `Failed to generate workout plan: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in workout plan endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper function to save plan to database
async function savePlanToDatabase(plan: any, userId: string, metadata: {
  bmi: number;
  bmiCategory: string;
  fitnessLevel: string;
  goal: string;
  daysPerWeek: string;
}) {
  return await prisma.workoutPlan.create({
    data: {
      userId: userId,
      name: plan.name,
      description: plan.description,
      exercises: [plan],
      bmi: metadata.bmi,
      bmiCategory: metadata.bmiCategory,
      fitnessLevel: metadata.fitnessLevel,
      goal: metadata.goal,
      daysPerWeek: parseInt(metadata.daysPerWeek)
    },
  });
} 