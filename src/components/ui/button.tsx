import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",

          // Variants
          variant === "primary" && [
            "bg-brand-pink text-white shadow-sm",
            "hover:bg-brand-pink-hover hover:shadow-md hover:-translate-y-px",
            "active:translate-y-0 active:shadow-sm",
            "focus:ring-brand-pink",
          ],
          variant === "secondary" && [
            "bg-white text-gray-700 border-2 border-gray-300",
            "hover:border-gray-400 hover:shadow-sm",
            "focus:ring-gray-300",
          ],
          variant === "tertiary" && [
            "bg-transparent text-trust-blue",
            "hover:bg-trust-blue-light",
            "focus:ring-trust-blue",
          ],
          variant === "danger" && [
            "bg-status-overdue text-white",
            "hover:bg-red-600",
            "focus:ring-red-500",
          ],

          // Sizes
          size === "sm" && "px-4 py-2 text-sm min-h-9",
          size === "md" && "px-6 py-3 text-base min-h-11",
          size === "lg" && "px-8 py-4 text-lg min-h-13",

          // Full width
          fullWidth && "w-full",

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
