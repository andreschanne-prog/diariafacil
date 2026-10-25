import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useState } from "react";
import { auth } from "../firebase.js";

export default function MinhasVagas({ vagas = [], usuario }) {
  const [aprovando, setAprovando] = useState(null);
  const uidAtual = auth.currentUser?.uid || usuario?.uid;

  // SEGURANÇA DUPLA: filtra aqui de novo, não confia só no App
  const minhasVagas = vagas.filter(v => {
    if (!uidAtual) return false;
    // compara uid E email pra garantir
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
  }

  const abertas = minhasVagas.filter(v => !v.fechada && v.status !== "preenchida");
  const fechadas = minhasVagas.filter(v => v.fechada || v.status === "preenchida");

  return (
    <div className="max-w-[640px] mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-28">
      <h2 className="text-[15px] font-semibold tracking-tight">Minhas vagas</h2>
      <p className="text-[11px] text-slate-500 mt-1">Logado como {usuario?.email} • UID: {uidAtual?.slice(0,6)} • {abertas.length} aberta(s)</p>

      <div className="mt-6 space-y-3">
        {minhasVagas.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 p-8 rounded-2xl text-center">
            <p className="font-medium text-[13px]">Nenhuma vaga sua</p>
            <p className="text-[11px] text-slate-500 mt-1">Você está vendo {vagas.length} vagas no total, mas 0 são suas (filtro por UID)</p>
            <p className="text-[10px] text-red-400 mt-2">Se deveria ter vaga aqui, a vaga foi criada com outro UID. Precisa arrumar no CriarVaga.</p>
          </div>
        )}

        {abertas.map(v => (
          <div key={v.id} className="bg-white border border-slate-200 p-4 rounded-2xl">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-medium text-[14px] leading-tight">{v.titulo}</p>
                <p className="text-[11px] text-slate-500 mt-1">{v.cidade} • {v.valor} • {v.qtd || 1} • {v.candidatos?.filter(c=>c.aprovado).length || 0}/{v.qtd || 1}</p>
                <p className="text-[9px] text-slate-400 mt-1">Dono: {v.anuncianteId?.slice(0,6)} - Você: {uidAtual?.slice(0,6)}</p>
              </div>
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-50 border border-slate-200">{v.candidatos?.length || 0} cand.</span>
            </div>
            <div className="mt-4 space-y-2">
              {(v.candidatos || []).map((c,i)=>(
                <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold">{c.nome?.[0]?.toUpperCase()}</div>
                    <span className="font-medium text-[12px]">{c.nome} {c.aprovado && "✓"}</span>
                  </div>
                  {!c.aprovado ? (
                    <button onClick={()=>aprovarCandidato(v, i)} disabled={aprovando === `${v.id}-${i}`} className="h-7 bg-slate-900 text-white px-3 rounded-full text-[11px] font-medium disabled:opacity-50">{aprovando === `${v.id}-${i}` ? "..." : "Aprovar"}</button>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">Liberado</span>
                  )}
                </div>
              ))}
              {(!v.candidatos || v.candidatos.length===0) && <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl text-center border border-dashed">Ninguém ainda 🔒</p>}
            </div>
          </div>
        ))}

        {fechadas.length > 0 && (
          <>
            <p className="text-[11px] font-medium tracking-widest uppercase text-slate-400 pt-4">Preenchidas</p>
            {fechadas.map(v=>(
              <div key={v.id} className="bg-white border border-slate-200 p-4 rounded-2xl opacity-60">
                <p className="font-medium text-[13px]">{v.titulo} • fechada ✓</p>
                <button onClick={()=>reabrirVaga(v)} className="mt-3 h-7 bg-white border border-slate-200 px-3 rounded-full text-[11px]">Reabrir</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}