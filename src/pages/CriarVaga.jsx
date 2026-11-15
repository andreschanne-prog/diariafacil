import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase.js";

const DIAS_SEMANA = [
  { id: "seg", label: "Seg" },
  { id: "ter", label: "Ter" },
  { id: "qua", label: "Qua" },
  { id: "qui", label: "Qui" },
  { id: "sex", label: "Sex" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
];

const ESTADOS = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" }, { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" }, { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" }, { uf: "MA", nome: "Maranhão" }, { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" }, { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" }, { uf: "PB", nome: "Paraíba" }, { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" }, { uf: "PI", nome: "Piauí" }, { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" }, { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" }, { uf: "RR", nome: "Roraima" }, { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" }, { uf: "SE", nome: "Sergipe" }, { uf: "TO", nome: "Tocantins" },
];

const CIDADES_FIXAS = {
  MT: ["Sinop", "Cuiabá", "Rondonópolis", "Sorriso", "Lucas do Rio Verde", "Várzea Grande", "Tangará da Serra", "Alta Floresta", "Barra do Garças", "Primavera do Leste", "Colíder"],
};

export default function CriarVaga({ onVoltar, onSucesso, usuario }) {
  const [form, setForm] = useState({ 
    titulo: "", 
    tipo: "Ajudante Geral", 
    cidade: "Sinop", 
    estado: "MT",
    valor: "", 
    qtd: "1", 
    zap: "",
    genero: "ambos",
    data: "",
    periodo: "dia todo",
    bairro: ""
  });
  const [diasSelecionados, setDiasSelecionados] = useState([]);
  const [datasCalendario, setDatasCalendario] = useState([]);
  const [aCombinar, setACombinar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [cidades, setCidades] = useState(CIDADES_FIXAS.MT);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [mostrarCalendario, setMostrarCalendario] = useState(true);
  const [isRelampago, setIsRelampago] = useState(false);

  const hojeLocal = new Date();
  hojeLocal.setHours(0,0,0,0);

  const formatarDataLocal = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    const buscarCidades = async () => {
      setCarregandoCidades(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`);
        const data = await res.json();
        const nomes = data.map(c => c.nome).sort();
        setCidades(nomes);
      } catch {
        setCidades(CIDADES_FIXAS[form.estado] || ["Sinop"]);
      }
      setCarregandoCidades(false);
    };
    buscarCidades();
  }, [form.estado]);

  const handleSelecionarFoto = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (evento) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setFotoUrl(dataUrl);
      };
      img.src = evento.target.result;
    };
    reader.readAsDataURL(arquivo);
  };

  const toggleDia = (id) => {
    setDiasSelecionados(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const toggleDataCalendario = (dataStr) => {
    setDatasCalendario(prev => prev.includes(dataStr) ? prev.filter(d => d !== dataStr) : [...prev, dataStr]);
  };

  const diasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    for(let i=0; i<primeiroDiaSemana; i++) dias.push(null);
    for(let d=1; d<=ultimoDia; d++) dias.push(new Date(ano, mes, d));
    return dias;
  };

  const postar = async () => {
    if (!form.titulo || !form.cidade || !form.zap) return alert("Preencha título, cidade e zap");
    if (!aCombinar && !form.valor) return alert("Coloca o valor ou marca 'A combinar'");
    if (diasSelecionados.length === 0 && datasCalendario.length === 0) {
      return alert("Escolha os dias da semana ou selecione datas no calendário.");
    }
    const user = auth.currentUser;
    if(!user?.uid) return alert("Erro: não logado");

    setSalvando(true);
    try {
      await addDoc(collection(db, "vagas"), {
        ...form,
        dias: diasSelecionados,
        datasEspecificas: datasCalendario,
        valor: aCombinar ? "A combinar" : `R$ ${form.valor}`,
        valorNumerico: aCombinar ? 0 : Number(form.valor),
        aCombinar,
        fotoVaga: fotoUrl || "",
        candidatos: [],
        status: "aberta",
        fechada: false,
        urgente: isRelampago,
        relampago: isRelampago,
        tipoOferta: isRelampago ? "relampago" : "normal",
        prioridade: isRelampago ? 10 : 0,
        criadoEm: serverTimestamp(),
        expiraEm: isRelampago ? new Date(Date.now() + 24*60*60*1000) : null,
        anuncianteId: user.uid,
        anuncianteEmail: (user.email || usuario?.email || "").toLowerCase(),
        anuncianteNome: user.displayName || usuario?.nome || "Anunciante",
        anuncianteFoto: user.photoURL || usuario?.foto || "",
        cidade: form.cidade.trim(),
        estado: form.estado,
        cidadeCompleta: `${form.cidade} / ${form.estado} ${form.bairro ? `- ${form.bairro}` : ""}`.trim(),
      });
      alert(isRelampago ? "⚡ Oferta relâmpago postada!" : "Vaga postada com sucesso!");
      if (onSucesso) onSucesso();
      if (onVoltar) onVoltar();
    } catch (e) {
      alert("Erro: " + e.message);
    }
    setSalvando(false);
  };

  return (
    <div className="p-4 max-w-[600px] mx-auto bg-[#fef9ef] min-h-screen pb-28">
      <button onClick={onVoltar} className="w-10 h-10 bg-white border rounded-full font-bold shadow-sm">←</button>
      <h2 className="text-3xl font-black mt-6 leading-none">Criar<br/>oferta de trabalho</h2>
      <p className="text-[11px] opacity-60 mt-2">Hoje é {hojeLocal.toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long'})}</p>
      
      <div className="mt-6 space-y-4">
        <div className={`border-2 p-4 rounded-2xl shadow-sm transition-all ${isRelampago ? "bg-red-50 border-red-500 ring-2 ring-red-200" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-[12px] font-black flex items-center gap-1 ${isRelampago ? "text-red-600" : "text-slate-900"}`}>⚡ OFERTA RELÂMPAGO</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Precisa de substituto urgente? Ative e seu post terá preferência no feed</p>
            </div>
            <button onClick={()=>setIsRelampago(!isRelampago)} className={`w-12 h-7 rounded-full p-1 transition-all flex items-center ${isRelampago ? "bg-red-600 justify-end" : "bg-slate-200 justify-start"}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
            </button>
          </div>
          {isRelampago && <p className="mt-3 text-[10px] font-bold bg-red-600 text-white px-3 py-1.5 rounded-full inline-block animate-pulse">Vamos ajudar você a encontrar um substituto rápido!</p>}
        </div>

        <input value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} placeholder="Ex: Preciso de 2 diaristas URGENTE hoje" className={`w-full bg-white border p-4 rounded-2xl outline-none text-[14px] font-medium shadow-sm ${isRelampago ? "border-red-300" : ""}`} />

        {/* ===== NOVO: SELETOR DE GÊNERO ===== */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
          <p className="text-[10px] font-black tracking-widest opacity-40">PARA QUEM É A VAGA?</p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button" 
              onClick={()=>setForm({...form, genero: "homem"})} 
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${form.genero === "homem" ? "bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"}`}
            >
              <span className="text-[12px]">Preferência:</span>
              <span className="text-[11px] font-black">HOMEM</span>
            </button>

            <button 
              type="button" 
              onClick={()=>setForm({...form, genero: "mulher"})} 
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${form.genero === "mulher" ? "bg-pink-600 border-pink-600 text-white shadow-md scale-[1.02]" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"}`}
            >
              <span className="text-[12px]">Preferência:</span>
              <span className="text-[11px] font-black">MULHER</span>
            </button>

            <button 
              type="button" 
              onClick={()=>setForm({...form, genero: "ambos"})} 
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${form.genero === "ambos" ? "bg-black border-black text-white shadow-md scale-[1.02]" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"}`}
            >
              <span className="text-[12px]">Preferência:</span>
              <span className="text-[11px] font-black">AMBOS</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            {form.genero === "homem" ? "✓ Só homens verão essa vaga em destaque" : form.genero === "mulher" ? "✓ Só mulheres verão essa vaga em destaque" : "✓ Aberta para todos"}
          </p>
        </div>

        <div className="bg-white border p-4 rounded-2xl shadow-sm space-y-3">
          <p className="text-[10px] font-black tracking-widest opacity-40">FOTO DA VAGA (OPCIONAL)</p>
          {fotoUrl ? (
            <div className="relative w-full h-48 bg-zinc-100 rounded-xl overflow-hidden border">
              <img src={fotoUrl} alt="Pré-visualização" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setFotoUrl("")} className="absolute top-2 right-2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-bold">Remover / Trocar</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <span className="text-2xl mb-1">📷</span>
                <p className="text-xs font-bold text-zinc-700">Toque para escolher da galeria ou tirar foto</p>
              </div>
              <input type="file" accept="image/*" onChange={handleSelecionarFoto} className="hidden" />
            </label>
          )}
        </div>

        <div className="bg-white border p-3 rounded-2xl shadow-sm space-y-3">
          <p className="text-[10px] font-black tracking-widest opacity-40">ONDE PRECISA?</p>
          <div className="grid grid-cols-5 gap-2">
            <select value={form.estado} onChange={e=>setForm({...form, estado:e.target.value, cidade:""})} className="col-span-2 bg-zinc-100 p-3 rounded-xl text-sm font-bold outline-none border">
              {ESTADOS.map(est => <option key={est.uf} value={est.uf}>{est.uf}</option>)}
            </select>
            <select value={form.cidade} onChange={e=>setForm({...form, cidade:e.target.value})} className="col-span-3 bg-zinc-100 p-3 rounded-xl text-sm font-bold outline-none border">
              {carregandoCidades ? <option>Carregando...</option> : cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input value={form.bairro} onChange={e=>setForm({...form, bairro:e.target.value})} placeholder="Bairro - Ex: Jd. Primaveras" className="w-full bg-zinc-50 border p-3 rounded-xl text-[13px] outline-none" />
        </div>

        <div className="bg-white border p-3 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black tracking-widest opacity-40">QUANDO PRECISA?</p>
            <button onClick={()=>setMostrarCalendario(!mostrarCalendario)} className="text-[11px] font-bold bg-black text-white px-3 py-1 rounded-full">{mostrarCalendario ? "Fechar ✕" : "📅 Calendário"}</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map(d => (
              <button key={d.id} type="button" onClick={()=>toggleDia(d.id)} className={`py-2.5 rounded-xl font-bold text-[12px] border-2 ${diasSelecionados.includes(d.id) ? "bg-black text-white border-black" : "bg-zinc-50 border-transparent"}`}>{d.label}</button>
            ))}
          </div>
          {mostrarCalendario && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-3">
                <button onClick={()=>setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth()-1))} className="w-9 h-9 bg-zinc-100 rounded-full font-bold">‹</button>
                <p className="font-black text-[13px] capitalize bg-black text-white px-3 py-1 rounded-full">{mesAtual.toLocaleDateString('pt-BR', {month:'long', year:'numeric'})}</p>
                <button onClick={()=>setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth()+1))} className="w-9 h-9 bg-zinc-100 rounded-full font-bold">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] opacity-40 font-bold mb-2"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
              <div className="grid grid-cols-7 gap-1.5">
                {diasDoMes().map((dia, i) => {
                  if(!dia) return <div key={i}></div>
                  const str = formatarDataLocal(dia)
                  const selecionado = datasCalendario.includes(str)
                  const isHoje = dia.toDateString() === hojeLocal.toDateString()
                  const passado = dia < hojeLocal
                  return <button key={i} disabled={passado} onClick={()=>toggleDataCalendario(str)} className={`h-10 rounded-xl text-[13px] font-bold border-2 transition-all ${passado ? "opacity-20 bg-zinc-50" : ""} ${selecionado ? "bg-black text-white border-black scale-105" : isHoje ? "bg-amber-100 border-amber-400 text-black" : "bg-white border-zinc-100"}`}>{dia.getDate()}</button>
                })}
              </div>
            </div>
          )}
          <select value={form.periodo} onChange={e=>setForm({...form, periodo:e.target.value})} className="w-full bg-zinc-100 p-3 rounded-xl text-sm font-bold outline-none">
            <option value="manhã">Vespertino (7h-11h)</option>
            <option value="tarde">Matutino (13h-17h)</option>
            <option value="dia todo">Diária inteira (7h-17h)</option>
            <option value="noite">Noturno</option>
            <option value="meia diária">Meia diária</option>
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex gap-2 bg-white border p-1 rounded-2xl shadow-sm">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">R$</span>
              <input value={form.valor} onChange={e=>setForm({...form, valor:e.target.value})} type="number" disabled={aCombinar} placeholder={aCombinar ? "A combinar" : "por dia"} className="w-full bg-zinc-50 p-4 pl-10 rounded-xl outline-none text-[14px]" />
            </div>
            <button type="button" onClick={()=>setACombinar(!aCombinar)} className={`px-3 rounded-xl font-black text-[10px] ${aCombinar ? "bg-black text-white" : "bg-white border"}`}>A<br/>COMBINAR</button>
          </div>
          <input value={form.qtd} onChange={e=>setForm({...form, qtd:e.target.value})} type="number" placeholder="Qtd" className="w-[90px] bg-white border p-4 rounded-2xl text-center font-bold shadow-sm" />
        </div>

        <input value={form.zap} onChange={e=>setForm({...form, zap:e.target.value})} placeholder="celular com DDD - 6691234-5678" className="w-full bg-white border p-4 rounded-2xl outline-none border-orange-200 shadow-sm" />
        
        <button onClick={postar} disabled={salvando} className={`w-full py-5 rounded-full font-black disabled:opacity-50 transition-all ${isRelampago ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" : "bg-black text-white"}`}>
          {salvando ? "POSTANDO..." : isRelampago ? " POSTAR OFERTA RELÂMPAGO" : "POSTAR"}
        </button>
      </div>
    </div>
  );
}