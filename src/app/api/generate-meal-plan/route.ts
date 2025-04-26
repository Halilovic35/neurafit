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

// Add logging to debug OpenAI client initialization
if (openai) {
  console.log('OpenAI client initialized with base URL:', openai.baseURL);
} else {
  console.log('OpenAI client not initialized - missing API key');
}

// Add fallback meal plan generator
function generateFallbackMealPlan(
  age: string,
  weight: string,
  height: string,
  goal: string,
  activityLevel: string,
  dietaryRestrictions: string[],
  mealsPerDay: string
): any {
  // Create meals array based on mealsPerDay
  const meals = [
    {
      name: "Breakfast",
      time: "8:00 AM",
      calories: 500,
      macros: {
        protein: 30,
        carbs: 60,
        fats: 20,
        fiber: 8
      },
      items: [
        {
          name: "Oatmeal with Berries",
          portion: "1 cup",
          calories: 300,
          protein: 10,
          carbs: 50,
          fats: 5,
          fiber: 8,
          preparation: "Cook with water or milk, top with berries",
          alternatives: ["Quinoa porridge", "Greek yogurt with granola"]
        }
      ],
      preparation: {
        steps: ["Cook oatmeal", "Add berries", "Add honey if desired"],
        time: "10 minutes",
        tips: ["Use rolled oats for better texture", "Add nuts for extra protein"]
      }
    }
  ];

  // Add lunch if 3 or more meals per day
  if (parseInt(mealsPerDay) >= 3) {
    meals.push({
      name: "Lunch",
      time: "1:00 PM",
      calories: 600,
      macros: {
        protein: 40,
        carbs: 70,
        fats: 25,
        fiber: 10
      },
      items: [
        {
          name: "Grilled Chicken Salad",
          portion: "1 large bowl",
          calories: 400,
          protein: 35,
          carbs: 30,
          fats: 15,
          fiber: 8,
          preparation: "Grill chicken, chop vegetables, combine with dressing",
          alternatives: ["Tuna salad", "Quinoa bowl"]
        }
      ],
      preparation: {
        steps: ["Season chicken", "Grill until cooked through", "Chop vegetables", "Combine with dressing"],
        time: "20 minutes",
        tips: ["Prep vegetables in advance", "Use a variety of colorful vegetables"]
      }
    });
  }

  // Add dinner if 3 meals per day
  if (parseInt(mealsPerDay) >= 3) {
    meals.push({
      name: "Dinner",
      time: "7:00 PM",
      calories: 500,
      macros: {
        protein: 35,
        carbs: 50,
        fats: 20,
        fiber: 8
      },
      items: [
        {
          name: "Salmon with Vegetables",
          portion: "1 fillet with 1 cup vegetables",
          calories: 400,
          protein: 30,
          carbs: 20,
          fats: 25,
          fiber: 5,
          preparation: "Bake salmon with lemon and herbs, steam vegetables",
          alternatives: ["Tofu stir-fry", "Turkey meatballs"]
        }
      ],
      preparation: {
        steps: ["Preheat oven", "Season salmon", "Bake for 15-20 minutes", "Steam vegetables"],
        time: "25 minutes",
        tips: ["Don't overcook salmon", "Season vegetables with herbs"]
      }
    });
  }

  return {
    name: "Basic Balanced Meal Plan",
    description: "A balanced meal plan focusing on whole foods and proper nutrition",
    totalCalories: 2000,
    macros: {
      protein: "150g per day",
      carbs: "250g per day",
      fats: "65g per day",
      fiber: "30g per day"
    },
    days: [
      {
        name: "Day 1",
        totalCalories: 2000,
        macros: {
          protein: 150,
          carbs: 250,
          fats: 65,
          fiber: 30
        },
        meals: meals,
        snacks: [
          {
            name: "Morning Snack",
            time: "10:30 AM",
            calories: 200,
            items: ["Apple with almond butter", "Mixed nuts"]
          },
          {
            name: "Afternoon Snack",
            time: "3:30 PM",
            calories: 200,
            items: ["Greek yogurt with berries", "Protein bar"]
          }
        ],
        hydration: {
          water: "8-10 glasses per day",
          schedule: ["1 glass upon waking", "1 glass with each meal", "1 glass between meals"]
        },
        notes: "Focus on eating slowly and mindfully. Adjust portions based on hunger levels."
      }
    ],
    groceryList: {
      proteins: ["Chicken breast", "Salmon", "Greek yogurt", "Eggs"],
      carbs: ["Oatmeal", "Brown rice", "Sweet potatoes", "Quinoa"],
      fats: ["Olive oil", "Avocado", "Nuts", "Seeds"],
      produce: ["Mixed berries", "Leafy greens", "Bell peppers", "Broccoli"],
      pantry: ["Herbs and spices", "Whole grain bread", "Protein powder"],
      alternatives: {
        dairy: ["Almond milk", "Coconut yogurt"],
        gluten: ["Quinoa", "Rice"],
        meat: ["Tofu", "Legumes"]
      }
    },
    mealPrep: {
      tips: ["Prep vegetables in advance", "Cook proteins in bulk", "Store meals properly"],
      schedule: "Sunday and Wednesday meal prep sessions",
      storage: ["Use airtight containers", "Label with dates", "Refrigerate promptly"]
    },
    nutrition: {
      guidelines: ["Eat every 3-4 hours", "Include protein with each meal", "Stay hydrated"],
      timing: "Space meals 3-4 hours apart",
      supplements: ["Multivitamin if needed", "Protein powder optional"],
      hydration: "Drink 8-10 glasses of water daily"
    },
    notes: "Adjust portions and meal timing based on your schedule and hunger levels. Listen to your body and make modifications as needed."
  };
}

