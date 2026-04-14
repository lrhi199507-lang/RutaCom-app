import React from 'react';
import { Map as MapIcon, Wallet } from 'lucide-react';

export const Header = ({ userData, modo, viajeActivo, setVista, cambiarVista }) => {
  return (
    <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-12 shadow-lg">
          D
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase">Modo {modo}</p>
          <p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
         {viajeActivo && (
           <button 
             onClick={() => setVista("en_viaje")} 
             className="bg-green-500 text-white p-2 rounded-xl animate-pulse shadow-md"
           >
             <MapIcon size={18}/>
           </button>
         )}
         <div 
           onClick={() => cambiarVista("wallet")} 
           className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl active:scale-95"
         >
           <Wallet size={14} className="text-blue-400" /> 
           ${userData.saldo?.toFixed(2) || "0.00"}
         </div>
      </div>
    </header>
  );
};