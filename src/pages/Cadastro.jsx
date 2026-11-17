import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase.js";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, Check, ShieldCheck, Sparkles, Star } from "lucide-react";

export default function Cadastro({ onEntrar, onVoltar, onVerTermos, onVerPrivacidade }) {
  const [form, setForm] = useState({ nome: "", email: "", zap: "", senha: "", confirmarSenha: "" });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [aceitaPrivacidade, setAceitaPrivacidade] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvandoGoogle, setSalvandoGoogle] = useState(false);

  const setCampo = (campo, valor) => {
    setForm(p => ({ ...p, [campo]: valor }));
    if (erros[campo]) setErros(p => ({ ...p, [campo]: "" }));
    setErroGeral("");
  };

  const formatarZap = (v) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  };

  const validar = (sóGoogle = false) => {
    const e = {};
    if (!sóGoogle) {
      if (form.nome.trim().length < 2) e.nome = "Digite seu nome completo";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = "Digite um e-mail válido";
      if (form.zap.replace(/\D/g, "").length < 10) e.zap = "Digite um WhatsApp válido com DDD";
      if (form.senha.length < 8) e.senha = "Mínimo 8 caracteres";
      if (form.senha !== form.confirmarSenha) e.confirmarSenha = "As senhas não coincidem";
    }
    if (!aceitaTermos) e.termos = "Aceite os Termos para continuar";
    if (!aceitaPrivacidade) e.privacidade = "Aceite a Política para continuar";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const salvarUsuario = async (user, dados) => {
    const ref = doc(db, "usuarios", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(ref, { termosAceitos: true, privacidadeAceita: true, dataAceite: serverTimestamp(), ...dados }, { merge: true });
      return { ...snap.data(), ...dados };
    }
    const novo = {
      nome: dados.nome || user.displayName || "Cliente",
      email: dados.email || user.email,
      contato: dados.zap || "",
      cidade: null, feedCidade: null, feedEstado: null,
      foto: user.photoURL || "",
      termosAceitos: true, privacidadeAceita: true,
      dataAceite: serverTimestamp(), criadoEm: serverTimestamp(),
      provedor: dados.provedor || "email", perfilCompleto: false,
    };
    await setDoc(ref, novo, { merge: true });
    return novo;
  };

  const traduzirErro = (code) => ({
    "auth/email-already-in-use": "Esse e-mail já tem conta. Tente entrar ou recuperar a senha.",
    "auth/weak-password": "Senha muito fraca. Use 8+ caracteres.",
    "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
  }[code] || "Não foi possível criar sua conta. Tente novamente.");

  const criarConta = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.senha);
      await updateProfile(cred.user, { displayName: form.nome.trim() });
      const dados = await salvarUsuario(cred.user, { nome: form.nome.trim(), email: form.email.trim().toLowerCase(), zap: form.zap, provedor: "email" });
      onEntrar(dados);
    } catch (err) { setErroGeral(traduzirErro(err.code)); }
    finally { setSalvando(false); }
  };

  const entrarComGoogle = async () => {
    if (!validar(true)) return;
    setSalvandoGoogle(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const dados = await salvarUsuario(cred.user, { nome: cred.user.displayName, email: cred.user.email, zap: form.zap, provedor: "google" });
      onEntrar(dados);
    } catch (err) { if (err.code !== "auth/popup-closed-by-user") setErroGeral(traduzirErro(err.code)); }
    finally { setSalvandoGoogle(false); }
  };

  const forca = () => {
    const s = form.senha; if (!s) return 0;
    let f = 0; if (s.length >= 8) f++; if (/[A-Z]/.test(s)) f++; if (/[0-9]/.test(s)) f++; if (/[^A-Za-z0-9]/.test(s)) f++;
    return f;
  };

  const inputClass = (temErro) => `w-full h- bg-white border rounded-2xl px-4 text- outline-none transition placeholder:text-slate-400 ${temErro ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50" : "border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"}`;
  const labelClass = "text- font-semibold text-slate-900";

  return (
    <div className="min-h-screen bg-white flex">
      {/* LADO ESQUERDO - SÓ NO DESKTOP - IGUAL AIRBNB / STRIPE */}
      <div className="hidden lg:flex lg:w-[52%] bg-slate-900 relative overflow-hidden flex-col justify-between p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900/60" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <img src="/icon.jpeg" className="w-10 h-10 rounded-xl object-cover" alt="" />
            <span className="text-white font-bold text- tracking-tight">Diárias Fácil</span>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            <span className="text-white/80 text- ml-1 font-medium">4.9 • +2.400 avaliações</span>
          </div>
          <h2 className="text-white text- leading-[1.1] font-bold tracking-tight max-w-">
            Encontre  diaristas de confiança na sua cidade.
          </h2>
          <p className="text-white/70 text- leading-relaxed mt-4 max-w-">
            Publique sua vaga ou candidate-se para diárias na sua cidade. Sem mensalidade, sem burocracia.
          </p>

          <div className="mt-8 space-y-3">
            {["Perfis verificados e avaliações reais", "Você escolhe quem contratar", "Contato direto pelo WhatsApp"].map(t => (
              <div key={t} className="flex items-center gap-2.5 text-white/90 text-">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" strokeWidth={3} /></span>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex -space-x-2">
            {["MC", "JS", "AR"].map(n => <div key={n} className="w-9 h-9 rounded-full bg-white/20 border-2 border-slate-900 flex items-center justify-center text- font-bold text-white">{n}</div>)}
          </div>
          <p className="text-white/70 text- leading-tight">+3.500<br /><span className="text-white font-semibold">Empreendedores e diariastas criaram conta</span></p>
        </div>
      </div>

      {/* LADO DIREITO - FORM */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-[#F8FAFC] lg:bg-white">
        <div className="w-full max-w-">
          {/* Header mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <img src="/icon.jpeg" className="w-9 h-9 rounded-xl object-cover" alt="" />
            <span className="font-bold tracking-tight">Diárias Fácil</span>
          </div>

          <button onClick={onVoltar} className="inline-flex items-center gap-1.5 text- font-semibold text-slate-600 hover:text-slate-900 mb-5">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <h1 className="text- sm:text- font-bold tracking-[-0.02em] leading-[1.1] text-slate-900">
            Crie sua conta
          </h1>
          <p className="text- text-slate-500 mt-2 leading-relaxed">
            Leva menos de 3 minuto. Depois você completa seu perfil.
          </p>

          {erroGeral && (
            <p role="alert" className="flex items-start gap-2 text- text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-" /> {erroGeral}
            </p>
          )}

          {/* GOOGLE - ESTILO BIGTECH */}
          <button onClick={entrarComGoogle} disabled={salvandoGoogle || salvando} className="mt-6 w-full h- bg-white border border-slate-200 hover:border-slate-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-full text- font-semibold text-slate-900 flex items-center justify-center gap-2.5 disabled:opacity-50 transition active:scale-[0.99]">
            {salvandoGoogle ? <Loader2 className="w-5 h-5 animate-spin" /> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="" />}
            Continuar com Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text- font-bold tracking-widest uppercase text-slate-400">Ou com e-mail</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={criarConta} className="space-y-4" noValidate>
            <div>
              <label htmlFor="nome" className={labelClass}>Nome completo</label>
              <input id="nome" value={form.nome} onChange={e => setCampo("nome", e.target.value)} placeholder="Ex: Maria Silva" autoComplete="name" className={`mt-1.5 ${inputClass(!!erros.nome)}`} />
              {erros.nome && <p className="text- text-red-600 mt-1.5">{erros.nome}</p>}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>E-mail</label>
              <input id="email" value={form.email} onChange={e => setCampo("email", e.target.value)} placeholder="seu@email.com" type="email" autoComplete="email" className={`mt-1.5 ${inputClass(!!erros.email)}`} />
              {erros.email && <p className="text- text-red-600 mt-1.5">{erros.email}</p>}
            </div>

            <div>
              <label htmlFor="zap" className={labelClass}>WhatsApp</label>
              <input id="zap" value={form.zap} onChange={e => setCampo("zap", formatarZap(e.target.value))} placeholder="(66) 99999-9999" type="tel" autoComplete="tel" className={`mt-1.5 ${inputClass(!!erros.zap)}`} />
              {erros.zap && <p className="text- text-red-600 mt-1.5">{erros.zap}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="senha" className={labelClass}>Senha</label>
                <div className="relative mt-1.5">
                  <input id="senha" value={form.senha} onChange={e => setCampo("senha", e.target.value)} placeholder="Mínimo 8" type={mostrarSenha ? "text" : "password"} autoComplete="new-password" className={`${inputClass(!!erros.senha)} pr-11`} />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><Eye className="w-5 h-5" /></button>
                </div>
                {form.senha && <div className="flex gap-1 mt-2">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= forca() ? (forca() <= 2 ? "bg-red-400" : "bg-emerald-500") : "bg-slate-200"}`} />)}</div>}
                {erros.senha && <p className="text- text-red-600 mt-1.5">{erros.senha}</p>}
              </div>
              <div>
                <label htmlFor="confirmar" className={labelClass}>Confirmar</label>
                <div className="relative mt-1.5">
                  <input id="confirmar" value={form.confirmarSenha} onChange={e => setCampo("confirmarSenha", e.target.value)} placeholder="Repita" type={mostrarConfirmar ? "text" : "password"} autoComplete="new-password" className={`${inputClass(!!erros.confirmarSenha)} pr-11`} />
                  <button type="button" onClick={() => setMostrarConfirmar(!mostrarConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">{mostrarConfirmar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
                {erros.confirmarSenha && <p className="text- text-red-600 mt-1.5">{erros.confirmarSenha}</p>}
              </div>
            </div>

            {/* TERMOS - VISUAL BIGTECH */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={aceitaTermos} onChange={e => setAceitaTermos(e.target.checked)} className="mt- w- h- accent-slate-900 shrink-0" />
                <span className="text- leading-snug text-slate-600">Li e aceito os <button type="button" onClick={onVerTermos} className="underline font-semibold text-slate-900">Termos de Uso</button></span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={aceitaPrivacidade} onChange={e => setAceitaPrivacidade(e.target.checked)} className="mt- w- h- accent-slate-900 shrink-0" />
                <span className="text- leading-snug text-slate-600">Li e aceito a <button type="button" onClick={onVerPrivacidade} className="underline font-semibold text-slate-900">Política de Privacidade</button></span>
              </label>
              {(erros.termos || erros.privacidade) && <p className="text- text-red-600">{erros.termos || erros.privacidade}</p>}
            </div>

            <button type="submit" disabled={salvando || salvandoGoogle} className="w-full h- bg-slate-900 hover:bg-black text-white rounded-full text- font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition active:scale-[0.99] shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
              {salvando && <Loader2 className="w-5 h-5 animate-spin" />}
              {salvando ? "Criando sua conta..." : "Criar conta grátis"}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 mt-5 text- text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Seus dados estão protegidos. Não compartilhamos seu WhatsApp.
          </div>

          <p className="text-center text- text-slate-500 mt-4">
            Já tem conta? <button onClick={onVoltar} className="font-semibold text-slate-900 underline underline-offset-2">Entrar</button>
          </p>
        </div>
      </div>
    </div>
  );
}