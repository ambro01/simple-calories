/**
 * EmailField Component
 * Reusable email input field for React Hook Form
 */

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import type { FieldError } from "react-hook-form";

type EmailFieldProps = {
  id?: string;
  error?: FieldError;
  disabled?: boolean;
  placeholder?: string;
  "data-testid"?: string;
};

export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(
  (
    { id = "email", error, disabled = false, placeholder = "jan@example.com", "data-testid": dataTestId, ...props },
    ref
  ) => {
    return (
      <Input
        id={id}
        type="email"
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "border-red-500" : ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="email"
        data-testid={dataTestId}
        ref={ref}
        {...props}
      />
    );
  }
);

EmailField.displayName = "EmailField";
