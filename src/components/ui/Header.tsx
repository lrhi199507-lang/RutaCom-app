import React from 'react';
import { Map as MapIcon, Wallet } from 'lucide-react';

export const Header = ({ userData, modo, viajeActivo, setVista, cambiarVista }) => {
  return (
    <header className="
      /* FONDO AZUL: Aquí le damos el cuerpo que pediste */
      bg-gradient-to-r from-blue-700 to-blue-500 
      p-5 pt-12 pb-8
      rounded-b-[35px] 
      flex justify-between items-center 
      shrink-0 z-10 
      shadow-lg shadow-blue-500/20
      -mx-1 /* Para que pegue un poco más a los bordes */
    ">
      
      {/* LADO IZQUIERDO: Branding y Usuario */}
      <div className="flex items-center gap-3">
        {/* El Logo 'D' ahora sobre blanco para que resalte en el fondo azul */}
        <div className="
          w-12 h-12 bg-white rounded-2xl 
          flex items-center justify-center 
          text-blue-600 font-black italic text-2xl 
          shadow-xl rotate-[-3deg]
        ">
          D
        </div>
        <div>
          <p className="text-[10px] font-black text-blue-100/70 uppercase tracking-widest">
            Modo {modo}
          </p>
          <p className="text-base font-black text-white italic leading-tight tracking-tight">
            {userData.nombre}
          </p>
        </div>
      </div>
      
      {/* LADO DERECHO: Acciones y Saldo */}
      <div className="flex items-center gap-2">
         {viajeActivo && (
           <button 
             onClick={() => setVista("en_viaje")} 
             className="bg-green-400 text-white p-2.5 rounded-xl animate-pulse shadow-lg"
           >
             <MapIcon size={20}/>
           </button>
         )}

         {/* Billetera estilizada para que no se pierda en el azul */}
         <div 
           onClick={() => cambiarVista("wallet")} 
           className="
            cursor-pointer bg-slate-950/90 text-white 
            pl-3 pr-4 py-2.5 
            rounded-2xl flex items-center gap-2.5 
            font-black italic text-sm 
            shadow-2xl border border-white/10
            active:scale-95 transition-transform
           "
         >
           <div className="bg-blue-600/30 p-1 rounded-lg">
             <Wallet size={14} className="text-blue-400" /> 
           </div>
           <span>${userData.saldo?.toFixed(2) || "0.00"}</span>
         </div>
      </div>
    </header>
  );
};
