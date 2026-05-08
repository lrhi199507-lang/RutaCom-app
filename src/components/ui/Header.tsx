import React from 'react';
import { Wallet } from 'lucide-react';
import { CampanaNotificaciones } from "./CampanaNotificaciones";

export const Header = ({ userData, modo, onAbrirWallet }) => {
  const nombre = userData?.nombre || "Cargando...";
  const saldo = typeof userData?.saldo === 'number' ? userData.saldo.toFixed(2) : "0.00";

  return (
    <header className="bg-white px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50">
      <div className="flex items-center gap-3">
        {/* Logo 'D' Slim (w-10 y rounded-14) */}
        <div className="w-10 h-10 rounded-[14px] bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
          <span className="font-black text-white text-lg italic">D</span>
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
            ${saldo}
          </p>
        </div>
      </div>
    </header>
  );
};
