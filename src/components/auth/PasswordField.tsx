/**
 * PasswordField Component
 * Reusable password input field for React Hook Form with show/hide toggle
 */

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { FieldError } from "react-hook-form";

type PasswordFieldProps = {
  id?: string;
  error?: FieldError;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  showToggle?: boolean;
  "data-testid"?: string;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      id = "password",
      error,
      disabled = false,
      placeholder = "Wprowadź hasło",
      autoComplete = "current-password",
      showToggle = true,
      "data-testid": dataTestId,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`${showToggle ? "pr-10" : ""} ${error ? "border-red-500" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          data-testid={dataTestId}
          ref={ref}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
