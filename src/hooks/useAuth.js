import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Sem cidade fixa. Sem localStorage. Sem loop.
export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [logado, setLogado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsuario(null);
        setLogado(false);
        setCarregando(false);
        return;
      }
      try {
        const ref = doc(db, "usuarios", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const dados = snap.data();
          setUsuario({ ...dados, uid: user.uid, email: user.email, foto: dados.foto || user.photoURL || "" });
        } else {
          // Usuário novo do Google: cria sem cidade, sem forçar Sinop
          const novo = {
            nome: user.displayName || "Cliente",
            email: user.email,
            contato: "",
            cidade: null,
            feedCidade: null,
            feedEstado: null,
            estado: null,
            foto: user.photoURL || "",
            termosAceitos: true,
            privacidadeAceita: true,
            dataAceite: serverTimestamp(),
            criadoEm: serverTimestamp(),
            provedor: "google",
            perfilCompleto: false,
          };
          await setDoc(ref, novo);
          setUsuario({ ...novo, uid: user.uid });
        }
        setLogado(true);
      } catch (e) {
        console.error("[useAuth]", e);
        // Fallback: deixa entrar mesmo com erro no Firestore
        setUsuario({ nome: user.displayName || "", email: user.email, foto: user.photoURL || "", uid: user.uid });
        setLogado(true);
      } finally {
        setCarregando(false);
      }
    });
    return () => unsub();
  }, []);

  const atualizarUsuario = useCallback((novosDados) => {
    setUsuario(prev => prev ? { ...prev, ...novosDados } : prev);
  }, []);

  const sair = useCallback(async () => {
    await auth.signOut();
    setUsuario(null);
    setLogado(false);
  }, []);

  return { usuario, logado, carregando, atualizarUsuario, sair, setUsuario };
}