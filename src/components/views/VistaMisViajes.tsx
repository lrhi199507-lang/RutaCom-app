import React, { useState } from 'react';
import { 
  ArrowLeft, Edit2, Trash2, Calendar, Clock, Users, 
  X, CheckCircle, Repeat, ArrowLeftRight 
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
  }).replace('.', ''); // Ejemplo: "mié, 29 abr"
};
// ----------------------------------------

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
      {/* Se agregó whitespace-nowrap y se ajustó el padding (px-5 py-3) para que sea lineal y elegante */}
      <div className="bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-800 whitespace-nowrap">
        <CheckCircle className="text-blue-500" size={20} />
        <span className="text-sm font-bold uppercase tracking-wider">{message}</span>
      </div>
    </div>
  );
};

// COMPONENTE: Modal para Editar Viaje
const ModalEditarViaje = ({ viaje, isOpen, onClose, onSave }) => {
  const fechaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.fechaSalida || viaje.fecha) : (viaje.fecha || viaje.fechaSalida);
  const horaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.horaSalida || viaje.hora) : (viaje.hora || viaje.horaSalida);

  const [formData, setFormData] = useState({
    fechaForm: fechaActual || '',
    horaForm: horaActual || '',
    precio: viaje.precio || '',
    asientos: viaje.asientos || viaje.puestos || ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'precio' || name === 'asientos' ? parseInt(value) || '' : value 
    }));
  };

  const handleGuardar = () => {
    onSave({
      id: viaje.id,
      tipoRuta: viaje.tipoRuta,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center">
      <div className="bg-[#0f172a] w-full max-w-md rounded-[35px] shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <h3 className="text-center text-xs font-black text-blue-500 uppercase tracking-[4px] mb-8">Editar Mi Viaje</h3>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label>
              <input type="date" name="fechaForm" value={formData.fechaForm} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hora</label>
              <input type="time" name="horaForm" value={formData.horaForm} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo ($)</label>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Puestos Libres</label>
              <input type="number" name="asientos" value={formData.asientos} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          
          <button onClick={handleGuardar} className="w-full bg-blue-600 text-white rounded-full p-4 font-black uppercase text-xs tracking-[3px] shadow-lg shadow-blue-900/50 active:scale-95 transition-all mt-4">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Tarjeta de Viaje - Chofer
const ViajeCardChofer = ({ viaje, onEdit, onDelete }) => {
  const pasajerosCount = viaje.pasajerosConfirmados ? viaje.pasajerosConfirmados.length : 0;
  const puestosTotales = viaje.asientos || viaje.puestos || 1;
  const esRetorno = viaje.tipoRuta === 'vuelta_de_ruta';

  return (
    <div className={`bg-white p-6 rounded-[30px] border shadow-sm ${esRetorno ? 'border-dashed border-emerald-200 bg-emerald-50/10' : 'border-slate-100'} relative space-y-4`}>
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
        <div className="flex gap-2.5">
          <button onClick={onEdit} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-500 hover:bg-rose-100 transition-colors">
            <Trash2 size={16} />
          </button>
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
          {/* Aquí aplicamos el formateo de fecha */}
          <p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock size={16} className="text-blue-500"/>
          {/* Aquí aplicamos el formateo de hora */}
          <p className="text-xs font-bold text-slate-700">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p>
        </div>
        <div className="flex items-center gap-2.5 col-span-2">
          <Users size={16} className="text-blue-500"/>
          <p className="text-xs font-bold text-slate-700">{pasajerosCount} / {puestosTotales} Puestos Confirmados</p>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE: Tarjeta de Viaje - Pasajero
const ViajeCardPasajero = ({ viaje, tipo }) => (
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
        {/* Aquí aplicamos el formateo de fecha */}
        <p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-blue-500"/>
        {/* Aquí aplicamos el formateo de hora */}
        <p className="text-xs font-bold text-slate-700">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p>
      </div>
    </div>
  </div>
);

// COMPONENTE PRINCIPAL (VISTA MIS VIAJES)
export const VistaMisViajes = ({ 
  viajesChofer = [], 
  viajesPasajeroActivos = [], 
  viajesPasajeroHistorial = [], 
  onRegresar, 
  onActualizarViajeFBD,
  onEliminarViajeFBD
}) => {
  const [activeTab, setActiveTab] = useState('chofer'); 
  const [editingViaje, setEditingViaje] = useState(null);
  const [toastData, setToastData] = useState({ show: false, message: '' });

    const handleEditSave = async (updatedViaje) => {
    try {
      if(onActualizarViajeFBD) {
        await onActualizarViajeFBD(updatedViaje);
      }
      setEditingViaje(null);
      // Texto conciso como pediste
      setToastData({ show: true, message: 'Guardado con éxito' }); 
    } catch (error) {
      setToastData({ show: true, message: 'Error al guardar' });
    }
  };
  

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <ToastNotification show={toastData.show} message={toastData.message} onClose={() => setToastData({ show: false, message: '' })} />
      
      {editingViaje && (
        <ModalEditarViaje 
          viaje={editingViaje} 
          isOpen={true} 
          onClose={() => setEditingViaje(null)} 
          onSave={handleEditSave}
        />
      )}

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
                        <ViajeCardPasajero key={viaje.id} viaje={viaje} tipo="activo" />
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
            <div className="space-y-6">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">Mis Publicaciones</p>
                
                {viajesChofer.length === 0 ? (
                    <div className='border border-slate-100 rounded-[30px] p-10 text-center bg-slate-50'>
                        <p className='text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose'>Aún no has publicado viajes.<br/>Tus publicaciones reales aparecerán aquí.</p>
                    </div>
                ) : (
                  viajesChofer.map(viaje => (
                    <ViajeCardChofer 
                        key={viaje.id} 
                        viaje={viaje} 
                        onEdit={() => setEditingViaje(viaje)}
                        onDelete={() => onEliminarViajeFBD && onEliminarViajeFBD(viaje.id)}
                    />
                  ))
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
