import Link from "next/link";
import { formatarRelativo, iniciais, cn, STATUS_DOT } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Atendimento } from "@/lib/types";
import { User, Clock, MessageSquare } from "lucide-react";

interface AtendimentoCardProps {
  atendimento: Atendimento;
  basePath?: string;
  showAssigned?: boolean;
}

export function AtendimentoCard({
  atendimento,
  basePath = "/acs/atendimento",
  showAssigned = false,
}: AtendimentoCardProps) {
  const nome =
    atendimento.nome_contato_whatsapp ||
    atendimento.usuario_id ||
    "Usuário";

  const isUrgente =
    atendimento.status === "aguardando_acs" ||
    (atendimento.triagem === "urgente");

  return (
    <Link href={`${basePath}/${atendimento.id}`}>
      <div
        className={cn(
          "card p-4 hover:shadow-md transition-all duration-150 cursor-pointer group",
          isUrgente && "border-amber-200 hover:border-amber-300"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-slate-600 text-sm font-semibold">
              {iniciais(nome)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                {nome}
              </p>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatarRelativo(atendimento.ultima_mensagem_em)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={atendimento.status} size="sm" />
              {atendimento.intencao_ultima && (
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                  {atendimento.intencao_ultima}
                </span>
              )}
              {atendimento.triagem === "urgente" && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Urgente
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {atendimento.total_mensagens} msgs
              </span>
              {showAssigned && atendimento.assignedToNome && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {atendimento.assignedToNome}
                </span>
              )}
              {!atendimento.isHuman && (
                <span className="text-slate-300">Bot</span>
              )}
              {atendimento.isHuman && (
                <span className="text-emerald-500 font-medium">Humano</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
