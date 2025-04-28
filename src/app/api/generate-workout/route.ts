import dotenv from 'dotenv';
dotenv.config();
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import openai from '@/lib/openai';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

// Types for workout generation
type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

// Add these interfaces at the top of the file, before any other interfaces
interface Exercise {
  name: string;
  sets: number;
  reps: number | string;
  restTime: number | string;
  description: string;
  intensity?: string;
  notes?: string;
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
}

interface WarmUpCoolDown {
  name: string;
  duration: string;
  description: string;
}

interface FocusArea {
  name: string;
  priority: string;
}

type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

interface WorkoutDay {
  dayNumber: number;
  exercises: Exercise[];
  warmup: {
    duration: string;
    exercises: WarmUpCoolDown[];
  };
  cooldown: {
    duration: string;
    exercises: WarmUpCoolDown[];
  };
}

export interface WorkoutPlan {
  id?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  plan: {
    days: WorkoutDay[];
    focusAreas: FocusArea[];
    progression: {
      level: FitnessLevel;
      weekNumber: number;
    };
  };
  metadata: {
    bmi: number;
    bmiCategory: string;
    fitnessLevel: FitnessLevel;
    goal: string;
    daysPerWeek: number;
    weekNumber: number;
  };
}

// Use Prisma's InputJsonValue type
type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray;
type InputJsonObject = { [Key in string]?: InputJsonValue };
type InputJsonArray = InputJsonValue[];

