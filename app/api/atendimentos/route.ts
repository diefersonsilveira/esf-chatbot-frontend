import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
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

    const role = painelDoc.data()?.role;
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const apenasAbertos = searchParams.get("abertos") !== "false";

    let queryRef = adminDb
      .collection("atendimentos_abertos")
      .orderBy("ultima_mensagem_em", "desc")
      .limit(100) as FirebaseFirestore.Query;

    if (apenasAbertos) {
      queryRef = queryRef.where("aberto", "==", true);
    }

    if (statusParam) {
      queryRef = queryRef.where("status", "==", statusParam);
    }

    if (role === "acs") {
      const assignedQuery = adminDb
        .collection("atendimentos_abertos")
        .where("assignedTo", "==", decoded.uid)
        .where("aberto", "==", true)
        .orderBy("ultima_mensagem_em", "desc")
        .limit(50);

      const filaQuery = adminDb
        .collection("atendimentos_abertos")
        .where("status", "==", "aguardando_acs")
        .where("aberto", "==", true)
        .orderBy("ultima_mensagem_em", "desc")
        .limit(50);

      const [assigned, fila] = await Promise.all([
        assignedQuery.get(),
        filaQuery.get(),
      ]);

      const map = new Map<string, FirebaseFirestore.DocumentData>();
      [...assigned.docs, ...fila.docs].forEach((d) =>
        map.set(d.id, { id: d.id, ...d.data() })
      );

      return NextResponse.json({ atendimentos: Array.from(map.values()) });
    }

    const snap = await queryRef.get();
    const atendimentos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ atendimentos });
  } catch (err) {
    console.error("GET /api/atendimentos:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
