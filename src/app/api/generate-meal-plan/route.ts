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

const systemPrompt = `You are a professional nutritionist creating comprehensive, personalized meal plans. Your responses should be in JSON format with the following detailed structure:
{
  "name": "Detailed name of the meal plan",
  "description": "Comprehensive overview of the plan, including its goals and expected outcomes",
  "totalCalories": number,
  "macros": {
    "protein": "grams per day",
    "carbs": "grams per day",
    "fats": "grams per day",
    "fiber": "grams per day"
  },
  "days": [
    {
      "name": "Day 1",
      "totalCalories": number,
      "macros": {
        "protein": number,
        "carbs": number,
        "fats": number,
        "fiber": number
      },
      "meals": [
        {
          "name": "Meal Name",
          "time": "Suggested time",
          "calories": number,
          "macros": {
            "protein": number,
            "carbs": number,
            "fats": number,
            "fiber": number
          },
          "items": [
            {
              "name": "Food item",
              "portion": "Amount with unit",
              "calories": number,
              "protein": number,
              "carbs": number,
              "fats": number,
              "fiber": number,
              "preparation": "How to prepare this item",
              "alternatives": ["List of alternative ingredients"]
            }
          ],
          "preparation": {
            "steps": ["Step by step preparation instructions"],
            "time": "Total preparation time",
            "tips": ["Cooking or preparation tips"]
          }
        }
      ],
      "snacks": [
        {
          "name": "Snack Name",
          "time": "Suggested time",
          "calories": number,
          "items": ["List of snack options"]
        }
      ],
      "hydration": {
        "water": "Daily water intake recommendation",
        "schedule": ["When to drink water throughout the day"]
      },
      "notes": "Day-specific nutrition tips and guidelines"
    }
  ],
  "groceryList": {
    "proteins": ["List of protein sources needed"],
    "carbs": ["List of carbohydrate sources needed"],
    "fats": ["List of healthy fat sources needed"],
    "produce": ["List of fruits and vegetables needed"],
    "pantry": ["List of pantry items needed"],
    "alternatives": {
      "dairy": ["Dairy-free alternatives"],
      "gluten": ["Gluten-free alternatives"],
      "meat": ["Vegetarian/vegan alternatives"]
    }
  },
  "mealPrep": {
    "tips": ["Meal preparation tips"],
    "schedule": "Suggested meal prep schedule",
    "storage": ["Food storage guidelines"]
  },
  "nutrition": {
    "guidelines": ["General nutrition guidelines"],
    "timing": "Meal timing recommendations",
    "supplements": ["Recommended supplements if any"],
    "hydration": "Daily hydration guidelines"
  },
  "notes": "Additional tips and recommendations for optimal results"
}`;

// Update MealType to include 'snacks'
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

