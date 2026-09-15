import { prisma } from "@/lib/db";

export async function audit(actorId: string | null, action: string, entity: string, entityId: string, details: string) {
  await prisma.auditLog.create({
    data: { actorId, action, entity, entityId, details },
  });
}
