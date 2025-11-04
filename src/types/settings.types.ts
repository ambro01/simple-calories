/**
 * Type Definitions for Settings View
 *
 * This file contains all TypeScript type definitions for the Settings feature,
 * including ViewModels, component props, and form data types.
 */

import type { ProfileResponseDTO, CalorieGoalResponseDTO } from "../types";

// ============================================================================
// VIEW MODELS
// ============================================================================

/**
 * Model widoku dla strony Settings
 * Zawiera wszystkie dane wyświetlane na stronie oraz stany UI
 */
export interface SettingsViewModel {
  // Dane użytkownika
  profile: ProfileResponseDTO | null;
  currentGoal: CalorieGoalResponseDTO | null;
  userEmail: string | null; // Z Supabase Auth (auth.getUser())

  // Stany UI
  isLoading: boolean; // Ładowanie początkowe danych
  error: string | null; // Ogólny błąd strony
  showEditGoalDialog: boolean; // Widoczność dialogu edycji celu
  showChangePasswordDialog: boolean; // Widoczność dialogu zmiany hasła
  showLogoutDialog: boolean; // Widoczność dialogu wylogowania
}

/**
 * Model widoku dla dialogu edycji celu kalorycznego
 * Zawiera stan formularza i walidacji
 */
export interface EditCalorieGoalViewModel {
  goalValue: string; // Wartość w polu input (jako string dla kontroli)
  isSaving: boolean; // Stan zapisywania (loading)
  validationError: string | null; // Błąd walidacji po stronie klienta
  apiError: string | null; // Błąd z API
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props dla komponentu SettingsCard
 * Reprezentuje pojedynczą kartę opcji w ustawieniach
 */
export interface SettingsCardProps {
  title: string; // Tytuł karty, np. "Cel kaloryczny"
  subtitle?: string; // Podtytuł, np. "Aktualnie: 2500 kcal"
  icon?: React.ReactNode; // Ikona po lewej stronie
  onClick?: () => void; // Handler kliknięcia
  variant?: "default" | "destructive"; // Wariant stylistyczny
  showChevron?: boolean; // Czy pokazywać strzałkę (domyślnie true jeśli onClick)
}

/**
 * Props dla komponentu EditCalorieGoalDialog
 */
export interface EditCalorieGoalDialogProps {
  open: boolean; // Czy dialog jest otwarty
  onOpenChange: (open: boolean) => void; // Handler zmiany stanu otwarcia
  currentGoal: CalorieGoalResponseDTO | null; // Aktualny cel (do wyświetlenia)
  onSuccess: () => void; // Callback po udanym zapisie (do odświeżenia danych)
}

/**
 * Props dla komponentu LogoutAlertDialog
 */
export interface LogoutAlertDialogProps {
  open: boolean; // Czy dialog jest otwarty
  onOpenChange: (open: boolean) => void; // Handler zmiany stanu otwarcia
  onConfirm: () => Promise<void>; // Handler potwierdzenia wylogowania
}

// ============================================================================
// FORM DATA
// ============================================================================

/**
 * Dane formularza edycji celu kalorycznego (po walidacji)
 */
export interface CalorieGoalFormData {
  daily_goal: number; // Wartość celu (zwalidowana, 1-10000)
}

/**
 * Model widoku dla dialogu zmiany hasła
 * Zawiera stan formularza i walidacji
 */
export interface ChangePasswordViewModel {
  currentPassword: string; // Aktualne hasło
  newPassword: string; // Nowe hasło
  isSaving: boolean; // Stan zapisywania (loading)
  validationError: string | null; // Błąd walidacji po stronie klienta
  apiError: string | null; // Błąd z API
}

/**
 * Props dla komponentu ChangePasswordDialog
 */
export interface ChangePasswordDialogProps {
  open: boolean; // Czy dialog jest otwarty
  onOpenChange: (open: boolean) => void; // Handler zmiany stanu otwarcia
  onSuccess: () => void; // Callback po udanej zmianie hasła
}
