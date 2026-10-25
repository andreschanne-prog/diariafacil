import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import CardVaga from "../components/CardVaga";
import CardAnuncio from "../components/CardAnuncio";

export default function Feed({ vagas: vagasProp, anuncios: anunciosProp = [], onCandidatar, onVerPerfil, cidadeFiltro = "Sinop", estadoFiltro = "MT", paisFiltro = "Brasil" }) {
  const [vagasLocal, setVagasLocal] = useState([]);
  const [anunciosLocal, setAnunciosLocal] = useState([]);
  const [loading, setLoading] = useState(!vagasProp);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (vagasProp) {
      setVagasLocal(vagasProp);
      setLoading(false);
      return;
    }
    const q = query(collection(db, "vagas"), orderBy("criadoEm", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVagasLocal(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [vagasProp]);

  useEffect(() => {
    if (anunciosProp && anunciosProp.length > 0) {
      setAnunciosLocal(anunciosProp);
      return;
    }
    const qAnu = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"));
    const unsub = onSnapshot(qAnu, snap => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.ativo !== false);
      setAnunciosLocal(lista);
    });
    return () => unsub();
  }, [anunciosProp]);

  const listaBruta = vagasProp || vagasLocal;
  const abertas = listaBruta.filter(v => !v.fechada && v.status !== "preenchida");

  // FILTRO DE ANÚNCIOS POR LOCALIZAÇÃO
  const filtrarAnunciosPorLocal = (lista) => {
    const cidadeAtual = (cidadeFiltro || "").toLowerCase().trim();
    const estadoAtual = (estadoFiltro || "").toLowerCase().trim();
    const paisAtual = (paisFiltro || "Brasil").toLowerCase().trim();

    return lista.filter(a => {
      // Anúncio sem alcance = compatibilidade com antigos, mostra só em Sinop
      if (!a.alcance) {
        return cidadeAtual.includes("sinop") || a.cidadeLower === "sinop" || a.cidade === "Sinop";
      }

      if (a.alcance === "brasil") return true; // Brasil todo
      if (a.alcance === "pais") {
        const p = (a.pais || "Brasil").toLowerCase();
        if (p === "todos" || p === "todos os países" || p.includes("todos")) return true;
        return p === paisAtual;
      }
      if (a.alcance === "estado") {
        return (a.estadoLower || (a.estado || "").toLowerCase()) === estadoAtual;
      }
      if (a.alcance === "cidade") {
        return (a.cidadeLower || (a.cidade || "").toLowerCase()) === cidadeAtual;
      }
      return true;
    });
  };

  const listaBrutaAnuncios = anunciosProp?.length > 0 ? anunciosProp : anunciosLocal;
  const anunciosAtivos = filtrarAnunciosPorLocal(listaBrutaAnuncios);

  const termo = busca.toLowerCase().trim();
  const listaFiltrada = abertas.filter(v => {
    if (!termo) return true;
    const texto = `${v.titulo || ""} ${v.descricao || ""} ${v.tipo || ""} ${v.categoria || ""} ${v.cidade || ""}`.toLowerCase();
    return texto.includes(termo);
  });

  // A CADA 6 VAGAS, 1 ANÚNCIO
  const feedMisto = [];
  let anuncioIndex = 0;
  listaFiltrada.forEach((vaga, i) => {
    feedMisto.push({ tipo: "vaga", data: vaga, id: vaga.id });
    if ((i + 1) % 6 === 0 && anunciosAtivos[anuncioIndex]) {
      feedMisto.push({
        tipo: "anuncio",
        data: anunciosAtivos[anuncioIndex],
        id: `anuncio-${anunciosAtivos[anuncioIndex].id}-${i}`
      });
      anuncioIndex++;
      if (anuncioIndex >= anunciosAtivos.length) anuncioIndex = 0;
    }
  });

  if (loading) {
    return (
      <div className="max-w-[640px] mx-auto px-4 pt-20">
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-white border rounded-2xl"></div>
          <div className="h-20 bg-white border rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-6 pb-28">
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar: garçom, diarista, faxina..."
            className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full text-[11px]">✕</button>
          )}
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">Vagas abertas</h2>
        <p className="text-[12px] text-slate-500 mt-1">
          {cidadeFiltro} e região • {listaFiltrada.length} vaga(s) {termo && `para "${termo}"`} {anunciosAtivos.length > 0 && `• ${anunciosAtivos.length} anúncio(s) nessa região`}
        </p>
      </div>

      <div className="space-y-4">
        {feedMisto.length === 0 ? (
          <div className="bg-white border border-dashed rounded-2xl p-10 text-center">
            <p className="text-[13px] font-medium text-slate-700">{termo ? `Nenhuma vaga para "${termo}"` : "Nenhuma vaga aberta agora"}</p>
            <button onClick={() => setBusca("")} className="mt-3 text-[11px] underline text-slate-500">Limpar pesquisa</button>
          </div>
        ) : (
          feedMisto.map(item =>
            item.tipo === "vaga" ? (
              <CardVaga key={item.id} vaga={item.data} onCandidatar={onCandidatar} onVerPerfil={onVerPerfil} />
            ) : (
              <CardAnuncio key={item.id} anuncio={item.data} />
            )
          )
        )}
      </div>
    </div>
  );
}