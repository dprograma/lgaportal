"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500",
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                : "border-slate-200 hover:border-slate-300",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-slate-400 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface PasswordInputProps extends Omit<InputProps, "type"> {}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, leftIcon, containerClassName, id, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={show ? "text" : "password"}
            className={cn(
              "w-full h-11 rounded-lg border bg-white px-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500",
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                : "border-slate-200 hover:border-slate-300",
              leftIcon && "pl-10",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none"
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { Input, PasswordInput };
export default Input;
