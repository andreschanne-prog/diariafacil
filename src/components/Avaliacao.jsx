import { useState } from "react"
import { db } from "../firebase.js"
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore"

export default function Avaliacao({ vaga, prestador, usuarioLogado, onClose, onSucesso }) {
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState("")
  const [salvando, setSalvando] = useState(false)

  const enviarAvaliacao = async (e) => {
    e.preventDefault()
    if (!prestador?.uid && !prestador?.id && !prestador?.anuncianteId) {
      alert("Erro: ID do usuário avaliado não encontrado.")
      return
    }

    setSalvando(true)
    const targetUid = prestador.uid || prestador.id || prestador.anuncianteId

    try {
      // 1. Salva o registro da avaliação na coleção "avaliacoes"
      await addDoc(collection(db, "avaliacoes"), {
        prestadorId: targetUid,
        avaliadorId: usuarioLogado?.uid || "",
        avaliadorNome: usuarioLogado?.nome || "Usuário",
        avaliadorFoto: usuarioLogado?.foto || "",
        vagaId: vaga?.id || "",
        vagaTitulo: vaga?.titulo || "",
        nota: Number(nota),
        comentario: comentario.trim(),
        criadoEm: serverTimestamp()
      })

      // 2. Atualiza a contagem e a soma das notas no perfil do usuário avaliado no Firestore
      const prestadorRef = doc(db, "usuarios", targetUid)
      await updateDoc(prestadorRef, {
        totalAvaliacoes: increment(1),
        sumNotas: increment(Number(nota))
      })

      alert("⭐ Avaliação enviada com sucesso!")
      if (onSucesso) onSucesso()
      if (onClose) onClose()
    } catch (err) {
      console.error("Erro ao avaliar:", err)
      alert("Erro ao enviar avaliação: " + err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[380px] rounded-[24px] p-6 shadow-2xl relative">
        {/* Botão de Fechar */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[13px] font-bold hover:bg-slate-200"
        >
          ✕
        </button>

        <h3 className="text-[16px] font-black text-slate-900 text-center mt-2">
          Avaliar {prestador?.nome?.split(" ")[0] || "Usuário"}
        </h3>
        <p className="text-[12px] text-slate-500 text-center mt-1">
          Toque nas estrelas para dar sua nota de 1 a 5
        </p>

        <form onSubmit={enviarAvaliacao} className="mt-6 space-y-5">
          {/* Seleção de 1 a 5 Estrelas */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((estrela) => (
              <button
                type="button"
                key={estrela}
                onClick={() => setNota(estrela)}
                className="text-3xl transition transform active:scale-125 focus:outline-none"
              >
                {estrela <= nota ? "⭐" : "⚪"}
              </button>
            ))}
          </div>

          <p className="text-center text-[12px] font-bold text-slate-700">
            {nota === 5 && "😍 Excelente!"}
            {nota === 4 && "🙂 Muito Bom!"}
            {nota === 3 && "😐 Regular"}
            {nota === 2 && "🙁 Ruim"}
            {nota === 1 && "😡 Péssimo"}
          </p>

          {/* Campo de comentário opcional */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Comentário (opcional):
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escreva um recado sobre o atendimento..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[12px] outline-none focus:bg-white focus:border-slate-900 resize-none"
            />
          </div>

          {/* Botão de Enviar */}
          <button
            type="submit"
            disabled={salvando}
            className="w-full h-11 bg-slate-900 text-white rounded-full font-bold text-[13px] hover:bg-black transition disabled:opacity-50"
          >
            {salvando ? "Enviando..." : "Enviar Avaliação"}
          </button>
        </form>
      </div>
    </div>
  )
}