// Update the meal database structure
const mealDatabase: { [key in MealType]: { [key in DietaryPreference]: Meal[] } } = {
  breakfast: {
    standard: [
      {
        name: "Protein-Packed Oatmeal",
        calories: 350,
        macros: { protein: 25, carbs: 45, fats: 8, fiber: 6 },
        items: [
          {
            name: "Rolled Oats",
            portion: "1/2 cup",
            calories: 150,
            protein: 5,
            carbs: 27,
            fats: 3,
            fiber: 4
          },
          {
            name: "Greek Yogurt",
            portion: "1/2 cup",
            calories: 100,
            protein: 15,
            carbs: 5,
            fats: 0,
            fiber: 0
          },
          {
            name: "Mixed Berries",
            portion: "1/2 cup",
            calories: 40,
            protein: 1,
            carbs: 10,
            fats: 0,
            fiber: 3
          },
          {
            name: "Almond Butter",
            portion: "1 tbsp",
            calories: 60,
            protein: 4,
            carbs: 3,
            fats: 5,
            fiber: 0
          }
        ],
        preparation: {
          steps: [
            "Cook oats with water or milk",
            "Stir in Greek yogurt",
            "Top with berries and almond butter"
          ],
          time: "10 minutes",
          difficulty: "Easy",
          tips: ["Use rolled oats for better texture", "Add cinnamon for extra flavor"]
        }
      },
      {
        name: "Veggie Omelette",
        calories: 320,
        macros: { protein: 28, carbs: 12, fats: 18, fiber: 4 },
        items: [
          {
            name: "Eggs",
            portion: "3 large",
            calories: 210,
            protein: 18,
            carbs: 1,
            fats: 15,
            fiber: 0
          },
          {
            name: "Mixed Vegetables",
            portion: "1/2 cup",
            calories: 50,
            protein: 2,
            carbs: 10,
            fats: 0,
            fiber: 3
          },
          {
            name: "Cheese",
            portion: "1 oz",
            calories: 60,
            protein: 8,
            carbs: 1,
            fats: 3,
            fiber: 0
          }
        ],
        preparation: {
          steps: [
            "Whisk eggs with salt and pepper",
            "Sauté vegetables until tender",
            "Pour eggs over vegetables",
            "Add cheese and fold"
          ],
          time: "15 minutes",
          difficulty: "Medium",
          tips: ["Use non-stick pan", "Cook on medium heat"]
        }
      }
    ],
    vegetarian: [
      {
        name: "Tofu Scramble",
        calories: 300,
        macros: { protein: 22, carbs: 15, fats: 18, fiber: 5 },
        items: [
          {
            name: "Firm Tofu",
            portion: "1/2 block",
            calories: 180,
            protein: 20,
            carbs: 4,
            fats: 10,
            fiber: 2
          },
          {
            name: "Bell Peppers",
            portion: "1/2 cup",
            calories: 30,
            protein: 1,
            carbs: 7,
            fats: 0,
            fiber: 2
          },
          {
            name: "Spinach",
            portion: "1 cup",
            calories: 7,
            protein: 1,
            carbs: 1,
            fats: 0,
            fiber: 1
          },
          {
            name: "Avocado",
            portion: "1/4",
            calories: 83,
            protein: 1,
            carbs: 3,
            fats: 8,
            fiber: 0
          }
        ],
        preparation: {
          steps: [
            "Crumble tofu",
            "Sauté vegetables",
            "Add tofu and seasonings",
            "Top with avocado"
          ],
          time: "15 minutes",
          difficulty: "Medium",
          tips: ["Press tofu before cooking", "Use turmeric for color"]
        }
      }
    ],
    vegan: [
      {
        name: "Chia Pudding",
        calories: 280,
        macros: { protein: 12, carbs: 35, fats: 12, fiber: 10 },
        items: [
          {
            name: "Chia Seeds",
            portion: "2 tbsp",
            calories: 120,
            protein: 4,
            carbs: 10,
            fats: 8,
            fiber: 8
          },
          {
            name: "Almond Milk",
            portion: "1 cup",
            calories: 60,
            protein: 2,
            carbs: 8,
            fats: 2,
            fiber: 1
          },
          {
            name: "Mixed Berries",
            portion: "1/2 cup",
            calories: 40,
            protein: 1,
            carbs: 10,
            fats: 0,
            fiber: 3
          },
          {
            name: "Almonds",
            portion: "10",
            calories: 60,
            protein: 5,
            carbs: 7,
            fats: 2,
            fiber: 0
          }
        ],
        preparation: {
          steps: [
            "Mix chia seeds with almond milk",
            "Refrigerate overnight",
            "Top with berries and almonds"
          ],
          time: "5 minutes (plus overnight)",
          difficulty: "Easy",
          tips: ["Use unsweetened almond milk", "Add cinnamon for flavor"]
        }
      }
    ]
  },
  lunch: {
    standard: [
      {
        name: "Grilled Chicken Salad",
        calories: 450,
        macros: { protein: 35, carbs: 25, fats: 22, fiber: 8 },
        items: [
          {
            name: "Chicken Breast",
            portion: "4 oz",
            calories: 180,
            protein: 35,
            carbs: 0,
            fats: 4,
            fiber: 0
          },
          {
            name: "Mixed Greens",
            portion: "2 cups",
            calories: 20,
            protein: 2,
            carbs: 4,
            fats: 0,
            fiber: 2
          },
          {
            name: "Olive Oil",
            portion: "1 tbsp",
            calories: 120,
            protein: 0,
            carbs: 0,
            fats: 14,
            fiber: 0
          },
          {
            name: "Quinoa",
            portion: "1/2 cup",
            calories: 110,
            protein: 4,
            carbs: 20,
            fats: 2,
            fiber: 3
          },
          {
            name: "Mixed Vegetables",
            portion: "1/2 cup",
            calories: 20,
            protein: 1,
            carbs: 4,
            fats: 0,
            fiber: 2
          }
        ],
        preparation: {
          steps: [
            "Grill chicken breast",
            "Cook quinoa",
            "Chop vegetables",
            "Combine with dressing"
          ],
          time: "20 minutes",
          difficulty: "Medium",
          tips: ["Marinate chicken for extra flavor", "Use fresh vegetables"]
        }
      }
    ],
    vegetarian: [
      {
        name: "Quinoa Buddha Bowl",
        calories: 420,
        macros: { protein: 18, carbs: 55, fats: 15, fiber: 12 },
        items: [
          {
            name: "Quinoa",
            portion: "1/2 cup",
            calories: 110,
            protein: 4,
            carbs: 20,
            fats: 2,
            fiber: 3
          },
          {
            name: "Chickpeas",
            portion: "1/2 cup",
            calories: 120,
            protein: 6,
            carbs: 20,
            fats: 2,
            fiber: 5
          },
          {
            name: "Mixed Vegetables",
            portion: "1 cup",
            calories: 50,
            protein: 2,
            carbs: 10,
            fats: 0,
            fiber: 4
          },
          {
            name: "Tahini Dressing",
            portion: "1 tbsp",
            calories: 90,
            protein: 3,
            carbs: 3,
            fats: 8,
            fiber: 0
          }
        ],
        preparation: {
          steps: [
            "Cook quinoa",
            "Roast vegetables",
            "Mix with chickpeas",
            "Add dressing"
          ],
          time: "25 minutes",
          difficulty: "Medium",
          tips: ["Roast vegetables for better flavor", "Make dressing in advance"]
        }
      }
    ],
    vegan: [
      // ... existing vegan lunch meals ...
    ]
  },
  dinner: {
    standard: [
      {
        name: "Salmon with Roasted Vegetables",
        calories: 500,
        macros: { protein: 35, carbs: 30, fats: 25, fiber: 8 },
        items: [
          {
            name: "Salmon",
            portion: "6 oz",
            calories: 280,
            protein: 34,
            carbs: 0,
            fats: 15,
            fiber: 0
          },
          {
            name: "Sweet Potato",
            portion: "1 medium",
            calories: 100,
            protein: 2,
            carbs: 23,
            fats: 0,
            fiber: 4
          },
          {
            name: "Broccoli",
            portion: "1 cup",
            calories: 30,
            protein: 2,
            carbs: 6,
            fats: 0,
            fiber: 2
          },
          {
            name: "Olive Oil",
            portion: "1 tbsp",
            calories: 120,
            protein: 0,
            carbs: 0,
            fats: 14,
            fiber: 0
          }
        ],
        preparation: {
          steps: [
            "Season salmon",
            "Roast vegetables",
            "Bake salmon",
            "Combine and serve"
          ],
          time: "30 minutes",
          difficulty: "Medium",
          tips: ["Use fresh herbs", "Don't overcook salmon"]
        }
      }
    ],
    vegetarian: [
      {
        name: "Lentil Curry",
        calories: 480,
        macros: { protein: 22, carbs: 65, fats: 15, fiber: 15 },
        items: [
          {
            name: "Lentils",
            portion: "1/2 cup dry",
            calories: 120,
            protein: 9,
            carbs: 20,
            fats: 0,
            fiber: 8
          },
          {
            name: "Coconut Milk",
            portion: "1/2 cup",
            calories: 200,
            protein: 2,
            carbs: 3,
            fats: 20,
            fiber: 0
          },
          {
            name: "Mixed Vegetables",
            portion: "1 cup",
            calories: 50,
            protein: 2,
            carbs: 10,
            fats: 0,
            fiber: 4
          },
          {
            name: "Brown Rice",
            portion: "1/2 cup",
            calories: 110,
            protein: 3,
            carbs: 23,
            fats: 1,
            fiber: 2
          }
        ],
        preparation: {
          steps: [
            "Cook lentils",
            "Sauté vegetables",
            "Add coconut milk and spices",
            "Serve with rice"
          ],
          time: "35 minutes",
          difficulty: "Medium",
          tips: ["Use fresh spices", "Adjust spice level to taste"]
        }
      }
    ],
    vegan: [
      // ... existing vegan dinner meals ...
    ]
  },
  snacks: {
    standard: [
      {
        name: "Greek Yogurt with Nuts",
        calories: 200,
        macros: { protein: 15, carbs: 12, fats: 10, fiber: 2 },
        items: [
          {
            name: "Greek Yogurt",
            portion: "1/2 cup",
            calories: 100,
            protein: 15,
            carbs: 5,
            fats: 0,
            fiber: 0
          },
          {
            name: "Mixed Nuts",
            portion: "1/4 cup",
            calories: 100,
            protein: 4,
            carbs: 4,
            fats: 9,
            fiber: 2
          }
        ],
        preparation: {
          steps: ["Mix yogurt and nuts"],
          time: "2 minutes",
          difficulty: "Easy",
          tips: ["Use plain yogurt", "Add cinnamon for flavor"]
        }
      }
    ],
    vegetarian: [
      // ... existing vegetarian snack meals ...
    ],
    vegan: [
      // ... existing vegan snack meals ...
    ]
  }
};

