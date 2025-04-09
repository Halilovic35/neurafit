import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  isLoading?: boolean;
  label?: string;
  error?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', isLoading, label, error, options, onChange, disabled, value, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 
            disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 
            dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500
            ${className}
          `}
          disabled={isLoading || disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select'; 