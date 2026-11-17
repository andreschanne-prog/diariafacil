// src/components/BottomNav.jsx - Só texto, sem ícones - CORRIGIDO

export default function BottomNav({ tela, onNavegar, aceitasCount }) {
  const itens = [
    { id: "feed", label: "Início" },
    { id: "minhas", label: "Minhas vagas" },
    { id: "criar", label: "Criar vaga" },
    { id: "aceitas", label: "Aceitas", badge: aceitasCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="mx-auto flex justify-around px-2" style={{ maxWidth: 640 }}>
        {itens.map((item) => {
          const ativo = tela === item.id;
          const isCriar = item.id === "criar";
          return (
            <button
              key={item.id}
              onClick={() => onNavegar(item.id)}
              className="relative flex items-center justify-center rounded-full font-semibold transition active:scale-95"
              style={{
                minWidth: 64,
                height: 40,
                marginTop: 8,
                marginBottom: 8,
                paddingLeft: 14,
                paddingRight: 14,
                fontSize: 12,
                color: isCriar ? "#FFFFFF" : ativo ? "#0F172A" : "#64748B",
                backgroundColor: isCriar ? "#0F172A" : ativo ? "#F1F5F9" : "transparent",
              }}
            >
              <span className="leading-none whitespace-nowrap">{item.label}</span>

              {item.badge > 0 && (
                <span
                  className="absolute bg-red-500 text-white font-bold rounded-full flex items-center justify-center leading-none px-1"
                  style={{ top: -4, right: -2, minWidth: 16, height: 16, fontSize: 9 }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}