// Enhanced exercise database with more exercises and detailed information
const exercisesByFocus: Record<string, Record<FitnessLevel, Exercise[]>> = {
  'Full Body': {
    beginner: [
      {
        name: 'Bodyweight Squats',
        sets: 3,
        reps: '10-12',
        restTime: '60 seconds',
        description: 'Fundamental lower body exercise that targets multiple muscle groups',
        difficulty: 'Beginner',
        equipment: ['None'],
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
        setup: 'Stand with feet shoulder-width apart, toes slightly turned out',
        execution: {
          starting_position: 'Stand tall with chest up and core engaged',
          movement: 'Lower body by bending knees and hips, keeping chest up',
          breathing: 'Inhale on the way down, exhale on the way up',
          tempo: '2-1-2',
          form_cues: [
            'Keep knees aligned with toes',
            'Maintain neutral spine',
            'Push through heels to stand'
          ]
        },
        progression: {
          next_steps: 'Add weight or try single leg variations',
          variations: ['Goblet Squats', 'Split Squats'],
          scaling_options: ['Box Squats', 'Assisted Squats']
        }
      },
      {
        name: 'Push-Ups',
        sets: 3,
        reps: '8-10',
        restTime: '60 seconds',
        description: 'Classic upper body exercise that builds chest and arm strength',
        difficulty: 'Beginner',
        equipment: ['None'],
        muscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
        setup: 'Start in high plank position with hands slightly wider than shoulders',
        execution: {
          starting_position: 'Body in straight line from head to heels',
          movement: 'Lower body until chest nearly touches ground, then push back up',
          breathing: 'Inhale on the way down, exhale on the way up',
          tempo: '2-1-2',
          form_cues: [
            'Keep elbows at 45-degree angle',
            'Maintain straight body line',
            'Engage core throughout'
          ]
        },
        progression: {
          next_steps: 'Increase reps or try more challenging variations',
          variations: ['Wide Grip Push-Ups', 'Diamond Push-Ups'],
          scaling_options: ['Knee Push-Ups', 'Incline Push-Ups']
        }
      },
      {
        name: 'Plank',
        sets: 3,
        reps: '30-45 seconds',
        restTime: '60 seconds',
        description: 'Core stability exercise that improves posture and strength',
        difficulty: 'Beginner',
        equipment: ['Exercise Mat'],
        muscles: ['Core', 'Shoulders', 'Glutes'],
        setup: 'Start in push-up position with forearms on ground',
        execution: {
          starting_position: 'Body in straight line from head to heels',
          movement: 'Hold position while maintaining form',
          breathing: 'Breathe steadily throughout',
          tempo: 'Static hold',
          form_cues: [
            'Keep core tight',
            'Don\'t let hips sag',
            'Look slightly ahead'
          ]
        },
        progression: {
          next_steps: 'Increase hold time or add movement',
          variations: ['Side Plank', 'Plank with Leg Lift'],
          scaling_options: ['Knee Plank']
        }
      }
    ],
    intermediate: [
      {
        name: 'Jump Squats',
        sets: 3,
        reps: '10-12',
        restTime: '60-90 seconds',
        description: 'Explosive lower body exercise that builds power',
        difficulty: 'Intermediate',
        equipment: ['None'],
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        setup: 'Stand with feet shoulder-width apart',
        execution: {
          starting_position: 'Arms at sides or in front for balance',
          movement: 'Squat down then explode up into a jump',
          breathing: 'Inhale on the way down, exhale on the way up',
          tempo: 'Explosive',
          form_cues: [
            'Land softly on balls of feet',
            'Keep knees aligned with toes',
            'Use arms for momentum'
          ]
        },
        progression: {
          next_steps: 'Add height or try single leg variations',
          variations: ['Tuck Jump Squats', 'Split Jump Squats'],
          scaling_options: ['Box Jump Squats']
        }
      },
      {
        name: 'Burpees',
        sets: 3,
        reps: '8-10',
        restTime: '60-90 seconds',
        description: 'Full body explosive movement that improves conditioning',
        difficulty: 'Intermediate',
        equipment: ['None'],
        muscles: ['Full Body'],
        setup: 'Stand with feet shoulder-width apart',
        execution: {
          starting_position: 'Stand tall with arms at sides',
          movement: 'Squat down, kick feet back, do push-up, jump feet in, explode up',
          breathing: 'Inhale during squat, exhale during jump',
          tempo: 'Explosive',
          form_cues: [
            'Maintain proper push-up form',
            'Land softly from jump',
            'Keep core engaged throughout'
          ]
        },
        progression: {
          next_steps: 'Add push-up or increase speed',
          variations: ['Burpee Box Jumps', 'Burpee Pull-Ups'],
          scaling_options: ['Step-Back Burpees']
        }
      }
    ],
    advanced: [
      {
        name: 'Pistol Squats',
        sets: 3,
        reps: '6-8 per leg',
        restTime: '90 seconds',
        description: 'Advanced single leg squat variation that builds strength and balance',
        difficulty: 'Advanced',
        equipment: ['None'],
        muscles: ['Quadriceps', 'Glutes', 'Core', 'Balance'],
        setup: 'Stand on one leg with other leg extended forward',
        execution: {
          starting_position: 'Arms extended forward for balance',
          movement: 'Lower body while keeping extended leg straight',
          breathing: 'Inhale on the way down, exhale on the way up',
          tempo: '3-0-2',
          form_cues: [
            'Keep chest up',
            'Maintain balance',
            'Control descent'
          ]
        },
        progression: {
          next_steps: 'Add weight or try jumping variation',
          variations: ['Weighted Pistol Squats', 'Jumping Pistol Squats'],
          scaling_options: ['Assisted Pistol Squats']
        }
      },
      {
        name: 'Handstand Push-Ups',
        sets: 3,
        reps: '5-8',
        restTime: '90-120 seconds',
        description: 'Advanced overhead pressing movement that builds shoulder strength',
        difficulty: 'Advanced',
        equipment: ['Wall'],
        muscles: ['Shoulders', 'Triceps', 'Core'],
        setup: 'Start in handstand position against wall',
        execution: {
          starting_position: 'Body straight, hands shoulder-width apart',
          movement: 'Lower head to ground, then press back up',
          breathing: 'Inhale on the way down, exhale on the way up',
          tempo: '2-0-2',
          form_cues: [
            'Keep core tight',
            'Control descent',
            'Maintain straight body line'
          ]
        },
        progression: {
          next_steps: 'Try freestanding or add weight',
          variations: ['Freestanding Handstand Push-Ups', 'Deficit Handstand Push-Ups'],
          scaling_options: ['Pike Push-Ups']
        }
      },
      {
        name: 'Muscle-Ups',
        sets: 3,
        reps: '3-5',
        restTime: '120 seconds',
        description: 'Advanced upper body pulling and pushing movement',
        difficulty: 'Advanced',
        equipment: ['Pull-up Bar'],
        muscles: ['Back', 'Chest', 'Shoulders', 'Arms'],
        setup: 'Hang from pull-up bar with overhand grip',
        execution: {
          starting_position: 'Arms fully extended',
          movement: 'Pull up and transition over the bar',
          breathing: 'Inhale before movement, exhale during transition',
          tempo: 'Explosive',
          form_cues: [
            'Use momentum from pull-up',
            'Keep bar close to body',
            'Control descent'
          ]
        },
        progression: {
          next_steps: 'Try strict muscle-ups or add weight',
          variations: ['Strict Muscle-Ups', 'Weighted Muscle-Ups'],
          scaling_options: ['Assisted Muscle-Ups']
        }
      },
      {
        name: 'Dragon Flags',
        sets: 3,
        reps: '6-8',
        restTime: '90 seconds',
        description: 'Advanced core exercise',
        difficulty: 'Advanced',
        equipment: ['Bench'],
        muscles: ['Core', 'Hip Flexors'],
        setup: 'Lie on bench with hands gripping behind head',
        execution: {
          starting_position: 'Body straight, legs extended',
          movement: 'Lift legs and lower body while keeping core tight',
          breathing: 'Exhale on the way up, inhale on the way down',
          tempo: '2-1-2',
          form_cues: [
            'Keep core engaged',
            'Control movement',
            'Don\'t use momentum'
          ]
        },
        progression: {
          next_steps: 'Try hanging variation or add weight',
          variations: ['Hanging Dragon Flags', 'Weighted Dragon Flags'],
          scaling_options: ['Bent Knee Dragon Flags']
        }
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
  return `You are a professional fitness coach. Generate a workout plan in JSON format with the following structure:
{
  "name": "string",
  "description": "string",
  "days": [
    {
      "name": "string",
      "focus": "string",
      "warmup": { ... },
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": number,
          "rest": "string",
          "description": "string"
        }
      ],
      "cooldown": { ... },
      "notes": "string"
    }
  ]
}
IMPORTANT: Each day MUST have at least 4 exercises in the 'exercises' array, each with all fields filled. Do NOT return any text outside the JSON.`;
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

// Update the validation function to match the new structure
function validateWorkoutPlan(plan: WorkoutPlan): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for plan and days
  if (!plan.plan || !plan.plan.days || plan.plan.days.length === 0) {
    errors.push('Workout plan must have at least one day');
  }

  // Validate each day
  plan.plan.days.forEach((day, index) => {
    if (!day.exercises || day.exercises.length === 0) {
      errors.push(`Day ${index + 1} must have at least one exercise`);
    }
    // Exercise validation
    day.exercises.forEach((exercise, exIndex) => {
      if (!exercise.name) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing a name`);
      if (!exercise.sets || exercise.sets < 1) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} has invalid sets`);
      if (!exercise.reps) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing reps`);
      if (!exercise.restTime) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing rest time`);
      // intensity and notes are optional
    });
    // Warmup and cooldown validation
    if (!day.warmup || !day.warmup.exercises || day.warmup.exercises.length === 0) {
      errors.push(`Day ${index + 1} must have at least one warmup exercise`);
    }
    if (!day.cooldown || !day.cooldown.exercises || day.cooldown.exercises.length === 0) {
      errors.push(`Day ${index + 1} must have at least one cooldown exercise`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Update fallback plan generator to match new structure
function generateFallbackPlan(
  daysPerWeek: string,
  goal: string,
  fitnessLevel: FitnessLevel,
  bmiCategory: BMICategory
): WorkoutPlan {
  const numDays = parseInt(daysPerWeek);
  const days: WorkoutDay[] = [];
  for (let i = 0; i < numDays; i++) {
    const day: WorkoutDay = {
      dayNumber: i + 1,
      exercises: [
        {
          name: 'Bodyweight Squats',
          sets: 3,
          reps: 12,
          restTime: 60,
          intensity: 'moderate',
          notes: 'Focus on form',
          description: 'Fundamental lower body exercise that targets multiple muscle groups'
        }
      ],
      warmup: {
        duration: '10 minutes',
        exercises: [
          {
            name: 'Light Jogging',
            duration: '5 minutes',
            description: 'Increase heart rate'
          }
        ]
      },
      cooldown: {
        duration: '5 minutes',
        exercises: [
          {
            name: 'Static Stretching',
            duration: '5 minutes',
            description: 'Cool down and stretch major muscle groups'
          }
        ]
      }
    };
    days.push(day);
  }
  return {
    userId: 'test-user-id',
    plan: {
      days,
      focusAreas: [
        { name: goal === 'weight_loss' ? 'Fat Loss' : 'Muscle Building', priority: 'high' }
      ],
      progression: {
        level: fitnessLevel,
        weekNumber: 1
      }
    },
    metadata: {
      bmi: 0,
      bmiCategory: bmiCategory,
      fitnessLevel: fitnessLevel,
      goal: goal,
      daysPerWeek: numDays,
      weekNumber: 1
    }
  };
}

// Enhanced progression system
function calculateProgression(
  fitnessLevel: FitnessLevel,
  bmiCategory: BMICategory,
  goal: string,
  weekNumber: number = 1
): { sets: number; reps: string; restTime: string } {
  // Base values for first week
  const baseSets = fitnessLevel === 'beginner' ? 3 : fitnessLevel === 'intermediate' ? 4 : 5;
  const baseReps = fitnessLevel === 'beginner' ? '8-10' : fitnessLevel === 'intermediate' ? '10-12' : '12-15';
  const baseRest = fitnessLevel === 'beginner' ? '90-120 seconds' : fitnessLevel === 'intermediate' ? '60-90 seconds' : '45-60 seconds';
  
  // Adjust based on BMI category
  const bmiAdjustment = bmiCategory === 'obese' ? 1 : bmiCategory === 'overweight' ? 0.5 : 0;
  const adjustedSets = Math.max(2, baseSets - bmiAdjustment);
  
  // Weekly progression
  const weeklyProgression = Math.min(weekNumber - 1, 3); // Cap at 3 weeks of progression
  const progressionMultiplier = 1 + (weeklyProgression * 0.1); // 10% increase per week
  
  // Adjust based on goal
  if (goal.toLowerCase().includes('strength')) {
    return {
      sets: Math.ceil(adjustedSets * progressionMultiplier),
      reps: '4-6',
      restTime: '120-180 seconds'
    };
  } else if (goal.toLowerCase().includes('endurance')) {
    return {
      sets: Math.ceil((adjustedSets + 1) * progressionMultiplier),
      reps: '15-20',
      restTime: '30-45 seconds'
    };
  } else if (goal.toLowerCase().includes('hypertrophy')) {
    return {
      sets: Math.ceil(adjustedSets * progressionMultiplier),
      reps: '8-12',
      restTime: '60-90 seconds'
    };
  }
  
  // Default progression for general fitness
  return {
    sets: Math.ceil(adjustedSets * progressionMultiplier),
    reps: baseReps,
    restTime: baseRest
  };
}

// Helper function to generate exercise guidance
function generateExerciseGuidance(goal: string, fitnessLevel: FitnessLevel, bmiCategory: BMICategory): string {
  const guidance: string[] = [];
  
  if (goal.toLowerCase().includes('strength')) {
    guidance.push('compound movements with proper form');
    guidance.push('progressive overload');
    guidance.push('adequate rest between sets');
  } else if (goal.toLowerCase().includes('endurance')) {
    guidance.push('higher rep ranges');
    guidance.push('circuit-style training');
    guidance.push('minimal rest between exercises');
  } else if (goal.toLowerCase().includes('hypertrophy')) {
    guidance.push('moderate rep ranges (8-12)');
    guidance.push('time under tension');
    guidance.push('controlled movements');
  }
  
  if (bmiCategory === 'obese' || bmiCategory === 'overweight') {
    guidance.push('low-impact variations');
    guidance.push('proper joint alignment');
    guidance.push('gradual progression');
  }
  
  if (fitnessLevel === 'beginner') {
    guidance.push('master basic movements first');
    guidance.push('focus on form over weight');
    guidance.push('use scaling options when needed');
  }
  
  return guidance.join(', ');
}

// Helper function to generate progression guidance
function generateProgressionGuidance(goal: string, fitnessLevel: FitnessLevel, weekNumber: number): string {
  const guidance: string[] = [];
  
  if (weekNumber > 1) {
    guidance.push(`Week ${weekNumber} progression: Increase intensity by 10%`);
  }
  
  if (goal.toLowerCase().includes('strength')) {
    guidance.push('Focus on increasing weight while maintaining form');
    guidance.push('Keep reps in the 4-6 range');
  } else if (goal.toLowerCase().includes('endurance')) {
    guidance.push('Focus on increasing duration or reducing rest time');
    guidance.push('Maintain form throughout higher rep ranges');
  } else if (goal.toLowerCase().includes('hypertrophy')) {
    guidance.push('Focus on time under tension and muscle contraction');
    guidance.push('Gradually increase weight while maintaining 8-12 rep range');
  }
  
  if (fitnessLevel === 'beginner') {
    guidance.push('Master form before increasing intensity');
    guidance.push('Use scaling options when needed');
  }
  
  return guidance.join('. ');
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
          password: 'anonymous'
        }
      });
    }
    return 'anonymous'; // Return the user ID instead of boolean
  } catch (error) {
    console.error('Error ensuring default user:', error);
    throw new Error('Failed to ensure default user exists');
  }
}

// Update the type guard function
function isOpenAIAvailable(client: typeof openai): client is NonNullable<typeof openai> {
  return client !== null && client !== undefined;
}

// Update the savePlanToDatabase function to match Prisma schema
async function savePlanToDatabase(
  workoutPlan: WorkoutPlan,
  userId: string,
  metadata: {
    bmi: number;
    bmiCategory: string;
    fitnessLevel: string;
    goal: string;
    daysPerWeek: number;
    weekNumber: number;
  }
) {
  try {
    // Transform exercises into array of JSON objects that matches Prisma's InputJsonValue type
    const exercisesArray = workoutPlan.plan.days.map(day => {
      return {
        dayNumber: day.dayNumber,
        exercises: day.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          restTime: ex.restTime,
          description: ex.description,
          intensity: ex.intensity,
          notes: ex.notes,
          difficulty: ex.difficulty,
          equipment: ex.equipment,
          muscles: ex.muscles,
          setup: ex.setup,
          execution: ex.execution,
          progression: ex.progression
        })),
        warmup: day.warmup,
        cooldown: day.cooldown
      };
    });

    // Save to database using Prisma's expected types
    const savePlan = await prisma.workoutPlan.create({
      data: {
        userId,
        name: `Workout Plan - Week ${metadata.weekNumber}`,
        description: `Custom workout plan for ${metadata.goal} - ${metadata.fitnessLevel} level`,
        exercises: exercisesArray as any[], // Cast to any[] to match Prisma's Json[] type
        planJson: workoutPlan.plan as any, // Cast to any to match Prisma's Json type
        bmi: metadata.bmi,
        bmiCategory: metadata.bmiCategory,
        fitnessLevel: metadata.fitnessLevel,
        goal: metadata.goal,
        daysPerWeek: metadata.daysPerWeek,
        weekNumber: metadata.weekNumber
      }
    });

    return savePlan;
  } catch (error) {
    console.error('Error saving workout plan:', error);
    throw error;
  }
}

