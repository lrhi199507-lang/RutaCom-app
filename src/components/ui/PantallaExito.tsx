import React from 'react';
import { CheckCircle } from "lucide-react";

export const PantallaExito = ({ visible, titulo, subtitulo, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-300">
      <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <CheckCircle size={60} className="text-green-600" />
      </div>
      
      <h2 className="text-3xl font-black italic text-slate-800 uppercase text-center leading-none mb-4 tracking-tighter">
        {titulo}
      </h2>
      
      <p className="text-slate-500 text-center font-medium text-sm mb-10 leading-relaxed">
        {subtitulo}
      </p>

      <button 
        onClick={onClose}
        className="w-full py-5 bg-slate-900 text-white rounded-[25px] font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all"
      >
        Entendido
      </button>
    </div>
  );
};