// Add logging to debug OpenAI client initialization
if (openai) {
  console.log('OpenAI client initialized with base URL:', openai.baseURL);
} else {
  console.log('OpenAI client not initialized - missing API key');
}

// Helper functions for meal plan generation
function generateHydrationSchedule(mealsPerDay: number): string[] {
  const schedule = ['1 glass upon waking'];
  for (let i = 1; i <= mealsPerDay; i++) {
    schedule.push(`1 glass with meal ${i}`);
    if (i < mealsPerDay) {
      schedule.push(`1 glass between meals ${i} and ${i + 1}`);
    }
  }
  schedule.push('1 glass before bed');
  return schedule;
}

function generateDietaryNotes(goal: string, restrictions: string[]): string {
  let notes = `Focus on ${goal.replace('_', ' ')} with proper nutrition. `;
  
  if (restrictions.length > 0) {
    notes += `Avoiding: ${restrictions.join(', ')}. `;
  }
  
  notes += 'Adjust portions based on hunger levels and energy needs.';
  return notes;
}

function generateGroceryList(meals: any[], restrictions: string[]): {
  proteins: string[];
  carbs: string[];
  fats: string[];
  produce: string[];
  pantry: string[];
  alternatives: {
    dairy: string[];
    gluten: string[];
    meat: string[];
  };
} {
  const baseList = {
    proteins: ['Chicken breast', 'Fish', 'Greek yogurt', 'Eggs'],
    carbs: ['Oatmeal', 'Brown rice', 'Sweet potatoes', 'Quinoa'],
    fats: ['Olive oil', 'Avocado', 'Nuts', 'Seeds'],
    produce: ['Mixed berries', 'Leafy greens', 'Bell peppers', 'Broccoli'],
    pantry: ['Herbs and spices', 'Whole grain bread', 'Protein powder'],
    alternatives: {
      dairy: ['Almond milk', 'Coconut yogurt'],
      gluten: ['Quinoa', 'Rice'],
      meat: ['Tofu', 'Legumes']
    }
  };

  // Filter out restricted items
  if (restrictions.includes('dairy')) {
    baseList.proteins = baseList.proteins.filter(item => !item.includes('yogurt'));
  }
  if (restrictions.includes('gluten')) {
    baseList.carbs = baseList.carbs.filter(item => !item.includes('bread'));
  }
  if (restrictions.includes('meat')) {
    baseList.proteins = baseList.proteins.filter(item => 
      !['Chicken', 'Fish'].some(meat => item.includes(meat))
    );
  }

  return baseList;
}

