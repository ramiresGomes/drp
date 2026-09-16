export const ROLE_LABELS: Record<string, string> = {
  ANCIAO_COORDENADOR: "Ancião coordenador",
  ANCIAO_COMPLEMENTAR: "Ancião complementar",
  SECRETARIO: "Secretário",
  JURIDICO: "Jurídico",
  ENCARREGADO_REGIONAL: "Encarregado regional",
  COLABORADOR: "Colaborador",
};

export const COMPETENCY_LABELS: Record<string, string> = {
  MUSICO: "Músico",
  CANTOR: "Cantor",
  ATENDENTE: "Atendente / preside",
  PORTEIRO: "Porteiro",
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  AFASTADA: "Afastada",
  SUSPENSA: "Suspensa",
  DESLIGADA: "Desligada",
  FALECIDA: "Falecida",
  ERASED: "Apagada (LGPD)",
};

export const STATE_LABELS: Record<string, string> = {
  CONVIDADO: "Convidado",
  ESCALADO: "Escalado",
  CONFIRMADO: "Confirmado",
  RECUSADO: "Recusado",
  PRESENTE: "Presente",
  ATRASADO: "Atrasado",
  AUSENTE: "Ausente",
  JUSTIFICADO: "Justificado",
  CANCELADO: "Cancelado",
};

export const ADMIN_ROLES = [
  "SECRETARIO",
  "ANCIAO_COORDENADOR",
  "ANCIAO_COMPLEMENTAR",
  "JURIDICO",
] as const;

export const SCALE_ROLES = [
  "SECRETARIO",
  "ANCIAO_COORDENADOR",
  "ANCIAO_COMPLEMENTAR",
  "ENCARREGADO_REGIONAL",
] as const;

export const APPROVAL_LABELS: Record<string, string> = {
  GRANT_SUPERADMIN: "Conceder superadmin",
  REVOKE_SUPERADMIN: "Revogar superadmin",
  LGPD_ERASURE: "Exclusão LGPD",
  REOPEN_ATTENDANCE: "Reabrir presença após o dia",
  CANCEL_MANDATORY_EVENT: "Cancelar reunião ou ensaio convocado",
};

export const LGPD_TYPE_LABELS: Record<string, string> = {
  ACCESS: "Acesso aos dados",
  CORRECTION: "Correção de dados",
  ERASURE: "Exclusão definitiva",
};

export const LGPD_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  DONE: "Atendido",
  FORWARDED: "Encaminhado à dupla aprovação",
  REJECTED: "Recusado",
};

export const AUDIENCE_LABELS: Record<string, string> = {
  todos: "Toda a regional",
  admin: "Secretaria e coordenação",
  vinculados: "Pessoas com vínculo institucional",
  escalados: "Quem está na escala",
  papel: "Por função",
  competencia: "Por competência",
  instituicao: "Por instituição",
  setor: "Por setor",
  cidade: "Por cidade",
  musicos: "Músicos",
  pessoas: "Pessoas específicas",
};

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberto",
  CLOSED: "Encerrado",
};

export const WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
] as const;
