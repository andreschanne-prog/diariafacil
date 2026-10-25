export default function Privacidade({ onVoltar, onAceitar }) {
  const aceitarEVoltar = () => {
    localStorage.setItem("privacidade_lida", "true");
    if (onAceitar) onAceitar();
    onVoltar();
  };

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-white p-6 pb-24">
      <button onClick={onVoltar} className="w-9 h-9 border border-slate-200 rounded-full text-[13px]">←</button>
      <h1 className="text-[18px] font-semibold mt-6 tracking-tight">Política de Privacidade - LGPD</h1>
      <p className="text-[11px] text-slate-400 mt-1">diariafacil • Sinop-MT</p>

      <div className="mt-6 space-y-4 text-[13px] leading-relaxed text-slate-700">
        <p><b>1. Dados que coletamos:</b> Nome, email, foto, WhatsApp, cidade (Sinop, Sorriso, etc), GPS se você ativar, e vagas que posta/candidata.</p>
        <p><b>2. Pra que:</b> Mostrar vagas perto de você (Tinder Mode), deixar o contratante te achar, e segurança. Seu zap só aparece depois que você aceita.</p>
        <p><b>3. Onde fica:</b> No Firebase/Google (Firestore/Auth). Criptografado.</p>
        <p><b>4. Compartilhamos?</b> Não vendemos seus dados. Só mostramos seu perfil público (nome, foto, cidade) pra quem vê a vaga.</p>
        <p><b>5. Seus direitos (LGPD):</b> Você pode pedir pra ver, corrigir ou apagar tudo em Perfil → Deletar conta. Ou chama no suporte.</p>
        <p><b>6. Cookies/LocalStorage:</b> Usamos `local_diariafacil` pra lembrar sua cidade do feed e GPS.</p>
        <p><b>7. Menor de idade:</b> Só acima de 18 anos pode criar conta.</p>
      </div>

      <button onClick={aceitarEVoltar} className="mt-8 w-full h-11 bg-slate-900 text-white rounded-full text-[13px] font-medium">Voltar e aceitar</button>
      <button onClick={onVoltar} className="mt-3 w-full h-11 bg-white border border-slate-200 text-slate-700 rounded-full text-[13px] font-medium">Só voltar</button>
    </div>
  )
}