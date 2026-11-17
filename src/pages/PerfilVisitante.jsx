// src/pages/PerfilVisitante.jsx - VERSÃO BIGTECH CORRIGIDA
import { useState, useEffect } from "react";
import { doc, getDoc, collection, onSnapshot, query, where, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import Avaliacao from "../components/Avaliacao";

export default function PerfilVisitante({ usuarioId, usuarioData, usuarioLogado, vagaRelacionada, onVoltar }) {
  const [visitado, setVisitado] = useState(usuarioData || null);
  const [carregando, setCarregando] = useState(!usuarioData);
  const [mostrarModalAvaliar, setMostrarModalAvaliar] = useState(false);
  const [fotoExpandida, setFotoExpandida] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [salvo, setSalvo] = useState(false);
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [contatoDocId, setContatoDocId] = useState(null);
  const [toast, setToast] = useState(null);

  const meuUid = auth.currentUser?.uid || usuarioLogado?.uid;
  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (usuarioData?.email || usuarioData?.bio || usuarioData?.sobre || usuarioData?.idade) {
      setVisitado(usuarioData); setCarregando(false); return;
    }
    if (!usuarioId) return;
    const buscar = async () => {
      setCarregando(true);
      try {
        const snap = await getDoc(doc(db, "usuarios", usuarioId));
        if (snap.exists()) setVisitado({ ...snap.data(), uid: usuarioId });
      } catch (e) { console.log("Erro ao buscar perfil:", e); }
      setCarregando(false);
    };
    buscar();
  }, [usuarioId, usuarioData]);

  useEffect(() => {
    const idAlvo = usuarioId || visitado?.uid;
    if (!meuUid || !idAlvo) return;
    const q = query(collection(db, "contatos_salvos"), where("donoId", "==", meuUid), where("prestadorId", "==", idAlvo));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) { setSalvo(true); setContatoDocId(snap.docs[0].id); }
      else { setSalvo(false); setContatoDocId(null); }
    });
    return () => unsub();
  }, [meuUid, usuarioId, visitado?.uid]);

  const handleToggleSalvar = async () => {
    if (!meuUid || !visitado) return;
    const idAlvo = visitado.uid || usuarioId;
    setSalvandoContato(true);
    try {
      if (salvo && contatoDocId) {
        await deleteDoc(doc(db, "contatos_salvos", contatoDocId));
        setSalvo(false); setContatoDocId(null);
        mostrarToast("Removido dos contatos");
      } else {
        const docRef = await addDoc(collection(db, "contatos_salvos"), {
          donoId: meuUid, prestadorId: idAlvo,
          nome: visitado.nome || visitado.nomeCompleto || "Prestador",
          foto: visitado.foto || visitado.avatar || "",
          idade: visitado.idade || "",
          zap: visitado.zap || visitado.telefone || "",
          vagaTitulo: vagaRelacionada?.titulo || "",
          criadoEm: serverTimestamp()
        });
        setSalvo(true); setContatoDocId(docRef.id);
        mostrarToast("Contato salvo!");
      }
    } catch (e) { mostrarToast("Erro ao salvar contato."); }
    setSalvandoContato(false);
  };

  useEffect(() => {
    const idAlvo = usuarioId || visitado?.uid;
    if (!idAlvo) return;
    const q = query(collection(db, "avaliacoes"), where("prestadorId", "==", idAlvo));
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
  }, [usuarioId, visitado?.uid]);

  const formatarNomeAvaliador = (nome) => {
    if (!nome) return "Usuário";
    const partes = nome.trim().split(" ");
    if (partes.length === 1) return partes[0];
    return partes[0] + " " + partes[partes.length - 1][0].toUpperCase() + ".";
  };

  const calcularIdade = () => {
    const data = visitado?.idade || visitado?.dataNascimento || visitado?.nascimento;
    if (!data) return null;
    if (!isNaN(data)) return data;
    try { const nasc = new Date(data); return Math.floor((Date.now() - nasc.getTime()) / (1000 * 60 * 60 * 24 * 365.25)); }
    catch { return data; }
  };

  const idade = calcularIdade();
  const bio = visitado?.sobre || visitado?.bio || visitado?.experiencias || visitado?.descricao;
  const totalAval = comentarios.length > 0 ? comentarios.length : (visitado?.totalAvaliacoes || 0);
  const somaNotas = comentarios.length > 0 ? comentarios.reduce((a, c) => a + (Number(c.nota) || 5), 0) : (visitado?.sumNotas || 0);
  const notaMedia = totalAval > 0 ? (somaNotas / totalAval).toFixed(1) : "5.0";
  const formatarMembroDesde = () => {
    try {
      if (visitado?.criadoEm?.toDate) return visitado.criadoEm.toDate().toLocaleDateString("pt-BR");
      if (visitado?.criadoEm) return new Date(visitado.criadoEm).toLocaleDateString("pt-BR");
    } catch {}
    return "Recentemente";
  };

  // LINHA 117 CORRIGIDA - sem link, só texto puro
  const contatoZap = visitado?.zap || visitado?.whatsapp || visitado?.telefone || visitado?.celular || "";
  const limparZap = contatoZap.replace(/\D/g, "");
  const especialidades = visitado?.especialidades || visitado?.habilidades || [];
  const isVerificado = visitado?.verificado === true;

  if (carregando) {
    return (
      <div className="mx-auto min-h-screen bg-slate-50 flex items-center justify-center" style={{ maxWidth: 640 }}>
        <div className="text-center">
          <div className="mx-auto rounded-full bg-slate-200 animate-pulse" style={{ width: 72, height: 72 }}></div>
          <p className="font-semibold text-slate-500 animate-pulse" style={{ fontSize: 13, marginTop: 12 }}>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!visitado) {
    return (
      <div className="mx-auto min-h-screen bg-slate-50" style={{ maxWidth: 640, padding: 16 }}>
        <button onClick={onVoltar} className="bg-white border border-slate-200 rounded-full font-bold" style={{ width: 36, height: 36 }}>←</button>
        <p className="font-semibold text-center text-slate-500" style={{ marginTop: 24, fontSize: 14 }}>Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen bg-slate-50" style={{ maxWidth: 640, paddingBottom: 110 }}>
      <div className="sticky top-0 bg-white border-b border-slate-200 flex justify-between items-center px-4" style={{ zIndex: 30, height: 56 }}>
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="bg-white border border-slate-200 rounded-full font-bold" style={{ width: 36, height: 36 }}>←</button>
          <p className="font-semibold tracking-tight" style={{ fontSize: 14 }}>Voltar</p>
        </div>
        <button onClick={() => setMostrarModalAvaliar(true)} className="bg-slate-900 text-white rounded-full font-medium" style={{ height: 32, paddingLeft: 14, paddingRight: 14, fontSize: 12 }}>Avaliar</button>
      </div>

      <div className="mx-4 bg-white border border-slate-200 rounded-3xl overflow-hidden" style={{ marginTop: 16 }}>
        <div style={{ height: 84, background: "linear-gradient(135deg, #0F172A 0%, #334155 55%, #0EA5E9 100%)" }}></div>
        <div style={{ padding: "0 16px 16px", marginTop: -32 }}>
          <div className="flex items-end justify-between">
            <button onClick={() => visitado.foto && setFotoExpandida(true)} className="rounded-2xl bg-white overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center" style={{ width: 84, height: 84, padding: 0 }}>
              {visitado.foto ? <img src={visitado.foto} className="w-full h-full object-cover" alt={visitado.nome} /> : <span className="font-bold text-slate-500" style={{ fontSize: 28 }}>{visitado.nome?.[0]?.toUpperCase() || "A"}</span>}
            </button>
            <button onClick={handleToggleSalvar} disabled={salvandoContato} className="rounded-full font-semibold border" style={{ height: 34, paddingLeft: 14, paddingRight: 14, fontSize: 12, backgroundColor: salvo ? "#ECFDF5" : "#fff", color: salvo ? "#047857" : "#0F172A", borderColor: salvo ? "#A7F3D0" : "#E2E8F0" }}>
              {salvandoContato ? "..." : salvo ? "✓ Salvo" : "+ Salvar contato"}
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold tracking-tight" style={{ fontSize: 20 }}>{visitado.nome || "Usuário"}{idade ? <span className="font-normal text-slate-500" style={{ fontSize: 14 }}> • {idade} anos</span> : ""}</p>
              {isVerificado && <span className="bg-blue-50 text-blue-700 rounded-full font-bold" style={{ fontSize: 10, padding: "3px 8px" }}>✓ Verificado</span>}
            </div>
            <p className="text-slate-500" style={{ fontSize: 12, marginTop: 2 }}>📍 {visitado.cidade || visitado.local || "Sinop - MT"} • Membro desde {formatarMembroDesde()}</p>
          </div>
          <div className="flex" style={{ gap: 20, marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
            <div><p className="font-bold" style={{ fontSize: 15 }}>★ {notaMedia}</p><p className="text-slate-500" style={{ fontSize: 11 }}>Avaliação</p></div>
            <div><p className="font-bold" style={{ fontSize: 15 }}>{totalAval}</p><p className="text-slate-500" style={{ fontSize: 11 }}>Avaliações</p></div>
            <div><p className="font-bold" style={{ fontSize: 15 }}>{especialidades.length || "—"}</p><p className="text-slate-500" style={{ fontSize: 11 }}>Especialidades</p></div>
          </div>
        </div>
      </div>

      <div className="mx-4 bg-white border border-slate-200 rounded-3xl" style={{ marginTop: 12, padding: 16 }}>
        <p className="font-bold text-slate-400 uppercase tracking-wider" style={{ fontSize: 11 }}>Especialidades</p>
        <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
          {especialidades.length > 0 ? especialidades.map((esp, i) => (
            <span key={i} className="bg-slate-900 text-white rounded-full font-medium" style={{ fontSize: 11, padding: "6px 12px" }}>{esp}</span>
          )) : <span className="bg-slate-100 text-slate-600 rounded-full font-medium" style={{ fontSize: 11, padding: "6px 12px" }}>Diarista • Serviços Gerais</span>}
        </div>
      </div>

      <div className="mx-4 bg-white border border-slate-200 rounded-3xl" style={{ marginTop: 12, padding: 16 }}>
        <p className="font-bold" style={{ fontSize: 14 }}>Sobre mim</p>
        {bio ? <p className="text-slate-700" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8, whiteSpace: "pre-wrap" }}>{bio}</p> : <p className="text-slate-400 text-center bg-slate-50 rounded-2xl border border-dashed" style={{ fontSize: 12, padding: 14, marginTop: 10 }}>Este profissional ainda não adicionou uma biografia.</p>}
      </div>

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
                  {item.avaliadorFoto ? <img src={item.avaliadorFoto} alt="" className="rounded-full object-cover" style={{ width: 24, height: 24 }} /> : <div className="rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center" style={{ width: 24, height: 24, fontSize: 10 }}>{(item.avaliadorNome || "U")[0].toUpperCase()}</div>}
                  <span className="font-bold" style={{ fontSize: 12 }}>{formatarNomeAvaliador(item.avaliadorNome)}</span>
                </div>
                <span className="text-yellow-500" style={{ fontSize: 12 }}>{"★".repeat(Number(item.nota) || 5)}</span>
              </div>
              {item.comentario ? <p className="text-slate-600 bg-white rounded-xl border border-slate-100" style={{ fontSize: 12, lineHeight: 1.5, padding: 10, marginTop: 8 }}>"{item.comentario}"</p> : <p className="text-slate-400 italic" style={{ fontSize: 11, marginTop: 6 }}>Apenas nota em estrelas.</p>}
              <div className="flex justify-between items-center" style={{ marginTop: 6 }}>
                {item.vagaTitulo ? <span className="bg-slate-100 text-slate-500 rounded-full truncate" style={{ fontSize: 10, padding: "3px 8px", maxWidth: 180 }}>Serviço: {item.vagaTitulo}</span> : <span></span>}
                <span className="text-slate-400" style={{ fontSize: 10 }}>{item.criadoEm?.toDate ? item.criadoEm.toDate().toLocaleDateString("pt-BR") : "Recentemente"}</span>
              </div>
            </div>
          )) : <div className="text-center bg-slate-50 rounded-2xl border border-dashed" style={{ padding: "20px 12px" }}><p className="text-slate-400" style={{ fontSize: 12 }}>Nenhum comentário ainda.</p><button onClick={() => setMostrarModalAvaliar(true)} className="text-slate-900 underline font-medium" style={{ fontSize: 12, marginTop: 6 }}>Seja o primeiro a avaliar</button></div>}
        </div>
      </div>

      <div className="mx-4 bg-white border border-slate-200 rounded-3xl overflow-hidden" style={{ marginTop: 12 }}>
        <div className="flex justify-between items-center" style={{ padding: 16 }}>
          <div><p className="font-bold" style={{ fontSize: 13 }}>WhatsApp</p><p className="text-slate-600" style={{ fontSize: 12, marginTop: 2 }}>{contatoZap || "Não informado"}</p></div>
          {limparZap && <a href={`https://wa.me/55${limparZap}`} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white rounded-full font-semibold" style={{ fontSize: 12, padding: "8px 14px" }}>Abrir WhatsApp</a>}
        </div>
        <div className="h-px bg-slate-100 mx-4"></div>
        <div style={{ padding: 16 }}><p className="font-bold" style={{ fontSize: 13 }}>E-mail</p><p className="text-slate-600" style={{ fontSize: 12, marginTop: 2 }}>{visitado.email || "Não informado"}</p></div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200" style={{ zIndex: 40 }}>
        <div className="mx-auto flex gap-2 px-4 items-center" style={{ maxWidth: 640, height: 72 }}>
          <button onClick={() => setMostrarModalAvaliar(true)} className="border border-slate-200 rounded-full font-semibold" style={{ height: 44, paddingLeft: 16, paddingRight: 16, fontSize: 13 }}>Avaliar</button>
          {limparZap ? (
            <a href={`https://wa.me/55${limparZap}`} target="_blank" rel="noreferrer" className="flex-1 bg-emerald-600 text-white rounded-full font-bold text-center flex items-center justify-center" style={{ height: 44, fontSize: 13 }}>Chamar no WhatsApp</a>
          ) : (
            <button onClick={handleToggleSalvar} className="flex-1 bg-slate-900 text-white rounded-full font-bold" style={{ height: 44, fontSize: 13 }}>{salvo ? "✓ Salvo nos contatos" : "Salvar contato"}</button>
          )}
        </div>
      </div>

      {fotoExpandida && (
        <div onClick={() => setFotoExpandida(false)} className="fixed inset-0 bg-black flex items-center justify-center" style={{ zIndex: 90, padding: 16 }}>
          <button onClick={() => setFotoExpandida(false)} className="absolute bg-white text-slate-900 rounded-full font-bold" style={{ top: 16, right: 16, width: 36, height: 36 }}>✕</button>
          <img src={visitado.foto} alt="Foto ampliada" className="rounded-2xl object-contain" style={{ maxWidth: "100%", maxHeight: "85vh" }} />
        </div>
      )}

      {mostrarModalAvaliar && <Avaliacao prestador={visitado} usuarioLogado={usuarioLogado} vaga={vagaRelacionada} onClose={() => setMostrarModalAvaliar(false)} onSucesso={() => setMostrarModalAvaliar(false)} />}

      {toast && <div className="fixed left-1/2 text-white bg-slate-900 rounded-full shadow-xl font-semibold" style={{ bottom: 96, transform: "translateX(-50%)", padding: "12px 16px", fontSize: 13, zIndex: 110, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}