import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useState } from "react";
import { auth } from "../firebase.js";

const formatarDataLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function MinhasVagas({ vagas = [], usuario, onVerPerfil }) {
  const [aprovando, setAprovando] = useState(null);
  const [imgErros, setImgErros] = useState({});
  const uidAtual = auth.currentUser?.uid || usuario?.uid;
  const hojeStr = formatarDataLocal(new Date());

  const minhasVagas = vagas.filter(v => {
    if (!uidAtual) return false;
    return v.anuncianteId === uidAtual || v.anuncianteEmail === usuario?.email;
  });

  const aprovarCandidato = async (vaga, index) => {
    const candidato = vaga.candidatos?.[index];
    if(!candidato) return;
    const qtd = parseInt(vaga.qtd) || 1;
    const jaAprovados = (vaga.candidatos || []).filter(c=>c.aprovado).length;
    const vaiFicar = jaAprovados + 1;
    if(!confirm(`Liberar seu zap pra ${candidato.nome}? ${vaiFicar}/${qtd} ${vaiFicar >= qtd ? '- Vai fechar a vaga!' : ''}`)) return;
    
    setAprovando(`${vaga.id}-${index}`);
    try {
      const ref = doc(db, "vagas", vaga.id);
      const novos = [...(vaga.candidatos || [])];
      novos[index] = { ...novos[index], aprovado: true };
      const totalAprovadosAgora = novos.filter(c=>c.aprovado).length;
      const deveFechar = totalAprovadosAgora >= qtd;
      if(deveFechar){
        await updateDoc(ref, { 
          candidatos: novos,
          fechada: true,
          status: "preenchida",
          fechadaEm: new Date(),
          aceitaPor: novos.filter(c=>c.aprovado).map(c=>c.uid)
        });
        alert(`✅ Vaga preenchida!`);
      } else {
        await updateDoc(ref, { candidatos: novos });
        alert(`✅ ${candidato.nome} aprovado! ${totalAprovadosAgora}/${qtd}`);
      }
    } catch(e) {
      alert("Erro: " + e.message);
    }
    setAprovando(null);
  };

  const reabrirVaga = async (vaga) => {
    if(!confirm("Reabrir essa vaga?")) return;
    await updateDoc(doc(db, "vagas", vaga.id), { fechada: false, status: "aberta", fechadaEm: null });
  };

  const verificarExpirada = (v) => {
    if (v.datasEspecificas && v.datasEspecificas.length > 0) {
      const datasOrdenadas = [...v.datasEspecificas].sort();
      const ultimaData = datasOrdenadas[datasOrdenadas.length - 1];
      return ultimaData < hojeStr;
    }
    return false;
  };

  const abertas = minhasVagas.filter(v => !v.fechada && v.status !== "preenchida" && !verificarExpirada(v));
  const expiradas = minhasVagas.filter(v => !v.fechada && v.status !== "preenchida" && verificarExpirada(v));
  const fechadas = minhasVagas.filter(v => v.fechada || v.status === "preenchida");

  return (
    <div className="max-w-[640px] mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-28">
      <h2 className="text-[15px] font-semibold tracking-tight">Minhas vagas</h2>
      <p className="text-[11px] text-slate-500 mt-1">
        Logado como {usuario?.email} • {abertas.length} aberta(s)
      </p>

      <div className="mt-6 space-y-3">
        {minhasVagas.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 p-8 rounded-2xl text-center">
            <p className="font-medium text-[13px]">Nenhuma vaga sua</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Você está vendo {vagas.length} vagas no total, mas 0 são suas.
            </p>
          </div>
        )}

        {/* VAGAS ABERTAS */}
        {abertas.map(v => {
          const fotoVaga = v.fotoVaga || v.fotoUrl || "";
          return (
            <div key={v.id} className="bg-white border border-slate-200 p-4 rounded-2xl">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium text-[14px] leading-tight">{v.titulo}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {v.cidade} • R$ {v.valor} • {v.candidatos?.filter(c=>c.aprovado).length || 0}/{v.qtd || 1}
                  </p>
                </div>
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                  {v.candidatos?.length || 0} cand.
                </span>
              </div>

              {/* FOTO DA VAGA */}
              {fotoVaga && !imgErros[v.id] && (
                <div className="mt-3 w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img 
                    src={fotoVaga} 
                    alt="Foto da vaga" 
                    onError={() => setImgErros(prev => ({ ...prev, [v.id]: true }))} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}

              <div className="mt-4 space-y-2">
                {(v.candidatos || []).map((c, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <div 
                      onClick={() => onVerPerfil && onVerPerfil(c)} 
                      className="flex items-center gap-2 cursor-pointer group flex-1"
                      title="Clique para ver o perfil"
                    >
                      {c.foto ? (
                        <img src={c.foto} alt={c.nome} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700">
                          {c.nome?.[0]?.toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <span className="font-medium text-[12px] group-hover:text-blue-600 transition">
                          {c.nome} {c.aprovado && "✓"}
                        </span>
                        <span className="text-[9px] text-slate-400 group-hover:underline">
                          Ver perfil →
                        </span>
                      </div>
                    </div>

                    <div>
                      {!c.aprovado ? (
                        <button 
                          onClick={() => aprovarCandidato(v, i)} 
                          disabled={aprovando === `${v.id}-${i}`} 
                          className="h-7 bg-slate-900 text-white px-3 rounded-full text-[11px] font-medium disabled:opacity-50 hover:bg-black transition"
                        >
                          {aprovando === `${v.id}-${i}` ? "..." : "Aprovar"}
                        </button>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          Liberado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!v.candidatos || v.candidatos.length === 0) && (
                  <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl text-center border border-dashed">
                    Ninguém ainda 🔒
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* VAGAS EXPIRADAS / CUJA DATA PASSOU */}
        {expiradas.length > 0 && (
          <>
            <p className="text-[11px] font-medium tracking-widest uppercase text-amber-600 pt-4">Expiradas por data</p>
            {expiradas.map(v => {
              const fotoVaga = v.fotoVaga || v.fotoUrl || "";
              return (
                <div key={v.id} className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[13px] text-slate-800">{v.titulo}</p>
                      <p className="text-[11px] text-amber-700 mt-1">⚠️ A data programada desta vaga já passou e ela foi retirada do feed automaticamente.</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full">Expirada</span>
                  </div>
                  {fotoVaga && !imgErros[v.id] && (
                    <div className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-amber-200 bg-slate-100 opacity-80">
                      <img src={fotoVaga} alt="Foto da vaga" onError={() => setImgErros(prev => ({ ...prev, [v.id]: true }))} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* VAGAS PREENCHIDAS / FECHADAS */}
        {fechadas.length > 0 && (
          <>
            <p className="text-[11px] font-medium tracking-widest uppercase text-slate-400 pt-4">Preenchidas / Fechadas</p>
            {fechadas.map(v => {
              const fotoVaga = v.fotoVaga || v.fotoUrl || "";
              return (
                <div key={v.id} className="bg-white border border-slate-200 p-4 rounded-2xl opacity-75">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-[13px]">{v.titulo} <span className="text-emerald-600">✓ Fechada</span></p>
                    <button onClick={() => reabrirVaga(v)} className="h-7 bg-white border border-slate-200 px-3 rounded-full text-[11px] hover:bg-slate-50">
                      Reabrir
                    </button>
                  </div>
                  {fotoVaga && !imgErros[v.id] && (
                    <div className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={fotoVaga} alt="Foto da vaga" onError={() => setImgErros(prev => ({ ...prev, [v.id]: true }))} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  )
}
