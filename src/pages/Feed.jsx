// src/pages/Feed.jsx - CORRIGIDO: vaga não some mais
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import CardVaga from "../components/CardVaga";
import CardAnuncio from "../components/CardAnuncio";

const normalizarTexto = (txt) => {
  if (!txt) return "";
  return String(txt).toLowerCase()
    .replace(/\s*\/\s*[a-z]{2}\s*$/, "") // "Sinop / MT" -> "sinop"
    .replace(/\s*-\s*[a-z]{2}\s*$/, "") // "Sinop - MT" -> "sinop"
    .replace(/,\s*[a-z]{2}\s*$/, "") // "Sinop, MT" -> "sinop"
    .trim();
};

const formatarDataLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const embaralharArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function BannerTopo() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [carregouBanco, setCarregouBanco] = useState(false);
  useEffect(() => {
    const q = query(collection(db, "banners_topo"));
    const unsub = onSnapshot(q, (snap) => {
      const agora = new Date();
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => {
        if (b.ativo === false) return false;
        if (!b.expiraEm) return true;
        try { const exp = b.expiraEm.toDate ? b.expiraEm.toDate() : new Date(b.expiraEm); return exp > agora; } catch { return true; }
      });
      setBanners(embaralharArray(lista)); setIndex(0); setCarregouBanco(true);
    }, () => setCarregouBanco(true));
    return () => unsub();
  }, []);
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);
  if (banners.length === 0) {
    if (!carregouBanco) return <div className="sticky top-0 z-30 w-full bg-slate-100 border-b border-slate-200 animate-pulse flex items-center justify-center" style={{ height: 70, marginBottom: 16 }}><span style={{ fontSize: 10, color: "#94A3B8" }}>Carregando destaque...</span></div>;
    return null;
  }
  const banner = banners[index] || banners[0];
  if (banner.tipo === "adsense") return <div className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 flex justify-center" style={{ marginBottom: 16 }}><div className="w-full" style={{ maxWidth: 640 }}><p className="text-center" style={{ fontSize: 8, color: "#94A3B8", padding: "2px 0" }}>PUBLICIDADE</p><div className="bg-slate-50 flex items-center justify-center" style={{ minHeight: 80 }} dangerouslySetInnerHTML={{ __html: banner.codigoAdsense || "" }} /></div></div>;
  const modoAjuste = banner.objectFit || banner.modoExibicao || "cover";
  const classeAjuste = modoAjuste === "contain" ? "object-contain" : modoAjuste === "fill" ? "object-fill" : "object-cover";
  return (
    <div className="sticky top-0 z-30 w-full bg-black" style={{ marginBottom: 16 }}>
      <div className="w-full mx-auto relative overflow-hidden" style={{ maxWidth: 640, height: 100 }}>
        <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer" className="block w-full h-full"><img src={banner.imagem} alt={banner.titulo || "Destaque"} className={`w-full h-full ${classeAjuste} block mx-auto`} /></a>
        <span className="absolute font-bold bg-black text-white rounded" style={{ top: 6, left: 8, fontSize: 8, padding: "2px 6px", backgroundColor: "rgba(0,0,0,0.7)" }}>ANÚNCIO</span>
      </div>
    </div>
  );
}

