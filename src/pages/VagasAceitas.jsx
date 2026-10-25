import { useState } from "react";

export default function VagasAceitas({ vagas = [], usuario }) {
  
  // só vagas onde EU fui aceita
  const aceitas = vagas.filter(v => 
    v.candidatos?.some(c => 
      (c.uid === usuario?.uid || c.email === usuario?.email || c.nome === usuario?.nome) && c.aprovado === true
    )
  );

  const abrirZap = (zap) => {
    const num = zap?.replace(/\D/g, "") || "";
    if(!num) return alert("Contatonão encontrado");
    window.open(`https://wa.me/55${num}?text=Olá! Fui aceita na sua vaga no Diária Fácil!`, "_blank");
  };

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-[#f5f5f0] p-6 pb-28">
      <h2 className="text-2xl font-black leading-tight">Vagas Aceitas<br/></h2>
      <p className="text-[12px] opacity-60 mt-2">Anunciantes que escolheram você - BOA SORTE!</p>

      <div className="mt-6 space-y-4">
        {aceitas.length === 0 ? (
          <div className="bg-white p-8 rounded-[24px] border text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-black">Nenhuma vaga aceita ainda</p>
            <p className="text-[12px] opacity-60 mt-2">Quando alguém te aceitar em Minhas Vagas dele, vai aparecer aqui com o contato pra você!</p>
          </div>
        ) : (
          aceitas.map(v => {
            const zapLimpo = v.zap || v.whatsapp || "";
            return (
              <div key={v.id} className="bg-white p-5 rounded-[24px] border shadow-sm border-green-200">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-black text-[12px] text-green-700">✅ VOCÊ FOI ACEITA!</p>
                    <p className="font-black text-[15px] mt-1 leading-tight">{v.titulo}</p>
                    <p className="text-[11px] opacity-60 mt-1">📍 {v.cidade} • 💰 {v.valor}</p>
                  </div>
                  <span className="text-[10px] font-black bg-green-600 text-white px-3 py-1 rounded-full">ACEITA</span>
                </div>

                <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-xl">
                  <p className="text-[11px] font-black text-green-800"> CONTATO LIBERADO:</p>
                  <p className="text-[16px] font-mono font-black mt-1">{zapLimpo}</p>
                  <button onClick={()=>abrirZap(zapLimpo)} className="mt-3 w-full bg-green-600 text-white py-3 rounded-full font-black text-[12px]">
                     WHATSAPP
                  </button>
                </div>

                {v.descricao && <p className="mt-3 text-[12px] opacity-70 bg-zinc-50 p-3 rounded-xl">{v.descricao}</p>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}