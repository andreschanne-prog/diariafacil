import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { db, auth } from "../firebase.js"
import { updateProfile } from "firebase/auth"

const CLOUD_NAME = "nzj72eu0"
const UPLOAD_PRESET = "mishh_upload"

export default function EditarPerfil({ usuario, onVoltar, onSalvar }) {
  const [form, setForm] = useState({
    nome: usuario?.nome || "",
    cidade: usuario?.cidade || "Sinop - MT",
    idade: usuario?.idade || "",
    experiencia: usuario?.experiencia || "",
    // BIO pega de qualquer campo antigo que você já usou
    sobre: usuario?.sobre || usuario?.bio || usuario?.experiencias || "",
    whatsapp: usuario?.whatsapp || usuario?.zap || "",
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
    if (!auth.currentUser) return alert("Não logado! Faz login com Google.")
    if (!form.nome) return alert("Coloca seu nome")
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

      const refDoc = doc(db, "usuarios", auth.currentUser.uid)
      const dados = {
        nome: form.nome,
        cidade: form.cidade,
        idade: form.idade,
        experiencia: form.experiencia,
        sobre: form.sobre.trim(),
        bio: form.sobre.trim(), // salva como bio também
        experiencias: form.sobre.trim(), // e como experiencias pra funcionar no Perfil.jsx que já fizemos
        whatsapp: form.whatsapp,
        zap: form.whatsapp,
        email: auth.currentUser.email,
        foto: fotoUrl,
        atualizadoEm: new Date(),
      }

      await setDoc(refDoc, dados, { merge: true })
      await updateProfile(auth.currentUser, { displayName: form.nome, photoURL: fotoUrl || auth.currentUser.photoURL })

      alert("✅ Perfil salvo!")
      if (onSalvar) onSalvar(dados)
      if (onVoltar) onVoltar()
    } catch (e) {
      console.log(e)
      alert("Erro: " + e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fef9ef] p-6 max-w-[600px] mx-auto pb-28">
      <div className="flex items-center gap-4">
        <button onClick={onVoltar} className="w-10 h-10 bg-white border rounded-full font-bold">←</button>
        <h1 className="text-xl font-black">Editar Perfil</h1>
      </div>
      
      <div className="mt-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-zinc-200 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black border">
          {preview ? <img src={preview} className="w-full h-full object-cover" /> : form.nome[0]?.toUpperCase()}
        </div>
        <label className="mt-3 text-[12px] font-black bg-black text-white px-5 py-2.5 rounded-full cursor-pointer">
          TROCAR FOTO
          <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
        </label>
      </div>

      <div className="mt-8 space-y-4">
        <div className="bg-white p-1 rounded-[20px] border shadow-sm">
          <input value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} placeholder="Seu nome" className="w-full p-4 rounded-xl outline-none font-bold text-[14px]" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-1 rounded-[20px] border shadow-sm">
            <input value={form.cidade} onChange={e=>setForm({...form, cidade: e.target.value})} placeholder="Cidade" className="w-full p-4 rounded-xl outline-none text-[14px]" />
          </div>
          <div className="bg-white p-1 rounded-[20px] border shadow-sm">
            <input value={form.idade} onChange={e=>setForm({...form, idade: e.target.value})} placeholder="Idade" className="w-full p-4 rounded-xl outline-none text-[14px]" />
          </div>
        </div>

        <div className="bg-white p-1 rounded-[20px] border shadow-sm">
          <input value={form.experiencia} onChange={e=>setForm({...form, experiencia: e.target.value})} placeholder="Experiência (Ex: 2 anos)" className="w-full p-4 rounded-xl outline-none text-[14px]" />
        </div>

        <div className="bg-white p-1 rounded-[20px] border shadow-sm">
          <input value={form.whatsapp} onChange={e=>setForm({...form, whatsapp: e.target.value})} placeholder="Whatsapp (66) 9xxxx-xxxx" className="w-full p-4 rounded-xl outline-none text-[14px] font-mono" />
        </div>

        {/* BIO - IGUAL O PRINT QUE VOCÊ MANDOU */}
        <div className="bg-white p-5 rounded-[24px] border shadow-sm">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-black">💼 SOBRE MIM / BIO</label>
            <span className={`text-[10px] px-2 py-1 rounded-full font-black ${form.sobre.length > 280 ? "bg-red-100 text-red-600" : "bg-black text-white"}`}>
              {form.sobre.length}/300
            </span>
          </div>
          <p className="text-[11px] opacity-50 mt-1 leading-tight">Essa bio aparece no seu perfil e quando você se candidata. Fale o que faz bem.</p>
          <textarea 
            value={form.sobre} 
            onChange={e=>setForm({...form, sobre: e.target.value.slice(0,300)})} 
            placeholder="Ex: Sou diarista há 3 anos em Sinop, faço faxina completa, passo roupa e cozinho simples. Atendo Jardim Imperial e Aquarela. Tenho referência da Dona Maria (66) 9xxxx-xxxx. Pontual e caprichosa."
            className="mt-3 w-full min-h-[130px] bg-zinc-50 border rounded-[16px] p-4 text-[13px] leading-relaxed outline-none focus:border-black resize-none" 
          />
        </div>
      </div>

      <button onClick={salvar} disabled={salvando} className="mt-6 w-full bg-black text-white py-4 rounded-full font-black disabled:opacity-50">
        {salvando ? "SALVANDO..." : "SALVAR PERFIL"}
      </button>
    </div>
  )
}