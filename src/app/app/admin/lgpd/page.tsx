import { handleLgpdRequest } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { LGPD_STATUS_LABELS, LGPD_TYPE_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";

export default async function LgpdPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const flash = await searchParams;
  const requests = await prisma.lgpdRequest.findMany({
    include: { person: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AdminNav current="/app/admin/lgpd" />
      <h1 className="mb-2 font-heading text-3xl">Pedidos LGPD</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Acesso e correção a secretaria atende aqui. Exclusão definitiva segue para dupla aprovação.
      </p>
      <Flash erro={flash.erro} ok={flash.ok} />
      {requests.length === 0 ? (
        <EmptyState title="Nenhum pedido" description="Quando o titular solicitar, o pedido aparece nesta fila." />
      ) : (
        <div className="grid gap-3">
          {requests.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">
                {item.person.name} · {LGPD_TYPE_LABELS[item.type] ?? item.type}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(item.createdAt)} · {LGPD_STATUS_LABELS[item.status] ?? item.status}
              </p>
              <p className="mt-1 text-sm">{item.reason}</p>
              {item.status === "PENDING" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.type === "ERASURE" ? (
                    <form action={handleLgpdRequest}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="decision" value="forward" />
                      <Button type="submit">Encaminhar à dupla aprovação</Button>
                    </form>
                  ) : (
                    <form action={handleLgpdRequest}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="decision" value="done" />
                      <Button type="submit">Marcar como atendido</Button>
                    </form>
                  )}
                  <form action={handleLgpdRequest}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <Button type="submit" variant="outline">
                      Recusar
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
