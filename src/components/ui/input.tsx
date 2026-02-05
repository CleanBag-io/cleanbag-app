import { forwardRef, type InputHTMLAttributes } from "react";
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

export { Input, Textarea, Select, Label, InputHint, InputError };
