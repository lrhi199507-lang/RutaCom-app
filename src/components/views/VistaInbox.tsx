import React from 'react';
import { User, ChevronLeft } from 'lucide-react';

export const VistaInbox = ({ historialChats, misViajesPublicados, abrirChat }) => {
  return (
    <div className="space-y-3 animate-in fade-in">
      {historialChats.map(c => {
        const soyChofer = misViajesPublicados.some(v => v.id === c.idViaje);
        return (
          <div 
            key={c.chatId} 
            onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} 
            className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[7px] font-black uppercase italic ${soyChofer ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              Chat como {soyChofer ? 'Chofer' : 'Pasajero'}
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
              <User size={20} className="text-blue-500 group-hover:text-white"/>
            </div>
            <div className="flex-1 overflow-hidden pt-2">
              <p className="text-xs font-black italic uppercase text-slate-800">{c.nombreOtro}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate">{c.ultimoMensaje}</p>
            </div>
            <ChevronLeft size={16} className="text-slate-300 transform rotate-180 shrink-0"/>
          </div>
        );
      })}
    </div>
  );
};