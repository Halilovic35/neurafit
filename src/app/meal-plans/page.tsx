'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Form } from '@/components/ui/form';

interface MealPlan {
  id: string;
  name: string;
  description: string;
  days: {
    name: string;
    totalCalories: number;
    macros: {
      protein: number;
      carbs: number;
      fats: number;
      fiber: number;
    };
    meals: {
      name: string;
      time: string;
      calories: number;
      macros: {
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
      };
      items: {
        name: string;
        portion: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
        preparation: string;
        alternatives: string[];
      }[];
      preparation: {
        steps: string[];
        time: string;
        tips: string[];
      };
    }[];
    snacks: {
      name: string;
      time: string;
      calories: number;
      items: string[];
    }[];
    hydration: {
      water: string;
      schedule: string[];
    };
    notes: string;
  }[];
  groceryList: {
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
  };
  mealPrep: {
    tips: string[];
    schedule: string;
    storage: string[];
  };
  nutrition: {
    guidelines: string[];
    timing: string;
    supplements: string[];
    hydration: string;
  };
  notes: string;
}

interface FormData {
  age: string;
  weight: string;
  height: string;
  gender: string;
  activityLevel: string;
  goal: string;
  restrictions: string[];
  preferences: string[];
  mealsPerDay: string;
}

export default function MealPlansPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [formData, setFormData] = useState<FormData>({
    age: '',
    weight: '',
    height: '',
    gender: '',
    activityLevel: '',
    goal: '',
    restrictions: [],
    preferences: [],
    mealsPerDay: '3'
  });

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten Free' },
    { value: 'dairy-free', label: 'Dairy Free' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
  ];

  const handleDietaryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      restrictions: prev.restrictions.includes(value)
        ? prev.restrictions.filter((item) => item !== value)
        : [...prev.restrictions, value],
    }));
  };

  const handleRestrictionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      restrictions: value ? [value] : []
    }));
  };

  const handleSelectChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (field: keyof FormData, e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePreferenceChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: value ? [value] : []
    }));
  };

  const handleMealsPerDayChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      mealsPerDay: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMealPlan(null);

    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      setMealPlan(data.mealPlan);
      router.push(`/meal-plans/${data.planId}`);
      toast.success('Meal plan generated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Generate Your Meal Plan
            </h1>
            <Form
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              submitText="Generate Meal Plan"
            >
              <Input
                label="Age"
                type="number"
                name="age"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e)}
                required
                isLoading={isLoading}
              />

              <Input
                label="Weight (kg)"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e)}
                required
                isLoading={isLoading}
              />

              <Input
                label="Height (cm)"
                type="number"
                name="height"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e)}
                required
                isLoading={isLoading}
              />

              <Select
                label="Gender"
                value={formData.gender}
                onChange={(value) => handleSelectChange('gender', value)}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
                required
                isLoading={isLoading}
              />

              <Select
                label="Activity Level"
                value={formData.activityLevel}
                onChange={(value) => handleSelectChange('activityLevel', value)}
                options={[
                  { value: 'sedentary', label: 'Sedentary' },
                  { value: 'light', label: 'Light Activity' },
                  { value: 'moderate', label: 'Moderate Activity' },
                  { value: 'active', label: 'Very Active' }
                ]}
                required
                isLoading={isLoading}
              />

              <Select
                label="Goal"
                value={formData.goal}
                onChange={(value) => handleSelectChange('goal', value)}
                options={[
                  { value: 'lose-weight', label: 'Lose Weight' },
                  { value: 'maintain', label: 'Maintain Weight' },
                  { value: 'gain-weight', label: 'Gain Weight' }
                ]}
                required
                isLoading={isLoading}
              />

              <Select
                label="Meals per Day"
                value={formData.mealsPerDay}
                onChange={handleMealsPerDayChange}
                options={[
                  { value: '3', label: '3 Meals' },
                  { value: '4', label: '4 Meals' },
                  { value: '5', label: '5 Meals' },
                  { value: '6', label: '6 Meals' }
                ]}
                required
                isLoading={isLoading}
              />
            </Form>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full space-y-6"
                >
                  <div className="w-16 h-16">
                    <svg className="animate-spin h-full w-full text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Creating Your Perfect Meal Plan
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This may take a minute. We're designing a personalized plan based on your goals and dietary preferences.
                    </p>
                  </div>
                </motion.div>
              ) : mealPlan ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                >
                  <h2 className="text-2xl font-semibold mb-4">{mealPlan.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{mealPlan.description}</p>

                  {/* Days */}
                  {mealPlan.days && mealPlan.days.length > 0 ? (
                    mealPlan.days.map((day, index) => (
                      <div key={index} className="border-b pb-6 last:border-b-0">
                        <h3 className="text-xl font-semibold mb-2">{day.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-600 dark:text-gray-300">
                              Total Calories: {day.totalCalories} kcal
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-300">
                              Macros: {day.macros.protein}g protein, {day.macros.carbs}g carbs,{' '}
                              {day.macros.fats}g fats, {day.macros.fiber}g fiber
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {day.meals && day.meals.length > 0 ? (
                            day.meals.map((meal, mealIndex) => (
                              <div
                                key={mealIndex}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                              >
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {meal.name} - {meal.time}
                                </h4>
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  <p>Calories: {meal.calories} kcal</p>
                                  <p>
                                    Macros: {meal.macros.protein}g protein, {meal.macros.carbs}g carbs,{' '}
                                    {meal.macros.fats}g fats, {meal.macros.fiber}g fiber
                                  </p>
                                </div>
                                <div className="mt-4">
                                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                    Ingredients:
                                  </h5>
                                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                                    {meal.items && meal.items.length > 0 ? (
                                      meal.items.map((item, i) => (
                                        <li key={i}>
                                          {item.name} - {item.portion} ({item.calories} kcal)
                                        </li>
                                      ))
                                    ) : (
                                      <li>No ingredients listed</li>
                                    )}
                                  </ul>
                                </div>
                                
                                {/* Preparation Instructions */}
                                {meal.preparation && (
                                  <div className="mt-4">
                                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                      Preparation:
                                    </h5>
                                    {meal.preparation.time && (
                                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                        <span className="font-medium">Time:</span> {meal.preparation.time}
                                      </p>
                                    )}
                                    {meal.preparation.steps && meal.preparation.steps.length > 0 && (
                                      <div className="mb-2">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Steps:</p>
                                        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300">
                                          {meal.preparation.steps.map((step, i) => (
                                            <li key={i} className="mb-1">{step}</li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}
                                    {meal.preparation.tips && meal.preparation.tips.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tips:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                                          {meal.preparation.tips.map((tip, i) => (
                                            <li key={i} className="mb-1">{tip}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-600 dark:text-gray-300">No meals planned for this day.</p>
                          )}
                        </div>

                        {/* Snacks */}
                        {day.snacks && day.snacks.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Snacks:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                              {day.snacks.map((snack, i) => (
                                <li key={i}>
                                  {snack.name} - {snack.time} ({snack.calories} kcal)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Hydration */}
                        {day.hydration && (
                          <div className="mt-6">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hydration:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {day.hydration.water}
                            </p>
                            {day.hydration.schedule && day.hydration.schedule.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {day.hydration.schedule.map((time, i) => (
                                  <li key={i}>{time}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {day.notes && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">{day.notes}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-300">No days found in this meal plan.</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        The meal plan structure might be incomplete. Please try generating a new plan.
                      </p>
                    </div>
                  )}

                  {/* Grocery List */}
                  {mealPlan.groceryList && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-xl font-semibold mb-4">Grocery List</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Proteins:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.groceryList.proteins && mealPlan.groceryList.proteins.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Carbs:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.groceryList.carbs && mealPlan.groceryList.carbs.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Fats:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.groceryList.fats && mealPlan.groceryList.fats.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Produce:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.groceryList.produce && mealPlan.groceryList.produce.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meal Prep */}
                  {mealPlan.mealPrep && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-xl font-semibold mb-4">Meal Prep</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tips:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.mealPrep.tips && mealPlan.mealPrep.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Schedule:</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{mealPlan.mealPrep.schedule}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Storage:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.mealPrep.storage && mealPlan.mealPrep.storage.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nutrition Guidelines */}
                  {mealPlan.nutrition && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-xl font-semibold mb-4">Nutrition Guidelines</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Guidelines:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.nutrition.guidelines && mealPlan.nutrition.guidelines.map((guideline, i) => (
                              <li key={i}>{guideline}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timing:</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{mealPlan.nutrition.timing}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Supplements:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                            {mealPlan.nutrition.supplements && mealPlan.nutrition.supplements.map((supplement, i) => (
                              <li key={i}>{supplement}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hydration:</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{mealPlan.nutrition.hydration}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {mealPlan.notes && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-xl font-semibold mb-4">Additional Notes</h3>
                      <p className="text-gray-600 dark:text-gray-300">{mealPlan.notes}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full"
                >
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {error ? (
                      <span className="text-red-500">{error}</span>
                    ) : (
                      'Fill out the form to generate your personalized meal plan'
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 