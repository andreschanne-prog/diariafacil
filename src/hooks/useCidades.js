// src/hooks/useCidades.js - VERSÃO FINAL
import { useState, useEffect } from "react";

export function useCidades(uf) {
  const [cidades, setCidades] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!uf) {
      setCidades([]);
      return;
    }

    const ufLimpo = String(uf).toUpperCase().trim();
    let cancelado = false; // trava 1: se trocar de UF, ignora a resposta antiga

    // 1. Cache - se já buscou, usa e não busca de novo
    try {
      const cache = sessionStorage.getItem(`cidades_${ufLimpo}`);
      if (cache) {
        const lista = JSON.parse(cache);
        if (Array.isArray(lista) && lista.length > 0) {
          setCidades(lista);
          return;
        }
      }
    } catch {
      // cache com lixo - ignora e busca de novo
      sessionStorage.removeItem(`cidades_${ufLimpo}`);
    }

    setCarregando(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufLimpo}/municipios?orderBy=nome`)
      .then(res => res.json())
      .then(data => {
        if (cancelado) return;
        const nomes = (data || []).map(c => c.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
        setCidades(nomes);
        try { sessionStorage.setItem(`cidades_${ufLimpo}`, JSON.stringify(nomes)); } catch {}
      })
      .catch(() => { if (!cancelado) setCidades([]); })
      .finally(() => { if (!cancelado) setCarregando(false); });

    return () => { cancelado = true; };
  }, [uf]);

  return { cidades, carregando };
}