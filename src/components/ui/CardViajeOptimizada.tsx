import React from 'react';
import { User, ShieldCheck, Star } from "lucide-react";

export const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir, onClickPerfil, estatusChofer }) => {
  const sinPuestos = viaje.puestos === 0;
  const ultimoPuesto = viaje.puestos === 1;

  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return "--h --m";
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60; 
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const duracion = calcularDuracion(viaje.horaSalida, viaje.horaLlegada);

  return (
    <div className={`bg-white rounded-[32px] border shadow-sm transition-all duration-300 overflow-hidden group ${sinPuestos ? 'opacity-60 grayscale-[0.5] pointer-events-none' : 'hover:shadow-xl hover:border-blue-100 border-slate-100'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center justify-between py-1 min-h-[60px]">
               <span className="text-sm font-black text-slate-800 leading-none">{viaje.horaSalida || "--:--"}</span>
               <span className="text-[9px] font-bold text-slate-400">{duracion}</span>
               <span className="text-sm font-black text-slate-800 leading-none">{viaje.horaLlegada || "--:--"}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1 py-1.5">
              <div className="w-2.5 h-2.5 rounded-full border-[3px] border-slate-800 bg-white z-10" />
              <div className="w-[2px] flex-1 bg-slate-200" />
              <div className="w-2.5 h-2.5 rounded-full border-[3px] border-blue-600 bg-white z-10" />
            </div>
            
            <div className="flex flex-col justify-between py-1 min-h-[60px]">
               <span className="text-sm font-black text-slate-800 uppercase leading-none">{viaje.cO}</span>
               <span className="text-sm font-black text-slate-800 uppercase leading-none">{viaje.cD}</span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-3xl font-black italic text-slate-800 leading-none">${viaje.precio}</span>
            {sinPuestos ? (
               <span className="text-[10px] font-black text-slate-500 uppercase mt-2 bg-slate-200 px-3 py-1 rounded-lg">Completo</span>
            ) : ultimoPuesto ? (
               <span className="text-[9px] font-black text-amber-600 uppercase mt-2 bg-amber-100 px-3 py-1 rounded-lg animate-pulse border border-amber-200">¡Último puesto!</span>
            ) : (
               <span className="text-[9px] font-bold text-green-600 uppercase mt-2 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{viaje.puestos} disponibles</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="relative" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm cursor-pointer group-hover:scale-105 transition-transform">
              <User size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <ShieldCheck size={16} className="text-blue-600 fill-blue-50" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-black italic uppercase text-sm text-slate-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
                {viaje.conductor}
              </h4>
              {(estatusChofer === "Oro" || estatusChofer === "Diamante" || estatusChofer === "Leyenda") && (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  <Star size={8} className="fill-amber-600"/>
                  <span className="text-[7px] font-black uppercase">Super Driver</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};