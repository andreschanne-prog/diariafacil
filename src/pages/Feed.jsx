import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import CardVaga from "../components/CardVaga";
import CardAnuncio from "../components/CardAnuncio";

// Função auxiliar para normalizar nomes de cidades
const normalizarTexto = (txt) => {
  if (!txt) return "";
  return txt
    .toLowerCase()
    .replace(/\s*-\s*[a-z]{2}\s*$/, "")
    .replace(/,\s*[a-z]{2}\s*$/, "")
    .trim();
};

// Data local no formato YYYY-MM-DD (sem erros de fuso horário)
const formatarDataLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ===== COMPONENTE DO BANNER DO TOPO (SEMPRE VISÍVEL E FIXO) =====
function BannerTopo() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [carregouBanco, setCarregouBanco] = useState(false);

  useEffect(() => {
    // Busca sem where+orderBy juntos para evitar bloqueio de índice no Firestore
    const q = query(collection(db, "banners_topo"));
    const unsub = onSnapshot(q, (snap) => {
      const agora = new Date();
      const lista = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(b => {
          if (b.ativo === false) return false;
          if (!b.expiraEm) return true;
          try {
            const exp = b.expiraEm.toDate ? b.expiraEm.toDate() : new Date(b.expiraEm);
            return exp > agora;
          } catch {
            return true;
          }
        });

      // Ordena no front-end do mais novo para o mais antigo
      lista.sort((a, b) => {
        const dataA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
        const dataB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
        return dataB - dataA;
      });

      setBanners(lista);
      setIndex(0);
      setCarregouBanco(true);
    }, (err) => {
      console.error("Erro ao carregar banners:", err);
      setCarregouBanco(true);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIndex(i => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  // Se ainda está carregando ou não há banner ativo no banco, exibe um espaço reservado fixo
  if (banners.length === 0) {
    if (!carregouBanco) {
      return (
        <div className="sticky top-0 z-30 w-full bg-slate-100 border-b border-slate-200 -mx-4 mb-4 h-[70px] animate-pulse flex items-center justify-center">
          <span className="text-[10px] text-slate-400">Carregando destaque...</span>
        </div>
      );
    }
    return null;
  }

  const banner = banners[index] || banners[0];

  if (banner.tipo === "adsense") {
    return (
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur border-b border-slate-200 flex justify-center -mx-4 mb-4 shadow-sm">
        <div className="w-full max-w-[640px]">
          <p className="text-[8px] tracking-widest text-slate-400 text-center py-0.5">PUBLICIDADE</p>
          <div className="min-h-[80px] bg-slate-50 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: banner.codigoAdsense || "" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-30 w-full bg-black -mx-4 mb-4 shadow-md">
      <div className="max-w-[640px] mx-auto relative">
        <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={banner.imagem}
            alt={banner.titulo || "Destaque"}
            className="w-full h-[90px] sm:h-[110px] object-cover mx-auto"
          />
        </a>
        <span className="absolute top-1.5 left-2 text-[8px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded">
          ANÚNCIO
        </span>
        {banners.length > 1 && (
          <div className="absolute bottom-1.5 right-2 flex gap-1">
            {banners.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === index ? "bg-white w-3" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Feed({ vagas: vagasProp, anuncios: anunciosProp = [], onCandidatar, onVerPerfil, cidadeFiltro = "Sinop", estadoFiltro = "MT", paisFiltro = "Brasil" }) {
  const [vagasLocal, setVagasLocal] = useState([]);
  const [anunciosLocal, setAnunciosLocal] = useState([]);
  const [loading, setLoading] = useState(!vagasProp);
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState(false);

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

  // Função para atualizar manualmente o feed
  const handleAtualizarFeed = () => {
    setAtualizando(true);
    setBusca("");
    setTimeout(() => {
      setAtualizando(false);
    }, 600);
  };

  // VERIFICAÇÃO AUTOMÁTICA DE VAGAS EXPIRADAS E AVISO AO USUÁRIO
  useEffect(() => {
    const listaParaChecar = vagasProp || vagasLocal;
    if (!listaParaChecar || listaParaChecar.length === 0) return;

    const hojeStr = formatarDataLocal(new Date());
    const usuarioAtualUid = auth.currentUser?.uid;

    listaParaChecar.forEach(async (vaga) => {
      if (vaga.status === "aberta" && !vaga.fechada && vaga.datasEspecificas && vaga.datasEspecificas.length > 0) {
        const datasOrdenadas = [...vaga.datasEspecificas].sort();
        const ultimaData = datasOrdenadas[datasOrdenadas.length - 1];

        if (ultimaData < hojeStr) {
          try {
            const vagaRef = doc(db, "vagas", vaga.id);
            await updateDoc(vagaRef, { status: "fechada", fechada: true });

            if (usuarioAtualUid && (vaga.anuncianteId === usuarioAtualUid || vaga.uid === usuarioAtualUid)) {
              console.log(`Sua vaga "${vaga.titulo}" expirou e foi fechada automaticamente.`);
            }
          } catch (e) {
            console.error("Erro ao fechar vaga expirada:", e);
          }
        }
      }
    });
  }, [vagasProp, vagasLocal]);

  const listaBruta = vagasProp || vagasLocal;
  
  const cidadeDesejada = normalizarTexto(cidadeFiltro);
  const estadoDesejado = (estadoFiltro || "").toLowerCase().trim();
  const hojeStr = formatarDataLocal(new Date());

  const vagasDaCidade = listaBruta.filter(v => {
    if (v.fechada || v.status === "preenchida") return false;
    
    if (v.datasEspecificas && v.datasEspecificas.length > 0) {
      const datasOrdenadas = [...v.datasEspecificas].sort();
      const ultimaDataStr = datasOrdenadas[datasOrdenadas.length - 1];
      if (ultimaDataStr < hojeStr) return false;
    }

    if (v.cidade) {
      const cidadeVaga = normalizarTexto(v.cidade);
      if (cidadeVaga !== cidadeDesejada) return false;
    }
    
    if (v.estado && estadoDesejado) {
      const estadoVaga = v.estado.toLowerCase().trim();
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
      if (a.expiraEm) {
        try {
          const dataExpira = a.expiraEm.toDate ? a.expiraEm.toDate() : new Date(a.expiraEm);
          if (dataExpira < agora) return false;
        } catch (e) {}
      }
      if (!a.alcance) {
        return cidadeAtual === "sinop" || a.cidadeLower === "sinop" || a.cidade === "Sinop";
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
        return normalizarTexto(a.cidadeLower || a.cidade) === cidadeAtual;
      }
      return true;
    });
  };

  const listaBrutaAnuncios = anunciosProp?.length > 0 ? anunciosProp : anunciosLocal;
  const anunciosAtivos = filtrarAnunciosPorLocal(listaBrutaAnuncios);

  const termo = busca.toLowerCase().trim();
  const listaFiltrada = vagasDaCidade.filter(v => {
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
      <BannerTopo />

      <div className="mb-4 mt-2 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Pesquisar vagas em ${cidadeFiltro}...`}
            className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full text-[11px]">✕</button>
          )}
        </div>

        {/* BOTÃO DE ATUALIZAR FEED */}
        <button 
          onClick={handleAtualizarFeed}
          title="Atualizar feed"
          className="h-11 px-4 bg-white border border-slate-200 rounded-full text-[13px] font-medium hover:bg-slate-50 transition flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <span className={`inline-block text-sm ${atualizando ? "animate-spin" : ""}`}>🔄</span>
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      <div className="mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">Vagas abertas</h2>
          <p className="text-[12px] text-slate-500 mt-1">
            Vagas de <b className="text-slate-900">{cidadeFiltro} / {estadoFiltro}</b> • {listaFiltrada.length} vaga(s) {termo && `para "${termo}"`}
          </p>
        </div>
      </div>

      <div className={`space-y-4 transition-opacity duration-300 ${atualizando ? "opacity-30" : "opacity-100"}`}>
        {feedMisto.length === 0 ? (
          <div className="bg-white border border-dashed rounded-2xl p-10 text-center">
            <p className="text-[13px] font-medium text-slate-700">
              {termo ? `Nenhuma vaga em ${cidadeFiltro} para "${termo}"` : `Nenhuma vaga disponível em ${cidadeFiltro} no momento.`}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Você pode trocar a cidade no seu Perfil para ver vagas de outras regiões.
            </p>
            {termo && (
              <button onClick={() => setBusca("")} className="mt-3 text-[11px] underline text-slate-500">Limpar pesquisa</button>
            )}
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