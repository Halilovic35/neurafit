'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface DashboardContentProps {
  workouts: any[];
  mealPlans: any[];
  workoutHistory: any[];
  userData: {
    currentLevel: string;
    weeksCompleted: number;
    badges: any[];
  };
}

export default function DashboardContent({ workouts, mealPlans, workoutHistory, userData }: DashboardContentProps) {
  const router = useRouter();

  const handleResetData = async () => {
    try {
      const response = await fetch('/api/workouts/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reset data');
      }

      toast.success('All workout data has been reset');
      router.refresh();
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Failed to reset data');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleResetData}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Reset Data
        </button>
      </div>
      
      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-indigo-700 dark:text-indigo-300">Current Level</h3>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{userData?.currentLevel || 'Beginner'}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-700 dark:text-green-300">Weeks Completed</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{userData?.weeksCompleted || 0}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300">Badges Earned</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userData?.badges.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Workouts</h2>
          <div className="space-y-4">
            {workoutHistory.map((history) => (
              <div key={history.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-xl font-medium">{history.workoutPlanName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Started: {new Date(history.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Status: {history.status}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Completed: {history.completedWorkouts.length} workouts
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Meal Plans</h2>
          <div className="space-y-4">
            {mealPlans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-xl font-medium">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-300">{plan.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {plan.meals.length} meals
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 