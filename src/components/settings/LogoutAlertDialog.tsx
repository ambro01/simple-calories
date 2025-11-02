/**
 * LogoutAlertDialog Component
 *
 * Alert dialog do potwierdzenia wylogowania użytkownika.
 * Wyświetla komunikat ostrzegawczy i wymaga potwierdzenia akcji.
 */

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { LogoutAlertDialogProps } from "@/types/settings.types";

export function LogoutAlertDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutAlertDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Obsługa potwierdzenia wylogowania
   */
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();

    setIsLoggingOut(true);

    try {
      await onConfirm();
      // Po udanym wylogowaniu użytkownik zostanie przekierowany
      // więc nie ma potrzeby resetowania stanu
    } catch (error) {
      console.error("Logout error in dialog:", error);
      // W przypadku błędu funkcja onConfirm i tak przekierowuje,
      // więc ten catch jest głównie dla logowania
      setIsLoggingOut(false);
    }
  };

  /**
   * Obsługa zamknięcia dialogu
   */
  const handleOpenChange = (isOpen: boolean) => {
    // Zablokuj zamknięcie podczas wylogowywania
    if (!isOpen && isLoggingOut) {
      return;
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Wyloguj się
          </AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz się wylogować? Zostaniesz przekierowany na stronę
            logowania.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoggingOut && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
