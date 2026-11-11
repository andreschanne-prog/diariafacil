import { auth } from "../firebase.js"
import { sendPasswordResetEmail } from "firebase/auth"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function RecuperarSenha({ onVoltar }) {
  const [email, setEmail] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const handleRecuperar = async (e) => {
    e.preventDefault()
    setErro("")
    setSucesso("")
    setCarregando(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSucesso("E-mail de recuperação enviado! Verifique sua caixa de entrada.")
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setErro("Não há usuário cadastrado com este e-mail.")
      } else if (err.code === "auth/invalid-email") {
        setErro("E-mail inválido.")
      } else {
        setErro("Erro ao enviar e-mail: " + err.message)
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="bg-white border border-slate-200 rounded-[20px] p-6">
          <div className="text-center mb-6">
            <img src="/icon.jpeg" alt="DiariaFacil" className="w-12 h-12 rounded-2xl shadow-md mx-auto object-cover" />
            <h1 className="text-[15px] font-semibold mt-3">diariasfacil</h1>
            <p className="text-[11px] text-slate-500 mt-1">Recuperação de acesso</p>
          </div>

          <form onSubmit={handleRecuperar} className="space-y-3">
            <p className="text-[12px] text-slate-600 text-center mb-2">
              Informe seu e-mail cadastrado para receber o link de redefinição de senha.
            </p>

            <div>
              <label className="text-[11px] font-medium text-slate-600">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="seu@email.com" 
                required 
                className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-full px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white" 
              />
            </div>

            {erro && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-2 text-center">{erro}</p>}
            {sucesso && <p className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-2 text-center">{sucesso}</p>}

            <button type="submit" disabled={carregando} className="w-full h-10 bg-slate-900 text-white rounded-full text-[13px] font-medium hover:bg-black disabled:opacity-50">
              {carregando ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <button 
              type="button" 
              onClick={onVoltar}
              className="w-full h-10 bg-white border border-slate-200 text-slate-700 rounded-full text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}