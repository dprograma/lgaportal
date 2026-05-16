"use client";

import { forwardRef, ButtonHTMLAttributes, cloneElement, isValidElement, Children } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  /** Render button styles on the child element (e.g. Next.js Link) */
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white shadow-sm hover:shadow-md",
  outline:
    "border border-green-600 text-green-700 bg-white hover:bg-green-50 hover:border-green-700",
  ghost:
    "bg-transparent text-green-700 hover:bg-green-50 hover:text-green-800",
  danger:
    "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-sm hover:shadow-md",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const computedClass = cn(
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none",
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && "w-full",
      className
    );

    const content = (
      <>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    );

    if (asChild && isValidElement(children)) {
      const child = Children.only(children) as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
        [key: string]: unknown;
      }>;
      return cloneElement(child, {
        ...props,
        className: cn(computedClass, child.props.className),
        children: (
          <>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : leftIcon ? (
              <span className="shrink-0">{leftIcon}</span>
            ) : null}
            {child.props.children}
            {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        ),
      });
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={computedClass}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export default Button;
