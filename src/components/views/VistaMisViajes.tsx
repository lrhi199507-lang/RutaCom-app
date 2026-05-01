import React, { useState } from 'react';
import { 
  ArrowLeft, Edit2, Trash2, Calendar, Clock, Users, 
  X, CheckCircle, Repeat, ArrowLeftRight, Settings
} from 'lucide-react';

// --- FUNCIONES FORMATEADORAS VISUALES ---
const formatearHora12h = (hora24) => {
  if (!hora24) return "";
  const [horas, minutos] = hora24.split(':');
  const h = parseInt(horas, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutos} ${ampm}`;
};

const formatearFechaCorta = (fechaString) => {
  if (!fechaString) return "";
  const partes = fechaString.split('-');
  if (partes.length !== 3) return fechaString;
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  return fecha.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  }).replace('.', '');
};

// COMPONENTE: Notificación Toast
const ToastNotification = ({ message, show, onClose }) => {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-transform duration-300 transform ${show ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-800 whitespace-nowrap">
        <CheckCircle className="text-blue-500" size={20} />
        <span className="text-sm font-bold uppercase tracking-wider">{message}</span>
      </div>
    </div>
  );
};

// COMPONENTE: Modal para Confirmar Eliminación (Lo mantenemos por si acaso luego lo movemos al detalle)
const ModalConfirmarEliminar = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center">
      <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center">
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">¿Eliminar Viaje?</h3>
        <p className="text-xs font-bold text-slate-400 mb-8">Esta acción no se puede deshacer. Si tienes pasajeros, perderán su reserva.</p>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 bg-rose-600 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-rose-900/50 active:scale-95 transition-all">
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Tarjeta de Viaje - Chofer
const ViajeCardChofer = ({ viaje, onClickGestionar, estadoLabel }) => {
  const pasajerosCount = viaje.pasajeros ? viaje.pasajeros.length : 0;
  const puestosTotales = viaje.asientos || viaje.puestos || 1;
  const esRetorno = viaje.tipoRuta === 'vuelta_de_ruta';

  return (
    <div className={`bg-white p-6 rounded-[30px] border shadow-sm relative space-y-4`}>
      {/* ETIQUETA DE ESTADO */}
      <div className={`absolute top-6 right-6 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${estadoLabel === 'EN CURSO' ? 'bg-green-50 border-green-200 text-green-600' : estadoLabel === 'FINALIZADO' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
          {estadoLabel}
      </div>
      {esRetorno && (
        <div className="absolute top-6 left-6 text-emerald-600 flex items-center gap-1.5">
            <Repeat size={14} className='-rotate-90'/>
            <span className="text-[9px] font-black uppercase tracking-widest">RETORNO</span>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className={esRetorno ? 'mt-6' : ''}>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo ($)</p>
          <p className="text-4xl font-black italic text-blue-600 leading-none">${viaje.precio}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-center">
        <div className='flex-1'>
            <p className="text-[11px] font-bold text-slate-800 uppercase italic">{viaje.cO || viaje.origen?.split(',')[0]}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase">Salida</p>
        </div>
        <ArrowLeftRight className='text-slate-300' size={18}/>
        <div className='flex-1'>
            <p className="text-[11px] font-bold text-slate-800 uppercase italic">{viaje.cD || viaje.destino?.split(',')[0]}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase">Llegada</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-blue-500"/>
          <p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock size={16} className="text-blue-500"/>
          <p className="text-xs font-bold text-slate-700">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p>
        </div>
        <div className="flex items-center gap-2.5 col-span-2">
          <Users size={16} className="text-blue-500"/>
          <p className="text-xs font-bold text-slate-700">{pasajerosCount} / {puestosTotales} Puestos Confirmados</p>
        </div>
      </div>

      {/* BOTÓN MÁGICO PARA ENTRAR A LA SALA DE CONTROL */}
      <button 
        onClick={() => onClickGestionar(viaje)}
        className="w-full mt-4 bg-green-500 text-white rounded-full p-4 font-black uppercase text-xs tracking-[2px] shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <Settings size={16} /> Gestionar Viaje
      </button>
    </div>
  );
};

// COMPONENTE: Tarjeta de Viaje - Pasajero
const ViajeCardPasajero = ({ viaje, tipo, onClickGestionar }) => (
  <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4 relative">
    <div className={`absolute top-6 right-6 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${tipo === 'activo' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
        {tipo === 'activo' ? 'ACTIVO' : 'FINALIZADO'}
    </div>
    
    <div className="flex items-center gap-4 pt-2">
      <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
        {viaje.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <div className='font-black text-slate-400 text-xl'>{viaje.cN?.[0] || 'C'}</div>}
      </div>
      <div>
        <p className="text-base font-black italic text-slate-800 uppercase">{viaje.cN || viaje.conductor}</p>
        <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider">Conductor</p>
      </div>
    </div>

    <div className="flex items-center gap-4 text-center">
      <div className='flex-1'>
          <p className="text-[11px] font-bold text-slate-800 uppercase italic">{viaje.cO || viaje.origen?.split(',')[0]}</p>
          <p className="text-[7px] font-black text-slate-400 uppercase">Recogida</p>
      </div>
      <ArrowLeftRight className='text-slate-300' size={18}/>
      <div className='flex-1'>
          <p className="text-[11px] font-bold text-slate-800 uppercase italic">{viaje.cD || viaje.destino?.split(',')[0]}</p>
          <p className="text-[7px] font-black text-slate-400 uppercase">Destino</p>
      </div>
    </div>

    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between gap-4">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-blue-500"/>
        <p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-blue-500"/>
        <p className="text-xs font-bold text-slate-700">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p>
      </div>
    </div>

     {/* BOTÓN PARA PASAJEROS */}
     {tipo === 'activo' && (
      <button 
          onClick={() => onClickGestionar(viaje)}
          className="w-full mt-4 bg-slate-900 text-white rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          Ver Detalles del Viaje
        </button>
     )}
  </div>
);

export const VistaMisViajes = ({ 
  viajesChofer = [], 
  viajesPasajeroActivos = [], 
  viajesPasajeroHistorial = [], 
  onRegresar, 
  onVerDetalles // <--- NUEVA FUNCIÓN QUE RECIBIREMOS DEL COMPONENTE PRINCIPAL
}) => {
  const [activeTab, setActiveTab] = useState('chofer'); 
  const [viajeAEliminar, setViajeAEliminar] = useState(null); 
  const [toastData, setToastData] = useState({ show: false, message: '' });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <ToastNotification show={toastData.show} message={toastData.message} onClose={() => setToastData({ show: false, message: '' })} />
      
      {/* Modal Eliminación oculto temporalmente, la lógica la pasaremos luego al Detalle */}
      <ModalConfirmarEliminar 
        isOpen={!!viajeAEliminar}
        onClose={() => setViajeAEliminar(null)}
        onConfirm={() => {}} 
      />

      <div className="p-4 pt-8 bg-white">
        <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
          <ArrowLeft size={16} strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
        </button>
      </div>

      <div className="px-5 space-y-6 flex-1 overflow-y-auto pb-32 bg-white">
        
        <div className="bg-slate-100 rounded-full p-1.5 flex relative">
          <div className={`absolute top-1.5 bottom-1.5 bg-blue-600 rounded-full transition-all duration-300 shadow-sm ${activeTab === 'pasajero' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+3px)] w-[calc(50%-6px)]'}`} />
          <button onClick={() => setActiveTab('pasajero')} className={`relative flex-1 p-3.5 rounded-full text-[11px] font-black uppercase tracking-[2px] transition-colors duration-300 ${activeTab === 'pasajero' ? 'text-white' : 'text-slate-500'}`}>
            Como Pasajero
          </button>
          <button onClick={() => setActiveTab('chofer')} className={`relative flex-1 p-3.5 rounded-full text-[11px] font-black uppercase tracking-[2px] transition-colors duration-300 ${activeTab === 'chofer' ? 'text-white' : 'text-slate-500'}`}>
            Como Chofer
          </button>
        </div>

        <div className="space-y-10 pt-4">
          {activeTab === 'pasajero' ? (
            <div className="space-y-10">
                <div className="space-y-6">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">Viajes Activos</p>
                    
                    {viajesPasajeroActivos.length === 0 ? (
                        <div className='border border-slate-100 rounded-[30px] p-10 text-center bg-slate-50'>
                            <p className='text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose'>Aún no tienes colas reservadas</p>
                        </div>
                    ) : (
                      viajesPasajeroActivos.map(viaje => (
                        <ViajeCardPasajero 
                          key={viaje.id} 
                          viaje={viaje} 
                          tipo="activo" 
                          onClickGestionar={onVerDetalles} // Pasajero ve detalles
                        />
                      ))
                    )}
                </div>

                {viajesPasajeroHistorial.length > 0 && (
                  <div className="space-y-6">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">Historial de Rutas</p>
                      {viajesPasajeroHistorial.map(viaje => (
                          <ViajeCardPasajero key={viaje.id} viaje={viaje} tipo="finalizado" />
                      ))}
                  </div>
                )}
            </div>
                    ) : (
            <div className="space-y-10">
                {/* 1. SECCIÓN DE VIAJES ACTIVOS / PUBLICADOS */}
                <div className="space-y-6">
                    <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest px-1">Mis Publicaciones Activas</p>
                    
                    {viajesChofer.filter(v => v.estado !== 'finalizado').length === 0 ? (
                        <div className='border border-slate-100 rounded-[30px] p-10 text-center bg-slate-50'>
                            <p className='text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose'>No tienes viajes activos.</p>
                        </div>
                    ) : (
                      viajesChofer.filter(v => v.estado !== 'finalizado').map(viaje => (
                        <ViajeCardChofer 
                            key={viaje.id} 
                            viaje={viaje} 
                            onClickGestionar={onVerDetalles} 
                            estadoLabel={viaje.estado === 'en_curso' ? 'EN CURSO' : 'DISPONIBLE'}
                        />
                      ))
                    )}
                </div>

                {/* 2. SECCIÓN DE HISTORIAL PARA EL CHOFER */}
                {viajesChofer.filter(v => v.estado === 'finalizado').length > 0 && (
                  <div className="space-y-6 opacity-70">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">Historial de Viajes Finalizados</p>
                      {viajesChofer.filter(v => v.estado === 'finalizado').map(viaje => (
                        <ViajeCardChofer 
                            key={viaje.id} 
                            viaje={viaje} 
                            onClickGestionar={onVerDetalles} 
                            estadoLabel="FINALIZADO"
                        />
                      ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
