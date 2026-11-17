// src/pages/Login.jsx - VERSÃO PRIMEIRA IMPRESSÃO
import { auth, db } from "../firebase.js";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, MapPin, Star } from "lucide-react";

export default function Login({ onLogin, onCadastro, onEsqueceuSenha }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [erro, setErro] = useState("");

  const traduzirErro = (code) => {
    if (code === "auth/user-not-found") return "Não encontramos essa conta. Crie sua conta grátis.";
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") return "E-mail ou senha incorretos. Tente de novo.";
    if (code === "auth/too-many-requests") return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    if (code === "auth/network-request-failed") return "Sem conexão. Verifique sua internet.";
    return "Não foi possível entrar. Tente de novo.";
  };

  const loginEmail = async (e) => {
    e.preventDefault();
    setErro(""); setCarregando(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);
      if (onLogin) onLogin(result.user);
    } catch (err) { setErro(traduzirErro(err.code)); }
    finally { setCarregando(false); }
  };

  const loginGoogle = async () => {
    setCarregandoGoogle(true); setErro("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          nome: user.displayName || "Usuário",
          email: user.email || "",
          foto: user.photoURL || "",
          // Sem cidade travada - o usuário escolhe no Perfil
          cidade: "",
          estado: "",
          criadoEm: new Date(),
          provedor: "google",
        });
      }
      if (onLogin) onLogin(user);
    } catch (e) {
      if (e.code === "auth/popup-closed-by-user") setErro("Você fechou a janela do Google. Tente de novo.");
      else if (e.code === "auth/popup-blocked") setErro("Seu navegador bloqueou a janela. Permita popups e tente de novo.");
      else if (e.code !== "auth/cancelled-popup-request") setErro("Não foi possível entrar com Google. Tente com e-mail e senha.");
    } finally { setCarregandoGoogle(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ padding: 16 }}>
      <div className="w-full" style={{ maxWidth: 400 }}>
        {/* LOGO + PROVA SOCIAL - é isso que dá boa impressão */}
        <div className="text-center" style={{ marginBottom: 20 }}>
          <img src="/icon.jpeg" alt="Diárias Fácil" className="rounded-2xl shadow-md mx-auto object-cover" style={{ width: 56, height: 56 }} />
          <h1 className="font-bold tracking-tight" style={{ fontSize: 22, marginTop: 12 }}>Diárias Fácil</h1>
          <p className="text-slate-500" style={{ fontSize: 13, marginTop: 4 }}>Encontre diaristas perto de você, com confiança.</p>

          <div className="flex items-center justify-center gap-4" style={{ marginTop: 14 }}>
            <span className="flex items-center gap-1.5 text-slate-600" style={{ fontSize: 11 }}><Star style={{ width: 13, height: 13 }} className="text-amber-500" fill="currentColor" /> <strong>4.9</strong> de avaliação</span>
            <span className="flex items-center gap-1.5 text-slate-600" style={{ fontSize: 11 }}><MapPin style={{ width: 13, height: 13 }} className="text-slate-400" /> Todo o Brasil</span>
            <span className="flex items-center gap-1.5 text-slate-600" style={{ fontSize: 11 }}><ShieldCheck style={{ width: 13, height: 13 }} className="text-emerald-600" /> Perfis verificados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm" style={{ padding: 20 }}>
          <h2 className="font-bold" style={{ fontSize: 16 }}>Bem-vindo</h2>
          <p className="text-slate-500" style={{ fontSize: 12, marginTop: 2 }}>Entre para ver as vagas de hoje.</p>

          <form onSubmit={loginEmail} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="font-medium text-slate-600" style={{ fontSize: 12 }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" className="w-full bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-slate-900 focus:bg-white" style={{ height: 44, paddingLeft: 16, paddingRight: 16, fontSize: 13, marginTop: 6 }} />
            </div>
            <div>
              <div className="flex justify-between items-center"><label className="font-medium text-slate-600" style={{ fontSize: 12 }}>Senha</label><button type="button" onClick={onEsqueceuSenha} className="text-slate-600 font-medium hover:text-slate-900" style={{ fontSize: 11 }}>Esqueceu a senha?</button></div>
              <div className="relative" style={{ marginTop: 6 }}>
                <input type={mostrarSenha ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Sua senha" required autoComplete="current-password" className="w-full bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-slate-900 focus:bg-white" style={{ height: 44, paddingLeft: 16, paddingRight: 40, fontSize: 13 }} />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute text-slate-400 hover:text-slate-700" style={{ right: 14, top: "50%", transform: "translateY(-50%)" }}>{mostrarSenha ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}</button>
              </div>
            </div>

            {erro && <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl text-center" style={{ fontSize: 12, padding: "10px 12px", lineHeight: 1.4 }}>{erro}</p>}

            <button type="submit" disabled={carregando} className="w-full bg-slate-900 text-white rounded-full font-semibold hover:bg-black disabled:opacity-50" style={{ height: 44, fontSize: 13 }}>{carregando ? "Entrando..." : "Entrar"}</button>
          </form>

          <div className="flex items-center gap-3" style={{ margin: "18px 0" }}><div className="h-px bg-slate-200 flex-1" /><span className="tracking-widest uppercase text-slate-400" style={{ fontSize: 10 }}>ou</span><div className="h-px bg-slate-200 flex-1" /></div>

          <button onClick={loginGoogle} disabled={carregandoGoogle} className="w-full bg-white border border-slate-200 rounded-full font-medium flex items-center justify-center gap-2 hover:border-slate-300 disabled:opacity-50" style={{ height: 44, fontSize: 13 }}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" style={{ width: 16, height: 16 }} />
            {carregandoGoogle ? "Abrindo Google..." : "Continuar com Google"}
          </button>
        </div>

        <div className="text-center" style={{ marginTop: 16 }}>
          <p className="text-slate-500" style={{ fontSize: 12 }}>Não tem conta? <button onClick={onCadastro} className="font-bold text-slate-900 underline underline-offset-2">Criar conta grátis</button></p>
          <p className="text-slate-400" style={{ fontSize: 10, marginTop: 10 }}>Ao entrar, você concorda com os Termos e a Política de Privacidade.</p>
        </div>
      </div>
    </div>
  );
}