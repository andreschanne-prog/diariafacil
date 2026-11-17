// src/pages/VagasAceitas.jsx - VERSÃO BIGTECH
import { useState } from "react";

export default function VagasAceitas({ vagas = [], usuario }) {
  const [clicadosZap, setClicadosZap] = useState(new Set());
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Só vagas onde EU fui aceito
  const aceitas = vagas.filter(v =>
    v.candidatos?.some(c =>
      (c.uid === usuario?.uid || c.email === usuario?.email || c.nome === usuario?.nome) && c.aprovado === true
    )
  );

  const abrirZap = (vagaId, zap) => {
    const num = zap?.replace(/\D/g, "") || "";
    if (!num) return mostrarToast("Contato não encontrado");
    setClicadosZap(prev => new Set(prev).add(vagaId));
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent("Olá! Fui aceito(a) para a sua vaga no Diárias Fácil. Podemos alinhar os detalhes?")}`, "_blank");
  };

  return (
    <div className="mx-auto min-h-screen bg-slate-50" style={{ maxWidth: 640, padding: "16px 16px 110px" }}>

      {/* HEADER */}
      <div>
        <h2 className="font-bold tracking-tight" style={{ fontSize: 20 }}>Vagas aceitas</h2>
        <p className="text-slate-500" style={{ fontSize: 12, marginTop: 4 }}>
          {aceitas.length > 0 ? `${aceitas.length} ${aceitas.length === 1 ? "anunciante escolheu você" : "anunciantes escolheram você"}` : "Anunciantes que escolherem você aparecem aqui"}
        </p>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {aceitas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl text-center" style={{ padding: 28 }}>
            <div className="mx-auto bg-emerald-50 rounded-full flex items-center justify-center" style={{ width: 56, height: 56, fontSize: 22 }}>✓</div>
            <p className="font-bold" style={{ fontSize: 14, marginTop: 12 }}>Nenhuma vaga aceita ainda</p>
            <p className="text-slate-500" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>
              Quando um anunciante te aceitar, vai aparecer aqui com o contato liberado para você combinar os detalhes.
            </p>
          </div>
        ) : (
          aceitas.map(v => {
            const zapLimpo = v.zap || v.whatsapp || "";
            const jaClicou = clicadosZap.has(v.id);
            return (
              <div key={v.id} className="bg-white border rounded-3xl overflow-hidden" style={{ borderColor: jaClicou ? "#E2E8F0" : "#BBF7D0" }}>
                {/* TOPO DO CARD */}
                <div style={{ padding: "16px 16px 0" }}>
                  <div className="flex justify-between items-start gap-2">
                    <div style={{ minWidth: 0 }}>
                      <span className="bg-emerald-50 text-emerald-700 rounded-full font-bold" style={{ fontSize: 10, padding: "4px 8px" }}>Você foi aceito</span>
                      <p className="font-bold leading-tight truncate" style={{ fontSize: 15, marginTop: 10 }}>{v.titulo}</p>
                      <p className="text-slate-500" style={{ fontSize: 12, marginTop: 4 }}>{v.cidade} • R$ {v.valor}</p>
                    </div>
                    <span className="bg-emerald-600 text-white rounded-full font-bold shrink-0" style={{ fontSize: 10, padding: "5px 10px" }}>ACEITA</span>
                  </div>

                  {v.descricao && <p className="text-slate-600 bg-slate-50 rounded-xl" style={{ fontSize: 12, lineHeight: 1.5, padding: 10, marginTop: 12 }}>{v.descricao}</p>}
                </div>

                {/* CONTATO LIBERADO */}
                <div className="bg-emerald-50 border-t border-emerald-100" style={{ padding: 16, marginTop: 14 }}>
                  <p className="font-bold text-emerald-800 uppercase tracking-wider" style={{ fontSize: 10 }}>Contato liberado</p>
                  <p className="font-bold" style={{ fontSize: 16, marginTop: 4, letterSpacing: 0.5 }}>{zapLimpo || "—"}</p>
                  <button
                    onClick={() => abrirZap(v.id, zapLimpo)}
                    className="w-full bg-emerald-600 text-white rounded-full font-bold"
                    style={{ height: 44, fontSize: 13, marginTop: 12 }}
                  >
                    {jaClicou ? "Abrir WhatsApp novamente" : "Chamar no WhatsApp"}
                  </button>
                  {jaClicou && <p className="text-emerald-700 text-center" style={{ fontSize: 11, marginTop: 8 }}>Você já abriu esse contato</p>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {toast && <div className="fixed left-1/2 text-white bg-slate-900 rounded-full shadow-xl font-semibold" style={{ bottom: 96, transform: "translateX(-50%)", padding: "12px 16px", fontSize: 13, zIndex: 110, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}