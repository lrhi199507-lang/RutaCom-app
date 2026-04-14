import React from 'react';
import { Camera, ShieldCheck, CheckCircle, FileText, Car, Edit2, ShieldAlert } from "lucide-react";

export const KYCProgressBar = ({ userData, onAbrirConfig }) => {
  const hitos = [
    { id: 'foto', label: 'Foto de Perfil', completado: !!userData?.fotoPerfil, icono: <Camera size={14}/> },
    { id: 'telefono', label: 'Teléfono verificado', completado: !!userData?.telefonoVerificado, icono: <ShieldCheck size={14}/> },
    { id: 'correo', label: 'Correo verificado', completado: !!userData?.correoVerificado, icono: <CheckCircle size={14}/> },
    { id: 'cedula', label: 'Cédula de Identidad', completado: !!userData?.cedula, icono: <FileText size={14}/> },
    { id: 'vehiculo', label: 'Datos del Vehículo', completado: !!userData?.vehiculo?.placa, icono: <Car size={14}/> },
    { id: 'bio', label: 'Mini-biografía', completado: !!userData?.bio, icono: <Edit2 size={14}/> }
  ];

  const completados = hitos.filter(h => h.completado).length;
  const porcentaje = Math.round((completados / hitos.length) * 100);

  return (
    <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4 relative overflow-hidden mt-4">
      <div className="absolute top-[-10px] right-[-10px] opacity-[0.03] pointer-events-none text-blue-900">
        <ShieldCheck size={100} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-end mb-2">
           <div>
             <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-1">
                 <ShieldAlert size={14}/> Nivel de Confianza
             </p>
             <h3 className="text-xl font-black italic uppercase text-slate-800">{completados} de {hitos.length} completados</h3>
           </div>
           <div className="text-right">
             <span className="text-2xl font-black italic text-blue-600">{porcentaje}%</span>
           </div>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 p-1">
           <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-1000" style={{ width: `${porcentaje}%` }}></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mt-4">
         {hitos.map(h => (
            <div key={h.id} className={`flex justify-between items-center p-3 rounded-2xl border ${h.completado ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${h.completado ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{h.icono}</div>
                  <span className={`text-[11px] font-black uppercase italic ${h.completado ? 'text-slate-800' : 'text-slate-400'}`}>{h.label}</span>
               </div>
               {h.completado ? <CheckCircle size={16} className="text-blue-600"/> : <button onClick={onAbrirConfig} className="text-[9px] font-black uppercase italic bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg shadow-sm">Pendiente</button>}
            </div>
         ))}
      </div>
    </div>
  );
};