function generateMealPrepGuidelines(meals: any[]): {
  tips: string[];
  schedule: string;
  storage: string[];
} {
  return {
    tips: [
      'Prep vegetables in advance',
      'Cook proteins in bulk',
      'Store meals properly',
      'Use portion control containers'
    ],
    schedule: 'Sunday and Wednesday meal prep sessions',
    storage: [
      'Use airtight containers',
      'Label with dates',
      'Refrigerate promptly',
      'Freeze extra portions'
    ]
  };
}

function generateNutritionGuidelines(
  goal: string,
  activityLevel: string,
  restrictions: string[]
): {
  guidelines: string[];
  timing: string;
  supplements: string[];
  hydration: string;
} {
  const guidelines = [
    'Eat every 3-4 hours',
    'Include protein with each meal',
    'Stay hydrated',
    `Focus on ${goal.replace('_', ' ')}`
  ];

  if (activityLevel.includes('active')) {
    guidelines.push('Increase carbohydrate intake around workouts');
  }

  return {
    guidelines,
    timing: 'Space meals 3-4 hours apart',
    supplements: [
      'Multivitamin if needed',
      'Protein powder optional',
      ...generateSupplementRecommendations(goal, restrictions)
    ],
    hydration: 'Drink water consistently throughout the day'
  };
}

function generateSupplementRecommendations(goal: string, restrictions: string[]): string[] {
  const supplements: string[] = [];
  
  if (restrictions.includes('vegan') || restrictions.includes('vegetarian')) {
    supplements.push('Vitamin B12');
    supplements.push('Iron');
  }
  
  if (goal === 'muscle_gain') {
    supplements.push('Creatine monohydrate');
  }
  
  return supplements;
}

