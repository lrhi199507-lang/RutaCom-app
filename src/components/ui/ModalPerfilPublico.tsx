import React from 'react';
import { X, User, Star, ShieldAlert } from 'lucide-react';
import { BadgeEstatus } from './BadgeEstatus'; // Asegúrate de que el nombre coincida
import { SenalesConfianza } from './SenalesConfianza'; 

export const ModalPerfilPublico = ({ 
  perfilPublico, 
  setPerfilPublico, 
  modalOpinionesVisible, 
  setModalOpinionesVisible 
}) => {
  // Solo se muestra si hay un perfil seleccionado y el modal de opiniones está cerrado
  if (!perfilPublico || modalOpinionesVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-[40px] p-8 w-full max-w-xs shadow-2xl relative text-center">
          <button onClick={() => setPerfilPublico(null)} className="absolute top-4 right-4 text-slate-300">
            <X size={24}/>
          </button>
          
          <div className="relative mb-4 inline-block">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-inner">
              <User size={48} className="text-blue-600"/>
            </div>
            <div className="absolute -bottom-2 right-0">
              <BadgeEstatus nivel={perfilPublico.estatus || "Bronce"} />
            </div>
          </div>

          <h3 className="font-black italic uppercase text-2xl text-slate-800">{perfilPublico.nombre}</h3>
          <SenalesConfianza data={perfilPublico} />

          <div className="flex gap-2 mt-6 w-full">
             <div 
               onClick={() => setModalOpinionesVisible(true)} 
               className="flex-1 bg-slate-50 p-4 rounded-3xl border cursor-pointer hover:bg-blue-50 transition-colors group"
             >
                <Star size={20} className="text-amber-500 fill-amber-500 mx-auto mb-1 group-hover:scale-110 transition-transform"/>
                <p className="text-[10px] font-black uppercase text-blue-600 leading-none mb-1 opacity-0 group-hover:opacity-100 transition-opacity">Ver Reseñas</p>
                <p className="text-xl font-black italic text-slate-800">{perfilPublico.rating || "5.0"}</p>
             </div>
             <div className="flex-1 bg-slate-50 p-4 rounded-3xl border">
                <ShieldAlert size={20} className="text-red-400 mx-auto mb-1"/>
                <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Cancelaciones</p>
                <p className="text-xl font-black italic text-slate-800">{perfilPublico.cancelaciones || "0"}</p>
             </div>
          </div>
       </div>
    </div>
  );
};