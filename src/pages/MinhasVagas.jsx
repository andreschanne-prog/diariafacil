// src/pages/MinhasVagas.jsx - COMPACTA
import { doc, updateDoc, collection, query, where, onSnapshot, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { useState, useEffect, useMemo, useCallback } from "react";
import { MoreHorizontal, Check, X, Trash2, RotateCcw, Users, CalendarX, Briefcase, ChevronRight, MessageCircle, ShieldCheck, Loader2, AlertTriangle, Expand } from "lucide-react";

export default function MinhasVagas({ vagas = [], usuario, onVerPerfil }) {
  const [carregandoAcao, setCarregandoAcao] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [indicacoes, setIndicacoes] = useState([]);
  const [aba, setAba] = useState("abertas");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [imgErros, setImgErros] = useState({});
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const uidAtual = auth.currentUser?.uid || usuario?.uid;
  const hojeStr = new Date().toISOString().slice(0, 10);

  const mostrarToast = useCallback((msg, tipo = "sucesso") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!uidAtual) return;
    const q = query(collection(db, "indicacoes"), where("anuncianteId", "==", uidAtual));
    const unsub = onSnapshot(q, (snap) => setIndicacoes(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    return () => unsub();
  }, [uidAtual]);

  const minhasVagas = useMemo(() => vagas.filter(v => v.anuncianteId === uidAtual || v.anuncianteEmail === usuario?.email), [vagas, uidAtual, usuario?.email]);

  const verificarExpirada = useCallback((v) => {
    if (!v.datasEspecificas?.length) return false;
    const ultima = [...v.datasEspecificas].sort().at(-1);
    return ultima < hojeStr;
  }, [hojeStr]);

  const { abertas, expiradas, fechadas } = useMemo(() => {
    return {
      abertas: minhasVagas.filter(v => !v.fechada && v.status !== "preenchida" && !verificarExpirada(v)),
      expiradas: minhasVagas.filter(v => !v.fechada && v.status !== "preenchida" && verificarExpirada(v)),
      fechadas: minhasVagas.filter(v => v.fechada || v.status === "preenchida"),
    };
  }, [minhasVagas, verificarExpirada]);

  const vagasDaAba = aba === "abertas" ? abertas : aba === "expiradas" ? expiradas : fechadas;

  const executarAcao = async () => {
    if (!modal) return;
    const { tipo, vaga, candidato, index } = modal;
    const key = `${vaga.id}-${tipo}`;
    setCarregandoAcao(key);
    setModal(null);
    setMenuAberto(null);
    try {
      const ref = doc(db, "vagas", vaga.id);
      if (tipo === "aprovar") {
        const novos = [...(vaga.candidatos || [])];
        novos[index] = { ...novos[index], aprovado: true, aprovadoEm: serverTimestamp() };
        const total = novos.filter(c => c.aprovado).length;
        const qtd = parseInt(vaga.qtd) || 1;
        const deveFechar = total >= qtd;
        await updateDoc(ref, {
          candidatos: novos,
          ...(deveFechar ? { fechada: true, status: "preenchida", fechadaEm: serverTimestamp(), aceitaPor: novos.filter(c => c.aprovado).map(c => c.uid) } : {})
        });
        if (candidato.email) {
          await addDoc(collection(db, "mail"), {
            to: candidato.email,
            message: {
              subject: `Você foi selecionado(a) para a vaga: ${vaga.titulo}`,
              html: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;"><h2 style="color:#0F172A;">Parabéns, ${candidato.nome}!</h2><p style="color:#475569; line-height: 1.6;">Você foi selecionado(a) para a vaga <strong>${vaga.titulo}</strong> em ${vaga.cidade}.</p><p style="color:#475569; line-height: 1.6;">Abra o app Diárias Fácil para ver os próximos passos.</p></div>`
            }
          }).catch(() => {});
        }
        mostrarToast(`${candidato.nome} aprovado(a)${deveFechar ? " • Vaga fechada" : ""}`);
      }
      if (tipo === "excluir") { await deleteDoc(ref); mostrarToast("Vaga excluída", "info"); }
      if (tipo === "preencher") { await updateDoc(ref, { fechada: true, status: "preenchida", fechadaEm: serverTimestamp() }); mostrarToast("Vaga marcada como preenchida"); }
      if (tipo === "reabrir") { await updateDoc(ref, { fechada: false, status: "aberta", fechadaEm: null }); mostrarToast("Vaga reaberta"); }
      if (tipo === "excluirIndicacao") { await deleteDoc(doc(db, "indicacoes", candidato.id)); mostrarToast("Indicação removida", "info"); }
    } catch (e) {
      mostrarToast("Não foi possível concluir. Tente novamente.", "erro");
    } finally { setCarregandoAcao(null); }
  };

  const CardCandidato = ({ vaga, c, i }) => (
    <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-xl" style={{ padding: 8 }}>
      <button onClick={() => onVerPerfil?.(c)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
        {c.foto ? <img src={c.foto} alt="" className="rounded-full object-cover shrink-0" style={{ width: 32, height: 32 }} /> : <div className="rounded-full bg-slate-200 flex items-center justify-center font-bold shrink-0" style={{ width: 32, height: 32, fontSize: 12 }}>{c.nome?.[0]?.toUpperCase()}</div>}
        <span className="min-w-0">
          <span className="block font-semibold truncate" style={{ fontSize: 12 }}>{c.nome}</span>
          <span className="flex items-center gap-1 text-slate-400" style={{ fontSize: 11 }}>Ver perfil <ChevronRight style={{ width: 12, height: 12 }} /></span>
        </span>
      </button>
      {!c.aprovado ? (
        <button onClick={() => setModal({ tipo: "aprovar", vaga, candidato: c, index: i })} disabled={carregandoAcao === `${vaga.id}-aprovar`} className="bg-slate-900 text-white rounded-full font-semibold disabled:opacity-50 flex items-center gap-1 shrink-0" style={{ height: 30, paddingLeft: 12, paddingRight: 12, fontSize: 11 }}>
          {carregandoAcao === `${vaga.id}-aprovar` ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Check style={{ width: 13, height: 13 }} />} Aprovar
        </button>
      ) : (
        <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full shrink-0" style={{ fontSize: 11, padding: "5px 9px" }}><ShieldCheck style={{ width: 13, height: 13 }} /> Liberado</span>
      )}
    </div>
  );

  return (
    <div className="mx-auto min-h-screen bg-slate-50" style={{ maxWidth: 640, padding: "14px 14px 100px" }} onClick={() => setMenuAberto(null)}>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: 18 }}>Minhas vagas</h1>
          <p className="text-slate-500" style={{ fontSize: 12, marginTop: 2 }}>{abertas.length} aberta{abertas.length !== 1 ? "s" : ""} • {fechadas.length} preenchida{fechadas.length !== 1 ? "s" : ""}</p>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 font-medium text-slate-500 bg-white border border-slate-200 rounded-full" style={{ fontSize: 11, padding: "6px 10px" }}><span className="bg-emerald-500 rounded-full animate-pulse" style={{ width: 8, height: 8 }} /> {minhasVagas.reduce((acc, v) => acc + (v.candidatos?.length || 0), 0)} candidaturas</span>
      </div>

      {/* ABAS COMPACTAS */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-full w-fit" style={{ padding: 3, marginTop: 12 }}>
        {[
          { id: "abertas", label: `Abertas (${abertas.length})` },
          { id: "expiradas", label: `Expiradas (${expiradas.length})` },
          { id: "fechadas", label: `Fechadas (${fechadas.length})` },
        ].map(t => (
          <button key={t.id} onClick={(e) => { e.stopPropagation(); setAba(t.id); }} className="rounded-full font-semibold transition" style={{ padding: "7px 12px", fontSize: 12, backgroundColor: aba === t.id ? "#0F172A" : "transparent", color: aba === t.id ? "#fff" : "#64748B" }}>{t.label}</button>
        ))}
      </div>

      {minhasVagas.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl text-center" style={{ padding: 24, marginTop: 14 }}>
          <div className="bg-slate-50 rounded-2xl flex items-center justify-center mx-auto" style={{ width: 48, height: 48 }}><Briefcase style={{ width: 22, height: 22 }} className="text-slate-400" /></div>
          <p className="font-bold" style={{ fontSize: 14, marginTop: 10 }}>Você ainda não publicou nenhuma vaga</p>
          <p className="text-slate-500" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Crie sua primeira vaga e receba candidaturas de diaristas da sua cidade.</p>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }} onClick={e => e.stopPropagation()}>
        {vagasDaAba.map(v => {
          const foto = v.fotoVaga || v.fotoUrl || "";
          const inds = indicacoes.filter(ind => ind.vagaId === v.id);
          const aprovados = (v.candidatos || []).filter(c => c.aprovado).length;
          return (
            <article key={v.id} className="bg-white border border-slate-200 rounded-2xl" style={{ padding: 12 }}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold leading-tight truncate" style={{ fontSize: 14 }}>{v.titulo}</h3>
                    {v.fechada || v.status === "preenchida"
                      ? <span className="font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200" style={{ fontSize: 9, padding: "3px 7px" }}>PREENCHIDA</span>
                      : <span className="font-bold rounded-full bg-slate-50 text-slate-600 border border-slate-200" style={{ fontSize: 9, padding: "3px 7px" }}>ABERTA</span>}
                  </div>
                  <p className="text-slate-500" style={{ fontSize: 11, marginTop: 4 }}>{v.cidade} • R$ {v.valor} • {aprovados}/{v.qtd || 1} selecionados</p>
                </div>
                <div className="relative shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === v.id ? null : v.id); }} aria-label="Opções da vaga" className="rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center" style={{ width: 32, height: 32 }}>
                    {menuAberto === v.id ? <X style={{ width: 15, height: 15 }} /> : <MoreHorizontal style={{ width: 15, height: 15 }} />}
                  </button>
                  {menuAberto === v.id && (
                    <div className="absolute right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden" style={{ top: 38, width: 190, zIndex: 50, paddingTop: 4, paddingBottom: 4 }}>
                      {(!v.fechada && v.status !== "preenchida") && (
                        <button onClick={() => setModal({ tipo: "preencher", vaga: v })} className="w-full text-left font-medium hover:bg-slate-50 flex items-center gap-2" style={{ padding: "10px 14px", fontSize: 12 }}><Check style={{ width: 14, height: 14 }} className="text-emerald-600" /> Marcar como preenchida</button>
                      )}
                      {(v.fechada || v.status === "preenchida") && (
                        <button onClick={() => setModal({ tipo: "reabrir", vaga: v })} className="w-full text-left font-medium hover:bg-slate-50 flex items-center gap-2" style={{ padding: "10px 14px", fontSize: 12 }}><RotateCcw style={{ width: 14, height: 14 }} className="text-slate-600" /> Reabrir vaga</button>
                      )}
                      <button onClick={() => setModal({ tipo: "excluir", vaga: v })} className="w-full text-left font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100" style={{ padding: "10px 14px", fontSize: 12 }}><Trash2 style={{ width: 14, height: 14 }} /> Excluir vaga</button>
                    </div>
                  )}
                </div>
              </div>

              {/* FOTO PEQUENA - era isso que deixava gigante */}
              {foto && !imgErros[v.id] && (
                <button onClick={() => setFotoAmpliada(foto)} className="relative w-full block rounded-xl overflow-hidden border border-slate-100 bg-slate-100 text-left" style={{ marginTop: 10, height: 132 }}>
                  <img src={foto} alt={`Foto da vaga ${v.titulo}`} onError={() => setImgErros(p => ({ ...p, [v.id]: true }))} className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute flex items-center gap-1 bg-black text-white font-semibold rounded-full" style={{ bottom: 8, right: 8, fontSize: 10, padding: "5px 9px" }}>
                    <Expand style={{ width: 12, height: 12 }} /> Ver foto
                  </span>
                </button>
              )}

              <div style={{ marginTop: 12 }}>
                <p className="flex items-center gap-1.5 font-bold tracking-wide uppercase text-slate-400" style={{ fontSize: 10, marginBottom: 8 }}><Users style={{ width: 13, height: 13 }} /> Candidatos ({v.candidatos?.length || 0})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(v.candidatos || []).map((c, i) => <CardCandidato key={c.uid || i} vaga={v} c={c} i={i} />)}
                  {(!v.candidatos || v.candidatos.length === 0) && (
                    <p className="text-slate-400 bg-slate-50 rounded-xl text-center border border-dashed" style={{ fontSize: 11, padding: 10 }}>Nenhum candidato ainda.</p>
                  )}
                </div>
              </div>

              {inds.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                  <p className="font-bold tracking-wide uppercase text-emerald-700" style={{ fontSize: 10, marginBottom: 8 }}>Indicações ({inds.length})</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {inds.map(ind => {
                      const zap = (ind.indicadoZap || "").replace(/\D/g, "");
                      return (
                        <div key={ind.id} className="bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-2" style={{ padding: 8 }}>
                          <button onClick={() => ind.indicadoId && onVerPerfil?.({ uid: ind.indicadoId })} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                            <div className="rounded-full bg-white overflow-hidden ring-1 ring-emerald-200 shrink-0" style={{ width: 32, height: 32 }}>
                              {ind.indicadoFoto ? <img src={ind.indicadoFoto} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-emerald-800" style={{ fontSize: 12 }}>{(ind.indicadoNome || "P")[0].toUpperCase()}</div>}
                            </div>
                            <span className="min-w-0">
                              <span className="block font-semibold truncate" style={{ fontSize: 12 }}>{ind.indicadoNome}{ind.indicadoIdade ? ` • ${ind.indicadoIdade} anos` : ""}</span>
                              <span className="block text-slate-500 truncate" style={{ fontSize: 11 }}>Indicado por <strong>{ind.indicadorNome}</strong></span>
                            </span>
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {zap && <a href={`https://wa.me/55${zap}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="bg-emerald-600 text-white rounded-full font-bold flex items-center gap-1" style={{ height: 28, paddingLeft: 10, paddingRight: 10, fontSize: 11 }}><MessageCircle style={{ width: 12, height: 12 }} /> WhatsApp</a>}
                            <button onClick={() => setModal({ tipo: "excluirIndicacao", vaga: v, candidato: ind })} aria-label="Remover indicação" className="rounded-full bg-white border flex items-center justify-center" style={{ width: 28, height: 28 }}><X style={{ width: 12, height: 12 }} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {vagasDaAba.length === 0 && minhasVagas.length > 0 && (
          <div className="bg-white border border-dashed rounded-2xl text-center" style={{ padding: 24 }}>
            <CalendarX style={{ width: 22, height: 22 }} className="text-slate-300 mx-auto" />
            <p className="text-slate-500" style={{ fontSize: 12, marginTop: 6 }}>Nenhuma vaga nesta aba.</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: 16, zIndex: 100 }} onClick={() => setModal(null)}>
          <div className="bg-white w-full rounded-2xl shadow-2xl" style={{ maxWidth: 400, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, backgroundColor: modal.tipo === "excluir" || modal.tipo === "excluirIndicacao" ? "#FEF2F2" : "#ECFDF5" }}>
              {modal.tipo === "excluir" || modal.tipo === "excluirIndicacao" ? <AlertTriangle style={{ width: 18, height: 18 }} className="text-red-600" /> : <Check style={{ width: 18, height: 18 }} className="text-emerald-600" />}
            </div>
            <h3 className="font-bold" style={{ fontSize: 16, marginTop: 12 }}>
              {modal.tipo === "aprovar" && `Aprovar ${modal.candidato?.nome}?`}
              {modal.tipo === "excluir" && "Excluir vaga?"}
              {modal.tipo === "preencher" && "Marcar como preenchida?"}
              {modal.tipo === "reabrir" && "Reabrir vaga?"}
              {modal.tipo === "excluirIndicacao" && "Remover indicação?"}
            </h3>
            <p className="text-slate-500" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>
              {modal.tipo === "aprovar" && <>O candidato vai receber um e-mail avisando que foi selecionado. {(() => { const total = (modal.vaga.candidatos || []).filter(c => c.aprovado).length + 1; const qtd = parseInt(modal.vaga.qtd) || 1; return total >= qtd ? "A vaga será fechada automaticamente." : `Faltam ${qtd - total} para fechar.`; })()}</>}
              {modal.tipo === "excluir" && <>“{modal.vaga.titulo}” será removida para sempre. Essa ação não pode ser desfeita.</>}
              {modal.tipo === "preencher" && "A vaga sairá do feed e ninguém mais poderá se candidatar."}
              {modal.tipo === "reabrir" && "A vaga voltará a aparecer no feed."}
              {modal.tipo === "excluirIndicacao" && "Essa indicação será removida da sua lista."}
            </p>
            <div className="flex gap-2" style={{ marginTop: 18 }}>
              <button onClick={() => setModal(null)} className="flex-1 rounded-full border border-slate-200 font-semibold" style={{ height: 40, fontSize: 12 }}>Cancelar</button>
              <button onClick={executarAcao} className="flex-1 rounded-full font-semibold text-white" style={{ height: 40, fontSize: 12, backgroundColor: modal.tipo === "excluir" || modal.tipo === "excluirIndicacao" ? "#DC2626" : "#0F172A" }}>
                {modal.tipo === "aprovar" ? "Aprovar" : modal.tipo === "excluir" ? "Excluir" : modal.tipo === "preencher" ? "Marcar preenchida" : modal.tipo === "reabrir" ? "Reabrir" : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 text-white rounded-full shadow-xl font-semibold flex items-center gap-2" style={{ bottom: 96, transform: "translateX(-50%)", padding: "11px 14px", fontSize: 12, zIndex: 110, backgroundColor: toast.tipo === "erro" ? "#DC2626" : toast.tipo === "info" ? "#0F172A" : "#059669" }}>
          {toast.tipo === "erro" ? <AlertTriangle style={{ width: 14, height: 14 }} /> : <Check style={{ width: 14, height: 14 }} />} {toast.msg}
        </div>
      )}

      {fotoAmpliada && (
        <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 120 }} onClick={() => setFotoAmpliada(null)}>
          <div className="flex justify-between items-center" style={{ padding: 16 }}>
            <p className="text-white font-semibold" style={{ fontSize: 13 }}>Foto da vaga</p>
            <button onClick={() => setFotoAmpliada(null)} className="bg-white rounded-full flex items-center justify-center text-white" style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)" }}><X style={{ width: 18, height: 18 }} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ padding: 16, minHeight: 0 }}>
            <img src={fotoAmpliada} alt="Foto ampliada" className="rounded-xl object-contain" style={{ maxWidth: "100%", maxHeight: "100%" }} onClick={(e) => e.stopPropagation()} />
          </div>
          <p className="text-center text-white" style={{ fontSize: 11, paddingBottom: 20, opacity: 0.6 }}>Toque fora para fechar</p>
        </div>
      )}
    </div>
  );
}