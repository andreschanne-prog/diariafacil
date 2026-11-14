import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase.js";

// Função auxiliar para calcular idade a partir da data de nascimento ou campo idade
const calcularIdade = (usuario) => {
  if (usuario?.idade) return `${usuario.idade} anos`;
  if (!usuario?.dataNascimento) return "Idade não informada";

  try {
    const nasc = usuario.dataNascimento.toDate
      ? usuario.dataNascimento.toDate()
      : new Date(usuario.dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade > 0 ? `${idade} anos` : "Idade não informada";
  } catch {
    return "Idade não informada";
  }
};

export default function Contatos({
  onVoltar,
  onVerPerfil,
  candidatoParaSalvar = null, // Opcional: se vier direto da tela onde aceitou a vaga
  onLimparCandidato
}) {
  const [contatosSalvos, setContatosSalvos] = useState([]);
  const [aceitosRecentes, setAceitosRecentes] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  const meuUid = auth.currentUser?.uid;

  // 1. Carrega em tempo real os contatos já salvos pelo usuário no Firestore
  useEffect(() => {
    if (!meuUid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "contatos_salvos"),
      where("donoId", "==", meuUid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => {
        const tA = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
        const tB = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
        return tB - tA;
      });
      setContatosSalvos(lista);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao carregar contatos salvos:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [meuUid]);

  // 2. Busca automaticamente candidatos que você aceitou nas vagas para sugerir salvar
  useEffect(() => {
    if (!meuUid) return;

    const qVagas = query(
      collection(db, "vagas"),
      where("anuncianteId", "==", meuUid)
    );

    const unsub = onSnapshot(qVagas, (snap) => {
      const encontrados = [];

      snap.docs.forEach((docVaga) => {
        const v = docVaga.data();
        // Verifica se a vaga tem um prestador aceito salvo no objeto da vaga
        if (v.prestadorAceito || v.candidatoAceito) {
          const p = v.prestadorAceito || v.candidatoAceito;
          encontrados.push({
            prestadorId: p.uid || p.id || v.prestadorId,
            nome: p.nome || p.nomeCompleto || "Prestador",
            foto: p.foto || p.avatar || "",
            idade: p.idade || "",
            dataNascimento: p.dataNascimento || "",
            zap: p.zap || p.telefone || "",
            vagaTitulo: v.titulo || "Serviço",
            vagaId: docVaga.id
          });
        }
      });

      // Remove duplicados pelo prestadorId
      const unicos = [];
      const idsVistos = new Set();
      for (const item of encontrados) {
        if (item.prestadorId && !idsVistos.has(item.prestadorId)) {
          idsVistos.add(item.prestadorId);
          unicos.push(item);
        }
      }

      setAceitosRecentes(unicos);
    });

    return () => unsub();
  }, [meuUid]);

  // Função para salvar o perfil nos contatos
  const handleSalvarContato = async (perfil) => {
    if (!meuUid || !perfil) return;
    const pid = perfil.prestadorId || perfil.uid || perfil.id;

    // Evita salvar duplicado
    const jaSalvo = contatosSalvos.some((c) => c.prestadorId === pid);
    if (jaSalvo) {
      alert("Este contato já está na sua lista!");
      onLimparCandidato?.();
      return;
    }

    setSalvandoId(pid);
    try {
      await addDoc(collection(db, "contatos_salvos"), {
        donoId: meuUid,
        prestadorId: pid,
        nome: perfil.nome || perfil.nomeCompleto || "Usuário",
        foto: perfil.foto || perfil.avatar || "",
        idade: perfil.idade || "",
        dataNascimento: perfil.dataNascimento || "",
        zap: perfil.zap || perfil.telefone || "",
        vagaTitulo: perfil.vagaTitulo || "",
        criadoEm: serverTimestamp()
      });
      onLimparCandidato?.();
    } catch (e) {
      alert("Erro ao salvar contato: " + e.message);
    }
    setSalvandoId(null);
  };

  // Função para remover contato
  const handleRemoverContato = async (e, contatoDocId) => {
    e.stopPropagation(); // Impede que clique no card e abra o perfil
    if (!window.confirm("Remover este contato da sua lista?")) return;
    try {
      await deleteDoc(doc(db, "contatos_salvos", contatoDocId));
    } catch (err) {
      alert("Erro ao remover contato.");
    }
  };

  // Sugestões de perfis aceitos que ainda NÃO foram salvos
  const sugestoesNaoSalvas = aceitosRecentes.filter(
    (aceito) => !contatosSalvos.some((salvo) => salvo.prestadorId === aceito.prestadorId)
  );

  // Filtro da barra de pesquisa
  const termo = busca.toLowerCase().trim();
  const contatosFiltrados = contatosSalvos.filter((c) =>
    (c.nome || "").toLowerCase().includes(termo)
  );

  return (
    <div className="max-w-[640px] mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-28">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {onVoltar && (
            <button
              onClick={onVoltar}
              className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition"
              title="Voltar"
            >
              ←
            </button>
          )}
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
              Meus Contatos
            </h2>
            <p className="text-[11px] text-slate-500">
              Prestadores salvos para futuras vagas
            </p>
          </div>
        </div>

        <span className="text-[11px] font-medium bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-600">
          {contatosSalvos.length} salvo(s)
        </span>
      </div>

      {/* DESTAQUE PARA SALVAR QUEM ACABOU DE SER ACEITO NA VAGA */}
      {candidatoParaSalvar && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-2">
            Prestador aceito na vaga
          </p>
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => onVerPerfil?.(candidatoParaSalvar.prestadorId || candidatoParaSalvar.uid || candidatoParaSalvar.id)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-white overflow-hidden ring-2 ring-emerald-300 flex-shrink-0">
                {candidatoParaSalvar.foto ? (
                  <img
                    src={candidatoParaSalvar.foto}
                    alt={candidatoParaSalvar.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-emerald-700">
                    {(candidatoParaSalvar.nome || "P")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[14px] text-slate-900 truncate group-hover:underline">
                  {candidatoParaSalvar.nome || candidatoParaSalvar.nomeCompleto}
                </p>
                <p className="text-[11px] text-slate-600">
                  {calcularIdade(candidatoParaSalvar)} • Clique para ver perfil
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSalvarContato(candidatoParaSalvar)}
              disabled={salvandoId !== null}
              className="h-9 px-4 bg-slate-900 text-white rounded-full text-[12px] font-medium hover:bg-slate-800 active:scale-95 transition shrink-0"
            >
              {salvandoId ? "Salvando..." : "+ Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* SUGESTÕES DE PRESTADORES QUE VOCÊ ACEITOU EM VAGAS ANTERIORES */}
      {sugestoesNaoSalvas.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[11px] font-medium tracking-widest text-slate-400 uppercase mb-2">
            Aceitos recentemente nas suas vagas
          </h3>
          <div className="space-y-2">
            {sugestoesNaoSalvas.map((sug) => (
              <div
                key={sug.prestadorId}
                onClick={() => onVerPerfil?.(sug.prestadorId)}
                className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
                    {sug.foto ? (
                      <img src={sug.foto} alt={sug.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-semibold text-slate-500">
                        {(sug.nome || "P")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-slate-900 truncate">
                      {sug.nome}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {calcularIdade(sug)} • {sug.vagaTitulo}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSalvarContato(sug);
                  }}
                  disabled={salvandoId === sug.prestadorId}
                  className="h-8 px-3.5 bg-slate-900 text-white rounded-full text-[11px] font-medium hover:bg-slate-800 transition shrink-0"
                >
                  {salvandoId === sug.prestadorId ? "..." : "Salvar contato"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BARRA DE PESQUISA */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
          🔍
        </span>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar contato pelo nome..."
          className="w-full h-10 pl-9 pr-9 bg-white border border-slate-200 rounded-full text-[13px] focus:outline-none focus:border-slate-900"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-100 rounded-full text-[10px]"
          >
            ✕
          </button>
        )}
      </div>

      {/* LISTA DE CONTATOS SALVOS (CLICÁVEIS PARA VER O PERFIL) */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-white border border-slate-200 rounded-2xl"></div>
          <div className="h-16 bg-white border border-slate-200 rounded-2xl"></div>
        </div>
      ) : contatosFiltrados.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-[13px] font-medium text-slate-700">
            {busca
              ? `Nenhum contato encontrado para "${busca}"`
              : "Você ainda não salvou nenhum contato."}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Quando você aceitar um candidato para preencher uma vaga, poderá salvar o perfil dele aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {contatosFiltrados.map((contato) => (
            <div
              key={contato.id}
              onClick={() => onVerPerfil?.(contato.prestadorId)}
              className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-slate-400 active:scale-[0.99] transition shadow-sm"
            >
              {/* FOTO + NOME COMPLETO + IDADE */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200 flex-shrink-0">
                  {contato.foto ? (
                    <img
                      src={contato.foto}
                      alt={contato.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-semibold text-[15px] text-slate-600">
                      {(contato.nome || "C")[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[14px] text-slate-900 truncate">
                    {contato.nome}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {calcularIdade(contato)}
                  </p>
                </div>
              </div>

              {/* AÇÕES: REMOVER E INDICADOR DE VER PERFIL */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleRemoverContato(e, contato.id)}
                  title="Remover contato"
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center text-xs transition"
                >
                  ✕
                </button>
                <span className="text-slate-400 text-sm pr-1">›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}