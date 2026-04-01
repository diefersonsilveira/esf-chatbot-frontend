"use client";

import { useAtendimentos } from "@/hooks/useAtendimentos";
import { AtendimentoCard } from "@/components/chat/AtendimentoCard";
import { Inbox, RefreshCw } from "lucide-react";

export default function FilaPage() {
  const { atendimentos, loading } = useAtendimentos({
    role: "acs",
    statusFilter: ["aguardando_acs"],
    onlyOpen: true,
    limitCount: 50,
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fila de Atendimento</h1>
          <p className="text-slate-500 text-sm mt-1">
            Atendimentos aguardando um ACS disponível
          </p>
        </div>
        {!loading && (
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              atendimentos.length > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {atendimentos.length}{" "}
            {atendimentos.length === 1 ? "na fila" : "na fila"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4">
              <div className="flex gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-36 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : atendimentos.length === 0 ? (
        <div className="card p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center">
            <Inbox className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-1">Fila vazia!</p>
            <p className="text-sm text-slate-400">
              Nenhum atendimento aguardando no momento.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {atendimentos.map((a) => (
            <AtendimentoCard
              key={a.id}
              atendimento={a}
              basePath="/acs/atendimento"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-6 text-xs text-slate-400">
        <RefreshCw className="w-3 h-3" />
        Atualizado em tempo real via Firestore
      </div>
    </div>
  );
}
