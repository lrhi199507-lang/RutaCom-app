import React from 'react';
import { Wallet } from 'lucide-react';
import { CampanaNotificaciones } from "./CampanaNotificaciones";

export const Header = ({ userData, modo, onAbrirWallet }) => {
  const nombre = userData?.nombre || "Cargando...";
  
  // 🔥 CORRECCIÓN DEFINITIVA: La nube ya restó el dinero, así que 'saldo' es el real
  const saldoDisponible = typeof userData?.saldo === 'number' ? userData.saldo : 0;
  const saldoFormateado = saldoDisponible.toFixed(2);

  return (
    <header className="bg-white px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50">
      <div className="flex items-center gap-3">
        {/* 🔥 AQUÍ ESTÁ TU NUEVO LOGO 🔥 */}
        <div className="w-10 h-10 rounded-[14px] bg-white flex items-center justify-center shadow-lg shadow-blue-100 overflow-hidden shrink-0">
          <img src="/icon.png" alt="Logo Dame la Cola" className="w-full h-full object-cover" />
        </div>

        <div>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">
            MODO {modo?.toUpperCase() || "PASAJERO"}
          </p>
          <h1 className="text-xs font-black text-slate-800 leading-none">
            {nombre}
          </h1>
        </div>
      </div>

      {/* ZONA DERECHA: Notificaciones y Wallet */}
      <div className="flex items-center gap-3">
        
        {/* AQUÍ VA LA CAMPANITA */}
        <CampanaNotificaciones userData={userData} />

        {/* Botón de Wallet Slim (px-3.5 y py-2) */}
        <div 
          onClick={onAbrirWallet}
          className="bg-slate-900 text-white px-3.5 py-2 rounded-[18px] flex items-center gap-2.5 shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          <Wallet size={14} className="text-blue-400" />
          <p className="text-xs font-black italic">
            ${saldoFormateado}
          </p>
        </div>
      </div>
    </header>
  );
};
