import { WorkoutPlan } from '../app/api/generate-workout/route';

function validateWorkoutPlan(plan: WorkoutPlan): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for plan and days
  if (!plan.plan || !plan.plan.days || plan.plan.days.length === 0) {
    errors.push('Workout plan must have at least one day');
  }

  // Validate each day
  plan.plan.days.forEach((day: any, index: number) => {
    if (!day.exercises || day.exercises.length === 0) {
      errors.push(`Day ${index + 1} must have at least one exercise`);
    }
    // Exercise validation
    day.exercises.forEach((exercise: any, exIndex: number) => {
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

export default validateWorkoutPlan; 