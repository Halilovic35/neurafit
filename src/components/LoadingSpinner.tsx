import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
        <div className="animate-spin h-full w-full rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-gray-700 dark:border-t-indigo-400"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 