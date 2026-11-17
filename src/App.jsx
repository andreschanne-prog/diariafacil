import { useState, useMemo, useCallback } from "react";
import { auth } from "./firebase.js";

import Header from "./components/Header";
import Feed from "./pages/Feed";
import CriarVaga from "./pages/CriarVaga";
import Perfil from "./pages/Perfil";
import Contatos from "./pages/Contatos";
import Cadastro from "./pages/Cadastro";
import EditarPerfil from "./pages/EditarPerfil";
import Login from "./pages/Login";
import RecuperarSenha from "./components/RecuperarSenha";
import MinhasVagas from "./pages/MinhasVagas";
import VagasAceitas from "./pages/VagasAceitas";
import PerfilVisitante from "./pages/PerfilVisitante";
import Admin from "./pages/Admin";
import Termos from "./pages/termos";
import Privacidade from "./pages/privacidade";
import CriarAnuncio from "./pages/CriarAnuncio";
import Welcome from "./components/Welcome";
import DeletarConta from "./components/DeletarConta";
import ModalAvisoFlutuante from "./components/ModalAvisoFlutuante";
import BottomNav from "./components/BottomNav";
import AppFooter from "./components/AppFooter";

import { useAuth } from "./hooks/useAuth";
import { useFeed } from "./hooks/useFeed";
import { useAdmin } from "./hooks/useAdmin";
import { useNotifications } from "./hooks/useNotifications";

const WHATSAPP_SUPORTE = import.meta.env.VITE_WHATSAPP_SUPORTE || "5566992576552";

// === TRAVA DE ADMIN POR E-MAIL - COLOCA SEU E-MAIL AQUI ===
const EMAILS_ADMIN = ["a06696632497@gmail.com"]; // <-- TROCA PELO SEU E-MAIL DE LOGIN

