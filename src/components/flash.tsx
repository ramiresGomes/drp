export function Flash({ erro, ok }: { erro?: string; ok?: string }) {
  if (erro) {
    return (
      <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {erro}
      </p>
    );
  }
  if (ok) {
    return (
      <p className="mb-4 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2 text-sm text-foreground">
        Alteração registrada.
      </p>
    );
  }
  return null;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
