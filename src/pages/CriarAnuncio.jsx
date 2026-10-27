import { useState } from "react"
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { db, auth } from "../firebase.js"

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]
const PAISES = ["Brasil", "Todos os países"]

export default function CriarAnuncio({ onVoltar, anuncioParaEditar = null }) {
  const [titulo, setTitulo] = useState(anuncioParaEditar?.titulo || "")
  const [link, setLink] = useState(anuncioParaEditar?.link || "")
  const [img, setImg] = useState(anuncioParaEditar?.imagem || "")
  const [fit, setFit] = useState(anuncioParaEditar?.fit || "contain")
  const [pos, setPos] = useState(anuncioParaEditar?.pos || "center")
  const [altura, setAltura] = useState(anuncioParaEditar?.altura || 280)
  const [bg, setBg] = useState(anuncioParaEditar?.bg || "#0f172a")
  const [salvando, setSalvando] = useState(false)
  const [infoImg, setInfoImg] = useState("")

  const [alcance, setAlcance] = useState(anuncioParaEditar?.alcance || "cidade")
  const [pais, setPais] = useState(anuncioParaEditar?.pais || "Brasil")
  const [estado, setEstado] = useState(anuncioParaEditar?.estado || "MT")
  const [cidade, setCidade] = useState(anuncioParaEditar?.cidade || "Sinop")

  // --- NOVO: TEMPORIZADOR ---
  const [duracaoDias, setDuracaoDias] = useState(anuncioParaEditar?.duracaoDias || 7)
  const [duracaoCustom, setDuracaoCustom] = useState("")
  const [tipoDuracao, setTipoDuracao] = useState(anuncioParaEditar?.duracaoDias === 99999 ? "sem_limite" : "com_limite")

  const normalizarLink = (url) => {
    let l = url.trim()
    if (!l) return ""
    if (l.startsWith("http://") || l.startsWith("https://") || l.startsWith("mailto:") || l.startsWith("tel:") || l.startsWith("whatsapp://")) {
      return l
    }
    if (l.startsWith("wa.me/") || l.startsWith("api.whatsapp.com") || l.includes(".")) {
      return "https://" + l.replace(/^https?:\/\//, "")
    }
    if (/^\d{10,13}$/.test(l.replace(/\D/g, ""))) {
      const num = l.replace(/\D/g, "")
      return `https://wa.me/${num}`
    }
    return "https://" + l
  }

  const comprimirImagem = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const image = new Image()
        image.onload = () => {
          const canvas = document.createElement("canvas")
          const MAX_WIDTH = 800
          let width = image.width
          let height = image.height
          if (width > MAX_WIDTH) { height = (MAX_WIDTH * height) / width; width = MAX_WIDTH }
          canvas.width = width; canvas.height = height
          const ctx = canvas.getContext("2d")
          ctx.drawImage(image, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.7))
        }
        image.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImagem = async (e) => {
    const file = e.target.files[0]
    if(!file) return
    setInfoImg("Comprimindo...")
    const base64Comprimido = await comprimirImagem(file)
    const tamanhoKB = Math.round(base64Comprimido.length * 0.75 / 1024)
    if (base64Comprimido.length > 900000) { alert(`Ficou grande (${tamanhoKB}KB). Usa foto menor.`); setInfoImg(""); return }
    setImg(base64Comprimido)
    setInfoImg(`${tamanhoKB}KB - OK!`)
  }

  const calcularExpiracao = () => {
    if(tipoDuracao === "sem_limite") return null
    const dias = duracaoCustom !== "" ? Number(duracaoCustom) : Number(duracaoDias)
    if(!dias || dias <= 0) return null
    const agora = new Date()
    // se for 0.5 = 12h, se for 1 = 24h
    agora.setHours(agora.getHours() + (dias * 24))
    return agora
  }

  const dataExpira = calcularExpiracao()

  const salvar = async () => {
    if(!titulo) return alert("Coloca o título")
    if(!img) return alert("Escolhe a foto")
    if(!link) return alert("Coloca o link")
    setSalvando(true)
    try {
      const linkFinal = normalizarLink(link)
      
      let expiraEm = null
      let diasFinal = 99999
      if(tipoDuracao !== "sem_limite"){
        diasFinal = duracaoCustom !== "" ? Number(duracaoCustom) : Number(duracaoDias)
        if(!diasFinal || diasFinal <= 0) return alert("Coloca quantos dias")
        const data = calcularExpiracao()
        expiraEm = Timestamp.fromDate(data)
      }

      const dados = {
        titulo, link: linkFinal, imagem: img, fit, pos, altura, bg,
        alcance, pais, estado, cidade,
        cidadeLower: cidade.toLowerCase(),
        estadoLower: estado.toLowerCase(),
        atualizadoEm: serverTimestamp(),
        duracaoDias: diasFinal,
        expiraEm: expiraEm, // <-- ESSA É A DATA QUE O APP VAI USAR PRA ESCONDER
      }
      if (anuncioParaEditar) {
        await updateDoc(doc(db, "anuncios", anuncioParaEditar.id), dados)
        alert("Anúncio atualizado! Expira em: " + (expiraEm ? dataExpira.toLocaleString('pt-BR') : "sem limite"))
      } else {
        await addDoc(collection(db, "anuncios"), {
          ...dados, ativo: true, cliques: 0, impressoes: 0,
          criadoEm: serverTimestamp(),
          criadoPor: auth.currentUser?.email || "admin"
        })
        alert("Anúncio publicado! Expira em: " + (expiraEm ? dataExpira.toLocaleString('pt-BR') : "sem limite"))
      }
      if(onVoltar) onVoltar()
    } catch(e) { alert(e.message) }
    setSalvando(false)
  }

  const editando = !!anuncioParaEditar
  const linkPreview = link ? normalizarLink(link) : ""

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-32">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[640px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onVoltar} className="w-8 h-8 bg-slate-100 rounded-full text-[14px]">←</button>
          <h1 className="text-[13px] font-bold tracking-wide">{editando ? "EDITAR ANÚNCIO" : "NOVO ANÚNCIO"}</h1>
          <button onClick={salvar} disabled={salvando} className="text-[12px] font-bold text-slate-900">{salvando ? "..." : "Salvar"}</button>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] tracking-widest text-slate-400 font-medium px-1">PREVIEW NO FEED</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 flex justify-between">
              <span className="text-[10px] text-slate-500">
                Anúncio • {alcance === 'brasil' ? 'Brasil todo' : alcance === 'estado' ? estado : alcance === 'pais' ? pais : cidade} • Patrocinado
              </span>
              <span className="text-[10px] text-slate-400">Patrocinado</span>
            </div>
            <div className="w-full flex items-center justify-center" style={{ backgroundColor: bg, height: `${altura}px` }}>
              {img ? <img src={img} className="w-full h-full" style={{ objectFit: fit, objectPosition: pos }} alt="" /> : <span className="text-[12px] text-slate-400">Sua foto aparece aqui</span>}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-[14px] text-slate-800">{titulo || "Título do seu anúncio"}</h3>
              <div className="mt-3 w-full h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white text-[13px]">Ver oferta</div>
              {linkPreview && <p className="text-[10px] text-slate-400 mt-2 truncate">Vai abrir: {linkPreview}</p>}
              {dataExpira && <p className="text-[10px] text-orange-600 mt-1 font-bold">⏰ Expira em: {dataExpira.toLocaleString('pt-BR')}</p>}
              {tipoDuracao === "sem_limite" && <p className="text-[10px] text-emerald-600 mt-1 font-bold">♾️ Sem data para expirar</p>}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-slate-500">FOTO DO ANÚNCIO * {infoImg && <span className="text-emerald-600">({infoImg})</span>}</label>
            <label className="mt-2 w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-white overflow-hidden">
              {img ? <img src={img} className="h-full object-contain p-2" alt="" /> : <span className="text-[12px] text-slate-500">📸 Clique para escolher</span>}
              <input type="file" accept="image/*" onChange={handleImagem} className="hidden" />
            </label>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">TÍTULO *</label>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex: MĪSHH - Sua marca aqui" className="mt-1 w-full border border-slate-200 rounded-xl p-3 text-[13px]" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">LINK * (qualquer link)</label>
            <input value={link} onChange={e=>setLink(e.target.value)} placeholder="Cole aqui: site, whatsapp, instagram, maps..." className="mt-1 w-full border border-slate-200 rounded-xl p-3 text-[13px]" />
            <div className="flex gap-1.5 mt-2">
              <button onClick={()=>setLink("wa.me/5566"+(prompt("Número do WhatsApp com DDD:", "66999999999")||""))} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700">📱 WHATSAPP</button>
              <button onClick={()=>setLink("instagram.com/"+(prompt("Usuário do Instagram:", "mishh")||""))} className="px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full text-[10px] font-bold text-pink-700">📸 INSTA</button>
              <button onClick={()=>setLink("https://"+(prompt("Link do site:", "mishh.com.br")||""))} className="px-3 py-1.5 bg-slate-50 border rounded-full text-[10px] font-bold">🌐 SITE</button>
            </div>
          </div>

          {/* NOVO BLOCO: TEMPO */}
          <div className="border rounded-xl p-3 space-y-3 bg-orange-50/50 border-orange-200">
            <p className="text-[11px] font-bold text-slate-700">⏰ QUANTO TEMPO NO AR?</p>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                {label: "24 HORAS", valor: 1},
                {label: "7 DIAS", valor: 7},
                {label: "15 DIAS", valor: 15},
                {label: "30 DIAS", valor: 30},
                {label: "60 DIAS", valor: 60},
                {label: "SEM LIMITE", valor: "sem_limite"},
              ].map(op=>{
                const isActive = op.valor === "sem_limite" ? tipoDuracao === "sem_limite" : tipoDuracao !== "sem_limite" && duracaoDias === op.valor && duracaoCustom === ""
                return (
                  <button key={op.label} onClick={()=>{
                    if(op.valor === "sem_limite"){
                      setTipoDuracao("sem_limite")
                    } else {
                      setTipoDuracao("com_limite")
                      setDuracaoDias(op.valor)
                      setDuracaoCustom("")
                    }
                  }} className={`h-10 rounded-full text-[10px] font-bold border ${isActive ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600"}`}>
                    {op.label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600 font-medium">Outro:</span>
              <input 
                type="number" 
                min="1"
                placeholder="Ex: 3"
                value={duracaoCustom}
                onChange={e=>{
                  setDuracaoCustom(e.target.value)
                  if(e.target.value) setTipoDuracao("com_limite")
                }}
                className="flex-1 border rounded-full px-4 py-2.5 text-[13px] bg-white"
              />
              <span className="text-[11px] text-slate-600">dias</span>
            </div>

            {dataExpira ? (
              <div className="p-2.5 bg-white border border-orange-200 rounded-xl">
                <p className="text-[10px] text-slate-500">Vai sair do ar em:</p>
                <p className="text-[13px] font-bold text-orange-700">{dataExpira.toLocaleString('pt-BR')}</p>
              </div>
            ) : (
              <div className="p-2.5 bg-white border rounded-xl">
                <p className="text-[11px] font-bold text-emerald-700">♾️ Vai ficar pra sempre até você apagar</p>
              </div>
            )}
          </div>

          <div className="border rounded-xl p-3 space-y-3 bg-slate-50">
            <p className="text-[11px] font-bold text-slate-700">ONDE ESSE ANÚNCIO VAI APARECER?</p>
            <div className="grid grid-cols-4 gap-1">
              {[
                {id:"brasil", label:"BRASIL TODO"},
                {id:"estado", label:"ESTADO"},
                {id:"cidade", label:"CIDADE"},
                {id:"pais", label:"PAÍS"},
              ].map(op=>(
                <button key={op.id} onClick={()=>setAlcance(op.id)} className={`h-9 rounded-full text-[10px] font-bold border ${alcance===op.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600"}`}>{op.label}</button>
              ))}
            </div>
            {alcance === "pais" && (
              <select value={pais} onChange={e=>setPais(e.target.value)} className="w-full border rounded-xl p-3 text-[13px] bg-white">
                {PAISES.map(p=> <option key={p} value={p}>{p}</option>)}
                <option value="Todos">Internacional</option>
              </select>
            )}
            {alcance === "estado" && (
              <select value={estado} onChange={e=>setEstado(e.target.value)} className="w-full border rounded-xl p-3 text-[13px] bg-white">
                {ESTADOS_BR.map(uf=> <option key={uf} value={uf}>{uf}</option>)}
              </select>
            )}
            {alcance === "cidade" && (
              <div className="grid grid-cols-2 gap-2">
                <select value={estado} onChange={e=>setEstado(e.target.value)} className="border rounded-xl p-3 text-[13px] bg-white">
                  {ESTADOS_BR.map(uf=> <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <input value={cidade} onChange={e=>setCidade(e.target.value)} placeholder="Ex: Sinop" className="border rounded-xl p-3 text-[13px] bg-white" />
              </div>
            )}
          </div>

          <button onClick={salvar} disabled={salvando} className="w-full h-12 bg-slate-900 text-white rounded-full font-bold text-[13px]">
            {salvando ? "SALVANDO..." : editando ? "ATUALIZAR ANÚNCIO" : "PUBLICAR ANÚNCIO"}
          </button>
        </div>
      </div>
    </div>
  )
}