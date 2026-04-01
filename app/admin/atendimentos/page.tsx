"use client";

import { useState } from "react";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { AtendimentoCard } from "@/components/chat/AtendimentoCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AtendimentoStatus } from "@/lib/types";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: AtendimentoStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aguardando_acs", label: "Aguardando ACS" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "aguardando_usuario", label: "Aguard. usuário" },
  { value: "bot", label: "Bot" },
  { value: "finalizado", label: "Finalizados" },
];

export default function AdminAtendimentosPage() {
  const [statusFiltro, setStatusFiltro] = useState<AtendimentoStatus | "todos">("todos");
  const [busca, setBusca] = useState("");

  const { atendimentos, loading } = useAtendimentos({
    role: "admin",
    statusFilter:
      statusFiltro !== "todos" ? [statusFiltro] : undefined,
    onlyOpen: statusFiltro !== "finalizado",
    limitCount: 100,
  });

  const filtrados = busca
    ? atendimentos.filter(
        (a) =>
          a.nome_contato_whatsapp?.toLowerCase().includes(busca.toLowerCase()) ||
          a.usuario_id.includes(busca) ||
          a.assignedToNome?.toLowerCase().includes(busca.toLowerCase())
      )
    : atendimentos;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Atendimentos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie e acompanhe todos os atendimentos
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou ACS..."
            className="input-base pl-10 py-2"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFiltro(value)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                statusFiltro === value
                  ? "bg-sky-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        {filtrados.length} atendimento{filtrados.length !== 1 ? "s" : ""}
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4">
              <div className="flex gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-40 rounded" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-slate-400 text-sm">Nenhum atendimento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((a) => (
            <AtendimentoCard
              key={a.id}
              atendimento={a}
              basePath="/admin/atendimentos"
              showAssigned
            />
          ))}
        </div>
      )}
    </div>
  );
}
