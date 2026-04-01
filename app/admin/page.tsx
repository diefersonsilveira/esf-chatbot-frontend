"use client";

import { useAtendimentos } from "@/hooks/useAtendimentos";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AtendimentoCard } from "@/components/chat/AtendimentoCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatarRelativo, INTENCAO_LABEL } from "@/lib/utils";
import {
  MessageSquare,
  Users,
  Inbox,
  CheckCircle,
  TrendingUp,
  Clock,
  Activity,
} from "lucide-react";
import type { Atendimento } from "@/lib/types";

export default function AdminDashboardPage() {
  const { atendimentos, loading } = useAtendimentos({
    role: "admin",
    onlyOpen: true,
    limitCount: 100,
  });

  const emAndamento = atendimentos.filter((a) => a.status === "em_atendimento");
  const aguardandoACS = atendimentos.filter((a) => a.status === "aguardando_acs");
  const aguardandoUsuario = atendimentos.filter((a) => a.status === "aguardando_usuario");
  const bot = atendimentos.filter((a) => a.status === "bot");

  const porACS = atendimentos.reduce<Record<string, { nome: string; count: number }>>(
    (acc, a) => {
      if (a.assignedTo && a.assignedToNome) {
        if (!acc[a.assignedTo]) {
          acc[a.assignedTo] = { nome: a.assignedToNome, count: 0 };
        }
        acc[a.assignedTo].count++;
      }
      return acc;
    },
    {}
  );

  const porIntencao = atendimentos.reduce<Record<string, number>>((acc, a) => {
    const key = a.intencao_ultima || "default";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topIntencoes = Object.entries(porIntencao)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Visão geral do atendimento em tempo real
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total em aberto"
          value={atendimentos.length}
          icon={Activity}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
          subtitle="atendimentos ativos"
        />
        <StatsCard
          title="Aguardando ACS"
          value={aguardandoACS.length}
          icon={Inbox}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          subtitle="na fila"
        />
        <StatsCard
          title="Em Atendimento"
          value={emAndamento.length}
          icon={MessageSquare}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle="com ACS humano"
        />
        <StatsCard
          title="No Bot"
          value={bot.length}
          icon={TrendingUp}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          subtitle="atendimento automático"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Atendimentos ativos
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
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
            <div className="card p-12 text-center">
              <p className="text-slate-400 text-sm">Nenhum atendimento ativo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atendimentos.slice(0, 8).map((a) => (
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

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Atendimentos por ACS
            </h3>
            {Object.keys(porACS).length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum ACS com atendimento ativo.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(porACS)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([uid, { nome, count }]) => (
                    <div key={uid} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 truncate">{nome}</span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums ml-3">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Top Intenções
            </h3>
            {topIntencoes.length === 0 ? (
              <p className="text-xs text-slate-400">Sem dados.</p>
            ) : (
              <div className="space-y-3">
                {topIntencoes.map(([intencao, count]) => (
                  <div key={intencao} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600 truncate">
                          {INTENCAO_LABEL[intencao] || intencao}
                        </span>
                        <span className="text-xs font-bold text-slate-900 tabular-nums ml-2">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all"
                          style={{
                            width: `${(count / atendimentos.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Status
            </h3>
            <div className="space-y-2">
              {[
                { label: "Bot", count: bot.length, color: "bg-slate-400" },
                { label: "Aguardando ACS", count: aguardandoACS.length, color: "bg-amber-400" },
                { label: "Em atendimento", count: emAndamento.length, color: "bg-emerald-400" },
                { label: "Aguard. usuário", count: aguardandoUsuario.length, color: "bg-sky-400" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                  <span className="text-xs text-slate-600 flex-1">{label}</span>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
