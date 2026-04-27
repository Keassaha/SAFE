import type { InputHTMLAttributes, forwardRef } from "react";
import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  error, 
  className = "", 
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-medium text-slate-700 mb-[6px] font-sans">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-[38px] px-[12px] rounded-md font-sans text-[14px]",
          "bg-white border text-slate-800 placeholder:text-slate-500",
          "focus-visible:outline-none focus:border-forest-700 focus:shadow-focus transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-danger text-danger focus:border-danger focus:shadow-none" : "border-slate-300",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-[6px] flex items-center text-[12px] text-danger font-sans">
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});
Input.displayName = "Input";
