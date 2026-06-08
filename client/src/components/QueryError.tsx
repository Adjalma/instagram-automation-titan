import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function QueryError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 p-6 text-center">
      <AlertCircle className="h-10 w-10 text-destructive opacity-80" />
      <p className="text-sm font-medium">Não foi possível carregar os dados</p>
      <p className="text-xs text-muted-foreground max-w-md">
        {message ?? "O servidor demorou para responder. Tente novamente em alguns segundos."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
