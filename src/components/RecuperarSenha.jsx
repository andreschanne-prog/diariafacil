import { auth } from "../firebase.js"
import { sendPasswordResetEmail } from "firebase/auth"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, MailCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"

export default function RecuperarSenha({ onVoltar }) {
  const [email, setEmail] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [contador, setContador] = useState(0)
  const timerRef = useRef(null)

  // Contagem regressiva para reenviar
  useEffect(() => {
    if (contador <= 0) return
    timerRef.current = setTimeout(() => setContador(c => c - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [contador])

  const validarEmail = (valor) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())
  }

  const handleRecuperar = async (e) => {
    e.preventDefault()
    setErro("")

    const emailLimpo = email.trim().toLowerCase()

    if (!validarEmail(emailLimpo)) {
      setErro("Digite um e-mail válido, ex: seu@email.com")
      return
    }

    setCarregando(true)

    try {
      await sendPasswordResetEmail(auth, emailLimpo, {
        // Se você tiver uma página customizada, descomente:
        // url: `${window.location.origin}/login`,
        // handleCodeInApp: true,
      })
      // SEMPRE mostra sucesso, mesmo se o e-mail não existir
      // Isso evita que alguém descubra quem tem conta
      setEnviado(true)
      setContador(60)
    } catch (err) {
      // Log técnico só no console, nunca pro usuário
      console.error("[RecuperarSenha]", err.code)

      if (err.code === "auth/too-many-requests") {
        setErro("Muitas tentativas. Aguarde alguns minutos e tente novamente.")
      } else if (err.code === "auth/invalid-email") {
        setErro("Digite um e-mail válido.")
      } else if (err.code === "auth/network-request-failed") {
        setErro("Sem conexão. Verifique sua internet e tente novamente.")
      } else {
        setErro("Não foi possível enviar agora. Tente novamente em instantes.")
      }
    } finally {
      setCarregando(false)
    }
  }

  const handleReenviar = () => {
    if (contador > 0 || carregando) return
    // Reutiliza o mesmo submit
    handleRecuperar({ preventDefault: () => {} })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-">
        <div className="bg-white border border-slate-200 rounded- p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          
          <button
            type="button"
            onClick={onVoltar}
            className="inline-flex items-center gap-1.5 text- font-medium text-slate-600 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o login
          </button>

          <div className="text-center mb-6">
            <img 
              src="/icon.jpeg" 
              alt="Diárias Fácil" 
              className="w-14 h-14 rounded-2xl shadow-md mx-auto object-cover" 
            />
            <h1 className="text- font-bold text-slate-900 mt-4">Esqueceu a senha?</h1>
            <p className="text- text-slate-500 mt-1 leading-relaxed">
              Sem problema. Enviaremos um link para você criar uma nova senha.
            </p>
          </div>

          {enviado ? (
            // TELA DE SUCESSO - muito mais profissional
            <div className="text-center space-y-4" role="status">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <MailCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text- font-semibold text-slate-900">Verifique seu e-mail</h2>
                <p className="text- text-slate-600 mt-1 leading-relaxed">
                  Enviamos um link para <strong className="text-slate-900">{email.trim()}</strong>.<br />
                  Não esqueça de olhar a pasta de spam / lixo eletrônico.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReenviar}
                disabled={contador > 0 || carregando}
                className="w-full h-11 bg-slate-900 text-white rounded-full text- font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {contador > 0 ? `Reenviar em ${contador}s` : "Reenviar e-mail"}
              </button>

              <button
                type="button"
                onClick={() => { setEnviado(false); setEmail("") }}
                className="text- font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecuperar} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email-recuperacao" className="text- font-medium text-slate-700">
                  E-mail cadastrado
                </label>
                <input
                  id="email-recuperacao"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErro("") }}
                  placeholder="seu@email.com"
                  disabled={carregando}
                  aria-invalid={!!erro}
                  aria-describedby={erro ? "erro-email" : undefined}
                  className="mt-1.5 w-full h-11 bg-slate-50 border border-slate-200 rounded-full px-4 text- outline-none focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition disabled:opacity-60"
                />
              </div>

              {erro && (
                <p id="erro-email" role="alert" className="flex items-start gap-2 text- text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-" />
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full h-11 bg-slate-900 text-white rounded-full text- font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
              >
                {carregando && <Loader2 className="w-4 h-4 animate-spin" />}
                {carregando ? "Enviando..." : "Enviar link de recuperação"}
              </button>

              <p className="text- text-slate-400 text-center leading-relaxed">
                O link expira em 1 hora por segurança.
              </p>
            </form>
          )}
        </div>

        <p className="text-center text- text-slate-400 mt-4">
          Precisa de ajuda? Fale com o suporte
        </p>
      </div>
    </div>
  )
}