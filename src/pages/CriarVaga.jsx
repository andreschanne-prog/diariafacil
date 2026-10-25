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
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [mostrarCalendario, setMostrarCalendario] = useState(true);

  // DATA DE HOJE LOCAL (SEM BUG DE FUSO)
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
    if (diasSelecionados.length === 0 && datasCalendario.length === 0 && !form.data) return alert("Escolhe os dias ou no calendário");

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
        candidatos: [],
        status: "aberta",
        fechada: false,
        criadoEm: serverTimestamp(),
        anuncianteId: user.uid,
        anuncianteEmail: (user.email || usuario?.email || "").toLowerCase(),
        anuncianteNome: user.displayName || usuario?.nome || "Anunciante",
        anuncianteFoto: user.photoURL || usuario?.foto || "",
        cidade: form.cidade.trim(),
        estado: form.estado,
        cidadeCompleta: `${form.cidade} - ${form.estado} ${form.bairro ? `- ${form.bairro}` : ""}`.trim(),
      });
      alert("Vaga postada!");
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
      <h2 className="text-3xl font-black mt-6 leading-none">Postar<br/>nova vaga</h2>
      <p className="text-[11px] opacity-60 mt-2">Hoje é {hojeLocal.toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long'})} • {auth.currentUser?.email}</p>
      
      <div className="mt-6 space-y-4">
        <input value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} placeholder="Ex: Preciso de 2 diaristas" className="w-full bg-white border p-4 rounded-2xl outline-none text-[14px] font-medium shadow-sm" />

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
            <button onClick={()=>setMostrarCalendario(!mostrarCalendario)} className="text-[11px] font-bold bg-black text-white px-3 py-1 rounded-full">
              {mostrarCalendario ? "Fechar ✕" : "📅 Calendário"}
            </button>
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
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] opacity-40 font-bold mb-2">
                <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {diasDoMes().map((dia, i) => {
                  if(!dia) return <div key={i}></div>
                  const str = formatarDataLocal(dia)
                  const selecionado = datasCalendario.includes(str)
                  const isHoje = dia.toDateString() === hojeLocal.toDateString()
                  const passado = dia < hojeLocal
                  return (
                    <button key={i} disabled={passado} onClick={()=>toggleDataCalendario(str)} className={`h-10 rounded-xl text-[13px] font-bold border-2 transition-all ${passado ? "opacity-20 bg-zinc-50" : ""} ${selecionado ? "bg-black text-white border-black scale-105" : isHoje ? "bg-amber-100 border-amber-400 text-black" : "bg-white border-zinc-100"}`}>
                      {dia.getDate()}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>{ const hojeStr = formatarDataLocal(hojeLocal); if(!datasCalendario.includes(hojeStr)) setDatasCalendario([...datasCalendario, hojeStr])}} className="flex-1 py-2 bg-amber-100 border border-amber-300 rounded-full text-[11px] font-bold">Hoje {hojeLocal.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</button>
                <button onClick={()=>{ const amanha = new Date(hojeLocal); amanha.setDate(amanha.getDate()+1); const str = formatarDataLocal(amanha); if(!datasCalendario.includes(str)) setDatasCalendario([...datasCalendario, str])}} className="flex-1 py-2 bg-zinc-100 border rounded-full text-[11px] font-bold">Amanhã</button>
                <button onClick={()=>setDatasCalendario([])} className="px-3 py-2 bg-white border rounded-full text-[11px]">Limpar</button>
              </div>
              {datasCalendario.length > 0 && (
                <p className="text-[11px] mt-3 bg-black text-white rounded-full px-3 py-2 text-center font-bold">
                  {datasCalendario.length} dias: {datasCalendario.sort().map(d=>{ const [y,m,day] = d.split('-'); return `${day}/${m}` }).join(", ")}
                </p>
              )}
            </div>
          )}

          <select value={form.periodo} onChange={e=>setForm({...form, periodo:e.target.value})} className="w-full bg-zinc-100 p-3 rounded-xl text-sm font-bold outline-none">
            <option value="manhã">Manhã (8h-12h)</option>
            <option value="tarde">Tarde (13h-18h)</option>
            <option value="dia todo">Dia todo (8h-18h)</option>
            <option value="noite">Noite</option>
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

        <input value={form.zap} onChange={e=>setForm({...form, zap:e.target.value})} placeholder="Zap com DDD - 66999999999" className="w-full bg-white border p-4 rounded-2xl outline-none border-orange-200 shadow-sm" />
        
        <button onClick={postar} disabled={salvando} className="w-full bg-black text-white py-5 rounded-full font-black disabled:opacity-50">
          {salvando ? "POSTANDO..." : "POSTAR AGORA"}
        </button>
      </div>
    </div>
  );
}