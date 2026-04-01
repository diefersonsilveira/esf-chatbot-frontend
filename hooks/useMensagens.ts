"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  onSnapshot as onSnap,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Mensagem, Atendimento } from "@/lib/types";

export function useMensagens(atendimentoId: string, limitCount = 100) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!atendimentoId) return;

    const q = query(
      collection(db, "mensagens"),
      where("atendimento_id", "==", atendimentoId),
      orderBy("criado_em", "asc"),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Mensagem[];

        data.sort(
          (a, b) =>
            new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
        );

        setMensagens(data);
        setLoading(false);

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      },
      (err) => {
        console.error("Erro ao escutar mensagens:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [atendimentoId, limitCount]);

  return { mensagens, loading, bottomRef };
}

export function useAtendimentoRealtime(id: string) {
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnap(
      doc(db, "atendimentos_abertos", id),
      (snap) => {
        if (snap.exists()) {
          setAtendimento({ id: snap.id, ...snap.data() } as Atendimento);
        } else {
          setAtendimento(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao escutar atendimento:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  return { atendimento, loading };
}