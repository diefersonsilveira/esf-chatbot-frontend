"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMensagens, useAtendimentoRealtime } from "@/hooks/useMensagens";
import { useAuth } from "@/providers/AuthProvider";
import { AtendimentoService } from "@/services/api";
import { ChatBubble, DateSeparator } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatarData,
  formatarRelativo,
  iniciais,
  mascararCPF,
  INTENCAO_LABEL,
  cn,
} from "@/lib/utils";
import {
  UserCheck,
  Phone,
  Clock,
  MessageSquare,
  FileText,
  CheckCircle,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Mensagem } from "@/lib/types";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AtendimentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { atendimento, loading: loadingAtendimento } = useAtendimentoRealtime(id);
  const { mensagens, loading: loadingMensagens, bottomRef } = useMensagens(id);
  const [observacoes, setObservacoes] = useState<{
    id: string;
    autor_nome: string;
    texto: string;
    criado_em: string;
  }[]>([]);
  const [novaObs, setNovaObs] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [assumindo, setAssumindo] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "info" | "obs">("chat");

  const isAssigned = atendimento?.assignedTo === user?.uid;
  const canRespond = atendimento?.isHuman && (isAssigned || user?.role === "admin");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "observacoes"),
      where("atendimento_id", "==", id),
      orderBy("criado_em", "asc")
    );
    return onSnapshot(q, (snap) => {
      setObservacoes(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any)
      );
    });
  }, [id]);

  const handleAssumir = async () => {
    setAssumindo(true);
    setErro(null);
    try {
      await AtendimentoService.assumir(id);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao assumir");
    } finally {
      setAssumindo(false);
    }
  };

  const handleEnviarMensagem = useCallback(
    async (texto: string) => {
      await AtendimentoService.responder(id, texto);
    },
    [id]
  );

  const handleFinalizar = async () => {
    if (!confirm("Finalizar este atendimento?")) return;
    setFinalizando(true);
    try {
      await AtendimentoService.finalizar(id, "encerramento_acs");
      router.push("/acs");
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao finalizar");
    } finally {
      setFinalizando(false);
    }
  };

  const handleSalvarObs = async () => {
    if (!novaObs.trim()) return;
    setSavingObs(true);
    try {
      await AtendimentoService.adicionarObservacao(id, novaObs);
      setNovaObs("");
    } finally {
      setSavingObs(false);
    }
  };

  function renderMensagens(msgs: Mensagem[]) {
    const elements: React.ReactNode[] = [];
    let lastDate = "";

    for (const msg of msgs) {
      try {
        const date = format(parseISO(msg.criado_em), "dd 'de' MMMM 'de' yyyy", {
          locale: ptBR,
        });
        if (date !== lastDate) {
          elements.push(<DateSeparator key={`sep-${date}`} date={date} />);
          lastDate = date;
        }
      } catch {}
      elements.push(
        <ChatBubble key={msg.id} mensagem={msg} acsUid={user?.uid} />
      );
    }
    return elements;
  }

  if (loadingAtendimento) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!atendimento) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500">Atendimento não encontrado.</p>
        <button onClick={() => router.back()} className="btn-secondary">
          Voltar
        </button>
      </div>
    );
  }

  const nome = atendimento.nome_contato_whatsapp || atendimento.usuario_id;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="flex flex-col flex-1 min-w-0 bg-white border-r border-slate-100">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 flex-shrink-0 bg-white">
          <button
            onClick={() => router.back()}
            className="btn-ghost p-2 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-slate-600 text-sm font-semibold">
              {iniciais(nome)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{nome}</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={atendimento.status} size="sm" />
              {atendimento.isHuman && (
                <span className="text-xs text-emerald-600 font-medium">
                  Atendimento humano
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!atendimento.isHuman && atendimento.aberto && (
              <button
                onClick={handleAssumir}
                disabled={assumindo}
                className="btn-primary"
              >
                {assumindo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                Assumir
              </button>
            )}

            {atendimento.isHuman && !isAssigned && !isAdmin && (
              <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-medium">
                Com {atendimento.assignedToNome}
              </span>
            )}

            {atendimento.aberto && (isAssigned || isAdmin) && (
              <button
                onClick={handleFinalizar}
                disabled={finalizando}
                className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200"
              >
                {finalizando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Finalizar
              </button>
            )}
          </div>
        </div>

        {erro && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
            <button
              onClick={() => setErro(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {!atendimento.isHuman && atendimento.aberto && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-700">
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            Bot está respondendo automaticamente. Assuma o atendimento para
            interagir.
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loadingMensagens ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
          ) : (
            <>
              {renderMensagens(mensagens)}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <ChatInput
          onSend={handleEnviarMensagem}
          disabled={!canRespond || !atendimento.aberto}
        />
      </div>

      <div className="w-80 flex flex-col bg-white flex-shrink-0 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {[
            { key: "info", label: "Dados", icon: Phone },
            { key: "obs", label: `Obs. (${observacoes.length})`, icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-colors border-b-2",
                tab === key
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "info" && (
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Usuário
                </p>
                <div className="space-y-2.5">
                  <InfoRow label="Nome" value={nome} />
                  <InfoRow label="CPF" value={mascararCPF(undefined)} />
                  <InfoRow
                    label="WhatsApp"
                    value={
                      atendimento.jid_original
                        ?.replace("@s.whatsapp.net", "")
                        .replace("@lid", "") || "—"
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Atendimento
                </p>
                <div className="space-y-2.5">
                  <InfoRow
                    label="Intenção"
                    value={
                      INTENCAO_LABEL[atendimento.intencao_ultima || ""] ||
                      atendimento.intencao_ultima ||
                      "—"
                    }
                  />
                  <InfoRow
                    label="Triagem"
                    value={atendimento.triagem || "—"}
                    valueClass={
                      atendimento.triagem === "urgente"
                        ? "text-red-600 font-semibold"
                        : atendimento.triagem === "moderado"
                        ? "text-amber-600"
                        : ""
                    }
                  />
                  <InfoRow
                    label="Iniciado"
                    value={formatarData(atendimento.criado_em)}
                  />
                  {atendimento.assumido_em && (
                    <InfoRow
                      label="Assumido"
                      value={formatarData(atendimento.assumido_em)}
                    />
                  )}
                  <InfoRow
                    label="Mensagens"
                    value={String(atendimento.total_mensagens)}
                  />
                  {atendimento.assignedToNome && (
                    <InfoRow label="ACS" value={atendimento.assignedToNome} />
                  )}
                </div>
              </div>

              {atendimento.nps_nota !== null &&
                atendimento.nps_nota !== undefined && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      NPS
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">
                          {atendimento.nps_nota}
                          <span className="text-sm text-slate-400 font-normal">
                            /10
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {tab === "obs" && (
            <div className="p-5 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Observações Internas
              </p>
              <p className="text-xs text-slate-400">
                Visíveis apenas para a equipe. Não são enviadas ao usuário.
              </p>

              <div className="space-y-3">
                {observacoes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhuma observação registrada.
                  </p>
                ) : (
                  observacoes.map((obs) => (
                    <div
                      key={obs.id}
                      className="p-3 bg-amber-50 border border-amber-100 rounded-xl"
                    >
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {obs.texto}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {obs.autor_nome} · {formatarRelativo(obs.criado_em)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {atendimento.aberto && (
                <div className="space-y-2">
                  <textarea
                    value={novaObs}
                    onChange={(e) => setNovaObs(e.target.value)}
                    placeholder="Adicionar observação interna..."
                    rows={3}
                    className="input-base resize-none text-xs"
                  />
                  <button
                    onClick={handleSalvarObs}
                    disabled={!novaObs.trim() || savingObs}
                    className="btn-secondary w-full text-xs"
                  >
                    {savingObs ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Salvar observação"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-slate-400 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={cn(
          "text-xs text-slate-700 font-medium text-right",
          valueClass
        )}
      >
        {value}
      </span>
    </div>
  );
}
