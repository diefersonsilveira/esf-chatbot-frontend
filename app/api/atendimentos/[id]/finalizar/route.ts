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

    const { motivo } = (await request.json().catch(() => ({}))) as {
      motivo?: string;
    };

    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "ID do atendimento inválido" },
        { status: 400 }
      );
    }

    const acsNome = painelDoc.data()?.nome || "ACS";
    const role = painelDoc.data()?.role;
    const atendimentoRef = adminDb.collection("atendimentos_abertos").doc(id);

    let jidOriginal: string;

    try {
      const result = await adminDb.runTransaction(async (t) => {
        const atendimentoDoc = await t.get(atendimentoRef);

        if (!atendimentoDoc.exists) {
          throw new Error("Atendimento não encontrado");
        }

        const data = atendimentoDoc.data()!;

        if (!data.aberto) {
          throw new Error("Atendimento já encerrado");
        }

        if (role === "acs" && data.assignedTo !== decoded.uid) {
          throw new Error("Você não está responsável por este atendimento");
        }

        if (!data.jid_original) {
          throw new Error("JID do usuário não encontrado");
        }

        const agora = new Date().toISOString();

        t.set(
          atendimentoRef,
          {
            aberto: false,
            isHuman: false,
            status: "finalizado",
            motivo_encerramento: motivo || "encerramento_acs",
            finalizado_em: agora,
            encerrado_em: agora,
            atualizado_em: agora,
            finalizado_por: decoded.uid,
            finalizado_por_nome: acsNome,
            aguardando_nps: true,
            nps_enviado: true,
            nps_respondido: false,
            aviso_inatividade_enviado: false,
            lembrete_menu_enviado: false,
          },
          { merge: true }
        );

        return { jidOriginal: data.jid_original as string, agora };
      });

      jidOriginal = result.jidOriginal;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      const status = msg.includes("não encontrado")
        ? 404
        : msg.includes("já encerrado")
        ? 409
        : msg.includes("não está responsável")
        ? 403
        : msg.includes("JID")
        ? 400
        : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    const agora = new Date().toISOString();

    const agoraNps = new Date(Date.parse(agora) + 1).toISOString();

    const msgEncerramento =
      "Atendimento encerrado. Quando precisar, envie uma nova mensagem. 👋";
    const msgNps =
      "Antes de sair, de *0 a 10*, como você avalia este atendimento?";

    await adminDb.collection("mensagens").add({
      atendimento_id: id,
      autor: "sistema",
      texto: `Atendimento finalizado por ${acsNome}.`,
      origem: "finalizacao",
      criado_em: agora,
    });

    await adminDb.collection("mensagens").add({
      atendimento_id: id,
      autor: "bot",
      texto: msgEncerramento,
      origem: "encerramento_acs",
      criado_em: agora,
    });

    await adminDb.collection("mensagens_pendentes").add({
      jid_original: jidOriginal,
      texto: msgEncerramento,
      atendimento_id: id,
      status: "pendente",
      criado_em: agora,
    });

    await adminDb.collection("mensagens").add({
      atendimento_id: id,
      autor: "bot",
      texto: msgNps,
      origem: "nps",
      criado_em: agoraNps,
    });

    await adminDb.collection("mensagens_pendentes").add({
      jid_original: jidOriginal,
      texto: msgNps,
      atendimento_id: id,
      status: "pendente",
      criado_em: agoraNps,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    console.error("POST /api/atendimentos/[id]/finalizar:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