function generateBasicMeal(
  name: string,
  targetCalories: number,
  macros: MacroNutrients,
  restrictions: string[],
  time: string
): {
  name: string;
  time: string;
  calories: number;
  macros: MacroNutrients;
  items: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    preparation: string;
    alternatives: string[];
  }>;
  preparation: {
    steps: string[];
    time: string;
    difficulty: string;
    tips: string[];
  };
} {
  // Basic meal template
  return {
    name,
    time,
    calories: targetCalories,
    macros: {
      protein: Math.round(targetCalories * macros.protein / 4),
      carbs: Math.round(targetCalories * macros.carbs / 4),
      fats: Math.round(targetCalories * macros.fats / 9),
      fiber: Math.round(targetCalories * macros.fiber / 2)
    },
    items: [
      {
        name: "Balanced Meal",
        portion: "1 serving",
        calories: targetCalories,
        protein: Math.round(targetCalories * macros.protein / 4),
        carbs: Math.round(targetCalories * macros.carbs / 4),
        fats: Math.round(targetCalories * macros.fats / 9),
        fiber: Math.round(targetCalories * macros.fiber / 2),
        preparation: "Follow meal prep guidelines",
        alternatives: generateMealAlternatives(restrictions)
      }
    ],
    preparation: {
      steps: ["Prepare ingredients", "Cook according to instructions", "Portion appropriately"],
      time: "30 minutes",
      difficulty: "Medium",
      tips: ["Prep ingredients in advance", "Follow portion sizes"]
    }
  };
}

function generateMealAlternatives(restrictions: string[]): string[] {
  const alternatives = ['Grilled chicken with vegetables', 'Salmon with quinoa', 'Tofu stir-fry'];
  return alternatives.filter(alt => {
    if (restrictions.includes('meat')) {
      return !alt.includes('chicken') && !alt.includes('salmon');
    }
    return true;
  });
}

function getDefaultMealTime(mealNumber: number, totalMeals: number): string {
  const startHour = 8; // Start at 8 AM
  const endHour = 20; // End at 8 PM
  const interval = (endHour - startHour) / (totalMeals - 1);
  const hour = Math.round(startHour + (mealNumber - 1) * interval);
  return `${hour}:00`;
}

// Type for activity level adjustments
type ActivityAdjustments = {
  [key in 'sedentary' | 'light' | 'moderate' | 'active' | 'very active']: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
};

function calculateMacroDistribution(goal: Goal, activityLevel: string): MacroNutrients {
  const baseDistribution = {
    weight_loss: { protein: 0.4, carbs: 0.3, fats: 0.3, fiber: 0.15 },
    muscle_gain: { protein: 0.35, carbs: 0.45, fats: 0.2, fiber: 0.12 },
    maintenance: { protein: 0.3, carbs: 0.4, fats: 0.3, fiber: 0.13 }
  };

  const activityAdjustments: ActivityAdjustments = {
    'sedentary': { protein: 0, carbs: -0.05, fats: 0.05, fiber: 0 },
    'light': { protein: 0, carbs: 0, fats: 0, fiber: 0 },
    'moderate': { protein: 0.05, carbs: 0.05, fats: -0.1, fiber: 0.02 },
    'active': { protein: 0.1, carbs: 0.1, fats: -0.2, fiber: 0.03 },
    'very active': { protein: 0.15, carbs: 0.15, fats: -0.3, fiber: 0.05 }
  };

  const base = baseDistribution[goal] || baseDistribution.maintenance;
  const adjustment = activityAdjustments[activityLevel.toLowerCase() as keyof ActivityAdjustments] || activityAdjustments.light;

  return {
    protein: Math.min(0.5, Math.max(0.2, base.protein + adjustment.protein)),
    carbs: Math.min(0.6, Math.max(0.2, base.carbs + adjustment.carbs)),
    fats: Math.min(0.4, Math.max(0.15, base.fats + adjustment.fats)),
    fiber: Math.min(0.2, Math.max(0.1, base.fiber + adjustment.fiber))
  };
}

// Enhanced meal selection with variation
function selectMealsWithVariation(
  targetCalories: number,
  macroDistribution: MacroNutrients,
  dietaryPreference: DietaryPreference,
  mealType: MealType,
  previousMeals: Set<string> = new Set()
): Meal {
  const meals = mealDatabase[mealType][dietaryPreference];
  
  // Filter out previously selected meals
  const availableMeals = meals.filter(meal => !previousMeals.has(meal.name));
  
  // If no meals available, reset the selection
  const mealsToConsider = availableMeals.length > 0 ? availableMeals : meals;
  
  // Calculate macro targets for this meal
  const mealTargets = {
    protein: targetCalories * macroDistribution.protein / 4, // 4 calories per gram of protein
    carbs: targetCalories * macroDistribution.carbs / 4,    // 4 calories per gram of carbs
    fats: targetCalories * macroDistribution.fats / 9,      // 9 calories per gram of fat
    fiber: targetCalories * macroDistribution.fiber / 2     // Approximate fiber calculation
  };
  
  // Find the best matching meal
  return mealsToConsider.reduce((best, current) => {
    const bestScore = calculateMealScore(best.macros, mealTargets);
    const currentScore = calculateMealScore(current.macros, mealTargets);
    return currentScore > bestScore ? current : best;
  });
}

