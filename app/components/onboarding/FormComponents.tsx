import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  helperText?: string;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  children,
  helperText,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block mb-2 text-sm font-bold text-[#1e3a8a] uppercase tracking-wide">
        {label}
        {required && <span className="ml-1 text-red-500 font-bold">*</span>}
      </label>
      <div className="relative">
        {children}
      </div>
      {error && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export function TextInput({
  error,
  label,
  required,
  ...props
}: TextInputProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <input
          {...props}
          className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
            error
              ? "border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-500"
              : "border-gray-300 dark:border-gray-700 bg-white hover:border-[#1e3a8a] focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
          }`}
        />
      </FormField>
    );
  }

  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
        error
          ? "border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-500"
          : "border-gray-300 dark:border-gray-700 bg-white hover:border-[#1e3a8a] focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
      }`}
    />
  );
}

interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectInput({
  error,
  label,
  required,
  options,
  placeholder,
  ...props
}: SelectInputProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <select
          {...props}
          className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none cursor-pointer text-gray-900 dark:text-white option:bg-[#1e3a8a] option:text-white ${
            error
              ? "border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-500"
              : "border-gray-300 dark:border-gray-700 bg-white hover:border-[#1e3a8a] focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,

            backgroundPosition: 'right 1rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
        >
          <option value="">{placeholder || "Select an option"}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {props.children}
        </select>
      </FormField>
    );
  }

  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none cursor-pointer text-gray-900 dark:text-white option:bg-[#1e3a8a] option:text-white ${
        error
          ? "border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-500"
          : "border-gray-300 dark:border-gray-700 bg-white hover:border-[#1e3a8a] focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 1rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem',
      }}
    >
      <option value="">{placeholder || "Select an option"}</option>
      {props.children}
    </select>
  );
}

interface CheckboxInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function CheckboxInput({ label, error, ...props }: CheckboxInputProps) {
  return (
    <div className="mb-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...props}
          className={`w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer accent-[#1e3a8a] ${
            error
              ? "border-red-400"
              : "border-gray-300 hover:border-[#1e3a8a]"
          }`}
        />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{label}</span>
      </label>
      {error && <p className="mt-1 ml-8 text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
}

interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
  fileName?: string;
}

export function FileInput({
  error,
  label,
  required,
  fileName,
  ...props
}: FileInputProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <div className="flex gap-3 items-center">
          <label className="px-6 py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white text-sm font-bold rounded-lg cursor-pointer transition-all duration-200 shadow hover:shadow-lg">
            📁 Choose File
            <input
              type="file"
              {...props}
              className="hidden"
            />
          </label>
          {fileName && (
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
              {fileName}
            </span>
          )}
        </div>
      </FormField>
    );
  }

  return (
    <div className="flex gap-3 items-center">
      <label className="px-6 py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white text-sm font-bold rounded-lg cursor-pointer transition-all duration-200 shadow hover:shadow-lg">
        📁 Choose File
        <input
          type="file"
          {...props}
          className="hidden"
        />
      </label>
      {fileName && (
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
          {fileName}
        </span>
      )}
    </div>
  );
}
