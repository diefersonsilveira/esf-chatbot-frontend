import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function checkAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split("Bearer ")[1];

    const decoded = await adminAuth.verifyIdToken(token);

    const doc = await adminDb
      .collection("painel_usuarios")
      .doc(decoded.uid)
      .get();

    if (!doc.exists) return null;

    const data = doc.data();

    if (!data?.ativo || data.role !== "admin") {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Erro no checkAdmin:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await checkAdmin(request);

    if (!decoded) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const snap = await adminDb
      .collection("painel_usuarios")
      .orderBy("criadoEm", "desc")
      .get();

    const usuarios = snap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ usuarios });

  } catch (err) {
    console.error("Erro GET painel_usuarios:", err);

    return NextResponse.json(
      { error: "Erro interno ao listar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await checkAdmin(request);

    if (!decoded) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { email, senha, nome, role } = body;

    if (!email || !senha || !nome || !role) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (!["acs", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválida" },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    const agora = new Date().toISOString();

    await adminDb
      .collection("painel_usuarios")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        nome,
        role,
        ativo: true,
        criadoEm: agora,
        criadoPor: decoded.uid,
      });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
    });

  } catch (err: unknown) {
    console.error("Erro ao criar usuário:", err);

    const error = err as { code?: string; message?: string };

    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 }
      );
    }

    if (error.code === "auth/invalid-email") {
      return NextResponse.json(
        { error: "E-mail inválido" },
        { status: 400 }
      );
    }

    if (error.code === "auth/invalid-password") {
      return NextResponse.json(
        { error: "Senha inválida" },
        { status: 400 }
      );
    }

    if (error.code === "auth/weak-password") {
      return NextResponse.json(
        { error: "Senha muito fraca" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro interno",
        code: error.code || null,
        message: error.message || "Sem detalhes",
      },
      { status: 500 }
    );
  }
}
