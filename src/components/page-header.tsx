import { Badge } from "@/components/ui/badge";

export function PageHeader({
  kicker,
  title,
  description,
  badge,
}: {
  kicker?: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <header className="mb-10 max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {kicker ? (
          <p className="text-xs tracking-[0.22em] text-primary uppercase">{kicker}</p>
        ) : null}
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </div>
      <h1 className="text-4xl leading-tight text-balance sm:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
    </header>
  );
}
