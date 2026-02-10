import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Base styles
          "w-full px-4 py-3 text-base text-gray-900 bg-white",
          "border-2 rounded-lg transition-all min-h-11",
          "placeholder:text-gray-400",

          // Focus styles
          "focus:outline-none focus:border-trust-blue focus:ring-2 focus:ring-trust-blue-light",

          // Disabled styles
          "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500",

          // Error styles
          error
            ? "border-status-overdue focus:border-status-overdue focus:ring-red-100"
            : "border-gray-200",

          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Base styles
          "w-full px-4 py-3 text-base text-gray-900 bg-white",
          "border-2 rounded-lg transition-all min-h-24 resize-y",
          "placeholder:text-gray-400",

          // Focus styles
          "focus:outline-none focus:border-trust-blue focus:ring-2 focus:ring-trust-blue-light",

          // Disabled styles
          "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500",

          // Error styles
          error
            ? "border-status-overdue focus:border-status-overdue focus:ring-red-100"
            : "border-gray-200",

          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          // Base styles
          "w-full px-4 py-3 text-base text-gray-900 bg-white",
          "border-2 rounded-lg transition-all min-h-11",
          "appearance-none cursor-pointer",
          "bg-no-repeat bg-[length:20px] bg-[position:right_12px_center]",
          "bg-[url('data:image/svg+xml,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3e%3cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3e%3c%2Fsvg%3e')]",
          "pr-10",

          // Focus styles
          "focus:outline-none focus:border-trust-blue focus:ring-2 focus:ring-trust-blue-light",

          // Disabled styles
          "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500",

          // Error styles
          error
            ? "border-status-overdue focus:border-status-overdue focus:ring-red-100"
            : "border-gray-200",

          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-medium text-gray-900 mb-2",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-status-overdue ml-0.5">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";

const InputHint = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-xs text-gray-500 mt-1", className)}
      {...props}
    />
  );
});

InputHint.displayName = "InputHint";

const InputError = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-xs text-status-overdue mt-1 flex items-center gap-1",
        className
      )}
      {...props}
    />
  );
});

InputError.displayName = "InputError";

import type { HTMLAttributes } from "react";

export { Input, PasswordInput, Textarea, Select, Label, InputHint, InputError };
