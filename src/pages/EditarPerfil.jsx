import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { db, auth } from "../firebase.js"
import { updateProfile } from "firebase/auth"

const CLOUD_NAME = "nzj72eu0"
const UPLOAD_PRESET = "mishh_upload"

export default function EditarPerfil({ usuario, onVoltar, onSalvar }) {
  // Transforma o array ou string de especialidades em texto para edição (separado por vírgula)
  const formatarEspecInicial = (esp) => {
    if (Array.isArray(esp)) return esp.join(", ");
    if (typeof esp === "string") return esp;
    return "Diarista, Limpeza Residencial, Faxina Geral";
  };

  const [form, setForm] = useState({
    nome: usuario?.nome || "",
    cidade: usuario?.cidade || "Sinop - MT",
    idade: usuario?.idade || "",
    experiencia: usuario?.experiencia || "",
    sobre: usuario?.sobre || usuario?.bio || usuario?.experiencias || "",
    whatsapp: usuario?.whatsapp || usuario?.zap || "",
    especialidades: formatarEspecInicial(usuario?.especialidades || usuario?.habilidades),
  })
  const [fotoFile, setFotoFile] = useState(null)
  const [preview, setPreview] = useState(usuario?.foto || "")
  const [salvando, setSalvando] = useState(false)

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const salvar = async () => {
    if (!auth.currentUser) return alert("Você precisa estar logado!")
    if (!form.nome) return alert("Por favor, preencha seu nome.")
    setSalvando(true)
    try {
      let fotoUrl = usuario?.foto || ""

      if (fotoFile) {
        const fd = new FormData()
        fd.append("file", fotoFile)
        fd.append("upload_preset", UPLOAD_PRESET)
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: fd,
        })
        const data = await res.json()
        if (!data.secure_url) {
          console.log(data)
          throw new Error(data.error?.message || "Erro no upload da foto")
        }
        fotoUrl = data.secure_url
      }

      // Converte o texto digitado em um array limpo de tags (separadas por vírgula)
      const listaEspecialidades = form.especialidades
        .split(",")
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const refDoc = doc(db, "usuarios", auth.currentUser.uid)
      const dados = {
        nome: form.nome,
        cidade: form.cidade,
        idade: form.idade,
        experiencia: form.experiencia,
        sobre: form.sobre.trim(),
        bio: form.sobre.trim(),
        experiencias: form.sobre.trim(),
        whatsapp: form.whatsapp,
        zap: form.whatsapp,
        especialidades: listaEspecialidades,
        habilidades: listaEspecialidades, // Salva em ambos para compatibilidade
        email: auth.currentUser.email,
        foto: fotoUrl,
        atualizadoEm: new Date(),
      }

      await setDoc(refDoc, dados, { merge: true })
      await updateProfile(auth.currentUser, { displayName: form.nome, photoURL: fotoUrl || auth.currentUser.photoURL })

      alert("✅ Perfil salvo com sucesso!")
      if (onSalvar) onSalvar(dados)
      if (onVoltar) onVoltar()
    } catch (e) {
      console.log(e)
      alert("Erro ao salvar: " + e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-[640px] mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-28">
      {/* CABEÇALHO */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onVoltar} 
          className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ←
        </button>
        <h2 className="text-[15px] font-semibold tracking-tight">Editar Perfil</h2>
      </div>
      
      {/* FOTO DE PERFIL */}
      <div className="mt-5 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200 flex items-center justify-center text-xl font-bold text-slate-500">
          {preview ? <img src={preview} className="w-full h-full object-cover" /> : (form.nome?.[0]?.toUpperCase() || "A")}
        </div>
        <label className="mt-3 h-8 px-4 bg-slate-900 text-white rounded-full text-[11px] font-medium flex items-center justify-center cursor-pointer hover:bg-slate-800 transition">
          Trocar foto
          <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
        </label>
      </div>

      {/* FORMULÁRIO DE EDIÇÃO */}
      <div className="mt-3 space-y-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Nome completo</label>
          <input 
            value={form.nome} 
            onChange={e=>setForm({...form, nome: e.target.value})} 
            placeholder="Seu nome" 
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-medium outline-none focus:border-slate-900" 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Cidade</label>
            <input 
              value={form.cidade} 
              onChange={e=>setForm({...form, cidade: e.target.value})} 
              placeholder="Ex: Sinop - MT" 
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-medium outline-none focus:border-slate-900" 
            />
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Idade</label>
            <input 
              value={form.idade} 
              onChange={e=>setForm({...form, idade: e.target.value})} 
              placeholder="Sua idade" 
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-medium outline-none focus:border-slate-900" 
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Tempo de experiência</label>
          <input 
            value={form.experiencia} 
            onChange={e=>setForm({...form, experiencia: e.target.value})} 
            placeholder="Ex: 2 anos" 
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-medium outline-none focus:border-slate-900" 
          />
        </div>

        {/* ESPECIALIDADES E ÁREAS DE ATUAÇÃO */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Especialidades e Áreas de Atuação</label>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-1 leading-snug">Separe os serviços com vírgula (ex: Diarista, Limpeza Residencial, Passadeira).</p>
          <input 
            value={form.especialidades} 
            onChange={e=>setForm({...form, especialidades: e.target.value})} 
            placeholder="Diarista, Limpeza Residencial, Faxina Geral" 
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-medium outline-none focus:border-slate-900" 
          />
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">WhatsApp</label>
          <input 
            value={form.whatsapp} 
            onChange={e=>setForm({...form, whatsapp: e.target.value})} 
            placeholder="(66) 9xxxx-xxxx" 
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-mono font-medium outline-none focus:border-slate-900" 
          />
        </div>

        {/* BIO / SOBRE MIM */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Sobre mim / Bio</label>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${form.sobre.length > 280 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}>
              {form.sobre.length}/300
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2 leading-snug">Essa bio aparece no seu perfil e quando você se candidata às vagas.</p>
          <textarea 
            rows={4}
            value={form.sobre} 
            onChange={e=>setForm({...form, sobre: e.target.value.slice(0,300)})} 
            placeholder="Ex: Sou diarista há 3 anos em Sinop, faço faxina completa, passo roupa e cozinho simples..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12px] leading-relaxed outline-none focus:border-slate-900 resize-none" 
          />
        </div>
      </div>

      <button 
        onClick={salvar} 
        disabled={salvando} 
        className="mt-4 w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-medium disabled:opacity-50 transition shadow-xs"
      >
        {salvando ? "Salvando alterações..." : "Salvar alterações"}
      </button>
    </div>
  )
}