import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import CardVaga from "../components/CardVaga";
import CardAnuncio from "../components/CardAnuncio";

// ===== COMPONENTE DO BANNER DO TOPO (GOOGLE + SEU) =====
function BannerTopo() {
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const q = query(
      collection(db, "banners_topo"),
      where("ativo", "==", true),
      orderBy("criadoEm", "desc")
    )
    const unsub = onSnapshot(q, snap => {
      const agora = new Date()
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => {
        if (!b.expiraEm) return true
        try {
          const exp = b.expiraEm.toDate ? b.expiraEm.toDate() : new Date(b.expiraEm)
          return exp > agora
        } catch { return true }
      })
      setBanners(lista)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIndex(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) return null

  const banner = banners[index]

  if (banner.tipo === "adsense") {
    return (
      <div className="w-full bg-white border-b border-slate-200 flex justify-center -mx-4 mb-4">
        <div className="w-full max-w-[640px]">
          <p className="text-[8px] tracking-widest text-slate-400 text-center py-1">PUBLICIDADE</p>
          <div className="min-h-[90px] bg-slate-50 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: banner.codigoAdsense || "" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black -mx-4 mb-4">
      <div className="max-w-[640px] mx-auto relative">
        <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer" className="block">
          <img src={banner.imagem} alt={banner.titulo} className="w-full h-auto max-h-[120px] object-contain mx-auto" />
        </a>
        <span className="absolute top-1 left-2 text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded">ANÚNCIO</span>
      </div>
    </div>
  )
}

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

  const filtrarAnunciosPorLocal = (lista) => {
    const cidadeAtual = (cidadeFiltro || "").toLowerCase().trim();
    const estadoAtual = (estadoFiltro || "").toLowerCase().trim();
    const paisAtual = (paisFiltro || "Brasil").toLowerCase().trim();
    const agora = new Date();

    return lista.filter(a => {
      if (a.expiraEm) {
        try {
          const dataExpira = a.expiraEm.toDate ? a.expiraEm.toDate() : new Date(a.expiraEm);
          if (dataExpira < agora) return false;
        } catch (e) {}
      }
      if (!a.alcance) {
        return cidadeAtual.includes("sinop") || a.cidadeLower === "sinop" || a.cidade === "Sinop";
      }
      if (a.alcance === "brasil") return true;
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
    <div className="max-w-[640px] mx-auto px-4 pt-0 pb-28">
      {/* BANNER DO TOPO AQUI */}
      <BannerTopo />

      <div className="mb-4 mt-2">
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