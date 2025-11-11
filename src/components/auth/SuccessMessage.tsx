/**
 * SuccessMessage Component
 * Reusable success state for auth forms
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SuccessMessageProps = {
  title: string;
  description: string;
  alertTitle: string;
  alertDescription: string;
  email?: string;
  actionText: string;
  actionHref: string;
};

export function SuccessMessage({
  title,
  description,
  alertTitle,
  alertDescription,
  email,
  actionText,
  actionHref,
}: SuccessMessageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{alertTitle}</AlertTitle>
          <AlertDescription>
            {alertDescription}
            {email && (
              <>
                {" "}
                <strong>{email}</strong>
              </>
            )}
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full">
          <a href={actionHref}>{actionText}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
