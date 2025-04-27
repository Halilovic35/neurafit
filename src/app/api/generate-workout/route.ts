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

interface Exercise {
  name: string;
  sets: number;
  reps: number | string;  // Allow both number and string for reps
  restTime: string;
  description: string;
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

// Update the WorkoutPlan interface to match Prisma schema exactly
interface WorkoutPlan {
  name: string;
  description: string;
  days: WorkoutDay[];
  exercises?: Prisma.JsonValue[];
  bmi: number;
  bmiCategory: string;
  fitnessLevel: string;
  goal: string;
  daysPerWeek: number;
  weekNumber?: number;
}

// Use Prisma's InputJsonValue type
type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray;
type InputJsonObject = { [Key in string]?: InputJsonValue };
type InputJsonArray = InputJsonValue[];

// Enhanced exercise database with more exercises and detailed information
const exercisesByFocus: Record<FocusArea, Record<FitnessLevel, Exercise[]>> = {
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

// Enhanced validation function
function validateWorkoutPlan(plan: WorkoutPlan, expectedDays: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic plan validation
  if (!plan.name) errors.push('Workout plan is missing a name');
  if (!plan.description) errors.push('Workout plan is missing a description');
  if (!plan.days || plan.days.length !== expectedDays) {
    errors.push(`Workout plan must have exactly ${expectedDays} days`);
  }

  // Validate each day
  plan.days.forEach((day, index) => {
    // Day structure validation
    if (!day.name) errors.push(`Day ${index + 1} is missing a name`);
    if (!day.focus) errors.push(`Day ${index + 1} is missing a focus area`);
    if (!day.exercises || day.exercises.length < 4) {
      errors.push(`Day ${index + 1} must have at least 4 exercises`);
    }

    // Exercise validation
    day.exercises.forEach((exercise, exIndex) => {
      if (!exercise.name) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing a name`);
      if (!exercise.sets || exercise.sets < 1) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} has invalid sets`);
      if (!exercise.reps) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing reps`);
      if (!exercise.restTime) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing rest time`);
      if (!exercise.description) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing description`);
      if (!exercise.difficulty) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing difficulty level`);
      if (!exercise.equipment || !Array.isArray(exercise.equipment)) {
        errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} has invalid equipment list`);
      }
      if (!exercise.muscles || !Array.isArray(exercise.muscles)) {
        errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} has invalid muscles list`);
      }
      if (!exercise.setup) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing setup instructions`);
      if (!exercise.execution) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing execution details`);
      if (!exercise.progression) errors.push(`Day ${index + 1}, Exercise ${exIndex + 1} is missing progression information`);
    });

    // Warmup and cooldown validation
    if (!day.warmup || !day.warmup.exercises || day.warmup.exercises.length < 3) {
      errors.push(`Day ${index + 1} has insufficient warmup exercises (minimum 3 required)`);
    } else {
      day.warmup.exercises.forEach((exercise, exIndex) => {
        if (!exercise.name) errors.push(`Day ${index + 1}, Warmup Exercise ${exIndex + 1} is missing a name`);
        if (!exercise.duration) errors.push(`Day ${index + 1}, Warmup Exercise ${exIndex + 1} is missing duration`);
        if (!exercise.description) errors.push(`Day ${index + 1}, Warmup Exercise ${exIndex + 1} is missing description`);
        if (!exercise.purpose) errors.push(`Day ${index + 1}, Warmup Exercise ${exIndex + 1} is missing purpose`);
      });
    }

    if (!day.cooldown || !day.cooldown.exercises || day.cooldown.exercises.length < 3) {
      errors.push(`Day ${index + 1} has insufficient cooldown exercises (minimum 3 required)`);
    } else {
      day.cooldown.exercises.forEach((exercise, exIndex) => {
        if (!exercise.name) errors.push(`Day ${index + 1}, Cooldown Exercise ${exIndex + 1} is missing a name`);
        if (!exercise.duration) errors.push(`Day ${index + 1}, Cooldown Exercise ${exIndex + 1} is missing duration`);
        if (!exercise.description) errors.push(`Day ${index + 1}, Cooldown Exercise ${exIndex + 1} is missing description`);
        if (!exercise.purpose) errors.push(`Day ${index + 1}, Cooldown Exercise ${exIndex + 1} is missing purpose`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
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

async function generateWorkoutPlan(
  messages: ChatCompletionMessageParam[],
  retryCount = 0,
  daysPerWeek: string,
  goal: string,
  fitnessLevel: FitnessLevel,
  bmiCategory: BMICategory,
  weekNumber: number = 1
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
    
    // Calculate progression parameters
    const progression = calculateProgression(fitnessLevel, bmiCategory, goal, weekNumber);
    
    // Generate exercise guidance based on goal and fitness level
    const exerciseGuidance = generateExerciseGuidance(goal, fitnessLevel, bmiCategory);
    
    // Generate progression guidance
    const progressionGuidance = generateProgressionGuidance(goal, fitnessLevel, weekNumber);
    
    // Update system prompt with progression information
    const systemPrompt = generateWorkoutTemplate(
      daysPerWeek,
      goal,
      fitnessLevel,
      bmiCategory,
      exerciseGuidance,
      progressionGuidance
    );
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature,
      max_tokens: maxTokens,
      stream: false
    });

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error('No valid response from OpenAI');
    }

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('Received response from OpenAI, attempting to parse...');
    
    try {
      // Clean the response content
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsedContent = JSON.parse(cleanedContent);
      
      // Validate the workout plan
      const validation = validateWorkoutPlan(parsedContent, parseInt(daysPerWeek));
      if (!validation.isValid) {
        throw new Error(`Invalid workout plan: ${validation.errors.join(', ')}`);
      }
      
      // Apply progression to exercises
      parsedContent.days.forEach((day: WorkoutDay) => {
        day.exercises.forEach((exercise: Exercise) => {
          exercise.sets = progression.sets;
          exercise.reps = progression.reps;
          exercise.restTime = progression.restTime;
        });
      });
      
      console.log('Successfully generated and validated workout plan');
      return parsedContent as WorkoutPlan;
    } catch (parseError: unknown) {
      console.error('JSON parsing error:', parseError);
      console.error('Invalid JSON content:', content);
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('Error generating workout plan:', error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying workout plan generation (attempt ${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generateWorkoutPlan(messages, retryCount + 1, daysPerWeek, goal, fitnessLevel, bmiCategory, weekNumber);
    }
    
    // If all retries fail, return a fallback plan
    console.log('All retries failed, returning fallback plan');
    return generateFallbackPlan(daysPerWeek, goal, fitnessLevel, bmiCategory);
  }
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

export async function POST(req: Request) {
  console.log('API /api/generate-workout called');
  try {
    const userId = await ensureDefaultUser();
    const body = await req.json();
    const { age, height, weight, gender, goal, fitnessLevel, daysPerWeek, weekNumber = 1 } = body;

    // Input validation
    if (!age || !height || !weight || !gender || !goal || !fitnessLevel || !daysPerWeek) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert numeric values
    const numericAge = parseInt(age);
    const numericHeight = parseFloat(height);
    const numericWeight = parseFloat(weight);
    const numericDaysPerWeek = parseInt(daysPerWeek);
    const numericWeekNumber = parseInt(weekNumber);

    // Validate numeric values
    if (isNaN(numericAge) || isNaN(numericHeight) || isNaN(numericWeight) || isNaN(numericDaysPerWeek) || isNaN(numericWeekNumber)) {
      return NextResponse.json(
        { error: 'Invalid numeric values' },
        { status: 400 }
      );
    }

    // Additional validation for daysPerWeek
    if (numericDaysPerWeek < 1 || numericDaysPerWeek > 7) {
      return NextResponse.json(
        { error: 'Days per week must be between 1 and 7' },
        { status: 400 }
      );
    }

    // Calculate BMI and get category
    const bmi = calculateBMI(numericWeight, numericHeight);
    const bmiCategory = getBMICategory(bmi);

    // Generate system prompt
    const systemPrompt = generateSystemPrompt(
      numericDaysPerWeek.toString(),
      goal,
      fitnessLevel as FitnessLevel,
      bmiCategory
    );

    // Check if OpenAI client is available
    if (!isOpenAIAvailable(openai)) {
      console.error('OpenAI client not available');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    try {
      // Set a timeout for the OpenAI request
      const timeoutMs = 30000; // 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
      });

      // Make the OpenAI request with retry logic
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          const workoutPlanPromise = generateWorkoutPlan(
            [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `Generate a workout plan for a ${gender}, ${age} years old, ${height}cm tall, ${weight}kg person with ${fitnessLevel} fitness level, aiming for ${goal}, training ${numericDaysPerWeek} days per week.`
              }
            ],
            i,
            numericDaysPerWeek.toString(),
            goal,
            fitnessLevel as FitnessLevel,
            bmiCategory,
            numericWeekNumber
          );

          // Race between the workout plan generation and timeout
          const workoutPlan = await Promise.race([workoutPlanPromise, timeoutPromise]);

          // If we get here, the request succeeded
          // Save plan to database
          await savePlanToDatabase(workoutPlan, userId, {
            bmi,
            bmiCategory,
            fitnessLevel,
            goal,
            daysPerWeek: numericDaysPerWeek,
            weekNumber: numericWeekNumber
          });

          return NextResponse.json(workoutPlan);
        } catch (err) {
          const error = err as Error;
          lastError = error;
          console.error(`Attempt ${i + 1} failed:`, error);
          // Only continue retrying if it's not a timeout
          if (error.message === 'Request timed out') {
            break;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to generate workout plan');
    } catch (err) {
      const error = err as Error;
      console.error('Error generating workout plan:', error);
      return NextResponse.json(
        { error: `Failed to generate workout plan: ${error.message}` },
        { status: error.message === 'Request timed out' ? 504 : 500 }
      );
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update the savePlanToDatabase function to match Prisma schema
async function savePlanToDatabase(plan: WorkoutPlan, userId: string, metadata: {
  bmi: number;
  bmiCategory: string;
  fitnessLevel: string;
  goal: string;
  daysPerWeek: number;
  weekNumber?: number;
}) {
  // Convert the plan to a JSON-serializable object
  const planData = {
    ...plan,
    days: plan.days.map(day => ({
      ...day,
      exercises: day.exercises.map(exercise => ({
        ...exercise,
        execution: exercise.execution,
        progression: exercise.progression
      }))
    }))
  };

  // Create the workout plan with proper typing
  return await prisma.workoutPlan.create({
    data: {
      userId,
      name: plan.name,
      description: plan.description,
      exercises: [planData],
      bmi: metadata.bmi,
      bmiCategory: metadata.bmiCategory,
      fitnessLevel: metadata.fitnessLevel,
      goal: metadata.goal,
      daysPerWeek: metadata.daysPerWeek,
      weekNumber: metadata.weekNumber || 1
    },
  });
}

export async function generateWorkoutPlan(userProfile: {
  age: number;
  height: number;
  weight: number;
  gender: string;
  fitnessLevel: string;
  goal: string;
  daysPerWeek: number;
  bmi: number;
  bmiCategory: string;
}): Promise<WorkoutPlan> {
  // Implementation
}

export function validateWorkoutPlan(plan: any): { isValid: boolean; errors: string[] } {
  // Implementation
} 