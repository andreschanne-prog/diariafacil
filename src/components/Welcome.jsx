import { useState, useCallback } from "react";
import { Search, Megaphone, HandCoins, ArrowRight, Check } from "lucide-react";

export default function Welcome({ onEntrar }) {
  const [step, setStep] = useState(0);
  const [direcao, setDirecao] = useState(1); // 1 = avançando, -1 = voltando

  const steps = [
    {
      icon: Search,
      cor: "bg-slate-900 text-white",
      badge: "Para quem contrata",
      title: "Encontre uma diarista de confiança perto de você",
      desc: "Compare perfis, avaliações e preços. Contrate em poucos minutos, sem burocracia e sem mensalidade.",
      bullets: ["Perfis verificados", "Avaliações reais", "Contato direto"],
      cta: "Como funciona?"
    },
    {
      icon: Megaphone,
      cor: "bg-emerald-600 text-white",
      badge: "Para quem contrata",
      title: "Precisa de uma diarista? Publique sua vaga",
      desc: "Crie um anúncio em menos de 1 minuto. Receba candidaturas, analise o perfil de cada profissional e escolha quem você quiser.",
      bullets: ["Anúncio gratuito", "Você escolhe quem contratar", "Sem intermediários"],
      cta: "E para quem quer trabalhar?"
    },
    {
      icon: HandCoins,
      cor: "bg-amber-500 text-white",
      badge: "Para diaristas",
      title: "Ganhe uma renda extra com diárias",
      desc: "Veja todas as vagas da sua cidade. Gostou de uma? Candidate-se. Se for selecionada, o contato do contratante aparece na hora para você combinar.",
      bullets: ["Vagas da sua cidade", "Candidatura em 1 clique", "Pagamento direto com o cliente"],
      cta: "Começar agora"
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  const avancar = useCallback(() => {
    if (step < steps.length - 1) {
      setDirecao(1);
      setStep(s => s + 1);
    } else {
      onEntrar();
    }
  }, [step, onEntrar, steps.length]);

  const voltar = () => {
    if (step > 0) {
      setDirecao(-1);
      setStep(s => s - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w- mx-auto px-6 py-6 sm:py-8 relative overflow-hidden">
      {/* Header - Bigtech style */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/icon.jpeg" alt="Diárias Fácil" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
          <span className="font-bold tracking-tight text- text-slate-900">Diárias Fácil</span>
        </div>
        {step < steps.length - 1 && (
          <button
            onClick={onEntrar}
            className="text- font-semibold text-slate-500 hover:text-slate-900 transition px-2 py-1"
          >
            Pular
          </button>
        )}
      </header>

      {/* Barra de progresso - igual 【entity-Duolingo¦canonical_name=Duolingo】 / 【entity-Airbnb¦canonical_name=Airbnb】 */}
      <div className="flex gap-1.5 mt-6" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={3} aria-label={`Passo ${step + 1} de 3`}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirecao(i > step ? 1 : -1); setStep(i); }}
            aria-label={`Ir para passo ${i + 1}`}
            className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
              i <= step ? "bg-slate-900" : "bg-slate-100 hover:bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Conteúdo */}
      <main key={step} className="flex-1 flex flex-col justify-center py-8 animate-[fadeSlideIn_0.35s_ease-out]">
        {/* Ícone do step */}
        <div className={`w- h- rounded- flex items-center justify-center shadow-lg ${current.cor}`}>
          <Icon className="w-8 h-8" strokeWidth={1.8} />
        </div>

        <span className="inline-flex w-fit mt-6 px-2.5 py-1 rounded-full bg-slate-100 text- font-bold tracking-wide uppercase text-slate-600">
          {current.badge}
        </span>

        <h1 className="text- sm:text- font-bold tracking-[-0.02em] leading-[1.15] text-slate-900 mt-3">
          {current.title}
        </h1>

        <p className="text- text-slate-500 mt-3 leading-[1.6]">
          {current.desc}
        </p>

        {/* Bullets - prova de valor, igual bigtech */}
        <ul className="mt-6 space-y-2.5">
          {current.bullets.map(b => (
            <li key={b} className="flex items-center gap-2.5 text- text-slate-700">
              <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </main>

      {/* Footer */}
      <footer className="space-y-3 pb-2">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={voltar}
              className="h-12 px-5 rounded-full border border-slate-200 text- font-medium text-slate-700 hover:bg-slate-50 transition shrink-0"
            >
              Voltar
            </button>
          )}
          <button
            onClick={avancar}
            className="flex-1 h-12 bg-slate-900 text-white rounded-full font-semibold text- hover:bg-black active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            {current.cta}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text- text-slate-400">
          {step === steps.length - 1 ? (
            <>Ao continuar, você concorda com nossos <span className="underline font-medium text-slate-600">Termos</span> e <span className="underline font-medium text-slate-600">Privacidade</span></>
          ) : (
            <>Grátis para usar • Sem mensalidade • Sem compromisso</>
          )}
        </p>
      </footer>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(${direcao * 12}px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}