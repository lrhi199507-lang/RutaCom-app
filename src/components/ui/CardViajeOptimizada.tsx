import React from 'react';
import { User, ShieldCheck, Star, Wind, CigaretteOff, Crown, Clock, MapPin } from "lucide-react";

export const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir, onClickPerfil, estatusChofer, modo = "pasajero", onEliminar }) => {
  const sinPuestos = viaje.puestos === 0;
  
  // Usamos nombreChofer para ser consistentes con tu base de datos
  const nombreMostrado = viaje.nombreChofer || viaje.conductor || "Chofer";

  return (
    <div className={`bg-white rounded-[32px] border shadow-sm transition-all duration-300 overflow-hidden mb-4 ${sinPuestos ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-md border-slate-100'}`}>
      <div className="p-5">
        {/* HEADER: Nombre y Etiquetas VIP */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <h4 className="font-black italic uppercase text-sm text-slate-800 flex items-center gap-2">
              {nombreMostrado}
              <ShieldCheck size={14} className="text-blue-500" />
            </h4>
            
            {/* Etiqueta VIP de comodidad */}
            {viaje.preferencias?.maxDosAtras && (
              <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-lg w-fit">
                <Crown size={10} />
                <span className="text-[8px] font-black uppercase tracking-wider">Máximo 2 Atrás</span>
              </div>
            )}
          </div>
          <p className="text-xl font-black text-blue-600">${viaje.precioViaje || viaje.precio}</p>
        </div>

        {/* RUTA: Origen y Destino */}
        <div className="bg-slate-50 p-4 rounded-2xl mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{viaje.origen}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{viaje.destino}</p>
          </div>
        </div>

        {/* INFO EXTRA: Hora, Puestos y Preferencias */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase">Salida</span>
              <span className="text-[10px] font-bold text-slate-700">{viaje.horaSalida || "--:--"}</span>
            </div>
            <div className="flex flex-col border-l pl-4">
              <span className="text-[8px] font-black text-slate-400 uppercase">Puestos</span>
              <span className={`text-[10px] font-bold ${viaje.puestos === 1 ? 'text-orange-500' : 'text-slate-700'}`}>
                {viaje.puestos || 0} Libres
              </span>
            </div>
          </div>

          {/* Iconos de Preferencias */}
          <div className="flex gap-1">
            {viaje.preferencias?.ac && <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Wind size={12}/></div>}
            {viaje.preferencias?.noFumar && <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><CigaretteOff size={12}/></div>}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        {modo === "pasajero" ? (
          <div className="flex gap-2 mt-4">
            <button onClick={onClickDetalle} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase italic">Ver Detalles</button>
            <button onClick={onClickPedir} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-lg">Pedir Cola</button>
          </div>
        ) : (
          <button onClick={onEliminar} className="w-full mt-4 py-3 border-2 border-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase italic hover:bg-red-50">Eliminar Ruta</button>
        )}
      </div>
    </div>
  );
};
