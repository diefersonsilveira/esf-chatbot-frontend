"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { INTENCAO_LABEL, formatarData } from "@/lib/utils";
import {
  BarChart3,
  Star,
  TrendingUp,
  Clock,
  Users,
  Download,
} from "lucide-react";

interface Atendimento {
  id: string;
  status: string;
  nps_nota?: number;
  nps_respondido?: boolean;
  assignedTo?: string;
  assignedToNome?: string;
  intencao_ultima?: string;
  criado_em: string;
  finalizado_em?: string;
  assumido_em?: string;
}

export default function RelatoriosPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "atendimentos_abertos"),
      orderBy("criado_em", "desc"),
      limit(500)
    );
    getDocs(q).then((snap) => {
      setAtendimentos(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Atendimento)
      );
      setLoading(false);
    });
  }, []);

  const finalizados = atendimentos.filter((a) =>
    ["finalizado", "encerrado_por_inatividade"].includes(a.status)
  );
  const comNPS = atendimentos.filter(
    (a) => a.nps_respondido && a.nps_nota !== undefined && a.nps_nota !== null
  );
  const mediaNPS =
    comNPS.length > 0
      ? (comNPS.reduce((s, a) => s + (a.nps_nota || 0), 0) / comNPS.length).toFixed(1)
      : "—";

  const npsPorACS: Record<string, { nome: string; notas: number[] }> = {};
  for (const a of comNPS) {
    if (!a.assignedTo || !a.assignedToNome) continue;
    if (!npsPorACS[a.assignedTo])
      npsPorACS[a.assignedTo] = { nome: a.assignedToNome, notas: [] };
    npsPorACS[a.assignedTo].notas.push(a.nps_nota || 0);
  }

  const porIntencao: Record<string, number> = {};
  for (const a of atendimentos) {
    const k = a.intencao_ultima || "default";
    porIntencao[k] = (porIntencao[k] || 0) + 1;
  }
  const topIntencoes = Object.entries(porIntencao)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const tempos = finalizados
    .filter((a) => a.assumido_em && a.finalizado_em)
    .map((a) => {
      const diff =
        new Date(a.finalizado_em!).getTime() -
        new Date(a.assumido_em!).getTime();
      return diff / 60000;
    });

  const tempoMedio =
    tempos.length > 0
      ? (tempos.reduce((s, t) => s + t, 0) / tempos.length).toFixed(0)
      : null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 text-sm mt-1">
            Métricas operacionais e de qualidade
          </p>
        </div>
        <button
          onClick={() => {
            const csv = [
              ["ID", "Status", "Intenção", "NPS", "ACS", "Criado em"].join(","),
              ...atendimentos.map((a) =>
                [
                  a.id,
                  a.status,
                  a.intencao_ultima || "",
                  a.nps_nota ?? "",
                  a.assignedToNome || "",
                  a.criado_em,
                ].join(",")
              ),
            ].join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "relatorio-atendimentos.csv";
            link.click();
          }}
          className="btn-secondary"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total de Atendimentos"
          value={atendimentos.length}
          icon={BarChart3}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
        />
        <StatsCard
          title="NPS Médio"
          value={mediaNPS}
          subtitle={`${comNPS.length} avaliações`}
          icon={Star}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Tempo Médio"
          value={tempoMedio ? `${tempoMedio} min` : "—"}
          subtitle="de atendimento humano"
          icon={Clock}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Finalizados"
          value={finalizados.length}
          icon={TrendingUp}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            NPS por ACS
          </h2>
          {Object.keys(npsPorACS).length === 0 ? (
            <p className="text-xs text-slate-400">Sem avaliações registradas.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(npsPorACS)
                .map(([uid, { nome, notas }]) => ({
                  uid,
                  nome,
                  media: notas.reduce((s, n) => s + n, 0) / notas.length,
                  total: notas.length,
                }))
                .sort((a, b) => b.media - a.media)
                .map(({ uid, nome, media, total }) => (
                  <div key={uid} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-slate-700 truncate">{nome}</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums ml-2">
                          {media.toFixed(1)}
                          <span className="text-xs text-slate-400 font-normal">/10</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(media / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{total} avaliações</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-500" />
            Intenções mais frequentes
          </h2>
          {topIntencoes.length === 0 ? (
            <p className="text-xs text-slate-400">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {topIntencoes.map(([intencao, count]) => (
                <div key={intencao} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-36 truncate flex-shrink-0">
                    {INTENCAO_LABEL[intencao] || intencao}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{
                        width: `${(count / atendimentos.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums w-8 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
