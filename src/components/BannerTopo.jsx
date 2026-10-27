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
      <div className="w-full bg-white border-b border-slate-200 flex justify-center py-1">
        <div className="w-full max-w-[640px]">
          {/* COLE SEU CÓDIGO DO GOOGLE AQUI - EXEMPLO ABAIXO */}
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

  // TIPO IMAGEM (SEU ANÚNCIO)
  return (
    <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[640px] mx-auto relative">
        <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={banner.imagem}
            alt={banner.titulo}
            className="w-full h-auto max-h-[120px] object-contain mx-auto bg-black"
          />
        </a>
        {banners.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        )}
        <span className="absolute top-1 left-2 text-[8px] bg-black/60 text-white px-1.5 py-0.5 rounded">ANÚNCIO</span>
      </div>
    </div>
  )
}