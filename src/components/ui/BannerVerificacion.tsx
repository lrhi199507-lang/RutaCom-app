import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const BannerVerificacion = ({ cambiarVista, setConfigOpen }) => {
  return (
    <div className="bg-amber-50 border border-amber-200 p-5 rounded-[30px] flex items-start gap-4 animate-in fade-in duration-500">
      <ShieldAlert size={30} className="text-amber-500 shrink-0" />
      <div>
        <h3 className="text-amber-800 font-black italic uppercase text-sm mb-1">Verificación Requerida</h3>
        <p className="text-[10px] text-amber-700 font-bold mb-3">
          Para publicar rutas y llevar pasajeros, primero debes completar tu perfil de conductor (Cédula y Vehículo).
        </p>
        <button 
          onClick={() => { 
            cambiarVista("perfil"); 
            setTimeout(() => setConfigOpen(true), 300); 
          }} 
          className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95"
        >
          Ir a verificarme
        </button>
      </div>
    </div>
  );
};