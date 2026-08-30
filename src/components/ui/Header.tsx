import React from 'react';
import { Wallet } from 'lucide-react';
import { CampanaNotificaciones } from "./CampanaNotificaciones";

// Tu logo que ya arreglamos
import logoApp from '../../logo.png';

export const Header = ({ userData, modo, onAbrirWallet }) => {
  const nombre = userData?.nombre || "Cargando...";
  
  const saldoDisponible = typeof userData?.saldo === 'number' ? userData.saldo : 0;
  const saldoFormateado = saldoDisponible.toFixed(2);

  return (
    <header className="bg-white px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-50">
      <div className="flex items-center gap-3">
        
        {/* CONTENEDOR DEL LOGO: Sombra sutil con el Azul Tránsito */}
        <div className="w-10 h-10 rounded-[14px] bg-white flex items-center justify-center shadow-lg shadow-[#063971]/15 overflow-hidden shrink-0">
          <img src={logoApp} alt="Logo Dame la Cola" className="w-full h-full object-cover" />
        </div>

        <div>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">
            MODO {modo?.toUpperCase() || "PASAJERO"}
          </p>
          {/* TEXTO GENERAL: Gris Oscuro Oficial */}
          <h1 className="text-xs font-black text-[#1F2937] leading-none">
            {nombre}
          </h1>
        </div>
      </div>

      {/* ZONA DERECHA: Notificaciones y Wallet */}
      <div className="flex items-center gap-3">
        
        <CampanaNotificaciones userData={userData} />

        {/* BILLETERA: Fondo Gris Oscuro y Textos en Verde Éxito */}
        <div 
          onClick={onAbrirWallet}
          className="bg-[#1F2937] px-3.5 py-2 rounded-[18px] flex items-center gap-2.5 shadow-xl shadow-[#10B981]/10 active:scale-95 transition-all cursor-pointer"
        >
          <Wallet size={14} className="text-[#10B981]" />
          <p className="text-xs font-black italic text-[#10B981]">
            ${saldoFormateado}
          </p>
        </div>
      </div>
    </header>
  );
};
