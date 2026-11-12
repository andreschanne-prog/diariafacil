import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "../firebase.js"

export default function BannerTopo() {
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const q = query(
      collection(db, "banners_topo"),
      where("ativo", "==", true),
      orderBy("criadoEm", "desc")
    )
    const unsub = onSnapshot(q, snap => {
      const agora = new Date()
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => {
        if (!b.expiraEm) return true
        try {
          const exp = b.expiraEm.toDate ? b.expiraEm.toDate() : new Date(b.expiraEm)
          return exp > agora
        } catch { return true }
      })
      setBanners(lista)
    }, (err) => {
      console.log("Erro ao buscar banners:", err)
    })
    return () => unsub()
  }, [])

  // rotaciona a cada 5 segundos se tiver mais de 1
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIndex(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) return null

  const banner = banners[index]

  // TIPO GOOGLE ADSENSE
  if (banner.tipo === "adsense") {
    return (
      <div className="w-full bg-white border-b border-slate-200 flex justify-center py-1 sticky top-0 z-30 shadow-sm">
        <div className="w-full max-w-[640px]">
          <div className="text-center">
            <p className="text-[8px] tracking-widest text-slate-400">PUBLICIDADE</p>
            <div
              className="min-h-[90px] bg-slate-50 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: banner.codigoAdsense || "" }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Opções de ajuste que você pode salvar no Firestore ou alterar direto aqui:
  // "cover" = Preenche todo o espaço cortando as bordas se necessário (Recomendado para banners 1200x200)
  // "contain" = Mostra a imagem inteira sem cortes (pode mostrar fundo preto nas laterais/cima)
  // "fill" = Estica a imagem para preencher tudo
  const modoAjuste = banner.objectFit || banner.modoExibicao || "cover" // cover, contain ou fill
  const alturaBanner = banner.altura || "h-[110px] sm:h-[130px]" // Altura customizável por banner ou padrão

  const classeAjuste = modoAjuste === "contain" 
    ? "object-contain" 
    : modoAjuste === "fill" 
    ? "object-fill" 
    : "object-cover"

  // TIPO IMAGEM (SEU ANÚNCIO)
  return (
    <div className="w-full bg-black border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[640px] mx-auto relative overflow-hidden">
        <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer" className="block w-full">
          <img
            src={banner.imagem}
            alt={banner.titulo || "Anúncio"}
            className={`w-full ${alturaBanner} ${classeAjuste} mx-auto transition-all duration-500`}
          />
        </a>

        {/* Indicadores de carrossel */}
        {banners.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {banners.map((_, i) => (
              <div 
                key={i} 
                className={`transition-all rounded-full ${i === index ? "w-3 h-1 bg-white" : "w-1 h-1 bg-white/50"}`} 
              />
            ))}
          </div>
        )}

        <span className="absolute top-1 left-2 text-[8px] font-bold tracking-wider bg-black/70 text-white px-1.5 py-0.5 rounded shadow">
          ANÚNCIO
        </span>
      </div>
    </div>
  )
}