import React from 'react';
import { MapPin, Navigation, Clock, Users, Star, Car, Wind, Smoking, ChevronRight, User, ShieldCheck, Repeat } from 'lucide-react'; // Agregamos Repeat

export const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir }) => {
  if (!viaje) return null;

  const esUltimoPuesto = viaje.puestos === 1;
  const esRutaCompleta = viaje.tipoRuta === "ida_y_vuelta"; // Detectamos si tiene regreso

  return (
    <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4 hover:border-blue-100 transition-all relative overflow-hidden">
      
      {/* ETIQUETA DE RUTA COMPLETA (Solo si aplica) */}
      {esRutaCompleta && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-2xl flex items-center gap-1.5 shadow-sm">
          <Repeat size={10} className="animate-pulse" />
          <span className="text-[8px] font-black uppercase italic tracking-wider">Ruta con Retorno</span>
        </div>
      )}

      {/* HEADER DE LA TARJETA */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-slate-100 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-300">
            {viaje.fotoPerfil ? ( 
              <img 
                src={viaje.fotoPerfil} 
                className="w-full h-full object-cover" 
                alt="Perfil" 
              /> 
            ) : ( 
              <User size={20} />
            )}
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
        <div className={`text-right ${esRutaCompleta ? 'mt-6' : ''}`}> {/* Bajamos el precio si hay etiqueta */}
          <p className="text-2xl font-black italic text-blue-600 leading-none">${viaje.precio || "0"}</p>
          {esUltimoPuesto && (
            <span className="text-[8px] font-black uppercase italic text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              ¡Último puesto!
            </span>
          )}
        </div>
      </div>

      {/* DETALLES DE LA RUTA */}
      <div className="flex items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-blue-200 flex items-center justify-center bg-white shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
          <div className="min-w-0">
            {/* Cambié viaje.cO por viaje.origen si es que así lo guardamos, 
                pero si usas cO mantenlo así */}
            <p className="text-sm font-black text-slate-800 truncate">{viaje.origen?.split(',')[0] || viaje.cO}</p>
            <p className="text-[9px] font-bold text-slate-400 truncate uppercase">{viaje.origen?.split(',')[1] || viaje.eO}</p>
          </div>
        </div>
        
        <ChevronRight size={18} className="text-slate-300 shrink-0"/>

        <div className="flex-1 min-w-0 flex items-center justify-end gap-2 text-right">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">{viaje.destino?.split(',')[0] || viaje.cD}</p>
            <p className="text-[9px] font-bold text-slate-400 truncate uppercase">{viaje.destino?.split(',')[1] || viaje.eD}</p>
          </div>
          <div className="w-7 h-7 rounded-full border border-green-200 flex items-center justify-center bg-white shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* INFO ADICIONAL */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={14} />
          <p className="text-[10px] font-bold">Salida: <span className='font-black'>{viaje.hora || viaje.horaSalida}</span></p>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Users size={14} />
          <p className="text-[10px] font-bold">Puestos: <span className='font-black'>{viaje.asientos || viaje.puestos} Libres</span></p>
        </div>
        
        {/* FECHA DEL VIAJE (¡Importante ahora que la tenemos!) */}
        <div className="flex items-center gap-2 text-slate-500 col-span-2">
          <Clock size={14} className="text-blue-400" />
          <p className="text-[10px] font-bold">Fecha: <span className='font-black'>{viaje.fecha || "Hoy"}</span></p>
        </div>

        {viaje.vehiculoInfo && (
          <div className="flex items-center gap-2 text-slate-500 col-span-2">
            <Car size={14} />
            <p className="text-[10px] font-bold uppercase truncate">
              <span className='font-black'>{viaje.vehiculoInfo.marca} {viaje.vehiculoInfo.modelo}</span> | <span className='font-black'>{viaje.vehiculoInfo.color}</span>
            </p>
          </div>
        )}
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex gap-3 pt-2">
        <button 
          onClick={onClickDetalle} 
          className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition-all"
        >
          Ver Detalles
        </button>
        <button 
          onClick={onClickPedir} 
          disabled={esUltimoPuesto}
          className="flex-1 py-3.5 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition-all"
        >
          Pedir Cola
        </button>
      </div>
    </div>
  );
};

const obtenerNivel = (viajes) => {
  if (!viajes) return "Novato";
  if (viajes < 10) return "Novato";
  if (viajes < 50) return "Bronce";
  if (viajes < 100) return "Plata";
  return "Oro";
};
        
