import React from 'react';
import { Button } from './button';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  isLoading?: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitText?: string;
  error?: string | null;
  children: React.ReactNode;
}

export function Form({
  isLoading = false,
  onSubmit,
  submitText = 'Submit',
  error,
  children,
  className = '',
  ...props
}: FormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={`space-y-6 ${className}`}
      {...props}
    >
      {children}
      
      {error && (
        <div className="text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        {submitText}
      </Button>
    </form>
  );
} 