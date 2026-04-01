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

    const body = (await request.json().catch(() => ({}))) as { texto?: string };
    const texto = body?.texto;

    if (!texto || typeof texto !== "string" || !texto.trim()) {
      return NextResponse.json({ error: "Texto obrigatório" }, { status: 400 });
    }

    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "ID do atendimento inválido" },
        { status: 400 }
      );
    }

    const nomeCompleto = painelDoc.data()?.nome || "ACS";
    const primeiroNome = nomeCompleto.trim().split(/\s+/)[0] || "ACS";
    const role = painelDoc.data()?.role;

    const atendimentoRef = adminDb.collection("atendimentos_abertos").doc(id);
    const atendimentoDoc = await atendimentoRef.get();

    if (!atendimentoDoc.exists) {
      return NextResponse.json(
        { error: "Atendimento não encontrado" },
        { status: 404 }
      );
    }

    const atendimento = atendimentoDoc.data()!;

    if (!atendimento.aberto) {
      return NextResponse.json(
        { error: "Atendimento encerrado" },
        { status: 409 }
      );
    }

    if (role === "acs" && atendimento.assignedTo !== decoded.uid) {
      return NextResponse.json(
        { error: "Você não está responsável por este atendimento" },
        { status: 403 }
      );
    }

    if (!atendimento.jid_original) {
      return NextResponse.json(
        { error: "JID do usuário não encontrado" },
        { status: 400 }
      );
    }

    const textoLimpo = texto.trim();
    const agora = new Date().toISOString();

    await adminDb.collection("mensagens").add({
      atendimento_id: id,
      autor: "acs",
      autor_id: decoded.uid,
      autor_nome: primeiroNome,
      texto: textoLimpo,
      origem: "painel",
      criado_em: agora,
    });

    await adminDb.collection("mensagens_pendentes").add({
      jid_original: atendimento.jid_original,
      texto: `${primeiroNome}: ${textoLimpo}`,
      atendimento_id: id,
      autor_id: decoded.uid,
      autor_nome: primeiroNome,
      status: "pendente",
      criado_em: agora,
    });

    await atendimentoRef.set(
      {
        status: "aguardando_usuario",
        ultima_mensagem_em: agora,
        atualizado_em: agora,
        aviso_inatividade_enviado: false,
        lembrete_menu_enviado: false,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    console.error("POST /api/atendimentos/[id]/responder:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}