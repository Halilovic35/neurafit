export default function DashboardLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Workouts Loading Skeleton */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border dark:border-gray-700 rounded-lg p-4"
              >
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>

        {/* Meal Plans Loading Skeleton */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border dark:border-gray-700 rounded-lg p-4"
              >
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
} 