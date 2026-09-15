export const recoveryNotes = {
  title: "Continuação da sessão Darpe system definition",
  summary:
    "A transcrição da sessão original foi consolidada neste documento vivo. Login de todos os painéis: Google OAuth. Cidades da regional entram pelo cadastro administrativo. A definição de negócio está fechada, inclusive a dupla aprovação.",
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
    title: "Operação cotidiana da v1",
    detail:
      "Cadastros, escalas, presença, QR, foto, LGPD, modelos de relatório, PDF/CSV, avisos por recorte, incidentes, histórico do titular e escala visível ao vinculado já estão no sistema.",
  },
  {
    title: "Google OAuth em produção",
    detail: "O mesmo provedor vale para os três painéis. Nesta prévia, o e-mail de demonstração continua disponível.",
  },
  {
    title: "Fora desta v1",
    detail:
      "PWA de coordenação, e-mail/WhatsApp, autenticação em dois fatores e outras regionais continuam fora do escopo.",
  },
];
