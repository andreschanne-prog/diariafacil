import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase.js";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

// Antes: baixava TODAS as vagas do Brasil e filtrava no celular.
// Agora: Firestore já devolve só a cidade, com limite.
export function useFeed(logado, cidadeFiltro, estadoFiltro) {
  const [vagas, setVagas] = useState([]);
  const [anunciosBrutos, setAnunciosBrutos] = useState([]);

  useEffect(() => {
    if (!logado) return;

    const cidadeLower = (cidadeFiltro || "").toLowerCase().trim();

    // Vagas: só da cidade, só abertas, máx 50
    // IMPORTANTE: criar índice no Firebase para (cidadeLower + criadoEm)
    // E salvar cidadeLower quando criar a vaga
    const qVagas = cidadeLower
      ? query(
          collection(db, "vagas"),
          where("cidadeLower", "==", cidadeLower),
          orderBy("criadoEm", "desc"),
          limit(50)
        )
      : query(collection(db, "vagas"), orderBy("criadoEm", "desc"), limit(50));

    const unsubVagas = onSnapshot(qVagas, (snap) => {
      setVagas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => console.error("[useFeed vagas]", e));

    const qAnuncios = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"), limit(30));
    const unsubAnuncios = onSnapshot(qAnuncios, (snap) => {
      setAnunciosBrutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => console.error("[useFeed anuncios]", e));

    return () => { unsubVagas(); unsubAnuncios(); };
  }, [logado, cidadeFiltro]);

  const anuncios = useMemo(() => {
    const cidade = (cidadeFiltro || "").toLowerCase().trim();
    const estado = (estadoFiltro || "").toLowerCase().trim();

    return anunciosBrutos
      .filter(a => {
        if (a.ativo === false) return false;
        if (!a.alcance || a.alcance === "brasil") return true;
        if (a.alcance === "estado") return (a.estadoLower || "").toLowerCase() === estado;
        if (a.alcance === "cidade") return (a.cidadeLower || "").toLowerCase() === cidade;
        return true;
      })
      // Sem Math.random() no sort - isso embaralhava o feed a cada render
      .sort((a, b) => (a.prioridade || 0) - (b.prioridade || 0));
  }, [anunciosBrutos, cidadeFiltro, estadoFiltro]);

  const feedVagas = useMemo(() => {
    return vagas.filter(v => !v.fechada && v.status !== "preenchida");
  }, [vagas]);

  return { vagas, feedVagas, anuncios };
}