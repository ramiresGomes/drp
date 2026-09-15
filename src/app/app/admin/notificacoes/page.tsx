import { createNotification } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { areaClass, controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { AUDIENCE_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const notifications = await prisma.notification.findMany({
    include: { receipts: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AdminNav current="/app/admin/notificacoes" />
      <h1 className="mb-2 font-heading text-3xl">Avisos internos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Só há canal interno. O público é congelado no envio. Preferências não desligam aviso obrigatório. Ciência e
        confirmação ficam registradas.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Novo aviso</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNotification} className="grid gap-3">
            <Field label="Título">
              <input className={controlClass} name="title" required />
            </Field>
            <Field label="Texto">
              <textarea className={areaClass} name="body" required />
            </Field>
            <Field label="Público">
              <select className={controlClass} name="audience" defaultValue="todos">
                {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Agendar (opcional)">
              <input className={controlClass} type="datetime-local" name="scheduledAt" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="mandatory" /> Aviso obrigatório
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requiresAck" /> Exigir ciência
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requiresConfirm" /> Exigir confirmação
            </label>
            <Button type="submit">Enviar aviso</Button>
          </form>
        </CardContent>
      </Card>

      {notifications.length === 0 ? (
        <EmptyState title="Nenhum aviso" description="Publique o primeiro comunicado da regional." />
      ) : (
        <div className="grid gap-3">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {AUDIENCE_LABELS[item.audience] ?? item.audience} · {formatDateTime(item.createdAt)} ·{" "}
                {item.receipts.filter((receipt) => receipt.scienceAt).length} ciência ·{" "}
                {item.receipts.filter((receipt) => receipt.confirmedAt).length} confirmação
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