// Helper function to calculate how well a meal matches the target macros
function calculateMealScore(mealMacros: MacroNutrients, targetMacros: MacroNutrients): number {
  const weights = { protein: 1.2, carbs: 1.0, fats: 1.0, fiber: 0.8 };
  
  return Object.keys(mealMacros).reduce((score, macro) => {
    const key = macro as keyof MacroNutrients;
    const diff = Math.abs(mealMacros[key] - targetMacros[key]);
    const maxAllowedDiff = targetMacros[key] * 0.2; // Allow 20% deviation
    const macroScore = Math.max(0, 1 - (diff / maxAllowedDiff));
    return score + (macroScore * weights[key]);
  }, 0);
}

// Enhanced meal plan generation with weekly variation
function generateMealPlan(
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: ActivityLevel,
  goal: Goal,
  dietaryPreference: DietaryPreference = 'standard'
): {
  dailyPlan: {
    meals: {
      [key in MealType]: Meal;
    };
    totalCalories: number;
    totalMacros: MacroNutrients;
  };
  weeklyPlan: {
    [key: string]: {
      meals: {
        [key in MealType]: Meal;
      };
      totalCalories: number;
      totalMacros: MacroNutrients;
    };
  };
} {
  const bmrValue = calculateBMR(weight, height, age, gender);
  const tdeeValue = calculateTDEE(bmrValue, activityLevel);
  const targetCalories = calculateTargetCalories(tdeeValue, goal);
  const macroDistribution = calculateMacroDistribution(goal, activityLevel);
  
  // Track selected meals to ensure variation
  const selectedMeals = {
    breakfast: new Set<string>(),
    lunch: new Set<string>(),
    dinner: new Set<string>(),
    snacks: new Set<string>()
  };
  
  const weeklyPlan: { [key: string]: { meals: { [key in MealType]: Meal }, totalCalories: number, totalMacros: MacroNutrients } } = {};
  
  // Generate varied meals for each day of the week
  for (let i = 1; i <= 7; i++) {
    const dayMeals = {
      breakfast: selectMealsWithVariation(targetCalories * 0.25, macroDistribution, dietaryPreference, 'breakfast', selectedMeals.breakfast),
      lunch: selectMealsWithVariation(targetCalories * 0.35, macroDistribution, dietaryPreference, 'lunch', selectedMeals.lunch),
      dinner: selectMealsWithVariation(targetCalories * 0.3, macroDistribution, dietaryPreference, 'dinner', selectedMeals.dinner),
      snacks: selectMealsWithVariation(targetCalories * 0.1, macroDistribution, dietaryPreference, 'snacks', selectedMeals.snacks)
    };
    
    // Update selected meals
    selectedMeals.breakfast.add(dayMeals.breakfast.name);
    selectedMeals.lunch.add(dayMeals.lunch.name);
    selectedMeals.dinner.add(dayMeals.dinner.name);
    selectedMeals.snacks.add(dayMeals.snacks.name);
    
    weeklyPlan[`Day ${i}`] = {
      meals: dayMeals,
      totalCalories: targetCalories,
      totalMacros: macroDistribution
    };
  }
  
  return {
    dailyPlan: weeklyPlan['Day 1'],
    weeklyPlan
  };
}

// Enhanced fallback meal plan generator
function generateFallbackMealPlan(
  age: string,
  weight: string,
  height: string,
  goal: string,
  activityLevel: string,
  dietaryRestrictions: string[],
  mealsPerDay: string
): any {
  const numericAge = parseInt(age);
  const numericWeight = parseFloat(weight);
  const numericHeight = parseFloat(height);
  
  // Calculate basic nutritional needs
  const bmr = calculateBMR(numericWeight, numericHeight, numericAge, 'neutral');
  const tdee = calculateTDEE(bmr, activityLevel as ActivityLevel);
  const targetCalories = calculateTargetCalories(tdee, goal as Goal);
  const macros = calculateMacroDistribution(goal as Goal, activityLevel);
  
  // Generate basic meal structure
  const meals = generateBasicMeals(
    targetCalories,
    parseInt(mealsPerDay),
    macros,
    dietaryRestrictions
  );
  
  return {
    name: "Basic Balanced Meal Plan",
    description: `A balanced ${goal}-focused meal plan with ${mealsPerDay} meals per day`,
    totalCalories: targetCalories,
    macros: {
      protein: `${Math.round(targetCalories * macros.protein / 4)}g per day`,
      carbs: `${Math.round(targetCalories * macros.carbs / 4)}g per day`,
      fats: `${Math.round(targetCalories * macros.fats / 9)}g per day`,
      fiber: `${Math.round(targetCalories * macros.fiber / 2)}g per day`
    },
    days: [
      {
        name: "Day 1",
        totalCalories: targetCalories,
        macros: {
          protein: Math.round(targetCalories * macros.protein / 4),
          carbs: Math.round(targetCalories * macros.carbs / 4),
          fats: Math.round(targetCalories * macros.fats / 9),
          fiber: Math.round(targetCalories * macros.fiber / 2)
        },
        meals: meals,
        hydration: {
          water: `${Math.round(numericWeight * 0.033)}L per day`,
          schedule: generateHydrationSchedule(parseInt(mealsPerDay))
        },
        notes: generateDietaryNotes(goal, dietaryRestrictions)
      }
    ],
    groceryList: generateGroceryList(meals, dietaryRestrictions),
    mealPrep: generateMealPrepGuidelines(meals),
    nutrition: generateNutritionGuidelines(goal, activityLevel, dietaryRestrictions)
  };
}

