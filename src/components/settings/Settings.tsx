/**
 * Settings Component
 *
 * Główny komponent widoku Ustawień.
 * Wyświetla opcje zarządzania celem kalorycznym, informacje o koncie i wylogowanie.
 * Obsługuje stany: loading, error, success.
 */

import { Target, LogOut, Loader2, AlertCircle, Moon, Sun, KeyRound } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { SettingsCard } from "./SettingsCard";
import { EditCalorieGoalDialog } from "./EditCalorieGoalDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { LogoutAlertDialog } from "./LogoutAlertDialog";
import { Separator } from "@/components/ui/separator";

export function Settings() {
  const settings = useSettings();
  const { theme, toggleTheme } = useTheme();

  /**
   * Obsługa sukcesu zapisania celu
   * Odświeża dane i zamyka dialog
   */
  const handleGoalSuccess = async () => {
    await settings.refreshData();
  };

  /**
   * Obsługa sukcesu zmiany hasła
   * Zamyka dialog (nie trzeba odświeżać danych)
   */
  const handlePasswordChangeSuccess = () => {
    // Pokazujemy sukces użytkownikowi (opcjonalnie można dodać toast)
    console.log("Password changed successfully");
  };

  // Loading initial state
  if (settings.state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Ładowanie ustawień...</p>
      </div>
    );
  }

  // Error state
  if (settings.state.error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Wystąpił błąd</h2>
        <p className="text-muted-foreground max-w-sm mb-4">{settings.state.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Odśwież stronę
        </button>
      </div>
    );
  }

  // Dane do wyświetlenia
  const currentGoalDisplay = settings.state.currentGoal
    ? `${settings.state.currentGoal.daily_goal} kcal`
    : "Nie ustawiono";

  const userEmailDisplay = settings.state.userEmail || "Brak danych";

  return (
    <>
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center gap-4">
            {/* Left side: Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">Ustawienia</h1>
            </div>

            {/* Right side: Email and Back button */}
            <div className="flex items-center gap-4">
              <p className="text-base font-medium text-foreground truncate max-w-[200px] sm:max-w-none">{userEmailDisplay}</p>
              <a
                href="/"
                className="flex-shrink-0 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                aria-label="Powrót do dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Powrót</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {/* Sekcja: Cele */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Cele</h2>
            <SettingsCard
              title="Cel kaloryczny"
              subtitle={`Aktualnie: ${currentGoalDisplay}`}
              icon={<Target className="h-5 w-5" />}
              onClick={settings.openEditGoalDialog}
            />
          </section>

          <Separator />

          {/* Sekcja: Konto */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Konto</h2>
            <div className="space-y-3">
              {/* Theme card */}
              <SettingsCard
                title="Motyw aplikacji"
                subtitle={theme === "light" ? "Jasny" : "Ciemny"}
                icon={theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                onClick={toggleTheme}
              />

              {/* Change Password card */}
              <SettingsCard
                title="Zmiana hasła"
                subtitle="Zmień swoje hasło"
                icon={<KeyRound className="h-5 w-5" />}
                onClick={settings.openChangePasswordDialog}
              />

              {/* Logout card */}
              <SettingsCard
                title="Wyloguj się"
                subtitle="Zakończ sesję w aplikacji"
                icon={<LogOut className="h-5 w-5" />}
                onClick={settings.openLogoutDialog}
                variant="destructive"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Edit Calorie Goal Dialog */}
      <EditCalorieGoalDialog
        open={settings.state.showEditGoalDialog}
        onOpenChange={settings.closeEditGoalDialog}
        currentGoal={settings.state.currentGoal}
        onSuccess={handleGoalSuccess}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={settings.state.showChangePasswordDialog}
        onOpenChange={settings.closeChangePasswordDialog}
        onSuccess={handlePasswordChangeSuccess}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutAlertDialog
        open={settings.state.showLogoutDialog}
        onOpenChange={settings.closeLogoutDialog}
        onConfirm={settings.logout}
      />
    </>
  );
}
