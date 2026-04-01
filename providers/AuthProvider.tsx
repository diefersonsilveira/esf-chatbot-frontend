"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AuthUser, PainelUsuario } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const resolveUser = useCallback(
    async (firebaseUser: User | null): Promise<string | null> => {
      if (!firebaseUser) {
        setUser(null);
        document.cookie = "session=; Max-Age=0; path=/";
        document.cookie = "role=; Max-Age=0; path=/";
        setLoading(false);
        return null;
      }

      try {
        const painelDoc = await getDoc(
          doc(db, "painel_usuarios", firebaseUser.uid)
        );

        if (!painelDoc.exists()) {
          await firebaseSignOut(auth);
          setUser(null);
          setLoading(false);
          return null;
        }

        const painelData = painelDoc.data() as PainelUsuario;

        if (!painelData.ativo) {
          await firebaseSignOut(auth);
          setUser(null);
          setLoading(false);
          return null;
        }

        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: painelData.nome || firebaseUser.displayName,
          role: painelData.role,
          painelUsuario: painelData,
        };

        const expiresIn = 7 * 24 * 60 * 60;
        document.cookie = `session=1; Max-Age=${expiresIn}; path=/; SameSite=Strict`;
        document.cookie = `role=${painelData.role}; Max-Age=${expiresIn}; path=/; SameSite=Strict`;

        setUser(authUser);
        return painelData.role;
      } catch (err) {
        console.error("Erro ao resolver usuário:", err);
        setUser(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, resolveUser);
    return () => unsubscribe();
  }, [resolveUser]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      const role = await resolveUser(credential.user);

      router.push(role === "admin" ? "/admin" : "/acs");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    document.cookie = "session=; Max-Age=0; path=/";
    document.cookie = "role=; Max-Age=0; path=/";
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
