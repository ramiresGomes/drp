export const flows = [
  {
    id: "credenciamento",
    title: "1. Credenciar e vincular",
    steps: [
      "Secretário, ancião ou encarregado cadastra a pessoa com nome, e-mail, telefone, função/atribuição e comum congregação.",
      "O cadastro cria a pessoa no sistema. O acesso de todos os painéis é Google OAuth com e-mail Google, inclusive de menores. O painel administrativo só abre para quem tem papel e permissão.",
      "A pessoa recebe funções, competências e permissões. Músico e cantor são mutuamente exclusivos.",
      "Após contato fora do sistema, a autoridade vincula a pessoa às instituições. Não há aceite digital.",
      "Instituições com recadastramento anual recebem data inicial e final no vínculo, com alerta de vencimento.",
      "Menores podem ser colaboradores e entram com conta Google. Visitantes sem credenciamento completo não são registrados.",
    ],
  },
  {
    id: "ocorrencias",
    title: "2. Gerar atendimentos",
    steps: [
      "A instituição recebe uma ou mais séries recorrentes a partir de uma data escolhida.",
      "O sistema gera ocorrências com pelo menos 10 dias de antecedência.",
      "Conflitos de horário são detectados. Disponibilidade recorrente e exceções entram no cálculo.",
      "Capacidade máxima, quando existir, limita a escala.",
      "Feriado ou impedimento: o coordenador ou administrador cancela com justificativa. Não há remarcação.",
      "Instituição inativa deixa de gerar novas ocorrências.",
    ],
  },
  {
    id: "escala",
    title: "3. Montar a escala",
    steps: [
      "O responsável, encarregado, ancião ou secretário escolhe pessoas já vinculadas e disponíveis.",
      "Não há funções obrigatórias na escala nem etapa de revisão.",
      "Quem tem vínculo com a instituição vê os nomes da escala.",
      "Os escalados recebem notificação. Não precisam confirmar.",
      "Justificativa em texto livre até 2 dias antes, prazo configurável.",
      "Não existe pedido de substituição: o coordenador remove e coloca outro.",
    ],
  },
  {
    id: "presenca",
    title: "4. Registrar o atendimento",
    steps: [
      "No dia, o responsável marca quem participou a partir da escala.",
      "Pode incluir alguém que não estava escalado. A participação extra conta nas métricas da mesma forma.",
      "Foto e texto livre são opcionais, passam por moderação e não podem conter dados médicos, criminais ou disciplinares.",
      "O registro fecha no mesmo dia. Coordenador corrige depois do encerramento. Administrador pode reabrir a lista.",
      "Falta = estava escalado, não compareceu e não justificou.",
      "Ocorrência cancelada permanece nas métricas como cancelada.",
    ],
  },
  {
    id: "obrigatorios",
    title: "5. Eventos obrigatórios",
    steps: [
      "Secretário agenda ensaio, reunião do Darpe ou outro tipo configurável.",
      "Na criação, marca se é obrigatório. Obrigatório vale para todos; não obrigatório vale para os escalados.",
      "O checklist do tipo é copiado para o evento. Itens podem ter responsável, prazo, dependência e evidência opcional.",
      "Itens obrigatórios pendentes não bloqueiam a realização, mas não são recomendados.",
      "QR Code fica visível durante todo o evento, exige login e valida localização. Secretário registra presença manual para quem não tem celular ou conta.",
      "Pessoas cadastradas depois da criação também são convocadas. Lembretes automáticos são enviados. Não há confirmação prévia nem check-out.",
    ],
  },
  {
    id: "batismo",
    title: "6. Batismo",
    steps: [
      "Agendado com antecedência como atendimento especial.",
      "Ao final, registra o ancião que presidiu e os nomes completos dos batizandos, somente neste evento.",
      "Colaboradores seguem a mesma lógica de escala e presença.",
      "Consulta do histórico: administradores.",
      "Há autorização formal para armazenar esses nomes.",
    ],
  },
];

export const complementary = [
  "Disponibilidade recorrente e bloqueios de agenda",
  "Detecção de conflitos e sugestão de pessoas elegíveis",
  "Substituição feita pelo coordenador, sem fluxo de pedido",
  "Histórico completo de vínculos e funções",
  "Gestão de credenciais e vencimentos por instituição",
  "Contatos e regras de acesso de cada instituição",
  "Cancelamento com comunicação automática",
  "Calendário mensal e exportação para agenda pessoal",
  "Painel de pendências: presença não fechada, justificativas e checklists atrasados",
  "Auditoria consultável",
  "Exportações com anonimização",
  "Central de documentos e políticas internas",
  "Canal de indisponibilidade ou afastamento temporário",
];
