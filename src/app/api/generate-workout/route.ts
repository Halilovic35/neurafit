import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { OpenAI } from 'openai';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'neurafit-secret-key-2024-secure-and-unique';

// Initialize OpenAI with proper type definition
const openai: OpenAI | undefined = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 seconds timeout
      maxRetries: 3,
      baseURL: process.env.OPENAI_API_KEY?.startsWith('sk-proj-') 
        ? 'https://api.proxyapi.io/openai/v1'
        : 'https://api.openai.com/v1',
      defaultHeaders: process.env.OPENAI_API_KEY?.startsWith('sk-proj-') 
        ? { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        : undefined
    }) 
  : undefined;

// Add logging to debug OpenAI client initialization
if (openai) {
  console.log('OpenAI client initialized with base URL:', openai.baseURL);
} else {
  console.log('OpenAI client not initialized - missing API key');
}

// Update type definitions
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface Execution {
  starting_position: string;
  movement: string;
  breathing: string;
  tempo: string;
  form_cues: string[];
}

interface WarmupCooldownExercise {
  name: string;
  duration: string;
  description: string;
  purpose: string;
}

interface WarmupCooldown {
  duration: string;
  exercises: WarmupCooldownExercise[];
}

// Define exercise type
type Exercise = {
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
};

// Define focus areas type
type FocusArea = "Full Body" | "Lower Body & Core" | "Upper Body & Core" | "Endurance & Cardio";

// Define fitness level type
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

// Define exercises by focus area and fitness level
type ExercisesByFocus = {
  "Full Body": {
    beginner: Exercise[];
    intermediate: Exercise[];
    advanced: Exercise[];
  };
  "Lower Body & Core": {
    beginner: Exercise[];
    intermediate: Exercise[];
    advanced: Exercise[];
  };
  "Upper Body & Core": {
    beginner: Exercise[];
    intermediate: Exercise[];
    advanced: Exercise[];
  };
  "Endurance & Cardio": {
    beginner: Exercise[];
    intermediate: Exercise[];
    advanced: Exercise[];
  };
};

