import { useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export default function Denuncias({ denuncias = [], vagas = [], onVoltar }) {
  const [busca, setBusca] = useState("");
  const [expandidaId, setExpandidaId] = useState(null);

  // Filtra as denúncias pela busca
  const denunciasFiltradas = denuncias.filter(d => {
    if (!busca) return true;
    const txt = `${d.vagaTitulo || ""} ${d.motivo || ""} ${d.detalhe || ""} ${d.autorEmail || ""} ${d.denunciante || ""}`.toLowerCase();
    return txt.includes(busca.toLowerCase());
  });

  const deletarVagaDenunciada = async (vagaId, denunciaId) => {
    if (!confirm("Tem certeza que deseja apagar permanentemente esta vaga/post denunciado?")) return;
    try {
      if (vagaId) {
        await deleteDoc(doc(db, "vagas", vagaId));
      }
      await deleteDoc(doc(db, "denuncias", denunciaId));
      alert("Post/Vaga removido com sucesso!");
    } catch (err) {
      console.error("Erro ao deletar:", err);
      alert("Erro ao remover o post.");
    }
  };

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-[#fef9ef] pb-24">
      {/* TOPO */}
      <div className="bg-black text-white p-4 sticky top-0 z-20 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="w-9 h-9 bg-white text-black rounded-full font-bold flex items-center justify-center text-sm shadow">←</button>
          <div>
            <h2 className="font-black text-[15px] tracking-wide leading-none">🚨 CENTRAL DE DENÚNCIAS</h2>
            <p className="text-[10px] opacity-60 mt-1">{denuncias.length} denúncia(s) recebida(s)</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* BARRA DE PESQUISA */}
        <div className="bg-white border rounded-2xl p-3">
          <input 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
            placeholder="Pesquisar por título, motivo, detalhe ou usuário..." 
            className="w-full border rounded-full px-4 py-2 text-[12px] outline-none focus:border-slate-900" 
          />
        </div>

        {denunciasFiltradas.length === 0 ? (
          <div className="bg-white border border-dashed rounded-2xl p-10 text-center mt-6">
            <p className="text-[13px] font-medium text-slate-700">Nenhuma denúncia encontrada.</p>
            <p className="text-[11px] text-slate-400 mt-1">Sua plataforma está limpa e segura no momento!</p>
          </div>
        ) : (
          denunciasFiltradas.map(d => {
            const estaExpandida = expandidaId === d.id;
            
            // Tenta encontrar a vaga correspondente no array de vagas carregadas
            const vagaVinculada = vagas.find(v => v.id === d.vagaId || v.titulo === d.vagaTitulo);

            let dataFormatada = "Data não informada";
            if (d.criadoEm) {
              try {
                const dt = d.criadoEm.toDate ? d.criadoEm.toDate() : new Date(d.criadoEm);
                dataFormatada = dt.toLocaleString('pt-BR');
              } catch {}
            }

            // Pega o texto detalhado (seja d.detalhe ou se o motivo contiver mais informações)
            const textoDetalhe = d.detalhe || (d.motivo?.includes(":") ? d.motivo.split(":")[1]?.trim() : "");

            return (
              <div key={d.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition">
                {/* CABEÇALHO DO CARD (CLICÁVEL PARA EXPANDIR) */}
                <div 
                  onClick={() => setExpandidaId(estaExpandida ? null : d.id)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">PENDENTE</span>
                    <p className="font-bold text-[13px] text-slate-900 mt-1.5 truncate">{d.vagaTitulo || "Post sem título"}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5"><b>Motivo:</b> {d.motivo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{dataFormatada}</span>
                    <span className="text-xs text-slate-400 font-bold">{estaExpandida ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* CONTEÚDO EXPANSÍVEL (MOSTRA O POST DENUNCIADO E O TEXTO ESCRITO) */}
                {estaExpandida && (
                  <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detalhes da Denúncia:</p>
                      <p className="text-[12px] text-slate-700"><b>Denunciante:</b> {d.denuncianteNome || d.denunciante || d.denuncianteEmail || d.autorEmail || "Anônimo"}</p>
                      <p className="text-[12px] text-slate-700"><b>Motivo principal:</b> {d.motivo}</p>
                      
                      {/* EXIBIÇÃO DO TEXTO DIGITADO PELO USUÁRIO (DETALHE) */}
                      {textoDetalhe ? (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-600 mb-0.5">Texto digitado pelo usuário:</p>
                          <p className="text-[12px] text-slate-900 bg-red-50/60 border border-red-100 p-2.5 rounded-lg italic leading-relaxed">
                            "{textoDetalhe}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic mt-1">Nenhum detalhe adicional foi escrito (motivo padrão selecionado).</p>
                      )}
                    </div>

                    {/* PRÉ-VISUALIZAÇÃO DO POST / VAGA */}
                    <div className="bg-white border-2 border-red-100 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Post/Vaga Denunciado:</p>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">ID: {d.vagaId || "N/A"}</span>
                      </div>

                      {vagaVinculada ? (
                        <div className="space-y-1">
                          <p className="font-black text-[13px] text-slate-900">{vagaVinculada.titulo}</p>
                          <p className="text-[11px] text-slate-600">📍 {vagaVinculada.cidade || "Sinop"} • R$ {vagaVinculada.valor || "A combinar"}</p>
                          {vagaVinculada.descricao && (
                            <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg mt-2">
                              {vagaVinculada.descricao}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          O post original pode ter sido apagado ou o ID não corresponde exatamente às vagas ativas (Título: "{d.vagaTitulo}").
                        </p>
                      )}
                    </div>

                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex gap-2 pt-1">
                      {vagaVinculada && (
                        <button 
                          onClick={() => deletarVagaDenunciada(vagaVinculada.id, d.id)}
                          className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold transition shadow-xs"
                        >
                          🗑️ APAGAR POST DENUNCIADO
                        </button>
                      )}
                      <button 
                        onClick={async () => {
                          if(confirm("Remover apenas o aviso de denúncia?")) {
                            await deleteDoc(doc(db, "denuncias", d.id));
                          }
                        }}
                        className="h-9 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition"
                      >
                        Dispensar Denúncia
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}