import { decideDualApproval, requestDualApproval } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { areaClass, controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { APPROVAL_LABELS } from "@/lib/labels";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/dates";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const actor = await requireAdmin();
  const params = await searchParams;
  const [requests, people, events, closed] = await Promise.all([
    prisma.dualApproval.findMany({
      include: { requestedBy: true, decidedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.person.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.regionalEvent.findMany({ where: { cancelled: false, mandatory: true }, orderBy: { startsAt: "desc" } }),
    prisma.occurrence.findMany({
      where: { closedAt: { not: null } },
      include: { series: { include: { institution: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <AdminNav current="/app/admin/aprovacoes" />
      <h1 className="mb-2 font-heading text-3xl">Dupla aprovação</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Superadmin, exclusão LGPD, reabrir presença depois do dia e cancelar reunião/ensaio convocado exigem duas
        pessoas da secretaria. Quem pede não pode ser quem confirma.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Novo pedido</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <ApprovalForm
            type="GRANT_SUPERADMIN"
            entity="Person"
            options={people.map((person) => ({ id: person.id, label: person.name }))}
          />
          <ApprovalForm
            type="REVOKE_SUPERADMIN"
            entity="Person"
            options={people.filter((person) => person.isSuperAdmin).map((person) => ({ id: person.id, label: person.name }))}
          />
          <ApprovalForm
            type="LGPD_ERASURE"
            entity="Person"
            options={people.map((person) => ({ id: person.id, label: person.name }))}
          />
          <ApprovalForm
            type="CANCEL_MANDATORY_EVENT"
            entity="RegionalEvent"
            options={events.map((event) => ({ id: event.id, label: event.title }))}
          />
          <ApprovalForm
            type="REOPEN_ATTENDANCE"
            entity="Occurrence"
            options={closed.map((item) => ({
              id: item.id,
              label: `${item.series.institution.name} · ${item.date.toLocaleDateString("pt-BR")}`,
            }))}
          />
        </CardContent>
      </Card>

      {requests.length === 0 ? (
        <EmptyState title="Nenhum pedido" description="A fila de dupla aprovação está vazia." />
      ) : (
        <div className="grid gap-3">
          {requests.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{APPROVAL_LABELS[item.type] ?? item.type}</p>
              <p className="text-sm text-muted-foreground">
                Pedido por {item.requestedBy.name} em {formatDateTime(item.createdAt)} · {item.status}
              </p>
              <p className="mt-1 text-sm">{item.reason}</p>
              {item.status === "PENDING" && item.requestedById !== actor.id ? (
                <div className="mt-3 flex gap-2">
                  <form action={decideDualApproval}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <Button type="submit">Aprovar</Button>
                  </form>
                  <form action={decideDualApproval}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <Button type="submit" variant="outline">
                      Recusar
                    </Button>
                  </form>
                </div>
              ) : null}
              {item.status === "PENDING" && item.requestedById === actor.id ? (
                <p className="mt-2 text-xs text-muted-foreground">Aguarde outra pessoa da secretaria confirmar.</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalForm({
  type,
  entity,
  options,
}: {
  type: string;
  entity: string;
  options: { id: string; label: string }[];
}) {
  if (options.length === 0) return null;
  return (
    <form action={requestDualApproval} className="grid gap-2 rounded-lg border border-border p-3">
      <p className="text-sm font-medium">{APPROVAL_LABELS[type]}</p>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="entity" value={entity} />
      <Field label="Alvo">
        <select className={controlClass} name="entityId" required>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Justificativa">
        <textarea className={areaClass} name="reason" required />
      </Field>
      <Button type="submit" variant="outline">
        Enviar pedido
      </Button>
    </form>
  );
}
