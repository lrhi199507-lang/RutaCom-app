import React from 'react';
import PerfilPublico from './PerfilPublico';
import Toast from "../ui/Toast";
import { 
  ArrowLeft, MapPin, User, ShieldCheck, 
  MessageCircle, Repeat, ChevronRight, Snowflake, CigaretteOff, Dog 
} from 'lucide-react';
import { UBICACIONES } from "../../constants/ubicaciones";

const obtenerEstado = (ciudadNombre) => {
  if (!ciudadNombre) return "Estado";
  const [soloCiudad] = ciudadNombre.split(',');
  const estadoEncontrado = Object.keys(UBICACIONES).find(estado => 
    UBICACIONES[estado].includes(soloCiudad.trim())
  );
  return estadoEncontrado || "Venezuela";
};

const formatearFechaHoraRetorno = (fechaString, horaString) => {
  if (!fechaString) return "";
  const partesFecha = fechaString.split('-');
  if (partesFecha.length !== 3) return fechaString;
  const fecha = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
  
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  }).replace('.', '').replace(/^\w/, (c) => c.toUpperCase()); 

  if (!horaString) return fechaFormateada;
  const [horas, minutos] = horaString.split(':');
  const h = parseInt(horas);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${fechaFormateada} a las ${h12}:${minutos} ${ampm}`;
};

const obtenerIconoEquipaje = (tipo) => {
  switch(tipo?.toLowerCase()) {
    case 'maleta': return '🧳';
    case 'caja': return '📦';
    case 'bolso':
    case 'bolso ligero':
    default: return '🎒';
  }
};

export const VistaDetalleViaje = ({ viaje, onRegresar, userData }) => {
  if (!viaje) return null;
  const [verPerfil, setVerPerfil] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const pasajerosCount = viaje.pasajerosConfirmados ? viaje.pasajerosConfirmados.length : 0;
  const puestosTotales = viaje.asientos || viaje.puestos || 1;

  // Lógica estricta leyendo desde tu BD
  const mostrarBannerRetorno = viaje.publicarRegreso && viaje.tipoRuta !== 'vuelta_de_ruta';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative font-sans">
      <div className="flex-1 overflow-y-auto pb-40">
        <div className="p-4 pt-6">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
        </div>

        <div className="px-5 space-y-4">
          
          {/* TARJETA PRINCIPAL */}
          <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Total</p>
                <div className="flex items-start text-blue-600">
                  <span className="text-xl font-black italic mt-1">$</span>
                  <span className="text-5xl font-black italic leading-none">{viaje.precio || "0"}</span>
                </div>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase italic text-blue-600">Verificado</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>
                <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">{viaje.cO}</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje.cO)}</p>
              </div>
              <div className="flex-1 px-2"><div className="w-full h-[2px] bg-blue-600 rounded-full" /></div>
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-200">
                  <MapPin size={16} className="text-slate-300" />
                </div>
                <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">{viaje.cD}</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje.cD)}</p>
              </div>
            </div>

            {viaje.referencia && (
              <div className="bg-blue-50/50 p-5 rounded-[30px] border border-blue-100/50">
                <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest italic mb-1">Punto de encuentro</p>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">"{viaje.referencia}"</p>
              </div>
            )}
          </div>

          {/* BANNER RETORNO PROGRAMADO */}
          {mostrarBannerRetorno && (
            <div className="bg-emerald-50 p-5 rounded-[30px] border border-emerald-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Repeat size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">CON RETORNO PROGRAMADO</p>
                <p className="text-sm font-bold text-emerald-900 mt-1">
                  Regresa el {formatearFechaHoraRetorno(viaje.fechaRegreso || viaje.fechaRetorno, viaje.horaRegreso || viaje.horaRetorno)}
                </p>
              </div>
            </div>
          )}

          {/* PERFIL CONDUCTOR */}
          <div onClick={() => setVerPerfil(true)} className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-4 active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
              {viaje.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-3 text-slate-300"/>}
            </div>
            <div className="flex-1">
              <p className="text-base font-black italic text-slate-700 uppercase">{viaje.cN || viaje.conductor}</p>
              <p className="text-[8px] font-black text-blue-600 uppercase">Perfil Verificado</p>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>

          {/* PUESTOS CONFIRMADOS */}
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-6">
            <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
              PUESTOS CONFIRMADOS ({pasajerosCount}/{puestosTotales})
            </p>
            
            <div className="space-y-3">
              {viaje.pasajerosConfirmados && viaje.pasajerosConfirmados.map((pasajero, index) => (
                  <div key={index} className="border border-slate-100 p-4 rounded-[25px] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                          {pasajero.fotoPerfil ? <img src={pasajero.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-300" />}
                      </div>
                      <p className="text-xs font-bold text-slate-700 uppercase">{pasajero.nombre || 'Pasajero Confirmado'}</p>
                  </div>
              ))}
              
              {[...Array(Math.max(0, puestosTotales - pasajerosCount))].map((_, index) => (
                <div key={`empty-${index}`} className="border border-slate-100 p-4 rounded-[25px] flex items-center gap-4 bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                    <User size={18} className="text-slate-300" />
                  </div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ASIENTO DISPONIBLE</p>
                </div>
              ))}
            </div>
          </div>

          {/* PREFERENCIAS DEL VIAJE */}
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PREFERENCIAS DEL VIAJE</p>
            
            <div className="grid grid-cols-2 gap-3">
              {viaje.preferencias?.ac && (
                <div className="bg-blue-50/70 p-4 rounded-[20px] flex items-center gap-3 border border-blue-100/50">
                  <Snowflake size={18} className="text-blue-500" />
                  <p className="text-[9px] font-black text-blue-700 uppercase tracking-wide">Aire a.</p>
                </div>
              )}
              {viaje.preferencias?.noFumar && (
                <div className="bg-rose-50/70 p-4 rounded-[20px] flex items-center gap-3 border border-rose-100/50">
                  <CigaretteOff size={18} className="text-rose-500" />
                  <p className="text-[9px] font-black text-rose-700 uppercase tracking-wide">Sin humo</p>
                </div>
              )}
              {viaje.preferencias?.mascotas && (
                <div className="bg-amber-50/70 p-4 rounded-[20px] flex items-center gap-3 border border-amber-100/50">
                  <Dog size={18} className="text-amber-600" />
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-wide">Mascotas</p>
                </div>
              )}
              
              <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 border border-slate-100">
                <span className="text-xl">{obtenerIconoEquipaje(viaje.tipoEquipaje)}</span>
                <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Equipaje permitido</p>
                    <p className="text-[10px] font-black text-slate-700 uppercase mt-0.5">{viaje.tipoEquipaje || "Bolso Ligero"}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BARRA INFERIOR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/90 backdrop-blur-md border-t border-slate-100 z-[60] max-w-md mx-auto">
        <div className="flex gap-3 h-14">
          <button className="flex-1 bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <MessageCircle size={16} /> Chat
          </button>
          <button className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
            Reservar Cola
          </button>
        </div>
      </div>

      {verPerfil && (
        <PerfilPublico 
          conductor={{ ...viaje, identidadVerificada: true }} 
          onClose={() => setVerPerfil(false)} 
          setToastMessage={setToastMessage}
          setShowToast={setShowToast}
        />
      )}
      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    </div>
  );
};
                
