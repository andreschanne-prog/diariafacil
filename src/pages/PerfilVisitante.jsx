import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase.js"

export default function PerfilVisitante({ usuarioId, usuarioData, onVoltar }) {
  const [visitado, setVisitado] = useState(usuarioData || null)
  const [carregando, setCarregando] = useState(!usuarioData)

  useEffect(() => {
    if (usuarioData?.email || usuarioData?.bio || usuarioData?.sobre || usuarioData?.idade) {
      // se já veio com dados completos, não busca de novo
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
        console.log(e)
      }
      setCarregando(false)
    }
    buscar()
  }, [usuarioId, usuarioData])

  const calcularIdade = () => {
    const data = visitado?.idade || visitado?.dataNascimento || visitado?.nascimento
    if (!data) return null
    if (!isNaN(data)) return data // já é idade
    try {
      const nasc = new Date(data)
      const diff = Date.now() - nasc.getTime()
      return Math.floor(diff / (1000*60*60*24*365.25))
    } catch { return data }
  }

  const idade = calcularIdade()
  const bio = visitado?.sobre || visitado?.bio || visitado?.experiencias || visitado?.descricao

  if (carregando) {
    return (
      <div className="max-w-[600px] mx-auto min-h-screen bg-[#fef9ef] p-6 flex items-center justify-center">
        <p className="font-black animate-pulse">Carregando perfil...</p>
      </div>
    )
  }

  if (!visitado) {
    return (
      <div className="max-w-[600px] mx-auto min-h-screen bg-white p-6">
        <button onClick={onVoltar} className="w-10 h-10 border rounded-full font-bold">←</button>
        <p className="mt-6 font-bold">Perfil não encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-[#fef9ef] pb-28">
      <div className="bg-white p-4 sticky top-0 z-10 border-b flex items-center gap-4">
        <button onClick={onVoltar} className="w-10 h-10 bg-white border rounded-full font-bold shadow-sm">←</button>
        <h2 className="font-black text-[16px]">Perfil</h2>
      </div>

      <div className="p-6">
        {/* MESMO HEADER DO SEU PERFIL */}
        <div className="bg-white p-6 rounded-[24px] border flex gap-4 items-center shadow-sm">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white font-black text-xl overflow-hidden shrink-0">
            {visitado.foto ? <img src={visitado.foto} className="w-full h-full object-cover" /> : (visitado.nome?.[0]?.toUpperCase() || "A")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[17px] leading-none truncate">{visitado.nome || "Anunciante"} {idade ? `- ${idade} anos` : ""}</p>
            <p className="text-[13px] mt-2 opacity-70 truncate">📍 {visitado.cidade || visitado.local || "Sinop - MT"} {visitado.bairro ? `• ${visitado.bairro}` : ""}</p>
            <p className="text-[11px] mt-1 font-bold text-green-600">⭐ {visitado.avaliacao || "4.9"} • {visitado.diarias || "12"} diárias • Verificado</p>
          </div>
        </div>

        {/* BIO IGUAL A SUA */}
        <div className="mt-4 bg-white p-5 rounded-[24px] border shadow-sm">
          <span className="font-black text-[14px]">💼 Sobre mim</span>
          {bio ? (
            <p className="mt-3 text-[13px] leading-relaxed bg-[#f5f5f0] p-4 rounded-xl border whitespace-pre-wrap">
              {bio}
            </p>
          ) : (
            <div className="mt-3 bg-zinc-100 p-4 rounded-xl text-center">
              <p className="text-[12px] font-bold opacity-60">Esse usuário ainda não adicionou bio</p>
            </div>
          )}
          {idade && (
            <div className="mt-3 flex gap-2">
              <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full font-bold">🎂 {idade} anos</span>
              {visitado.genero && <span className="text-[11px] bg-zinc-100 px-3 py-1 rounded-full font-bold">{visitado.genero === 'mulher' ? '👩 Mulher' : visitado.genero === 'homem' ? '👨 Homem' : visitado.genero}</span>}
            </div>
          )}
        </div>

        {/* AVALIAÇÃO */}
        <div className="mt-4 bg-white p-5 rounded-[24px] border shadow-sm">
          <div className="flex justify-between"><span className="font-bold text-[14px]">⭐ Avaliação</span><span className="font-black text-[14px]">{visitado.avaliacao || "4.9"} / 5.0</span></div>
          <div className="mt-3 flex gap-1">{[1,2,3,4,5].map(i=> <span key={i} className="text-yellow-500">★</span>)}<span className="text-[11px] opacity-60 ml-2">{visitado.totalAvaliacoes || "12"} avaliações</span></div>
        </div>

        {/* INFOS EXTRAS */}
        <div className="mt-4 bg-white p-2 rounded-[24px] border shadow-sm">
          <div className="flex justify-between items-center p-4">
            <div><p className="font-bold text-[13px]">📞 Contato</p><p className="text-[12px] mt-1 font-mono opacity-60">🔒 Zap escondido até te aceitar</p></div>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">ESCONDIDO</span>
          </div>
          <div className="h-[1px] bg-zinc-100 mx-4"></div>
          <div className="p-4">
            <p className="font-bold text-[13px]">📍 Cidade</p>
            <p className="text-[12px] mt-1">{visitado.cidade || visitado.local || "Sinop - MT"}</p>
          </div>
          <div className="h-[1px] bg-zinc-100 mx-4"></div>
          <div className="p-4 flex justify-between">
            <span className="font-bold text-[13px]">📅 Membro desde</span>
            <span className="text-[12px] opacity-60">{visitado.criadoEm?.toDate ? visitado.criadoEm.toDate().toLocaleDateString("pt-BR") : visitado.criadoEm ? new Date(visitado.criadoEm).toLocaleDateString("pt-BR") : "2024"}</span>
          </div>
        </div>

        <div className="mt-6 bg-orange-50 border border-orange-200 p-4 rounded-[20px] text-center">
          <p className="text-[12px] font-black text-orange-800">Quer falar com {visitado.nome?.split(" ")[0] || "essa pessoa"}?</p>
          <p className="text-[11px] mt-1 text-orange-700">Se candidate numa vaga dela e aguarde ela te aceitar pra liberar o zap.</p>
        </div>
      </div>
    </div>
  )
}