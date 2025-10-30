/**
 * FormActions Component
 *
 * Footer section with form action buttons:
 * - Cancel button (ghost variant)
 * - Submit button (default variant) with loading state
 *
 * @component
 * @example
 * <FormActions
 *   onCancel={() => closeModal()}
 *   onSubmit={() => handleSubmit()}
 *   submitDisabled={!isValid}
 *   submitLoading={isSubmitting}
 * />
 */

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { FormActionsProps } from '../../types/add-meal.types';

export function FormActions({
  onCancel,
  onSubmit,
  submitDisabled,
  submitLoading,
}: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={submitLoading}>
        Anuluj
      </Button>
      <Button type="button" onClick={onSubmit} disabled={submitDisabled || submitLoading}>
        {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Dodaj posiłek
      </Button>
    </div>
  );
}
