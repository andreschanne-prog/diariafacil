import { useState } from "react";
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from "firebase/firestore";
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
  const [showDenuncia, setShowDenuncia] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [enviandoDenuncia, setEnviandoDenuncia] = useState(false);
  
  const meuCandidato = vaga.candidatos?.find(c => c.uid === auth.currentUser?.uid);
  const fuiAprovado = !!meuCandidato?.aprovado;

  const fotoPerfil = vaga.anuncianteFoto || vaga.fotoAnunciante || vaga.anunciante?.foto || vaga.foto || vaga.criadorFoto || "";
  const nomePerfil = vaga.anuncianteNome || vaga.nome || vaga.anunciante?.nome || "Anunciante";
  const inicial = nomePerfil?.[0]?.toUpperCase() || "A";

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
        // CORREÇÃO: nunca deixa undefined
        denunciadoId: vaga.anuncianteId || vaga.uid || vaga.anunciante?.uid || "",
        denunciadoNome: vaga.anuncianteNome || vaga.nome || "",
        motivo: motivo || "",
        detalhe: detalhe || "",
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
      <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all">
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
            <button onClick={()=>setShowDenuncia(true)} className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-[14px]">⋮</button>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[15px] leading-snug text-slate-900">{vaga.titulo}</h3>
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

        <button onClick={()=>setShowDenuncia(true)} className="mt-3 w-full text-[11px] text-slate-400 hover:text-red-500 underline">Denunciar essa vaga</button>
      </div>

      {showDenuncia && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-[400px] rounded-t-[20px] sm:rounded-[20px] p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[15px]">Denunciar vaga</h3>
              <button onClick={()=>setShowDenuncia(false)} className="w-8 h-8 rounded-full border flex items-center justify-center">✕</button>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">Vaga: {vaga.titulo} • {vaga.anuncianteNome}</p>
            
            <div className="mt-4 space-y-2">
              {MOTIVOS.map(m=>(
                <button key={m} onClick={()=>setMotivo(m)} className={`w-full text-left p-3 rounded-xl border text-[13px] ${motivo===m ? 'bg-red-50 border-red-300 text-red-700 font-medium' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                  {motivo===m ? "● " : "○ "}{m}
                </button>
              ))}
            </div>

            <textarea value={detalhe} onChange={e=>setDetalhe(e.target.value)} placeholder="Conta mais detalhes (opcional) - Ex: pediu pix adiantado" className="mt-4 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] h-20 outline-none focus:border-slate-900" />

            <div className="flex gap-2 mt-4">
              <button onClick={()=>setShowDenuncia(false)} className="flex-1 h-11 bg-white border border-slate-200 rounded-full text-[13px] font-medium">Cancelar</button>
              <button onClick={enviarDenuncia} disabled={enviandoDenuncia || !motivo} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-full text-[13px] font-medium disabled:opacity-50">{enviandoDenuncia ? "Enviando..." : "Enviar denúncia"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}