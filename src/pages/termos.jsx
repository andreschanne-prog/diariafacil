export default function Termos({ onVoltar, onAceitar }) {
  const aceitarEVoltar = () => {
    // salva que leu os termos
    localStorage.setItem("termos_lido", "true");
    if (onAceitar) onAceitar();
    onVoltar();
  };

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-white p-6 pb-24">
      <button onClick={onVoltar} className="w-9 h-9 border border-slate-200 rounded-full text-[13px]">←</button>
      <h1 className="text-[18px] font-semibold mt-6 tracking-tight">Termos de Uso - diariafacil</h1>
      <p className="text-[11px] text-slate-400 mt-1">Atualizado em 23/10/2025 • Sinop-MT</p>

      <div className="mt-6 space-y-4 text-[13px] leading-relaxed text-slate-700">
        <p><b>1. O que é:</b> O diariafacil conecta quem precisa de diarista/mão de obra, com quem oferece o serviço. o diária facil é só a ponte.</p>
        <p><b>2. Conta:</b> Você é responsável pelo que posta. Não pode fake, golpe ou cobrar e sumir. Se fizer, sua conta é denunciada e a equipe solicita os print ou as provas e sua conta será banida.</p>
        <p><b>3. Vagas:</b> Ao postar vaga, você declara que a informação é verdadeira (valor, endereço, data). Vaga fechada/preenchida sai do feed.</p>
        <p><b>4. Pagamento:</b> O pagamento é combinado direto entre contratante e contratado, via PIX/dinheiro. O app não retém dinheiro.</p>
        <p><b>5. WhatsApp:</b> Seu contato fica oculto até você aprovar o candidato. Não nos responsabilizamos por conversa fora do app.</p>
        <p><b>6. Conduta:</b> Proibido assédio, discriminação, trabalho infantil ou ilegal. Denuncie no suporte.</p>
        <p><b>7. ADM pode remover qualquer vaga/conta sem aviso se quebrar regra.</b></p>
      </div>

      <button onClick={aceitarEVoltar} className="mt-8 w-full h-11 bg-slate-900 text-white rounded-full text-[13px] font-medium">Voltar e aceitar</button>
      <button onClick={onVoltar} className="mt-3 w-full h-11 bg-white border border-slate-200 text-slate-700 rounded-full text-[13px] font-medium">Só voltar</button>
    </div>
  )
}