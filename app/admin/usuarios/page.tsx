"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PainelUsuarioService } from "@/services/api";
import type { PainelUsuario } from "@/lib/types";
import { formatarData, iniciais, cn } from "@/lib/utils";
import { UserPlus, ShieldCheck, User, Check, X, Loader2 } from "lucide-react";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<PainelUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "acs" });
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "painel_usuarios"),
      orderBy("criadoEm", "desc")
    );
    return onSnapshot(q, (snap) => {
      setUsuarios(
        snap.docs.map(
          (d) => ({ ...d.data(), uid: d.id }) as PainelUsuario
        )
      );
      setLoading(false);
    });
  }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriando(true);
    setErro(null);
    try {
      await PainelUsuarioService.criar(form);
      setShowForm(false);
      setForm({ nome: "", email: "", senha: "", role: "acs" });
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao criar usuário");
    } finally {
      setCriando(false);
    }
  };

  const handleToggleAtivo = async (uid: string, ativo: boolean) => {
    await PainelUsuarioService.alterarStatus(uid, !ativo);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie ACS e Administradores do sistema
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Novo usuário
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 animate-in">
          <h2 className="text-base font-semibold text-slate-900 mb-5">
            Novo usuário
          </h2>
          <form onSubmit={handleCriar} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input-base"
                placeholder="Nome completo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-base"
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha inicial</label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className="input-base"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Perfil</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-base"
              >
                <option value="acs">ACS</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {erro && (
              <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {erro}
              </div>
            )}

            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={criando} className="btn-primary">
                {criando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar usuário"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5">
                Usuário
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5">
                Perfil
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5">
                Criado em
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5">
                Status
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="skeleton w-8 h-8 rounded-full" />
                      <div className="space-y-1.5">
                        <div className="skeleton h-3.5 w-32 rounded" />
                        <div className="skeleton h-3 w-44 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="skeleton h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-4"><div className="skeleton h-3.5 w-28 rounded" /></td>
                  <td className="px-4 py-4"><div className="skeleton h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-4" />
                </tr>
              ))
            ) : (
              usuarios.map((u) => (
                <tr key={u.uid} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                          u.role === "admin" ? "bg-amber-500" : "bg-sky-500"
                        )}
                      >
                        {iniciais(u.nome)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.nome}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                        u.role === "admin"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-700"
                      )}
                    >
                      {u.role === "admin" ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      {u.role === "admin" ? "Admin" : "ACS"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {formatarData(u.criadoEm)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                        u.ativo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      )}
                    >
                      {u.ativo ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {u.ativo ? "Ativo" : "Bloqueado"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleAtivo(u.uid, u.ativo)}
                      className={cn(
                        "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                        u.ativo
                          ? "text-red-600 hover:bg-red-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      {u.ativo ? "Bloquear" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
