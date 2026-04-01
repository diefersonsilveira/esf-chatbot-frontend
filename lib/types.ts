export type UserRole = "admin" | "acs";

export type AtendimentoStatus =
  | "bot"
  | "aguardando_identificacao"
  | "aguardando_acs"
  | "em_atendimento"
  | "aguardando_usuario"
  | "finalizado"
  | "encerrado_por_inatividade";

export type MensagemAutor = "usuario" | "bot" | "acs" | "sistema";

export interface PainelUsuario {
  uid: string;
  email: string;
  nome: string;
  role: UserRole;
  ativo: boolean;
  criadoEm: string;
  ultimoAcesso?: string;
  avatar?: string;
}

export interface Contato {
  usuario_id: string;
  jid_original: string;
  tipo_id: "lid" | "c.us" | "outro";
  nome_contato_whatsapp?: string;
  nome?: string;
  cpf?: string;
  identificado?: boolean;
  primeira_interacao: string;
  ultima_interacao: string;
  total_mensagens: number;
}

export interface Atendimento {
  id: string;
  usuario_id: string;
  jid_original: string;
  tipo_id: string;
  nome_contato_whatsapp?: string;

  aberto: boolean;
  status: AtendimentoStatus;
  isHuman: boolean;
  assignedTo: string | null;
  assignedToNome: string | null;

  intencao_inicial?: string;
  intencao_ultima?: string;
  triagem?: string;

  aviso_inatividade_enviado: boolean;
  lembrete_menu_enviado: boolean;

  nps_enviado: boolean;
  aguardando_nps: boolean;
  nps_respondido: boolean;
  nps_nota: number | null;
  nps_comentario?: string;

  criado_em: string;
  atualizado_em: string;
  ultima_mensagem_em: string;
  assumido_em?: string;
  finalizado_em?: string;
  motivo_encerramento?: string;

  total_mensagens: number;
}

export interface Mensagem {
  id: string;
  atendimento_id: string;
  autor: MensagemAutor;
  autor_id?: string;
  autor_nome?: string;
  texto: string;
  origem?: string;
  jid_original?: string;
  criado_em: string;
  lida?: boolean;
}

export interface Observacao {
  id: string;
  atendimento_id: string;
  autor_uid: string;
  autor_nome: string;
  texto: string;
  criado_em: string;
}

export interface MensagemPendente {
  id?: string;
  jid_original: string;
  texto: string;
  atendimento_id: string;
  autor_id: string;
  autor_nome: string;
  status: "pendente" | "enviada" | "erro";
  criado_em: string;
  enviada_em?: string;
  erro?: string;
}

export interface DashboardMetrics {
  totalHoje: number;
  emAndamento: number;
  aguardandoACS: number;
  finalizadosHoje: number;
  npsMedia: number | null;
  tempoMedioAtendimento: number | null;
}

export interface ACSMetric {
  uid: string;
  nome: string;
  atendimentosHoje: number;
  atendimentosAbertos: number;
  npsMedia: number | null;
  tempoMedio: number | null;
}

export interface EstadoConversa {
  usuario_id: string;
  estado: "livre" | "aguardando_nome" | "aguardando_cpf" | "identificado";
  fluxo?: string;
  nome_informado?: string;
  atualizado_em: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  painelUsuario?: PainelUsuario;
}
