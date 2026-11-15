export default function Privacidade({ onVoltar, onAceitar }) {
  const aceitarEVoltar = () => {
    localStorage.setItem("privacidade_lida", "true");
    localStorage.setItem("privacidade_aceite_data", new Date().toISOString());
    if (onAceitar) onAceitar();
    onVoltar();
  };

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-white p-6 pb-28">
      <button onClick={onVoltar} className="w-9 h-9 border border-slate-200 rounded-full text-[13px] hover:bg-slate-50">←</button>
      
      <div className="mt-6">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Política de Privacidade</h1>
        <p className="text-[12px] text-slate-500 mt-1">Em conformidade com a Lei Geral de Proteção de Dados - Lei nº 13.709/2018</p>
        <p className="text-[11px] text-slate-400 mt-1">Diárias Fácil • Sinop - MT • Última atualização: 13/11/2025</p>
      </div>

      <div className="mt-8 space-y-6 text-[13px] leading-relaxed text-slate-700">

        <section>
          <h2 className="font-semibold text-slate-900">1. Controlador e Dados Coletados</h2>
          <p className="mt-2">O Diárias Fácil, na qualidade de controlador, coleta os seguintes dados: nome completo, e-mail, foto de perfil, número de WhatsApp, cidade/estado de atuação (ex: Sinop, Sorriso, Lucas do Rio Verde), geolocalização precisa (apenas se o usuário ativar a função GPS), e histórico de vagas publicadas e candidaturas realizadas.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">2. Finalidade do Tratamento</h2>
          <p className="mt-2">2.1. Os dados são tratados para: (i) viabilizar a conexão entre contratantes e prestadores; (ii) exibir vagas compatíveis com sua localização (Feed por Cidade/Estado); (iii) garantir a segurança da plataforma; (iv) identificação do perfil profissional.<br/>
          2.2. Seu número de WhatsApp permanece oculto e só é exibido após aprovação mútua entre as partes.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">3. Avaliações Públicas e Exposição de Comentários</h2>
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-900 text-[12px]">AVISO DE PUBLICIDADE - LEIA COM ATENÇÃO:</p>
            <p className="mt-2 text-amber-800 text-[12px] leading-relaxed">
              3.1. Ao avaliar um prestador de serviço (diarista, faxineira ou outro profissional), você está ciente e concorda que sua avaliação é <b>PÚBLICA, EXPOSTA E PERMANENTE</b> no perfil do prestador avaliado.<br/><br/>
              3.2. Serão exibidos publicamente no perfil do profissional: <b>seu nome, sua foto de perfil, a nota atribuída (estrelas), o comentário escrito e a data da avaliação</b>, além do título da vaga relacionada.<br/><br/>
              3.3. Qualquer usuário da plataforma poderá visualizar quem postou a avaliação. Não é possível avaliar de forma anônima.<br/>
              3.4. Ao publicar, você declara que o comentário é verdadeiro, baseado em experiência real e não contém ofensa, calúnia ou difamação. Comentários que violem nossas regras poderão ser removidos pela moderação.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">4. Armazenamento e Segurança</h2>
          <p className="mt-2">4.1. Os dados são armazenados em servidores seguros do Google Firebase (Firestore e Authentication), com criptografia em trânsito e em repouso.<br/>
          4.2. Adotamos medidas técnicas e administrativas para proteger seus dados contra acessos não autorizados.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">5. Compartilhamento de Dados</h2>
          <p className="mt-2">5.1. Não vendemos ou comercializamos seus dados pessoais.<br/>
          5.2. Compartilhamos apenas seu perfil público (nome, foto, cidade, especialidades, bio e avaliações recebidas) com os demais usuários para fins de contratação.<br/>
          5.3. Dados poderão ser compartilhados por obrigação legal ou ordem judicial.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">6. Seus Direitos (LGPD)</h2>
          <p className="mt-2">Nos termos dos Art. 18 da LGPD, você pode a qualquer momento: solicitar acesso, correção, anonimização ou exclusão total dos seus dados. Para exercer seus direitos, acesse Perfil {'>'} Deletar conta ou entre em contato com nosso Suporte.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">7. Cookies e Armazenamento Local</h2>
          <p className="mt-2">Utilizamos LocalStorage para armazenar preferências como `local_diariafacil`, `feed_cidade_diariafacil`, `feed_estado_diariafacil` e `coords_diariafacil`, com a finalidade de melhorar sua experiência e lembrar sua cidade de interesse. Não utilizamos cookies de rastreamento de terceiros.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900">8. Idade Mínima</h2>
          <p className="mt-2">O cadastro na plataforma é permitido apenas para maiores de 18 (dezoito) anos, conforme legislação trabalhista vigente.</p>
        </section>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[11px] text-slate-600 leading-snug">Ao prosseguir, você declara ter lido e concordado com esta Política e com os Termos de Uso, autorizando o tratamento de seus dados conforme descrito, inclusive a exposição pública de suas avaliações e comentários no perfil de prestadores.</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button onClick={aceitarEVoltar} className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-full text-[13px] font-semibold transition">Aceitar e continuar</button>
        <button onClick={onVoltar} className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-full text-[13px] font-medium hover:bg-slate-50">Voltar sem aceitar</button>
      </div>
    </div>
  )
}