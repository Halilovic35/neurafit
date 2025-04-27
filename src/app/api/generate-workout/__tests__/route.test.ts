/**
 * @jest-environment node
 */

import { describe, it, expect, jest } from '@jest/globals';
import { generateWorkoutPlan, validateWorkoutPlan, POST } from '../route';
import { WorkoutPlan, Prisma, User } from '@prisma/client';
import { ChatCompletionMessageParam } from 'openai/resources';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

// Mock next/config
jest.mock('next/config', () => {
  return () => ({
    serverRuntimeConfig: {
      OPENAI_API_KEY: 'test-api-key'
    }
  });
});

// Mock node-fetch
jest.mock('node-fetch');

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockWorkoutPlan: WorkoutPlan = {
    id: 'test-id',
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'Test Plan',
    description: null,
    exercises: [],
    bmi: 22,
    bmiCategory: 'normal',
    fitnessLevel: 'beginner',
    goal: 'weight_loss',
    daysPerWeek: 3
  };

  const mockUser: User = {
    id: 'test-user-id',
    name: null,
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'user',
    isActive: true,
    currentLevel: 'beginner',
    weeksCompleted: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPrismaClient = {
    workoutPlan: {
      create: jest.fn().mockImplementation(() => Promise.resolve(mockWorkoutPlan)),
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(mockWorkoutPlan))
    },
    user: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
      create: jest.fn().mockImplementation(() => Promise.resolve(mockUser))
    },
    $connect: jest.fn().mockImplementation(() => Promise.resolve()),
    $disconnect: jest.fn().mockImplementation(() => Promise.resolve())
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

// Mock OpenAI
jest.mock('openai', () => {
  const mockChatCompletion: OpenAI.Chat.Completions.ChatCompletion = {
    id: 'test-completion-id',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          warmup: ['Exercise 1', 'Exercise 2'],
          exercises: ['Main Exercise 1', 'Main Exercise 2'],
          cooldown: ['Cooldown 1', 'Cooldown 2'],
          notes: 'Test workout plan'
        }),
        refusal: ''
      },
      finish_reason: 'stop',
      logprobs: null
    }],
    created: Date.now(),
    model: 'gpt-3.5-turbo',
    object: 'chat.completion',
    usage: {
      completion_tokens: 150,
      prompt_tokens: 150,
      total_tokens: 300
    }
  };

  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockImplementation(() => Promise.resolve(mockChatCompletion))
      }
    }
  };

  return {
    OpenAI: jest.fn(() => mockOpenAI)
  };
});

// Mock Next.js Response and Request
class MockResponse {
  status(code: number) {
    return {
      json: (data: any) => ({ status: code, ...data }),
    };
  }
}

global.Response = MockResponse as any;

class MockRequest {
  constructor(public body: any) {}
  json() {
    return Promise.resolve(this.body);
  }
}

global.Request = MockRequest as any;

describe('Workout Plan Generation', () => {
  const mockUserProfile = {
    age: 25,
    height: 170,
    weight: 70,
    gender: 'male',
    fitnessLevel: 'beginner',
    goal: 'weight_loss',
    daysPerWeek: 3,
    bmi: 24.2,
    bmiCategory: 'normal'
  };

  describe('generateWorkoutPlan', () => {
    it('should generate a valid workout plan', async () => {
      const plan = await generateWorkoutPlan(mockUserProfile);
      
      expect(plan).toBeDefined();
      expect(plan.name).toBeDefined();
      expect(plan.description).toBeDefined();
      expect(Array.isArray(plan.days)).toBe(true);
      expect(plan.days.length).toBe(mockUserProfile.daysPerWeek);
      
      // Test first day structure
      const firstDay = plan.days[0];
      expect(firstDay.name).toBeDefined();
      expect(firstDay.focus).toBeDefined();
      expect(Array.isArray(firstDay.exercises)).toBe(true);
      expect(firstDay.warmup).toBeDefined();
      expect(firstDay.cooldown).toBeDefined();
    });
  });

  describe('validateWorkoutPlan', () => {
    it('should validate a correct workout plan', () => {
      const validPlan = {
        name: 'Test Plan',
        description: 'Test Description',
        days: [{
          name: 'Day 1',
          focus: 'Full Body',
          exercises: [{
            name: 'Push-ups',
            sets: 3,
            reps: '10',
            restTime: '60s',
            description: 'Basic push-up'
          }],
          warmup: {
            duration: '10 minutes',
            exercises: [{
              name: 'Arm circles',
              duration: '2 minutes'
            }]
          },
          cooldown: {
            duration: '5 minutes',
            exercises: [{
              name: 'Stretching',
              duration: '5 minutes'
            }]
          }
        }],
        bmi: 24.2,
        bmiCategory: 'normal',
        fitnessLevel: 'beginner',
        goal: 'weight_loss',
        daysPerWeek: 3
      };

      const result = validateWorkoutPlan(validPlan);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid workout plan', () => {
      const invalidPlan = {
        name: 'Test Plan',
        description: 'Test Description',
        days: [], // Missing required days
        bmi: 24.2,
        bmiCategory: 'normal',
        fitnessLevel: 'beginner',
        goal: 'weight_loss',
        daysPerWeek: 3
      };

      const result = validateWorkoutPlan(invalidPlan);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST handler', () => {
    it('should handle workout plan generation request', async () => {
      const request = new Request('http://localhost:3000/api/generate-workout', {
        method: 'POST',
        body: JSON.stringify({
          age: 25,
          height: 170,
          weight: 70,
          gender: 'male',
          fitnessLevel: 'beginner',
          goal: 'weight_loss',
          daysPerWeek: 3
        })
      });

      const response = await POST(request);
      expect(response).toBeInstanceOf(NextResponse);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.name).toBeDefined();
      expect(data.description).toBeDefined();
      expect(Array.isArray(data.days)).toBe(true);
    });

    it('should handle invalid input', async () => {
      const request = new Request('http://localhost:3000/api/generate-workout', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          age: 25
        })
      });

      const response = await POST(request);
      expect(response).toBeInstanceOf(NextResponse);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(response.status).toBe(400);
    });
  });
}); 