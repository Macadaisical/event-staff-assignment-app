import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        error
          ? 'border-red-300 dark:border-red-600'
          : 'border-gray-300 dark:border-gray-600',
        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
        'placeholder-gray-500 dark:placeholder-gray-400',
        className
      )}
      {...props}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        error
          ? 'border-red-300 dark:border-red-600'
          : 'border-gray-300 dark:border-gray-600',
        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
        'placeholder-gray-500 dark:placeholder-gray-400',
        'resize-vertical min-h-[100px]',
        className
      )}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({ className, error, options, placeholder, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        error
          ? 'border-red-300 dark:border-red-600'
          : 'border-gray-300 dark:border-gray-600',
        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}