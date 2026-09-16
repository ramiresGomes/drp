import { moderateOccurrencePhoto } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const flash = await searchParams;
  const pending = await prisma.occurrence.findMany({
    where: { photoUrl: { not: null }, photoApproved: false, cancelled: false },
    include: { series: { include: { institution: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <AdminNav current="/app/admin/moderacao" />
      <h1 className="mb-2 font-heading text-3xl">Moderação de arquivos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Foto ou PDF do atendimento só fica visível depois desta aprovação. Recusar remove o arquivo.
      </p>
      <Flash erro={flash.erro} ok={flash.ok} />
      {pending.length === 0 ? (
        <EmptyState title="Fila vazia" description="Nenhum arquivo aguardando moderação." />
      ) : (
        <div className="grid gap-3">
          {pending.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{item.series.institution.name}</p>
              <p className="text-sm text-muted-foreground">{formatDay(item.date)}</p>
              {item.photoUrl ? (
                <a className="mt-2 inline-block text-sm underline-offset-4 hover:underline" href={item.photoUrl}>
                  Abrir arquivo enviado
                </a>
              ) : null}
              <div className="mt-3 flex gap-2">
                <form action={moderateOccurrencePhoto}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <Button type="submit">Aprovar</Button>
                </form>
                <form action={moderateOccurrencePhoto}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Button type="submit" variant="outline">
                    Recusar
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
