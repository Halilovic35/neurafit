import { test, expect, describe } from '@jest/globals';
import fetch from 'node-fetch';

interface WorkoutPlan {
  name: string;
  description: string;
  days: Array<{
    name: string;
    focus: string;
    warmup: {
      exercises: Array<{
        name: string;
        duration: string;
        description: string;
        purpose: string;
      }>;
    };
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      restTime: string;
      description: string;
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
    cooldown: {
      exercises: Array<{
        name: string;
        duration: string;
        description: string;
        purpose: string;
      }>;
    };
  }>;
}

const API_URL = 'http://localhost:3002/api/generate-workout';

describe('Workout Plan Generation Tests', () => {
  test('Test Case 1: Beginner User with Weight Loss Goal', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: 25,
        height: 170,
        weight: 80,
        gender: 'male',
        goal: 'weight-loss',
        fitnessLevel: 'beginner',
        daysPerWeek: '3'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json() as WorkoutPlan;

    // Basic structure validation
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('days');
    expect(Array.isArray(data.days)).toBe(true);
    expect(data.days.length).toBe(3);

    // Validate each day
    data.days.forEach((day, index) => {
      expect(day).toHaveProperty('name');
      expect(day).toHaveProperty('focus');
      expect(day).toHaveProperty('warmup');
      expect(day).toHaveProperty('exercises');
      expect(day).toHaveProperty('cooldown');

      // Validate warmup
      expect(day.warmup).toHaveProperty('exercises');
      expect(Array.isArray(day.warmup.exercises)).toBe(true);
      expect(day.warmup.exercises.length).toBeGreaterThanOrEqual(3);

      // Validate main exercises
      expect(Array.isArray(day.exercises)).toBe(true);
      expect(day.exercises.length).toBeGreaterThanOrEqual(4);
      day.exercises.forEach((exercise) => {
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('sets');
        expect(exercise).toHaveProperty('reps');
        expect(exercise).toHaveProperty('restTime');
        expect(exercise).toHaveProperty('description');
        expect(exercise).toHaveProperty('difficulty');
        expect(exercise.difficulty).toBe('Beginner');
      });

      // Validate cooldown
      expect(day.cooldown).toHaveProperty('exercises');
      expect(Array.isArray(day.cooldown.exercises)).toBe(true);
      expect(day.cooldown.exercises.length).toBeGreaterThanOrEqual(3);
    });
  }, 30000);

  test('Test Case 2: Intermediate User with Muscle Gain Goal', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: 30,
        height: 180,
        weight: 75,
        gender: 'female',
        goal: 'muscle-gain',
        fitnessLevel: 'intermediate',
        daysPerWeek: '5'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json() as WorkoutPlan;

    // Basic structure validation
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('days');
    expect(Array.isArray(data.days)).toBe(true);
    expect(data.days.length).toBe(5);

    // Validate each day
    data.days.forEach((day, index) => {
      expect(day).toHaveProperty('name');
      expect(day).toHaveProperty('focus');
      expect(day).toHaveProperty('warmup');
      expect(day).toHaveProperty('exercises');
      expect(day).toHaveProperty('cooldown');

      // Validate warmup
      expect(day.warmup).toHaveProperty('exercises');
      expect(Array.isArray(day.warmup.exercises)).toBe(true);
      expect(day.warmup.exercises.length).toBeGreaterThanOrEqual(3);

      // Validate main exercises
      expect(Array.isArray(day.exercises)).toBe(true);
      expect(day.exercises.length).toBeGreaterThanOrEqual(4);
      day.exercises.forEach((exercise) => {
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('sets');
        expect(exercise).toHaveProperty('reps');
        expect(exercise).toHaveProperty('restTime');
        expect(exercise).toHaveProperty('description');
        expect(exercise).toHaveProperty('difficulty');
        expect(exercise.difficulty).toBe('Intermediate');

        // Additional checks for intermediate level
        expect(exercise).toHaveProperty('progression');
        expect(exercise.progression).toHaveProperty('next_steps');
        expect(exercise.progression).toHaveProperty('variations');
        expect(exercise.progression).toHaveProperty('scaling_options');
      });

      // Validate cooldown
      expect(day.cooldown).toHaveProperty('exercises');
      expect(Array.isArray(day.cooldown.exercises)).toBe(true);
      expect(day.cooldown.exercises.length).toBeGreaterThanOrEqual(3);
    });
  }, 30000);

  test('Error Handling: Invalid Input', async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: -1, // Invalid age
        height: 0, // Invalid height
        weight: 0, // Invalid weight
        gender: 'invalid',
        goal: 'invalid',
        fitnessLevel: 'invalid',
        daysPerWeek: '8' // Invalid days
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json() as { error: string };
    expect(data).toHaveProperty('error');
  });

  test('Performance: Response Time', async () => {
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: 25,
        height: 170,
        weight: 80,
        gender: 'male',
        goal: 'weight-loss',
        fitnessLevel: 'beginner',
        daysPerWeek: '3'
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(10000); // Response should be under 10 seconds
  });
}); 