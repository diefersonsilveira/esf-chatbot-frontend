"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Loader2, CheckCircle } from "lucide-react";

const CAMPOS_CONFIG = [
  { key: "mensagem_boas_vindas", label: "Boas-vindas", desc: "Primeira mensagem do bot", rows: 2 },
  { key: "mensagem_default", label: "Resposta padrão", desc: "Quando o bot não entende", rows: 2 },
  { key: "mensagem_pos_resposta", label: "Pós-resposta", desc: "Após cada resposta do bot", rows: 2 },
  { key: "mensagem_encerramento", label: "Encerramento", desc: "Ao encerrar o atendimento", rows: 2 },
  { key: "mensagem_inatividade_aviso", label: "Aviso de inatividade", desc: "Enviado após 25 min sem resposta", rows: 3 },
  { key: "mensagem_inatividade_encerramento", label: "Encerramento por inatividade", desc: "Enviado ao encerrar por inatividade", rows: 2 },
  { key: "mensagem_nps", label: "Pergunta NPS", desc: "Enviada ao encerrar para avaliação", rows: 2 },
];

type ConfigData = Record<string, string>;

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<ConfigData>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "configuracoes", "bot")).then((snap) => {
      if (snap.exists()) setConfig(snap.data() as ConfigData);
      setLoading(false);
    });
  }, []);

  const handleSalvar = async () => {
    setSalvando(true);
    await setDoc(doc(db, "configuracoes", "bot"), config, { merge: true });
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-2">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 text-sm mt-1">
            Edite as mensagens automáticas do bot
          </p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="btn-primary"
        >
          {salvando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : salvo ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {salvo ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>

      <div className="space-y-5">
        {CAMPOS_CONFIG.map(({ key, label, desc, rows }) => (
          <div key={key} className="card p-5">
            <div className="mb-3">
              <label className="block text-sm font-semibold text-slate-900 mb-0.5">
                {label}
              </label>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <textarea
              value={config[key] || ""}
              onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
              rows={rows}
              className="input-base resize-none text-sm"
              placeholder={`Mensagem de ${label.toLowerCase()}...`}
            />
          </div>
        ))}

        <div className="card p-5">
          <div className="mb-3">
            <label className="block text-sm font-semibold text-slate-900 mb-0.5">
              Palavras de encerramento
            </label>
            <p className="text-xs text-slate-400">
              Palavras que encerram o atendimento automaticamente (separadas por vírgula)
            </p>
          </div>
          <input
            value={
              Array.isArray(config.palavras_encerramento)
                ? (config.palavras_encerramento as string[]).join(", ")
                : config.palavras_encerramento || ""
            }
            onChange={(e) =>
              setConfig({
                ...config,
                palavras_encerramento: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as unknown as string,
              })
            }
            className="input-base"
            placeholder="sair, encerrar, fim, tchau"
          />
        </div>
      </div>
    </div>
  );
}
