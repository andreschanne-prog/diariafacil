// src/pages/Estatisticas.jsx - VERSÃO BIGTECH
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export default function Estatisticas({ onVoltar, onVerPerfil }) {
  const [carregando, setCarregando] = useState(true);
  const [abaPrincipal, setAbaPrincipal] = useState("vagas");
  const [dadosDias, setDadosDias] = useState([]);
  const [dadosMeses, setDadosMeses] = useState([]);
  const [tipoFiltroVagas, setTipoFiltroVagas] = useState("dia");
  const [totalPreenchidas, setTotalPreenchidas] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [porPais, setPorPais] = useState([]);
  const [porEstado, setPorEstado] = useState([]);
  const [porCidade, setPorCidade] = useState([]);
  const [abaRegiao, setAbaRegiao] = useState("cidade");
  const [busca, setBusca] = useState("");
  const [modalExcluir, setModalExcluir] = useState(null);
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregando(true);
        const snapVagas = await getDocs(collection(db, "vagas"));
        const porDia = {}, porMes = {};
        let preenchidas = 0;

        snapVagas.docs.forEach(d => {
          const v = d.data();
          const s = String(v.status || "").toLowerCase().trim();
          const isPreenchida = ["preenchida", "fechada", "concluida"].includes(s) || v.preenchida === true || v.fechada === true;
          if (!isPreenchida) return;
          preenchidas++;
          let iso = new Date().toISOString().split("T")[0];
          const bruta = v.dataVaga || v.data || v.dataCriacao || v.criadoEm;
          if (bruta?.toDate) iso = bruta.toDate().toISOString().split("T")[0];
          else if (typeof bruta === "string") iso = bruta.split("T")[0];
          const [ano, mes, dia] = iso.split("-");
          if (ano && mes && dia) {
            porDia[`${dia}/${mes}/${ano}`] = (porDia[`${dia}/${mes}/${ano}`] || 0) + 1;
            porMes[`${mes}/${ano}`] = (porMes[`${mes}/${ano}`] || 0) + 1;
          }
        });

        const toLista = (obj, sortFn) => Object.keys(obj).map(k => ({ data: k, quantidade: obj[k] })).sort(sortFn);
        setDadosDias(toLista(porDia, (a, b) => {
          const [da, ma, aa] = a.data.split("/"); const [db, mb, ab] = b.data.split("/");
          return new Date(`${aa}-${ma}-${da}`) - new Date(`${ab}-${mb}-${db}`);
        }));
        setDadosMeses(toLista(porMes, (a, b) => {
          const [ma, aa] = a.data.split("/"); const [mb, ab] = b.data.split("/");
          return new Date(`${aa}-${ma}-01`) - new Date(`${ab}-${mb}-01`);
        }));
        setTotalPreenchidas(preenchidas);

        const snapU = await getDocs(collection(db, "usuarios"));
        const arr = [], mapPais = {}, mapEst = {}, mapCid = {};
        snapU.docs.forEach(d => {
          const u = { id: d.id, uid: d.id, ...d.data() };
          arr.push(u);
          const pais = (u.pais || "Brasil").trim(); mapPais[pais] = (mapPais[pais] || 0) + 1;
          const est = (u.estado || u.feedEstado || "MT").toUpperCase().trim(); mapEst[est] = (mapEst[est] || 0) + 1;
          let cid = (u.cidade || u.feedCidade || "Sinop").replace(/\s*-\s*[A-Z]{2}\s*$/, "").replace(/,\s*[A-Z]{2}\s*$/, "").trim();
          cid = cid ? cid.charAt(0).toUpperCase() + cid.slice(1).toLowerCase() : "Sinop";
          mapCid[cid] = (mapCid[cid] || 0) + 1;
        });
        const fmt = (m) => Object.keys(m).map(n => ({ nome: n, quantidade: m[n] })).sort((a, b) => b.quantidade - a.quantidade);
        setListaUsuarios(arr); setPorPais(fmt(mapPais)); setPorEstado(fmt(mapEst)); setPorCidade(fmt(mapCid));
        setTotalUsuarios(arr.length);
      } catch (e) { console.error(e); } finally { setCarregando(false); }
    };
    carregar();
  }, []);

  const confirmarExcluir = async () => {
    if (!modalExcluir) return;
    try {
      await deleteDoc(doc(db, "usuarios", modalExcluir.id));
      setListaUsuarios(p => p.filter(u => u.id !== modalExcluir.id));
      setTotalUsuarios(p => p - 1);
      mostrarToast("Usuário excluído");
    } catch { mostrarToast("Não foi possível excluir"); }
    setModalExcluir(null);
  };

  const listaVagasAtiva = tipoFiltroVagas === "dia" ? dadosDias : dadosMeses;
  const maiorVagas = listaVagasAtiva.length ? Math.max(...listaVagasAtiva.map(d => d.quantidade)) : 1;
  const totalHoje = useMemo(() => {
    const hoje = new Date().toLocaleDateString("pt-BR");
    return dadosDias.find(d => d.data === hoje)?.quantidade || 0;
  }, [dadosDias]);
  const totalMesAtual = useMemo(() => {
    const agora = new Date(); const chave = `${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
    return dadosMeses.find(d => d.data === chave)?.quantidade || 0;
  }, [dadosMeses]);

  const q = busca.toLowerCase();
  const cidadesF = porCidade.filter(i => i.nome.toLowerCase().includes(q));
  const estadosF = porEstado.filter(i => i.nome.toLowerCase().includes(q));
  const paisesF = porPais.filter(i => i.nome.toLowerCase().includes(q));
  const usuariosF = listaUsuarios.filter(u => (u.nome || u.email || "").toLowerCase().includes(q));

  const listaAtual = abaRegiao === "cidade" ? cidadesF : abaRegiao === "estado" ? estadosF : abaRegiao === "pais" ? paisesF : usuariosF;
  const maiorRegiao = abaRegiao !== "lista" && listaAtual.length ? Math.max(...listaAtual.map(i => i.quantidade)) : 1;

  return (
    <div className="mx-auto min-h-screen bg-slate-50" style={{ maxWidth: 700, paddingBottom: 96 }}>
      {/* HEADER */}
      <div className="bg-slate-900 text-white sticky top-0 flex items-center gap-3" style={{ padding: 16, zIndex: 20 }}>
        <button onClick={onVoltar} className="bg-white text-slate-900 rounded-full font-bold flex items-center justify-center" style={{ width: 36, height: 36, fontSize: 16 }}>←</button>
        <div>
          <h2 className="font-bold tracking-tight" style={{ fontSize: 16 }}>Estatísticas</h2>
          <p className="text-slate-400" style={{ fontSize: 11, marginTop: 2 }}>Vagas preenchidas e distribuição de usuários</p>
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* ABAS PRINCIPAIS */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-full" style={{ padding: 4 }}>
          <button onClick={() => setAbaPrincipal("vagas")} className="flex-1 rounded-full font-bold transition" style={{ height: 40, fontSize: 12, backgroundColor: abaPrincipal === "vagas" ? "#0F172A" : "transparent", color: abaPrincipal === "vagas" ? "#fff" : "#64748B" }}>Vagas preenchidas ({totalPreenchidas})</button>
          <button onClick={() => setAbaPrincipal("usuarios")} className="flex-1 rounded-full font-bold transition" style={{ height: 40, fontSize: 12, backgroundColor: abaPrincipal === "usuarios" ? "#0F172A" : "transparent", color: abaPrincipal === "usuarios" ? "#fff" : "#64748B" }}>Usuários ({totalUsuarios})</button>
        </div>

        {abaPrincipal === "vagas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 3 CARDS RESUMO - era só 1 card gigante */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-slate-200 rounded-2xl" style={{ padding: 12 }}><p className="text-slate-500 font-semibold uppercase" style={{ fontSize: 9 }}>Hoje</p><p className="font-bold" style={{ fontSize: 20, marginTop: 2 }}>{totalHoje}</p></div>
              <div className="bg-white border border-slate-200 rounded-2xl" style={{ padding: 12 }}><p className="text-slate-500 font-semibold uppercase" style={{ fontSize: 9 }}>Este mês</p><p className="font-bold" style={{ fontSize: 20, marginTop: 2 }}>{totalMesAtual}</p></div>
              <div className="bg-slate-900 text-white rounded-2xl" style={{ padding: 12 }}><p className="text-slate-400 font-semibold uppercase" style={{ fontSize: 9 }}>Total</p><p className="font-bold" style={{ fontSize: 20, marginTop: 2 }}>{totalPreenchidas}</p></div>
            </div>

            <div className="flex gap-1 bg-white border border-slate-200 rounded-full" style={{ padding: 4 }}>
              <button onClick={() => setTipoFiltroVagas("dia")} className="flex-1 rounded-full font-bold" style={{ height: 36, fontSize: 12, backgroundColor: tipoFiltroVagas === "dia" ? "#0F172A" : "transparent", color: tipoFiltroVagas === "dia" ? "#fff" : "#64748B" }}>Por dia</button>
              <button onClick={() => setTipoFiltroVagas("mes")} className="flex-1 rounded-full font-bold" style={{ height: 36, fontSize: 12, backgroundColor: tipoFiltroVagas === "mes" ? "#0F172A" : "transparent", color: tipoFiltroVagas === "mes" ? "#fff" : "#64748B" }}>Por mês</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl" style={{ padding: 16 }}>
              <h3 className="font-bold" style={{ fontSize: 13 }}>{tipoFiltroVagas === "dia" ? "Fluxo diário" : "Fluxo mensal"}</h3>
              {carregando ? <p className="text-slate-400 text-center animate-pulse" style={{ fontSize: 12, padding: "32px 0" }}>Carregando...</p> : listaVagasAtiva.length > 0 ? (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  {listaVagasAtiva.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between" style={{ fontSize: 12 }}><span className="font-semibold text-slate-700">{item.data}</span><span className="font-bold">{item.quantidade} {item.quantidade === 1 ? "vaga" : "vagas"}</span></div>
                      <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height: 8, marginTop: 6 }}><div className="h-full bg-slate-900 rounded-full" style={{ width: `${Math.max(Math.round((item.quantidade / maiorVagas) * 100), 10)}%` }} /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center" style={{ padding: 24, marginTop: 12 }}><p className="font-bold" style={{ fontSize: 12 }}>Nenhuma vaga preenchida ainda</p><p className="text-slate-500" style={{ fontSize: 11, marginTop: 4 }}>Quando uma vaga for marcada como preenchida, ela aparece aqui.</p></div>
              )}
            </div>
          </div>
        )}

        {abaPrincipal === "usuarios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="bg-slate-900 text-white rounded-2xl flex justify-between items-center" style={{ padding: 16 }}>
              <div><p className="text-slate-400 uppercase font-medium" style={{ fontSize: 10 }}>Total de usuários</p><p className="font-bold" style={{ fontSize: 24, marginTop: 2 }}>{totalUsuarios} <span className="font-normal text-slate-300" style={{ fontSize: 12 }}>contas</span></p></div>
              <span className="bg-white rounded-xl flex items-center justify-center font-bold" style={{ width: 40, height: 40, fontSize: 11, backgroundColor: "rgba(255,255,255,0.12)" }}>BR</span>
            </div>

            <div className="flex gap-1 bg-white border border-slate-200 rounded-full overflow-x-auto" style={{ padding: 4 }}>
              {[["cidade", "Cidades"], ["estado", "Estados"], ["pais", "Países"], ["lista", `Todos (${listaUsuarios.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => { setAbaRegiao(id); setBusca(""); }} className="flex-1 rounded-full font-bold whitespace-nowrap" style={{ height: 36, paddingLeft: 12, paddingRight: 12, fontSize: 11, backgroundColor: abaRegiao === id ? "#0F172A" : "transparent", color: abaRegiao === id ? "#fff" : "#64748B" }}>{label}</button>
              ))}
            </div>

            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={abaRegiao === "lista" ? "Buscar por nome ou e-mail..." : `Buscar ${abaRegiao}...`} className="w-full bg-white border border-slate-200 rounded-xl outline-none" style={{ padding: "11px 14px", fontSize: 12 }} />

            <div className="bg-white border border-slate-200 rounded-2xl" style={{ padding: 16 }}>
              <div className="flex justify-between items-center"><h3 className="font-bold" style={{ fontSize: 13 }}>{abaRegiao === "lista" ? `Usuários (${usuariosF.length})` : `${abaRegiao === "cidade" ? "Cidades" : abaRegiao === "estado" ? "Estados" : "Países"} (${listaAtual.length})`}</h3>{busca && <button onClick={() => setBusca("")} className="text-blue-600 font-bold" style={{ fontSize: 11 }}>Limpar</button>}</div>

              {carregando ? <p className="text-slate-400 text-center animate-pulse" style={{ fontSize: 12, padding: "32px 0" }}>Carregando...</p> : (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                  {abaRegiao !== "lista" && listaAtual.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between" style={{ fontSize: 12 }}><span className="font-semibold text-slate-700">{item.nome}</span><span className="font-bold">{item.quantidade}</span></div>
                      <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height: 6, marginTop: 5 }}><div className="h-full bg-slate-900 rounded-full" style={{ width: `${Math.max((item.quantidade / maiorRegiao) * 100, 8)}%` }} /></div>
                    </div>
                  ))}
                  {abaRegiao === "lista" && usuariosF.map(u => (
                    <div key={u.id} onClick={() => onVerPerfil?.(u)} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer" style={{ padding: 10 }}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="bg-slate-900 text-white font-bold rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ width: 32, height: 32, fontSize: 12 }}>{u.foto ? <img src={u.foto} className="w-full h-full object-cover" alt="" /> : (u.nome || "U")[0].toUpperCase()}</div>
                        <div className="min-w-0 flex-1"><p className="font-bold truncate" style={{ fontSize: 12 }}>{u.nome || "Sem nome"}</p><p className="text-slate-500 truncate" style={{ fontSize: 10 }}>{u.email || "Sem e-mail"} • {u.cidade || "Sinop"} / {u.estado || "MT"}</p></div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setModalExcluir(u); }} className="bg-white border border-red-200 text-red-600 rounded-lg flex items-center justify-center shrink-0" style={{ width: 30, height: 30, fontSize: 12 }}>Excluir</button>
                    </div>
                  ))}
                  {listaAtual.length === 0 && <p className="text-center text-slate-400" style={{ fontSize: 12, padding: 20 }}>Nenhum resultado.</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL EXCLUIR - sem confirm() / alert() */}
      {modalExcluir && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", padding: 16, zIndex: 100 }} onClick={() => setModalExcluir(null)}>
          <div className="bg-white w-full rounded-2xl" style={{ maxWidth: 400, padding: 20 }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold" style={{ fontSize: 16 }}>Excluir usuário?</h3>
            <p className="text-slate-500" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>“{modalExcluir.nome || modalExcluir.id}” será removido permanentemente. Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2" style={{ marginTop: 18 }}><button onClick={() => setModalExcluir(null)} className="flex-1 rounded-full border border-slate-200 font-semibold" style={{ height: 40, fontSize: 12 }}>Cancelar</button><button onClick={confirmarExcluir} className="flex-1 rounded-full font-semibold text-white bg-red-600" style={{ height: 40, fontSize: 12 }}>Excluir</button></div>
          </div>
        </div>
      )}
      {toast && <div className="fixed left-1/2 text-white bg-slate-900 rounded-full shadow-xl font-semibold" style={{ bottom: 96, transform: "translateX(-50%)", padding: "11px 14px", fontSize: 12, zIndex: 110, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}