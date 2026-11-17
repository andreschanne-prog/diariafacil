// src/components/AppFooter.jsx - COMPACTO

export default function AppFooter({ onVerTermos, onVerPrivacidade, onComoFunciona }) {
  return (
    <div className="mx-auto px-4" style={{ maxWidth: 640, marginTop: 20, marginBottom: 90 }}>
      <div className="bg-white border border-slate-200 rounded-2xl" style={{ padding: 12 }}>
        
        <div className="flex items-center gap-2">
          <img src="/icon.jpeg" className="rounded-full object-cover" style={{ width: 20, height: 20 }} alt="" />
          <p className="font-semibold" style={{ fontSize: 12 }}>Diárias Fácil • Brasil</p>
          <span className="text-slate-400" style={{ fontSize: 11 }}>© 2026</span>
        </div>

        <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
          <button
            onClick={onVerTermos}
            className="bg-slate-50 border border-slate-200 rounded-full"
            style={{ fontSize: 11, paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5 }}
          >
            Termos de Uso
          </button>
          <button
            onClick={onVerPrivacidade}
            className="bg-slate-50 border border-slate-200 rounded-full"
            style={{ fontSize: 11, paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5 }}
          >
            Privacidade - LGPD
          </button>
          <button
            onClick={onComoFunciona}
            className="bg-slate-50 border border-slate-200 rounded-full"
            style={{ fontSize: 11, paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5 }}
          >
            Como funciona?
          </button>
        </div>

        <p className="text-slate-400" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
          Donas de casa • Empreendedores • Prestadores • Diaristas
        </p>
      </div>
    </div>
  );
}