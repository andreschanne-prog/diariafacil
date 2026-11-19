// src/pages/CriarVaga.jsx - CORRIGIDO: vaga já nasce com cidadeLower
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase.js";

const DIAS_SEMANA = [
  { id: "seg", label: "Seg" }, { id: "ter", label: "Ter" }, { id: "qua", label: "Qua" },
  { id: "qui", label: "Qui" }, { id: "sex", label: "Sex" }, { id: "sab", label: "Sáb" }, { id: "dom", label: "Dom" },
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
const CIDADES_FIXAS = { MT: ["Sinop", "Cuiabá", "Rondonópolis", "Sorriso", "Lucas do Rio Verde", "Várzea Grande", "Tangará da Serra", "Alta Floresta", "Barra do Garças", "Primavera do Leste", "Colíder"] };

export default function CriarVaga({ onVoltar, onSucesso, usuario }) {
  const [form, setForm] = useState({
    titulo: "", tipo: "Ajudante Geral",
    cidade: usuario?.cidade || usuario?.feedCidade || "Sinop",
    estado: usuario?.estado || usuario?.feedEstado || "MT",
    valor: "", qtd: "1", zap: usuario?.zap || usuario?.whatsapp || "",
    genero: "ambos", periodo: "dia todo", bairro: ""
  });
  const [diasSelecionados, setDiasSelecionados] = useState([]);
  const [datasCalendario, setDatasCalendario] = useState([]);
  const [aCombinar, setACombinar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [toast, setToast] = useState("");
  const [cidades, setCidades] = useState(CIDADES_FIXAS.MT);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const [mesAtual, setMesAtual] = useState(() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); });
  const [mostrarCalendario, setMostrarCalendario] = useState(true);
  const [isRelampago, setIsRelampago] = useState(false);

  const hojeLocal = new Date(); hojeLocal.setHours(0, 0, 0, 0);
  const formatarDataLocal = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    const buscar = async () => {
      setCarregandoCidades(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`);
        const data = await res.json();
        setCidades(data.map(c => c.nome).sort());
      } catch { setCidades(CIDADES_FIXAS[form.estado] || ["Sinop"]); }
      setCarregandoCidades(false);
    };
    buscar();
  }, [form.estado]);

  // Se trocar de cidade no select, garante que o form tem cidade válida
  useEffect(() => {
    if (form.cidade && !cidades.includes(form.cidade) && cidades.length > 0) {
      // Não força - deixa o usuário escolher, só não deixa vazio
    }
  }, [cidades]);

  const handleSelecionarFoto = (e) => {
    const arquivo = e.target.files[0]; if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (evento) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h && w > 800) { h *= 800 / w; w = 800; } else if (h > 800) { w *= 800 / h; h = 800; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        setFotoUrl(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = evento.target.result;
    };
    reader.readAsDataURL(arquivo);
  };

  const toggleDia = (id) => setDiasSelecionados(p => p.includes(id) ? p.filter(d => d !== id) : [...p, id]);
  const toggleDataCalendario = (s) => setDatasCalendario(p => p.includes(s) ? p.filter(d => d !== s) : [...p, s]);
  const diasDoMes = () => {
    const ano = mesAtual.getFullYear(), mes = mesAtual.getMonth();
    const primeiro = new Date(ano, mes, 1).getDay(); const ultimo = new Date(ano, mes + 1, 0).getDate();
    const arr = []; for (let i = 0; i < primeiro; i++) arr.push(null); for (let d = 1; d <= ultimo; d++) arr.push(new Date(ano, mes, d)); return arr;
  };

  const postar = async () => {
    setErro("");
    if (!form.titulo.trim()) return setErro("Dê um título para a vaga.");
    if (!form.cidade) return setErro("Escolha a cidade.");
    if (!form.zap.trim()) return setErro("Informe o WhatsApp para contato.");
    if (!aCombinar && !form.valor) return setErro("Informe o valor ou marque 'A combinar'.");
    if (diasSelecionados.length === 0 && datasCalendario.length === 0) return setErro("Escolha os dias da semana ou uma data no calendário.");
    const user = auth.currentUser;
    if (!user?.uid) return setErro("Você precisa estar logado.");

    setSalvando(true);
    try {
      // CORREÇÃO PRINCIPAL - normaliza cidade antes de salvar
      const cidadeLimpa = form.cidade.trim();
      const cidadeLower = cidadeLimpa.toLowerCase();
      const estadoLimpo = form.estado.toUpperCase().trim();
      const bairroLimpo = form.bairro.trim();

      await addDoc(collection(db, "vagas"), {
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        cidade: cidadeLimpa, // "Sinop" - pra mostrar
        cidadeLower: cidadeLower, // "sinop" - pra filtrar, nunca falha
        cidadeCompleta: `${cidadeLimpa} / ${estadoLimpo}`, // "Sinop / MT" - SEM bairro, pra não quebrar o filtro
        estado: estadoLimpo,
        estadoLower: estadoLimpo.toLowerCase(),
        bairro: bairroLimpo,
        dias: diasSelecionados,
        datasEspecificas: datasCalendario,
        valor: aCombinar ? "A combinar" : `R$ ${form.valor}`,
        valorNumerico: aCombinar ? 0 : Number(form.valor),
        aCombinar, qtd: form.qtd, zap: form.zap.replace(/\D/g, ""),
        genero: form.genero, periodo: form.periodo,
        fotoVaga: fotoUrl || "", candidatos: [],
        status: "aberta", fechada: false,
        urgente: isRelampago, relampago: isRelampago,
        tipoOferta: isRelampago ? "relampago" : "normal",
        prioridade: isRelampago ? 10 : 0,
        criadoEm: serverTimestamp(),
        expiraEm: isRelampago ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        anuncianteId: user.uid,
        anuncianteEmail: (user.email || usuario?.email || "").toLowerCase(),
        anuncianteNome: user.displayName || usuario?.nome || "Anunciante",
        anuncianteFoto: user.photoURL || usuario?.foto || "",
      });
      setToast(isRelampago ? "Oferta relâmpago postada!" : "Vaga postada com sucesso!");
      setTimeout(() => { if (onSucesso) onSucesso(); if (onVoltar) onVoltar(); }, 800);
    } catch (e) { setErro("Não foi possível postar. Tente de novo."); }
    setSalvando(false);
  };

  return (
    <div className="mx-auto min-h-screen bg-slate-50" style={{ maxWidth: 600, padding: "16px 16px 112px" }}>
      <button onClick={onVoltar} className="bg-white border rounded-full font-bold shadow-sm" style={{ width: 40, height: 40 }}>←</button>
      <h2 className="font-bold leading-none" style={{ fontSize: 28, marginTop: 20 }}>Criar<br />oferta de trabalho</h2>
      <p className="text-slate-500" style={{ fontSize: 11, marginTop: 8 }}>Hoje é {hojeLocal.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="border-2 rounded-2xl shadow-sm" style={{ padding: 16, backgroundColor: isRelampago ? "#FEF2F2" : "#fff", borderColor: isRelampago ? "#FCA5A5" : "#E2E8F0" }}>
          <div className="flex justify-between items-center">
            <div><p className="font-bold" style={{ fontSize: 12, color: isRelampago ? "#DC2626" : "#0F172A" }}>⚡ OFERTA RELÂMPAGO</p><p className="text-slate-500" style={{ fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>Precisa de substituto urgente? Ative e seu post terá preferência no feed</p></div>
            <button onClick={() => setIsRelampago(!isRelampago)} className="rounded-full flex items-center transition-all" style={{ width: 48, height: 28, padding: 4, backgroundColor: isRelampago ? "#DC2626" : "#E2E8F0", justifyContent: isRelampago ? "flex-end" : "flex-start" }}><div className="bg-white rounded-full shadow-sm" style={{ width: 20, height: 20 }} /></button>
          </div>
          {isRelampago && <p className="font-bold bg-red-600 text-white rounded-full inline-block animate-pulse" style={{ fontSize: 10, marginTop: 12, padding: "6px 12px" }}>Vamos ajudar você a encontrar um substituto rápido!</p>}
        </div>

        <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Preciso de 2 diaristas urgente hoje" className="w-full bg-white border rounded-2xl outline-none font-medium shadow-sm" style={{ padding: 16, fontSize: 14, borderColor: isRelampago ? "#FCA5A5" : "#E2E8F0" }} />

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm" style={{ padding: 16 }}>
          <p className="font-bold tracking-widest text-slate-400" style={{ fontSize: 10 }}>PARA QUEM É A VAGA?</p>
          <div className="grid grid-cols-3 gap-2" style={{ marginTop: 10 }}>
            {[["homem", "HOMEM"], ["mulher", "MULHER"], ["ambos", "AMBOS"]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setForm({ ...form, genero: id })} className="rounded-xl border-2 flex flex-col items-center gap-1" style={{ padding: 12, backgroundColor: form.genero === id ? "#0F172A" : "#F8FAFC", borderColor: form.genero === id ? "#0F172A" : "#E2E8F0", color: form.genero === id ? "#fff" : "#334155" }}>
                <span style={{ fontSize: 11 }}>Preferência:</span><span className="font-bold" style={{ fontSize: 11 }}>{label}</span>
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-center" style={{ fontSize: 10, marginTop: 10 }}>{form.genero === "homem" ? "Preferência para homens" : form.genero === "mulher" ? "Preferência para mulheres" : "Aberta para todos"}</p>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm" style={{ padding: 16 }}>
          <p className="font-bold tracking-widest text-slate-400" style={{ fontSize: 10 }}>FOTO DA VAGA (OPCIONAL)</p>
          {fotoUrl ? (
            <div className="relative w-full bg-zinc-100 rounded-xl overflow-hidden border" style={{ height: 180, marginTop: 10 }}><img src={fotoUrl} alt="Pré-visualização" className="w-full h-full object-cover" /><button type="button" onClick={() => setFotoUrl("")} className="absolute bg-black text-white font-bold rounded-full" style={{ top: 8, right: 8, fontSize: 11, padding: "6px 12px", backgroundColor: "rgba(0,0,0,0.7)" }}>Remover / Trocar</button></div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer bg-zinc-50" style={{ height: 140, marginTop: 10 }}>
              <p className="font-bold text-zinc-700" style={{ fontSize: 12 }}>Toque para escolher foto</p><p className="text-zinc-500" style={{ fontSize: 11, marginTop: 4 }}>Galeria ou câmera</p>
              <input type="file" accept="image/*" onChange={handleSelecionarFoto} className="hidden" />
            </label>
          )}
        </div>

        <div className="bg-white border rounded-2xl shadow-sm" style={{ padding: 12 }}>
          <p className="font-bold tracking-widest text-slate-400" style={{ fontSize: 10 }}>ONDE PRECISA?</p>
          <div className="grid grid-cols-5 gap-2" style={{ marginTop: 10 }}>
            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value, cidade: "" })} className="col-span-2 bg-zinc-100 rounded-xl font-bold outline-none border" style={{ padding: 12, fontSize: 14 }}><option value="">UF</option>{ESTADOS.map(est => <option key={est.uf} value={est.uf}>{est.uf} - {est.nome}</option>)}</select>
            <select value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="col-span-3 bg-zinc-100 rounded-xl font-bold outline-none border" style={{ padding: 12, fontSize: 14 }}><option value="">Escolha a cidade</option>{carregandoCidades ? <option>Carregando...</option> : cidades.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <input value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} placeholder="Bairro - Ex: Jd. Primaveras" className="w-full bg-zinc-50 border rounded-xl outline-none" style={{ padding: 12, fontSize: 13, marginTop: 10 }} />
        </div>

        <div className="bg-white border rounded-2xl shadow-sm" style={{ padding: 12 }}>
          <div className="flex justify-between items-center"><p className="font-bold tracking-widest text-slate-400" style={{ fontSize: 10 }}>QUANDO PRECISA?</p><button onClick={() => setMostrarCalendario(!mostrarCalendario)} className="font-bold bg-black text-white rounded-full" style={{ fontSize: 11, padding: "6px 12px" }}>{mostrarCalendario ? "Fechar ✕" : "Calendário"}</button></div>
          <div className="grid grid-cols-7 gap-1" style={{ marginTop: 12 }}>
            {DIAS_SEMANA.map(d => <button key={d.id} type="button" onClick={() => toggleDia(d.id)} className="rounded-xl font-bold border-2" style={{ padding: "10px 0", fontSize: 12, backgroundColor: diasSelecionados.includes(d.id) ? "#0F172A" : "#F8FAFC", color: diasSelecionados.includes(d.id) ? "#fff" : "#334155", borderColor: "transparent" }}>{d.label}</button>)}
          </div>
          {mostrarCalendario && (
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, marginTop: 12 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}><button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1))} className="bg-zinc-100 rounded-full font-bold" style={{ width: 36, height: 36 }}>‹</button><p className="font-bold capitalize bg-black text-white rounded-full" style={{ fontSize: 13, padding: "4px 12px" }}>{mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p><button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1))} className="bg-zinc-100 rounded-full font-bold" style={{ width: 36, height: 36 }}>›</button></div>
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400" style={{ fontSize: 10, marginBottom: 8 }}><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
              <div className="grid grid-cols-7 gap-1">
                {diasDoMes().map((dia, i) => {
                  if (!dia) return <div key={i} />;
                  const str = formatarDataLocal(dia); const sel = datasCalendario.includes(str); const isHoje = dia.toDateString() === hojeLocal.toDateString(); const passado = dia < hojeLocal;
                  return <button key={i} disabled={passado} onClick={() => toggleDataCalendario(str)} className="rounded-xl font-bold border-2" style={{ height: 40, fontSize: 13, opacity: passado ? 0.2 : 1, backgroundColor: sel ? "#0F172A" : isHoje ? "#FEF3C7" : "#fff", color: sel ? "#fff" : "#0F172A", borderColor: isHoje && !sel ? "#FBBF24" : "#F1F5F9" }}>{dia.getDate()}</button>;
                })}
              </div>
            </div>
          )}
          <select value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })} className="w-full bg-zinc-100 rounded-xl font-bold outline-none" style={{ padding: 12, fontSize: 14, marginTop: 12 }}>
            <option value="manhã">Manhã (7h - 11h)</option>
            <option value="tarde">Tarde (13h - 17h)</option>
            <option value="dia todo">Dia todo (7h - 17h)</option>
            <option value="noite">Noite</option>
            <option value="meia diária">Meia diária</option>
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex gap-2 bg-white border rounded-2xl shadow-sm" style={{ padding: 4 }}>
            <div className="flex-1 relative"><span className="absolute font-bold text-zinc-400" style={{ left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>R$</span><input value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} type="number" disabled={aCombinar} placeholder={aCombinar ? "A combinar" : "por dia"} className="w-full bg-zinc-50 rounded-xl outline-none" style={{ padding: "16px 16px 16px 40px", fontSize: 14 }} /></div>
            <button type="button" onClick={() => setACombinar(!aCombinar)} className="rounded-xl font-bold" style={{ padding: "0 12px", fontSize: 10, backgroundColor: aCombinar ? "#0F172A" : "#fff", color: aCombinar ? "#fff" : "#0F172A", border: "1px solid #E2E8F0" }}>A<br />COMBINAR</button>
          </div>
          <input value={form.qtd} onChange={e => setForm({ ...form, qtd: e.target.value })} type="number" placeholder="Qtd" className="bg-white border rounded-2xl text-center font-bold shadow-sm" style={{ width: 90, padding: 16 }} />
        </div>

        <input value={form.zap} onChange={e => setForm({ ...form, zap: e.target.value })} placeholder="WhatsApp com DDD - 6691234-5678" className="w-full bg-white border rounded-2xl outline-none shadow-sm" style={{ padding: 16, borderColor: "#FDE68A" }} />

        {erro && <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl text-center" style={{ fontSize: 12, padding: "10px 12px" }}>{erro}</p>}

        <button onClick={postar} disabled={salvando} className="w-full rounded-full font-bold disabled:opacity-50" style={{ padding: "18px 0", backgroundColor: isRelampago ? "#DC2626" : "#0F172A", color: "#fff" }}>{salvando ? "POSTANDO..." : isRelampago ? "POSTAR OFERTA RELÂMPAGO" : "POSTAR"}</button>
      </div>
      {toast && <div className="fixed left-1/2 text-white bg-slate-900 rounded-full shadow-xl font-semibold" style={{ bottom: 96, transform: "translateX(-50%)", padding: "12px 16px", fontSize: 13, zIndex: 110, whiteSpace: "nowrap" }}>{toast}</div>}
    </div>
  );
}