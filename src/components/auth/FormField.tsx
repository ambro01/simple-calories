/**
 * FormField Component
 * Wrapper for React Hook Form fields with consistent error handling
 */

import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: FieldError;
  children: ReactNode;
  required?: boolean;
};

export function FormField({ label, htmlFor, error, children, required = false }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-red-500 mt-1" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
