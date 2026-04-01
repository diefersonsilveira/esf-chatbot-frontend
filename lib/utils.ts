import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AtendimentoStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarData(iso: string): string {
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatarHora(iso: string): string {
  try {
    return format(parseISO(iso), "HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatarRelativo(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { locale: ptBR, addSuffix: true });
  } catch {
    return "—";
  }
}

export function minutosDesde(iso: string): number {
  try {
    return differenceInMinutes(new Date(), parseISO(iso));
  } catch {
    return 0;
  }
}

export const STATUS_LABEL: Record<AtendimentoStatus, string> = {
  bot: "Bot",
  aguardando_identificacao: "Identificação",
  aguardando_acs: "Aguardando ACS",
  em_atendimento: "Em atendimento",
  aguardando_usuario: "Aguardando usuário",
  finalizado: "Finalizado",
  encerrado_por_inatividade: "Inatividade",
};

export const STATUS_COLOR: Record<AtendimentoStatus, string> = {
  bot: "bg-slate-100 text-slate-600",
  aguardando_identificacao: "bg-violet-100 text-violet-700",
  aguardando_acs: "bg-amber-100 text-amber-700",
  em_atendimento: "bg-emerald-100 text-emerald-700",
  aguardando_usuario: "bg-sky-100 text-sky-700",
  finalizado: "bg-slate-100 text-slate-500",
  encerrado_por_inatividade: "bg-red-100 text-red-600",
};

export const STATUS_DOT: Record<AtendimentoStatus, string> = {
  bot: "bg-slate-400",
  aguardando_identificacao: "bg-violet-500",
  aguardando_acs: "bg-amber-500",
  em_atendimento: "bg-emerald-500",
  aguardando_usuario: "bg-sky-500",
  finalizado: "bg-slate-400",
  encerrado_por_inatividade: "bg-red-500",
};

export function iniciais(nome?: string | null): string {
  if (!nome) return "?";
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function mascararCPF(cpf?: string): string {
  if (!cpf) return "—";
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length !== 11) return cpf;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
}

export const INTENCAO_LABEL: Record<string, string> = {
  menu: "Menu",
  horario: "Horário",
  agendamento: "Agendamento",
  receita: "Receita",
  vacina: "Vacina",
  pressao: "Pressão / Sintomas",
  exames: "Exames",
  documentos: "Documentos",
  localizacao: "Localização",
  contato: "Contato",
  acs: "Falar com ACS",
  feriado: "Feriado",
  identificacao: "Identificação",
  encerramento: "Encerramento",
  default: "Sem intenção",
};