export default function App() {
  const { usuario, logado, carregando: carregandoAuth, atualizarUsuario, sair } = useAuth();
  const isAdminHook = useAdmin(usuario);

  // AGORA TEM 4 FORMAS - se qualquer uma for true, aparece
  const isAdmin =
    isAdminHook === true ||
    usuario?.isAdmin === true ||
    usuario?.role === "admin" ||
    EMAILS_ADMIN.includes((usuario?.email || "").toLowerCase());

  const { aviso, setAviso } = useNotifications(usuario);

  const [tela, setTela] = useState("feed");
  const [historico, setHistorico] = useState(["feed"]);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [visitante, setVisitante] = useState({ id: null, data: null });
  const [candidatoParaSalvar, setCandidatoParaSalvar] = useState(null);
  const [termosAceito, setTermosAceito] = useState(false);
  const [privacidadeAceita, setPrivacidadeAceita] = useState(false);
  const [anuncioEditando, setAnuncioEditando] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("jaViuWelcome_diariafacil"));

  const cidadeFiltro = usuario?.feedCidade || usuario?.cidade || null;
  const estadoFiltro = usuario?.feedEstado || usuario?.estado || null;

  const { vagas, feedVagas, anuncios } = useFeed(logado, cidadeFiltro, estadoFiltro);

  const navegar = useCallback((novaTela) => {
    setHistorico(h => [...h, novaTela]);
    setTela(novaTela);
  }, []);

  const voltar = useCallback(() => {
    setHistorico(h => {
      if (h.length <= 1) return h;
      const novo = h.slice(0, -1);
      setTela(novo[novo.length - 1]);
      return novo;
    });
  }, []);

  const abrirPerfilVisitante = useCallback((vagaOuUsuario) => {
    if (!vagaOuUsuario) return;
    if (typeof vagaOuUsuario === "string") {
      setVisitante({ id: vagaOuUsuario, data: null });
    } else {
      setVisitante({
        id: vagaOuUsuario.uid || vagaOuUsuario.anuncianteId || vagaOuUsuario.id,
        data: {
          uid: vagaOuUsuario.uid || vagaOuUsuario.anuncianteId || vagaOuUsuario.id,
          nome: vagaOuUsuario.nome || vagaOuUsuario.anuncianteNome,
          foto: vagaOuUsuario.foto || vagaOuUsuario.anuncianteFoto,
          cidade: vagaOuUsuario.cidade,
          estado: vagaOuUsuario.estado,
          email: vagaOuUsuario.email,
          sobre: vagaOuUsuario.sobre || vagaOuUsuario.anuncianteSobre,
        }
      });
    }
    navegar("visitante");
  }, [navegar]);

  const abrirContatos = useCallback((candidato = null) => {
    if (candidato) setCandidatoParaSalvar(candidato);
    navegar("contatos");
  }, [navegar]);

  const uidAtual = usuario?.uid || usuario?.id;
  const emailAtual = (usuario?.email || "").toLowerCase();

  const minhasVagas = useMemo(() => vagas.filter(v => {
    if (!uidAtual) return false;
    return (v.anuncianteId || v.uid) === uidAtual || (v.anuncianteEmail || v.email || "").toLowerCase() === emailAtual;
  }), [vagas, uidAtual, emailAtual]);

  const aceitasCount = useMemo(() => vagas.filter(v =>
    v.candidatos?.some(c => (c.uid === uidAtual || (c.email && c.email.toLowerCase() === emailAtual)) && c.aprovado)
  ).length, [vagas, uidAtual, emailAtual]);

  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 mx-auto space-y-4 pt-6" style={{ maxWidth: 640 }}>
        <div className="h-12 bg-white rounded-2xl animate-pulse" />
        <div className="h-40 bg-white rounded-2xl animate-pulse" />
        <div className="h-40 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (showWelcome) {
    return <Welcome onEntrar={() => { localStorage.setItem("jaViuWelcome_diariafacil", "true"); setShowWelcome(false); }} />;
  }

  if (tela === "termos") return <Termos onVoltar={voltar} onAceitar={() => { setTermosAceito(true); voltar(); }} />;
  if (tela === "privacidade") return <Privacidade onVoltar={voltar} onAceitar={() => { setPrivacidadeAceita(true); voltar(); }} />;

  if (!logado) {
    if (mostrarCadastro) return <Cadastro onEntrar={() => setMostrarCadastro(false)} onVoltar={() => setMostrarCadastro(false)} onVerTermos={() => navegar("termos")} onVerPrivacidade={() => navegar("privacidade")} termosJaAceito={termosAceito} privacidadeJaAceita={privacidadeAceita} />;
    if (mostrarRecuperar) return <RecuperarSenha onVoltar={() => setMostrarRecuperar(false)} />;
    return <Login onLogin={() => {}} onCadastro={() => setMostrarCadastro(true)} onEsqueceuSenha={() => setMostrarRecuperar(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" translate="no">
      {aviso && (
        <button onClick={() => setAviso(null)} className="fixed top-4 left-4 right-4 mx-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg text-left border border-slate-700" style={{ maxWidth: 640, zIndex: 999 }}>
          <p className="font-semibold" style={{ fontSize: 13 }}>{aviso.titulo}</p>
          {aviso.corpo && <p className="text-slate-300" style={{ fontSize: 12 }}>{aviso.corpo}</p>}
        </button>
      )}

      <Header usuario={usuario} isAdmin={isAdmin} onAdmin={() => navegar("admin")} onVerPerfil={() => navegar("perfil")} />

      {tela === "feed" && <><Feed vagas={feedVagas} anuncios={anuncios} cidadeFiltro={cidadeFiltro} estadoFiltro={estadoFiltro} onVerPerfil={abrirPerfilVisitante} onAbrirContatos={() => abrirContatos()} /><AppFooter onVerTermos={() => navegar("termos")} onVerPrivacidade={() => navegar("privacidade")} onComoFunciona={() => setShowWelcome(true)} /></>}
      {tela === "criar" && <CriarVaga onVoltar={() => setTela("feed")} onSucesso={() => setTela("feed")} usuario={usuario} />}
      {tela === "minhas" && <><MinhasVagas vagas={minhasVagas} usuario={usuario} onVerPerfil={abrirPerfilVisitante} onSalvarContato={abrirContatos} /><AppFooter onVerTermos={() => navegar("termos")} onVerPrivacidade={() => navegar("privacidade")} onComoFunciona={() => setShowWelcome(true)} /></>}
      {tela === "aceitas" && <><VagasAceitas vagas={vagas} usuario={usuario} /><AppFooter onVerTermos={() => navegar("termos")} onVerPrivacidade={() => navegar("privacidade")} onComoFunciona={() => setShowWelcome(true)} /></>}
      {tela === "contatos" && <><Contatos onVoltar={() => setTela("perfil")} onVerPerfil={abrirPerfilVisitante} candidatoParaSalvar={candidatoParaSalvar} onLimparCandidato={() => setCandidatoParaSalvar(null)} /><AppFooter onVerTermos={() => navegar("termos")} onVerPrivacidade={() => navegar("privacidade")} onComoFunciona={() => setShowWelcome(true)} /></>}
      {tela === "visitante" && <PerfilVisitante usuarioId={visitante.id} usuarioData={visitante.data} usuarioLogado={usuario} onVoltar={voltar} />}
      {tela === "admin" && <Admin onVoltar={() => setTela("feed")} onAbrirCriarAnuncio={() => { setAnuncioEditando(null); navegar("criarAnuncio"); }} onEditarAnuncio={(a) => { setAnuncioEditando(a); navegar("criarAnuncio"); }} onVerPerfil={abrirPerfilVisitante} />}
      {tela === "criarAnuncio" && <CriarAnuncio anuncioParaEditar={anuncioEditando} onVoltar={() => setTela("admin")} />}
      {tela === "deletar" && <DeletarConta />}
      {tela === "perfil" && <><Perfil usuario={usuario} onSair={sair} onEditar={() => navegar("editar")} onContatos={() => abrirContatos()} onDeletar={() => navegar("deletar")} onSuporte={() => navegar("suporte")} onSalvarCidade={atualizarUsuario} /><AppFooter onVerTermos={() => navegar("termos")} onVerPrivacidade={() => navegar("privacidade")} onComoFunciona={() => setShowWelcome(true)} /></>}
      {tela === "editar" && <EditarPerfil usuario={usuario} onVoltar={() => setTela("perfil")} onSalvar={(d) => { atualizarUsuario(d); setTela("perfil"); }} />}
      {tela === "suporte" && (
        <div className="mx-auto min-h-screen bg-white p-6" style={{ maxWidth: 640 }}>
          <button onClick={voltar} className="w-9 h-9 border border-slate-200 rounded-full">←</button>
          <h2 className="font-semibold mt-6" style={{ fontSize: 18 }}>Suporte</h2>
          <p className="text-slate-500 mt-1" style={{ fontSize: 13 }}>Fale com a gente no WhatsApp</p>
          <button onClick={() => window.open(`https://wa.me/${WHATSAPP_SUPORTE}`, "_blank")} className="mt-6 w-full bg-slate-900 text-white h-11 rounded-full font-medium" style={{ fontSize: 14 }}>Abrir WhatsApp</button>
        </div>
      )}

      {tela !== "admin" && <ModalAvisoFlutuante />}
      <BottomNav tela={tela} onNavegar={navegar} aceitasCount={aceitasCount} />
    </div>
  );
}