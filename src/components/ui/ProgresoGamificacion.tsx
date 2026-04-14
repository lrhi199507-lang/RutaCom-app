import React from 'react';
import { User, ShieldCheck, Car, Trophy, Zap, CheckCircle } from "lucide-react";

export const ProgresoGamificacion = ({ userData, onAbrirConfig }) => {
  const misiones = [
    { id: 'datos', label: 'Datos Básicos', completado: !!userData?.nombre, icono: <User size={14}/> },
    { id: 'cedula', label: 'Verificación KYC', completado: !!userData?.cedula, icono: <ShieldCheck size={14}/> },
    { id: 'vehiculo', label: 'Registrar Vehículo', completado: !!userData?.vehiculo?.placa, icono: <Car size={14}/> }
  ];
  const completadas = misiones.filter(m => m.completado).length;
  
  const viajesActuales = userData?.viajesCompletados || 0;
  let metaViajes = 10; let proxEstatus = "Plata";
  if (viajesActuales >= 10) { metaViajes = 30; proxEstatus = "Oro"; }
  if (viajesActuales >= 30) { metaViajes = 80; proxEstatus = "Diamante"; }
  if (viajesActuales >= 80) { metaViajes = viajesActuales; proxEstatus = "Leyenda"; }
  const faltan = metaViajes > viajesActuales ? metaViajes - viajesActuales : 0;
  
  return (
    <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4 relative overflow-hidden mt-4">
      <div className="absolute top-[-10px] right-[-10px] opacity-[0.03] pointer-events-none"><Trophy size={100} /></div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
           <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1"><Zap size={14}/> Sube de Nivel</p>
           <div className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">Próximo: {proxEstatus}</div>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
           <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-1000" style={{width: `${metaViajes === viajesActuales ? 100 : Math.min((viajesActuales/metaViajes)*100, 100)}%`}}></div>
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-1 text-right">Faltan {faltan} viajes para {proxEstatus}</p>
      </div>

      <div className="h-px w-full bg-slate-100 my-1"></div>

      <div>
        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-3 flex justify-between items-center">
           Misiones de Confianza <span className="text-slate-400">{completadas}/{misiones.length}</span>
        </p>
        <div className="space-y-2">
           {misiones.map(m => (
              <div key={m.id} className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${m.completado ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                 <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${m.completado ? 'bg-green-200 text-green-700' : 'bg-slate-200 text-slate-400'}`}>{m.icono}</div>
                    <span className={`text-[10px] font-black uppercase italic ${m.completado ? 'text-green-700' : 'text-slate-500'}`}>{m.label}</span>
                 </div>
                 {m.completado ? (
                    <CheckCircle size={14} className="text-green-500"/>
                 ) : (
                    <button onClick={onAbrirConfig} className="text-[8px] font-black uppercase italic bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md active:scale-95">Completar</button>
                 )}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};