// Add input validation function
function validateMealPlanInput(body: any): { isValid: boolean; error?: string } {
  const requiredFields = ['age', 'weight', 'height', 'goal', 'activityLevel', 'mealsPerDay'];
  
  // Check for missing fields
  for (const field of requiredFields) {
    if (!body[field]) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate numeric fields
  const numericFields = ['age', 'weight', 'height', 'mealsPerDay'];
  for (const field of numericFields) {
    const value = parseFloat(body[field]);
    if (isNaN(value) || value <= 0) {
      return { isValid: false, error: `Invalid ${field}: must be a positive number` };
    }
  }

  // Validate mealsPerDay range
  const mealsPerDay = parseInt(body.mealsPerDay);
  if (mealsPerDay < 2 || mealsPerDay > 6) {
    return { isValid: false, error: 'Meals per day must be between 2 and 6' };
  }

  // Validate activity level
  const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very active'];
  if (!validActivityLevels.includes(body.activityLevel.toLowerCase())) {
    return { isValid: false, error: 'Invalid activity level' };
  }

  return { isValid: true };
}

export async function POST(req: Request) {
  try {
    // Get the token from cookies
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
      age,
      weight,
      height,
      goal,
      activityLevel,
      mealsPerDay,
      restrictions = []
    } = await req.json();

    // Validate required fields
    if (!age || !weight || !height || !goal || !activityLevel || !mealsPerDay) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate BMI and daily calorie needs
    const bmi = calculateBMI(parseFloat(weight), parseFloat(height));
    const bmiCategory = getBMICategory(bmi);
    const dailyCalories = calculateDailyCalories(
      parseFloat(weight),
      parseFloat(height),
      activityLevel,
      goal,
      parseInt(age)  // Add age to calorie calculation
    );

    // Generate the system prompt
    const systemPrompt = generateSystemPrompt(
      dailyCalories,
      mealsPerDay,
      goal,
      restrictions,
      bmiCategory
    );

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }

    try {
      // Make the API call to OpenAI
      const messages: ChatCompletionMessageParam[] = [
        { 
          role: "system", 
          content: `You are a professional nutritionist. You MUST respond with ONLY valid JSON, no other text. The meal plan should follow this EXACT structure:
{
  "name": "Name of the meal plan",
  "description": "Description of the plan",
  "totalCalories": 2000,
  "days": [
    {
      "name": "Day 1",
      "meals": [
        {
          "name": "Breakfast",
          "time": "8:00 AM",
          "calories": 500,
          "foods": [
            {
              "name": "Food item",
              "portion": "1 cup",
              "calories": 200,
              "protein": 15,
              "carbs": 30,
              "fats": 8
            }
          ],
          "instructions": "How to prepare this meal"
        }
      ],
      "snacks": [
        {
          "name": "Morning Snack",
          "time": "10:30 AM",
          "calories": 150,
          "foods": ["Apple", "Almonds"]
        }
      ],
      "totalCalories": 2000,
      "notes": "Day-specific nutrition tips"
    }
  ],
  "tips": [
    "General nutrition tips"
  ]
}`
        },
        { 
          role: "user", 
          content: `Generate a meal plan for ${mealsPerDay} meals per day, targeting ${dailyCalories} calories, with a focus on ${goal}. Consider BMI category: ${bmiCategory} and dietary restrictions: ${restrictions.join(', ') || 'none'}. RESPOND WITH ONLY JSON.` 
        }
      ];

      console.log('Sending request to OpenAI with messages:', JSON.stringify(messages, null, 2));

      const timeoutMs = 30000; // 30 seconds timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
      });

      const openaiPromise = openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = await Promise.race([openaiPromise, timeoutPromise]) as Awaited<typeof openaiPromise>;

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log('Received response from OpenAI:', content);

      try {
        // Try to parse the JSON response
        const mealPlan = JSON.parse(content.trim());
        console.log('Successfully parsed JSON response');

        // Validate meal plan structure
        if (!mealPlan.name || !mealPlan.description) {
          throw new Error('Invalid meal plan: missing name or description');
        }

        if (!mealPlan.days || !Array.isArray(mealPlan.days)) {
          throw new Error('Invalid meal plan: missing or invalid days array');
        }

        // Validate each day
        mealPlan.days.forEach((day: any, index: number) => {
          if (!day.name) {
            throw new Error(`Day ${index + 1} is missing name`);
          }
          if (!day.meals || !Array.isArray(day.meals)) {
            throw new Error(`Day ${index + 1} is missing meals array`);
          }
          if (day.meals.length !== parseInt(mealsPerDay)) {
            throw new Error(`Day ${index + 1} has incorrect number of meals`);
          }
        });

        // Save the meal plan to the database
        const savedPlan = await savePlanToDatabase(mealPlan, decoded.id, {
          bmi,
          bmiCategory,
          dailyCalories,
          goal,
          activityLevel,
          mealsPerDay,
          restrictions
        });

        return NextResponse.json({
          mealPlan,
          planId: savedPlan.id
        });

      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.error('Raw content:', content);
        
        // If parsing failed, try to use the fallback plan
        console.log('Using fallback plan due to parsing error');
        const fallbackPlan = generateFallbackMealPlan(
          '25', // default age
          weight,
          height,
          goal,
          activityLevel,
          restrictions,
          mealsPerDay
        );

        const savedPlan = await savePlanToDatabase(fallbackPlan, decoded.id, {
          bmi,
          bmiCategory,
          dailyCalories,
          goal,
          activityLevel,
          mealsPerDay,
          restrictions
        });

        return NextResponse.json({
          mealPlan: fallbackPlan,
          planId: savedPlan.id,
          message: 'Using fallback meal plan due to parsing error'
        });
      }

    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      return NextResponse.json(
        { error: `Failed to generate meal plan: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in meal plan endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper functions for calorie calculations
function calculateBMR(weight: number, height: number, age: number): number {
  // Mifflin-St Jeor Equation
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultipliers: { [key: string]: number } = {
    'Sedentary': 1.2,
    'Light Activity': 1.375,
    'Moderate Activity': 1.55,
    'Very Active': 1.725,
    'Extra Active': 1.9
  };
  return bmr * (activityMultipliers[activityLevel] || 1.2);
}

function calculateTargetCalories(tdee: number, goal: string): number {
  switch (goal.toLowerCase()) {
    case 'weight loss':
      return Math.round(tdee * 0.8); // 20% deficit
    case 'weight gain':
      return Math.round(tdee * 1.2); // 20% surplus
    default:
      return Math.round(tdee); // maintenance
  }
}

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
  const bmr = calculateBMR(weight, height, age);
  const tdee = calculateTDEE(bmr, activityLevel);

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