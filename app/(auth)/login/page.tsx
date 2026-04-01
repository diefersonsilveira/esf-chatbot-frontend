"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider copy";
import { Heart, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        setError("E-mail ou senha incorretos.");
      } else if (code === "auth/too-many-requests") {
        setError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setError("Erro ao entrar. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-sky-900/30 to-transparent" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              ESF Painel
            </span>
          </div>
        </div>

        <div className="relative space-y-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
            Estratégia de Saúde da Família
          </p>
          <h1 className="text-white text-4xl font-light leading-tight">
            Atendimento com
            <br />
            <span className="text-sky-400 font-semibold">mais qualidade.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Gerencie atendimentos, monitore a equipe e acompanhe métricas em
            tempo real. Tudo em um único lugar.
          </p>
        </div>

        <div className="relative flex items-center gap-6">
          {[
            { value: "100%", label: "Digital" },
            { value: "Real-time", label: "Atualizado" },
            { value: "Seguro", label: "Firebase Auth" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-white font-semibold text-sm">{item.value}</p>
              <p className="text-slate-500 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-900">ESF Painel</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              Bem-vindo de volta
            </h2>
            <p className="text-slate-500 text-sm">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input-base"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn-primary w-full mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Acesso restrito a profissionais autorizados.
            <br />
            Em caso de problemas, fale com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