const exercisesByFocus: ExercisesByFocus = {
  "Full Body": {
    beginner: [
      {
        name: "Bodyweight Squats",
        sets: 3,
        reps: "10-12",
        rest: "60 seconds",
        notes: "Keep your back straight and knees aligned with toes",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Quadriceps", "Glutes", "Core"],
        setup: "Stand with feet shoulder-width apart",
        execution: {
          starting_position: "Stand with feet shoulder-width apart, arms extended forward",
          movement: "Lower your body by bending your knees and hips",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep chest up", "Knees track over toes", "Weight in heels"]
        },
        progression: {
          next_steps: "Once comfortable, try adding a light weight or increasing reps",
          variations: ["Sumo Squats", "Jump Squats", "Split Squats"],
          scaling_options: ["Use a chair for support", "Reduce range of motion", "Add resistance bands"]
        }
      },
      {
        name: "Push-ups",
        sets: 3,
        reps: "8-12",
        rest: "60 seconds",
        notes: "Keep your body straight and elbows close to your body",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Chest", "Shoulders", "Triceps"],
        setup: "Start in a plank position",
        execution: {
          starting_position: "Plank position with hands slightly wider than shoulders",
          movement: "Lower your body until your chest nearly touches the ground",
          breathing: "Inhale as you lower, exhale as you push up",
          tempo: "2-0-2",
          form_cues: ["Keep body straight", "Elbows close to body", "Core tight"]
        },
        progression: {
          next_steps: "Progress to standard push-ups, then weighted push-ups",
          variations: ["Knee Push-ups", "Wide-grip Push-ups", "Diamond Push-ups"],
          scaling_options: ["Elevate hands", "Use resistance bands", "Reduce range of motion"]
        }
      },
      {
        name: "Mountain Climbers",
        sets: 3,
        reps: "30-45 seconds",
        rest: "45 seconds",
        notes: "Keep your core engaged and maintain a steady pace",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Core", "Shoulders", "Hip Flexors"],
        setup: "Start in a plank position",
        execution: {
          starting_position: "Plank position",
          movement: "Alternate bringing knees to chest",
          breathing: "Breathe steadily",
          tempo: "Controlled",
          form_cues: ["Keep hips down", "Maintain plank position", "Controlled movement"]
        },
        progression: {
          next_steps: "Increase speed, add resistance",
          variations: ["Slow Mountain Climbers", "Cross-body Mountain Climbers", "Weighted Mountain Climbers"],
          scaling_options: ["Reduce speed", "Shorter duration", "Elevated position"]
        }
      },
      {
        name: "Plank",
        sets: 3,
        reps: "30-60 seconds",
        rest: "45 seconds",
        notes: "Maintain a straight line from head to heels",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Core", "Shoulders", "Back"],
        setup: "Get into a push-up position with forearms on the ground",
        execution: {
          starting_position: "Forearms on ground, body straight",
          movement: "Hold position while maintaining form",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Keep body straight", "Engage core", "Don't let hips sag"]
        },
        progression: {
          next_steps: "Increase hold time, add variations",
          variations: ["Side Plank", "Plank with Arm Lift", "Plank with Leg Lift"],
          scaling_options: ["Knee plank", "Elevated plank", "Reduced hold time"]
        }
      }
    ],
    intermediate: [
      {
        name: "Barbell Squats",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Maintain proper form with the barbell on your upper back",
        difficulty: "intermediate",
        equipment: ["Barbell", "Weight Plates", "Squat Rack"],
        muscles: ["Quadriceps", "Glutes", "Core"],
        setup: "Set up barbell in squat rack at appropriate height",
        execution: {
          starting_position: "Barbell on upper back, feet shoulder-width apart",
          movement: "Lower your body by bending your knees and hips",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep chest up", "Knees track over toes", "Weight in heels"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Front Squat", "Box Squat", "Pause Squat"],
          scaling_options: ["Reduce weight", "Use safety bars", "Adjust range of motion"]
        }
      },
      {
        name: "Pull-ups",
        sets: 4,
        reps: "6-10",
        rest: "90 seconds",
        notes: "Pull your body up until your chin is over the bar",
        difficulty: "intermediate",
        equipment: ["Pull-up Bar"],
        muscles: ["Back", "Biceps", "Shoulders"],
        setup: "Grip the pull-up bar with hands slightly wider than shoulders",
        execution: {
          starting_position: "Hang from the bar with arms fully extended",
          movement: "Pull your body up until your chin is over the bar",
          breathing: "Exhale as you pull up, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep core tight", "Pull elbows down", "Avoid swinging"]
        },
        progression: {
          next_steps: "Add weight, increase reps",
          variations: ["Wide-grip Pull-ups", "L-sit Pull-ups", "Weighted Pull-ups"],
          scaling_options: ["Use resistance bands", "Jumping Pull-ups", "Negatives"]
        }
      },
      {
        name: "Dumbbell Shoulder Press",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "intermediate",
        equipment: ["Dumbbells", "Bench"],
        muscles: ["Shoulders", "Triceps", "Core"],
        setup: "Sit on bench with dumbbells at shoulder height",
        execution: {
          starting_position: "Dumbbells at shoulder height, palms forward",
          movement: "Press dumbbells overhead until arms are fully extended",
          breathing: "Exhale as you press, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep back straight", "Core engaged", "Don't lean back"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Seated Press", "Arnold Press", "Push Press"],
          scaling_options: ["Reduce weight", "Use lighter dumbbells", "Adjust range of motion"]
        }
      },
      {
        name: "Romanian Deadlift",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Keep your back straight and feel the stretch in your hamstrings",
        difficulty: "intermediate",
        equipment: ["Dumbbells", "Barbell"],
        muscles: ["Hamstrings", "Glutes", "Lower Back"],
        setup: "Stand with feet hip-width apart, weights in front of thighs",
        execution: {
          starting_position: "Stand with weights in front of thighs",
          movement: "Hinge at hips while keeping back straight",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep back straight", "Feel stretch in hamstrings", "Don't round back"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Single-leg RDL", "Deficit RDL", "Pause RDL"],
          scaling_options: ["Reduce weight", "Use lighter weights", "Adjust range of motion"]
        }
      },
      {
        name: "Plank with Arm Lift",
        sets: 3,
        reps: "30-45 seconds",
        rest: "60 seconds",
        notes: "Maintain stability while lifting arms",
        difficulty: "intermediate",
        equipment: ["None"],
        muscles: ["Core", "Shoulders", "Back"],
        setup: "Get into a plank position",
        execution: {
          starting_position: "Standard plank position",
          movement: "Lift one arm while maintaining stability",
          breathing: "Breathe steadily",
          tempo: "Controlled",
          form_cues: ["Keep hips stable", "Don't rotate", "Maintain plank position"]
        },
        progression: {
          next_steps: "Add leg lifts, increase hold time",
          variations: ["Plank with Leg Lift", "Plank with Opposite Arm/Leg Lift", "Weighted Plank"],
          scaling_options: ["Reduce hold time", "Use knee plank", "Shorter range of motion"]
        }
      }
    ],
    advanced: [
      {
        name: "Deadlift",
        sets: 5,
        reps: "5-8",
        rest: "120 seconds",
        notes: "Maintain a neutral spine throughout the movement",
        difficulty: "advanced",
        equipment: ["Barbell", "Weight Plates"],
        muscles: ["Back", "Legs", "Core"],
        setup: "Set up barbell on the ground with appropriate weight",
        execution: {
          starting_position: "Feet hip-width apart, barbell over mid-foot",
          movement: "Lift the barbell by extending your hips and knees",
          breathing: "Inhale before lifting, exhale at the top",
          tempo: "2-0-2",
          form_cues: ["Keep back straight", "Hips back", "Bar close to body"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Deficit Deadlift", "Romanian Deadlift", "Sumo Deadlift"],
          scaling_options: ["Reduce weight", "Use blocks", "Adjust range of motion"]
        }
      },
      {
        name: "Bench Press",
        sets: 5,
        reps: "5-8",
        rest: "120 seconds",
        notes: "Keep your back arched and feet planted firmly",
        difficulty: "advanced",
        equipment: ["Bench", "Barbell", "Weight Plates"],
        muscles: ["Chest", "Shoulders", "Triceps"],
        setup: "Lie on bench with feet planted firmly on the ground",
        execution: {
          starting_position: "Barbell at chest level, hands slightly wider than shoulders",
          movement: "Press the barbell up until arms are fully extended",
          breathing: "Inhale as you lower, exhale as you press",
          tempo: "2-0-2",
          form_cues: ["Keep back arched", "Elbows at 45 degrees", "Feet planted"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Incline Bench Press", "Decline Bench Press", "Pause Bench Press"],
          scaling_options: ["Reduce weight", "Use safety bars", "Adjust range of motion"]
        }
      },
      {
        name: "Weighted Pull-ups",
        sets: 4,
        reps: "6-8",
        rest: "120 seconds",
        notes: "Maintain strict form with added weight",
        difficulty: "advanced",
        equipment: ["Pull-up Bar", "Weight Belt", "Weight Plates"],
        muscles: ["Back", "Biceps", "Shoulders"],
        setup: "Attach weight belt and secure weights",
        execution: {
          starting_position: "Hang from the bar with added weight",
          movement: "Pull your body up until your chin is over the bar",
          breathing: "Exhale as you pull up, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep core tight", "Pull elbows down", "Avoid swinging"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["L-sit Weighted Pull-ups", "Wide-grip Weighted Pull-ups", "One-arm Pull-ups"],
          scaling_options: ["Reduce weight", "Use assistance bands", "Adjust grip width"]
        }
      },
      {
        name: "Front Squat",
        sets: 5,
        reps: "5-8",
        rest: "120 seconds",
        notes: "Keep your elbows high and maintain an upright torso",
        difficulty: "advanced",
        equipment: ["Barbell", "Weight Plates", "Squat Rack"],
        muscles: ["Quadriceps", "Core", "Upper Back"],
        setup: "Set up barbell in front rack position",
        execution: {
          starting_position: "Barbell in front rack position, elbows high",
          movement: "Lower your body by bending your knees and hips",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep elbows high", "Maintain upright torso", "Knees track over toes"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Pause Front Squat", "Split Jerk", "Thruster"],
          scaling_options: ["Reduce weight", "Use safety bars", "Adjust range of motion"]
        }
      },
      {
        name: "Overhead Press",
        sets: 4,
        reps: "6-8",
        rest: "120 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "advanced",
        equipment: ["Barbell", "Weight Plates"],
        muscles: ["Shoulders", "Triceps", "Core"],
        setup: "Stand with barbell at shoulder height",
        execution: {
          starting_position: "Barbell at shoulder height, hands slightly wider than shoulders",
          movement: "Press the barbell overhead until arms are fully extended",
          breathing: "Exhale as you press, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep core tight", "Don't lean back", "Full range of motion"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Push Press", "Jerk", "Behind the Neck Press"],
          scaling_options: ["Reduce weight", "Use dumbbells", "Adjust range of motion"]
        }
      },
      {
        name: "Weighted Dips",
        sets: 4,
        reps: "6-8",
        rest: "120 seconds",
        notes: "Keep your elbows close to your body and maintain control",
        difficulty: "advanced",
        equipment: ["Dip Station", "Weight Belt", "Weight Plates"],
        muscles: ["Chest", "Triceps", "Shoulders"],
        setup: "Set up dip station and attach weight belt",
        execution: {
          starting_position: "Arms fully extended on dip bars",
          movement: "Lower your body until your upper arms are parallel to the ground",
          breathing: "Inhale as you lower, exhale as you press",
          tempo: "2-0-2",
          form_cues: ["Keep elbows close", "Don't swing", "Full range of motion"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["L-sit Dips", "Ring Dips", "Weighted Ring Dips"],
          scaling_options: ["Reduce weight", "Use assistance bands", "Adjust range of motion"]
        }
      }
    ]
  },
  "Lower Body & Core": {
    beginner: [
      {
        name: "Walking Lunges",
        sets: 3,
        reps: "10 steps each leg",
        rest: "60 seconds",
        notes: "Keep your back straight and knees aligned",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Quadriceps", "Glutes", "Core"],
        setup: "Stand with feet together",
        execution: {
          starting_position: "Stand with feet together",
          movement: "Step forward and lower your back knee",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep torso upright", "Knees track over toes", "Back knee nearly touches ground"]
        },
        progression: {
          next_steps: "Add weights, increase steps",
          variations: ["Reverse Lunges", "Side Lunges", "Curtsy Lunges"],
          scaling_options: ["Shorter steps", "Use support", "Reduce range of motion"]
        }
      },
      {
        name: "Glute Bridge",
        sets: 3,
        reps: "12-15",
        rest: "45 seconds",
        notes: "Focus on squeezing your glutes at the top",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Glutes", "Hamstrings", "Core"],
        setup: "Lie on your back with knees bent",
        execution: {
          starting_position: "Lie on back, knees bent, feet flat",
          movement: "Lift hips off the ground",
          breathing: "Exhale as you lift, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Squeeze glutes", "Keep back straight", "Don't overarch"]
        },
        progression: {
          next_steps: "Add single leg variations, increase reps",
          variations: ["Single-leg Bridge", "Marching Bridge", "Weighted Bridge"],
          scaling_options: ["Reduce range of motion", "Fewer reps", "Shorter hold time"]
        }
      },
      {
        name: "Bicycle Crunches",
        sets: 3,
        reps: "20 total (10 each side)",
        rest: "45 seconds",
        notes: "Keep your lower back pressed to the ground",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Core", "Obliques"],
        setup: "Lie on your back with knees bent",
        execution: {
          starting_position: "Lie on back, knees bent, hands behind head",
          movement: "Bring opposite elbow to knee",
          breathing: "Exhale as you twist, inhale as you return",
          tempo: "Controlled",
          form_cues: ["Keep lower back down", "Don't pull neck", "Controlled movement"]
        },
        progression: {
          next_steps: "Increase reps, add variations",
          variations: ["Russian Twists", "Leg Raises", "Plank to Downward Dog"],
          scaling_options: ["Fewer reps", "Slower tempo", "Reduced range of motion"]
        }
      },
      {
        name: "Wall Sit",
        sets: 3,
        reps: "30-45 seconds",
        rest: "60 seconds",
        notes: "Keep your back against the wall",
        difficulty: "beginner",
        equipment: ["Wall"],
        muscles: ["Quadriceps", "Glutes", "Core"],
        setup: "Stand with back against wall",
        execution: {
          starting_position: "Back against wall, feet forward",
          movement: "Slide down until knees are at 90 degrees",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Keep back against wall", "Knees at 90 degrees", "Weight in heels"]
        },
        progression: {
          next_steps: "Increase hold time, add variations",
          variations: ["Weighted Wall Sit", "Single-leg Wall Sit", "Wall Sit with Arm Raises"],
          scaling_options: ["Higher position", "Shorter hold time", "Use support"]
        }
      }
    ],
    intermediate: [
      {
        name: "Bulgarian Split Squats",
        sets: 4,
        reps: "8-12 each leg",
        rest: "90 seconds",
        notes: "Keep your torso upright and front knee aligned",
        difficulty: "intermediate",
        equipment: ["Bench", "Dumbbells"],
        muscles: ["Quadriceps", "Glutes", "Core"],
        setup: "Place back foot on bench, front foot forward",
        execution: {
          starting_position: "Back foot on bench, front foot forward",
          movement: "Lower your body until back knee nearly touches ground",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep torso upright", "Front knee tracks over toes", "Back knee nearly touches ground"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Weighted Bulgarian Split Squats", "Pause Bulgarian Split Squats", "Jumping Bulgarian Split Squats"],
          scaling_options: ["Reduce weight", "Use support", "Adjust range of motion"]
        }
      },
      {
        name: "Romanian Deadlift",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Keep your back straight and feel the stretch in your hamstrings",
        difficulty: "intermediate",
        equipment: ["Dumbbells", "Barbell"],
        muscles: ["Hamstrings", "Glutes", "Lower Back"],
        setup: "Stand with feet hip-width apart, weights in front of thighs",
        execution: {
          starting_position: "Stand with weights in front of thighs",
          movement: "Hinge at hips while keeping back straight",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep back straight", "Feel stretch in hamstrings", "Don't round back"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Single-leg RDL", "Deficit RDL", "Pause RDL"],
          scaling_options: ["Reduce weight", "Use lighter weights", "Adjust range of motion"]
        }
      },
      {
        name: "Russian Twists",
        sets: 4,
        reps: "20 total (10 each side)",
        rest: "60 seconds",
        notes: "Keep your core engaged and rotate from your torso",
        difficulty: "intermediate",
        equipment: ["Dumbbell", "Medicine Ball"],
        muscles: ["Core", "Obliques"],
        setup: "Sit with knees bent, feet off ground",
        execution: {
          starting_position: "Sit with knees bent, feet off ground",
          movement: "Rotate torso while holding weight",
          breathing: "Exhale as you twist, inhale as you return",
          tempo: "Controlled",
          form_cues: ["Keep feet off ground", "Rotate from torso", "Keep back straight"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Weighted Russian Twists", "Russian Twists with Leg Extension", "Russian Twists on Decline"],
          scaling_options: ["Reduce weight", "Feet on ground", "Fewer reps"]
        }
      },
      {
        name: "Calf Raises",
        sets: 4,
        reps: "15-20",
        rest: "60 seconds",
        notes: "Focus on full range of motion",
        difficulty: "intermediate",
        equipment: ["Step", "Dumbbells"],
        muscles: ["Calves"],
        setup: "Stand on edge of step with heels hanging off",
        execution: {
          starting_position: "Stand on edge of step, heels hanging off",
          movement: "Raise heels up and lower them down",
          breathing: "Exhale as you raise, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Full range of motion", "Keep knees straight", "Control the movement"]
        },
        progression: {
          next_steps: "Add weight, increase reps",
          variations: ["Single-leg Calf Raises", "Seated Calf Raises", "Jumping Calf Raises"],
          scaling_options: ["Reduce weight", "Fewer reps", "Flat ground"]
        }
      },
      {
        name: "Plank with Leg Lift",
        sets: 3,
        reps: "30-45 seconds",
        rest: "60 seconds",
        notes: "Maintain stability while lifting legs",
        difficulty: "intermediate",
        equipment: ["None"],
        muscles: ["Core", "Glutes", "Shoulders"],
        setup: "Get into a plank position",
        execution: {
          starting_position: "Standard plank position",
          movement: "Lift one leg while maintaining stability",
          breathing: "Breathe steadily",
          tempo: "Controlled",
          form_cues: ["Keep hips stable", "Don't rotate", "Maintain plank position"]
        },
        progression: {
          next_steps: "Add arm lifts, increase hold time",
          variations: ["Plank with Opposite Arm/Leg Lift", "Weighted Plank", "Plank with Knee Tucks"],
          scaling_options: ["Reduce hold time", "Use knee plank", "Shorter range of motion"]
        }
      }
    ],
    advanced: [
      {
        name: "Front Squats",
        sets: 5,
        reps: "5-8",
        rest: "120 seconds",
        notes: "Keep your elbows high and maintain an upright torso",
        difficulty: "advanced",
        equipment: ["Barbell", "Weight Plates", "Squat Rack"],
        muscles: ["Quadriceps", "Core", "Upper Back"],
        setup: "Set up barbell in front rack position",
        execution: {
          starting_position: "Barbell in front rack position, elbows high",
          movement: "Lower your body by bending your knees and hips",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep elbows high", "Maintain upright torso", "Knees track over toes"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Pause Front Squat", "Split Jerk", "Thruster"],
          scaling_options: ["Reduce weight", "Use safety bars", "Adjust range of motion"]
        }
      },
      {
        name: "Romanian Deadlift",
        sets: 5,
        reps: "5-8",
        rest: "120 seconds",
        notes: "Keep your back straight and feel the stretch in your hamstrings",
        difficulty: "advanced",
        equipment: ["Barbell", "Weight Plates"],
        muscles: ["Hamstrings", "Glutes", "Lower Back"],
        setup: "Stand with feet hip-width apart, barbell in front of thighs",
        execution: {
          starting_position: "Stand with barbell in front of thighs",
          movement: "Hinge at hips while keeping back straight",
          breathing: "Inhale as you lower, exhale as you rise",
          tempo: "2-0-2",
          form_cues: ["Keep back straight", "Feel stretch in hamstrings", "Don't round back"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Deficit RDL", "Pause RDL", "Single-leg RDL"],
          scaling_options: ["Reduce weight", "Use blocks", "Adjust range of motion"]
        }
      },
      {
        name: "Weighted Russian Twists",
        sets: 4,
        reps: "20 total (10 each side)",
        rest: "90 seconds",
        notes: "Keep your core engaged and rotate from your torso",
        difficulty: "advanced",
        equipment: ["Weight Plate", "Medicine Ball"],
        muscles: ["Core", "Obliques"],
        setup: "Sit with knees bent, feet off ground",
        execution: {
          starting_position: "Sit with knees bent, feet off ground",
          movement: "Rotate torso while holding weight",
          breathing: "Exhale as you twist, inhale as you return",
          tempo: "Controlled",
          form_cues: ["Keep feet off ground", "Rotate from torso", "Keep back straight"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Russian Twists with Leg Extension", "Russian Twists on Decline", "Russian Twists with Medicine Ball Throw"],
          scaling_options: ["Reduce weight", "Feet on ground", "Fewer reps"]
        }
      },
      {
        name: "Weighted Calf Raises",
        sets: 4,
        reps: "12-15",
        rest: "90 seconds",
        notes: "Focus on full range of motion",
        difficulty: "advanced",
        equipment: ["Step", "Weight Plates", "Barbell"],
        muscles: ["Calves"],
        setup: "Stand on edge of step with heels hanging off",
        execution: {
          starting_position: "Stand on edge of step, heels hanging off",
          movement: "Raise heels up and lower them down",
          breathing: "Exhale as you raise, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Full range of motion", "Keep knees straight", "Control the movement"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Single-leg Weighted Calf Raises", "Seated Weighted Calf Raises", "Jumping Weighted Calf Raises"],
          scaling_options: ["Reduce weight", "Fewer reps", "Flat ground"]
        }
      },
      {
        name: "Weighted Plank with Leg Lift",
        sets: 3,
        reps: "30-45 seconds",
        rest: "90 seconds",
        notes: "Maintain stability while lifting legs",
        difficulty: "advanced",
        equipment: ["Weight Plate"],
        muscles: ["Core", "Glutes", "Shoulders"],
        setup: "Get into a plank position with weight on back",
        execution: {
          starting_position: "Standard plank position with weight",
          movement: "Lift one leg while maintaining stability",
          breathing: "Breathe steadily",
          tempo: "Controlled",
          form_cues: ["Keep hips stable", "Don't rotate", "Maintain plank position"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Weighted Plank with Opposite Arm/Leg Lift", "Weighted Plank with Knee Tucks", "Weighted Plank with Arm Raises"],
          scaling_options: ["Reduce weight", "Reduce hold time", "Shorter range of motion"]
        }
      },
      {
        name: "Box Jumps",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Land softly and maintain control",
        difficulty: "advanced",
        equipment: ["Box", "Plyo Box"],
        muscles: ["Quadriceps", "Glutes", "Calves"],
        setup: "Stand in front of box",
        execution: {
          starting_position: "Stand in front of box",
          movement: "Jump onto box and step down",
          breathing: "Exhale as you jump up, inhale as you land",
          tempo: "Explosive",
          form_cues: ["Land softly", "Keep knees aligned", "Full extension"]
        },
        progression: {
          next_steps: "Increase box height, add variations",
          variations: ["Weighted Box Jumps", "Single-leg Box Jumps", "Box Jump Burpees"],
          scaling_options: ["Lower box", "Step up instead of jump", "Reduce reps"]
        }
      }
    ]
  },
  "Upper Body & Core": {
    beginner: [
      {
        name: "Pike Push-ups",
        sets: 3,
        reps: "8-12",
        rest: "60 seconds",
        notes: "Keep your hips high and elbows close to body",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Shoulders", "Triceps", "Core"],
        setup: "Get into a pike position with hands on ground",
        execution: {
          starting_position: "Pike position with hands on ground",
          movement: "Lower your head towards the ground",
          breathing: "Inhale as you lower, exhale as you push up",
          tempo: "2-0-2",
          form_cues: ["Keep hips high", "Elbows close to body", "Head touches ground"]
        },
        progression: {
          next_steps: "Progress to handstand push-ups",
          variations: ["Decline Pike Push-ups", "Diamond Pike Push-ups", "Wide-grip Pike Push-ups"],
          scaling_options: ["Elevate hands", "Reduce range of motion", "Use support"]
        }
      },
      {
        name: "Triceps Dips",
        sets: 3,
        reps: "8-12",
        rest: "60 seconds",
        notes: "Keep your elbows close to your body",
        difficulty: "beginner",
        equipment: ["Chair", "Bench"],
        muscles: ["Triceps", "Shoulders", "Chest"],
        setup: "Place hands on chair or bench behind you",
        execution: {
          starting_position: "Hands on chair, feet on ground",
          movement: "Lower your body by bending your elbows",
          breathing: "Inhale as you lower, exhale as you push up",
          tempo: "2-0-2",
          form_cues: ["Keep elbows close", "Don't flare elbows", "Full range of motion"]
        },
        progression: {
          next_steps: "Add weight, increase reps",
          variations: ["Bench Dips", "Ring Dips", "Weighted Dips"],
          scaling_options: ["Use assistance bands", "Reduce range of motion", "Elevate feet"]
        }
      },
      {
        name: "Russian Twists",
        sets: 3,
        reps: "20 total (10 each side)",
        rest: "45 seconds",
        notes: "Keep your core engaged and rotate from your torso",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Core", "Obliques"],
        setup: "Sit with knees bent, feet off ground",
        execution: {
          starting_position: "Sit with knees bent, feet off ground",
          movement: "Rotate torso while keeping feet off ground",
          breathing: "Exhale as you twist, inhale as you return",
          tempo: "Controlled",
          form_cues: ["Keep feet off ground", "Rotate from torso", "Keep back straight"]
        },
        progression: {
          next_steps: "Add weight, increase reps",
          variations: ["Weighted Russian Twists", "Russian Twists with Leg Extension", "Russian Twists on Decline"],
          scaling_options: ["Feet on ground", "Fewer reps", "Reduced range of motion"]
        }
      },
      {
        name: "Superman Hold",
        sets: 3,
        reps: "30-45 seconds",
        rest: "45 seconds",
        notes: "Keep your core engaged and lift from your back",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Lower Back", "Shoulders", "Core"],
        setup: "Lie face down on the ground",
        execution: {
          starting_position: "Lie face down, arms and legs extended",
          movement: "Lift arms and legs off the ground",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Lift from back", "Keep neck neutral", "Engage core"]
        },
        progression: {
          next_steps: "Increase hold time, add variations",
          variations: ["Superman with Arm/Leg Alternation", "Superman with Arm Raises", "Superman with Leg Raises"],
          scaling_options: ["Shorter hold time", "Reduced range of motion", "Fewer reps"]
        }
      }
    ],
    intermediate: [
      {
        name: "Dumbbell Shoulder Press",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "intermediate",
        equipment: ["Dumbbells", "Bench"],
        muscles: ["Shoulders", "Triceps", "Core"],
        setup: "Sit on bench with dumbbells at shoulder height",
        execution: {
          starting_position: "Dumbbells at shoulder height, palms forward",
          movement: "Press dumbbells overhead until arms are fully extended",
          breathing: "Exhale as you press, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep back straight", "Core engaged", "Don't lean back"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Seated Press", "Arnold Press", "Push Press"],
          scaling_options: ["Reduce weight", "Use lighter dumbbells", "Adjust range of motion"]
        }
      },
      {
        name: "Pull-ups",
        sets: 4,
        reps: "6-10",
        rest: "90 seconds",
        notes: "Pull your body up until your chin is over the bar",
        difficulty: "intermediate",
        equipment: ["Pull-up Bar"],
        muscles: ["Back", "Biceps", "Shoulders"],
        setup: "Grip the pull-up bar with hands slightly wider than shoulders",
        execution: {
          starting_position: "Hang from the bar with arms fully extended",
          movement: "Pull your body up until your chin is over the bar",
          breathing: "Exhale as you pull up, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep core tight", "Pull elbows down", "Avoid swinging"]
        },
        progression: {
          next_steps: "Add weight, increase reps",
          variations: ["Wide-grip Pull-ups", "L-sit Pull-ups", "Weighted Pull-ups"],
          scaling_options: ["Use resistance bands", "Jumping Pull-ups", "Negatives"]
        }
      },
      {
        name: "Dumbbell Rows",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Keep your back straight and pull from your back",
        difficulty: "intermediate",
        equipment: ["Dumbbells", "Bench"],
        muscles: ["Back", "Biceps", "Shoulders"],
        setup: "Place one knee and hand on bench",
        execution: {
          starting_position: "One knee and hand on bench, other leg straight",
          movement: "Pull dumbbell up to your hip",
          breathing: "Exhale as you pull, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep back straight", "Pull from back", "Keep elbow close"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Single-arm Rows", "Inverted Rows", "Bent-over Rows"],
          scaling_options: ["Reduce weight", "Use lighter dumbbells", "Adjust range of motion"]
        }
      },
      {
        name: "Weighted Russian Twists",
        sets: 4,
        reps: "20 total (10 each side)",
        rest: "60 seconds",
        notes: "Keep your core engaged and rotate from your torso",
        difficulty: "intermediate",
        equipment: ["Dumbbell", "Medicine Ball"],
        muscles: ["Core", "Obliques"],
        setup: "Sit with knees bent, feet off ground",
        execution: {
          starting_position: "Sit with knees bent, feet off ground",
          movement: "Rotate torso while holding weight",
          breathing: "Exhale as you twist, inhale as you return",
          tempo: "Controlled",
          form_cues: ["Keep feet off ground", "Rotate from torso", "Keep back straight"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Russian Twists with Leg Extension", "Russian Twists on Decline", "Russian Twists with Medicine Ball Throw"],
          scaling_options: ["Reduce weight", "Feet on ground", "Fewer reps"]
        }
      },
      {
        name: "Weighted Superman Hold",
        sets: 3,
        reps: "30-45 seconds",
        rest: "60 seconds",
        notes: "Keep your core engaged and lift from your back",
        difficulty: "intermediate",
        equipment: ["Weight Plate"],
        muscles: ["Lower Back", "Shoulders", "Core"],
        setup: "Lie face down on the ground with weight on back",
        execution: {
          starting_position: "Lie face down, arms and legs extended with weight",
          movement: "Lift arms and legs off the ground",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Lift from back", "Keep neck neutral", "Engage core"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Weighted Superman with Arm/Leg Alternation", "Weighted Superman with Arm Raises", "Weighted Superman with Leg Raises"],
          scaling_options: ["Reduce weight", "Shorter hold time", "Reduced range of motion"]
        }
      }
    ],
    advanced: [
      {
        name: "Weighted Pull-ups",
        sets: 4,
        reps: "6-8",
        rest: "120 seconds",
        notes: "Maintain strict form with added weight",
        difficulty: "advanced",
        equipment: ["Pull-up Bar", "Weight Belt", "Weight Plates"],
        muscles: ["Back", "Biceps", "Shoulders"],
        setup: "Attach weight belt and secure weights",
        execution: {
          starting_position: "Hang from the bar with added weight",
          movement: "Pull your body up until your chin is over the bar",
          breathing: "Exhale as you pull up, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep core tight", "Pull elbows down", "Avoid swinging"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["L-sit Weighted Pull-ups", "Wide-grip Weighted Pull-ups", "One-arm Pull-ups"],
          scaling_options: ["Reduce weight", "Use assistance bands", "Adjust grip width"]
        }
      },
      {
        name: "Overhead Press",
        sets: 4,
        reps: "6-8",
        rest: "120 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "advanced",
        equipment: ["Barbell", "Weight Plates"],
        muscles: ["Shoulders", "Triceps", "Core"],
        setup: "Stand with barbell at shoulder height",
        execution: {
          starting_position: "Barbell at shoulder height, hands slightly wider than shoulders",
          movement: "Press the barbell overhead until arms are fully extended",
          breathing: "Exhale as you press, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep core tight", "Don't lean back", "Full range of motion"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Push Press", "Jerk", "Behind the Neck Press"],
          scaling_options: ["Reduce weight", "Use dumbbells", "Adjust range of motion"]
        }
      },
      {
        name: "Weighted Dips",
        sets: 4,
        reps: "6-8",
        rest: "120 seconds",
        notes: "Keep your elbows close to your body and maintain control",
        difficulty: "advanced",
        equipment: ["Dip Station", "Weight Belt", "Weight Plates"],
        muscles: ["Chest", "Triceps", "Shoulders"],
        setup: "Set up dip station and attach weight belt",
        execution: {
          starting_position: "Arms fully extended on dip bars",
          movement: "Lower your body until your upper arms are parallel to the ground",
          breathing: "Inhale as you lower, exhale as you press",
          tempo: "2-0-2",
          form_cues: ["Keep elbows close", "Don't swing", "Full range of motion"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["L-sit Dips", "Ring Dips", "Weighted Ring Dips"],
          scaling_options: ["Reduce weight", "Use assistance bands", "Adjust range of motion"]
        }
      },
      {
        name: "Weighted Russian Twists",
        sets: 4,
        reps: "20 total (10 each side)",
        rest: "90 seconds",
        notes: "Keep your core engaged and rotate from your torso",
        difficulty: "advanced",
        equipment: ["Weight Plate", "Medicine Ball"],
        muscles: ["Core", "Obliques"],
        setup: "Sit with knees bent, feet off ground",
        execution: {
          starting_position: "Sit with knees bent, feet off ground",
          movement: "Rotate torso while holding weight",
          breathing: "Exhale as you twist, inhale as you return",
          tempo: "Controlled",
          form_cues: ["Keep feet off ground", "Rotate from torso", "Keep back straight"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Russian Twists with Leg Extension", "Russian Twists on Decline", "Russian Twists with Medicine Ball Throw"],
          scaling_options: ["Reduce weight", "Feet on ground", "Fewer reps"]
        }
      },
      {
        name: "Weighted Superman Hold",
        sets: 3,
        reps: "30-45 seconds",
        rest: "90 seconds",
        notes: "Keep your core engaged and lift from your back",
        difficulty: "advanced",
        equipment: ["Weight Plate"],
        muscles: ["Lower Back", "Shoulders", "Core"],
        setup: "Lie face down on the ground with weight on back",
        execution: {
          starting_position: "Lie face down, arms and legs extended with weight",
          movement: "Lift arms and legs off the ground",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Lift from back", "Keep neck neutral", "Engage core"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Weighted Superman with Arm/Leg Alternation", "Weighted Superman with Arm Raises", "Weighted Superman with Leg Raises"],
          scaling_options: ["Reduce weight", "Shorter hold time", "Reduced range of motion"]
        }
      },
      {
        name: "One-arm Pull-ups",
        sets: 3,
        reps: "3-5 each arm",
        rest: "120 seconds",
        notes: "Maintain strict form and control",
        difficulty: "advanced",
        equipment: ["Pull-up Bar"],
        muscles: ["Back", "Biceps", "Shoulders"],
        setup: "Grip the pull-up bar with one hand",
        execution: {
          starting_position: "Hang from the bar with one hand",
          movement: "Pull your body up until your chin is over the bar",
          breathing: "Exhale as you pull up, inhale as you lower",
          tempo: "2-0-2",
          form_cues: ["Keep core tight", "Pull elbow down", "Avoid swinging"]
        },
        progression: {
          next_steps: "Increase reps, add variations",
          variations: ["Weighted One-arm Pull-ups", "L-sit One-arm Pull-ups", "Wide-grip One-arm Pull-ups"],
          scaling_options: ["Use assistance bands", "Negatives", "Reduced range of motion"]
        }
      }
    ]
  },
  "Endurance & Cardio": {
    beginner: [
      {
        name: "Burpees",
        sets: 3,
        reps: "8-12",
        rest: "60 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Full Body", "Core", "Cardio"],
        setup: "Stand with feet shoulder-width apart",
        execution: {
          starting_position: "Stand with feet shoulder-width apart",
          movement: "Drop to push-up position, perform push-up, jump back up",
          breathing: "Exhale as you jump up, inhale as you lower",
          tempo: "Controlled",
          form_cues: ["Keep core tight", "Full push-up", "Jump with control"]
        },
        progression: {
          next_steps: "Increase reps, add variations",
          variations: ["Half Burpees", "Burpee Box Jumps", "Burpee Pull-ups"],
          scaling_options: ["Step back instead of jump", "No push-up", "Fewer reps"]
        }
      },
      {
        name: "High Knees",
        sets: 3,
        reps: "30-45 seconds",
        rest: "45 seconds",
        notes: "Keep your core engaged and maintain a steady pace",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Core", "Hip Flexors", "Cardio"],
        setup: "Stand with feet hip-width apart",
        execution: {
          starting_position: "Stand with feet hip-width apart",
          movement: "Run in place, bringing knees up high",
          breathing: "Breathe steadily",
          tempo: "Fast",
          form_cues: ["Knees up high", "Core engaged", "Stay on toes"]
        },
        progression: {
          next_steps: "Increase duration, add variations",
          variations: ["High Knees with Arm Raises", "High Knees with Twist", "High Knees with Jump"],
          scaling_options: ["Slower pace", "Shorter duration", "Lower knees"]
        }
      },
      {
        name: "Jump Rope",
        sets: 3,
        reps: "60-90 seconds",
        rest: "60 seconds",
        notes: "Keep your elbows close and maintain a steady pace",
        difficulty: "beginner",
        equipment: ["Jump Rope"],
        muscles: ["Calves", "Core", "Cardio"],
        setup: "Hold jump rope handles at hip height",
        execution: {
          starting_position: "Hold jump rope handles at hip height",
          movement: "Jump over the rope while turning it",
          breathing: "Breathe steadily",
          tempo: "Steady",
          form_cues: ["Elbows close", "Stay on toes", "Controlled jumps"]
        },
        progression: {
          next_steps: "Increase duration, add variations",
          variations: ["Double Unders", "Crossovers", "High Knees with Rope"],
          scaling_options: ["Shorter duration", "Slower pace", "Step instead of jump"]
        }
      },
      {
        name: "Side Planks",
        sets: 3,
        reps: "30-45 seconds each side",
        rest: "45 seconds",
        notes: "Keep your body straight and core engaged",
        difficulty: "beginner",
        equipment: ["None"],
        muscles: ["Core", "Obliques", "Shoulders"],
        setup: "Lie on your side with forearm on ground",
        execution: {
          starting_position: "Lie on side with forearm on ground",
          movement: "Lift hips off the ground",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Keep body straight", "Core engaged", "Don't let hips sag"]
        },
        progression: {
          next_steps: "Increase hold time, add variations",
          variations: ["Side Plank with Leg Lift", "Side Plank with Arm Raise", "Side Plank with Rotation"],
          scaling_options: ["Knee down", "Shorter hold time", "Reduced range of motion"]
        }
      }
    ],
    intermediate: [
      {
        name: "Burpee Box Jumps",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "intermediate",
        equipment: ["Box", "Plyo Box"],
        muscles: ["Full Body", "Core", "Cardio"],
        setup: "Stand in front of box",
        execution: {
          starting_position: "Stand in front of box",
          movement: "Perform burpee, then jump onto box",
          breathing: "Exhale as you jump up, inhale as you lower",
          tempo: "Controlled",
          form_cues: ["Keep core tight", "Full push-up", "Land softly on box"]
        },
        progression: {
          next_steps: "Increase reps, add variations",
          variations: ["Burpee Box Jumps with Pull-ups", "Burpee Box Jumps with Push-ups", "Burpee Box Jumps with Squats"],
          scaling_options: ["Lower box", "Step up instead of jump", "Fewer reps"]
        }
      },
      {
        name: "High Knees with Twist",
        sets: 4,
        reps: "45-60 seconds",
        rest: "60 seconds",
        notes: "Keep your core engaged and maintain a steady pace",
        difficulty: "intermediate",
        equipment: ["None"],
        muscles: ["Core", "Obliques", "Cardio"],
        setup: "Stand with feet hip-width apart",
        execution: {
          starting_position: "Stand with feet hip-width apart",
          movement: "Run in place, bringing knees up high with torso twist",
          breathing: "Breathe steadily",
          tempo: "Fast",
          form_cues: ["Knees up high", "Core engaged", "Full twist"]
        },
        progression: {
          next_steps: "Increase duration, add variations",
          variations: ["High Knees with Arm Raises and Twist", "High Knees with Jump and Twist", "High Knees with Medicine Ball Twist"],
          scaling_options: ["Slower pace", "Shorter duration", "Reduced twist"]
        }
      },
      {
        name: "Double Unders",
        sets: 4,
        reps: "30-45 seconds",
        rest: "60 seconds",
        notes: "Keep your elbows close and maintain a steady pace",
        difficulty: "intermediate",
        equipment: ["Jump Rope"],
        muscles: ["Calves", "Core", "Cardio"],
        setup: "Hold jump rope handles at hip height",
        execution: {
          starting_position: "Hold jump rope handles at hip height",
          movement: "Jump over the rope twice in one jump",
          breathing: "Breathe steadily",
          tempo: "Fast",
          form_cues: ["Elbows close", "Stay on toes", "Quick wrist movement"]
        },
        progression: {
          next_steps: "Increase duration, add variations",
          variations: ["Triple Unders", "Double Unders with Crossovers", "Double Unders with High Knees"],
          scaling_options: ["Double unders", "Shorter duration", "Slower pace"]
        }
      },
      {
        name: "Side Plank with Leg Lift",
        sets: 4,
        reps: "30-45 seconds each side",
        rest: "60 seconds",
        notes: "Keep your body straight and core engaged",
        difficulty: "intermediate",
        equipment: ["None"],
        muscles: ["Core", "Obliques", "Glutes"],
        setup: "Lie on your side with forearm on ground",
        execution: {
          starting_position: "Lie on side with forearm on ground",
          movement: "Lift hips and top leg off the ground",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Keep body straight", "Core engaged", "Lift leg high"]
        },
        progression: {
          next_steps: "Increase hold time, add variations",
          variations: ["Side Plank with Arm Raise and Leg Lift", "Side Plank with Rotation and Leg Lift", "Side Plank with Weight"],
          scaling_options: ["Knee down", "Shorter hold time", "No leg lift"]
        }
      },
      {
        name: "Mountain Climbers",
        sets: 4,
        reps: "45-60 seconds",
        rest: "60 seconds",
        notes: "Keep your core engaged and maintain a steady pace",
        difficulty: "intermediate",
        equipment: ["None"],
        muscles: ["Core", "Shoulders", "Cardio"],
        setup: "Start in a plank position",
        execution: {
          starting_position: "Plank position",
          movement: "Alternate bringing knees to chest",
          breathing: "Breathe steadily",
          tempo: "Fast",
          form_cues: ["Keep hips down", "Core engaged", "Fast pace"]
        },
        progression: {
          next_steps: "Increase duration, add variations",
          variations: ["Cross-body Mountain Climbers", "Weighted Mountain Climbers", "Mountain Climbers with Push-ups"],
          scaling_options: ["Slower pace", "Shorter duration", "Elevated position"]
        }
      }
    ],
    advanced: [
      {
        name: "Burpee Pull-ups",
        sets: 4,
        reps: "8-12",
        rest: "120 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "advanced",
        equipment: ["Pull-up Bar"],
        muscles: ["Full Body", "Core", "Cardio"],
        setup: "Stand under pull-up bar",
        execution: {
          starting_position: "Stand under pull-up bar",
          movement: "Perform burpee, then pull-up",
          breathing: "Exhale as you pull up, inhale as you lower",
          tempo: "Controlled",
          form_cues: ["Keep core tight", "Full push-up", "Full pull-up"]
        },
        progression: {
          next_steps: "Increase reps, add variations",
          variations: ["Burpee Pull-ups with Weight", "Burpee Pull-ups with L-sit", "Burpee Pull-ups with Kipping"],
          scaling_options: ["Use assistance bands", "Jumping pull-ups", "Fewer reps"]
        }
      },
      {
        name: "High Knees with Medicine Ball Twist",
        sets: 4,
        reps: "60-90 seconds",
        rest: "90 seconds",
        notes: "Keep your core engaged and maintain a steady pace",
        difficulty: "advanced",
        equipment: ["Medicine Ball"],
        muscles: ["Core", "Obliques", "Cardio"],
        setup: "Stand with feet hip-width apart, holding medicine ball",
        execution: {
          starting_position: "Stand with feet hip-width apart, holding medicine ball",
          movement: "Run in place, bringing knees up high with medicine ball twist",
          breathing: "Breathe steadily",
          tempo: "Fast",
          form_cues: ["Knees up high", "Core engaged", "Full twist with ball"]
        },
        progression: {
          next_steps: "Increase duration, add variations",
          variations: ["High Knees with Medicine Ball Throw", "High Knees with Medicine Ball Squat", "High Knees with Medicine Ball Overhead"],
          scaling_options: ["Lighter ball", "Slower pace", "Shorter duration"]
        }
      },
      {
        name: "Triple Unders",
        sets: 4,
        reps: "45-60 seconds",
        rest: "90 seconds",
        notes: "Keep your elbows close and maintain a steady pace",
        difficulty: "advanced",
        equipment: ["Jump Rope"],
        muscles: ["Calves", "Core", "Cardio"],
        setup: "Hold jump rope handles at hip height",
        execution: {
          starting_position: "Hold jump rope handles at hip height",
          movement: "Jump over the rope three times in one jump",
          breathing: "Breathe steadily",
          tempo: "Very Fast",
          form_cues: ["Elbows close", "Stay on toes", "Quick wrist movement"]
        },
        progression: {
          next_steps: "Increase duration, add variations",
          variations: ["Triple Unders with Crossovers", "Triple Unders with High Knees", "Triple Unders with Double Unders"],
          scaling_options: ["Double unders", "Shorter duration", "Slower pace"]
        }
      },
      {
        name: "Side Plank with Weight",
        sets: 4,
        reps: "45-60 seconds each side",
        rest: "90 seconds",
        notes: "Keep your body straight and core engaged",
        difficulty: "advanced",
        equipment: ["Weight Plate"],
        muscles: ["Core", "Obliques", "Shoulders"],
        setup: "Lie on your side with forearm on ground and weight on hip",
        execution: {
          starting_position: "Lie on side with forearm on ground and weight on hip",
          movement: "Lift hips off the ground",
          breathing: "Breathe steadily",
          tempo: "Hold",
          form_cues: ["Keep body straight", "Core engaged", "Don't let hips sag"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Side Plank with Weight and Leg Lift", "Side Plank with Weight and Arm Raise", "Side Plank with Weight and Rotation"],
          scaling_options: ["Reduce weight", "Shorter hold time", "No weight"]
        }
      },
      {
        name: "Weighted Mountain Climbers",
        sets: 4,
        reps: "60-90 seconds",
        rest: "90 seconds",
        notes: "Keep your core engaged and maintain a steady pace",
        difficulty: "advanced",
        equipment: ["Weight Vest"],
        muscles: ["Core", "Shoulders", "Cardio"],
        setup: "Start in a plank position with weight vest",
        execution: {
          starting_position: "Plank position with weight vest",
          movement: "Alternate bringing knees to chest",
          breathing: "Breathe steadily",
          tempo: "Fast",
          form_cues: ["Keep hips down", "Core engaged", "Fast pace"]
        },
        progression: {
          next_steps: "Increase weight, add variations",
          variations: ["Weighted Cross-body Mountain Climbers", "Weighted Mountain Climbers with Push-ups", "Weighted Mountain Climbers with Pull-ups"],
          scaling_options: ["Reduce weight", "Slower pace", "Shorter duration"]
        }
      },
      {
        name: "Box Jump Burpees",
        sets: 4,
        reps: "8-12",
        rest: "90 seconds",
        notes: "Keep your core engaged and maintain proper form",
        difficulty: "advanced",
        equipment: ["Box", "Plyo Box"],
        muscles: ["Full Body", "Core", "Cardio"],
        setup: "Stand in front of box",
        execution: {
          starting_position: "Stand in front of box",
          movement: "Perform burpee, then jump onto box",
          breathing: "Exhale as you jump up, inhale as you lower",
          tempo: "Controlled",
          form_cues: ["Keep core tight", "Full push-up", "Land softly on box"]
        },
        progression: {
          next_steps: "Increase reps, add variations",
          variations: ["Box Jump Burpees with Pull-ups", "Box Jump Burpees with Push-ups", "Box Jump Burpees with Squats"],
          scaling_options: ["Lower box", "Step up instead of jump", "Fewer reps"]
        }
      }
    ]
  }
};

