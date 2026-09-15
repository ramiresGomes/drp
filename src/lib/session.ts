import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canLinkPeople, canUseCoordinatorPanel, isAdmin } from "@/lib/permissions";
import type { CurrentPerson } from "@/lib/permissions";
import { redirect } from "next/navigation";

export async function getCurrentPerson(): Promise<CurrentPerson | null> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const person = await prisma.person.findUnique({
    where: { email },
    include: {
      roles: true,
      competencies: true,
      responsibilities: true,
    },
  });
  if (!person || person.status !== "ACTIVE") return null;

  const now = new Date();
  const roles = person.roles
    .filter((role) => !role.endAt || role.endAt > now)
    .map((role) => role.role);

  return {
    id: person.id,
    name: person.name,
    email: person.email,
    isSuperAdmin: person.isSuperAdmin,
    status: person.status,
    roles,
    competencies: person.competencies.map((item) => item.competency),
    responsibleInstitutionIds: person.responsibilities.map((item) => item.institutionId),
    muteOptionalNotifications: person.muteOptionalNotifications,
  };
}

export async function requirePerson() {
  const person = await getCurrentPerson();
  if (!person) redirect("/entrar");
  return person;
}

export async function requireAdmin() {
  const person = await requirePerson();
  if (!isAdmin(person)) redirect("/app");
  return person;
}

export async function requireCoordinator() {
  const person = await requirePerson();
  if (!canUseCoordinatorPanel(person)) redirect("/app");
  return person;
}

export async function requireLinker() {
  const person = await requirePerson();
  if (!canLinkPeople(person)) redirect("/app");
  return person;
}
