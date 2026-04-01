"use client";

import { useAuth } from "@/providers/AuthProvider copy";
import { useMeusAtendimentos, useAtendimentos } from "@/hooks/useAtendimentos";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AtendimentoCard } from "@/components/chat/AtendimentoCard";
import { Inbox, MessageSquare, CheckCircle, Clock } from "lucide-react";

export default function AcsDashboardPage() {
  const { user } = useAuth();
  const { atendimentos: meus, loading: loadingMeus } = useMeusAtendimentos(
    user?.uid || ""
  );
  const { atendimentos: fila, loading: loadingFila } = useAtendimentos({
    role: "acs",
    statusFilter: ["aguardando_acs"],
    onlyOpen: true,
  });

  const emAndamento = meus.filter((a) => a.status === "em_atendimento");
  const aguardandoUsuario = meus.filter((a) => a.status === "aguardando_usuario");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Bom dia, {user?.displayName?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Aqui está um resumo do seu atendimento hoje.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Fila de Espera"
          value={fila.length}
          icon={Inbox}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          subtitle={fila.length > 0 ? "aguardando ACS" : "Fila vazia"}
        />
        <StatsCard
          title="Em Atendimento"
          value={emAndamento.length}
          icon={MessageSquare}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle="atendimentos ativos"
        />
        <StatsCard
          title="Aguardando Resposta"
          value={aguardandoUsuario.length}
          icon={Clock}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          subtitle="aguardando usuário"
        />
        <StatsCard
          title="Meus Ativos"
          value={meus.length}
          icon={CheckCircle}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          subtitle="total sob minha gestão"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Fila de espera
            </h2>
            {fila.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                {fila.length} aguardando
              </span>
            )}
          </div>

          {loadingFila ? (
            <FilaSkeleton />
          ) : fila.length === 0 ? (
            <EmptyState icon={Inbox} message="Nenhum atendimento aguardando." />
          ) : (
            <div className="space-y-3">
              {fila.slice(0, 5).map((a) => (
                <AtendimentoCard key={a.id} atendimento={a} basePath="/acs/atendimento" />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Meus atendimentos
            </h2>
          </div>

          {loadingMeus ? (
            <FilaSkeleton />
          ) : meus.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              message="Você não tem atendimentos ativos."
            />
          ) : (
            <div className="space-y-3">
              {meus.slice(0, 5).map((a) => (
                <AtendimentoCard key={a.id} atendimento={a} basePath="/acs/atendimento" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilaSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-4">
          <div className="flex gap-3">
            <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 w-40 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="card p-10 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
