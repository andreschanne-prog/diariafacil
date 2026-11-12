import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase.js"

export default function EnviarRecado({ onVoltar }) {
  const [titulo, setTitulo] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [imagem, setImagem] = useState("")
  const [link, setLink] = useState("")
  const [tipo, setTipo] = useState("geral") // "geral" ou "alerta"
  const [enviando, setEnviando] = useState(false)

  // Função para converter imagem em Base64 para envio rápido
  const handleImagem = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 800
        let w = img.width, h = img.height
        if (w > MAX) { h = (MAX * h) / w; w = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d").drawImage(img, 0, 0, w, h)
        setImagem(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !mensagem.trim()) {
      return alert("Preencha o título e a mensagem do aviso.")
    }

    try {
      setEnviando(true)
      await addDoc(collection(db, "recados"), {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        imagem: imagem || "",
        link: link.trim() || "",
        tipo: tipo,
        ativo: true,
        criadoEm: serverTimestamp(),
      })

      alert("Aviso criado com sucesso! Ele aparecerá para os usuários ao rolarem a tela.")
      setTitulo("")
      setMensagem("")
      setImagem("")
      setLink("")
      if (onVoltar) onVoltar()
    } catch (err) {
      console.error("Erro ao enviar aviso:", err)
      alert("Erro ao enviar aviso. Tente novamente.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-[#fef9ef] pb-24 text-slate-900">
      <div className="bg-black text-white p-4 sticky top-0 z-25 flex items-center gap-3 shadow-md">
        <button 
          onClick={onVoltar} 
          className="w-9 h-9 bg-white text-black rounded-full font-bold flex items-center justify-center text-sm shadow hover:bg-slate-100 transition"
        >
          ←
        </button>
        <div>
          <h2 className="font-black text-[15px] tracking-wide leading-none">📢 CRIAR AVISO FLUTUANTE</h2>
          <p className="text-[10px] opacity-60 mt-1">Aparece na metade da tela ao rolar o feed (1x por usuário)</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <form onSubmit={handleEnviar} className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Título do Aviso</label>
            <input 
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Nova atualização disponível!"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Foto do Aviso (Opcional)</label>
            <label className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer overflow-hidden hover:bg-slate-100 transition">
              {imagem ? (
                <img src={imagem} className="h-full w-full object-cover" alt="Preview" />
              ) : (
                <div className="text-center p-2">
                  <span className="text-xl">📸</span>
                  <p className="text-[11px] font-bold text-slate-600 mt-1">Clique para enviar imagem</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImagem} className="hidden" />
            </label>
            {imagem && (
              <button type="button" onClick={() => setImagem("")} className="mt-1 text-[10px] text-red-600 font-bold underline">
                Remover imagem
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Mensagem</label>
            <textarea 
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              placeholder="Escreva os detalhes do aviso..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] outline-none focus:border-slate-900 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Link de Ação (Opcional)</label>
            <input 
              type="text"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="Ex: https://wa.me/... ou https://seuapp.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-slate-900"
            />
          </div>

          <button 
            type="submit"
            disabled={enviando}
            className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-full font-bold text-[13px] shadow-sm transition disabled:opacity-50"
          >
            {enviando ? "Publicando..." : "🚀 Publicar Aviso Flutuante"}
          </button>
        </form>
      </div>
    </div>
  )
}