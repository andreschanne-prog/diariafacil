import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { useState, useEffect } from "react";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

// Limpa "Sinop - MT" -> "Sinop"
const limparCidade = (txt) => {
  if(!txt) return "";
  return txt.replace(/\s*-\s*[A-Z]{2}\s*$/,"").replace(/,\s*[A-Z]{2}\s*$/,"").trim();
};

export default function Perfil({ vagas = [], modo, usuario, onSair, onEditar, onDeletar, onSuporte, onAnuncio }) {
  const [local, setLocal] = useState(limparCidade(usuario?.cidade || "Sinop") + " - MT");
  const [coords, setCoords] = useState(null);
  const [carregandoLocal, setCarregandoLocal] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const [estadoFeed, setEstadoFeed] = useState(usuario?.feedEstado || "MT");
  const [cidadeFeed, setCidadeFeed] = useState(limparCidade(usuario?.feedCidade || usuario?.cidade || "Sinop"));
  const [cidadeInput, setCidadeInput] = useState(limparCidade(usuario?.feedCidade || "Sinop"));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("coords_diariafacil");
    if(salvo) setCoords(JSON.parse(salvo));
    
    const localSalvo = localStorage.getItem("local_diariafacil");
    if(localSalvo) setLocal(localSalvo);

    const feedC = localStorage.getItem("feed_cidade_diariafacil");
    const feedE = localStorage.getItem("feed_estado_diariafacil");
    if(feedC) { 
      const limpa = limparCidade(feedC);
      setCidadeFeed(limpa); 
      setCidadeInput(limpa); 
    }
    if(feedE) setEstadoFeed(feedE);

    if(usuario?.feedCidade) { 
      const limpa = limparCidade(usuario.feedCidade);
      setCidadeFeed(limpa); 
      setCidadeInput(limpa); 
    }
    if(usuario?.feedEstado) setEstadoFeed(usuario.feedEstado);
  }, [usuario]);

  const pedirLocalizacao = () => {
    if (!navigator.geolocation) return alert("Seu celular não tem GPS");
    setCarregandoLocal(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        setLocal("Sinop - MT");
        localStorage.setItem("coords_diariafacil", JSON.stringify({ latitude, longitude }));
        localStorage.setItem("local_diariafacil", "Sinop - MT");
        try {
          if(auth.currentUser){
            await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
              latitude, longitude, cidade: "Sinop", ultimaLocalizacao: new Date()
            });
          }
        } catch(e){}
        setCarregandoLocal(false);
      },
      () => { setCarregandoLocal(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const salvarCidadeDesejada = async () => {
    let cidadeFinal = limparCidade(cidadeInput.trim() || cidadeFeed);
    if(!cidadeFinal) return alert("Digite a cidade");
    setSalvando(true);
    try {
      localStorage.setItem("feed_cidade_diariafacil", cidadeFinal);
      localStorage.setItem("feed_estado_diariafacil", estadoFeed);
      localStorage.setItem("local_diariafacil", `${cidadeFinal} - ${estadoFeed}`);
      setLocal(`${cidadeFinal} - ${estadoFeed}`);
      setCidadeFeed(cidadeFinal);
      setCidadeInput(cidadeFinal);
      if(auth.currentUser){
        await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
          feedCidade: cidadeFinal,
          feedEstado: estadoFeed,
          cidadeDesejada: cidadeFinal,
          estadoDesejado: estadoFeed,
        });
      }
      alert(`✅ Agora você vê vagas de ${cidadeFinal} - ${estadoFeed}`);
    } catch(e){ alert("Erro ao salvar") }
    setSalvando(false);
  };

  if (modo === "minhas") {
    return (
      <div className="max-w-[640px] mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-24">
        <h2 className="text-[16px] font-semibold">Minhas vagas</h2>
      </div>
    )
  }

  return (
    <div className="max-w-[640px] mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-28">
      <div className="flex justify-between items-center">
        <h2 className="text-[15px] font-semibold tracking-tight">Perfil</h2>
        <div className="relative">
          <button onClick={()=>setMenuAberto(!menuAberto)} className="w-8 h-8 bg-white border border-slate-200 rounded-full flex flex-col items-center justify-center gap-[3px]">
            <div className="w-3 h-[1.5px] bg-slate-700"></div><div className="w-3 h-[1.5px] bg-slate-700"></div><div className="w-3 h-[1.5px] bg-slate-700"></div>
          </button>
          {menuAberto && (
            <div className="absolute right-0 top-10 w-[200px] bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50">
              <button onClick={()=>{ setMenuAberto(false); onEditar?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-slate-50">Editar perfil</button>
              <button onClick={()=>{ setMenuAberto(false); onSuporte?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-slate-50 border-t border-slate-100">Suporte</button>
              <button onClick={()=>{ setMenuAberto(false); onAnuncio?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-slate-50 border-t border-slate-100">Solicitar anúncio</button>
              <button onClick={()=>{ setMenuAberto(false); onDeletar?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-red-50 border-t border-slate-100 text-red-600">Deletar conta</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-5 bg-white border border-slate-200 p-4 rounded-2xl flex gap-3 items-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
          {usuario?.foto ? <img src={usuario.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-semibold text-slate-500">{usuario?.nome?.[0]?.toUpperCase() || "A"}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] truncate">{usuario?.nome || "Usuário"} • {cidadeFeed}</p>
          <p className="text-[11px] text-slate-500 mt-1">4.9 • 12 diárias • Verificado</p>
          <p className="text-[10px] mt-1 font-medium text-emerald-600">{coords ? "GPS ativo" : "GPS desativado"}</p>
        </div>
        <button onClick={onEditar} className="h-8 px-3 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-medium">Editar</button>
      </div>

      <div className="mt-3 bg-white border border-slate-200 p-4 rounded-2xl">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-[13px]">Onde ver vagas!</span>
          <span className="text-[9px] bg-slate-900 text-white px-2.5 py-1 rounded-full font-medium tracking-widest uppercase">Diária Mode</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">Coloque a cidade que você deseja ver as vagas.</p>
        
        <div className="mt-3 grid grid-cols-[80px_1fr] gap-2">
          <div>
            <label className="text-[10px] font-medium text-slate-500">ESTADO</label>
            <select value={estadoFeed} onChange={(e)=>setEstadoFeed(e.target.value)} className="mt-1 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-2 text-[13px] font-medium focus:outline-none">
              {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-500">CIDADE QUE QUER VER</label>
            <input 
              value={cidadeInput}
              onChange={(e)=>setCidadeInput(e.target.value)}
              placeholder="Ex: Cuiabá, Sorriso, Lucas..."
              className="mt-1 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <button onClick={salvarCidadeDesejada} disabled={salvando} className="w-full mt-3 h-11 bg-slate-900 text-white rounded-xl text-[12px] font-medium disabled:opacity-50">
          {salvando ? "Salvando..." : `Ver vagas de ${cidadeInput || cidadeFeed} - ${estadoFeed}`}
        </button>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">Atual: <b className="text-slate-700">{local}</b></p>
          <p className="text-[10px] text-slate-400">Feed: <b className="text-slate-900">{cidadeFeed} - {estadoFeed}</b></p>
        </div>
      </div>

      <div className="mt-3 bg-white border border-slate-200 p-4 rounded-2xl">
        <div className="flex justify-between items-center">
          <span className="font-medium text-[13px]">Sobre mim</span>
          <button onClick={onEditar} className="text-[11px] text-slate-500 underline">editar</button>
        </div>
        {usuario?.experiencias || usuario?.bio || usuario?.sobre ? (
          <p className="mt-3 text-[12px] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{usuario.experiencias || usuario.bio || usuario.sobre}</p>
        ) : (
          <div className="mt-3 bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
            <p className="text-[11px] font-medium text-amber-800">Bio vazia</p>
            <p className="text-[11px] mt-1 text-amber-700">Bio completa tem 3x mais chance</p>
            <button onClick={onEditar} className="mt-3 bg-slate-900 text-white px-4 py-2 rounded-full text-[11px] font-medium">Adicionar bio</button>
          </div>
        )}
      </div>

      <div className="mt-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <div><p className="font-medium text-[12px]">Contato</p><p className="text-[11px] mt-1 font-mono text-slate-600">{usuario?.zap || "(66) 9xxxx-xxxx"} • {usuario?.email || ""}</p></div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full font-medium">Escondido</span>
        </div>
        <div className="h-px bg-slate-100 mx-4"></div>
        <div className="p-4 flex justify-between items-center">
          <div><p className="font-medium text-[12px]">Localização GPS</p><p className="text-[11px] mt-1 text-slate-500">{local}</p></div>
          <button onClick={pedirLocalizacao} disabled={carregandoLocal} className={`px-3 py-1.5 rounded-full text-[11px] font-medium border ${coords ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-900 text-white border-slate-900"}`}>{carregandoLocal ? "..." : coords ? "Atualizar" : "Ativar GPS"}</button>
        </div>
      </div>

      <button onClick={onSair} className="w-full mt-6 h-10 border border-red-200 text-red-600 rounded-full text-[12px] font-medium">Sair da conta</button>
      {menuAberto && <div onClick={()=>setMenuAberto(false)} className="fixed inset-0 z-40"></div>}
    </div>
  )
}