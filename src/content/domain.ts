export const entities = [
  {
    name: "Regional",
    note: "Única na v1: Uberlândia-MG. Não nasce multi-regional.",
  },
  {
    name: "Cidade",
    note: "Cadastrável. Uberlândia é a cidade-sede; as demais pertencem à regional.",
  },
  {
    name: "Comum congregação",
    note: "Localidade principal onde a pessoa costuma congregar. Todas as comuns pertencem ao mesmo ministério, sem divisão administrativa.",
  },
  {
    name: "Pessoa",
    note: "Cadastro civil e de contato. Toda pessoa cadastrada possui login. Status: ativa, afastada, suspensa, desligada ou falecida.",
  },
  {
    name: "Função organizacional",
    note: "Ancião coordenador, ancião complementar, secretário, jurídico, encarregado regional, colaborador. Acumulável e com período opcional.",
  },
  {
    name: "Competência",
    note: "Músico, cantor, atendente/presidente, porteiro e outras. Acumuláveis, com a restrição: músico nunca é cantor e cantor nunca é músico.",
  },
  {
    name: "Permissão",
    note: "O que a pessoa pode fazer no sistema, por painel e por escopo. Não se deriva automaticamente só do cargo.",
  },
  {
    name: "Setor",
    note: "Classificação das instituições. Não há hierarquia entre setor e instituição.",
  },
  {
    name: "Instituição",
    note: "Pertence a exatamente uma cidade e um setor. Pode ficar inativa. Capacidade máxima opcional. Recadastramento anual em algumas, sobretudo forças de segurança.",
  },
  {
    name: "Responsável da instituição",
    note: "Um ou vários, com possível rodízio. Em geral um único irmão que atende.",
  },
  {
    name: "Vínculo institucional",
    note: "Autoriza a pessoa a ser escalada naquela instituição. Feito após contato presencial/verbal. Sem aceite no sistema. Auditoria de quem criou, alterou ou encerrou.",
  },
  {
    name: "Série recorrente",
    note: "Regra a partir de uma data-base. Ex.: sábado a cada 15 dias = um sábado sim, outro não. Uma instituição pode ter várias séries.",
  },
  {
    name: "Ocorrência",
    note: "Atendimento concreto gerado com pelo menos 10 dias de antecedência. Pode ser cancelada com justificativa. Não há remarcação.",
  },
  {
    name: "Escala",
    note: "Participantes previstos na ocorrência, escolhidos entre vinculados e disponíveis. Sem revisão formal. Visível a vinculados da instituição e administradores.",
  },
  {
    name: "Participação",
    note: "Estados: convidado, escalado, confirmado, recusado, presente, atrasado, ausente, justificado, cancelado. Extra não escalado também conta nas métricas.",
  },
  {
    name: "Justificativa",
    note: "Texto livre, sem aprovação. Prazo configurável, padrão 2 dias antes. O coordenador remove e coloca outro no lugar; não há pedido de substituição.",
  },
  {
    name: "Tipo de evento",
    note: "Atendimento, batismo, ensaio musical, reunião do Darpe e outros configuráveis. Flag de obrigatoriedade na criação. Modelo de checklist associado.",
  },
  {
    name: "Evento",
    note: "Obrigatório: para todos. Não obrigatório: obrigatório apenas para os escalados. Checklist copiado do modelo no momento da criação.",
  },
  {
    name: "Batismo",
    note: "Evento especial. Batizandos registrados só no evento, com nome completo. Presidente: ancião. Sem ata/foto obrigatória.",
  },
  {
    name: "Notificação",
    note: "Apenas interna. Público congelado no envio. Agendamento permitido. Exige ciência e confirmação. Preferências do usuário não desligam avisos obrigatórios.",
  },
  {
    name: "Anexo",
    note: "Imagem, PDF, DOCX e planilha. Moderação antes de ficar visível. Observações médicas, criminais ou disciplinares são proibidas.",
  },
  {
    name: "Auditoria",
    note: "Quem fez qualquer coisa no sistema, com ênfase em permissões, vínculos, escalas, presenças, justificativas e exclusões.",
  },
];

export const personStatuses = [
  "Ativa",
  "Afastada",
  "Suspensa",
  "Desligada",
  "Falecida",
];

export const participationStates = [
  {
    state: "Convidado",
    meaning: "Foi incluído no evento, ainda sem compromisso operacional.",
  },
  {
    state: "Escalado",
    meaning: "Previsto na escala. Ausência de justificativa implica intenção de comparecer.",
  },
  {
    state: "Confirmado",
    meaning: "Mantido no modelo para usos futuros; não é exigido no fluxo atual.",
  },
  {
    state: "Recusado",
    meaning: "A pessoa informou que não participará, antes ou fora da justificativa formal.",
  },
  {
    state: "Presente",
    meaning: "Compareceu. Pode ter vindo da escala, de inclusão extra ou de registro manual.",
  },
  {
    state: "Atrasado",
    meaning: "Compareceu fora do horário esperado, sem registrar entrada/saída.",
  },
  {
    state: "Ausente",
    meaning: "Estava escalado, não compareceu e não justificou no prazo.",
  },
  {
    state: "Justificado",
    meaning: "Informou impedimento em texto livre. Entra nas métricas com alerta se o volume for alto.",
  },
  {
    state: "Cancelado",
    meaning: "A ocorrência ou o evento foi cancelado. Permanece nas métricas como cancelado.",
  },
];

export const relationships = [
  "Regional contém cidades cadastráveis.",
  "Pessoa pertence a uma comum congregação e pode ter várias funções e competências.",
  "Instituição pertence a uma cidade e a um setor.",
  "Pessoa recebe vínculos com uma ou várias instituições.",
  "Instituição possui uma ou várias séries recorrentes, que geram ocorrências.",
  "Escala liga pessoas autorizadas a uma ocorrência, com função prevista opcional.",
  "Participação registra o resultado real da escala, extras e justificativas.",
  "Tipo de evento define obrigatoriedade padrão, público e modelo de checklist.",
];
