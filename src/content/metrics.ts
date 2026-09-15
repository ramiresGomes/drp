export const dashboardWidgets = [
  {
    title: "Atendimentos do período",
    detail: "Previstos, realizados e cancelados no mês corrente, com troca para trimestre, semestre e ano.",
  },
  {
    title: "Presença nas escalas",
    detail: "Percentual de presentes sobre escalados, separado de extras.",
  },
  {
    title: "Faltas e justificativas",
    detail: "Dois indicadores lado a lado. Volume alto de justificadas dispara o mesmo tipo de alerta que faltas.",
  },
  {
    title: "Eventos obrigatórios",
    detail: "Presentes, ausentes e justificados na última reunião e no último ensaio.",
  },
  {
    title: "Crescimento",
    detail: "Novos colaboradores ativos e novas instituições no período escolhido.",
  },
  {
    title: "Pendências operacionais",
    detail: "Presenças não fechadas no dia, escalas vazias nos próximos 10 dias, checklists atrasados e recadastramentos vencendo.",
  },
  {
    title: "Capacidade",
    detail: "Instituições próximas do limite de pessoas por atendimento.",
  },
];

export const reportBuilder = {
  principle:
    "O construtor não é SQL livre. O administrador escolhe um fato, dimensões, filtros e um recorte temporal. Combinações inválidas são bloqueadas.",
  facts: [
    "Participações em atendimento",
    "Faltas e faltas justificadas",
    "Ocorrências realizadas, previstas e canceladas",
    "Participação em eventos obrigatórios",
    "Crescimento de instituições e colaboradores",
    "Batismos registrados",
  ],
  dimensions: [
    "Instituição",
    "Setor",
    "Cidade",
    "Colaborador",
    "Função",
    "Competência",
    "Tipo de evento",
    "Mês / trimestre / semestre / ano",
  ],
  rules: [
    "Atendimento realizado = serviço de evangelização efetivamente feito, não apenas previsto.",
    "Falta = escalado + não presente + sem justificativa.",
    "Justificada entra no relatório e, em volume alto, gera alerta equivalente ao de falta.",
    "Cancelado não some: aparece como cancelado.",
    "Participação extra conta igual à presença escalada nas métricas de atuação.",
    "Pessoas desligadas permanecem nos históricos.",
    "Relatórios amplos nascem anonimizados; identificação individual só para administradores em recorte explícito.",
    "Modelos salvos e compartilhados ficam restritos a administradores.",
  ],
};
