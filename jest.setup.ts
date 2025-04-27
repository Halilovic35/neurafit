import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock the next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => data),
  },
}));

// Mock node-fetch
jest.mock('node-fetch', () => {
  return jest.fn().mockImplementation(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  }));
});

// Mock Next.js config
jest.mock('next/config', () => () => ({
  serverRuntimeConfig: {
    OPENAI_API_KEY: 'test-api-key',
  },
  publicRuntimeConfig: {},
}));

// Mock OpenAI client
jest.mock('@/lib/openai', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                name: 'Test Workout Plan',
                description: 'A test workout plan',
                days: [{
                  name: 'Day 1',
                  focus: 'Full Body',
                  warmup: {
                    duration: '10 minutes',
                    exercises: [{
                      name: 'Jogging',
                      duration: '5 minutes',
                      description: 'Light jogging',
                      purpose: 'Warm up'
                    }]
                  },
                  exercises: [{
                    name: 'Push-ups',
                    sets: 3,
                    reps: '10',
                    restTime: '60 seconds',
                    description: 'Basic push-ups',
                    difficulty: 'Beginner'
                  }],
                  cooldown: {
                    duration: '5 minutes',
                    exercises: [{
                      name: 'Stretching',
                      duration: '5 minutes',
                      description: 'Basic stretches',
                      purpose: 'Cool down'
                    }]
                  }
                }]
              })
            }
          }]
        })
      }
    }
  };
  return {
    __esModule: true,
    default: mockOpenAI,
  };
});

// Mock Prisma client
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    workoutPlan: {
      create: jest.fn().mockImplementation((data) => Promise.resolve({
        id: 'test-id',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data.data,
      })),
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({
        id: 'test-id',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    },
    user: {
      create: jest.fn().mockImplementation((data) => Promise.resolve({
        id: 'test-user-id',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data.data,
      })),
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({
        id: 'test-user-id',
        email: 'test@example.com',
      })),
    },
    $connect: jest.fn().mockImplementation(() => Promise.resolve()),
    $disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

// Mock Next.js Response
class MockResponse {
  status(code: number) {
    return {
      json: (data: any) => ({ status: code, ...data }),
    };
  }
}

global.Response = MockResponse as any;

// Mock Next.js Request
class MockRequest {
  constructor(public body: any) {}
  json() {
    return Promise.resolve(this.body);
  }
}

global.Request = MockRequest as any;

// Extend expect with custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 