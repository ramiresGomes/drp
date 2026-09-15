export const organizationalRoles = [
  {
    name: "Ancião coordenador",
    canBeMultiple: true,
    summary: "Autoridade ministerial da regional. Pode credenciar, vincular, escalar e acessar o painel administrativo.",
  },
  {
    name: "Ancião complementar",
    canBeMultiple: true,
    summary: "Apoia a coordenação. Presidência de batismo e demais atos ministeriais conforme a prática local.",
  },
  {
    name: "Secretário",
    canBeMultiple: true,
    summary: "Dono operacional do sistema. Gestão total, eventos obrigatórios, QR Code, checklists, notificações e LGPD.",
  },
  {
    name: "Jurídico",
    canBeMultiple: true,
    summary: "Integra a secretaria para incidentes, consentimentos e solicitações LGPD.",
  },
  {
    name: "Encarregado regional",
    canBeMultiple: true,
    summary: "Parte musical. Pode vincular qualquer colaborador a instituições e montar escalas.",
  },
  {
    name: "Colaborador",
    canBeMultiple: true,
    summary: "Demais participantes dos atendimentos: músicos, cantores, irmãos que atendem e outros.",
  },
];

export const competencies = [
  {
    name: "Músico",
    rule: "Não pode ser cantor.",
  },
  {
    name: "Cantor",
    rule: "Não pode ser músico.",
  },
  {
    name: "Atendente / presidente",
    rule: "Pode ser combinada com outras, inclusive em instituições diferentes. Algumas instituições exigem a presença deste irmão.",
  },
  {
    name: "Porteiro",
    rule: "Usada principalmente em eventos obrigatórios e checklists.",
  },
];

export const clients = [
  {
    id: "admin",
    name: "Painel administrativo",
    surface: "Web, com autenticação mais rígida",
    users: "Secretários, anciãos, jurídico e quem receber permissão equivalente",
    capabilities: [
      "CRUD de funções, pessoas, setores, instituições, cidades e comuns congregação",
      "Vínculos, recadastramentos e alertas de vencimento",
      "Agendar eventos obrigatórios, checklists e QR Code",
      "Notificações para públicos segmentados",
      "Construtor de relatórios, exportações e painel de métricas",
      "Auditoria, inativações e solicitações LGPD",
      "Visualizar telefone, endereço, documentos e histórico individual",
    ],
  },
  {
    id: "coordinator",
    name: "Painel de coordenação",
    surface: "Web agora; PWA ou aplicativo depois",
    users: "Irmão que atende / responsável da instituição",
    capabilities: [
      "Criar e alterar escalas das instituições sob sua responsabilidade",
      "Fechar presença no mesmo dia, inclusive extras fora da escala",
      "Cancelar atendimento com justificativa",
      "Anexar foto e texto livre, sujeitos a moderação",
      "Corrigir presença depois do encerramento",
      "Reabrir lista apenas quando a permissão administrativa permitir o fluxo correspondente",
    ],
  },
  {
    id: "member",
    name: "Painel do colaborador",
    surface: "Web simples, preferencialmente Google OAuth",
    users: "Todas as pessoas cadastradas",
    capabilities: [
      "Ver e editar os próprios dados",
      "Ver agenda: eventos obrigatórios e ocorrências em que está escalado",
      "Enviar justificativa até o prazo configurado",
      "Ver notificações, marcar leitura, ciência e confirmação",
      "Consultar o próprio histórico de participação",
      "Informar disponibilidade recorrente e bloqueios",
    ],
  },
];

export const permissionPrinciples = [
  "Cargo não é permissão. Secretário e ancião costumam ter acesso amplo, mas o sistema controla por nível.",
  "Quem transfere pessoas ou instituições entre cidades: apenas quem tiver permissão, em geral secretários e anciãos.",
  "Quem vincula colaborador a instituição: secretário, ancião ou encarregado regional, após contato fora do sistema.",
  "Quem monta escala: responsável da instituição, encarregados regionais, anciãos e secretários.",
  "Dados pessoais sensíveis ficam no painel administrativo.",
  "Existe um superadministrador / ancião com poder superior ao secretário comum.",
  "A secretaria do Darpe (secretários + jurídico) responde por incidentes e correções indevidas.",
];
