"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
      <p className="font-medium">Não foi possível concluir esta ação.</p>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-3" type="button" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  );
}
