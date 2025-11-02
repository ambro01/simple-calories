/**
 * Type definitions for AddMeal view components
 *
 * This file contains all ViewModel types used by the AddMeal feature,
 * including form state, validation errors, and UI-specific types.
 */

import type {
  AIGenerationResponseDTO,
  CreateMealResponseDTO,
  MealCategory,
} from '../types';

/**
 * Tryb formularza dodawania posiłku
 */
export type MealFormMode = 'ai' | 'manual';

/**
 * Tryb edycji formularza
 */
export type MealFormEditMode = 'create' | 'edit';

/**
 * Etap ładowania AI (0-2)
 * 0: "Analizuję opis..."
 * 1: "Szacuję kalorie..."
 * 2: "Obliczam makroskładniki..."
 */
export type AILoadingStage = 0 | 1 | 2;

/**
 * Informacje o ostrzeżeniu dotyczącym rozbieżności makroskładników
 */
export interface MacroWarningInfo {
  visible: boolean;
  calculatedCalories: number;
  providedCalories: number;
  differencePercent: number;
}

/**
 * Błąd walidacji formularza
 */
export interface FormValidationError {
  field: string;
  message: string;
}

/**
 * Ostrzeżenie dotyczące daty
 */
export interface DateValidationWarning {
  type: 'future' | 'old';
  message: string;
}

/**
 * Stan formularza dodawania posiłku
 * Centralna struktura danych używana przez hook useAddMealForm
 */
export interface MealFormState {
  // Tryb formularza
  mode: MealFormMode;
  editMode: MealFormEditMode;
  editingMealId: string | null;

  // Dane formularza
  description: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null; // Uwaga: API nie wspiera fiber w MVP
  category: MealCategory | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM

  // Stan AI
  aiPrompt: string;
  aiGenerationId: string | null;
  aiResult: AIGenerationResponseDTO | null;
  aiLoading: boolean;
  aiLoadingStage: AILoadingStage;
  aiError: string | null;

  // Stan submitu
  submitLoading: boolean;
  submitError: string | null;

  // Stan ładowania danych posiłku do edycji
  loadingMeal: boolean;
  loadMealError: string | null;

  // Walidacja i ostrzeżenia
  validationErrors: FormValidationError[];
  macroWarning: MacroWarningInfo | null;
  dateWarning: DateValidationWarning | null;
}

/**
 * Rezultat generacji AI do użycia w UI
 * Zawiera dane wymagane do prepopulacji formularza
 */
export interface AIGenerationResult {
  id: string;
  prompt: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  assumptions: string | null;
  status: 'completed' | 'failed';
  errorMessage: string | null;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Props dla AddMealModal
 */
export interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meal: CreateMealResponseDTO) => void;
  mealId?: string; // Jeśli podane, modal działa w trybie edycji
  initialDate?: string; // YYYY-MM-DD - jeśli podane, formularz zostanie zainicjalizowany tą datą
}

/**
 * Props dla MealForm
 */
export interface MealFormProps {
  onClose: () => void;
  onSuccess: (meal: CreateMealResponseDTO) => void;
  mealId?: string; // Jeśli podane, formularz działa w trybie edycji
  initialDate?: string; // YYYY-MM-DD - jeśli podane, formularz zostanie zainicjalizowany tą datą
}

/**
 * Props dla SegmentedControl
 */
export interface SegmentedControlProps {
  value: MealFormMode;
  onChange: (value: MealFormMode) => void;
  disabled?: boolean;
}

/**
 * Props dla AIMode
 */
export interface AIModeProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  aiResult: AIGenerationResponseDTO | null;
  aiLoading: boolean;
  aiLoadingStage: AILoadingStage;
  aiError: string | null;
  onGenerate: () => Promise<void>;
  onAcceptResult: () => void;
  onRegenerate: () => Promise<void>;
  onSwitchToManual: () => void;
}

/**
 * Props dla ExampleChips
 */
export interface ExampleChipsProps {
  examples: string[];
  onSelect: (example: string) => void;
  disabled?: boolean;
}

/**
 * Props dla LoadingState
 */
export interface LoadingStateProps {
  stage: AILoadingStage;
}

/**
 * Props dla AIResult
 */
export interface AIResultProps {
  result: AIGenerationResponseDTO;
  onAccept: () => void;
  onRegenerate: () => Promise<void>;
  onEditManually: () => void;
  regenerateLoading?: boolean;
}

/**
 * Props dla ManualMode
 */
export interface ManualModeProps {
  description: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  macroWarning: MacroWarningInfo | null;
  onFieldChange: (field: string, value: unknown) => void;
  onAutoCalculate: () => void;
  validationErrors: FormValidationError[];
}

/**
 * Props dla MacroInputs
 */
export interface MacroInputsProps {
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  onChange: (field: 'protein' | 'carbs' | 'fats' | 'fiber', value: number | null) => void;
  errors?: Record<string, string>;
}

/**
 * Props dla MacroWarning
 */
export interface MacroWarningProps {
  calculatedCalories: number;
  providedCalories: number;
  differencePercent: number;
  onAutoCalculate: () => void;
}

/**
 * Props dla CommonFields
 */
export interface CommonFieldsProps {
  category: MealCategory | null;
  date: string;
  time: string;
  dateWarning: DateValidationWarning | null;
  onCategoryChange: (category: MealCategory | null) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

/**
 * Props dla CategorySelector
 */
export interface CategorySelectorProps {
  value: MealCategory | null;
  onChange: (value: MealCategory | null) => void;
}

/**
 * Props dla FormActions
 */
export interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitLoading: boolean;
  editMode?: MealFormEditMode; // Określa tekst przycisku
}

/**
 * Props dla CharacterCounter
 */
export interface CharacterCounterProps {
  current: number;
  max: number;
}