interface WorkoutDay {
  name: string;
  focus: string;
  exercises: Exercise[];
  warmup: WarmupCooldown;
  cooldown: WarmupCooldown;
  notes: string;
}

interface WorkoutPlan {
  name: string;
  description: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  days: Array<{
    day: number;
    name: string;
    focus: string;
    warmup: WarmupCooldown;
    exercises: Exercise[];
    cooldown: WarmupCooldown;
    notes: string;
  }>;
  equipment: string[];
  notes: string;
  tips: string[];
}

// Add genericNames constant before the validation function
const genericNames = ['Basic Exercise', 'Basic Warmup', 'Basic Cooldown', 'Exercise', 'Warmup', 'Cooldown'];

// Add BMI calculation and types
export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

function calculateBMI(weight: number, height: number): number {
  // Convert height from cm to meters
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

// Add exercise modifications based on BMI
const exerciseModifications: Record<BMICategory, Record<string, string>> = {
  underweight: {
    'Mountain Climbers': 'Dumbbell Rows',
    'Burpees': 'Bodyweight Lunges',
    'High Knees': 'Resistance Band Pull-Aparts',
    'Jump Rope': 'Resistance Band Rows',
    'Box Jumps': 'Step-ups with Dumbbells',
    'Jump Squats': 'Goblet Squats',
    'Running': 'Walking with Weighted Vest',
    'Jumping Jacks': 'Dumbbell Shoulder Press',
    'High-Intensity Cardio': 'Strength Training Circuit',
    'Plyometric Exercises': 'Resistance Band Exercises'
  },
  normal: {}, // No modifications needed
  overweight: {
    'Jump Squats': 'Sit-to-Stand Squats',
    'Burpees': 'Modified Push-ups',
    'Box Jumps': 'Step-ups',
    'High Knees': 'Marching in Place',
    'Jumping Jacks': 'Arm Circles',
    'Plyometric Exercises': 'Low-Impact Cardio',
    'High-Intensity Cardio': 'Moderate-Intensity Cardio'
  },
  obese: {
    'Jump Squats': 'Chair Squats',
    'Burpees': 'Wall Push-ups',
    'Box Jumps': 'Step-ups with Support',
    'High Knees': 'Seated Knee Extensions',
    'Jumping Jacks': 'Arm Raises',
    'Running': 'Walking or Cycling',
    'Plyometric Exercises': 'Low-Impact Cardio',
    'High-Intensity Cardio': 'Low-Intensity Cardio',
    'Standard Push-ups': 'Incline Push-ups',
    'Jump Rope': 'Walking in Place'
  }
};

// Function to modify exercises based on BMI
function modifyExercisesForBMI(plan: any, fitnessLevel: string, bmiCategory: BMICategory | null): any {
  if (fitnessLevel === 'beginner' && bmiCategory && bmiCategory !== 'normal') {
    const modifications = exerciseModifications[bmiCategory];
    return {
      ...plan,
      days: plan.days.map((day: any) => ({
        ...day,
        warmup: {
          ...day.warmup,
          exercises: day.warmup.exercises.map((exercise: any) => {
            if (modifications[exercise.name]) {
              return {
                ...exercise,
                name: modifications[exercise.name],
                description: `Modified version of ${exercise.name} for ${bmiCategory} beginners`,
                purpose: `Low-impact alternative suitable for ${bmiCategory} beginners`
              };
            }
            return exercise;
          })
        },
        exercises: day.exercises.map((exercise: any) => {
          if (modifications[exercise.name]) {
            return {
              ...exercise,
              name: modifications[exercise.name],
              notes: `Modified version of ${exercise.name} for ${bmiCategory} beginners`,
              difficulty: 'beginner',
              execution: {
                ...exercise.execution,
                form_cues: [
                  ...exercise.execution.form_cues,
                  `This is a modified version suitable for ${bmiCategory} beginners`
                ]
              }
            };
          }
          return exercise;
        }),
        cooldown: {
          ...day.cooldown,
          exercises: day.cooldown.exercises.map((exercise: any) => {
            if (modifications[exercise.name]) {
              return {
                ...exercise,
                name: modifications[exercise.name],
                description: `Modified version of ${exercise.name} for ${bmiCategory} beginners`,
                purpose: `Low-impact alternative suitable for ${bmiCategory} beginners`
              };
            }
            return exercise;
          })
        }
      }))
    };
  }
  return plan;
}

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

function generateWarmup(focusArea: FocusArea): WarmupCooldown {
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

function generateCooldown(focusArea: FocusArea): WarmupCooldown {
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
function isOpenAIAvailable(client: OpenAI | undefined): client is OpenAI {
  return client !== undefined && process.env.OPENAI_API_KEY !== undefined;
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