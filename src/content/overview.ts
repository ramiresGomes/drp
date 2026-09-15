export const recoveryNotes = {
  title: "Continuação da sessão Darpe system definition",
  summary:
    "A transcrição da sessão original foi consolidada neste documento vivo. O repositório de produto é https://github.com/ramiresGomes/drp. Login de todos os painéis: Google OAuth. Cidades da regional entram pelo cadastro administrativo.",
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
  citiesNote: "Exemplos. A lista oficial é cadastrada no painel.",
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
    title: "Revisar o PRD",
    detail: "Confirme atores, estados, permissões e o recorte da primeira versão.",
  },
  {
    title: "Fechar a dupla aprovação",
    detail: "Única pendência de negócio que ainda altera o PRD.",
  },
  {
    title: "Começar a implementação no drp",
    detail: "O GitHub ramiresGomes/drp já está público. A v1 segue este PRD, com Google OAuth.",
  },
];
