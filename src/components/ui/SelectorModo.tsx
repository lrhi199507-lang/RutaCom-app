import React from 'react';

export const SelectorModo = ({ modo, setModo }) => {
  return (
    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[20px]">
      <button 
        onClick={() => setModo("pasajero")} 
        className={`flex-1 py-3 rounded-[15px] text-[10px] font-black uppercase italic transition-all ${modo === "pasajero" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
      >
        Buscar Cola
      </button>
      <button 
        onClick={() => setModo("chofer")} 
        className={`flex-1 py-3 rounded-[15px] text-[10px] font-black uppercase italic transition-all ${modo === "chofer" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
      >
        Publicar Viaje
      </button>
    </div>
  );
};