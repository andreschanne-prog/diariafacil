// src/hooks/useAdmin.js - CORRIGIDO
import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { doc, onSnapshot } from "firebase/firestore";

// Só Firestore. Crie collection "admins" com doc id = uid do admin
export function useAdmin(usuario) {
  const [isAdmin, setIsAdmin] = useState(false);

  // CORREÇÃO 1 - aceita uid OU id
  const uid = usuario?.uid || usuario?.id;

  useEffect(() => {
    if (!uid) { setIsAdmin(false); return; }

    // CORREÇÃO 2 - realtime, atualiza na hora sem F5
    const unsub = onSnapshot(
      doc(db, "admins", uid),
      (snap) => setIsAdmin(snap.exists()),
      (err) => {
        // CORREÇÃO 3 - mostra o erro no console em vez de esconder
        console.log("ERRO useAdmin:", err.code);
        setIsAdmin(false);
      }
    );
    return () => unsub();
  }, [uid]);

  return isAdmin;
}