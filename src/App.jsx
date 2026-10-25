import { useState, useEffect } from "react"
import { auth, db } from "./firebase.js"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, collection, onSnapshot, orderBy, query, where, getDocs } from "firebase/firestore"

import Header from "./components/Header"
import Feed from "./pages/Feed"
import CriarVaga from "./pages/CriarVaga"
import Perfil from "./pages/Perfil"
import Cadastro from "./pages/Cadastro"
import EditarPerfil from "./pages/EditarPerfil"
import Login from "./pages/Login"
import MinhasVagas from "./pages/MinhasVagas"
import VagasAceitas from "./pages/VagasAceitas"
import PerfilVisitante from "./pages/PerfilVisitante"
import Admin from "./pages/Admin"
import Termos from "./pages/termos"
import Privacidade from "./pages/privacidade"
import CriarAnuncio from "./pages/CriarAnuncio"

export default function App() {
  const [tela, setTela] = useState("feed")
  const [telaAnterior, setTelaAnterior] = useState("feed")
  const [logado, setLogado] = useState(false)
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  const [precisaCompletarCadastro, setPrecisaCompletarCadastro] = useState(false)
  const [mostrarCadastro, setMostrarCadastro] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const [vagas, setVagas] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [anunciosBrutos, setAnunciosBrutos] = useState([])
  const [visitanteId, setVisitanteId] = useState(null)
  const [visitanteData, setVisitanteData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [termosAceito, setTermosAceito] = useState(false)
  const [privacidadeAceita, setPrivacidadeAceita] = useState(false)
  const [anuncioEditando, setAnuncioEditando] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if(user){
        const ref = doc(db, "usuarios", user.uid)
        const snap = await getDoc(ref)
        if(snap.exists()){
          const dados = snap.data()
          setUsuario({ ...dados, email: user.email, foto: dados.foto || user.photoURL || "", uid: user.uid })
          setPrecisaCompletarCadastro(false)
        } else {
          setUsuario({ nome: user.displayName, email: user.email, foto: user.photoURL || "", uid: user.uid })
          setPrecisaCompletarCadastro(true)
        }
        setLogado(true)
        setMostrarCadastro(false)
        localStorage.setItem("feed_cidade_diariafacil", snap.exists() ? snap.data().cidade || "Sinop" : "Sinop")
      } else {
        setLogado(false)
        setUsuario(null)
        setIsAdmin(false)
        localStorage.removeItem("usuario_diariafacil")
      }
      setCarregandoAuth(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const checarAdmin = async () => {
      if(!usuario?.uid && !usuario?.email) return
      try {
        const emailAtual = (usuario.email || auth.currentUser?.email || "").toLowerCase().trim();
        const emailsADM = ["andreschanne@gmail.com", "diariafacil@gmail.com"]; 
        if(emailsADM.includes(emailAtual)){ setIsAdmin(true); return; }
        const refUid = doc(db, "admins", usuario.uid)
        const snapUid = await getDoc(refUid)
        if(snapUid.exists()){ setIsAdmin(true); return; }
        const refEmail = doc(db, "admins", emailAtual)
        const snapEmail = await getDoc(refEmail)
        if(snapEmail.exists()){ setIsAdmin(true); return; }
        const q = query(collection(db, "admins"), where("email", "==", emailAtual))
        const snapQuery = await getDocs(q)
        if(!snapQuery.empty){ setIsAdmin(true); return; }
        setIsAdmin(false);
      } catch(e){ console.log("Erro checar admin:", e); }
    }
    checarAdmin()
  }, [usuario])

  useEffect(() => {
    if (!logado) return;
    const q = query(collection(db, "vagas"), orderBy("criadoEm", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setVagas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [logado]);

  // BUSCA ANÚNCIOS BRUTOS
  useEffect(() => {
    if (!logado) return;
    const qAnu = query(collection(db, "anuncios"), orderBy("criadoEm", "desc"));
    const unsub = onSnapshot(qAnu, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.ativo !== false)
      setAnunciosBrutos(lista)
    })
    return () => unsub()
  }, [logado])

  const cidadeFiltro = usuario?.feedCidade || usuario?.cidadeDesejada || localStorage.getItem("feed_cidade_diariafacil") || "Sinop";
  const estadoFiltro = usuario?.feedEstado || usuario?.estadoDesejado || localStorage.getItem("feed_estado_diariafacil") || "MT";

  // FILTRA ANÚNCIOS POR PAÍS / ESTADO / CIDADE + ROTACIONA JUSTO
  useEffect(() => {
    const filtrar = () => {
      const cidadeAtual = cidadeFiltro.toLowerCase().trim()
      const estadoAtual = estadoFiltro.toLowerCase().trim()
      
      let filtrados = anunciosBrutos.filter(a => {
        if (!a.alcance) return true
        if (a.alcance === "brasil") return true
        if (a.alcance === "pais") {
          const p = (a.pais || "Brasil").toLowerCase()
          if (p.includes("todos")) return true
          return p === "brasil"
        }
        if (a.alcance === "estado") {
          return (a.estadoLower || (a.estado || "").toLowerCase()) === estadoAtual
        }
        if (a.alcance === "cidade") {
          return (a.cidadeLower || (a.cidade || "").toLowerCase()) === cidadeAtual
        }
        return true
      })

      // ROTACIONA JUSTO - QUEM TEM MENOS VIEWS APARECE PRIMEIRO
      filtrados = filtrados
        .sort((a, b) => (a.impressoes || 0) - (b.impressoes || 0))
        .map(a => ({ a, r: Math.random() }))
        .sort((x, y) => {
          const diff = (x.a.impressoes || 0) - (y.a.impressoes || 0)
          if (Math.abs(diff) > 50) return diff
          return x.r - y.r
        })
        .map(x => x.a)

      setAnuncios(filtrados)
    }
    filtrar()
  }, [anunciosBrutos, cidadeFiltro, estadoFiltro])

  const abrirPerfilVisitante = (vagaOuUsuario) => {
    if(!vagaOuUsuario) return
    if(typeof vagaOuUsuario === 'string'){
      setVisitanteId(vagaOuUsuario)
      setVisitanteData(null)
    } else {
      setVisitanteId(vagaOuUsuario.anuncianteId || vagaOuUsuario.uid)
      setVisitanteData({
        uid: vagaOuUsuario.anuncianteId,
        nome: vagaOuUsuario.anuncianteNome || vagaOuUsuario.nome,
        foto: vagaOuUsuario.anuncianteFoto || vagaOuUsuario.foto,
        cidade: vagaOuUsuario.cidade,
        sobre: vagaOuUsuario.anuncianteSobre
      })
    }
    setTela("visitante")
  }

  const irParaTermos = (tipo) => { setTelaAnterior(tela); setTela(tipo) }

  if(carregandoAuth) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[13px] text-slate-500">Carregando...</div>
  if (tela === "termos") { return <Termos onVoltar={() => setTela(telaAnterior)} onAceitar={() => { setTermosAceito(true); setTela(telaAnterior); }} /> }
  if (tela === "privacidade") { return <Privacidade onVoltar={() => setTela(telaAnterior)} onAceitar={() => { setPrivacidadeAceita(true); setTela(telaAnterior); }} /> }
  if (!logado) {
    if(mostrarCadastro){ return <Cadastro onEntrar={(dados)=>{ setUsuario({...usuario, ...dados}); setMostrarCadastro(false); }} onVoltar={()=>setMostrarCadastro(false)} usuarioInicial={null} onVerTermos={()=>irParaTermos("termos")} onVerPrivacidade={()=>irParaTermos("privacidade")} termosJaAceito={termosAceito} privacidadeJaAceita={privacidadeAceita} /> }
    return <Login onLogin={()=>{}} onCadastro={()=>setMostrarCadastro(true)} />
  }
  if(precisaCompletarCadastro){ return <Cadastro onEntrar={(dados)=>{ setUsuario({...usuario, ...dados}); setPrecisaCompletarCadastro(false); setTela("feed") }} usuarioInicial={usuario} onVerTermos={()=>irParaTermos("termos")} onVerPrivacidade={()=>irParaTermos("privacidade")} termosJaAceito={termosAceito} privacidadeJaAceita={privacidadeAceita} /> }

  const feedVagas = vagas.filter(v => {
    if(v.fechada || v.status === "preenchida") return false;
    if(cidadeFiltro && v.cidade){
      const cVaga = v.cidade.toLowerCase();
      const cFiltro = cidadeFiltro.toLowerCase();
      if(!cVaga.includes(cFiltro) && !cFiltro.includes(cVaga)) return false;
    }
    return true;
  });

  const uidAtual = auth.currentUser?.uid || usuario?.uid;
  const emailAtual = (auth.currentUser?.email || usuario?.email || "").toLowerCase();
  const minhasVagasFiltradas = vagas.filter(v => {
    if(!uidAtual) return false;
    const donoUid = v.anuncianteId || v.uid || "";
    const donoEmail = (v.anuncianteEmail || v.email || "").toLowerCase();
    return donoUid === uidAtual || donoEmail === emailAtual;
  });

  const aceitasCount = vagas.filter(v => v.candidatos?.some(c => (c.uid === uidAtual || (c.email && c.email.toLowerCase() === emailAtual)) && c.aprovado)).length;

  const navItem = (id, label, badge) => (
    <button onClick={()=>setTela(id)} className={`relative flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all text-[11px] ${tela===id ? 'bg-slate-900 text-white font-medium' : 'text-slate-500 font-normal hover:text-slate-700'}`}>
      {label}
      {badge > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1">{badge}</span>}
    </button>
  )

  const Footer = () => (
    <div className="max-w-[640px] mx-auto mt-10 mb-28 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-semibold">d</div>
          <p className="text-[12px] font-semibold">diariafacil • Sinop</p>
          <span className="text-[10px] text-slate-400">© 2025</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>irParaTermos("termos")} className="text-[11px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100">Termos de Uso</button>
          <button onClick={()=>irParaTermos("privacidade")} className="text-[11px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100">Privacidade - LGPD</button>
          <button onClick={()=>irParaTermos("suporte")} className="text-[11px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100">Suporte</button>
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">Conectamos diaristas e quem precisa em Sinop-MT. Não somos empregador.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <Header onPostar={()=>setTela("criar")} usuario={usuario} isAdmin={isAdmin} onAdmin={()=>setTela("admin")} />
      
      {tela === "feed" && <><Feed vagas={feedVagas} anuncios={anuncios} cidadeFiltro={cidadeFiltro} estadoFiltro={estadoFiltro} onVerPerfil={abrirPerfilVisitante} /><Footer /></>}
      {tela === "criar" && <CriarVaga onVoltar={()=>setTela("feed")} onSucesso={()=>setTela("feed")} usuario={usuario} />}
      {tela === "minhas" && <><MinhasVagas vagas={minhasVagasFiltradas} usuario={usuario} onVerPerfil={abrirPerfilVisitante} /><Footer /></>}
      {tela === "aceitas" && <><VagasAceitas vagas={vagas} usuario={usuario} /><Footer /></>}
      {tela === "visitante" && <PerfilVisitante usuarioId={visitanteId} usuarioData={visitanteData} onVoltar={()=>setTela("feed")} />}
      
      {tela === "admin" && (
        <Admin 
          onVoltar={()=>setTela("feed")} 
          onAbrirCriarAnuncio={() => { setAnuncioEditando(null); setTela("criarAnuncio") }}
          onEditarAnuncio={(anuncio) => { setAnuncioEditando(anuncio); setTela("criarAnuncio") }}
        />
      )}

      {tela === "criarAnuncio" && (
        <CriarAnuncio anuncioParaEditar={anuncioEditando} onVoltar={()=>setTela("admin")} />
      )}

      {tela === "perfil" && <><Perfil vagas={vagas} modo="perfil" usuario={usuario} onSair={()=>{ auth.signOut(); setLogado(false) }} onEditar={()=>setTela("editar")} onDeletar={()=>setTela("deletar")} onSuporte={()=>setTela("suporte")} onAnuncio={()=>setTela("anuncio")} /><Footer /></>}
      {tela === "editar" && <EditarPerfil usuario={usuario} onVoltar={()=>setTela("perfil")} onSalvar={(d)=>{ setUsuario({...usuario, ...d}); setTela("perfil") }} />}
      {tela === "suporte" && (
        <div className="max-w-[600px] mx-auto min-h-screen bg-white p-6">
          <button onClick={()=>setTela(telaAnterior)} className="w-9 h-9 border border-slate-200 rounded-full text-[13px]">←</button>
          <h2 className="text-[18px] font-semibold mt-6">Suporte</h2>
          <p className="text-[13px] text-slate-500 mt-1">Fale com a gente no WhatsApp</p>
          <button onClick={()=>window.open("https://wa.me/5566999999999","_blank")} className="mt-6 w-full bg-slate-900 text-white h-11 rounded-full text-[14px] font-medium">Abrir WhatsApp</button>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-3 flex justify-center z-50">
        <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
          {navItem("feed","Vagas")}
          {navItem("minhas","Meus posts")}
          {navItem("aceitas","Aceitas",aceitasCount)}
          {navItem("perfil","Perfil")}
        </div>
      </div>
    </div>
  )
}