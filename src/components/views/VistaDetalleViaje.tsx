import React from 'react';
import PerfilPublico from './PerfilPublico';
import { 
  ArrowLeft, MapPin, User, ShieldCheck, 
  MessageCircle, Repeat, ChevronRight 
} from 'lucide-react';

// IMPORTACIÓN DESDE TU ARCHIVO DE CONSTANTES
import { UBICACIONES } from "../../constants/ubicaciones";


// FUNCIÓN PARA DETECTAR EL ESTADO AUTOMÁTICAMENTE
const obtenerEstado = (ciudadNombre) => {
  if (!ciudadNombre) return "Estado";
  const estadoEncontrado = Object.keys(UBICACIONES).find(estado => 
    UBICACIONES[estado].includes(ciudadNombre)
  );
  return estadoEncontrado || "Venezuela";
};

export const VistaDetalleViaje = ({ viaje, onRegresar, userData }) => {
  if (!viaje) return null;

  const [verPerfil, setVerPerfil] = React.useState(false);

  // Lógica para contar pasajeros reales
  const pasajerosCount = viaje.pasajerosConfirmados ? viaje.pasajerosConfirmados.length : 0;
  const puestosTotales = viaje.asientos || viaje.puestos || 1;

  // Función para formatear hora a 12h (AM/PM)
  const formatearHora12h = (hora24) => {
    if (!hora24) return "00:00";
    const [horas, minutos] = hora24.split(':');
    const h = parseInt(horas);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutos} ${ampm}`;
  };

  // Función para formatear fecha (Vie, 24 Abr)
  const formatearFechaLimpia = (fechaString) => {
    if (!fechaString) return "";
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).replace('.', ''); 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-60">
        
        {/* BOTÓN VOLVER */}
        <div className="p-4 pt-6">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
        </div>

        <div className="px-5 space-y-4">
          
          {/* TARJETA DE PRECIO Y RUTA ACTUALIZADA */}
          <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Total</p>
                <div className="flex items-start">
                  <span className="text-xl font-black italic text-blue-600 mt-1">$</span>
                  <span className="text-5xl font-black italic text-blue-600 leading-none">
                    {viaje.precio || "0"}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase italic text-blue-600">Verificado</span>
              </div>
            </div>

            {/* PUNTO DE ENCUENTRO / REFERENCIA */}
{viaje.referencia && (
  <div className="bg-blue-50/50 p-5 rounded-[30px] border border-blue-100/50">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
        <MapPin size={14} className="text-blue-600" />
      </div>
      <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest italic">
        Punto de encuentro
      </p>
    </div>
    <p className="text-[11px] font-bold text-slate-600 leading-relaxed pl-1">
      "{viaje.referencia}"
    </p>
  </div>
)}
            

            {/* RUTA DINÁMICA CON DETECCIÓN AUTOMÁTICA */}
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>
                <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">
                  {viaje.cO || "Origen"}
                </p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">
                  {obtenerEstado(viaje.cO)}
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center px-2">
                <div className="w-full h-[2px] bg-slate-100 rounded-full relative flex items-center">
                  <div className="absolute left-0 h-full bg-blue-600 rounded-full w-[100%]" />
                </div>
                <div className="mt-2 bg-slate-50 px-3 py-0.5 rounded-md border border-slate-100">
                  <span className="text-[7px] font-black text-slate-400 uppercase italic tracking-widest">Ruta</span>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-200">
                  <MapPin size={16} className="text-slate-300" />
                </div>
                <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">
                  {viaje.cD || "Destino"}
                </p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">
                  {obtenerEstado(viaje.cD)}
                </p>
              </div>
            </div>

            {/* INFO DE RETORNO: SOLO SI ES EL VIAJE DE IDA Y TIENE REGRESO */}
{(viaje.publicarRegreso && viaje.tipoRuta === "ida_y_vuelta") && (
  <div className="bg-green-50 p-3 rounded-2xl flex items-center gap-3 border border-green-100 animate-in fade-in">
    <Repeat size={16} className="text-green-600" />
    <div>
      <p className="text-[8px] font-black text-green-700 uppercase italic">
        Con Retorno Programado
      </p>
      <p className="text-[10px] font-bold text-green-600">
        Regresa el <span className="capitalize">{formatearFechaLimpia(viaje.fechaRegreso)}</span> a las {formatearHora12h(viaje.horaRegreso)}
      </p>
    </div>
  </div>
)}
          </div>

          {/* CONDUCTOR */}
          <div onClick={() => setVerPerfil(true)} className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
              {viaje.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-3 text-slate-300"/>}
            </div>
            <div className="flex-1">
              <p className="text-base font-black italic text-slate-700 uppercase">{viaje.cN || viaje.conductor}</p>
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck size={12} className="text-blue-500" />
                <p className="text-[8px] font-black text-blue-600 uppercase">Perfil Verificado</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>

          {/* PASAJEROS REALES */}
          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4">
            <p className="text-[9px] font-black italic text-slate-400 uppercase tracking-widest text-center">
              Puestos Confirmados ({pasajerosCount}/{puestosTotales})
            </p>
            {viaje.pasajerosConfirmados?.map((pasajero, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <img src={pasajero.foto} className="w-8 h-8 rounded-full border border-white" />
                <p className="text-[10px] font-black text-blue-800 uppercase italic">{pasajero.nombre}</p>
              </div>
            ))}
            {pasajerosCount < puestosTotales && (
              <div className="border border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-3 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200">
                  <User size={14} />
                </div>
                <p className="text-[9px] font-black italic text-slate-300 uppercase">Asiento Disponible</p>
              </div>
            )}
          </div>

          {/* PREFERENCIAS Y EQUIPAJE */}
          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4">
            <p className="text-[9px] font-black italic text-slate-800 uppercase tracking-widest leading-none">Preferencias del viaje</p>
            <div className="grid grid-cols-2 gap-2">
              {viaje.preferencias?.ac && (
                <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-2 border border-blue-100">
                  <span className="text-lg">❄️</span>
                  <span className="text-[8px] font-black italic text-blue-900 uppercase">Aire Acond.</span>
                </div>
              )}
              {viaje.preferencias?.noFumar && (
                <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2 border border-slate-100">
                  <span className="text-lg">🚭</span>
                  <span className="text-[8px] font-black italic text-slate-600 uppercase">Sin Humo</span>
                </div>
              )}
              {viaje.preferencias?.mascotas && (
                <div className="bg-amber-50 p-3 rounded-xl flex items-center gap-2 border border-amber-100">
                  <span className="text-lg">🐾</span>
                  <span className="text-[8px] font-black italic text-amber-900 uppercase">Mascotas</span>
                </div>
              )}
            </div>

            <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
               <span className="text-3xl">
                 {viaje.equipaje === 'ligero' ? '🎒' : viaje.equipaje === 'medio' ? '🧳' : '📦'}
               </span>
               <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase">Equipaje Permitido</p>
                 <p className="text-[10px] font-black text-slate-700 uppercase italic">
                   {viaje.equipaje === 'ligero' ? 'Bolso Ligero' : viaje.equipaje === 'medio' ? 'Maleta Mediana' : 'Carga Pesada'}
                 </p>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTONES FIJOS */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-[60] max-w-md mx-auto">
        <div className="flex gap-3 h-14">
          <button className="flex-1 bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
            <MessageCircle size={16} /> Chat
          </button>
          <button className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            Reservar Cola
          </button>
        </div>
      </div>

      {verPerfil && (
        <PerfilPublico 
          conductor={{
            nombre: viaje.cN || viaje.conductor,
            fotoPerfil: viaje.fotoPerfil,
            bio: viaje.bioConductor,
            hablador: viaje.prefHablador,
            musica: viaje.prefMusica
          }} 
          onClose={() => setVerPerfil(false)} 
        />
      )}
    </div>
  );
};
            
