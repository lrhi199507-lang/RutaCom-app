import React from 'react';
import { Crown, Star, Wind, CigaretteOff, User } from 'lucide-react';

export const TarjetaViaje = ({ 
  viaje, 
  estatusChofer, 
  sinPuestos, 
  onClickDetalle, 
  onClickPedir,
  onClickPerfil 
}) => {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div onClick={onClickPerfil} className="cursor-pointer">
            <h4 className="text-xs font-black italic uppercase text-slate-800">{viaje.nombreChofer}</h4>
            
            {/* PASO 4: ETIQUETA VIP PARA EL PASAJERO */}
            {viaje.preferencias?.maxDosAtras && (
              <div className="mt-1.5 inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg shadow-sm">
                <Crown size={10} className="text-purple-600" />
                <span className="text-[8px] font-black uppercase tracking-wider">Máximo 2 Atrás</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center text-slate-700">
                <Star size={10} className="fill-amber-500 text-amber-500" />
                <span className="text-[10px] font-black ml-0.5">{viaje.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{estatusChofer}</span>
            </div>
          </div>
          
          <div className="flex gap-1">
            {viaje.preferencias?.ac && <div className="p-1.5 bg-blue-50 text-blue-500 rounded-full"><Wind size={12}/></div>}
            {viaje.preferencias?.noFumar && <div className="p-1.5 bg-slate-50 text-slate-400 rounded-full"><CigaretteOff size={12}/></div>}
          </div>
        </div>
      </div>

      {!sinPuestos && (
        <div className="px-3 pb-3 flex gap-2">
          <button 
            onClick={onClickDetalle} 
            className="flex-1 py-3 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase italic text-[9px] hover:bg-slate-100 transition-colors pointer-events-auto"
          >
            Ver Viaje
          </button>
          <button 
            onClick={onClickPedir} 
            className="flex-[2] py-3 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[9px] shadow-md hover:bg-blue-600 transition-all active:scale-95 pointer-events-auto"
          >
            Reservar ahora
          </button>
        </div>
      )}
    </div>
  );
};