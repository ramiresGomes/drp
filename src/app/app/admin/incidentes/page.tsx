import { closeIncident, createIncident } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { areaClass, controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { INCIDENT_STATUS_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const flash = await searchParams;
  const incidents = await prisma.incident.findMany({
    include: { createdBy: true, closedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AdminNav current="/app/admin/incidentes" />
      <h1 className="mb-2 font-heading text-3xl">Incidentes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Secretaria e jurídico registram aqui o acompanhamento de incidentes e correções indevidas. Não substitui a
        auditoria.
      </p>
      <Flash erro={flash.erro} ok={flash.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Novo incidente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createIncident} className="grid gap-3">
            <Field label="Título">
              <input className={controlClass} name="title" required />
            </Field>
            <Field label="Relato">
              <textarea className={areaClass} name="details" required />
            </Field>
            <Button type="submit">Registrar</Button>
          </form>
        </CardContent>
      </Card>

      {incidents.length === 0 ? (
        <EmptyState title="Nenhum incidente" description="Quando houver um relato, ele entra nesta fila." />
      ) : (
        <div className="grid gap-3">
          {incidents.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">
                {item.title} · {INCIDENT_STATUS_LABELS[item.status] ?? item.status}
              </p>
              <p className="mt-1 text-sm">{item.details}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Aberto por {item.createdBy.name} em {formatDateTime(item.createdAt)}
                {item.closedBy && item.closedAt ? ` · encerrado por ${item.closedBy.name} em ${formatDateTime(item.closedAt)}` : ""}
              </p>
              {item.status === "OPEN" ? (
                <form action={closeIncident} className="mt-3">
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="outline">
                    Encerrar
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
