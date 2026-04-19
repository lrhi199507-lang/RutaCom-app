import React from 'react';
import { Wallet } from 'lucide-react';

export const Header = ({ userData, modo }) => {
  // BLINDAJE: Si userData no ha cargado, ponemos valores por defecto para evitar pantalla blanca
  const nombre = userData?.nombre || "Cargando...";
  const saldo = typeof userData?.saldo === 'number' ? userData.saldo.toFixed(2) : "0.00";

  return (
    <header className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-100">
      <div className="flex items-center gap-3">
        {/* Logo 'D' Azul con letra Blanca - Estilo Minimalista */}
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <span className="font-black text-white text-xl italic">D</span>
        </div>

        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] leading-none">
            MODO {modo?.toUpperCase() || "PASAJERO"}
          </p>
          <h1 className="text-sm font-black text-slate-900 tracking-tight mt-1">
            {nombre}
          </h1>
        </div>
      </div>

      {/* Botón de Wallet Negro Minimalista */}
      <div className="flex items-center gap-2">
        <div className="h-10 bg-slate-950 rounded-2xl flex items-center gap-2 px-4 shadow-md active:scale-95 transition-all">
          <Wallet size={14} className="text-blue-500" />
          <p className="text-xs font-black text-white tracking-tighter">
            ${saldo}
          </p>
        </div>
      </div>
    </header>
  );
};
