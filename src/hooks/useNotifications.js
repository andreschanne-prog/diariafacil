// src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../firebase.js";
import { doc, updateDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Bigtech: NÃO pede permissão sozinho. Só quando o usuário clica.
export function useNotifications(usuario) {
  const [aviso, setAviso] = useState(null);
  const timeoutRef = useRef(null);

  const mostrarAviso = useCallback((titulo, corpo) => {
    setAviso({ titulo, corpo });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAviso(null), 5000);
  }, []);

  // Escuta mensagens com app aberto - sem pedir permissão
  useEffect(() => {
    if (!usuario?.uid) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    let unsub = null;
    try {
      const messaging = getMessaging();
      unsub = onMessage(messaging, (payload) => {
        mostrarAviso(payload.notification?.title || "Nova notificação", payload.notification?.body || "");
      });
    } catch {}
    return () => { if (unsub) unsub(); if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [usuario?.uid, mostrarAviso]);

  // Chame isso num botão "Ativar notificações" no Perfil
  const ativarNotificacoes = useCallback(async () => {
    if (!usuario?.uid) return false;
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") return false;
      const registro = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY,
        serviceWorkerRegistration: registro,
      });
      if (token && token !== usuario.fcmToken) {
        await updateDoc(doc(db, "usuarios", usuario.uid), { fcmToken: token, notificacoesAtivas: true });
      }
      return true;
    } catch (e) {
      console.error("[push]", e);
      return false;
    }
  }, [usuario]);

  return { aviso, setAviso, ativarNotificacoes };
}