// Helper function to generate basic meals
function generateBasicMeals(
  totalCalories: number,
  mealsPerDay: number,
  macros: MacroNutrients,
  restrictions: string[]
): any[] {
  const mealCalories = Math.round(totalCalories / mealsPerDay);
  const meals = [];
  
  for (let i = 1; i <= mealsPerDay; i++) {
    meals.push(generateBasicMeal(
      `Meal ${i}`,
      mealCalories,
      macros,
      restrictions,
      getDefaultMealTime(i, mealsPerDay)
    ));
  }
  
  return meals;
}

// Add input validation function
function validateMealPlanInput(body: any): { isValid: boolean; error?: string } {
  const {
    age,
    weight,
    height,
    gender,
    activityLevel,
    goal,
    restrictions,
    mealsPerDay
  } = body;

  // Check if required fields are present
  if (!age || !weight || !height || !gender || !activityLevel || !goal || !mealsPerDay) {
    return { isValid: false, error: 'Missing required fields' };
  }

  // Validate numeric values
  if (isNaN(Number(age)) || Number(age) <= 0) {
    return { isValid: false, error: 'Age must be a positive number' };
  }
  if (isNaN(Number(weight)) || Number(weight) <= 0) {
    return { isValid: false, error: 'Weight must be a positive number' };
  }
  if (isNaN(Number(height)) || Number(height) <= 0) {
    return { isValid: false, error: 'Height must be a positive number' };
  }
  if (isNaN(Number(mealsPerDay)) || Number(mealsPerDay) < 2 || Number(mealsPerDay) > 6) {
    return { isValid: false, error: 'Meals per day must be between 2 and 6' };
  }

  // Validate gender
  if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
    return { isValid: false, error: 'Invalid gender value' };
  }

  // Validate activity level
  if (!['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activityLevel.toLowerCase())) {
    return { isValid: false, error: 'Invalid activity level' };
  }

  // Validate goal
  if (!['weight_loss', 'maintenance', 'muscle_gain'].includes(goal.toLowerCase())) {
    return { isValid: false, error: 'Invalid goal' };
  }

  return { isValid: true };
}

// Define types for activity levels and goals
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'weight_loss' | 'maintenance' | 'muscle_gain';

// Calculate BMR using Mifflin-St Jeor Equation
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  const weightInKg = weight * 0.453592; // Convert lbs to kg
  const heightInCm = height * 2.54; // Convert inches to cm
  
  if (gender.toLowerCase() === 'male') {
    return 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
  } else {
    return 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
  }
}

// Calculate TDEE based on activity level
function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const activityMultipliers: Record<ActivityLevel, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
  };
  
  return bmr * activityMultipliers[activityLevel];
}

// Calculate target calories based on goal
function calculateTargetCalories(tdee: number, goal: Goal): number {
  const goalAdjustments: Record<Goal, number> = {
    'weight_loss': 0.85, // 15% deficit
    'maintenance': 1.0,
    'muscle_gain': 1.15 // 15% surplus
  };
  
  return tdee * goalAdjustments[goal];
}

