import { useState } from "react";
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase.js";

const MOTIVOS = [
  "Golpe / quer pagamento adiantado",
  "Vaga fake / não existe",
  "Preço muito baixo / exploração",
  "Assédio / discriminação",
  "Já foi preenchida e não saiu do feed",
  "Outro motivo"
];

export default function CardVaga({ vaga, onVerPerfil }) {
  const [candidatou, setCandidatou] = useState(false);
  const [imgErro, setImgErro] = useState(false);
  const [imgVagaErro, setImgVagaErro] = useState(false);
  const [showDenuncia, setShowDenuncia] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [enviandoDenuncia, setEnviandoDenuncia] = useState(false);

  // Estados do Menu de 3 traços e modal de Indicação
  const [menuAberto, setMenuAberto] = useState(false);
  const [showIndicar, setShowIndicar] = useState(false);
  const [meusContatos, setMeusContatos] = useState([]);
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [msgIndicacao, setMsgIndicacao] = useState("");
  const [enviandoIndicacao, setEnviandoIndicacao] = useState(false);
  
  const meuCandidato = vaga.candidatos?.find(c => c.uid === auth.currentUser?.uid);
  const fuiAprovado = !!meuCandidato?.aprovado;

  const fotoPerfil = vaga.anuncianteFoto || vaga.fotoAnunciante || vaga.anunciante?.foto || vaga.foto || vaga.criadorFoto || "";
  const nomePerfil = vaga.anuncianteNome || vaga.nome || vaga.anunciante?.nome || "Anunciante";
  const inicial = nomePerfil?.[0]?.toUpperCase() || "A";
  const fotoVaga = vaga.fotoVaga || vaga.fotoUrl || "";

  const formatarDataPostagem = () => {
    try {
      if (!vaga.criadoEm) return "";
      const data = vaga.criadoEm?.toDate ? vaga.criadoEm.toDate() : new Date(vaga.criadoEm);
      if (isNaN(data)) return "";
      const diffMs = new Date() - data;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHora = Math.floor(diffMs / 3600000);
      const diffDia = Math.floor(diffMs / 86400000);
      if (diffMin < 1) return "agora";
      if (diffMin < 60) return `${diffMin}min`;
      if (diffHora < 24) return `${diffHora}h`;
      if (diffDia === 1) return "ontem";
      if (diffDia < 7) return `${diffDia}d`;
      return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    } catch { return ""; }
  };

  const formatarDias = () => {
    if (!vaga.dias) return "";
    if (Array.isArray(vaga.dias)) return vaga.dias.join(", ");
    if (typeof vaga.dias === "string" && vaga.dias !== "1") return vaga.dias;
    return "";
  };

  const queroEssaVaga = async () => {
    try {
      const vagaRef = doc(db, "vagas", vaga.id);
      const user = auth.currentUser;
      const nomeCandidato = user?.displayName || user?.email?.split("@")[0] || prompt("Seu nome pra se candidatar:");
      if (!nomeCandidato) return;
      await updateDoc(vagaRef, {
        candidatos: arrayUnion({
          nome: nomeCandidato,
          uid: user?.uid || "",
          foto: user?.photoURL || "",
          email: user?.email || "",
          data: new Date().toISOString(),
          aprovado: false
        })
      });
      setCandidatou(true);
      alert("Candidatura enviada!");
    } catch (e) {
      alert("Erro: " + e.message);
    }
  };

  // Abre a listagem de contatos salvos ao clicar em "Indicar contato" no menu
  const abrirModalIndicar = async () => {
    setMenuAberto(false);
    const user = auth.currentUser;
    if (!user) return alert("Faça login para indicar um contato.");

    setShowIndicar(true);
    setContatoSelecionado(null);
    setMsgIndicacao("");
    setCarregandoContatos(true);

    try {
      const q = query(collection(db, "contatos_salvos"), where("donoId", "==", user.uid));
      const snap = await getDocs(q);
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMeusContatos(lista);
    } catch (e) {
      console.error("Erro ao buscar contatos:", e);
    }
    setCarregandoContatos(false);
  };

  // Confirma e salva a indicação no Firestore
  const confirmarIndicacao = async () => {
    if (!contatoSelecionado) return alert("Selecione um contato da sua lista.");
    const user = auth.currentUser;
    if (!user) return;

    setEnviandoIndicacao(true);
    try {
      await addDoc(collection(db, "indicacoes"), {
        vagaId: vaga.id || "",
        vagaTitulo: vaga.titulo || "",
        vagaCidade: vaga.cidade || "",
        anuncianteId: vaga.anuncianteId || vaga.uid || "",
        anuncianteNome: nomePerfil,
        indicadorId: user.uid,
        indicadorNome: user.displayName || user.email?.split("@")[0] || "Usuário",
        indicadorFoto: user.photoURL || "",
        indicadoId: contatoSelecionado.prestadorId || "",
        indicadoNome: contatoSelecionado.nome || "Profissional",
        indicadoFoto: contatoSelecionado.foto || "",
        indicadoZap: contatoSelecionado.zap || "",
        indicadoIdade: contatoSelecionado.idade || "",
        mensagem: msgIndicacao.trim(),
        criadoEm: serverTimestamp()
      });

      alert(`✅ Você indicou ${contatoSelecionado.nome} com sucesso para esta vaga!`);
      setShowIndicar(false);
    } catch (e) {
      alert("Erro ao enviar indicação: " + e.message);
    }
    setEnviandoIndicacao(false);
  };

  const enviarDenuncia = async () => {
    if(!motivo) return alert("Escolhe um motivo");
    const user = auth.currentUser;
    if(!user) return alert("Precisa estar logado");
    
    setEnviandoDenuncia(true);
    try {
      await addDoc(collection(db, "denuncias"), {
        vagaId: vaga.id || "",
        vagaTitulo: vaga.titulo || "",
        vagaCidade: vaga.cidade || "",
        denuncianteId: user.uid || "",
        denuncianteEmail: user.email || "",
        denuncianteNome: user.displayName || user.email?.split("@")[0] || "",
        denunciadoId: vaga.anuncianteId || vaga.uid || vaga.anunciante?.uid || "",
        denunciadoNome: vaga.anuncianteNome || vaga.nome || "",
        motivo: motivo || "",
        detalhe: motivo === "Outro motivo" ? (detalhe || "") : "",
        status: "pendente",
        criadoEm: serverTimestamp(),
        zapDenunciado: vaga.zap || "",
      });
      alert("Denúncia enviada pro ADM. Vamos analisar em até 24h. Obrigado!");
      setShowDenuncia(false);
      setMotivo("");
      setDetalhe("");
    } catch(e){
      console.error(e);
      alert("Erro ao denunciar: " + e.message);
    }
    setEnviandoDenuncia(false);
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all relative">
        <div className="flex items-start justify-between gap-3">
          <button onClick={() => onVerPerfil && onVerPerfil(vaga)} className="flex items-center gap-3 text-left group">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200 group-active:scale-95 transition flex-shrink-0">
              {fotoPerfil && !imgErro ? (
                <img src={fotoPerfil} onError={()=>setImgErro(true)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-semibold text-slate-600 bg-slate-200">{inicial}</div>
              )}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-900 leading-none group-hover:underline">{nomePerfil}</p>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                <span>{formatarDataPostagem()}</span>
                <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
                <span>{vaga.cidade || "Sinop"}</span>
              </p>
            </div>
          </button>
          
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">{vaga.tipo || "Ajudante Geral"}</span>
              <span className="text-[12px] font-semibold text-slate-900">{vaga.valor || "A combinar"}</span>
            </div>

            {/* BOTÃO DE TRÊS TRAÇOS (MENU SUSPENSO) */}
            <div className="relative">
              <button 
                onClick={() => setMenuAberto(!menuAberto)} 
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-[14px]"
              >
                ⋮
              </button>

              {menuAberto && (
                <div className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-2xl shadow-lg py-1 z-30">
                  <button 
                    onClick={abrirModalIndicar}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>🤝</span>
                    <span>Indicar contato</span>
                  </button>

                  <button 
                    onClick={() => { setMenuAberto(false); setShowDenuncia(true); }}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-medium text-red-600 hover:bg-red-50 border-t border-slate-100 flex items-center gap-2"
                  >
                    <span>⚠️</span>
                    <span>Denunciar vaga</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[15px] leading-snug text-slate-900">{vaga.titulo}</h3>
          
          {fotoVaga && !imgVagaErro && (
            <div className="mt-3 w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={fotoVaga} alt="Foto da vaga" onError={()=>setImgVagaErro(true)} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-[11px] px-2.5 py-1 bg-slate-50 border rounded-full text-slate-600">{vaga.qtd || 1} pessoa</span>
            <span className="text-[11px] px-2.5 py-1 bg-slate-50 border rounded-full text-slate-600">{vaga.genero === 'mulher' ? 'Mulher' : vaga.genero === 'homem' ? 'Homem' : 'Ambos'}</span>
            {formatarDias() && <span className="text-[11px] px-2.5 py-1 bg-slate-50 border rounded-full text-slate-600">{formatarDias()}</span>}
            {vaga.periodo && <span className="text-[11px] px-2.5 py-1 bg-slate-50 border rounded-full text-slate-600">{vaga.periodo}</span>}
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-slate-50/70 p-3">
          {fuiAprovado ? (
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-emerald-700">VOCÊ FOI ACEITO • ZAP LIBERADO</p>
              <a href={`https://wa.me/55${vaga.zap?.replace(/\D/g,"")}`} target="_blank" className="mt-1.5 inline-flex text-[14px] font-bold text-slate-900 hover:underline">{vaga.zap}</a>
            </div>
          ) : (
            <p className="text-[11px] font-medium text-slate-500">Contato liberado após aprovação • {vaga.zap ? `${vaga.zap.substring(0,4)}••••` : "••••"}</p>
          )}
        </div>

        {!fuiAprovado ? (
          <button onClick={queroEssaVaga} disabled={candidatou} className="mt-4 w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[13px] font-medium transition disabled:opacity-40">
            {candidatou ? "Candidatura enviada" : "Candidatar-se"}
          </button>
        ) : (
          <div className="mt-4 h-11 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-medium">Candidatura aceita</div>
        )}
      </div>

      {/* MODAL PARA ESCOLHER CONTATO SALVO E INDICAR */}
      {showIndicar && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-[420px] rounded-t-[24px] sm:rounded-[24px] p-5 max-h-[88vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-[15px] text-slate-900">Indicar contato salvo</h3>
                <p className="text-[11px] text-slate-500 truncate max-w-[280px]">Para: {vaga.titulo}</p>
              </div>
              <button onClick={()=>setShowIndicar(false)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="my-3 overflow-y-auto flex-1 space-y-2 pr-1">
              {carregandoContatos ? (
                <p className="text-center text-[12px] text-slate-400 py-8">Carregando seus contatos salvos...</p>
              ) : meusContatos.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                  <p className="text-[13px] font-medium text-slate-700">Você ainda não tem contatos salvos.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Vá em Perfil &gt; Contatos para salvar profissionais de confiança.</p>
                </div>
              ) : (
                meusContatos.map((contato) => {
                  const selecionado = contatoSelecionado?.id === contato.id;
                  return (
                    <div
                      key={contato.id}
                      onClick={() => setContatoSelecionado(contato)}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                        selecionado
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 ring-1 ring-slate-200">
                          {contato.foto ? (
                            <img src={contato.foto} alt={contato.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                              {(contato.nome || "C")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[13px] truncate">{contato.nome}</p>
                          <p className={`text-[11px] truncate ${selecionado ? "text-slate-300" : "text-slate-500"}`}>
                            {contato.idade ? `${contato.idade} anos` : "Contato salvo"}
                          </p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] shrink-0 ${
                        selecionado ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                      }`}>
                        {selecionado && "✓"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {meusContatos.length > 0 && (
              <>
                <input
                  type="text"
                  value={msgIndicacao}
                  onChange={(e) => setMsgIndicacao(e.target.value)}
                  placeholder="Ex: Profissional excelente, já trabalhou comigo!"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[12px] outline-none focus:border-slate-900 mb-3"
                />

                <div className="flex gap-2">
                  <button onClick={()=>setShowIndicar(false)} className="flex-1 h-11 bg-white border border-slate-200 rounded-full text-[13px] font-medium">
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarIndicacao}
                    disabled={!contatoSelecionado || enviandoIndicacao}
                    className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-full text-[13px] font-medium disabled:opacity-40"
                  >
                    {enviandoIndicacao ? "Enviando..." : "Enviar indicação"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE DENÚNCIA */}
      {showDenuncia && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-[400px] rounded-t-[20px] sm:rounded-[20px] p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[15px]">Denunciar anúncio</h3>
              <button onClick={()=>{ setShowDenuncia(false); setMotivo(""); setDetalhe(""); }} className="w-8 h-8 rounded-full border flex items-center justify-center">✕</button>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">Vaga: {vaga.titulo} <br/> {vaga.anuncianteNome}</p>
            
            <div className="mt-4 space-y-2">
              {MOTIVOS.map(m=>(
                <button key={m} onClick={()=>setMotivo(m)} className={`w-full text-left p-3 rounded-xl border text-[13px] ${motivo===m ? 'bg-red-50 border-red-300 text-red-700 font-medium' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                  {motivo===m ? "● " : "○ "}{m}
                </button>
              ))}
            </div>

            {/* A CAIXA DE TEXTO SÓ APARECE SE O MOTIVO SELECIONADO FOR "Outro motivo" */}
            {motivo === "Outro motivo" && (
              <textarea 
                value={detalhe} 
                onChange={(e) => setDetalhe(e.target.value)} 
                placeholder="Descreva o motivo detalhadamente..." 
                className="mt-4 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] h-20 outline-none focus:border-slate-900 resize-none" 
              />
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={()=>{ setShowDenuncia(false); setMotivo(""); setDetalhe(""); }} className="flex-1 h-11 bg-white border border-slate-200 rounded-full text-[13px] font-medium">Cancelar</button>
              <button onClick={enviarDenuncia} disabled={enviandoDenuncia || !motivo} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-full text-[13px] font-medium disabled:opacity-50">{enviandoDenuncia ? "Enviando..." : "Enviar denúncia"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Fecha o menu ao clicar fora */}
      {menuAberto && <div onClick={() => setMenuAberto(false)} className="fixed inset-0 z-20" />}
    </>
  );
}