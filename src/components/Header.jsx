// src/components/Header.jsx - COPIA ESSE INTEIRO

export default function Header({ usuario, isAdmin, onAdmin, onVerPerfil }) {
  return (
    <div className="sticky top-0 bg-white border-b border-slate-200" style={{ zIndex: 50 }}>
      <div className="mx-auto px-4 flex justify-between items-center" style={{ maxWidth: 640, height: 56 }}>

        <div className="flex items-center gap-2">
          <img
            src="/icon.jpeg"
            alt="Diárias Fácil"
            className="rounded-xl shadow-sm object-cover"
            style={{ width: 32, height: 32 }}
          />
          <div style={{ lineHeight: 1 }}>
            <p className="font-semibold tracking-tight" style={{ fontSize: 14 }}>
              Diárias Fácil
            </p>
            <p className="text-slate-500 tracking-widest uppercase" style={{ fontSize: 10, marginTop: 2 }}>
              {usuario?.feedCidade || "Facilidade"} - {usuario?.feedEstado || "Oportunidades"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onAdmin}
              className="bg-red-600 text-white rounded-full font-bold tracking-widest active:scale-95 transition"
              style={{ height: 32, paddingLeft: 14, paddingRight: 14, fontSize: 11 }}
            >
              Admin
            </button>
          )}

          {/* SÓ PERFIL aqui em cima */}
          <button
            onClick={onVerPerfil}
            aria-label="Abrir perfil"
            className="rounded-full overflow-hidden ring-1 ring-slate-200 shrink-0 active:scale-95 transition"
            style={{ width: 36, height: 36 }}
          >
            {usuario?.foto ? (
              <img src={usuario.foto} alt="" className="w-full h-full object-cover" />
            ) : (
              <span
                className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-600"
                style={{ fontSize: 14 }}
              >
                {usuario?.nome?.[0]?.toUpperCase() || "👤"}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}