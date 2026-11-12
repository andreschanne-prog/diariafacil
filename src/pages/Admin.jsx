import { useState, useEffect } from "react"
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "../firebase.js"
import Estatisticas from "../components/Estatisticas" // Importando o componente de estatísticas
import EnviarRecado from "../components/EnviarRecado" // Importando o componente de envio de recados

export default function Admin({ onVoltar, onAbrirCriarAnuncio, onEditarAnuncio, onVerRelatorio, onVerPerfil }) {
  const [vagas, setVagas] = useState([])
  const [denuncias, setDenuncias] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [bannersTopo, setBannersTopo] = useState([])
  const [contasDeletadas, setContasDeletadas] = useState([])
  const [aba, setAba] = useState("anuncios")
  const [filtroCidade, setFiltroCidade] = useState("todos")
  const [buscaAnuncio, setBuscaAnuncio] = useState("")
  const [menuAberto, setMenuAberto] = useState(false)

  // --- FORM BANNER TOPO ---
  const [showCriarTopo, setShowCriarTopo] = useState(false)
  const [tipoTopo, setTipoTopo] = useState("imagem")
  const [tituloTopo, setTituloTopo] = useState("")
  const [linkTopo, setLinkTopo] = useState("")
  const [imgTopo, setImgTopo] = useState("")
  const [codigoAdsense, setCodigoAdsense] = useState("")
  const [diasTopo, setDiasTopo] = useState(7)

  useEffect(() => {
    const carregar = async () => {
      const qVagas = query(collection(db, "vagas"), orderBy("criadoEm", "desc"))
      const snapVagas = await getDocs(qVagas)
      setVagas(snapVagas.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carregar()

    const qDen = query(collection(db, "denuncias"), orderBy("criadoEm", "desc"))
    const unsubDen = onSnapshot(qDen, snap => setDenuncias(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    
    const qAnu = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"))
    const unsubAnu = onSnapshot(qAnu, snap => setAnuncios(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    
    const qTopo = query(collection(db, "banners_topo"), orderBy("criadoEm", "desc"))
    const unsubTopo = onSnapshot(qTopo, snap => setBannersTopo(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

    const qDel = query(collection(db, "account_deletions"), orderBy("deletedAt", "desc"))
    const unsubDel = onSnapshot(qDel, snap => setContasDeletadas(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

    return () => { unsubDen(); unsubAnu(); unsubTopo(); unsubDel(); }
  }, [])

  const toggleAnuncio = async (a) => { await updateDoc(doc(db, "anuncios", a.id), { ativo: !a.ativo }) }
  const toggleTopo = async (b) => { await updateDoc(doc(db, "banners_topo", b.id), { ativo: !b.ativo }) }
  const deletarVaga = async (id) => { if (!confirm("Deletar?")) return; await deleteDoc(doc(db, "vagas", id)); setVagas(v => v.filter(x => x.id !== id)) }
  const pendentes = denuncias.filter(d => d.status === "pendente").length

  const copiarRelatorio = (a) => {
    const ctr = a.impressoes ? ((a.cliques || 0) / a.impressoes * 100).toFixed(1) : 0
    const texto = `📊 RELATÓRIO - ${a.titulo}\n\n` +
      `📍 Local: ${a.alcance === 'brasil' ? 'Brasil todo' : a.alcance === 'estado' ? `Estado ${a.estado}` : a.alcance === 'cidade' ? `${a.cidade}/${a.estado}` : a.cidade}\n` +
      `👀 Impressões: ${a.impressoes || 0} pessoas viram\n` +
      `👆 Cliques: ${a.cliques || 0}\n` +
      `📈 CTR: ${ctr}%\n` +
      `🔗 Link: ${a.link}\n\n` +
      `diariafacil.com.br`
    navigator.clipboard.writeText(texto)
    alert("Copiado! Cola no WhatsApp do empresário.")
  }

  // CRIA BANNER TOPO
  const handleImgTopo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 1200
        let w = image.width, h = image.height
        if (w > MAX) { h = (MAX * h) / w; w = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d").drawImage(image, 0, 0, w, h)
        setImgTopo(canvas.toDataURL("image/jpeg", 0.7))
      }
      image.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const salvarTopo = async () => {
    if (tipoTopo === "imagem" && !imgTopo) return alert("Escolhe a imagem do banner")
    if (tipoTopo === "adsense" && !codigoAdsense) return alert("Cola o código do Google")
    const expira = new Date()
    expira.setDate(expira.getDate() + Number(diasTopo))
    await addDoc(collection(db, "banners_topo"), {
      tipo: tipoTopo,
      titulo: tituloTopo || (tipoTopo === "adsense" ? "Google Ad" : "Banner Topo"),
      link: linkTopo,
      imagem: imgTopo || "",
      codigoAdsense: codigoAdsense || "",
      ativo: true,
      duracaoDias: Number(diasTopo),
      expiraEm: Timestamp.fromDate(expira),
      criadoEm: serverTimestamp(),
    })
    alert(`Banner do topo criado! ${diasTopo} dias no ar`)
    setShowCriarTopo(false)
    setImgTopo(""); setTituloTopo(""); setLinkTopo(""); setCodigoAdsense("")
  }

  const cidades = ["todos", ...new Set(anuncios.map(a => a.cidade || a.estado || "Brasil"))]
  const anunciosFiltrados = anuncios.filter(a => {
    if (filtroCidade !== "todos" && a.cidade !== filtroCidade && a.estado !== filtroCidade) return false
    if (buscaAnuncio && !a.titulo.toLowerCase().includes(buscaAnuncio.toLowerCase())) return false
    return true
  })
  const totalImp = anunciosFiltrados.reduce((acc, a) => acc + (a.impressoes || 0), 0)
  const totalCliques = anunciosFiltrados.reduce((acc, a) => acc + (a.cliques || 0), 0)
  const ctrMedio = totalImp ? ((totalCliques / totalImp) * 100).toFixed(1) : 0

  // Nomes amigáveis para o menu atual
  const titulosAbas = {
    anuncios: `💰 Anúncios (${anuncios.length})`,
    topo: `🔝 Topo (${bannersTopo.length})`,
    contasDeletadas: `🗑️ Contas Deletadas (${contasDeletadas.length})`,
    denuncias: `🚨 Denúncias (${pendentes})`,
    vagas: `📋 Vagas (${vagas.length})`,
    estatisticas: `📊 Estatísticas`,
    enviarRecado: `📢 Enviar Recado`
  }

  // Renderização condicional das telas secundárias
  if (aba === "estatisticas") {
    return <Estatisticas onVoltar={() => setAba("anuncios")} onVerPerfil={onVerPerfil} />
  }

  if (aba === "enviarRecado") {
    return <EnviarRecado onVoltar={() => setAba("anuncios")} />
  }

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-[#fef9ef] pb-24">
      {/* TOPO FIXO REESTRUTURADO COM MENU HAMBÚRGUER */}
      <div className="bg-black text-white p-4 sticky top-0 z-20 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="w-9 h-9 bg-white text-black rounded-full font-bold flex items-center justify-center text-sm shadow">←</button>
          <div>
            <h2 className="font-black text-[15px] tracking-wide leading-none">👑 PAINEL ADM</h2>
            <p className="text-[10px] opacity-60 mt-1">
              {titulosAbas[aba]} • {totalImp} views
            </p>
          </div>
        </div>

        {/* BOTÃO DE TRÊS TRAÇOS (MENU SUSPENSO) */}
        <div className="relative">
          <button 
            onClick={() => setMenuAberto(!menuAberto)} 
            className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 transition"
            title="Menu de navegação"
          >
            <div className="w-4 h-[2px] bg-white rounded-full"></div>
            <div className="w-4 h-[2px] bg-white rounded-full"></div>
            <div className="w-4 h-[2px] bg-white rounded-full"></div>
          </button>

          {/* DROPDOWN MENU */}
          {menuAberto && (
            <>
              <div onClick={() => setMenuAberto(false)} className="fixed inset-0 z-30"></div>
              <div className="absolute right-0 top-12 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-40 text-slate-900 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navegação do Painel</p>
                </div>
                <button onClick={()=>{setAba("anuncios"); setMenuAberto(false)}} className={`w-full text-left px-4 py-3 text-[12px] font-bold flex items-center justify-between hover:bg-slate-50 ${aba==="anuncios"?"text-black bg-slate-100":""}`}>
                  <span>💰 Anúncios</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">{anuncios.length}</span>
                </button>
                <button onClick={()=>{setAba("topo"); setMenuAberto(false)}} className={`w-full text-left px-4 py-3 text-[12px] font-bold flex items-center justify-between hover:bg-slate-50 ${aba==="topo"?"text-blue-600 bg-blue-50":""}`}>
                  <span>🔝 Banners Topo</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{bannersTopo.length}</span>
                </button>
                <button onClick={()=>{setAba("enviarRecado"); setMenuAberto(false)}} className={`w-full text-left px-4 py-3 text-[12px] font-bold flex items-center justify-between hover:bg-slate-50 ${aba==="enviarRecado"?"text-purple-700 bg-purple-50":""}`}>
                  <span>📢 Enviar Recados</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Novo</span>
                </button>
                <button onClick={()=>{setAba("estatisticas"); setMenuAberto(false)}} className={`w-full text-left px-4 py-3 text-[12px] font-bold flex items-center justify-between hover:bg-slate-50 ${aba==="estatisticas"?"text-emerald-700 bg-emerald-50":""}`}>
                  <span>📊 Estatísticas</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Gráficos</span>
                </button>
                <button onClick={()=>{setAba("contasDeletadas"); setMenuAberto(false)}} className={`w-full text-left px-4 py-3 text-[12px] font-bold flex items-center justify-between hover:bg-slate-50 ${aba==="contasDeletadas"?"text-red-700 bg-red-50":""}`}>
                  <span>🗑️ Contas Deletadas</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{contasDeletadas.length}</span>
                </button>
                <button onClick={()=>{setAba("denuncias"); setMenuAberto(false)}} className={`w-full text-left px-4 py-3 text-[12px] font-bold flex items-center justify-between hover:bg-slate-50 ${aba==="denuncias"?"text-red-600 bg-red-50":""}`}>
                  <span>🚨 Denúncias</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${pendentes > 0 ? 'bg-red-600 text-white font-black animate-pulse' : 'bg-slate-200'}`}>{pendentes}</span>
                </button>
                <button onClick={()=>{setAba("vagas"); setMenuAberto(false)}} className={`w-full text-left px-4 py-3 text-[12px] font-bold flex items-center justify-between hover:bg-slate-50 ${aba==="vagas"?"text-black bg-slate-100":""}`}>
                  <span>📋 Vagas Ativas</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">{vagas.length}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DAS ABAS */}
      <div className="p-4 space-y-3">
        {aba === "anuncios" && (
          <>
            <button onClick={onAbrirCriarAnuncio} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm hover:bg-black transition">
              + CRIAR NOVO ANÚNCIO
            </button>
            
            {/* BOTÃO DE ATALHO RÁPIDO PARA ENVIAR RECADOS */}
            <button onClick={() => setAba("enviarRecado")} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm transition">
              📢 ENVIAR AVISO / RECADO FLUTUANTE
            </button>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border rounded-2xl p-3 text-center shadow-xs"><p className="text-[9px] text-slate-400 tracking-widest">IMPRESSÕES</p><p className="text-[18px] font-black">{totalImp}</p><p className="text-[9px] text-slate-400">pessoas viram</p></div>
              <div className="bg-white border rounded-2xl p-3 text-center shadow-xs"><p className="text-[9px] text-slate-400 tracking-widest">CLIQUES</p><p className="text-[18px] font-black">{totalCliques}</p><p className="text-[9px] text-emerald-600">interessados</p></div>
              <div className="bg-slate-900 text-white border rounded-2xl p-3 text-center shadow-xs"><p className="text-[9px] text-slate-300 tracking-widest">CTR</p><p className="text-[18px] font-black">{ctrMedio}%</p><p className="text-[9px] text-slate-300">taxa clique</p></div>
            </div>
            <div className="bg-white border rounded-2xl p-3 flex gap-2">
              <input value={buscaAnuncio} onChange={e=>setBuscaAnuncio(e.target.value)} placeholder="Buscar empresa..." className="flex-1 border rounded-full px-4 py-2 text-[12px] outline-none focus:border-slate-900" />
              <select value={filtroCidade} onChange={e=>setFiltroCidade(e.target.value)} className="border rounded-full px-3 py-2 text-[12px] outline-none bg-white">
                {cidades.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {anunciosFiltrados.map(a=>{
              const ctr = a.impressoes ? ((a.cliques || 0) / a.impressoes * 100).toFixed(1) : 0
              return (
                <div key={a.id} className={`bg-white border rounded-2xl overflow-hidden ${a.ativo === false ? 'opacity-60' : ''}`}>
                  <div className="flex">
                    <div className="w-24 h-24 shrink-0" style={{backgroundColor: a.bg || "#fff"}}>
                      <img src={a.imagem} className="w-full h-full" style={{objectFit: a.fit || "contain", objectPosition: a.pos || "center"}} alt="" />
                    </div>
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex justify-between gap-2">
                        <p className="font-bold text-[13px] truncate">{a.titulo}</p>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full border h-fit ${a.ativo === false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{a.ativo === false ? 'PAUSADO' : 'ATIVO'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{a.alcance === 'brasil' ? '🇧🇷 Brasil' : a.alcance === 'estado' ? `📍 ${a.estado}` : `📍 ${a.cidade}/${a.estado}`}</p>
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        <div className="bg-slate-50 rounded-lg p-1.5 text-center"><p className="text-[8px] text-slate-400">VIEWS</p><p className="font-black text-[12px]">{a.impressoes || 0}</p></div>
                        <div className="bg-slate-50 rounded-lg p-1.5 text-center"><p className="text-[8px] text-slate-400">CLIQUES</p><p className="font-black text-[12px]">{a.cliques || 0}</p></div>
                        <div className="bg-slate-900 text-white rounded-lg p-1.5 text-center"><p className="text-[8px] text-slate-300">CTR</p><p className="font-black text-[12px]">{ctr}%</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pb-3 flex gap-1.5 flex-wrap">
                    <button onClick={()=>copiarRelatorio(a)} className="flex-1 h-8 bg-slate-900 text-white rounded-full text-[10px] font-bold">📋 RELATÓRIO</button>
                    <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`📊 Seu anúncio na DiariaFacil:\n${a.titulo}\n👀 ${a.impressoes||0} pessoas viram\n👆 ${a.cliques||0} cliques\n📈 CTR ${ctr}%\n\ndiariafacil`)}`,'_blank')} className="flex-1 h-8 bg-emerald-600 text-white rounded-full text-[10px] font-bold">WHATSAPP</button>
                    <button onClick={()=>toggleAnuncio(a)} className="h-8 px-3 border rounded-full text-[10px] font-bold">{a.ativo ? 'Pausar' : 'Ativar'}</button>
                    {onEditarAnuncio && <button onClick={()=>onEditarAnuncio(a)} className="h-8 px-3 border rounded-full text-[10px] font-bold">Editar</button>}
                    <button onClick={async()=>{if(confirm("Apagar anúncio?")) await deleteDoc(doc(db,"anuncios",a.id))}} className="h-8 w-8 border border-red-200 text-red-600 rounded-full text-[10px] font-bold">✕</button>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {aba === "topo" && (
          <>
            {!showCriarTopo ? (
              <>
                <button onClick={()=>setShowCriarTopo(true)} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-[13px] shadow-sm">+ CRIAR BANNER DO TOPO</button>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-[11px] text-blue-800">
                  🔝 Esse banner aparece fixo no topo do feed pra todo mundo. Ideal pro Google AdSense e pra vender espaço caro.
                </div>
                {bannersTopo.length === 0 && <p className="text-center text-[12px] text-slate-400 mt-6">Nenhum banner no topo ainda</p>}
                {bannersTopo.map(b=>{
                  let expiraTxt = "Sem limite"
                  if(b.expiraEm){
                    try{
                      const d = b.expiraEm.toDate ? b.expiraEm.toDate() : new Date(b.expiraEm)
                      expiraTxt = d.toLocaleString('pt-BR')
                    }catch{}
                  }
                  const vencido = b.expiraEm && (b.expiraEm.toDate ? b.expiraEm.toDate() : new Date(b.expiraEm)) < new Date()
                  return (
                    <div key={b.id} className={`bg-white border rounded-2xl overflow-hidden ${!b.ativo || vencido ? 'opacity-60' : ''}`}>
                      {b.tipo === "imagem" ? (
                        <img src={b.imagem} className="w-full h-24 object-contain bg-black" alt="" />
                      ) : (
                        <div className="p-3 bg-slate-50"><p className="text-[11px] font-mono truncate">{b.codigoAdsense?.slice(0,80)}...</p></div>
                      )}
                      <div className="p-3">
                        <div className="flex justify-between">
                          <p className="font-bold text-[12px]">{b.titulo}</p>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full ${b.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{b.ativo ? 'ATIVO' : 'PAUSADO'}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Tipo: {b.tipo} | Expira: {expiraTxt} {vencido && '• VENCIDO'}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={()=>toggleTopo(b)} className="flex-1 h-8 border rounded-full text-[10px] font-bold">{b.ativo ? 'Pausar' : 'Ativar'}</button>
                          <button onClick={async()=>{if(confirm("Apagar banner topo?")) await deleteDoc(doc(db,"banners_topo",b.id))}} className="h-8 px-3 border border-red-200 text-red-600 rounded-full text-[10px] font-bold">Apagar</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="bg-white border rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[13px]">NOVO BANNER TOPO</h3>
                  <button onClick={()=>setShowCriarTopo(false)} className="w-8 h-8 bg-slate-100 rounded-full">✕</button>
                </div>

                <div className="flex gap-2">
                  <button onClick={()=>setTipoTopo("imagem")} className={`flex-1 h-10 rounded-full text-[11px] font-bold border ${tipoTopo==="imagem" ? "bg-slate-900 text-white" : "bg-white"}`}>MINHA IMAGEM</button>
                  <button onClick={()=>setTipoTopo("adsense")} className={`flex-1 h-10 rounded-full text-[11px] font-bold border ${tipoTopo==="adsense" ? "bg-slate-900 text-white" : "bg-white"}`}>GOOGLE ADS</button>
                </div>

                {tipoTopo === "imagem" ? (
                  <>
                    <label className="w-full h-28 border-2 border-dashed rounded-xl flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden">
                      {imgTopo ? <img src={imgTopo} className="h-full object-contain" /> : <span className="text-[12px]">📸 1200x200 - Clique</span>}
                      <input type="file" accept="image/*" onChange={handleImgTopo} className="hidden" />
                    </label>
                    <input value={tituloTopo} onChange={e=>setTituloTopo(e.target.value)} placeholder="Título (ex: MISH Promoção)" className="w-full border rounded-xl p-3 text-[13px]" />
                    <input value={linkTopo} onChange={e=>setLinkTopo(e.target.value)} placeholder="Link ao clicar (wa.me ou site)" className="w-full border rounded-xl p-3 text-[13px]" />
                  </>
                ) : (
                  <>
                    <textarea value={codigoAdsense} onChange={e=>setCodigoAdsense(e.target.value)} placeholder="Cole aqui o código completo do Google AdSense" rows={6} className="w-full border rounded-xl p-3 text-[11px] font-mono" />
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-[11px]">
                      Você pega esse código em adsense.google.com depois que seu site for aprovado.
                    </div>
                    <input value={tituloTopo} onChange={e=>setTituloTopo(e.target.value)} placeholder="Nome interno (ex: Ads Topo)" className="w-full border rounded-xl p-3 text-[13px]" />
                  </>
                )}

                <div>
                  <p className="text-[11px] font-bold">QUANTO TEMPO?</p>
                  <div className="flex gap-2 mt-2">
                    {[1,7,15,30].map(d=>(
                      <button key={d} onClick={()=>setDiasTopo(d)} className={`px-4 h-9 rounded-full text-[11px] font-bold border ${diasTopo===d ? "bg-slate-900 text-white" : "bg-white"}`}>{d}D</button>
                    ))}
                    <input type="number" value={diasTopo} onChange={e=>setDiasTopo(e.target.value)} className="w-20 border rounded-full px-3 text-[12px]" />
                  </div>
                </div>

                <button onClick={salvarTopo} className="w-full h-12 bg-blue-600 text-white rounded-full font-bold text-[13px]">PUBLICAR NO TOPO</button>
              </div>
            )}
          </>
        )}

        {/* Aba de Contas Deletadas e Motivos */}
        {aba === "contasDeletadas" && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-[11px] text-red-800">
              🗑️ Aqui estão os motivos informados pelos usuários que decidiram excluir suas contas no aplicativo.
            </div>
            {contasDeletadas.length === 0 && (
              <p className="text-center text-[12px] text-slate-400 mt-6">Nenhuma conta deletada até o momento.</p>
            )}
            {contasDeletadas.map(delItem => {
              let dataFormatada = "Data não disponível";
              if (delItem.deletedAt) {
                try {
                  const d = delItem.deletedAt.toDate ? delItem.deletedAt.toDate() : new Date(delItem.deletedAt);
                  dataFormatada = d.toLocaleString('pt-BR');
                } catch {}
              }
              return (
                <div key={delItem.id} className="bg-white border rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-[13px] text-slate-900">{delItem.email}</p>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{dataFormatada}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Motivo relatado:</p>
                    <p className="text-[12px] text-slate-700 leading-relaxed italic">"{delItem.reason}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {aba === "denuncias" && denuncias.map(d => (<div key={d.id} className="p-4 rounded-xl border bg-white shadow-xs"><p className="font-bold text-sm">{d.vagaTitulo}</p><p className="text-[11px] mt-1 text-slate-600">{d.motivo}</p></div>))}
        {aba === "vagas" && vagas.map(v => (<div key={v.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-xs"><p className="font-bold text-sm truncate flex-1">{v.titulo}</p><button onClick={()=>deletarVaga(v.id)} className="bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold ml-2">DELETAR</button></div>))}
      </div>
    </div>
  )
}