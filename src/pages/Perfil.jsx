import { doc, updateDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { useState, useEffect } from "react";

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const CIDADES_POR_ESTADO = {
  MT: [
    "Sinop", "Cuiabá", "Várzea Grande", "Rondonópolis", "Sorriso", "Lucas do Rio Verde", 
    "Tangará da Serra", "Primavera do Leste", "Cáceres", "Barra do Garças", "Nova Mutum", 
    "Alta Floresta", "Pontes e Lacerda", "Campo Novo do Parecis", "Campo Verde", "Juína", 
    "Confresa", "Juara", "Peixoto de Azevedo", "Sapezal", "Água Boa", "Colíder", 
    "Guarantã do Norte", "Poconé", "Querência", "Jaciara", "Barra do Bugres", "Paranatinga", 
    "Canarana", "Mirassol d'Oeste", "Aripuanã", "Colniza", "Nova Xavantina", "Poxoréu", 
    "Diamantino", "Matupá", "Vila Rica", "Chapada dos Guimarães", "Pedra Preta", "Comodoro", 
    "Alto Araguaia", "São José dos Quatro Marcos", "Brasnorte", "Vila Bela da Santíssima Trindade", 
    "Santo Antônio do Leverger", "Nova Olímpia", "Campinápolis", "Nobres", "Tapurah", 
    "Rosário Oeste", "Araputanga", "São Félix do Araguaia", "São José do Rio Claro", 
    "Nova Bandeirantes", "Alto Garças", "Porto Alegre do Norte", "Itiquira", "Paranaíta", 
    "Alto Taquari", "Nova Canaã do Norte", "Nossa Senhora do Livramento", "Juscimeira", 
    "Marcelândia", "Arenápolis", "Vera", "Terra Nova do Norte", "Ribeirão Cascalheira", 
    "Feliz Natal", "Carlinda", "Guiratinga", "Porto Esperidião", "Juruena", "Cotriguaçu", 
    "Nova Ubiratã", "Campos de Júlio", "Tabaporã", "Gaúcha do Norte", "Cláudia", "Apiacás", 
    "Ipiranga do Norte", "Nova Monte Verde", "Itanhangá", "Bom Jesus do Araguaia", "Dom Aquino", 
    "Jauru", "Santa Terezinha", "Alto Paraguai", "Pontal do Araguaia", "Jangada", "Castanheira", 
    "Novo São Joaquim", "Barão de Melgaço", "Nova Lacerda", "Denise", "Cocalinho", "Novo Mundo", 
    "General Carneiro", "São José do Xingu", "Alto Boa Vista", "Nortelândia", "Santa Carmem", 
    "Boa Esperança do Norte", "Nova Maringá", "Porto dos Gaúchos", "Itaúba", "Curvelândia", 
    "Acorizal", "Lambari d'Oeste", "Nova Nazaré", "Nova Guarita", "Nova Santa Helena", 
    "Canabrava do Norte", "Rio Branco", "São Pedro da Cipa", "Santo Antônio do Leste", 
    "Torixoréu", "Araguaiana", "Conquista d'Oeste", "União do Sul", "Nova Brasilândia", 
    "Nova Marilândia", "Salto do Céu", "Santa Rita do Trivelato", "Rondolândia", 
    "Planalto da Serra", "Novo Horizonte do Norte", "Porto Estrela", "Figueirópolis d'Oeste", 
    "Tesouro", "Santa Cruz do Xingu", "Vale de São Domingos", "Glória d'Oeste", "Ribeirãozinho", 
    "São José do Povo", "Luciara", "Santo Afonso", "Indiavaí", "Ponte Branca", "Novo Santo Antônio", 
    "Reserva do Cabaçal", "Serra Nova Dourada", "Araguainha"
  ],
  SP: [
    "São Paulo", "Campinas", "Guarulhos", "São Bernardo do Campo", "Santo André", "Osasco", 
    "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Santos", "Mauá", "São José do Rio Preto", 
    "Mogi das Cruzes", "Jundiaí", "Piracicaba", "Bauru", "Franca", "Carapicuíba", "Itaquaquecetuba", 
    "Guarujá", "Taubaté", "Limeira", "Suzano", "Taboão da Serra", "Sumaré", "Barueri", "Embu das Artes", 
    "São Vicente", "Marília", "Americana", "Jacareí", "Presidente Prudente", "Rio Claro", "Araçatuba", 
    "Santa Bárbara d'Oeste", "Araraquara", "Itapevi", "Indaiatuba", "Cotia", "Pindamonhangaba", "Atibaia"
  ],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí", "Aquidauana", "Sidrolândia", "Paranaíba", "Coxim"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Itumbiara", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Novo Gama", "Senador Canedo"],
  RJ: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda", "Macaé", "Magé", "Itaboraí", "Cabo Frio", "Angra dos Reis", "Maricá", "Nova Friburgo", "Barra Mansa", "Teresópolis"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Araucária", "Toledo", "Apucarana", "Campo Largo", "Arapongas", "Umuarama", "Pato Branco", "Paranavaí"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "São José", "Criciúma", "Chapecó", "Itajaí", "Jaraguá do Sul", "Lages", "Palhoça", "Balneário Camboriú", "Brusque", "Tubarão", "São Bento do Sul", "Caçador", "Concórdia"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Sapucaia do Sul", "Uruguaiana", "Santa Cruz do Sul", "Cachoeirinha", "Bento Gonçalves", "Bagé", "Erechim"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Ibirité", "Poços de Caldas", "Patos de Minas", "Varginha", "Pouso Alegre", "Teófilo Otoni", "Barbacena", "Sabará", "Vespasiano", "Conselheiro Lafaiete", "Itabira", "Itajubá"],
  DF: ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Gama", "Planaltina", "Águas Claras", "Recanto das Emas", "Guará", "Sobradinho"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas", "Alagoinhas", "Barreiras", "Porto Seguro", "Guanambi", "Santo Antônio de Jesus", "Valença", "Itapetinga"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá", "Aquiraz", "Pacatuba", "Crateús"],
  PE: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão", "Igarassu", "São Lourenço da Mata", "Santa Cruz do Capibaribe", "Serra Talhada", "Araripina"],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal", "Abaetetuba", "Cametá", "Marituba", "Bragança", "São Félix do Xingu", "Barcarena", "Altamira", "Tucuruí"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tabatinga", "Maués", "Tefé", "Iranduba", "Humaitá"],
  MA: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal", "Balsas", "Santa Inês"],
  PB: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras", "Cabedelo", "Guarabira", "Mamanguape"],
  RN: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Caicó", "Açu", "Currais Novos", "São José de Mipibu"],
  AL: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "União dos Palmares", "Penedo", "São Miguel dos Campos", "Campo Alegre", "Coruripe", "Delmiro Gouveia"],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância", "Tobias Barreto", "Simão Dias", "Itaporanga d'Ajuda"],
  PI: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior", "Barras", "União", "Altos"],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Cacoal", "Vilhena", "Jaru", "Rolim de Moura", "Guajará-Mirim", "Buritis", "Pimenta Bueno"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Colinas do Tocantins", "Guaraí", "Formoso do Araguaia", "Dianópolis"],
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó", "Senador Guiomard", "Plácido de Castro"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão", "Porto Grande"],
  RR: ["Boa Vista", "Rorainópolis", "Caracaraí", "Cantá", "Mucajaí", "Bonfim"],
  ES: ["Vitória", "Vila Velha", "Serra", "Cariacica", "Cachoeiro de Itapemirim", "Linhares", "São Mateus", "Colatina", "Guarapari", "Aracruz", "Viana", "Nova Venécia"]
};

