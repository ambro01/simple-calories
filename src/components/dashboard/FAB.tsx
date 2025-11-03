/**
 * FAB (Floating Action Button) Component
 *
 * Floating action button do dodawania posiłków.
 * Wyświetlany na mobile w prawym dolnym rogu.
 */

interface FABProps {
  onClick: () => void;
  ariaLabel?: string;
}

export function FAB({ onClick, ariaLabel = "Dodaj posiłek" }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-colors z-50 lg:hidden"
      aria-label={ariaLabel}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
