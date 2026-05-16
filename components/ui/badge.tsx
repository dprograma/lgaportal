import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, { wrapper: string; dot: string }> = {
  success: {
    wrapper: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  warning: {
    wrapper: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  error: {
    wrapper: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  info: {
    wrapper: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  neutral: {
    wrapper: "bg-slate-100 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
  },
};

export function Badge({
  variant = "neutral",
  dot = true,
  className,
  children,
  ...props
}: BadgeProps) {
  const { wrapper, dot: dotColor } = variantClasses[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        wrapper,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
      )}
      {children}
    </span>
  );
}

export default Badge;
