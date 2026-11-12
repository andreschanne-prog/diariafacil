import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../firebase.js"

export default function ModalAvisoFlutuante() {
  const [aviso, setAviso] = useState(null)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    const carregarAviso = async () => {
      try {
        const q = query(collection(db, "recados"), where("ativo", "==", true))
        const snap = await getDocs(q)
        
        if (!snap.empty) {
          // Pega todos os recados ativos e ordena do mais recente para o mais antigo
          const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          lista.sort((a, b) => {
            const dataA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0
            const dataB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0
            return dataB - dataA
          })

          const avisoMaisRecente = lista[0]

          // Verifica se ESTE aviso específico já foi fechado por este usuário antes
          const jaViuEsteAviso = localStorage.getItem(`aviso_fechado_${avisoMaisRecente.id}`)
          
          if (!jaViuEsteAviso) {
            setAviso(avisoMaisRecente)
            setMostrar(true) // Abre o aviso imediatamente ao entrar no site
          }
        }
      } catch (err) {
        console.error("Erro ao buscar aviso:", err)
      }
    }

    carregarAviso()
  }, [])

  const fecharAviso = () => {
    setMostrar(false)
    if (aviso) {
      // Grava no navegador que este aviso já foi visto, impedindo que abra novamente
      localStorage.setItem(`aviso_fechado_${aviso.id}`, "true")
    }
  }

  if (!mostrar || !aviso) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-[28px] max-w-[420px] w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-scaleUp">
        
        {/* BOTÃO X NO CANTO SUPERIOR DIREITO */}
        <button 
          onClick={fecharAviso}
          title="Fechar aviso"
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-slate-100 text-slate-800 rounded-full flex items-center justify-center font-bold text-sm transition z-10 shadow-md border border-slate-200 cursor-pointer"
        >
          ✕
        </button>

        {/* FOTO DO AVISO (SE HOUVER) */}
        {aviso.imagem && (
          <div className="w-full max-h-56 bg-slate-900 overflow-hidden">
            <img 
              src={aviso.imagem} 
              alt={aviso.titulo} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* CONTEÚDO DO AVISO */}
        <div className="p-6 space-y-3">
          <h3 className="font-black text-[18px] text-slate-900 pr-6 leading-tight">
            {aviso.titulo}
          </h3>
          
          <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
            {aviso.mensagem}
          </p>

          {/* BOTÃO DE LINK (SE HOUVER) */}
          {aviso.link && (
            <a 
              href={aviso.link}
              target="_blank"
              rel="noreferrer"
              onClick={fecharAviso}
              className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[13px] flex items-center justify-center transition shadow-sm mt-4"
            >
              Acessar Link →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}