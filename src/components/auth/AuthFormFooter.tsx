/**
 * AuthFormFooter Component
 *
 * Reużywalny footer dla formularzy autentykacyjnych z linkami.
 */

interface AuthFormFooterProps {
  text: string;
  linkText: string;
  linkHref: string;
}

export function AuthFormFooter({ text, linkText, linkHref }: AuthFormFooterProps) {
  return (
    <div className="mt-6 text-center text-sm">
      <span className="text-muted-foreground">{text} </span>
      <a
        href={linkHref}
        className="text-primary hover:underline font-medium"
      >
        {linkText}
      </a>
    </div>
  );
}
