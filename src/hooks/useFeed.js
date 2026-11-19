// src/hooks/useFeed.js - CORRIGIDO: vaga velha sem cidadeLower aparece
import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase.js";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

const normalizar = (txt) => {
  if (!txt) return "";
  return String(txt).toLowerCase()
    .replace(/\s*\/\s*[a-z]{2}\s*$/, "") // "Sinop / MT" -> "sinop"
    .replace(/\s*-\s*[a-z]{2}\s*$/, "") // "Sinop - MT" -> "sinop"
    .replace(/,\s*[a-z]{2}\s*$/, "") // "Sinop, MT" -> "sinop"
    .trim();
};

export function useFeed(logado, cidadeFiltro, estadoFiltro) {
  const [vagas, setVagas] = useState([]);
  const [anunciosBrutos, setAnunciosBrutos] = useState([]);

  useEffect(() => {
    if (!logado) return;

    // SEM where("cidadeLower") - senão vaga antiga sem esse campo some
    // Baixa as 100 mais recentes e filtra na memória
    const qVagas = query(collection(db, "vagas"), orderBy("criadoEm", "desc"), limit(100));

    const unsubVagas = onSnapshot(qVagas, (snap) => {
      setVagas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => console.error("[useFeed vagas]", e));

    const qAnuncios = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"), limit(30));
    const unsubAnuncios = onSnapshot(qAnuncios, (snap) => {
      setAnunciosBrutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => console.error("[useFeed anuncios]", e));

    return () => { unsubVagas(); unsubAnuncios(); };
  }, [logado]); // NÃO depende de cidadeFiltro - troca de cidade não recarrega do banco, só refiltra

  const anuncios = useMemo(() => {
    const cidade = normalizar(cidadeFiltro);
    const estado = (estadoFiltro || "").toLowerCase().trim();
    return anunciosBrutos
      .filter(a => {
        if (a.ativo === false) return false;
        if (!a.alcance || a.alcance === "brasil") return true;
        if (a.alcance === "estado") return (a.estadoLower || "").toLowerCase() === estado;
        if (a.alcance === "cidade") return normalizar(a.cidadeLower || a.cidade) === cidade;
        return true;
      })
      .sort((a, b) => (a.prioridade || 0) - (b.prioridade || 0));
  }, [anunciosBrutos, cidadeFiltro, estadoFiltro]);

  const feedVagas = useMemo(() => {
    const cidadeDesejada = normalizar(cidadeFiltro || "Sinop");
    const estadoDesejado = String(estadoFiltro || "MT").toLowerCase().trim();
    const hoje = new Date().toISOString().slice(0, 10);

    return vagas.filter(v => {
      // 1. Status
      if (v.fechada) return false;
      const st = String(v.status || "").toLowerCase().trim();
      if (st === "preenchida" || st === "fechada" || st === "concluida") return false;

      // 2. Data - só esconde, não fecha no banco
      if (v.datasEspecificas?.length) {
        const ultima = [...v.datasEspecificas].sort().at(-1);
        if (ultima < hoje) return false;
      }

      // 3. Cidade - aceita os 3 campos: novo, antigo e completo
      // Vaga sem cidadeLower (como a do Odair) passa aqui pelo campo cidade
      const cidadeVaga = normalizar(v.cidadeLower || v.cidade || v.cidadeCompleta || "");
      if (cidadeVaga && cidadeVaga !== cidadeDesejada) return false;
      // Se vaga não tem cidade nenhuma, mostra mesmo assim pra não sumir

      // 4. Estado
      if (v.estado && estadoDesejado && String(v.estado).toLowerCase().trim() !== estadoDesejado) return false;

      return true;
    });
  }, [vagas, cidadeFiltro, estadoFiltro]);

  return { vagas, feedVagas, anuncios };
}