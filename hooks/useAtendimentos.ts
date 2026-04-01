"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  type Query,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Atendimento, AtendimentoStatus } from "@/lib/types";

interface UseAtendimentosOptions {
  role: "acs" | "admin";
  acsUid?: string;
  statusFilter?: AtendimentoStatus[];
  onlyOpen?: boolean;
  limitCount?: number;
}

export function useAtendimentos({
  role,
  acsUid,
  statusFilter,
  onlyOpen = true,
  limitCount = 50,
}: UseAtendimentosOptions) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints: ReturnType<typeof where>[] = [];

    if (onlyOpen) {
      constraints.push(where("aberto", "==", true));
    }

    if (statusFilter && statusFilter.length > 0) {
      constraints.push(where("status", "in", statusFilter));
    }

    const q = query(
      collection(db, "atendimentos_abertos"),
      ...constraints,
      orderBy("ultima_mensagem_em", "desc"),
      limit(limitCount)
    ) as Query<DocumentData>;

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Atendimento[];
        setAtendimentos(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Erro ao escutar atendimentos:", err);
        setError("Erro ao carregar atendimentos.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [role, acsUid, JSON.stringify(statusFilter), onlyOpen, limitCount]);

  return { atendimentos, loading, error };
}

export function useFilaACS() {
  return useAtendimentos({
    role: "acs",
    statusFilter: ["aguardando_acs"],
    onlyOpen: true,
  });
}

export function useMeusAtendimentos(acsUid: string) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!acsUid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "atendimentos_abertos"),
      where("assignedTo", "==", acsUid),
      where("aberto", "==", true),
      orderBy("ultima_mensagem_em", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Atendimento[];
        setAtendimentos(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Erro ao escutar meus atendimentos:", err);
        setError("Erro ao carregar seus atendimentos.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [acsUid]);

  return { atendimentos, loading, error };
}
