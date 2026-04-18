import React from 'react';
import { 
  ArrowLeft, Car, ShieldCheck, User, Wind, 
  CigaretteOff, Dog, MessageCircle, MessageSquare, Star
} from 'lucide-react';

export const VistaDetalleViaje = ({ viaje, onRegresar, onVerPerfil }) => {
  if (!viaje) return null;

  return (
    /* Eliminamos bordes superiores y fondos oscuros para que fluya con el Header Blanco */
    <div className="bg-slate-50 min-h-full pb-32 animate-in slide-in-from-right duration-300">
      
      {/* 1. BOTÓN REGRESAR MINIMALISTA */}
      <div className="px-4 py-3">
        <button 
          onClick={onRegresar} 
          className="flex items-center gap-2 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] active:scale-95 transition-all"
        >
          <ArrowLeft size={14} /> Volver al Inicio
        </button>
      </div>

      <div className="px-4 space-y-4">
        
        {/* 2. TARJETA DE PRECIO Y RUTA (ESTILO LIMPIO) */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-6 right-8">
            <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div> {viaje.rango || "Novato"}
            </span>
          </div>
          
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo del Viaje</p>
          <h1 className="text-4xl font-black text-blue-600 mb-6 tracking-tighter">
            ${viaje.precio || "10"}
          </h1>
          
          <div className="flex items-center gap-3 text-slate-800 font-black italic uppercase text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 rounded-full flex items-center justify-center p-0.5">
               <div className="w-full h-full bg-blue-600 rounded-full"></div>
            </div>
            {viaje.cO || "VALENCIA"} 
            <span className="text-slate-300 mx-1">→</span> 
            {viaje.cD || "CARACAS"}
          </div>
        </div>

        {/* 3. CONDUCTOR - DISEÑO INTEGRADO (Sin etiquetas de 'Propietario') */}
        <div 
          onClick={() => onVerPerfil && onVerPerfil(viaje.idConductor || viaje.idCreador)}
          className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center justify-between active:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
              {viaje.fotoConductor ? (
                <img src={viaje.fotoConductor} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-slate-300 mt-2" />
              )}
            </div>
            <div>
              <h4 className="font-black italic text-slate-800 uppercase text-base leading-tight">
                {viaje.conductor || "LUIS HERNÁNDEZ"}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[9px] font-bold text-green-500 flex items-center gap-1">
                  <ShieldCheck size={12} fill="currentColor" className="text-white" /> 
                  VERIFICADO
                </p>
                <span className="text-[9px] font-black text-amber-500 flex items-center gap-0.5">
                  <Star size={10} fill="currentColor" /> {viaje.rating || "5.0"}
                </span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            <MessageSquare size={18} />
          </div>
        </div>

        {/* 4. VEHÍCULO */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Car size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehículo</p>
            <h3 className="font-black italic text-slate-800 uppercase text-base leading-tight">
              {viaje.vehiculo || "TOYOTA HILUX"}
            </h3>
            <div className="flex gap-2 mt-1">
              <span className="bg-slate-50 px-2 py-0.5 rounded text-[9px] font-black text-slate-500">{viaje.placa || "ABC-123"}</span>
              <span className="bg-slate-50 px-2 py-0.5 rounded text-[9px] font-black text-slate-500 uppercase">{viaje.color || "NEGRO"}</span>
            </div>
          </div>
        </div>

        {/* 5. PASAJEROS Y PREFERENCIAS (Simplificado) */}
        <div className="grid grid-cols-1 gap-4">
           <div className="bg-white p-5 rounded-[30px] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <User size={12} /> Puestos (0/{viaje.puestos || "1"})
              </p>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                    <User size={14} />
                 </div>
                 <span className="text-[10px] font-bold text-slate-300 italic">Asiento libre...</span>
              </div>
           </div>
        </div>

        {/* 6. BOTÓN DE ACCIÓN FIJO AL FINAL */}
        <div className="pt-4 pb-10">
           <button className="w-full bg-blue-600 text-white py-5 rounded-[25px] font-black italic uppercase text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
             Pedir esta Cola
           </button>
        </div>
      </div>
    </div>
  );
};
