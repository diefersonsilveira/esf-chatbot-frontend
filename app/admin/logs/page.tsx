"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatarData, cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface LogEvento {
  id: string;
  tipo: string;
  detalhe: string;
  data_hora: string;
}

const TIPO_STYLE: Record<string, string> = {
  ERRO: "bg-red-100 text-red-700",
  AUTH: "bg-emerald-100 text-emerald-700",
  AUTH_FAIL: "bg-red-100 text-red-700",
  READY: "bg-sky-100 text-sky-700",
  QR: "bg-violet-100 text-violet-700",
  DISCONNECT: "bg-amber-100 text-amber-700",
  DEFAULT: "bg-slate-100 text-slate-600",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEvento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "logs_eventos"),
      orderBy("data_hora", "desc"),
      limit(200)
    );
    return onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LogEvento));
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logs do Sistema</h1>
          <p className="text-slate-500 text-sm mt-1">
            Últimos 200 eventos do bot e sistema
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="w-3.5 h-3.5" />
          Atualizado em tempo real
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 flex-1 rounded" />
                <div className="skeleton h-5 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">Nenhum log registrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors"
              >
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5",
                    TIPO_STYLE[log.tipo] || TIPO_STYLE.DEFAULT
                  )}
                >
                  {log.tipo}
                </span>
                <p className="text-sm text-slate-600 flex-1 leading-relaxed">
                  {log.detalhe || "—"}
                </p>
                <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                  {formatarData(log.data_hora)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
