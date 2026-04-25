import React from 'react';
import { MapPin, Navigation, Clock, Users, Star, Car, ChevronRight, User, ShieldCheck, Repeat } from 'lucide-react';

export const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir }) => {
  if (!viaje) return null;

  const esUltimoPuesto = (viaje.asientos || viaje.puestos) === 1;
  const esRutaCompleta = viaje.tipoRuta === "ida_y_vuelta";

  // FUNCIÓN AUXILIAR PARA EVITAR EL ERROR DEL SPLIT
  const formatearLugar = (texto, index) => {
    if (!texto || typeof texto !== 'string') return index === 0 ? "No especificado" : "";
    const partes = texto.split(',');
    return partes[index] ? partes[index].trim() : "";
  };

  // FORZAR FECHA LOCAL PARA EVITAR DESFASE UTC (-1 DÍA)
  const formatearFechaLocal = (fechaString) => {
    if (!fechaString) return "Hoy";
    const [year, month, day] = fechaString.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('es-ES', { 
      weekday: 'short', day: 'numeric', month: 'short' 
    });
  };

  return (
    <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4 hover:border-blue-100 transition-all relative overflow-hidden">
      
      {/* ETIQUETA DE RUTA CON RETORNO */}
      {esRutaCompleta && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-2xl flex items-center gap-1.5 shadow-sm">
          <Repeat size={10} className="animate-pulse" />
          <span className="text-[8px] font-black uppercase italic tracking-wider">Ruta con Retorno</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-slate-100 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-300">
            {viaje.fotoPerfil ? ( 
              <img src={viaje.fotoPerfil} className="w-full h-full object-cover" alt="Perfil" /> 
            ) : ( <User size={20} /> )}
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
        <div className={`text-right ${esRutaCompleta ? 'mt-6' : ''}`}>
  {/* PRECIO */}
  <p className="text-2xl font-black italic text-blue-600 leading-none">
    ${viaje.precio || "0"}
  </p>
  
  {/* INDICADOR LINEAL Y DELICADO */}
  {(viaje.asientos <= 2 || viaje.puestos <= 2) && (
    <div className="mt-1 flex justify-end">
      <span className="animate-pulse bg-amber-500 text-white text-[7px] font-black uppercase italic px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
        <span className="relative flex h-1 w-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1 w-1 bg-white"></span>
        </span>
        {(viaje.asientos === 1 || viaje.puestos === 1) ? 'Último Puesto!' : 'Últimos Puestos'}
      </span>
    </div>
  )}
</div>
      </div>

      {/* RUTA SEGURA */}
      <div className="flex items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-blue-200 flex items-center justify-center bg-white shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">
              {formatearLugar(viaje.origen || viaje.cO, 0)}
            </p>
            <p className="text-[9px] font-bold text-slate-400 truncate uppercase">
              {formatearLugar(viaje.origen || viaje.cO, 1) || viaje.eO || "Ver mapa"}
            </p>
          </div>
        </div>
        
        <ChevronRight size={18} className="text-slate-300 shrink-0"/>

        <div className="flex-1 min-w-0 flex items-center justify-end gap-2 text-right">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">
              {formatearLugar(viaje.destino || viaje.cD, 0)}
            </p>
            <p className="text-[9px] font-bold text-slate-400 truncate uppercase">
              {formatearLugar(viaje.destino || viaje.cD, 1) || viaje.eD || "Ver mapa"}
            </p>
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
  <p className="text-[10px] font-bold truncate flex items-center gap-1">
    Salida: 
    <span className='font-black'>
      {viaje.hora ? new Date(`2000-01-01T${viaje.hora}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }) : "--:--"}
    </span>
    <span className="text-[12px]">
      {viaje.hora && (parseInt(viaje.hora.split(':')[0]) >= 6 && parseInt(viaje.hora.split(':')[0]) < 18 ? '☀️' : '🌙')}
    </span>
  </p>
</div>
        
          
        <div className="flex items-center gap-2 text-slate-500">
          <Users size={14} />
          <p className="text-[10px] font-bold">Puestos: <span className='font-black'>{viaje.asientos || viaje.puestos || "0"}</span></p>
        </div>
        
        <div className="flex items-center gap-2 text-slate-500 col-span-2 border-t border-slate-50 pt-2">
  <Clock size={14} className="text-blue-400" /> <p className="text-[10px] font-bold"> Fecha: <span className='font-black'>{viaje.fecha ? formatearFechaLocal(viaje.fecha) : "Hoy"}</span></p>
</div>  
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 pt-2">
        <button onClick={onClickDetalle} className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition-all">
          Ver Detalles
        </button>
        <button onClick={onClickPedir} disabled={esUltimoPuesto} className="flex-1 py-3.5 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition-all">
          Pedir Cola
        </button>
      </div>
    </div>
  );
};

const obtenerNivel = (viajes) => {
  if (!viajes || viajes < 10) return "Novato";
  if (viajes < 50) return "Bronce";
  if (viajes < 100) return "Plata";
  return "Oro";
};
