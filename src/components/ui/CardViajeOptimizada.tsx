import React from 'react';
import { MapPin, Navigation, Clock, Users, Star, Car, Wind, Smoking, ChevronRight } from 'lucide-react';

export const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir }) => {
  if (!viaje) return null;

  const esUltimoPuesto = viaje.puestos === 1;

  return (
    <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4 hover:border-blue-100 transition-all">
      
      {/* HEADER DE LA TARJETA (Nombre, Rating, Precio) */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black italic uppercase text-slate-800 flex items-center gap-1.5 tracking-tight">
              {viaje.conductor || "Conductor"} 
              <ShieldCheck size={14} className="text-green-500"/>
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star size={12} fill="currentColor"/>
                <span className="text-[10px] font-black italic">{viaje.rating || "5.0"}</span>
              </div>
              <span className="text-[9px] font-bold uppercase italic text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {obtenerNivel(viaje.viajesTotales)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black italic text-blue-600 leading-none">${viaje.precio || "0"}</p>
          {esUltimoPuesto && (
            <span className="text-[8px] font-black uppercase italic text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              ¡Último puesto!
            </span>
          )}
        </div>
      </div>

      {/* DETALLES DE LA RUTA (El punto azul y rojo con la LÍNEA UNIFICADORA) */}
      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
        
        {/* LA LÍNEA UNIFICADORA (Vertical punteada) */}
        <div className="absolute left-[29.5px] top-[26px] bottom-[26px] w-[1px] border-l-2 border-dashed border-slate-200"></div>

        {/* ORIGEN */}
        <div className="w-8 h-8 rounded-full border border-blue-100 flex items-center justify-center bg-white shrink-0 z-10">
          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[8px] font-black uppercase text-slate-400 leading-none">ORIGEN</p>
          <p className="text-xs font-bold text-slate-700 truncate">{viaje.cO || viaje.origen || "Valencia"}, {viaje.eO || "Carabobo"}</p>
        </div>
        
        {/* FLECHA INTERMEDIA (Opcional, para más claridad) */}
        <ChevronRight size={16} className="text-slate-300 mx-1 shrink-0"/>

        {/* DESTINO */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[8px] font-black uppercase text-slate-400 leading-none">DESTINO</p>
          <p className="text-xs font-bold text-slate-700 truncate">{viaje.cD || viaje.destino || "Caracas"}, {viaje.eD || "Dtto. Capital"}</p>
        </div>
        <div className="w-8 h-8 rounded-full border border-green-100 flex items-center justify-center bg-white shrink-0 z-10">
          <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
        </div>
      </div>

      {/* INFO ADICIONAL (Salida, Puestos, Vehículo, Preferencias) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={14} />
          <p className="text-[10px] font-bold">Salida: <span className='font-black'>{viaje.horaSalida || "22:20"}</span></p>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Users size={14} />
          <p className="text-[10px] font-bold">Puestos: <span className='font-black'>{viaje.puestos || "3 Libres"}</span></p>
        </div>
        {viaje.vehiculoInfo && (
          <div className="flex items-center gap-2 text-slate-500 col-span-2">
            <Car size={14} />
            <p className="text-[10px] font-bold uppercase truncate">
              <span className='font-black'>{viaje.vehiculoInfo.marca} {viaje.vehiculoInfo.modelo}</span> | Placa: <span className='font-black'>{viaje.vehiculoInfo.placa}</span> | Color: <span className='font-black'>{viaje.vehiculoInfo.color}</span>
            </p>
          </div>
        )}
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex gap-3 pt-2">
        <button 
          onClick={onClickDetalle} 
          className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
        >
          Ver Detalles
        </button>
        <button 
          onClick={onClickPedir} 
          disabled={esUltimoPuesto}
          className="flex-1 py-3.5 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          Pedir Cola
        </button>
      </div>
    </div>
  );
};

// HELPER LOCAL (Para el nivel)
const obtenerNivel = (viajes) => {
  if (!viajes) return "Novato";
  if (viajes < 10) return "Novato";
  if (viajes < 50) return "Bronce";
  if (viajes < 100) return "Plata";
  return "Oro";
};
