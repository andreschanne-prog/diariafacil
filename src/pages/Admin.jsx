import { useState, useEffect } from "react"
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "../firebase.js"

export default function Admin({ onVoltar, onAbrirCriarAnuncio, onEditarAnuncio, onVerRelatorio }) {
  const [vagas, setVagas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [denuncias, setDenuncias] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [aba, setAba] = useState("anuncios")
  const [filtroCidade, setFiltroCidade] = useState("todos")
  const [buscaAnuncio, setBuscaAnuncio] = useState("")

  useEffect(() => {
    const carregar = async () => {
      const qVagas = query(collection(db, "vagas"), orderBy("criadoEm", "desc"))
      const snapVagas = await getDocs(qVagas)
      setVagas(snapVagas.docs.map(d => ({ id: d.id, ...d.data() })))
      const snapUsers = await getDocs(collection(db, "usuarios"))
      setUsuarios(snapUsers.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    carregar()
    const qDen = query(collection(db, "denuncias"), orderBy("criadoEm", "desc"))
    const unsubDen = onSnapshot(qDen, snap => setDenuncias(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const qAnu = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"))
    const unsubAnu = onSnapshot(qAnu, snap => setAnuncios(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { unsubDen(); unsubAnu(); }
  }, [])

  const toggleAnuncio = async (a) => { await updateDoc(doc(db, "anuncios", a.id), { ativo: !a.ativo }) }
  const deletarVaga = async (id) => { if (!confirm("Deletar?")) return; await deleteDoc(doc(db, "vagas", id)); setVagas(v => v.filter(x => x.id !== id)) }
  const banirUsuario = async (id) => { if (!confirm("Banir?")) return; await updateDoc(doc(db, "usuarios", id), { banido: true }); setUsuarios(u => u.map(x => x.id === id ? { ...x, banido: true } : x)) }
  const desbanirUsuario = async (id) => { await updateDoc(doc(db, "usuarios", id), { banido: false }); setUsuarios(u => u.map(x => x.id === id ? { ...x, banido: false } : x)) }
  const pendentes = denuncias.filter(d => d.status === "pendente").length

  // FUNÇÕES DO RELATÓRIO
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

  const cidades = ["todos", ...new Set(anuncios.map(a => a.cidade || a.estado || "Brasil"))]
  const anunciosFiltrados = anuncios.filter(a => {
    if (filtroCidade !== "todos" && a.cidade !== filtroCidade && a.estado !== filtroCidade) return false
    if (buscaAnuncio && !a.titulo.toLowerCase().includes(buscaAnuncio.toLowerCase())) return false
    return true
  })
  const totalImp = anunciosFiltrados.reduce((acc, a) => acc + (a.impressoes || 0), 0)
  const totalCliques = anunciosFiltrados.reduce((acc, a) => acc + (a.cliques || 0), 0)
  const ctrMedio = totalImp ? ((totalCliques / totalImp) * 100).toFixed(1) : 0

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-[#fef9ef] pb-24">
      <div className="bg-black text-white p-6 sticky top-0 z-10 flex items-center gap-4">
        <button onClick={onVoltar} className="w-10 h-10 bg-white text-black rounded-full font-bold">←</button>
        <div><h2 className="font-black leading-none">👑 PAINEL ADM</h2><p className="text-[10px] opacity-60 mt-1">{pendentes} denúncias • {anuncios.length} anúncios • {totalImp} views</p></div>
      </div>

      <div className="p-4 flex gap-2 overflow-x-auto">
        <button onClick={()=>setAba("anuncios")} className={`px-4 py-2 rounded-full font-black text-[11px] shrink-0 ${aba==="anuncios" ? "bg-slate-900 text-white" : "bg-white border"}`}>💰 ANÚNCIOS ({anuncios.length})</button>
        <button onClick={()=>setAba("denuncias")} className={`px-4 py-2 rounded-full font-black text-[11px] shrink-0 ${aba==="denuncias" ? "bg-red-600 text-white" : "bg-white border"}`}>🚨 DENÚNCIAS ({pendentes})</button>
        <button onClick={()=>setAba("vagas")} className={`px-4 py-2 rounded-full font-black text-[11px] shrink-0 ${aba==="vagas" ? "bg-black text-white" : "bg-white border"}`}>VAGAS ({vagas.length})</button>
        <button onClick={()=>setAba("users")} className={`px-4 py-2 rounded-full font-black text-[11px] shrink-0 ${aba==="users" ? "bg-black text-white" : "bg-white border"}`}>USUÁRIOS ({usuarios.length})</button>
      </div>

      <div className="p-4 space-y-3">
        {aba === "anuncios" && (
          <>
            <button onClick={onAbrirCriarAnuncio} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2">
              + CRIAR NOVO ANÚNCIO
            </button>

            {/* RESUMO COM PROVA */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border rounded-2xl p-3 text-center">
                <p className="text-[9px] text-slate-400 tracking-widest">IMPRESSÕES</p>
                <p className="text-[18px] font-black">{totalImp}</p>
                <p className="text-[9px] text-slate-400">pessoas viram</p>
              </div>
              <div className="bg-white border rounded-2xl p-3 text-center">
                <p className="text-[9px] text-slate-400 tracking-widest">CLIQUES</p>
                <p className="text-[18px] font-black">{totalCliques}</p>
                <p className="text-[9px] text-emerald-600">interessados</p>
              </div>
              <div className="bg-slate-900 text-white border rounded-2xl p-3 text-center">
                <p className="text-[9px] text-slate-300 tracking-widest">CTR</p>
                <p className="text-[18px] font-black">{ctrMedio}%</p>
                <p className="text-[9px] text-slate-300">taxa clique</p>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-3 flex gap-2">
              <input value={buscaAnuncio} onChange={e=>setBuscaAnuncio(e.target.value)} placeholder="Buscar empresa..." className="flex-1 border rounded-full px-4 py-2 text-[12px]" />
              <select value={filtroCidade} onChange={e=>setFiltroCidade(e.target.value)} className="border rounded-full px-3 py-2 text-[12px]">
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
                      <p className="text-[10px] text-slate-500">
                        {a.alcance === 'brasil' ? '🇧🇷 Brasil' : a.alcance === 'estado' ? `📍 ${a.estado}` : `📍 ${a.cidade}/${a.estado}`} • {a.alcance} • {a.pais}
                      </p>
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        <div className="bg-slate-50 rounded-lg p-1.5 text-center"><p className="text-[8px] text-slate-400">VIEWS</p><p className="font-black text-[12px]">{a.impressoes || 0}</p></div>
                        <div className="bg-slate-50 rounded-lg p-1.5 text-center"><p className="text-[8px] text-slate-400">CLIQUES</p><p className="font-black text-[12px]">{a.cliques || 0}</p></div>
                        <div className="bg-slate-900 text-white rounded-lg p-1.5 text-center"><p className="text-[8px] text-slate-300">CTR</p><p className="font-black text-[12px]">{ctr}%</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pb-3 flex gap-1.5">
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

        {aba === "denuncias" && denuncias.map(d => (<div key={d.id} className="p-4 rounded-xl border bg-white"><p className="font-bold text-sm">{d.vagaTitulo}</p><p className="text-[11px] mt-1">{d.motivo}</p></div>))}
        {aba === "vagas" && vagas.map(v => (<div key={v.id} className="bg-white p-4 rounded-xl border flex justify-between"><p className="font-bold text-sm truncate flex-1">{v.titulo}</p><button onClick={()=>deletarVaga(v.id)} className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold ml-2">DELETAR</button></div>))}
        {aba === "users" && usuarios.map(u => (<div key={u.id} className="bg-white p-4 rounded-xl border flex justify-between items-center"><p className="font-bold text-sm truncate">{u.nome}</p><button onClick={()=>u.banido ? desbanirUsuario(u.id) : banirUsuario(u.id)} className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold">{u.banido ? "DESBANIR" : "BANIR"}</button></div>))}
      </div>
    </div>
  )
}