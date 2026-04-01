import { auth } from "@/lib/firebase";

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Não autenticado");
  return user.getIdToken();
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const AtendimentoService = {
  listar: (params?: { status?: string; abertos?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.abertos === false) qs.set("abertos", "false");
    return apiFetch<{ atendimentos: unknown[] }>(
      `/api/atendimentos?${qs.toString()}`
    );
  },

  assumir: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/atendimentos/${id}/assumir`, {
      method: "POST",
    }),

  responder: (id: string, texto: string) =>
    apiFetch<{ success: boolean }>(`/api/atendimentos/${id}/responder`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),

  finalizar: (id: string, motivo?: string) =>
    apiFetch<{ success: boolean }>(`/api/atendimentos/${id}/finalizar`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
    }),

  alterarStatus: (id: string, status: string) =>
    apiFetch<{ success: boolean }>(`/api/atendimentos/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  adicionarObservacao: (id: string, texto: string) =>
    apiFetch<{ success: boolean }>(`/api/atendimentos/${id}/observacao`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),

  listarObservacoes: (id: string) =>
    apiFetch<{ observacoes: unknown[] }>(`/api/atendimentos/${id}/observacao`),
};

export const PainelUsuarioService = {
  listar: () =>
    apiFetch<{ usuarios: unknown[] }>("/api/painel-usuarios"),

  criar: (dados: {
    email: string;
    senha: string;
    nome: string;
    role: string;
  }) =>
    apiFetch<{ uid: string }>("/api/painel-usuarios", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  alterarStatus: (uid: string, ativo: boolean) =>
    apiFetch<{ success: boolean }>(`/api/painel-usuarios/${uid}/status`, {
      method: "POST",
      body: JSON.stringify({ ativo }),
    }),
};