const limparCidade = (txt) => {
  if(!txt) return "";
  return txt.replace(/\s*-\s*[A-Z]{2}\s*$/,"").replace(/,\s*[A-Z]{2}\s*$/,"").trim();
};

export default function Perfil({
  vagas = [],
  modo,
  usuario,
  onSair,
  onEditar,
  onDeletar,
  onSuporte,
  onContatos,
  onSalvarCidade
}) {
  const [local, setLocal] = useState(limparCidade(usuario?.cidade || "Sinop") + " - MT");
  const [coords, setCoords] = useState(null);
  const [carregandoLocal, setCarregandoLocal] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const [estadoFeed, setEstadoFeed] = useState(usuario?.feedEstado || "MT");
  const [cidadeFeed, setCidadeFeed] = useState(limparCidade(usuario?.feedCidade || usuario?.cidade || "Sinop"));
  const [cidadeInput, setCidadeInput] = useState(limparCidade(usuario?.feedCidade || "Sinop"));
  const [salvando, setSalvando] = useState(false);
  const [comentarios, setComentarios] = useState([]);

  // Estados para edição rápida da Bio (Sugestão 6)
  const [editandoBio, setEditandoBio] = useState(false);
  const [textoBio, setTextoBio] = useState(usuario?.experiencias || usuario?.bio || usuario?.sobre || "");
  const [salvandoBio, setSalvandoBio] = useState(false);

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
    
    if(usuario?.experiencias || usuario?.bio || usuario?.sobre) {
      setTextoBio(usuario.experiencias || usuario.bio || usuario.sobre);
    }
  }, [usuario]);

  useEffect(() => {
    const uidAlvo = usuario?.uid || auth.currentUser?.uid;
    if (!uidAlvo) return;

    const q = query(collection(db, "avaliacoes"), where("prestadorId", "==", uidAlvo));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => {
        const dataA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
        const dataB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
        return dataB - dataA;
      });
      setComentarios(lista);
    }, (err) => {
      console.log("Erro ao carregar avaliações no perfil:", err);
    });

    return () => unsub();
  }, [usuario?.uid]);

  const formatarNomeAvaliador = (nomeCompleto) => {
    if (!nomeCompleto) return "Usuário";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`;
  };

  const handleTrocaEstado = (novoEstado) => {
    setEstadoFeed(novoEstado);
    const listaCidades = CIDADES_POR_ESTADO[novoEstado] || [];
    if (listaCidades.length > 0) {
      setCidadeInput(listaCidades[0]);
    }
  };

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
    if(!cidadeFinal) return alert("Selecione a cidade");
    setSalvando(true);
    try {
      localStorage.setItem("feed_cidade_diariafacil", cidadeFinal);
      localStorage.setItem("feed_estado_diariafacil", estadoFeed);
      localStorage.setItem("local_diariafacil", `${cidadeFinal} - ${estadoFeed}`);
      setLocal(`${cidadeFinal} - ${estadoFeed}`);
      setCidadeFeed(cidadeFinal);
      setCidadeInput(cidadeFinal);

      const dadosNovos = {
        feedCidade: cidadeFinal,
        feedEstado: estadoFeed,
        cidadeDesejada: cidadeFinal,
        estadoDesejado: estadoFeed,
      };

      if(auth.currentUser){
        await updateDoc(doc(db, "usuarios", auth.currentUser.uid), dadosNovos);
      }

      if (onSalvarCidade) {
        onSalvarCidade(dadosNovos);
      }

      alert(`✅ Vagas atualizadas para ${cidadeFinal} - ${estadoFeed}!`);
    } catch(e){ 
      alert("Erro ao salvar: " + e.message); 
    }
    setSalvando(false);
  };

  // Salvar Bio Inline (Sugestão 6)
  const salvarBioInline = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSalvandoBio(true);
    try {
      await updateDoc(doc(db, "usuarios", user.uid), {
        experiencias: textoBio.trim(),
        sobre: textoBio.trim()
      });
      setEditandoBio(false);
      alert("Bio atualizada com sucesso!");
    } catch (e) {
      alert("Erro ao salvar bio: " + e.message);
    }
    setSalvandoBio(false);
  };

  // Compartilhar Perfil no WhatsApp (Sugestão 7)
  const compartilharPerfil = () => {
    const nome = usuario?.nome || "Profissional";
    const nota = notaMedia;
    const cidadeLocal = usuario?.cidade || "Sinop - MT";
    const texto = `👷‍♂️ Olá! Conheça meu perfil profissional no Diária Fácil:\n\n*${nome}*\n⭐ Avaliação: ${nota} (${totalAval} avaliações)\n📍 Atende em: ${cidadeLocal}\n\nConfira vagas e contrate com segurança!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const totalAval = comentarios.length > 0 ? comentarios.length : (usuario?.totalAvaliacoes || 0);
  const somaNotas = comentarios.length > 0 ? comentarios.reduce((acc, curr) => acc + (Number(curr.nota) || 5), 0) : (usuario?.sumNotas || 0);
  const notaMedia = totalAval > 0 ? (somaNotas / totalAval).toFixed(1) : "5.0";
  const cidadesDoEstado = CIDADES_POR_ESTADO[estadoFeed] || [cidadeInput];

  // Especialidades / Tags customizadas do prestador (Sugestão 5)
  const especialidades = usuario?.especialidades || usuario?.habilidades || ["Ainda precisa ser editado pelo usuário"];

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
            <div className="w-3 h-[1.5px] bg-slate-700"></div>
            <div className="w-3 h-[1.5px] bg-slate-700"></div>
            <div className="w-3 h-[1.5px] bg-slate-700"></div>
          </button>
          {menuAberto && (
            <div className="absolute right-0 top-10 w-[200px] bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50">
              <button onClick={()=>{ setMenuAberto(false); onEditar?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-slate-50">Editar perfil completo</button>
              <button onClick={()=>{ setMenuAberto(false); onContatos?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-slate-50 border-t border-slate-100">Contatos</button>
              <button onClick={()=>{ setMenuAberto(false); onSuporte?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-slate-50 border-t border-slate-100">Suporte</button>
              <button onClick={()=>{ setMenuAberto(false); onDeletar?.(); }} className="w-full text-left px-4 py-3 text-[12px] font-medium hover:bg-red-50 border-t border-slate-100 text-red-600">Deletar conta</button>
            </div>
          )}
        </div>
      </div>
      
      {/* CABEÇALHO DO PERFIL */}
      <div className="mt-5 bg-white border border-slate-200 p-4 rounded-2xl flex gap-3 items-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
          {usuario?.foto ? <img src={usuario.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-semibold text-slate-500">{usuario?.nome?.[0]?.toUpperCase() || "A"}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-[14px] truncate">{usuario?.nome || "Usuário"}</p>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">✓ Verificado</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">⭐ {notaMedia} ({totalAval} avaliações)</p>
          <p className="text-[10px] mt-0.5 font-medium text-emerald-600">{coords ? "GPS ativo" : "GPS desativado"}</p>
        </div>
        <button onClick={onEditar} className="h-8 px-3 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-medium">Editar</button>
      </div>

      {/* SUGESTÃO 5: TAGS DE ESPECIALIDADES / HABILIDADES */}
      <div className="mt-3 bg-white border border-slate-200 p-4 rounded-2xl">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Especialidades:</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.isArray(especialidades) ? (
            especialidades.map((esp, idx) => (
              <span key={idx} className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium">
                {esp}
              </span>
            ))
          ) : (
            <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">Ainda precisa ser editado pelo usuário</span>
          )}
        </div>
      </div>

      {/* SUGESTÃO 7: BOTÃO DE COMPARTILHAR PERFIL NO WHATSAPP */}
      <button 
        onClick={compartilharPerfil}
        className="mt-3 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[12px] font-bold flex items-center justify-center gap-2 shadow-xs transition"
      >
        <span>📲</span> COMPARTILHAR MEU PERFIL NO WHATSAPP
      </button>

      {/* CONFIGURAÇÃO DO FEED DE VAGAS */}
      <div className="mt-3 bg-white border border-slate-200 p-4 rounded-2xl">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-[13px]">Onde ver vagas!</span>
          <span className="text-[9px] bg-slate-900 text-white px-2.5 py-1 rounded-full font-medium tracking-widest uppercase">Diária Mode</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">Selecione o estado para listar as cidades disponíveis.</p>
        
        <div className="mt-3 grid grid-cols-[80px_1fr] gap-2">
          <div>
            <label className="text-[10px] font-medium text-slate-500">ESTADO:</label>
            <select 
              value={estadoFeed} 
              onChange={(e)=>handleTrocaEstado(e.target.value)} 
              className="mt-1 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-2 text-[13px] font-medium focus:outline-none focus:border-slate-900"
            >
              {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-500">CIDADE:</label>
            <select
              value={cidadeInput}
              onChange={(e)=>setCidadeInput(e.target.value)}
              className="mt-1 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] focus:outline-none focus:border-slate-900 font-medium"
            >
              {cidadesDoEstado.map(cid => (
                <option key={cid} value={cid}>{cid}</option>
              ))}
            </select>
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

      {/* SEÇÃO DE AVALIAÇÕES E COMENTÁRIOS */}
      <div className="mt-3 bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-[13px]">⭐ Avaliações</span>
          <div className="flex items-center gap-1 font-bold text-[12px]">
            <span className="text-yellow-500">★</span>
            <span>{notaMedia} <span className="text-slate-400 font-normal">({totalAval})</span></span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {comentarios.length > 0 ? (
            comentarios.map((item) => (
              <div key={item.id} className="bg-[#fafaf7] p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {item.avaliadorFoto ? (
                      <img src={item.avaliadorFoto} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                        {(item.avaliadorNome || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-[12px] font-bold text-slate-900">
                      {formatarNomeAvaliador(item.avaliadorNome)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-yellow-500 text-[11px]">
                    {Array.from({ length: Number(item.nota) || 5 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>

                {item.comentario ? (
                  <p className="text-[12px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                    "{item.comentario}"
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Apenas nota em estrelas.</p>
                )}

                <div className="flex justify-between items-center mt-0.5">
                  {item.vagaTitulo ? (
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full truncate max-w-[170px]">
                      Serviço: {item.vagaTitulo}
                    </span>
                  ) : <span></span>}
                  <span className="text-[9px] text-slate-400">
                    {item.criadoEm?.toDate ? item.criadoEm.toDate().toLocaleDateString("pt-BR") : "Recentemente"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed">
              <p className="text-[12px] text-slate-400">Nenhum comentário recebido ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* SUGESTÃO 6: EDIÇÃO RÁPIDA DA BIO (MODO INLINE) */}
      <div className="mt-3 bg-white border border-slate-200 p-4 rounded-2xl">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-[13px]">Sobre mim</span>
          {!editandoBio ? (
            <button onClick={() => setEditandoBio(true)} className="text-[11px] text-slate-500 underline font-medium">editar rápido</button>
          ) : (
            <button onClick={() => setEditandoBio(false)} className="text-[11px] text-red-500 font-medium">cancelar</button>
          )}
        </div>

        {!editandoBio ? (
          usuario?.experiencias || usuario?.bio || usuario?.sobre ? (
            <p className="text-[12px] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{usuario.experiencias || usuario.bio || usuario.sobre}</p>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
              <p className="text-[11px] font-medium text-amber-800">Bio vazia</p>
              <p className="text-[11px] mt-1 text-amber-700">Bio completa tem 3x mais chance de ser aceito</p>
              <button onClick={() => setEditandoBio(true)} className="mt-3 bg-slate-900 text-white px-4 py-2 rounded-full text-[11px] font-medium">Adicionar bio agora</button>
            </div>
          )
        ) : (
          <div className="space-y-2 mt-2">
            <textarea
              rows={4}
              value={textoBio}
              onChange={(e) => setTextoBio(e.target.value)}
              placeholder="Escreva um pouco sobre sua experiência e serviços..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12px] outline-none focus:border-slate-900"
            />
            <button
              onClick={salvarBioInline}
              disabled={salvandoBio}
              className="w-full h-10 bg-slate-900 text-white rounded-xl text-[12px] font-bold disabled:opacity-50"
            >
              {salvandoBio ? "Salvando..." : "Salvar Bio"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-[12px]">Contato</p>
            <p className="text-[11px] mt-1 font-mono text-slate-600">{usuario?.zap || usuario?.email || "(66) 9xxxx-xxxx"}</p>
          </div>
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