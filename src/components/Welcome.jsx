import { useState } from "react";

export default function Welcome({ onEntrar }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: "/icon.jpeg",
      title: "Bem-vindo ao Diárias Fácil",
      desc: "Aqui você encontra diárias perto de você, e também pode contratar diáristas para te auxiliar nas suas tarefas",
      cta: "Como funciona?"
    },
    {
      icon: "/icon.jpeg",
      title: "Precisa de diarista?",
      desc: "Crie um anuncio ofereçendo vagas pra diáristas se candidatarem a vaga. você escolhe quem deseja depois de analizar o perfil de cada candidato.",
      cta: "E pra quem quer trabalhar?"
    },
    {
      icon: "/icon.jpeg",
      title: "Precisa de umas diarias pra salvar o orçamento no fim do mês?",
      desc: "Veja todas as vagas da sua cidade. Se interessou? clica e se candidate, se for escolhido pra vaga logo aparecerá o contato do anunciante.",
      cta: "Começar agora?"
    }
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between px-6 py-10 max-w-[440px] mx-auto">
      {/* Logo topo */}
      <div className="w-full flex justify-center pt-4">
        <img src="/icon.jpeg" alt="logo" className="w-12 h-12 rounded-2xl shadow-lg" />
      </div>

      {/* Conteúdo do step */}
      <div className="flex-1 flex flex-col items-center justify-center text-center mt-10">
        {current.icon.startsWith("/") ? (
          <img src={current.icon} className="w-24 h-24 rounded-3xl shadow-xl mb-8" />
        ) : (
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl mb-8">
            {current.icon}
          </div>
        )}

        <h1 className="text-[28px] font-bold tracking-tight leading-[1.1] text-slate-900">
          {current.title}
        </h1>
        <p className="text-[15px] text-slate-500 mt-4 leading-relaxed max-w-[320px]">
          {current.desc}
        </p>

        {/* Dots */}
        <div className="flex gap-2 mt-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-slate-900' : 'w-2 bg-slate-200'}`} />
          ))}
        </div>
      </div>

      {/* Botões */}
      <div className="w-full space-y-3 pb-6">
        <button
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else onEntrar();
          }}
          className="w-full h-12 bg-slate-900 text-white rounded-full font-medium text-[15px] hover:bg-black transition"
        >
          {current.cta}
        </button>

        {step < 2 ? (
          <button onClick={onEntrar} className="w-full h-12 text-slate-500 text-[14px]">
            Pular introdução
          </button>
        ) : (
          <p className="text-center text-[11px] text-slate-400">
            Grátis • Sem mensalidade • seguro
          </p>
        )}
      </div>
    </div>
  );
}