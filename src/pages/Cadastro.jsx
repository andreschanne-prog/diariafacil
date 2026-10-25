import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";

export default function Cadastro({ onEntrar, onVoltar, onVerTermos, onVerPrivacidade, onAbrirTermos, termosJaAceito, privacidadeJaAceita }) {
  const [form, setForm] = useState({ nome: "", email: "", zap: "", senha: "", confirmarSenha: "" });
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [aceitaPrivacidade, setAceitaPrivacidade] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { if (termosJaAceito) setAceitaTermos(true); }, [termosJaAceito]);
  useEffect(() => { if (privacidadeJaAceita) setAceitaPrivacidade(true); }, [privacidadeJaAceita]);

  const validar = () => {
    if (!form.nome.trim()) return "Digite seu nome";
    if (!form.email.trim()) return "Digite seu email";
    if (!form.zap.trim()) return "Digite seu WhatsApp";
    if (form.senha.length < 6) return "Senha precisa ter no mínimo 6 dígitos";
    if (form.senha !== form.confirmarSenha) return "As senhas não coincidem";
    if (!aceitaTermos) return "Você precisa aceitar os Termos de Uso";
    if (!aceitaPrivacidade) return "Você precisa aceitar a Política de Privacidade";
    return null;
  };

  const salvarNoFirestore = async (user, dadosExtra = {}) => {
    const ref = doc(db, "usuarios", user.uid);
    await setDoc(ref, {
      nome: form.nome || user.displayName || "Cliente",
      email: form.email || user.email,
      zap: form.zap,
      cidade: "Sinop",
      feedCidade: "Sinop",
      feedEstado: "MT",
      foto: user.photoURL || "",
      termosAceitos: true,
      privacidadeAceita: true,
      dataAceite: new Date(),
      criadoEm: new Date(),
      ...dadosExtra
    }, { merge: true });
  };

  const criarConta = async () => {
    const erro = validar();
    if (erro) return alert(erro);
    setSalvando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.senha);
      await updateProfile(cred.user, { displayName: form.nome.trim() });
      await salvarNoFirestore(cred.user);
      localStorage.setItem("usuario_diariafacil", JSON.stringify({ nome: form.nome, email: form.email, zap: form.zap }));
      onEntrar({ nome: form.nome, email: form.email, zap: form.zap });
    } catch (e) {
      if(e.code === "auth/email-already-in-use") alert("Esse email já tem conta. Tente entrar com Google ou faça login.");
      else alert("Erro: " + e.message);
    }
    setSalvando(false);
  };

  const entrarComGoogle = async () => {
    if (!form.zap.trim()) return alert("Digite seu WhatsApp com DDD antes de entrar com Google");
    if (!aceitaTermos || !aceitaPrivacidade) return alert("Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar");
    setSalvando(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const nome = form.nome || cred.user.displayName || "Cliente";
      await salvarNoFirestore(cred.user, { nome, zap: form.zap });
      localStorage.setItem("usuario_diariafacil", JSON.stringify({ nome, email: cred.user.email, zap: form.zap }));
      onEntrar({ nome, email: cred.user.email, zap: form.zap });
    } catch (e) {
      alert("Erro Google: " + e.message);
    }
    setSalvando(false);
  };

  // FUNÇÃO QUE CHAMA CORRETO - funciona com os 2 nomes
  const abrirTermos = () => {
    if (onVerTermos) onVerTermos();
    else if (onAbrirTermos) onAbrirTermos("termos");
  };
  const abrirPrivacidade = () => {
    if (onVerPrivacidade) onVerPrivacidade();
    else if (onAbrirTermos) onAbrirTermos("privacidade");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white border border-slate-200 rounded-[20px] p-6">
          <div className="flex justify-between items-center">
            <button onClick={onVoltar} className="w-8 h-8 border border-slate-200 rounded-full text-[12px]">←</button>
            <p className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Passo 1 de 1</p>
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight mt-5 leading-none">Criar conta</h2>
          <p className="text-[12px] text-slate-500 mt-2">Pra esconder seu zap até aprovação</p>
          
          <button onClick={entrarComGoogle} disabled={salvando} className="mt-5 w-full bg-white border border-slate-200 hover:border-slate-300 text-slate-900 h-11 rounded-full text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">OU COM EMAIL</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          
          <div className="space-y-3">
            <input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} placeholder="Seu nome" className="w-full bg-slate-50 border border-slate-200 h-11 rounded-xl px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white" />
            <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Seu email" type="email" className="w-full bg-slate-50 border border-slate-200 h-11 rounded-xl px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white" />
            <input value={form.zap} onChange={e=>setForm({...form, zap:e.target.value})} placeholder="WhatsApp com DDD - 66..." className="w-full bg-slate-50 border border-orange-200 h-11 rounded-xl px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input value={form.senha} onChange={e=>setForm({...form, senha:e.target.value})} placeholder="Senha (min 6)" type="password" className="w-full bg-slate-50 border border-slate-200 h-11 rounded-xl px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white" />
                <p className="text-[9px] text-slate-400 mt-1 px-1">Mínimo 6 dígitos</p>
              </div>
              <input value={form.confirmarSenha} onChange={e=>setForm({...form, confirmarSenha:e.target.value})} placeholder="Repetir senha" type="password" className="w-full bg-slate-50 border border-slate-200 h-11 rounded-xl px-4 text-[13px] outline-none focus:border-slate-900 focus:bg-white" />
            </div>
          </div>

          {/* TERMOS - DIV E NÃO LABEL - AGORA VAI */}
          <div className="mt-5 space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={aceitaTermos} onChange={e=>setAceitaTermos(e.target.checked)} className="mt-[2px] w-4 h-4 accent-slate-900" />
              <span className="text-[11px] leading-snug text-slate-600">
                Li e aceito os <button type="button" onClick={abrirTermos} className="underline font-medium text-slate-900">Termos de Uso</button>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={aceitaPrivacidade} onChange={e=>setAceitaPrivacidade(e.target.checked)} className="mt-[2px] w-4 h-4 accent-slate-900" />
              <span className="text-[11px] leading-snug text-slate-600">
                Li e aceito a <button type="button" onClick={abrirPrivacidade} className="underline font-medium text-slate-900">Política de Privacidade</button>
              </span>
            </div>
          </div>
          
          <button onClick={criarConta} disabled={salvando} className="mt-5 w-full bg-slate-900 hover:bg-black text-white h-11 rounded-full text-[13px] font-medium disabled:opacity-50">
            {salvando ? "CRIANDO..." : "Criar conta"}
          </button>

          <p className="text-center text-[11px] text-slate-500 mt-4">Já tem conta? <button onClick={onVoltar} className="underline font-medium text-slate-900">Entrar</button></p>
        </div>
      </div>
    </div>
  );
}