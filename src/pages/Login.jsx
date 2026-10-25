import { auth } from "../firebase.js"
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth"
import { useState } from "react"

export default function Login({ onLogin, onCadastro }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")

  const loginEmail = async (e) => {
    e.preventDefault()
    setErro("")
    setCarregando(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), senha)
      if(onLogin) onLogin(result.user)
    } catch (err) {
      if(err.code === "auth/user-not-found") setErro("Usuário não encontrado. Crie sua conta.")
      else if(err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") setErro("Email ou senha incorretos")
      else setErro("Erro: " + err.message)
    } finally {
      setCarregando(false)
    }
  }

  const loginGoogle = async () => {
    setCarregando(true)
    setErro("")
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      if(onLogin) onLogin(result.user)
    } catch (e) {
      setErro("Erro ao logar com Google: " + e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="bg-white border border-slate-200 rounded-[20px] p-6">
          <div className="text-center mb-6">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[13px] font-semibold mx-auto">d</div>
            <h1 className="text-[15px] font-semibold mt-3">diariafacil</h1>
            <p className="text-[11px] text-slate-500 mt-1">Sinop - Diaristas e bicos</p>
          </div>
          
          <form onSubmit={loginEmail} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-full px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">Senha</label>
              <input 
                type="password" 
                value={senha}
                onChange={e=>setSenha(e.target.value)}
                placeholder="sua senha"
                required
                className="mt-1 w-full h-10 bg-slate-50 border border-slate-200 rounded-full px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            {erro && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-2 text-center">{erro}</p>}

            <button 
              type="submit"
              disabled={carregando}
              className="w-full h-10 bg-slate-900 text-white rounded-full text-[13px] font-medium hover:bg-black disabled:opacity-50"
            >
              {carregando ? "Entrando..." : "Entrar com email"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] tracking-widest uppercase text-slate-400">ou</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
        
          <button 
            onClick={loginGoogle}
            disabled={carregando}
            className="w-full h-10 bg-white border border-slate-200 rounded-full text-[13px] font-medium flex items-center justify-center gap-2 hover:border-slate-300 disabled:opacity-50"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
            {carregando ? "Entrando..." : "Entrar com Google"}
          </button>

          {/* BOTÃO NOVO - CRIAR CADASTRO */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">Não tem conta?</p>
            <button 
              onClick={onCadastro}
              className="mt-2 w-full h-10 bg-white border border-slate-900 text-slate-900 rounded-full text-[13px] font-medium hover:bg-slate-50"
            >
              Criar cadastro
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}