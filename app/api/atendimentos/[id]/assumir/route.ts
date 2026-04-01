import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const painelDoc = await adminDb
      .collection("painel_usuarios")
      .doc(decoded.uid)
      .get();

    if (!painelDoc.exists || !painelDoc.data()?.ativo) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const acsNome = painelDoc.data()?.nome || "ACS";
    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "ID do atendimento inválido" },
        { status: 400 }
      );
    }

    const result = await adminDb.runTransaction(async (t) => {
      const ref = adminDb.collection("atendimentos_abertos").doc(id);
      const atendimentoDoc = await t.get(ref);

      if (!atendimentoDoc.exists) {
        throw new Error("Atendimento não encontrado");
      }

      const data = atendimentoDoc.data()!;
      const agora = new Date().toISOString();

      if (data.assignedTo && data.assignedTo !== decoded.uid) {
        throw new Error(`Atendimento já está com ${data.assignedToNome}`);
      }

      if (!data.aberto) {
        throw new Error("Atendimento já encerrado");
      }

      t.update(ref, {
        assignedTo: decoded.uid,
        assignedToNome: acsNome,
        isHuman: true,
        status: "em_atendimento",
        assumido_em: data.assumido_em || agora,
        atualizado_em: agora,

        ultima_mensagem_em: agora,
        aviso_inatividade_enviado: false,
        lembrete_menu_enviado: false,
      });

      return { success: true };
    });

    await adminDb.collection("mensagens").add({
      atendimento_id: id,
      autor: "sistema",
      texto: `${acsNome} assumiu o atendimento.`,
      origem: "takeover",
      criado_em: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";

    const status =
      msg.includes("não encontrado") ||
      msg.includes("já está com") ||
      msg.includes("já encerrado")
        ? 409
        : msg.includes("inválido")
        ? 400
        : msg.includes("Acesso negado")
        ? 403
        : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}