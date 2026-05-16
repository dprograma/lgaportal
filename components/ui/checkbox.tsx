"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, containerClassName, id, checked, ...props }, ref) => {
    const inputId = id ?? (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={cn("flex flex-col gap-1", containerClassName)}>
        <label
          htmlFor={inputId}
          className="flex items-start gap-2.5 cursor-pointer group"
        >
          <div className="relative shrink-0 mt-0.5">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              checked={checked}
              className="h-4 w-4 rounded border-2 border-slate-300 bg-white appearance-none cursor-pointer transition-all duration-150 checked:bg-green-600 checked:border-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30 focus-visible:ring-offset-1 hover:border-green-500"
              style={{
                backgroundImage: checked
                  ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`
                  : undefined,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
              {...props}
            />
          </div>
          {label && (
            <span className="text-sm text-slate-600 leading-relaxed select-none">
              {label}
            </span>
          )}
        </label>
        {error && <p className="text-xs text-red-500 ml-6">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
export default Checkbox;
