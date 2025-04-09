'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ModelViewer from '@/components/ModelViewer';
import type { Exercise, WorkoutPlan, WorkoutDay } from '@/types/workout';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

// Custom loading spinner component
const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface CompletedWorkout {
  dayIndex: number;
  completedAt: string;
  workoutPlanId?: string;
}

interface WorkoutHistoryResponse {
  workoutHistory: {
    completedWorkouts: CompletedWorkout[];
  }[];
  completedWorkouts: CompletedWorkout[];
}

interface WorkoutPlanWithProgress extends WorkoutPlan {
  completedWorkouts?: CompletedWorkout[];
}

export default function WorkoutsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    goal: 'general-fitness',
    fitnessLevel: 'beginner',
    daysPerWeek: '3'
  });
  const [completingWorkout, setCompletingWorkout] = useState<number | null>(null);
  const router = useRouter();

  // Load workout plan from localStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('currentWorkoutPlan');
    const savedCompletedWorkouts = localStorage.getItem('completedWorkouts');
    
    console.log('Loading from localStorage - savedPlan:', savedPlan);
    console.log('Loading from localStorage - savedCompletedWorkouts:', savedCompletedWorkouts);
    
    if (savedPlan) {
      try {
        const parsedPlan = JSON.parse(savedPlan);
        console.log('Parsed workout plan:', parsedPlan);
        setWorkoutPlan(parsedPlan);
      } catch (error) {
        console.error('Error parsing saved workout plan:', error);
      }
    }
    
    if (savedCompletedWorkouts) {
      try {
        const parsedCompletedWorkouts = JSON.parse(savedCompletedWorkouts);
        console.log('Parsed completed workouts:', parsedCompletedWorkouts);
        setCompletedWorkouts(parsedCompletedWorkouts);
      } catch (error) {
        console.error('Error parsing saved completed workouts:', error);
      }
    }
  }, []);

  // Fetch latest workout history from the database when the page loads
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        const response = await fetch('/api/workouts/history');
        if (!response.ok) {
          throw new Error('Failed to fetch workout history');
        }
        const data: WorkoutHistoryResponse = await response.json();
        
        // Use the completedWorkouts directly from the API response
        const completedWorkouts = data.completedWorkouts || [];
        
        console.log('Fetched workout history:', data);
        console.log('Completed workouts:', completedWorkouts);
        
        // Check if the completed workouts belong to the current workout plan
        if (workoutPlan && completedWorkouts.length > 0) {
          // Filter out completed workouts that don't belong to the current workout plan
          const currentPlanCompletedWorkouts = completedWorkouts.filter(workout => 
            workout.workoutPlanId === workoutPlan.id
          );
          
          console.log('Filtered completed workouts for current plan:', currentPlanCompletedWorkouts);
          
          // Update completed workouts state with only the ones for the current plan
          setCompletedWorkouts(currentPlanCompletedWorkouts);
        } else {
          // If no workout plan or no completed workouts, set to empty array
          setCompletedWorkouts([]);
        }

        // If we have a workout plan, determine the next active day
        if (workoutPlan && !isLoading) {
          console.log('Current workout plan:', workoutPlan);
          
          // If there are no completed workouts for this plan, set to the first day
          const currentPlanCompletedWorkouts = completedWorkouts.filter(workout => 
            workout.workoutPlanId === workoutPlan.id
          );
          
          if (currentPlanCompletedWorkouts.length === 0) {
            console.log('No completed workouts for this plan, setting to first day');
            setCurrentDayIndex(0);
            return;
          }
          
          // Find the first incomplete day
          const nextActiveDayIndex = workoutPlan.days.findIndex((_, index) => {
            return !currentPlanCompletedWorkouts.some((workout: CompletedWorkout) => 
              workout.dayIndex === index
            );
          });
          
          console.log('Next active day index:', nextActiveDayIndex);

          // If all days are completed, set to the last day
          if (nextActiveDayIndex === -1) {
            console.log('All days completed, setting to last day');
            setCurrentDayIndex(workoutPlan.days.length - 1);
          } else {
            console.log('Setting current day index to:', nextActiveDayIndex);
            setCurrentDayIndex(nextActiveDayIndex);
          }
        }
      } catch (error) {
        console.error('Error fetching workout history:', error);
        toast.error('Failed to load workout history');
      }
    };

    // Only fetch workout history if we have a workout plan and we're not loading
    if (workoutPlan && !isLoading) {
      fetchWorkoutHistory();
    }
  }, [workoutPlan, isLoading]);

  // Save workout plan to local storage when it changes
  useEffect(() => {
    if (workoutPlan) {
      console.log('Saving workout plan to localStorage:', workoutPlan);
      localStorage.setItem('currentWorkoutPlan', JSON.stringify(workoutPlan));
    }
  }, [workoutPlan]);

  // Save completed workouts to local storage when they change
  useEffect(() => {
    console.log('Saving completed workouts to localStorage:', completedWorkouts);
    localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
  }, [completedWorkouts]);

  // Set the current day index when the workout plan or completed workouts change
  useEffect(() => {
    // Only run this effect if we have a workout plan and we're not loading
    if (workoutPlan && !isLoading) {
      console.log('Setting current day index based on completed workouts');
      
      // If there are no completed workouts, set to the first day
      if (completedWorkouts.length === 0) {
        console.log('No completed workouts, setting to first day');
        setCurrentDayIndex(0);
        return;
      }
      
      // Find the first incomplete day
      const nextActiveDayIndex = workoutPlan.days.findIndex((_, index) => {
        return !completedWorkouts.some((workout: CompletedWorkout) => 
          workout.dayIndex === index && 
          workout.workoutPlanId === workoutPlan.id
        );
      });
      
      console.log('Next active day index:', nextActiveDayIndex);

      // If all days are completed, set to the last day
      if (nextActiveDayIndex === -1) {
        console.log('All days completed, setting to last day');
        setCurrentDayIndex(workoutPlan.days.length - 1);
      } else {
        console.log('Setting current day index to:', nextActiveDayIndex);
        setCurrentDayIndex(nextActiveDayIndex);
      }
    }
  }, [workoutPlan, completedWorkouts, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Convert string values to numbers where needed
      const requestData = {
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        goal: formData.goal,
        fitnessLevel: formData.fitnessLevel,
        daysPerWeek: formData.daysPerWeek
      };

      // Log request data for debugging
      console.log('Sending request with data:', requestData);

      // Validate numeric values
      if (isNaN(requestData.height) || isNaN(requestData.weight) || isNaN(requestData.age)) {
        throw new Error('Age, height and weight must be valid numbers');
      }

      // Additional request validation
      if (requestData.age < 13 || requestData.age > 100) {
        throw new Error('Age must be between 13 and 100');
      }
      if (requestData.height < 100 || requestData.height > 250) {
        throw new Error('Height must be between 100cm and 250cm');
      }
      if (requestData.weight < 30 || requestData.weight > 300) {
        throw new Error('Weight must be between 30kg and 300kg');
      }

      // Reset completed workouts BEFORE generating a new workout plan
      console.log('Resetting completed workouts for new workout plan');
      console.log('Previous completed workouts:', completedWorkouts);
      setCompletedWorkouts([]);
      localStorage.removeItem('completedWorkouts');
      console.log('Completed workouts reset to empty array');

      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      // Log raw response data for debugging
      console.log('Received response:', data);

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || data.details || 'Failed to generate workout plan');
      }

      // Detailed response validation
      if (!data) {
        console.error('Empty response received');
        throw new Error('Server returned empty response');
      }

      if (!data.days) {
        console.error('Response missing days array:', data);
        throw new Error('Workout plan is missing required data');
      }

      if (!Array.isArray(data.days)) {
        console.error('Days is not an array:', typeof data.days);
        throw new Error('Invalid workout plan format');
      }

      if (data.days.length === 0) {
        console.error('Days array is empty');
        throw new Error('No workout days generated');
      }

      // Validate each day's data structure with detailed error messages
      const validateDay = (day: any, index: number): string[] => {
        const errors: string[] = [];
        if (!day) errors.push(`Day ${index + 1} is undefined`);
        if (!day.name) errors.push(`Day ${index + 1} is missing a name`);
        if (!day.focus) errors.push(`Day ${index + 1} is missing a focus area`);
        if (!Array.isArray(day.exercises)) errors.push(`Day ${index + 1} has invalid exercises`);
        if (!day.warmup?.exercises) errors.push(`Day ${index + 1} is missing warmup exercises`);
        if (!day.cooldown?.exercises) errors.push(`Day ${index + 1} is missing cooldown exercises`);
        return errors;
      };

      const dayValidationErrors: string[] = [];
      data.days.forEach((day: any, index: number) => {
        const errors = validateDay(day, index);
        dayValidationErrors.push(...errors);
      });

      if (dayValidationErrors.length > 0) {
        console.error('Day validation errors:', dayValidationErrors);
        throw new Error(`Invalid workout plan structure: ${dayValidationErrors[0]}`);
      }

      // If all validation passes, update the state
      setWorkoutPlan(data);
      setCurrentDayIndex(0);
      
      // Save to localStorage after validation
      console.log('Saving workout plan to localStorage:', data);
      localStorage.setItem('currentWorkoutPlan', JSON.stringify(data));

      // Log success
      console.log('Successfully generated and validated workout plan');
    } catch (error) {
      console.error('Error generating workout plan:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      // Clear invalid workout plan
      setWorkoutPlan(null);
      localStorage.removeItem('currentWorkoutPlan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteWorkout = async (dayIndex: number) => {
    if (!workoutPlan) {
      toast.error('No workout plan found');
      return;
    }

    try {
      console.log('Completing workout for day index:', dayIndex);
      console.log('Current completed workouts before update:', completedWorkouts);
      setCompletingWorkout(dayIndex);
      const completedAt = new Date().toISOString();

      const response = await fetch('/api/workouts/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completedWorkout: {
            dayIndex,
            completedAt,
            workoutPlanId: workoutPlan.id,
            difficulty: formData.fitnessLevel,
          },
        }),
      });

      const data = await response.json();
      console.log('Complete workout response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete workout');
      }

      // Update completed workouts state with the workoutPlanId
      const updatedCompletedWorkouts = [...completedWorkouts, { 
        dayIndex, 
        completedAt, 
        workoutPlanId: workoutPlan.id 
      }];
      console.log('Updated completed workouts:', updatedCompletedWorkouts);
      setCompletedWorkouts(updatedCompletedWorkouts);

      // Find the next incomplete day
      const nextIncompleteDayIndex = workoutPlan.days.findIndex((_, index) => {
        // Skip days that are already completed
        if (updatedCompletedWorkouts.some(workout => workout.dayIndex === index && workout.workoutPlanId === workoutPlan.id)) {
          return false;
        }
        // Skip the current day
        if (index === dayIndex) {
          return false;
        }
        return true;
      });
      
      console.log('Next incomplete day index:', nextIncompleteDayIndex);

      // Calculate total completed workouts for this plan
      const totalCompletedWorkouts = updatedCompletedWorkouts.filter(
        workout => workout.workoutPlanId === workoutPlan.id
      ).length;

      console.log('Total completed workouts:', totalCompletedWorkouts);
      console.log('Total days in plan:', workoutPlan.days.length);

      // Check if this was the last day of the workout plan
      const isLastDay = dayIndex === workoutPlan.days.length - 1;
      const allDaysCompleted = totalCompletedWorkouts === workoutPlan.days.length;

      if (allDaysCompleted && isLastDay) {
        // All days are completed and this was the last day
        console.log('All days completed, showing completion message');
        toast.success('Congratulations! You completed all workouts for this week! 🎉');
        
        if (data.nextLevel) {
          toast.success(`You've reached ${data.nextLevel} level! 🏆`);
        }
        if (data.badges?.length > 0) {
          toast.success(`You earned ${data.badges.length} new badge(s)! 🌟`);
        }
        
        // Show prompt to start new week with updated stats
        toast((t) => (
          <div className="flex flex-col space-y-2">
            <p>Week completed! Would you like to start a new week with updated stats?</p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  // Clear the workout plan and completed workouts
                  setWorkoutPlan(null);
                  setCompletedWorkouts([]);
                  localStorage.removeItem('currentWorkoutPlan');
                  localStorage.removeItem('completedWorkouts');
                  // Reset form to allow updating stats
                  setFormData(prevData => ({
                    ...prevData,
                    weight: '', // Reset weight to allow updating
                  }));
                  toast.success('Ready to start a new week! Update your stats and generate a new plan.');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Start New Week
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/dashboard');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                View Dashboard
              </button>
            </div>
          </div>
        ), {
          duration: 0, // Don't auto-dismiss
          position: 'top-center',
        });
      } else if (nextIncompleteDayIndex >= 0) {
        // There's a next day to complete
        console.log('Setting current day index to:', nextIncompleteDayIndex);
        setCurrentDayIndex(nextIncompleteDayIndex);
        // Show progress message
        toast.success(`Day ${dayIndex + 1} completed! Moving to Day ${nextIncompleteDayIndex + 1}`);
        // Generate motivational message for the next day
        generateMotivationalMessage(nextIncompleteDayIndex);
      }

      // Update local storage
      localStorage.setItem('completedWorkouts', JSON.stringify(updatedCompletedWorkouts));

    } catch (error) {
      console.error('Error completing workout:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete workout');
    } finally {
      setCompletingWorkout(null);
    }
  };

  const generateMotivationalMessage = async (dayIndex: number) => {
    try {
      const response = await fetch('/api/generate-motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayIndex,
          totalDays: workoutPlan?.days.length,
          workoutType: workoutPlan?.days[dayIndex]?.focus || 'general training',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate motivational message');
      }

      const { message } = await response.json();
      const toastId = toast(
        (t) => (
          <div 
            onClick={() => toast.dismiss(t.id)}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <span role="img" aria-label="muscle">💪</span>
            <span>{message}</span>
          </div>
        ),
        {
          duration: 7500, // 7.5 seconds
          position: 'top-center',
          style: {
            background: '#10B981',
            color: '#FFFFFF',
            fontSize: '1.1rem',
            padding: '1rem',
            maxWidth: '500px',
          },
        }
      );
    } catch (error) {
      console.error('Error generating motivational message:', error);
    }
  };

  const isWorkoutCompleted = (dayIndex: number) => {
    if (!workoutPlan) return false;
    
    console.log(`Checking if day ${dayIndex} is completed:`, 
      completedWorkouts.some(workout => 
        workout.dayIndex === dayIndex && 
        workout.workoutPlanId === workoutPlan.id
      )
    );
    
    return completedWorkouts.some(workout => 
      workout.dayIndex === dayIndex && 
      workout.workoutPlanId === workoutPlan.id
    );
  };

  const handleInputChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
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
              Generate Your Workout Plan
            </h1>
            <Form
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              submitText="Generate Workout Plan"
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
                label="Height (cm)"
                type="number"
                name="height"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e)}
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

              <Select
                label="Goal"
                value={formData.goal}
                onChange={(value) => handleSelectChange('goal', value)}
                options={[
                  { value: 'general-fitness', label: 'General Fitness' },
                  { value: 'weight-loss', label: 'Weight Loss' },
                  { value: 'muscle-gain', label: 'Muscle Gain' },
                  { value: 'strength', label: 'Strength' }
                ]}
                required
                isLoading={isLoading}
              />

              <Select
                label="Fitness Level"
                value={formData.fitnessLevel}
                onChange={(value) => handleSelectChange('fitnessLevel', value)}
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                required
                isLoading={isLoading}
              />

              <Select
                label="Days per Week"
                value={formData.daysPerWeek}
                onChange={(value) => handleSelectChange('daysPerWeek', value)}
                options={[
                  { value: '3', label: '3 Days' },
                  { value: '4', label: '4 Days' },
                  { value: '5', label: '5 Days' },
                  { value: '6', label: '6 Days' }
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
                    <LoadingSpinner />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Creating Your Perfect Workout Plan
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This may take a minute. We're designing a personalized plan based on your goals and fitness level.
                    </p>
                  </div>
                </motion.div>
              ) : workoutPlan && workoutPlan.days && workoutPlan.days.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {workoutPlan.name || 'Your Workout Plan'}
                </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {workoutPlan.description || 'Personalized workout plan based on your goals and fitness level'}
                  </p>
                  
                  {/* Progress indicator */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress: {completedWorkouts.length} / {workoutPlan.days.length} days completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(completedWorkouts.length / workoutPlan.days.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                <div className="space-y-6">
                  {workoutPlan.days.map((day, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1,
                          y: 0
                        }}
                        className={`border rounded-lg p-6 ${
                          isWorkoutCompleted(index) 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                            : index === currentDayIndex
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                            : index > currentDayIndex
                            ? 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {day.name}
                      </h3>
                            <p className="text-sm text-gray-500">
                              Day {index + 1} of {workoutPlan.days.length}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isWorkoutCompleted(index) ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Completed
                              </span>
                            ) : index === currentDayIndex ? (
                              <button
                                onClick={() => handleCompleteWorkout(index)}
                                disabled={completingWorkout === index}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                {completingWorkout === index ? (
                                  <>
                                    <LoadingSpinner />
                                    <span>Completing...</span>
                                  </>
                                ) : (
                                  'Mark as Completed'
                                )}
                              </button>
                            ) : index > currentDayIndex ? (
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Complete previous day first
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          Focus: {day.focus}
                        </p>
                        
                        {/* Warmup section */}
                        {day.warmup && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                              Warm-up ({day.warmup.duration})
                            </h4>
                            <div className="space-y-2">
                              {day.warmup.exercises.map((exercise, idx) => (
                                <div key={idx} className="text-sm text-gray-600 dark:text-gray-300">
                                  <div>• {exercise.name} - {exercise.duration}</div>
                                  <div className="ml-4 text-xs">{exercise.description}</div>
                                  <div className="ml-4 text-xs text-gray-500">{exercise.purpose}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Main exercises */}
                      <div className="space-y-4">
                        {day.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exerciseIndex}
                              className={`rounded-lg p-4 ${
                                isWorkoutCompleted(index)
                                  ? 'bg-green-50 dark:bg-green-900/5'
                                  : index === currentDayIndex
                                  ? 'bg-blue-50 dark:bg-blue-900/5'
                                  : 'bg-gray-50 dark:bg-gray-700'
                              }`}
                          >
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {exercise.name}
                            </h4>
                              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                <p>Sets: {exercise.sets} × Reps: {exercise.reps}</p>
                                <p>Rest: {exercise.rest}</p>
                                <p>Difficulty: {exercise.difficulty}</p>
                                {exercise.notes && <p className="mt-1">{exercise.notes}</p>}
                              </div>
                              <div className="mt-2 space-y-1">
                                {exercise.equipment?.length > 0 && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Equipment: {exercise.equipment.join(', ')}
                                  </p>
                                )}
                                {exercise.muscles?.length > 0 && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Muscles: {exercise.muscles.join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="mt-3 text-sm">
                                <p className="font-medium text-gray-700 dark:text-gray-300">Setup:</p>
                                <p className="text-gray-600 dark:text-gray-400">{exercise.setup}</p>
                                <p className="font-medium text-gray-700 dark:text-gray-300 mt-2">Execution:</p>
                                <div className="ml-2">
                                  <p><strong>Starting Position:</strong> {exercise.execution.starting_position}</p>
                                  <p><strong>Movement:</strong> {exercise.execution.movement}</p>
                                  <p><strong>Breathing:</strong> {exercise.execution.breathing}</p>
                                  <p><strong>Tempo:</strong> {exercise.execution.tempo}</p>
                                  <div className="mt-1">
                                    <strong>Form Cues:</strong>
                                    <ul className="list-disc ml-4">
                                      {exercise.execution.form_cues.map((cue, cueIndex) => (
                                        <li key={cueIndex}>{cue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Cooldown section */}
                        {day.cooldown && (
                          <div className="mt-4">
                            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                              Cool-down ({day.cooldown.duration})
                            </h4>
                            <div className="space-y-2">
                              {day.cooldown.exercises.map((exercise, idx) => (
                                <div key={idx} className="text-sm text-gray-600 dark:text-gray-300">
                                  <div>• {exercise.name} - {exercise.duration}</div>
                                  <div className="ml-4 text-xs">{exercise.description}</div>
                                  <div className="ml-4 text-xs text-gray-500">{exercise.purpose}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                        )}

                        {day.notes && (
                          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                            <strong>Notes:</strong> {day.notes}
                          </div>
                        )}
                      </motion.div>
                  ))}
                </div>
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
                      'Fill out the form to generate your personalized workout plan'
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

function ExerciseCard({ exercise, day }: { exercise: Exercise; day: number }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{exercise.name}</h3>
          <p className="text-gray-600">
            {exercise.sets} sets × {exercise.reps} • Rest: {exercise.rest}
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-500 hover:text-blue-600"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-4">
          <ModelViewer 
            exerciseName={exercise.name} 
            className="mb-4"
          />
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Equipment Needed:</h4>
            <ul className="list-disc list-inside text-gray-600">
              {exercise.equipment.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Muscles Targeted:</h4>
            <ul className="list-disc list-inside text-gray-600">
              {exercise.muscles.map((muscle, index) => (
                <li key={index}>{muscle}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Setup:</h4>
            <p className="text-gray-600">{exercise.setup}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Execution:</h4>
            <div className="text-gray-600">
              <p><strong>Starting Position:</strong> {exercise.execution.starting_position}</p>
              <p><strong>Movement:</strong> {exercise.execution.movement}</p>
              <p><strong>Breathing:</strong> {exercise.execution.breathing}</p>
              <p><strong>Tempo:</strong> {exercise.execution.tempo}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Form Cues:</h4>
            <ul className="list-disc list-inside text-gray-600">
              {exercise.execution.form_cues.map((cue, index) => (
                <li key={index}>{cue}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Progression:</h4>
            <p className="text-gray-600"><strong>Next Steps:</strong> {exercise.progression.next_steps}</p>
            <div>
              <p className="font-medium text-gray-700">Variations:</p>
              <ul className="list-disc list-inside text-gray-600">
                {exercise.progression.variations.map((variation, index) => (
                  <li key={index}>{variation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 