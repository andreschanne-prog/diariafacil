import { useState, useEffect } from "react"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import { db } from "../firebase.js"

export default function Estatisticas({ onVoltar, onVerPerfil }) {
  const [carregando, setCarregando] = useState(true)
  const [abaPrincipal, setAbaPrincipal] = useState("vagas") // "vagas" ou "usuarios"

  // Estados de Vagas
  const [dadosDias, setDadosDias] = useState([])
  const [dadosMeses, setDadosMeses] = useState([])
  const [tipoFiltroVagas, setTipoFiltroVagas] = useState("dia") // "dia" ou "mes"
  const [totalPreenchidas, setTotalPreenchidas] = useState(0)
  const [debugVagasInfo, setDebugVagasInfo] = useState("")

  // Estados de Usuários
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [listaUsuariosBrutos, setListaUsuariosBrutos] = useState([])
  const [porPais, setPorPais] = useState([])
  const [porEstado, setPorEstado] = useState([])
  const [porCidade, setPorCidade] = useState([])
  const [abaRegiao, setAbaRegiao] = useState("cidade") // "cidade", "estado", "pais", "lista"
  const [buscaRegiao, setBuscaRegiao] = useState("")

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true)

        // 1. BUSCAR VAGAS DO FIRESTORE
        const snapVagas = await getDocs(collection(db, "vagas"))
        const contagemPorDia = {}
        const contagemPorMes = {}
        let contadorVagas = 0
        let totalLidasVagas = snapVagas.docs.length

        snapVagas.docs.forEach(docSnap => {
          const vaga = docSnap.data()
          
          const statusStr = String(vaga.status || "").toLowerCase().trim()
          const estaPreenchida = 
            statusStr === "preenchida" || 
            statusStr === "fechada" || 
            statusStr === "concluida" ||
            vaga.preenchida === true || 
            vaga.fechada === true

          if (estaPreenchida) {
            contadorVagas++
            
            const dataBruta = vaga.dataVaga || vaga.data || vaga.dataCriacao || vaga.criadoEm

            let dataIso = new Date().toISOString().split('T')[0]
            if (dataBruta) {
              if (typeof dataBruta.toDate === 'function') {
                dataIso = dataBruta.toDate().toISOString().split('T')[0]
              } else if (typeof dataBruta === 'string') {
                dataIso = dataBruta.split('T')[0]
              }
            }

            let dataFormatada = dataIso
            try {
              const partes = dataIso.split('-')
              if (partes.length === 3) {
                const [ano, mes, dia] = partes
                dataFormatada = `${dia}/${mes}/${ano}`
                const mesAnoFormatado = `${mes}/${ano}`
                contagemPorMes[mesAnoFormatado] = (contagemPorMes[mesAnoFormatado] || 0) + 1
              }
            } catch {}

            contagemPorDia[dataFormatada] = (contagemPorDia[dataFormatada] || 0) + 1
          }
        })

        setDebugVagasInfo(`Lidas: ${totalLidasVagas} vagas no total | Identificadas como preenchidas: ${contadorVagas}`)

        const listaVagasDias = Object.keys(contagemPorDia).map(data => ({
          data,
          quantidade: contagemPorDia[data]
        })).sort((a, b) => {
          const [diaA, mesA, anoA] = a.data.split('/')
          const [diaB, mesB, anoB] = b.data.split('/')
          return new Date(`${anoA}-${mesA}-${diaA}`) - new Date(`${anoB}-${mesB}-${diaB}`)
        })

        const listaVagasMeses = Object.keys(contagemPorMes).map(mesAno => ({
          data: mesAno,
          quantidade: contagemPorMes[mesAno]
        })).sort((a, b) => {
          const [mesA, anoA] = a.data.split('/')
          const [mesB, anoB] = b.data.split('/')
          return new Date(`${anoA}-${mesA}-01`) - new Date(`${anoB}-${mesB}-01`)
        })

        setDadosDias(listaVagasDias)
        setDadosMeses(listaVagasMeses)
        setTotalPreenchidas(contadorVagas)

        // 2. BUSCAR USUÁRIOS DO FIRESTORE
        const snapUsuarios = await getDocs(collection(db, "usuarios"))
        let contadorUsuarios = 0
        const usuariosArray = []
        const mapPais = {}
        const mapEstado = {}
        const mapCidade = {}

        snapUsuarios.docs.forEach(docSnap => {
          const user = { id: docSnap.id, uid: docSnap.id, ...docSnap.data() }
          contadorUsuarios++
          usuariosArray.push(user)

          const pais = (user.pais || user.paisDesejado || "Brasil").trim()
          mapPais[pais] = (mapPais[pais] || 0) + 1

          const estado = (user.estado || user.feedEstado || user.estadoDesejado || "MT").toUpperCase().trim()
          mapEstado[estado] = (mapEstado[estado] || 0) + 1

          let cidadeRaw = user.cidade || user.feedCidade || user.cidadeDesejada || "Sinop"
          cidadeRaw = cidadeRaw.replace(/\s*-\s*[A-Z]{2}\s*$/, "").replace(/,\s*[A-Z]{2}\s*$/, "").trim()
          const cidadeFormatada = cidadeRaw ? cidadeRaw.charAt(0).toUpperCase() + cidadeRaw.slice(1).toLowerCase() : "Sinop"
          
          mapCidade[cidadeFormatada] = (mapCidade[cidadeFormatada] || 0) + 1
        })

        const formatarArray = (mapa) => {
          return Object.keys(mapa).map(nome => ({
            nome,
            quantidade: mapa[nome]
          })).sort((a, b) => b.quantidade - a.quantidade)
        }

        setListaUsuariosBrutos(usuariosArray)
        setPorPais(formatarArray(mapPais))
        setPorEstado(formatarArray(mapEstado))
        setPorCidade(formatarArray(mapCidade))
        setTotalUsuarios(contadorUsuarios)

      } catch (e) {
        console.error("Erro ao carregar estatísticas:", e)
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  // Função para excluir usuário falso ou ruim
  const excluirUsuario = async (e, userId, userName) => {
    e.stopPropagation() // Evita abrir o perfil ao clicar no botão de excluir
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName || userId}"? Essa ação não pode ser desfeita.`)) return

    try {
      await deleteDoc(doc(db, "usuarios", userId))
      // Atualiza a lista localmente removendo o usuário excluído
      setListaUsuariosBrutos(prev => prev.filter(u => u.id !== userId))
      setTotalUsuarios(prev => prev - 1)
      alert("Usuário excluído com sucesso!")
    } catch (err) {
      console.error("Erro ao excluir usuário:", err)
      alert("Erro ao excluir usuário. Tente novamente.")
    }
  }

  const listaVagasAtiva = tipoFiltroVagas === "dia" ? dadosDias : dadosMeses
  const maiorQuantidadeVagas = listaVagasAtiva.length > 0 ? Math.max(...listaVagasAtiva.map(d => d.quantidade)) : 1

  const cidadesFiltradas = porCidade.filter(item => item.nome.toLowerCase().includes(buscaRegiao.toLowerCase()))
  const estadosFiltrados = porEstado.filter(item => item.nome.toLowerCase().includes(buscaRegiao.toLowerCase()))
  const paisesFiltrados = porPais.filter(item => item.nome.toLowerCase().includes(buscaRegiao.toLowerCase()))
  const usuariosFiltradosLista = listaUsuariosBrutos.filter(u => (u.nome || u.email || "").toLowerCase().includes(buscaRegiao.toLowerCase()))

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-[#fef9ef] pb-24 text-slate-900">
      {/* Topo */}
      <div className="bg-black text-white p-4 sticky top-0 z-20 flex items-center gap-3 shadow-md">
        <button 
          onClick={onVoltar} 
          className="w-9 h-9 bg-white text-black rounded-full font-bold flex items-center justify-center text-sm shadow hover:bg-slate-100 transition"
        >
          ←
        </button>
        <div>
          <h2 className="font-black text-[15px] tracking-wide leading-none">📊 ESTATÍSTICAS DA PLATAFORMA</h2>
          <p className="text-[10px] opacity-60 mt-1">Acompanhe vagas preenchidas e distribuição de usuários do Brasil</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Seletor Principal */}
        <div className="flex gap-2 bg-white p-1.5 border border-slate-200 rounded-2xl shadow-sm">
          <button 
            onClick={() => setAbaPrincipal("vagas")} 
            className={`flex-1 h-11 rounded-xl font-bold text-[12px] transition ${abaPrincipal === "vagas" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
          >
            📈 Vagas Preenchidas ({totalPreenchidas})
          </button>
          <button 
            onClick={() => setAbaPrincipal("usuarios")} 
            className={`flex-1 h-11 rounded-xl font-bold text-[12px] transition ${abaPrincipal === "usuarios" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
          >
            👥 Usuários do Brasil ({totalUsuarios})
          </button>
        </div>

        {/* CONTEÚDO 1: VAGAS PREENCHIDAS */}
        {abaPrincipal === "vagas" && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">CONTADOR:</p>
                <p className="text-[24px] font-black mt-0.5">{totalPreenchidas} <span className="text-[13px] font-normal text-slate-300">vagas confirmadas</span></p>
                <p className="text-[10px] text-slate-400 mt-1">{debugVagasInfo}</p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
                📊
              </div>
            </div>

            <div className="flex gap-2 bg-white p-1.5 border border-slate-200 rounded-2xl shadow-sm">
              <button 
                onClick={() => setTipoFiltroVagas("dia")} 
                className={`flex-1 h-10 rounded-xl font-bold text-[12px] transition ${tipoFiltroVagas === "dia" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
              >
                📅 RESULTADO DO DIA
              </button>
              <button 
                onClick={() => setTipoFiltroVagas("mes")} 
                className={`flex-1 h-10 rounded-xl font-bold text-[12px] transition ${tipoFiltroVagas === "mes" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
              >
                🗓️ RESULTADO DO MÊS
              </button>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-[13px] text-slate-800">
                {tipoFiltroVagas === "dia" ? "Fluxo diário de vagas preenchidas" : "Fluxo mensal de vagas preenchidas"}
              </h3>

              {carregando ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-slate-400 animate-pulse">Carregando dados de vagas...</p>
                </div>
              ) : listaVagasAtiva.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {listaVagasAtiva.map((item, index) => {
                    const porcentagem = Math.round((item.quantidade / maiorQuantidadeVagas) * 100)
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-[12px]">
                          <span className="font-bold text-slate-700">
                            {tipoFiltroVagas === "dia" ? "📅 " : "🗓️ Mês: "} {item.data}
                          </span>
                          <span className="font-black text-slate-900">{item.quantidade} {item.quantidade === 1 ? 'vaga' : 'vagas'}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-900 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.max(porcentagem, 12)}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <p className="text-[13px] font-bold text-slate-700">Nenhuma vaga preenchida encontrada.</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Certifique-se de que os documentos na coleção <code className="bg-slate-200 px-1 py-0.5 rounded">vagas</code> possuam o campo <code className="bg-slate-200 px-1 py-0.5 rounded">status: "preenchida"</code> ou <code className="bg-slate-200 px-1 py-0.5 rounded">status: "fechada"</code>.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTEÚDO 2: USUÁRIOS POR REGIÃO */}
        {abaPrincipal === "usuarios" && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Total de Usuários no Brasil</p>
                <p className="text-[24px] font-black mt-0.5">{totalUsuarios} <span className="text-[13px] font-normal text-slate-300">contas ativas</span></p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
                🇧🇷
              </div>
            </div>

            <div className="flex gap-1.5 bg-white p-1.5 border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
              <button 
                onClick={() => { setAbaRegiao("cidade"); setBuscaRegiao(""); }} 
                className={`flex-1 min-w-[85px] h-10 rounded-xl font-bold text-[11px] transition whitespace-nowrap px-2 ${abaRegiao === "cidade" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
              >
                🏙️ Cidades
              </button>
              <button 
                onClick={() => { setAbaRegiao("estado"); setBuscaRegiao(""); }} 
                className={`flex-1 min-w-[85px] h-10 rounded-xl font-bold text-[11px] transition whitespace-nowrap px-2 ${abaRegiao === "estado" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
              >
                📍 Estados
              </button>
              <button 
                onClick={() => { setAbaRegiao("pais"); setBuscaRegiao(""); }} 
                className={`flex-1 min-w-[85px] h-10 rounded-xl font-bold text-[11px] transition whitespace-nowrap px-2 ${abaRegiao === "pais" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
              >
                🌍 Países
              </button>
              <button 
                onClick={() => { setAbaRegiao("lista"); setBuscaRegiao(""); }} 
                className={`flex-1 min-w-[90px] h-10 rounded-xl font-bold text-[11px] transition whitespace-nowrap px-2 ${abaRegiao === "lista" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
              >
                👤 Todos ({listaUsuariosBrutos.length})
              </button>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
              <input 
                type="text"
                value={buscaRegiao}
                onChange={e => setBuscaRegiao(e.target.value)}
                placeholder={
                  abaRegiao === "cidade" ? "🔍 Buscar cidade..." :
                  abaRegiao === "estado" ? "🔍 Buscar estado (ex: MT, SP...)" :
                  abaRegiao === "pais" ? "🔍 Buscar país..." :
                  "🔍 Buscar nome ou email do usuário..."
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] outline-none focus:border-slate-900"
              />
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[13px] text-slate-800 capitalize">
                  {abaRegiao === "cidade" && `Cidades encontradas (${cidadesFiltradas.length})`}
                  {abaRegiao === "estado" && `Estados do Brasil (${estadosFiltrados.length})`}
                  {abaRegiao === "pais" && `Países (${paisesFiltrados.length})`}
                  {abaRegiao === "lista" && `Lista de Usuários (${usuariosFiltradosLista.length})`}
                </h3>
                {buscaRegiao && (
                  <button onClick={() => setBuscaRegiao("")} className="text-[10px] text-blue-600 font-bold underline">
                    Limpar busca
                  </button>
                )}
              </div>

              {carregando ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-slate-400 animate-pulse">Carregando dados geográficos...</p>
                </div>
              ) : (
                <div className="space-y-2 pt-1 max-h-[400px] overflow-y-auto pr-1">
                  {abaRegiao === "cidade" && (
                    cidadesFiltradas.length > 0 ? (
                      cidadesFiltradas.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="font-bold text-[13px] text-slate-700">📍 {item.nome}</span>
                          <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-1 rounded-full">{item.quantidade} {item.quantidade === 1 ? 'usuário' : 'usuários'}</span>
                        </div>
                      ))
                    ) : <p className="text-center py-6 text-[12px] text-slate-400">Nenhuma cidade encontrada.</p>
                  )}

                  {abaRegiao === "estado" && (
                    estadosFiltrados.length > 0 ? (
                      estadosFiltrados.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="font-bold text-[13px] text-slate-700">🗺️ Estado: {item.nome}</span>
                          <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-1 rounded-full">{item.quantidade} {item.quantidade === 1 ? 'usuário' : 'usuários'}</span>
                        </div>
                      ))
                    ) : <p className="text-center py-6 text-[12px] text-slate-400">Nenhum estado encontrado.</p>
                  )}

                  {abaRegiao === "pais" && (
                    paisesFiltrados.length > 0 ? (
                      paisesFiltrados.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="font-bold text-[13px] text-slate-700">🌍 {item.nome}</span>
                          <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-1 rounded-full">{item.quantidade} {item.quantidade === 1 ? 'usuário' : 'usuários'}</span>
                        </div>
                      ))
                    ) : <p className="text-center py-6 text-[12px] text-slate-400">Nenhum país encontrado.</p>
                  )}

                  {abaRegiao === "lista" && (
                    usuariosFiltradosLista.length > 0 ? (
                      usuariosFiltradosLista.map((user) => (
                        <div 
                          key={user.id} 
                          onClick={() => {
                            if (onVerPerfil) onVerPerfil(user)
                          }}
                          className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl cursor-pointer transition gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 bg-slate-900 text-white font-bold rounded-full flex items-center justify-center text-xs overflow-hidden shrink-0">
                              {user.foto ? (
                                <img src={user.foto} className="w-full h-full object-cover" alt="" />
                              ) : (
                                (user.nome || "U")[0].toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[13px] text-slate-900 hover:underline truncate">{user.nome || "Usuário sem nome"}</p>
                              <p className="text-[10px] text-slate-500 truncate">{user.email || "Sem e-mail"} • {user.cidade || "Sinop"} / {user.estado || "MT"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hidden sm:inline">Ver Perfil →</span>
                            <button
                              onClick={(e) => excluirUsuario(e, user.id, user.nome)}
                              title="Excluir usuário ruim ou fake"
                              className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg flex items-center justify-center text-xs transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    ) : <p className="text-center py-6 text-[12px] text-slate-400">Nenhum usuário encontrado.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}