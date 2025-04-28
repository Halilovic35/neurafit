export interface Execution {
  starting_position: string;
  movement: string;
  breathing: string;
  tempo: string;
  form_cues: string[];
}

export interface Progression {
  next_steps: string;
  variations: string[];
  scaling_options: string[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
  difficulty: string;
  equipment: string[];
  muscles: string[];
  setup: string;
  execution: Execution;
  progression: Progression;
}

export interface WarmupCooldownExercise {
  name: string;
  duration: string;
  description: string;
  purpose: string;
}

export interface WarmupCooldown {
  duration: string;
  exercises: WarmupCooldownExercise[];
}

export interface WorkoutDay {
  name: string;
  focus: string;
  exercises: Exercise[];
  warmup: WarmupCooldown;
  cooldown: WarmupCooldown;
  notes: string;
}

export interface FocusArea {
  name: string;
  priority: string;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  plan: {
    days: WorkoutDay[];
    focusAreas: FocusArea[];
    progression: {
      level: string;
      weekNumber: number;
    };
  };
  metadata: {
    bmi: number;
    bmiCategory: string;
    fitnessLevel: string;
    goal: string;
    daysPerWeek: number;
    weekNumber: number;
  };
} 