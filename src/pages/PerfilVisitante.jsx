import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase.js"
import Avaliacao from "../components/Avaliacao"

export default function PerfilVisitante({ usuarioId, usuarioData, usuarioLogado, vagaRelacionada, onVoltar }) {
  const [visitado, setVisitado] = useState(usuarioData || null)
  const [carregando, setCarregando] = useState(!usuarioData)
  const [mostrarModalAvaliar, setMostrarModalAvaliar] = useState(false)
  const [fotoExpandida, setFotoExpandida] = useState(false)

  useEffect(() => {
    if (usuarioData?.email || usuarioData?.bio || usuarioData?.sobre || usuarioData?.idade) {
      setVisitado(usuarioData)
      setCarregando(false)
      return
    }
    if (!usuarioId) return
    
    const buscar = async () => {
      setCarregando(true)
      try {
        const ref = doc(db, "usuarios", usuarioId)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setVisitado({ ...snap.data(), uid: usuarioId })
        }
      } catch (e) {
        console.log("Erro ao buscar perfil:", e)
      }
      setCarregando(false)
    }
    buscar()
  }, [usuarioId, usuarioData])

  const calcularIdade = () => {
    const data = visitado?.idade || visitado?.dataNascimento || visitado?.nascimento
    if (!data) return null
    if (!isNaN(data)) return data
    try {
      const nasc = new Date(data)
      const diff = Date.now() - nasc.getTime()
      return Math.floor(diff / (1000*60*60*24*365.25))
    } catch { return data }
  }

  const idade = calcularIdade()
  const bio = visitado?.sobre || visitado?.bio || visitado?.experiencias || visitado?.descricao
  
  // Cálculo de avaliação real
  const totalAval = visitado?.totalAvaliacoes || 0
  const notaMedia = totalAval > 0 ? ((visitado?.sumNotas || 0) / totalAval).toFixed(1) : "5.0"

  const formatarMembroDesde = () => {
    try {
      if (visitado?.criadoEm?.toDate) return visitado.criadoEm.toDate().toLocaleDateString("pt-BR")
      if (visitado?.criadoEm) return new Date(visitado.criadoEm).toLocaleDateString("pt-BR")
    } catch {}
    return "Recentemente"
  }

  if (carregando) {
    return (
      <div className="max-w-[600px] mx-auto min-h-screen bg-[#fef9ef] p-6 flex items-center justify-center">
        <p className="font-black animate-pulse text-slate-600">Carregando perfil...</p>
      </div>
    )
  }

  if (!visitado) {
    return (
      <div className="max-w-[600px] mx-auto min-h-screen bg-white p-6">
        <button onClick={onVoltar} className="w-10 h-10 border rounded-full font-bold flex items-center justify-center">←</button>
        <p className="mt-6 font-bold text-center text-slate-600">Perfil não encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-[#fef9ef] pb-28">
      {/* Topo / Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="w-10 h-10 bg-white border rounded-full font-bold shadow-sm flex items-center justify-center hover:bg-slate-50 transition">←</button>
          <h2 className="font-black text-[16px]">Perfil do Usuário</h2>
        </div>

        {/* Botão de Avaliar no Cabeçalho */}
        <button 
          onClick={() => setMostrarModalAvaliar(true)}
          className="h-9 px-4 bg-slate-900 text-white rounded-full text-[11px] font-bold hover:bg-black transition flex items-center gap-1.5"
        >
          avaliar
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Header do Perfil */}
        <div className="bg-white p-6 rounded-[24px] border flex gap-4 items-center shadow-sm">
          {/* Foto de Perfil com Borda Quadrada e clique para expandir */}
          <div 
            onClick={() => visitado.foto && setFotoExpandida(true)}
            className={`w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl overflow-hidden shrink-0 ${visitado.foto ? 'cursor-pointer hover:opacity-95 transition' : ''}`}
            title={visitado.foto ? "Clique para ampliar" : ""}
          >
            {visitado.foto ? (
              <img src={visitado.foto} className="w-full h-full object-cover rounded-xl" alt={visitado.nome} />
            ) : (
              visitado.nome?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[17px] leading-tight truncate">
              {visitado.nome || "Usuário"} {idade ? `- ${idade} anos` : ""}
            </p>
            <p className="text-[13px] mt-1 text-slate-500 truncate">
              📍 {visitado.cidade || visitado.local || "Sinop - MT"} {visitado.bairro ? `• ${visitado.bairro}` : ""}
            </p>
            <span className="inline-block mt-2 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              ✓ Usuário Verificado
            </span>
          </div>
        </div>

        {/* Sobre mim / Bio */}
        <div className="bg-white p-5 rounded-[24px] border shadow-sm">
          <span className="font-black text-[14px] text-slate-900">💼 Sobre mim</span>
          {bio ? (
            <p className="mt-3 text-[13px] leading-relaxed bg-[#f5f5f0] p-4 rounded-xl border whitespace-pre-wrap text-slate-700">
              {bio}
            </p>
          ) : (
            <div className="mt-3 bg-slate-50 p-4 rounded-xl text-center border border-dashed">
              <p className="text-[12px] font-medium text-slate-400">Esse usuário ainda não adicionou uma biografia.</p>
            </div>
          )}
          
          {idade && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="text-[11px] bg-slate-900 text-white px-3 py-1 rounded-full font-bold">🎂 {idade} anos</span>
              {visitado.genero && (
                <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                  {visitado.genero === 'mulher' ? '👩 Mulher' : visitado.genero === 'homem' ? '👨 Homem' : visitado.genero}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Avaliações com Ação */}
        <div className="bg-white p-5 rounded-[24px] border shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-bold text-[14px]">⭐ Avaliações</span>
            <span className="font-black text-[14px]">{notaMedia} / 5.0</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-500 text-sm">★</span>)}
              <span className="text-[11px] text-slate-500 ml-2">({totalAval} avaliações)</span>
            </div>
            <button 
              onClick={() => setMostrarModalAvaliar(true)}
              className="text-[11px] font-bold text-slate-900 underline hover:text-black"
            >
              avaliar
            </button>
          </div>
        </div>

        {/* Informações Extras */}
        <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <div>
              <p className="font-bold text-[13px]">📞 Contato</p>
              <p className="text-[11px] mt-0.5 text-slate-400">O contato fica oculto até negociarem</p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
              🔒 OCULTO
            </span>
          </div>
          <div className="h-[1px] bg-slate-100 mx-4"></div>
          <div className="p-4">
            <p className="font-bold text-[13px]">📍 Cidade principal</p>
            <p className="text-[12px] mt-0.5 text-slate-600">{visitado.cidade || visitado.local || "Sinop - MT"}</p>
          </div>
          <div className="h-[1px] bg-slate-100 mx-4"></div>
          <div className="p-4 flex justify-between items-center">
            <span className="font-bold text-[13px]">📅 Membro na plataforma</span>
            <span className="text-[12px] font-medium text-slate-500">{formatarMembroDesde()}</span>
          </div>
        </div>

        {/* Card de Chamada para Ação */}
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-[20px] text-center">
          <p className="text-[12px] font-black text-orange-900">Quer falar com {visitado.nome?.split(" ")[0] || "essa pessoa"}?</p>
          <p className="text-[11px] mt-1 text-orange-700">Candidate-se em uma vaga ou aguarde a aprovação para liberar o contato direto via WhatsApp.</p>
        </div>
      </div>

      {/* MODAL PARA EXPANDIR A FOTO DE PERFIL (BORDAS QUADRADAS) */}
      {fotoExpandida && (
        <div 
          onClick={() => setFotoExpandida(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="relative max-w-[90%] max-h-[90%]">
            <button 
              onClick={() => setFotoExpandida(false)}
              className="absolute -top-10 right-0 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-sm hover:bg-white/40 transition"
            >
              ✕
            </button>
            <img 
              src={visitado.foto} 
              alt="Foto ampliada" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
            />
          </div>
        </div>
      )}

      {/* MODAL DE AVALIAÇÃO */}
      {mostrarModalAvaliar && (
        <Avaliacao
          prestador={visitado}
          usuarioLogado={usuarioLogado}
          vaga={vagaRelacionada}
          onClose={() => setMostrarModalAvaliar(false)}
          onSucesso={() => {
            setVisitado(prev => ({
              ...prev,
              totalAvaliacoes: (prev.totalAvaliacoes || 0) + 1,
              sumNotas: (prev.sumNotas || 0) + 5
            }))
          }}
        />
      )}
    </div>
  )
}