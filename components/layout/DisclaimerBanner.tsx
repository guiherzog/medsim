import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DisclaimerBanner({ disclaimer }: { disclaimer: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{disclaimer}</AlertDescription>
    </Alert>
  );
}
