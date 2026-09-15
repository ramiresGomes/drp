export const recoveryNotes = {
  title: "Continuação da sessão Darpe system definition",
  summary:
    "O chat original ficou inacessível a partir deste ambiente. O conteúdo abaixo é a transcrição que você colou, já consolidada em definição fechada e PRD. O repositório público do GitHub ramiresGomes não lista um projeto chamado drp; se ele for privado, este workspace serve como base para seguir o PRD até a implementação.",
  recovered: [
    "Sistema web com painéis por público, depois PWA para coordenação.",
    "Escopo inicial: Darpe da Regional Uberlândia-MG e cidades da regional.",
    "Quatro setores, instituições, credenciamento, vínculos, escalas e presenças.",
    "Eventos recorrentes e obrigatórios, batismos, checklists, QR Code com localização.",
    "Relatórios dinâmicos controlados, auditoria e regras de LGPD.",
    "Respostas às 115 perguntas e aceite das funcionalidades complementares.",
  ],
};

export const closedScope = {
  product: "DRP",
  organization: "Darpe — Departamento de Assistência Religiosa para Evangelização",
  church: "Congregação Cristã no Brasil",
  regional: "Uberlândia-MG",
  citiesSeed: ["Uberlândia", "Monte Carmelo", "Araxá", "Uberaba"],
  sectors: [
    {
      code: 1,
      name: "Sistemas de Ressocialização e Socioeducativos",
    },
    {
      code: 2,
      name: "Clínica de Dependentes e Albergues",
    },
    {
      code: 3,
      name: "Forças de Segurança",
    },
    {
      code: 4,
      name: "Hospitais, Instituição para Idosos, Setor Educacional",
    },
  ],
};

export const nextSteps = [
  {
    title: "Revisar o PRD neste app",
    detail: "Confirme atores, estados, permissões e o recorte da primeira versão.",
  },
  {
    title: "Fechar as pendências curtas",
    detail: "Dupla aprovação, lista completa de cidades e o mecanismo de login administrativo.",
  },
  {
    title: "Ligar o repositório drp",
    detail: "Quando o GitHub drp estiver acessível, a implementação segue o PRD sem reabrir o modelo.",
  },
];
