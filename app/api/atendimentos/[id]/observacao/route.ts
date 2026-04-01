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

    const body = await request.json().catch(() => ({})) as { texto?: string };
    const texto = body?.texto;

    if (!texto?.trim()) {
      return NextResponse.json({ error: "Texto obrigatório" }, { status: 400 });
    }

    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "ID do atendimento inválido" },
        { status: 400 }
      );
    }

    const acsNome = painelDoc.data()?.nome || "ACS";

    await adminDb.collection("observacoes").add({
      atendimento_id: id,
      autor_uid: decoded.uid,
      autor_nome: acsNome,
      texto: texto.trim(),
      criado_em: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/atendimentos/[id]/observacao:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET(
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

    const { id } = await params;

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: "ID do atendimento inválido" },
        { status: 400 }
      );
    }

    const snap = await adminDb
      .collection("observacoes")
      .where("atendimento_id", "==", id)
      .orderBy("criado_em", "asc")
      .get();

    const observacoes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ observacoes });
  } catch (err) {
    console.error("GET /api/atendimentos/[id]/observacao:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
