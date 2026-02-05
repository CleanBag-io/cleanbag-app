import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "inactive"
    | "completed"
    | "pending"
    | "in-progress"
    | "overdue"
    | "cancelled";
  withDot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "inactive", withDot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",

          // Variants
          (variant === "success" || variant === "completed") &&
            "bg-brand-pink-light text-brand-pink-dark",
          (variant === "warning" || variant === "pending") &&
            "bg-amber-100 text-amber-700",
          (variant === "info" || variant === "in-progress") &&
            "bg-trust-blue-light text-trust-blue-dark",
          (variant === "error" || variant === "overdue") &&
            "bg-red-100 text-red-700",
          (variant === "inactive" || variant === "cancelled") &&
            "bg-gray-100 text-gray-600",

          className
        )}
        {...props}
      >
        {withDot && (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
