import { useState, useEffect } from "react"
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase.js"

export default function RelatorioAnuncios({ onVoltar }) {
  const [anuncios, setAnuncios] = useState([])
  const [filtroCidade, setFiltroCidade] = useState("todos")
  const [busca, setBusca] = useState("")

  useEffect(() => {
    const q = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"))
    const unsub = onSnapshot(q, snap => {
      setAnuncios(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const cidades = ["todos", ...new Set(anuncios.map(a => a.cidade || a.estado || "Brasil"))]

  const listaFiltrada = anuncios.filter(a => {
    if (filtroCidade !== "todos" && (a.cidade !== filtroCidade && a.estado !== filtroCidade)) return false
    if (busca && !a.titulo.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  const totalImpressoes = listaFiltrada.reduce((acc, a) => acc + (a.impressoes || 0), 0)
  const totalCliques = listaFiltrada.reduce((acc, a) => acc + (a.cliques || 0), 0)
  const ctrMedio = totalImpressoes ? ((totalCliques / totalImpressoes) * 100).toFixed(1) : 0

  const copiarRelatorio = (anuncio) => {
    const ctr = anuncio.impressoes ? ((anuncio.cliques || 0) / anuncio.impressoes * 100).toFixed(1) : 0
    const texto = `📊 RELATÓRIO - ${anuncio.titulo}\n\n` +
      `📍 Local: ${anuncio.alcance === 'cidade' ? `${anuncio.cidade}/${anuncio.estado}` : anuncio.alcance === 'estado' ? `Estado ${anuncio.estado}` : 'Brasil todo'}\n` +
      `👀 Impressões: ${anuncio.impressoes || 0} pessoas viram\n` +
      `👆 Cliques: ${anuncio.cliques || 0}\n` +
      `📈 CTR: ${ctr}%\n` +
      `🔗 Link: ${anuncio.link}\n\n` +
      `diariafacil.com.br - ${anuncio.cidade}`
    
    navigator.clipboard.writeText(texto)
    alert("Relatório copiado! Cole no WhatsApp do empresário.")
  }

  const pausarAnuncio = async (anuncio) => {
    await updateDoc(doc(db, "anuncios", anuncio.id), { ativo: !anuncio.ativo })
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[900px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onVoltar} className="w-8 h-8 bg-slate-100 rounded-full">←</button>
          <h1 className="text-[13px] font-bold tracking-wide">RELATÓRIO DE ANÚNCIOS</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto p-4 space-y-4">
        {/* RESUMO GERAL */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 tracking-widest">IMPRESSÕES</p>
            <p className="text-[22px] font-bold mt-1">{totalImpressoes}</p>
            <p className="text-[10px] text-slate-400">pessoas viram</p>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 tracking-widest">CLIQUES</p>
            <p className="text-[22px] font-bold mt-1">{totalCliques}</p>
            <p className="text-[10px] text-emerald-600">interessados</p>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 tracking-widest">CTR MÉDIO</p>
            <p className="text-[22px] font-bold mt-1">{ctrMedio}%</p>
            <p className="text-[10px] text-slate-400">taxa de clique</p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white border rounded-2xl p-3 flex gap-2">
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar empresa..." className="flex-1 border rounded-full px-4 py-2 text-[13px]" />
          <select value={filtroCidade} onChange={e=>setFiltroCidade(e.target.value)} className="border rounded-full px-3 py-2 text-[13px]">
            {cidades.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* TABELA */}
        <div className="space-y-3">
          {listaFiltrada.map(a => {
            const ctr = a.impressoes ? ((a.cliques || 0) / a.impressoes * 100).toFixed(1) : 0
            return (
              <div key={a.id} className={`bg-white border rounded-2xl p-4 ${a.ativo === false ? 'opacity-50' : ''}`}>
                <div className="flex gap-3">
                  <img src={a.imagem} className="w-16 h-16 rounded-xl object-cover border" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[13px] truncate">{a.titulo}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border ${a.ativo === false ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{a.ativo === false ? 'PAUSADO' : 'ATIVO'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {a.alcance === 'brasil' ? '🇧🇷 Brasil todo' : a.alcance === 'estado' ? `📍 Estado ${a.estado}` : a.alcance === 'cidade' ? `📍 ${a.cidade}/${a.estado}` : `📍 ${a.cidade}`} • {a.alcance}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-slate-400">VIEWS</p>
                        <p className="font-bold text-[14px]">{a.impressoes || 0}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className="text-[10px] text-slate-400">CLIQUES</p>
                        <p className="font-bold text-[14px]">{a.cliques || 0}</p>
                      </div>
                      <div className="bg-slate-900 text-white rounded-xl p-2 text-center">
                        <p className="text-[10px] text-slate-300">CTR</p>
                        <p className="font-bold text-[14px]">{ctr}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={()=>copiarRelatorio(a)} className="flex-1 h-9 bg-slate-900 text-white rounded-full text-[11px] font-bold">📋 COPIAR RELATÓRIO</button>
                  <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Olha o resultado do seu anúncio na DiariaFacil: ${a.impressoes||0} pessoas viram e ${a.cliques||0} clicaram! CTR ${ctr}%`)}`, '_blank')} className="flex-1 h-9 bg-emerald-600 text-white rounded-full text-[11px] font-bold">WHATSAPP</button>
                  <button onClick={()=>pausarAnuncio(a)} className="h-9 px-4 border rounded-full text-[11px]">{a.ativo === false ? 'Ativar' : 'Pausar'}</button>
                </div>

                <p className="text-[10px] text-slate-400 mt-3">Link: {a.link} • Criado: {a.criadoEm?.toDate?.()?.toLocaleDateString?.() || ''}</p>
              </div>
            )
          })}
        </div>

        {listaFiltrada.length === 0 && <p className="text-center text-[13px] text-slate-400 py-10">Nenhum anúncio nessa cidade ainda</p>}
      </div>
    </div>
  )
}