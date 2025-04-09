import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isLoading?: boolean;
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', isLoading, label, error, disabled, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 
            disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 
            dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500
            ${className}
          `}
          disabled={isLoading || disabled}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 