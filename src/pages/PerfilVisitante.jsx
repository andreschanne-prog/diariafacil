import { useState, useEffect } from "react"
import { doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebase.js"
import Avaliacao from "../components/Avaliacao"

export default function PerfilVisitante({ usuarioId, usuarioData, usuarioLogado, vagaRelacionada, onVoltar }) {
  const [visitado, setVisitado] = useState(usuarioData || null)
  const [carregando, setCarregando] = useState(!usuarioData)
  const [mostrarModalAvaliar, setMostrarModalAvaliar] = useState(false)
  const [fotoExpandida, setFotoExpandida] = useState(false)
  const [comentarios, setComentarios] = useState([])

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

  // Busca as avaliações na coleção "avaliacoes" onde prestadorId == idAlvo
  useEffect(() => {
    const idAlvo = usuarioId || visitado?.uid
    if (!idAlvo) return

    const q = query(collection(db, "avaliacoes"), where("prestadorId", "==", idAlvo))
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      // Ordena do mais recente para o mais antigo no próprio front-end (evita erro de índice no Firebase)
      lista.sort((a, b) => {
        const dataA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0
        const dataB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0
        return dataB - dataA
      })
      setComentarios(lista)
    }, (err) => {
      console.log("Erro ao carregar avaliações:", err)
    })

    return () => unsub()
  }, [usuarioId, visitado?.uid])

  // Formata "Maria Silva" -> "Maria S." para credibilidade com privacidade (Erro corrigido aqui)
  const formatarNomeAvaliador = (nomeCompleto) => {
    if (!nomeCompleto) return "Usuário"
    const partes = nomeCompleto.trim().split(" ")
    if (partes.length === 1) return partes[0]
    return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`
  }

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
  
  const totalAval = comentarios.length > 0 ? comentarios.length : (visitado?.totalAvaliacoes || 0)
  const somaNotas = comentarios.length > 0 ? comentarios.reduce((acc, curr) => acc + (Number(curr.nota) || 5), 0) : (visitado?.sumNotas || 0)
  const notaMedia = totalAval > 0 ? (somaNotas / totalAval).toFixed(1) : "5.0"

  const formatarMembroDesde = () => {
    try {
      if (visitado?.criadoEm?.toDate) return visitado.criadoEm.toDate().toLocaleDateString("pt-BR")
      if (visitado?.criadoEm) return new Date(visitado.criadoEm).toLocaleDateString("pt-BR")
    } catch {}
    return "Recentemente"
  }

  const contatoZap = visitado?.zap || visitado?.whatsapp || visitado?.telefone || visitado?.celular || ""
  const limparZap = contatoZap.replace(/\D/g, '')

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

        {/* Avaliações e Comentários */}
        <div className="bg-white p-5 rounded-[24px] border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-[14px]">⭐ Avaliações e Comentários</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-sm font-bold">★</span>
              <span className="font-black text-[14px]">{notaMedia} <span className="text-[11px] text-slate-400 font-normal">/ 5.0</span></span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pb-3 border-b">
            <span className="text-[11px] text-slate-500 font-medium">({totalAval} avaliações recebidas)</span>
            <button 
              onClick={() => setMostrarModalAvaliar(true)}
              className="text-[11px] font-bold text-slate-900 underline hover:text-black"
            >
              fazer avaliação
            </button>
          </div>

          {/* Lista de Comentários */}
          <div className="space-y-3 pt-1">
            {comentarios.length > 0 ? (
              comentarios.map((item) => (
                <div key={item.id} className="bg-[#fafaf7] p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {item.avaliadorFoto ? (
                        <img src={item.avaliadorFoto} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center">
                          {(item.avaliadorNome || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-[12px] font-bold text-slate-900">
                        {formatarNomeAvaliador(item.avaliadorNome)}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-yellow-500 text-[11px]">
                      {Array.from({ length: Number(item.nota) || 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  
                  {item.comentario && (
                    <p className="text-[12px] text-slate-600 leading-relaxed mt-0.5">{item.comentario}</p>
                  )}

                  <div className="flex justify-between items-center mt-1">
                    {item.vagaTitulo ? (
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                        Serviço: {item.vagaTitulo}
                      </span>
                    ) : <span></span>}
                    <span className="text-[9px] text-slate-400">
                      {item.criadoEm?.toDate ? item.criadoEm.toDate().toLocaleDateString("pt-BR") : "Recentemente"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center">
                <p className="text-[12px] text-slate-400">Nenhum comentário registrado ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Contato Visíveis */}
        <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
          <div className="p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[13px]">📞 Contato WhatsApp</p>
              <p className="text-[12px] text-slate-600 mt-0.5 font-medium">{contatoZap || "Não informado"}</p>
            </div>
            {limparZap && (
              <a 
                href={`https://wa.me/55${limparZap}`} 
                target="_blank" 
                rel="noreferrer"
                className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[11px] font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                Abrir WhatsApp
              </a>
            )}
          </div>

          <div className="h-[1px] bg-slate-100 mx-4"></div>
          
          <div className="p-4">
            <p className="font-bold text-[13px]">📧 E-mail</p>
            <p className="text-[12px] mt-0.5 text-slate-600">{visitado.email || "Não informado"}</p>
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
      </div>

      {/* MODAL PARA EXPANDIR A FOTO DE PERFIL */}
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
            setMostrarModalAvaliar(false)
          }}
        />
      )}
    </div>
  )
}