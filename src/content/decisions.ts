export const closedDecisions = [
  "v1 somente para a Regional Uberlândia, sem preparar isolamento de outras regionais.",
  "Clientes = painéis diferentes. Web administrativa agora; PWA/app de coordenação depois.",
  "Instituição pertence a uma cidade e a um setor.",
  "Pessoa sempre tem comum congregação e sempre tem login.",
  "Credenciamento no Darpe é único; o vínculo por instituição é que autoriza a escala.",
  "Não há aceite digital de vínculo nem visitantes sem cadastro completo.",
  "Não há remarcação, confirmação de escala, pedido de substituição nem check-out.",
  "QR Code com login e localização; secretário registra presença manual.",
  "Checklist copiado no momento da criação do evento; mudar o modelo não altera eventos antigos.",
  "Notificações só internas, público congelado, com ciência e confirmação.",
  "Dados não são apagados, salvo fluxo LGPD. Secretaria + jurídico respondem por incidentes.",
  "Autenticação de todos os painéis, inclusive o administrativo, é Google OAuth com e-mail Google. O que muda entre os painéis é a permissão, não o provedor de login.",
  "Menor colaborador também acessa com conta Google. O cadastro e o consentimento continuam com a secretaria.",
  "A lista completa de cidades da regional é cadastrada no painel administrativo. Não há lista fechada no PRD.",
];

export const dualApprovalProposal = [
  {
    action: "Conceder ou revogar papel de superadministrador",
    recommend: "Sim",
    why: "Muda o controle de todo o sistema.",
  },
  {
    action: "Atender exclusão LGPD / apagamento definitivo",
    recommend: "Sim",
    why: "É irreversível e envolve dado religioso.",
  },
  {
    action: "Reabrir lista de presença após o dia do atendimento",
    recommend: "Sim",
    why: "Altera indicador oficial depois do fechamento.",
  },
  {
    action: "Cancelar reunião do Darpe ou ensaio já convocado",
    recommend: "Sim",
    why: "Afeta toda a regional e a obrigatoriedade de presença.",
  },
  {
    action: "Enviar notificação para toda a regional",
    recommend: "Opcional",
    why: "Pode ficar só com secretários, sem segundo aprovador, se a auditoria for suficiente.",
  },
  {
    action: "Corrigir presença no mesmo dia pelo coordenador",
    recommend: "Não",
    why: "É operação cotidiana da instituição.",
  },
  {
    action: "Trocar pessoa na escala",
    recommend: "Não",
    why: "Já foi definido que o coordenador troca diretamente.",
  },
  {
    action: "Vincular colaborador a instituição",
    recommend: "Não",
    why: "O contato prévio substitui a dupla aprovação digital.",
  },
];

export const stillOpen = [
  {
    id: "dual-approval",
    question: "Quais ações exigem dupla aprovação?",
    proposal:
      "A proposta acima continua valendo. Confirme o que entra: superadmin, exclusão LGPD, reabrir presença e cancelar reunião/ensaio. O restante da operação cotidiana fica com um único responsável e auditoria.",
  },
];
