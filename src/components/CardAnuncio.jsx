import { useEffect, useRef, useState } from "react"
import { doc, updateDoc, increment } from "firebase/firestore"
import { db } from "../firebase.js"

export default function CardAnuncio({ anuncio }) {
  const cardRef = useRef(null)
  const [jaContouView, setJaContouView] = useState(false)

  // 1. CONTA IMPRESSÃO - SÓ QUANDO APARECE NA TELA DA PESSOA
  useEffect(() => {
    if (jaContouView) return

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !jaContouView) {
          setJaContouView(true)
          try {
            await updateDoc(doc(db, "anuncios", anuncio.id), {
              impressoes: increment(1),
              ultimaImpressao: new Date()
            })
          } catch (e) {
            console.log("Erro impressao", e)
          }
          observer.disconnect()
        }
      },
      { threshold: 0.6 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [anuncio.id, jaContouView])

  // 2. FUNÇÃO QUE ACEITA QUALQUER LINK E ABRE
  const abrirLink = async () => {
    try {
      await updateDoc(doc(db, "anuncios", anuncio.id), {
        cliques: increment(1),
        ultimoClique: new Date()
      })
    } catch (e) {}

    let url = (anuncio.link || "").trim()
    if (!url) return

    // Se for só número, vira whatsapp
    if (/^\d{10,13}$/.test(url.replace(/\D/g, "")) && !url.includes(".")) {
      const num = url.replace(/\D/g, "")
      url = `https://wa.me/${num}`
    }
    // Se já começa com http, mailto, tel, whatsapp
    else if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("mailto:") &&
      !url.startsWith("tel:") &&
      !url.startsWith("whatsapp://")
    ) {
      url = "https://" + url.replace(/^https?:\/\//, "")
    }

    // Abre qualquer coisa: site, insta, whatsapp, maps, link de pagamento
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div ref={cardRef} className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-3">
      <div className="px-4 py-2.5 flex justify-between items-center bg-slate-50/50">
        <span className="text-[10px] text-slate-500 font-medium tracking-wide">
          Anúncio • {anuncio.cidade || anuncio.estado || "Brasil"} • Patrocinado
        </span>
        <span className="text-[9px] text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">Anúncio</span>
      </div>

      <div
        className="w-full cursor-pointer flex items-center justify-center"
        onClick={abrirLink}
        style={{
          backgroundColor: anuncio.bg || "#0f172a",
          height: `${anuncio.altura || 280}px`
        }}
      >
        <img
          src={anuncio.imagem}
          alt={anuncio.titulo}
          className="w-full h-full"
          style={{
            objectFit: anuncio.fit || "contain",
            objectPosition: anuncio.pos || "center"
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="font-medium text-[14px] text-slate-800 leading-tight">{anuncio.titulo}</h3>
        <button
          onClick={abrirLink}
          className="mt-3 w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[13px] font-medium transition-colors"
        >
          ENTRAR
        </button>
      </div>
    </div>
  )
}