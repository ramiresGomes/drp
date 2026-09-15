import { AdminNav } from "@/components/admin-nav";
import { EmptyState } from "@/components/flash";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/dates";

export default async function AuditPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <div>
      <AdminNav current="/app/admin/auditoria" />
      <h1 className="mb-2 font-heading text-3xl">Auditoria</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Toda alteração relevante fica registrada. Aviso regional também entra aqui, mesmo sem dupla aprovação.
      </p>
      {logs.length === 0 ? (
        <EmptyState title="Sem registros" description="As ações da secretaria e da coordenação aparecerão aqui." />
      ) : (
        <div className="grid gap-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-border px-4 py-3 text-sm">
              <p className="font-medium">
                {log.action} · {log.entity}
              </p>
              <p className="text-muted-foreground">
                {log.actor?.name ?? "Sistema"} · {formatDateTime(log.createdAt)} · {log.details}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
