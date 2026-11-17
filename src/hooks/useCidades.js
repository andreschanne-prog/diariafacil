// src/hooks/useCidades.js
import { useState, useEffect } from "react";

export function useCidades(uf) {
  const [cidades, setCidades] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!uf) return;

    // 1. Se já buscou esse estado antes, usa do cache e não busca de novo
    const cache = sessionStorage.getItem(`cidades_${uf}`);
    if (cache) {
      setCidades(JSON.parse(cache));
      return;
    }

    setCarregando(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then(res => res.json())
      .then(data => {
        const nomes = data.map(c => c.nome); // só o nome: ["Sinop", "Sorriso", ...]
        setCidades(nomes);
        sessionStorage.setItem(`cidades_${uf}`, JSON.stringify(nomes));
      })
      .catch(() => setCidades([]))
      .finally(() => setCarregando(false));
  }, [uf]);

  return { cidades, carregando };
}