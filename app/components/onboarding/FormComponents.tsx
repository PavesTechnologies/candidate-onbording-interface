import React from "react";

/* ── Shared input styles ── */
const INPUT_BASE = `
  w-full px-3.5 py-2.5 text-sm text-slate-800
  bg-white border border-slate-200 rounded-xl
  placeholder-slate-400
  transition-all duration-150
  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400
  hover:border-slate-300
`;

const INPUT_ERROR = `
  border-red-300 bg-red-50/40
  focus:ring-red-400/30 focus:border-red-400
  hover:border-red-300
`;

/* ── FormField wrapper ── */
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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <div className="relative">{children}</div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeOpacity="0.4" />
            <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
}

/* ── TextInput ── */
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export function TextInput({ error, label, required, className = "", ...props }: TextInputProps & { className?: string }) {
  const cls = `${INPUT_BASE} ${error ? INPUT_ERROR : ""} ${className}`;

  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <input {...props} className={cls} />
      </FormField>
    );
  }
  return <input {...props} className={cls} />;
}

/* ── SelectInput ── */
interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const SELECT_ARROW = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 6l4 4 4-4'/%3e%3c/svg%3e")`;

export function SelectInput({
  error,
  label,
  required,
  options,
  placeholder,
  className = "",
  ...props
}: SelectInputProps & { className?: string }) {
  const cls = `${INPUT_BASE} ${error ? INPUT_ERROR : ""} appearance-none cursor-pointer pr-10 ${className}`;
  const style = {
    backgroundImage: SELECT_ARROW,
    backgroundPosition: "right 0.875rem center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1.1em 1.1em",
    paddingRight: "2.5rem",
  };

  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        <select {...props} className={cls} style={style}>
          <option value="">{placeholder || "Select an option"}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {props.children}
        </select>
      </FormField>
    );
  }

  return (
    <select {...props} className={cls} style={style}>
      <option value="">{placeholder || "Select an option"}</option>
      {props.children}
    </select>
  );
}

/* ── CheckboxInput ── */
interface CheckboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function CheckboxInput({ label, error, ...props }: CheckboxInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          {...props}
          className={`w-4 h-4 rounded border-2 transition-colors duration-150 cursor-pointer
            accent-indigo-500
            ${error ? "border-red-300" : "border-slate-300 hover:border-indigo-400"}`}
        />
        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
          {label}
        </span>
      </label>
      {error && (
        <p className="ml-6 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

/* ── FileInput ── */
interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
  fileName?: string;
}

export function FileInput({ error, label, required, fileName, ...props }: FileInputProps) {
  const inner = (
    <div className="flex items-center gap-3 flex-wrap">
      <label className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
        cursor-pointer select-none transition-all duration-150
        bg-indigo-50 text-indigo-700 border border-indigo-200
        hover:bg-indigo-100 hover:border-indigo-300
        active:scale-95
        ${error ? "border-red-300 bg-red-50 text-red-600" : ""}
      `}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 10v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2M8 1v9M4.5 4.5L8 1l3.5 3.5" />
        </svg>
        {fileName ? "Change File" : "Upload File"}
        <input type="file" {...props} className="hidden" />
      </label>

      {fileName && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl max-w-xs">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#6366f1"
            strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1z" />
            <path d="M9 1v4h4" />
          </svg>
          <span className="text-xs text-slate-600 font-medium truncate max-w-40">
            {fileName}
          </span>
        </div>
      )}
    </div>
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        {inner}
      </FormField>
    );
  }
  return inner;
}
