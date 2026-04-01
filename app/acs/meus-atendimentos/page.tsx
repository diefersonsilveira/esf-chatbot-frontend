"use client";

import { useMeusAtendimentos } from "@/hooks/useAtendimentos";
import { AtendimentoCard } from "@/components/chat/AtendimentoCard";
import { useAuth } from "@/providers/AuthProvider copy";
import { MessageSquare } from "lucide-react";

export default function MeusAtendimentosPage() {
  const { user } = useAuth();
  const { atendimentos, loading } = useMeusAtendimentos(user?.uid || "");

  const emAndamento = atendimentos.filter((a) => a.status === "em_atendimento");
  const aguardando = atendimentos.filter((a) => a.status === "aguardando_usuario");
  const outros = atendimentos.filter(
    (a) => a.status !== "em_atendimento" && a.status !== "aguardando_usuario"
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Meus Atendimentos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Atendimentos atribuídos a você
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="flex gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-36 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : atendimentos.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-1">Nenhum atendimento ativo</p>
            <p className="text-sm text-slate-400">
              Vá para a fila e assuma um atendimento.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {emAndamento.length > 0 && (
            <Section title="Em atendimento" count={emAndamento.length} color="text-emerald-600">
              {emAndamento.map((a) => (
                <AtendimentoCard key={a.id} atendimento={a} basePath="/acs/atendimento" />
              ))}
            </Section>
          )}
          {aguardando.length > 0 && (
            <Section title="Aguardando usuário" count={aguardando.length} color="text-sky-600">
              {aguardando.map((a) => (
                <AtendimentoCard key={a.id} atendimento={a} basePath="/acs/atendimento" />
              ))}
            </Section>
          )}
          {outros.length > 0 && (
            <Section title="Outros" count={outros.length}>
              {outros.map((a) => (
                <AtendimentoCard key={a.id} atendimento={a} basePath="/acs/atendimento" />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  color = "text-slate-600",
  children,
}: {
  title: string;
  count: number;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`text-sm font-semibold ${color}`}>{title}</h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