// MUDOU AQUI: agora recebe usuario e descobre a cidade dele
export default function Feed({ vagas: vagasProp, anuncios: anunciosProp = [], onCandidatar, onVerPerfil, usuario, cidadeFiltro: cidadeProp, estadoFiltro: estadoProp, paisFiltro = "Brasil" }) {
  const [vagasLocal, setVagasLocal] = useState([]);
  const [anunciosLocal, setAnunciosLocal] = useState([]);
  const [loading, setLoading] = useState(!vagasProp);
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  // Cidade efetiva: 1º prop do App, 2º usuario, 3º Sinop. Nunca fica vazia / travada.
  const cidadeFiltro = cidadeProp || usuario?.feedCidade || usuario?.cidade || "Sinop";
  const estadoFiltro = estadoProp || usuario?.feedEstado || usuario?.estado || "MT";

  useEffect(() => {
    if (vagasProp) { setVagasLocal(vagasProp); setLoading(false); return; }
    const q = query(collection(db, "vagas"), orderBy("criadoEm", "desc"));
    const unsub = onSnapshot(q, (snapshot) => { setVagasLocal(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return () => unsub();
  }, [vagasProp]);

  useEffect(() => {
    if (anunciosProp && anunciosProp.length > 0) { setAnunciosLocal(anunciosProp); return; }
    const qAnu = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"));
    const unsub = onSnapshot(qAnu, snap => { const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.ativo !== false); setAnunciosLocal(lista); });
    return () => unsub();
  }, [anunciosProp]);

  const handleAtualizarFeed = () => { setAtualizando(true); setBusca(""); setTimeout(() => setAtualizando(false), 600); };

  const listaBruta = vagasProp || vagasLocal;
  const cidadeDesejada = normalizarTexto(cidadeFiltro);
  const estadoDesejado = (estadoFiltro || "").toLowerCase().trim();
  const hojeStr = formatarDataLocal(new Date());

  const vagasDaCidade = listaBruta.filter(v => {
    if (v.fechada) return false;
    const st = String(v.status || "").toLowerCase().trim();
    if (st === "preenchida" || st === "fechada" || st === "concluida") return false;
    // Só esconde por data, NUNCA fecha no banco daqui
    if (v.datasEspecificas && v.datasEspecificas.length > 0) {
      const ultima = [...v.datasEspecificas].sort().at(-1);
      if (ultima < hojeStr) return false;
    }
    // Aceita cidade, cidadeLower e cidadeCompleta - vaga velha não some
    const cidadeVagaRaw = v.cidadeLower || v.cidade || v.cidadeCompleta || "";
    if (cidadeVagaRaw) {
      const cidadeVaga = normalizarTexto(cidadeVagaRaw);
      if (cidadeVaga !== cidadeDesejada) return false;
    }
    // Se a vaga não tem cidade, mostra mesmo assim pra não sumir
    if (v.estado && estadoDesejado) {
      const estadoVaga = String(v.estado).toLowerCase().trim();
      if (estadoVaga !== estadoDesejado) return false;
    }
    return true;
  });

  const filtrarAnunciosPorLocal = (lista) => {
    const cidadeAtual = normalizarTexto(cidadeFiltro);
    const estadoAtual = (estadoFiltro || "").toLowerCase().trim();
    const paisAtual = (paisFiltro || "Brasil").toLowerCase().trim();
    const agora = new Date();
    return lista.filter(a => {
      if (a.expiraEm) { try { const d = a.expiraEm.toDate ? a.expiraEm.toDate() : new Date(a.expiraEm); if (d < agora) return false; } catch {} }
      if (!a.alcance) return cidadeAtual === "sinop" || a.cidadeLower === "sinop" || a.cidade === "Sinop";
      if (a.alcance === "brasil") return true;
      if (a.alcance === "pais") { const p = (a.pais || "Brasil").toLowerCase(); if (p === "todos" || p.includes("todos")) return true; return p === paisAtual; }
      if (a.alcance === "estado") return (a.estadoLower || (a.estado || "").toLowerCase()) === estadoAtual;
      if (a.alcance === "cidade") return normalizarTexto(a.cidadeLower || a.cidade) === cidadeAtual;
      return true;
    });
  };

  const listaBrutaAnuncios = anunciosProp?.length > 0 ? anunciosProp : anunciosLocal;
  const anunciosAtivos = filtrarAnunciosPorLocal(listaBrutaAnuncios);
  const termo = busca.toLowerCase().trim();
  let listaFiltrada = vagasDaCidade.filter(v => {
    if (!termo) return true;
    const texto = `${v.titulo || ""} ${v.descricao || ""} ${v.tipo || ""} ${v.categoria || ""} ${v.cidade || ""}`.toLowerCase();
    return texto.includes(termo);
  });
  listaFiltrada = [...listaFiltrada].sort((a, b) => {
    const aRel = a.relampago || a.urgente ? 1 : 0; const bRel = b.relampago || b.urgente ? 1 : 0;
    if (aRel !== bRel) return bRel - aRel;
    const da = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0; const db2 = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
    return db2 - da;
  });

  const feedMisto = []; let anuncioIndex = 0;
  listaFiltrada.forEach((vaga, i) => {
    feedMisto.push({ tipo: "vaga", data: vaga, id: vaga.id });
    if ((i + 1) % 6 === 0 && anunciosAtivos[anuncioIndex]) { feedMisto.push({ tipo: "anuncio", data: anunciosAtivos[anuncioIndex], id: `anuncio-${anunciosAtivos[anuncioIndex].id}-${i}` }); anuncioIndex++; if (anuncioIndex >= anunciosAtivos.length) anuncioIndex = 0; }
  });

  if (loading) return <div className="mx-auto px-4" style={{ maxWidth: 640, paddingTop: 80 }}><div className="animate-pulse" style={{ display: "flex", flexDirection: "column", gap: 12 }}><div className="h-12 bg-white border rounded-2xl" /><div className="h-20 bg-white border rounded-2xl" /></div></div>;
  const totalRelampago = listaFiltrada.filter(v => v.relampago || v.urgente).length;

  return (
    <div className="mx-auto px-4" style={{ maxWidth: 640, paddingBottom: 112 }}>
      <BannerTopo />
      <div className="flex gap-2" style={{ marginBottom: 16, marginTop: 8 }}>
        <div className="relative flex-1">
          <span className="absolute" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={`Pesquisar vagas em ${cidadeFiltro}...`} className="w-full bg-white border border-slate-200 rounded-full" style={{ height: 44, paddingLeft: 40, paddingRight: 40, fontSize: 13, outline: "none" }} />
          {busca && <button onClick={() => setBusca("")} className="absolute bg-slate-100 rounded-full" style={{ right: 12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, fontSize: 11 }}>✕</button>}
        </div>
        <button onClick={handleAtualizarFeed} className="bg-white border border-slate-200 rounded-full font-medium flex items-center gap-1.5 shrink-0" style={{ height: 44, paddingLeft: 16, paddingRight: 16, fontSize: 13 }}>🔄 <span className="hidden sm:inline">Atualizar</span></button>
      </div>
      {totalRelampago > 0 && <div className="bg-red-50 border border-red-200 rounded-xl flex items-center justify-between" style={{ marginBottom: 16, padding: "10px 16px" }}><p className="font-bold text-red-700" style={{ fontSize: 12 }}>⚡ {totalRelampago} oferta{totalRelampago > 1 ? "s" : ""} relâmpago em {cidadeFiltro}</p><span className="bg-red-600 text-white rounded-full animate-pulse" style={{ fontSize: 10, padding: "2px 8px" }}>AO VIVO</span></div>}
      <div style={{ marginBottom: 20 }}>
        <h2 className="font-medium tracking-widest text-slate-400 uppercase" style={{ fontSize: 11 }}>Vagas abertas</h2>
        <p className="text-slate-500" style={{ fontSize: 12, marginTop: 4 }}>Vagas de <b className="text-slate-900">{cidadeFiltro} / {estadoFiltro}</b> • {listaFiltrada.length} vaga(s) {termo && `para "${termo}"`}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: atualizando ? 0.3 : 1 }}>
        {feedMisto.length === 0 ? (
          <div className="bg-white border border-dashed rounded-2xl text-center" style={{ padding: 40 }}>
            <p className="font-medium text-slate-700" style={{ fontSize: 13 }}>{termo ? `Nenhuma vaga em ${cidadeFiltro} para "${termo}"` : `Nenhuma vaga em ${cidadeFiltro} no momento.`}</p>
            <p className="text-slate-400" style={{ fontSize: 11, marginTop: 4 }}>Troque a cidade no seu Perfil para ver vagas de outras cidades.</p>
            {termo && <button onClick={() => setBusca("")} className="underline text-slate-500" style={{ marginTop: 12, fontSize: 11 }}>Limpar pesquisa</button>}
          </div>
        ) : feedMisto.map(item => item.tipo === "vaga" ? <CardVaga key={item.id} vaga={item.data} onCandidatar={onCandidatar} onVerPerfil={onVerPerfil} /> : <CardAnuncio key={item.id} anuncio={item.data} />)}
      </div>
    </div>
  );
}