export default function Termos({ onVoltar, onAceitar }) {
  const aceitarEVoltar = () => {
    localStorage.setItem("termos_lido", "true");
    localStorage.setItem("termos_aceite_data", new Date().toISOString());
    if (onAceitar) onAceitar();
    onVoltar();
  };

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-white p-6 pb-28">
      <button onClick={onVoltar} className="w-9 h-9 border border-slate-200 rounded-full text-[13px] hover:bg-slate-50">←</button>
      
      <div className="mt-6">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Termos de Uso</h1>
        <p className="text-[12px] text-slate-500 mt-1">Diárias Fácil • diariasfacil.com.br</p>
        <p className="text-[11px] text-slate-400 mt-1">Última atualização: 13 de novembro de 2025 • Sinop - MT</p>
      </div>

      <div className="mt-8 space-y-6 text-[13px] leading-relaxed text-slate-700">

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">1. Definição da Plataforma</h2>
          <p className="mt-2">O Diárias Fácil é uma plataforma de intermediação que conecta contratantes que necessitam de serviços temporários (diaristas, faxineiras, mão de obra em geral) a prestadores de serviços autônomos. O Diárias Fácil não é empregador, não contrata e não presta diretamente os serviços anunciados.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">2. Cadastro e Responsabilidade da Conta</h2>
          <p className="mt-2">2.1. O usuário é integralmente responsável pela veracidade das informações fornecidas, incluindo nome, contato e descrição de serviços.<br/>
          2.2. É vedada a criação de perfis falsos, aplicação de golpes, ou condutas que visem obter vantagem ilícita.<br/>
          2.3. Contas denunciadas serão analisadas pela equipe. Poderemos solicitar prints, comprovantes e, em caso de violação comprovada, a conta será suspensa ou banida permanentemente, sem aviso prévio.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">3. Publicação de Vagas</h2>
          <p className="mt-2">3.1. Ao publicar uma vaga, o contratante declara que as informações são verdadeiras quanto a valor, data, horário, endereço e escopo do serviço.<br/>
          3.2. Vagas preenchidas, canceladas ou com informações desatualizadas serão removidas do feed automaticamente ou pela moderação.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">4. Pagamentos e Comissões</h2>
          <p className="mt-2">4.1. O Diárias Fácil não intermedia, retém ou processa pagamentos.<br/>
          4.2. Toda negociação financeira (valor, forma de pagamento via PIX, dinheiro ou outro meio) é de responsabilidade exclusiva entre contratante e contratado.<br/>
          4.3. A plataforma não se responsabiliza por calotes, atrasos ou divergências de valores combinados entre as partes.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">5. Privacidade e Contato via WhatsApp</h2>
          <p className="mt-2">5.1. Seu número de WhatsApp permanece oculto até que você aprove um candidato ou seja aprovado em uma vaga.<br/>
          5.2. Não nos responsabilizamos por conversas, acordos ou conteúdos trocados fora do ambiente da plataforma.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">6. Regras de Conduta</h2>
          <p className="mt-2">É expressamente proibido: assédio moral ou sexual, discriminação de qualquer natureza, trabalho infantil, trabalho análogo à escravidão, ou qualquer atividade ilegal. Denúncias podem ser feitas pelo canal de Suporte e serão tratadas com confidencialidade.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">7. Moderação e Remoção de Conteúdo</h2>
          <p className="mt-2">A administração do Diárias Fácil reserva-se o direito de remover, a qualquer momento e sem aviso prévio, vagas, perfis ou comentários que violem estes Termos, a legislação vigente ou que recebam denúncias consistentes.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-[13px]">8. Limitação de Responsabilidade</h2>
          <p className="mt-2">O serviço prestado é de natureza autônoma e temporária. O Diárias Fácil não garante a execução, qualidade ou resultado do serviço contratado, sendo apenas o meio de conexão entre as partes.</p>
        </section>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[11px] text-slate-600 leading-snug">Ao clicar em "Aceitar e continuar", você declara que leu, compreendeu e concorda com os Termos de Uso e com a nossa Política de Privacidade, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button onClick={aceitarEVoltar} className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-full text-[13px] font-semibold transition">Aceitar e continuar</button>
        <button onClick={onVoltar} className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-full text-[13px] font-medium hover:bg-slate-50">Voltar sem aceitar</button>
      </div>
    </div>
  )
}