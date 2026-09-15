import { ackNotification, confirmNotification, markNotificationRead } from "@/app/actions/member";
import { EmptyState } from "@/components/flash";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { requirePerson } from "@/lib/session";

export default async function MemberNotificationsPage() {
  const person = await requirePerson();
  const receipts = await prisma.notificationReceipt.findMany({
    where: { personId: person.id },
    include: { notification: true },
    orderBy: { notification: { createdAt: "desc" } },
  });

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl">Avisos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Canal interno da regional. Aviso obrigatório não pode ser desligado nas preferências.
      </p>
      {receipts.length === 0 ? (
        <EmptyState title="Caixa vazia" description="Quando a secretaria publicar um aviso, ele chega aqui." />
      ) : (
        <div className="grid gap-3">
          {receipts.map((receipt) => (
            <article key={receipt.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{receipt.notification.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{receipt.notification.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(receipt.notification.createdAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!receipt.readAt ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="notificationId" value={receipt.notificationId} />
                    <Button type="submit" size="sm" variant="outline">
                      Marcar leitura
                    </Button>
                  </form>
                ) : null}
                {receipt.notification.requiresAck && !receipt.scienceAt ? (
                  <form action={ackNotification}>
                    <input type="hidden" name="notificationId" value={receipt.notificationId} />
                    <Button type="submit" size="sm">
                      Dar ciência
                    </Button>
                  </form>
                ) : null}
                {receipt.notification.requiresConfirm && !receipt.confirmedAt ? (
                  <form action={confirmNotification}>
                    <input type="hidden" name="notificationId" value={receipt.notificationId} />
                    <Button type="submit" size="sm">
                      Confirmar
                    </Button>
                  </form>
                ) : null}
                {receipt.scienceAt ? <span className="text-xs text-muted-foreground">Ciência registrada</span> : null}
                {receipt.confirmedAt ? <span className="text-xs text-muted-foreground">Confirmação registrada</span> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
