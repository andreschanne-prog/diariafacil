// src/pages/Perfil.jsx - VERSÃO PROFISSIONAL
import { doc, updateDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { useState, useEffect } from "react";
import { useCidades } from "../hooks/useCidades.js";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function Perfil({ usuario, onSair, onEditar, onDeletar, onSuporte, onContatos, onSalvarCidade }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [toast, setToast] = useState(null);
  const [estadoFeed, setEstadoFeed] = useState(usuario?.feedEstado || usuario?.estado || "MT");
  const [cidadeFeed, setCidadeFeed] = useState(usuario?.feedCidade || usuario?.cidade || "");
  const [cidadeInput, setCidadeInput] = useState(usuario?.feedCidade || usuario?.cidade || "");
  const [salvando, setSalvando] = useState(false);
  const [coords, setCoords] = useState(null);
  const [carregandoLocal, setCarregandoLocal] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [editandoBio, setEditandoBio] = useState(false);
  const [textoBio, setTextoBio] = useState(usuario?.experiencias || usuario?.bio || usuario?.sobre || "");
  const [salvandoBio, setSalvandoBio] = useState(false);

  const { cidades: cidadesDoEstado, carregando: carregandoCidades } = useCidades(estadoFeed);

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (usuario?.feedEstado) setEstadoFeed(usuario.feedEstado);
    if (usuario?.feedCidade) { setCidadeFeed(usuario.feedCidade); setCidadeInput(usuario.feedCidade); }
    if (usuario?.experiencias || usuario?.bio || usuario?.sobre) setTextoBio(usuario.experiencias || usuario.bio || usuario.sobre);
  }, [usuario]);

  useEffect(() => {
    const uidAlvo = usuario?.uid || auth.currentUser?.uid;
    if (!uidAlvo) return;
    const q = query(collection(db, "avaliacoes"), where("prestadorId", "==", uidAlvo));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => {
        const da = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
        const db2 = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
        return db2 - da;
      });
      setComentarios(lista);
    });
    return () => unsub();
  }, [usuario?.uid]);

  const totalAval = comentarios.length > 0 ? comentarios.length : (usuario?.totalAvaliacoes || 0);
  const somaNotas = comentarios.length > 0 ? comentarios.reduce((acc, c) => acc + (Number(c.nota) || 5), 0) : (usuario?.sumNotas || 0);
  const notaMedia = totalAval > 0 ? (somaNotas / totalAval).toFixed(1) : "5.0";
  const especialidades = usuario?.especialidades || usuario?.habilidades || [];
  const isVerificado = usuario?.verificado === true;

  const formatarNome = (nome) => {
    if (!nome) return "Usuário";
    const partes = nome.trim().split(" ");
    if (partes.length === 1) return partes[0];
    return partes[0] + " " + partes[partes.length - 1][0].toUpperCase() + ".";
  };

  const handleTrocaEstado = (novoEstado) => { setEstadoFeed(novoEstado); setCidadeInput(""); };

  const salvarCidade = async () => {
    const cidadeFinal = (cidadeInput || cidadeFeed || "").trim();
    if (!cidadeFinal) return mostrarToast("Selecione a cidade");
    setSalvando(true);
    try {
      const dados = { feedCidade: cidadeFinal, feedEstado: estadoFeed, cidadeDesejada: cidadeFinal, estadoDesejado: estadoFeed };
      if (auth.currentUser) await updateDoc(doc(db, "usuarios", auth.currentUser.uid), dados);
      if (onSalvarCidade) onSalvarCidade(dados);
      setCidadeFeed(cidadeFinal);
      mostrarToast("Vagas atualizadas para " + cidadeFinal + " - " + estadoFeed);
    } catch (e) { mostrarToast("Erro ao salvar. Tente novamente."); }
    setSalvando(false);
  };

  const salvarBio = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSalvandoBio(true);
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { experiencias: textoBio.trim(), sobre: textoBio.trim() });
      setEditandoBio(false);
      mostrarToast("Bio atualizada!");
    } catch (e) { mostrarToast("Erro ao salvar bio."); }
    setSalvandoBio(false);
  };

  const pedirLocalizacao = () => {
    if (!navigator.geolocation) return mostrarToast("Seu celular não tem GPS");
    setCarregandoLocal(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        try {
          if (auth.currentUser) await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { latitude, longitude, ultimaLocalizacao: new Date() });
          mostrarToast("Localização atualizada!");
        } catch (e) {}
        setCarregandoLocal(false);
      },
      () => { setCarregandoLocal(false); mostrarToast("Não foi possível pegar sua localização"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="mx-auto min-h-screen bg-slate-50" style={{ maxWidth: 640, paddingBottom: 110 }}>

      {/* TOPO - Perfil + menu */}
      <div className="flex justify-between items-center px-4" style={{ paddingTop: 16 }}>
        <h2 className="font-semibold tracking-tight" style={{ fontSize: 16 }}>Meu perfil</h2>
        <div className="relative">
          <button onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu" className="bg-white border border-slate-200 rounded-full flex flex-col items-center justify-center" style={{ width: 36, height: 36, gap: 3 }}>
            <div className="bg-slate-700 rounded" style={{ width: 14, height: 2 }}></div>
            <div className="bg-slate-700 rounded" style={{ width: 14, height: 2 }}></div>
            <div className="bg-slate-700 rounded" style={{ width: 14, height: 2 }}></div>
          </button>
          {menuAberto && (
            <div className="absolute right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden" style={{ top: 44, width: 210, zIndex: 50 }}>
              <button onClick={() => { setMenuAberto(false); onEditar?.(); }} className="w-full text-left font-medium hover:bg-slate-50" style={{ padding: "13px 16px", fontSize: 13 }}>Editar perfil completo</button>
              <button onClick={() => { setMenuAberto(false); onContatos?.(); }} className="w-full text-left font-medium hover:bg-slate-50 border-t border-slate-100" style={{ padding: "13px 16px", fontSize: 13 }}>Contatos</button>
              <button onClick={() => { setMenuAberto(false); onSuporte?.(); }} className="w-full text-left font-medium hover:bg-slate-50 border-t border-slate-100" style={{ padding: "13px 16px", fontSize: 13 }}>Suporte</button>
              <button onClick={() => { setMenuAberto(false); onDeletar?.(); }} className="w-full text-left font-medium hover:bg-red-50 border-t border-slate-100 text-red-600" style={{ padding: "13px 16px", fontSize: 13 }}>Deletar conta</button>
            </div>
          )}
        </div>
      </div>

      {/* CARD PERFIL - capa + foto grande */}
      <div className="mx-4 bg-white border border-slate-200 rounded-3xl overflow-hidden" style={{ marginTop: 16 }}>
        <div style={{ height: 72, background: "linear-gradient(135deg, #0F172A 0%, #334155 55%, #0EA5E9 100%)" }}></div>
        <div className="px-4" style={{ paddingBottom: 16, marginTop: -28 }}>
          <div className="flex items-end justify-between">
            <div className="rounded-2xl bg-white overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center" style={{ width: 72, height: 72 }}>
              {usuario?.foto ? <img src={usuario.foto} className="w-full h-full object-cover" alt="" /> : <span className="font-bold text-slate-500" style={{ fontSize: 24 }}>{usuario?.nome?.[0]?.toUpperCase() || "A"}</span>}
            </div>
            <button onClick={onEditar} className="bg-slate-900 text-white rounded-full font-medium" style={{ height: 32, paddingLeft: 16, paddingRight: 16, fontSize: 12 }}>Editar perfil</button>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold tracking-tight" style={{ fontSize: 18 }}>{usuario?.nome || "Usuário"}</p>
              {isVerificado && <span className="bg-blue-50 text-blue-700 rounded-full font-bold" style={{ fontSize: 10, padding: "3px 8px" }}>✓ Verificado</span>}
            </div>
            <p className="text-slate-500" style={{ fontSize: 12, marginTop: 2 }}>{cidadeFeed || usuario?.cidade || "—"} - {estadoFeed}</p>
          </div>

          {/* STATS - igual 【entity-Airbnb¦canonical_name=Airbnb】 */}
          <div className="flex" style={{ gap: 20, marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
            <div><p className="font-bold" style={{ fontSize: 15 }}>★ {notaMedia}</p><p className="text-slate-500" style={{ fontSize: 11 }}>Avaliação</p></div>
            <div><p className="font-bold" style={{ fontSize: 15 }}>{totalAval}</p><p className="text-slate-500" style={{ fontSize: 11 }}>Avaliações</p></div>
            <div><p className="font-bold" style={{ fontSize: 15 }}>{especialidades.length}</p><p className="text-slate-500" style={{ fontSize: 11 }}>Especialidades</p></div>
          </div>
        </div>
      </div>

      {/* ESPECIALIDADES */}
      <div className="mx-4 bg-white border border-slate-200 rounded-3xl" style={{ marginTop: 12, padding: 16 }}>
        <p className="font-bold text-slate-400 uppercase tracking-wider" style={{ fontSize: 11 }}>Especialidades</p>
        <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
          {especialidades.length > 0 ? especialidades.map((esp, i) => (
            <span key={i} className="bg-slate-900 text-white rounded-full font-medium" style={{ fontSize: 11, padding: "6px 12px" }}>{esp}</span>
          )) : <button onClick={onEditar} className="bg-slate-100 text-slate-700 rounded-full font-medium" style={{ fontSize: 11, padding: "6px 12px" }}>+ Adicionar especialidades</button>}
        </div>
      </div>

      {/* ONDE VER VAGAS - 【entity-IBGE¦canonical_name=IBGE】 */}
      <div className="mx-4 bg-white border border-slate-200 rounded-3xl" style={{ marginTop: 12, padding: 16 }}>
        <div className="flex justify-between items-center">
          <p className="font-bold" style={{ fontSize: 14 }}>Onde ver vagas?</p>
          <span className="bg-emerald-50 text-emerald-700 rounded-full font-bold" style={{ fontSize: 10, padding: "4px 8px" }}>{cidadeFeed || "—"} - {estadoFeed}</span>
        </div>
        <p className="text-slate-500" style={{ fontSize: 12, marginTop: 4 }}>Mude a cidade para ver vagas de outro lugar.</p>
        <div className="grid" style={{ gridTemplateColumns: "1fr 2fr", gap: 8, marginTop: 12 }}>
          <div>
            <label className="font-medium text-slate-500" style={{ fontSize: 10 }}>ESTADO</label>
            <select value={estadoFeed} onChange={(e) => handleTrocaEstado(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" style={{ height: 44, paddingLeft: 10, fontSize: 13, marginTop: 4 }}>
              {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="font-medium text-slate-500" style={{ fontSize: 10 }}>CIDADE</label>
            <select value={cidadeInput} onChange={(e) => setCidadeInput(e.target.value)} disabled={carregandoCidades} className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" style={{ height: 44, paddingLeft: 10, fontSize: 13, marginTop: 4 }}>
              {carregandoCidades ? <option>Carregando...</option> : cidadesDoEstado.length === 0 ? <option value="">Selecione a cidade</option> : cidadesDoEstado.map(cid => <option key={cid} value={cid}>{cid}</option>)}
            </select>
          </div>
        </div>
        <button onClick={salvarCidade} disabled={salvando || !cidadeInput} className="w-full bg-slate-900 text-white rounded-xl font-semibold disabled:opacity-50" style={{ height: 44, fontSize: 13, marginTop: 12 }}>
          {salvando ? "Salvando..." : "Ver vagas de " + (cidadeInput || "...") + " - " + estadoFeed}
        </button>
      </div>

      {/* SOBRE MIM */}
      <div className="mx-4 bg-white border border-slate-200 rounded-3xl" style={{ marginTop: 12, padding: 16 }}>
        <div className="flex justify-between items-center">
          <p className="font-bold" style={{ fontSize: 14 }}>Sobre mim</p>
          {!editandoBio ? <button onClick={() => setEditandoBio(true)} className="text-slate-500 underline font-medium" style={{ fontSize: 12 }}>Editar</button> : <button onClick={() => setEditandoBio(false)} className="text-red-500 font-medium" style={{ fontSize: 12 }}>Cancelar</button>}
        </div>
        {!editandoBio ? (
          textoBio ? <p className="text-slate-700" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{textoBio}</p> : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl text-center" style={{ padding: 14, marginTop: 10 }}>
              <p className="font-bold text-amber-800" style={{ fontSize: 12 }}>Sua bio está vazia</p>
              <p className="text-amber-700" style={{ fontSize: 12, marginTop: 2 }}>Bio completa tem 3x mais chance de ser aceito</p>
              <button onClick={() => setEditandoBio(true)} className="bg-slate-900 text-white rounded-full font-medium" style={{ height: 34, paddingLeft: 16, paddingRight: 16, fontSize: 12, marginTop: 10 }}>Adicionar bio</button>
            </div>
          )
        ) : (
          <div style={{ marginTop: 10 }}>
            <textarea rows={4} value={textoBio} onChange={(e) => setTextoBio(e.target.value)} placeholder="Escreva sobre sua experiência e serviços..." className="w-full bg-slate-50 border border-slate-200 rounded-xl outline-none" style={{ padding: 12, fontSize: 13 }} />
            <button onClick={salvarBio} disabled={salvandoBio} className="w-full bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50" style={{ height: 40, fontSize: 13, marginTop: 8 }}>{salvandoBio ? "Salvando..." : "Salvar bio"}</button>
          </div>
        )}
      </div>

      {/* AVALIAÇÕES */}
      <div className="mx-4 bg-white border border-slate-200 rounded-3xl" style={{ marginTop: 12, padding: 16 }}>
        <div className="flex justify-between items-center">
          <p className="font-bold" style={{ fontSize: 14 }}>Avaliações</p>
          <span className="font-bold" style={{ fontSize: 13 }}>★ {notaMedia} <span className="text-slate-400 font-normal">({totalAval})</span></span>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {comentarios.length > 0 ? comentarios.map((item) => (
            <div key={item.id} className="bg-slate-50 rounded-2xl border border-slate-100" style={{ padding: 12 }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {item.avaliadorFoto ? <img src={item.avaliadorFoto} alt="" className="rounded-lg object-cover" style={{ width: 24, height: 24 }} /> : <div className="rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center" style={{ width: 24, height: 24, fontSize: 10 }}>{(item.avaliadorNome || "U")[0].toUpperCase()}</div>}
                  <span className="font-bold" style={{ fontSize: 12 }}>{formatarNome(item.avaliadorNome)}</span>
                </div>
                <span className="text-yellow-500" style={{ fontSize: 12 }}>{"★".repeat(Number(item.nota) || 5)}</span>
              </div>
              {item.comentario ? <p className="text-slate-600 bg-white rounded-xl border border-slate-100" style={{ fontSize: 12, lineHeight: 1.5, padding: 10, marginTop: 8 }}>"{item.comentario}"</p> : <p className="text-slate-400 italic" style={{ fontSize: 11, marginTop: 6 }}>Apenas nota em estrelas.</p>}
              <p className="text-slate-400 text-right" style={{ fontSize: 10, marginTop: 6 }}>{item.criadoEm?.toDate ? item.criadoEm.toDate().toLocaleDateString("pt-BR") : "Recentemente"}</p>
            </div>
          )) : (
            <div className="text-center bg-slate-50 rounded-2xl border border-dashed" style={{ padding: "20px 12px" }}><p className="text-slate-400" style={{ fontSize: 12 }}>Nenhum comentário ainda.</p></div>
          )}
        </div>
      </div>

      {/* CONTATO + GPS */}
      <div className="mx-4 bg-white border border-slate-200 rounded-3xl overflow-hidden" style={{ marginTop: 12 }}>
        <div className="flex justify-between items-center" style={{ padding: 16 }}>
          <div><p className="font-bold" style={{ fontSize: 13 }}>Contato</p><p className="text-slate-600" style={{ fontSize: 12, marginTop: 2 }}>{usuario?.email || "—"}</p></div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium" style={{ fontSize: 10, padding: "4px 8px" }}>Privado</span>
        </div>
        <div className="h-px bg-slate-100 mx-4"></div>
        <div className="flex justify-between items-center" style={{ padding: 16 }}>
          <div><p className="font-bold" style={{ fontSize: 13 }}>Localização GPS</p><p className="text-slate-500" style={{ fontSize: 12, marginTop: 2 }}>{coords ? "Ativada" : "Não ativada"}</p></div>
          <button onClick={pedirLocalizacao} disabled={carregandoLocal} className="rounded-full font-medium" style={{ fontSize: 12, padding: "7px 14px", backgroundColor: coords ? "#ECFDF5" : "#0F172A", color: coords ? "#047857" : "#fff" }}>{carregandoLocal ? "..." : coords ? "Atualizar" : "Ativar GPS"}</button>
        </div>
      </div>

      <button onClick={onSair} className="w-full border border-red-200 text-red-600 rounded-full font-medium" style={{ height: 40, fontSize: 13, margin: "20px 16px 0", width: "calc(100% - 32px)" }}>Sair da conta</button>
      {menuAberto && <div onClick={() => setMenuAberto(false)} className="fixed inset-0" style={{ zIndex: 40 }}></div>}

      {toast && (
        <div className="fixed left-1/2 text-white bg-slate-900 rounded-full shadow-xl font-semibold" style={{ bottom: 96, transform: "translateX(-50%)", padding: "12px 16px", fontSize: 13, zIndex: 110, whiteSpace: "nowrap" }}>{toast}</div>
      )}
    </div>
  );
}