// Restore the generateWorkoutPlan function
async function generateWorkoutPlan(params: {
  age: number;
  height: number;
  weight: number;
  gender: string;
  fitnessLevel: FitnessLevel;
  goal: string;
  daysPerWeek: number;
  bmi: number;
  bmiCategory: string;
}): Promise<WorkoutPlan> {
  const { age, height, weight, gender, fitnessLevel, goal, daysPerWeek, bmi, bmiCategory } = params;

  // Determine focus area based on goal
  let focusArea = 'Full Body';
  if (goal.toLowerCase().includes('upper')) focusArea = 'Upper Body & Core';
  else if (goal.toLowerCase().includes('lower')) focusArea = 'Lower Body & Core';
  else if (goal.toLowerCase().includes('endurance') || goal.toLowerCase().includes('cardio')) focusArea = 'Endurance & Cardio';

  // Get exercises for the focus area and fitness level
  const availableExercises = exercisesByFocus[focusArea]?.[fitnessLevel] || exercisesByFocus['Full Body'][fitnessLevel];

  // Generate days based on daysPerWeek
  const days: WorkoutDay[] = [];
  for (let i = 0; i < daysPerWeek; i++) {
    // Cycle through available exercises for variety
    const exercise = availableExercises[i % availableExercises.length];
    const progression = calculateProgression(fitnessLevel, bmiCategory as BMICategory, goal, 1);
    const exerciseWithProgression = {
      ...exercise,
      sets: progression.sets,
      reps: progression.reps,
      restTime: progression.restTime
    };

    const day: WorkoutDay = {
      dayNumber: i + 1,
      exercises: [exerciseWithProgression],
      warmup: {
        duration: '10 minutes',
        exercises: [
          {
            name: 'Light Jogging',
            duration: '5 minutes',
            description: 'Increase heart rate'
          },
          {
            name: 'Dynamic Stretching',
            duration: '5 minutes',
            description: 'Arm circles, leg swings, hip rotations'
          }
        ]
      },
      cooldown: {
        duration: '5 minutes',
        exercises: [
          {
            name: 'Static Stretching',
            duration: '5 minutes',
            description: 'Cool down and stretch major muscle groups'
          }
        ]
      }
    };
    days.push(day);
  }

  // Build the workout plan
  const workoutPlan: WorkoutPlan = {
    userId: 'test-user-id',
    plan: {
      days,
      focusAreas: [
        {
          name: goal === 'weight_loss' ? 'Fat Loss' : 'Muscle Building',
          priority: 'high'
        }
      ],
      progression: {
        level: fitnessLevel,
        weekNumber: 1
      }
    },
    metadata: {
      bmi,
      bmiCategory,
      fitnessLevel,
      goal,
      daysPerWeek,
      weekNumber: 1
    }
  };

  // Validate the plan
  const validation = validateWorkoutPlan(workoutPlan);
  if (!validation.isValid) {
    // Fallback to a basic plan if validation fails
    return generateFallbackPlan(daysPerWeek.toString(), goal, fitnessLevel, bmiCategory as BMICategory);
  }

  return workoutPlan;
}

export async function POST(req: Request) {
  try {
    const { age, height, weight, gender, fitnessLevel, goal, daysPerWeek } = await req.json();
    
    // Calculate BMI
    const bmi = calculateBMI(weight, height);
    const bmiCategory = getBMICategory(bmi);
    
    // Generate workout plan
    const workoutPlan = await generateWorkoutPlan({
      age,
      height,
      weight,
      gender,
      fitnessLevel,
      goal,
      daysPerWeek,
      bmi,
      bmiCategory
    });

    // Save to database
    const savedPlan = await savePlanToDatabase(workoutPlan, 'test-user-id', {
      bmi,
      bmiCategory,
      fitnessLevel,
      goal,
      daysPerWeek,
      weekNumber: 1
    });

    return NextResponse.json(savedPlan);
  } catch (error) {
    console.error('Error generating workout plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    );
  }
}