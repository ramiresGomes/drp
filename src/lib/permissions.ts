import { ADMIN_ROLES, SCALE_ROLES } from "@/lib/labels";

export type CurrentPerson = {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  status: string;
  roles: string[];
  competencies: string[];
  responsibleInstitutionIds: string[];
  muteOptionalNotifications: boolean;
};

export function isAdmin(person: CurrentPerson) {
  return person.isSuperAdmin || person.roles.some((role) => ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]));
}

export function canScale(person: CurrentPerson, institutionId?: string) {
  if (isAdmin(person)) return true;
  if (person.roles.includes("ENCARREGADO_REGIONAL")) return true;
  if (institutionId && person.responsibleInstitutionIds.includes(institutionId)) return true;
  if (person.competencies.includes("ATENDENTE") && institutionId && person.responsibleInstitutionIds.includes(institutionId)) {
    return true;
  }
  return Boolean(institutionId && person.responsibleInstitutionIds.includes(institutionId));
}

export function canLinkPeople(person: CurrentPerson) {
  return isAdmin(person) || person.roles.includes("ENCARREGADO_REGIONAL");
}

export function canUseCoordinatorPanel(person: CurrentPerson) {
  return canScale(person) || person.responsibleInstitutionIds.length > 0 || person.competencies.includes("ATENDENTE");
}

export function musicianSingerConflict(competencies: string[]) {
  return competencies.includes("MUSICO") && competencies.includes("CANTOR");
}