export async function POST(req: Request) {
  try {
    // Get user from authentication token
    let userId = 'anonymous'; // Default to anonymous user
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;

      if (token) {
        const decoded = verify(token, JWT_SECRET) as { id: string };
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });
        if (user) {
          userId = user.id;
        }
      }
    } catch (authError) {
      console.error('Authentication error:', authError);
      // Continue with anonymous user
    }

    const body = await req.json();
    console.log('Received request body:', body);

    // Validate input
    const validation = validateMealPlanInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const {
      age,
      weight,
      height,
      gender,
      activityLevel,
      goal,
      restrictions = [],
      mealsPerDay
    } = body;

    // Calculate BMI and daily calorie needs
    const bmi = calculateBMI(Number(weight), Number(height));
    const bmiCategory = getBMICategory(bmi);
    const dailyCalories = calculateDailyCalories(
      Number(weight),
      Number(height),
      activityLevel,
      goal,
      Number(age)
    );

    // Generate meal plan
    const mealPlan = generateFallbackMealPlan(
      age.toString(),
      weight.toString(),
      height.toString(),
      goal,
      activityLevel,
      restrictions,
      mealsPerDay.toString()
    );

    // Save to database
    const savedPlan = await savePlanToDatabase(mealPlan, userId, {
      bmi,
      bmiCategory,
      dailyCalories,
      goal,
      restrictions,
      mealsPerDay: Number(mealsPerDay)
    });

    return NextResponse.json({
      mealPlan,
      planId: savedPlan.id
    });

  } catch (error: any) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate meal plan' },
      { status: error.status || 500 }
    );
  }
}

// Helper functions for calorie calculations
function calculateBMI(weight: number, height: number): number {
  // BMI formula: weight (kg) / (height (m) ^ 2)
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) {
    return 'Underweight';
  } else if (bmi >= 18.5 && bmi < 24.9) {
    return 'Normal weight';
  } else if (bmi >= 25 && bmi < 29.9) {
    return 'Overweight';
  } else {
    return 'Obesity';
  }
}

function calculateDailyCalories(weight: number, height: number, activityLevel: string, goal: string, age: number): number {
  // BMR calculation
  const bmr = calculateBMR(weight, height, age, 'male');
  const tdee = calculateTDEE(bmr, activityLevel as ActivityLevel);

  // Adjust based on the goal
  switch (goal.toLowerCase()) {
    case 'weight loss':
      return Math.round(tdee * 0.8); // 20% deficit
    case 'weight gain':
      return Math.round(tdee * 1.2); // 20% surplus
    default:
      return Math.round(tdee); // maintenance
  }
}

function generateSystemPrompt(
  dailyCalories: number,
  mealsPerDay: number,
  goal: string,
  restrictions: string[],
  bmiCategory: string
): string {
  // Implement the logic to generate a system prompt based on the given parameters
  // This is a placeholder and should be replaced with the actual implementation
  return `You are a professional nutritionist creating a meal plan for ${mealsPerDay} meals per day, targeting ${dailyCalories} calories, with a focus on ${goal}. Consider BMI category: ${bmiCategory} and dietary restrictions: ${restrictions.join(', ')}`;
}

async function savePlanToDatabase(
  mealPlan: any,
  userId: string,
  planData: any
) {
  return await prisma.mealPlan.create({
    data: {
      userId,
      name: mealPlan.name || `${planData.goal} Meal Plan`,
      description: mealPlan.description || `Custom meal plan targeting ${planData.dailyCalories} calories per day`,
      meals: [mealPlan],
      goal: String(planData.goal || 'MAINTAIN'),
      mealsPerDay: planData.mealsPerDay,
      dietaryRestrictions: planData.restrictions || []
    }
  });
}

// Define types for meals and dietary preferences
type DietaryPreference = 'standard' | 'vegetarian' | 'vegan';

interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface MealItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface Preparation {
  steps: string[];
  time: string;
  difficulty: string;
  tips?: string[];
}

interface Meal {
  name: string;
  calories: number;
  macros: MacroNutrients;
  items: MealItem[];
  preparation: Preparation;
}

interface MealDatabase {
  [key: string]: {
    [key in DietaryPreference]: Meal[];
  };
}

// Select meals based on dietary preferences and nutritional requirements
function selectMeals(
  targetCalories: number,
  macroDistribution: { protein: number, carbs: number, fats: number },
  dietaryPreference: DietaryPreference,
  mealType: MealType
): Meal {
  const meals = mealDatabase[mealType][dietaryPreference];
  
  // Find the meal that best matches the target macros
  const bestMeal = meals.reduce((best: Meal, current: Meal) => {
    const bestDiff = Math.abs(best.macros.protein - macroDistribution.protein) +
                    Math.abs(best.macros.carbs - macroDistribution.carbs) +
                    Math.abs(best.macros.fats - macroDistribution.fats);
    
    const currentDiff = Math.abs(current.macros.protein - macroDistribution.protein) +
                       Math.abs(current.macros.carbs - macroDistribution.carbs) +
                       Math.abs(current.macros.fats - macroDistribution.fats);
    
    return currentDiff < bestDiff ? current : best;
  });
  
  return bestMeal;
} 