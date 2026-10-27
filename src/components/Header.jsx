export default function Header({ onPostar, usuario, isAdmin, onAdmin }) {
  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-[640px] mx-auto px-4 h-[56px] flex justify-between items-center">
        {/* Logo clean com ícone oficial */}
        <div className="flex items-center gap-2">
          <img 
            Diariafacil="public/icon.jpeg" 
            alt="DiariaFacil" 
            className="w-8 h-8 rounded-xl shadow-sm object-cover"
          />
          <div className="leading-none">
            <p className="text-[13px] font-semibold tracking-tight">DiariaFacil</p>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase -mt-0.5">
              {usuario?.feedCidade || "Sempre uma vaga"} - {usuario?.feedEstado || "perto de você"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={onAdmin} 
              className="h-8 bg-red-600 hover:bg-red-700 text-white px-4 rounded-full text-[11px] font-bold tracking-widest transition-colors"
            >
              Admin
            </button>
          )}
          
          <button 
            onClick={onPostar} 
            className="h-8 bg-slate-900 hover:bg-black text-white px-4 rounded-full text-[12px] font-medium tracking-wide transition-colors"
          >
            Postar vaga
          </button>
        </div>
      </div>
    </div>
  )
}