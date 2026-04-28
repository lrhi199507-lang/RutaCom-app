import React, { useState } from 'react';
// Asumiendo que usas lucide-react para los iconos
import { 
  ArrowLeft, MapPin, Edit2, Trash2, Calendar, Clock, DollarSign, Users, 
  X, CheckCircle, Repeat, ArrowLeftRight 
} from 'lucide-react';

// --- DATOS DE EJEMPLO (MOCKS) - Borrar cuando integres Firebase ---
const sampleViajesChofer = [
  { id: 'c1_ida', type: 'ida', o: 'Guacara', d: 'Valencia', fecha: '2023-11-20', hora: '08:00', precio: 10, asientos: 4, pasajeros: 2, linkedReturnId: 'c1_ret' },
  { id: 'c1_ret', type: 'retorno', o: 'Valencia', d: 'Guacara', fecha: '2023-11-20', hora: '17:00', precio: 10, asientos: 4, pasajeros: 1, linkedTripId: 'c1_ida' },
  { id: 'c2', type: 'ida', o: 'San Diego', d: 'Valencia', fecha: '2023-11-22', hora: '09:30', precio: 8, asientos: 3, pasajeros: 0 },
];

const sampleViajesPasajero = {
  activos: [
    { id: 'p1', status: 'activo', o: 'Los Guayos', d: 'Valencia', fecha: '2023-11-21', hora: '10:00', conductor: 'Ana G.', fotoPerfil: null },
  ],
  historial: [
    { id: 'p2', status: 'finalizado', o: 'Valencia', d: 'Tocuyito', fecha: '2023-11-15', hora: '15:00', conductor: 'Pedro R.', fotoPerfil: null },
    { id: 'p3', status: 'cancelado', o: 'Valencia', d: 'Puerto Cabello', fecha: '2023-11-10', hora: '16:00', conductor: 'Luis H.', fotoPerfil: null },
  ]
};
// --- FIN DATOS DE EJEMPLO ---


// COMPONENTE: Notificación Toast (Negra desde arriba)
const ToastNotification = ({ message, show, onClose }) => {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 segundos
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-transform duration-300 transform ${show ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="bg-slate-950 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700">
        <CheckCircle className="text-blue-500" size={20} />
        <span className="text-sm font-bold uppercase tracking-wider">{message}</span>
      </div>
    </div>
  );
};

// COMPONENTE: Modal para Editar Viaje (Estilo Oscuro)
const ModalEditarViaje = ({ viaje, isOpen, onClose, onSave }) => {
  const [editedViaje, setEditedViaje] = useState(viaje);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedViaje(prev => ({ ...prev, [name]: name === 'precio' || name === 'asientos' ? parseInt(value) : value }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center">
      <div className="bg-slate-900 w-full max-w-md rounded-[35px] border border-slate-800 shadow-xl p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <h3 className="text-center text-xs font-black text-blue-500 uppercase tracking-[4px] mb-8">Editar Mi Viaje</h3>

        <div className="space-y-6">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label>
              <input type="date" name="fecha" value={editedViaje.fecha} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hora</label>
              <input type="time" name="hora" value={editedViaje.hora} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          {/* Precio y Asientos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo ($)</label>
              <input type="number" name="precio" value={editedViaje.precio} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Puestos Libres</label>
              <input type="number" name="asientos" value={editedViaje.asientos} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3.5 text-sm font-bold focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>
          
          <button onClick={() => onSave(editedViaje)} className="w-full bg-blue-600 text-white rounded-full p-4 font-black uppercase text-xs tracking-[3px] shadow-lg shadow-blue-950/50 active:scale-95 transition-all">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};


// COMPONENTE: Tarjeta de Viaje - Modo Chofer
const ViajeCardChofer = ({ viaje, onEdit, onDelete, linked }) => (
  <div className={`bg-slate-900 p-6 rounded-[30px] border ${linked ? 'border-dashed border-slate-700' : 'border-slate-800'} relative space-y-4`}>
    {viaje.type === 'retorno' && (
      <div className="absolute top-6 left-6 text-slate-600 flex items-center gap-1.5">
          <Repeat size={14} className='-rotate-90'/>
          <span className="text-[9px] font-black uppercase tracking-widest">RETORNO VINCULADO</span>
      </div>
    )}

    {/* Header Tarjeta */}
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Costo ($)</p>
        <p className="text-4xl font-black italic text-blue-500 leading-none">${viaje.precio}</p>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onEdit} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-500 hover:text-white transition-colors">
          <Edit2 size={16} />
        </button>
        <button onClick={onDelete} className="w-10 h-10 rounded-full bg-red-950/50 flex items-center justify-center border border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    {/* Ruta */}
    <div className="flex items-center gap-4 text-center">
      <div className='flex-1'>
          <p className="text-[11px] font-bold text-white uppercase italic">{viaje.o}</p>
          <p className="text-[7px] font-black text-slate-600 uppercase">Salida</p>
      </div>
      <ArrowLeftRight className='text-slate-700' size={18}/>
      <div className='flex-1'>
          <p className="text-[11px] font-bold text-white uppercase italic">{viaje.d}</p>
          <p className="text-[7px] font-black text-slate-600 uppercase">Llegada</p>
      </div>
    </div>

    {/* Detalles */}
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2.5 text-slate-300">
        <Calendar size={16} className="text-blue-600"/>
        <p className="text-xs font-bold text-white">{viaje.fecha}</p>
      </div>
      <div className="flex items-center gap-2.5 text-slate-300">
        <Clock size={16} className="text-blue-600"/>
        <p className="text-xs font-bold text-white">{viaje.hora}</p>
      </div>
      <div className="flex items-center gap-2.5 col-span-2 text-slate-300">
        <Users size={16} className="text-blue-600"/>
        <p className="text-xs font-bold text-white">{viaje.pasajeros} / {viaje.asientos} Puestos Confirmados</p>
      </div>
    </div>
  </div>
);


// COMPONENTE: Tarjeta de Viaje - Modo Pasajero
const ViajeCardPasajero = ({ viaje }) => (
  <div className="bg-slate-900 p-6 rounded-[30px] border border-slate-800 space-y-4 relative">
    <div className={`absolute top-6 right-6 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${viaje.status === 'activo' ? 'bg-blue-950/50 border-blue-900 text-blue-500' : viaje.status === 'finalizado' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-500' : 'bg-red-950/50 border-red-900 text-red-500'}`}>
        {viaje.status}
    </div>
    
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
        {viaje.fotoPerfil ? <img src={viaje.fotoPerfil} /> : <div className='font-black text-blue-600 text-xl'>{viaje.conductor[0]}</div>}
      </div>
      <div>
        <p className="text-base font-black italic text-white uppercase">{viaje.conductor}</p>
        <p className="text-[8px] font-black text-blue-500 uppercase tracking-wider">Conductor Verificado</p>
      </div>
    </div>

    {/* Ruta */}
    <div className="flex items-center gap-4 text-center">
      <div className='flex-1'>
          <p className="text-[11px] font-bold text-white uppercase italic">{viaje.o}</p>
          <p className="text-[7px] font-black text-slate-600 uppercase">Recogida</p>
      </div>
      <ArrowLeftRight className='text-slate-700' size={18}/>
      <div className='flex-1'>
          <p className="text-[11px] font-bold text-white uppercase italic">{viaje.d}</p>
          <p className="text-[7px] font-black text-slate-600 uppercase">Destino</p>
      </div>
    </div>

    {/* Detalles */}
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-300">
        <Calendar size={16} className="text-blue-600"/>
        <p className="text-xs font-bold text-white">{viaje.fecha}</p>
      </div>
      <div className="flex items-center gap-2 text-slate-300">
        <Clock size={16} className="text-blue-600"/>
        <p className="text-xs font-bold text-white">{viaje.hora}</p>
      </div>
    </div>
  </div>
);


// COMPONENTE PRINCIPAL: Mis Viajes
export const VistaMisViajes = ({ userData, onRegresar }) => {
  const [activeTab, setActiveTab] = useState('pasajero'); // 'pasajero' | 'chofer'
  const [editingViaje, setEditingViaje] = useState(null);
  const [toastData, setToastData] = useState({ show: false, message: '' });

  const handleEditSave = (updatedViaje) => {
    // Aquí implementas la lógica para guardar en Firebase.
    // Llama a tu función `actualizarViaje(updatedViaje)`
    console.log("Guardando cambios en Firebase para:", updatedViaje.id, updatedViaje);
    
    // Al simular el éxito:
    setEditingViaje(null);
    setToastData({ show: true, message: 'Cambios guardados con éxito' });
  };

  const handleCloseToast = () => {
    setToastData({ show: false, message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <ToastNotification show={toastData.show} message={toastData.message} onClose={handleCloseToast} />
      
      {editingViaje && (
        <ModalEditarViaje 
          viaje={editingViaje} 
          isOpen={!!editingViaje} 
          onClose={() => setEditingViaje(null)} 
          onSave={handleEditSave}
        />
      )}

      {/* Header */}
      <div className="p-6 pt-10">
        <button onClick={onRegresar} className="flex items-center gap-2.5 text-slate-500 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-[10px] font-black uppercase tracking-[3px]">Volver</span>
        </button>
      </div>

      <div className="px-6 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-black italic text-white uppercase tracking-wider">Mis Viajes</h2>
          <p className="text-[11px] font-black text-slate-600 uppercase tracking-[4px] mt-2">Gestiona tus rutas</p>
        </div>

        {/* SELECTOR DE MODO (PESTAÑAS) */}
        <div className="bg-slate-900 rounded-full border border-slate-800 p-1 flex relative">
          {/* Fondo móvil azul para la pestaña activa */}
          <div className={`absolute top-1 bottom-1 bg-blue-600 rounded-full transition-all duration-300 ${activeTab === 'pasajero' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'}`} />
          
          <button onClick={() => setActiveTab('pasajero')} className={`relative flex-1 p-4 rounded-full text-xs font-black uppercase tracking-[2px] transition-colors ${activeTab === 'pasajero' ? 'text-white' : 'text-slate-500'}`}>
            Como Pasajero
          </button>
          <button onClick={() => setActiveTab('chofer')} className={`relative flex-1 p-4 rounded-full text-xs font-black uppercase tracking-[2px] transition-colors ${activeTab === 'chofer' ? 'text-white' : 'text-slate-500'}`}>
            Como Chofer
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑAS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto pb-32 space-y-12">
          {activeTab === 'pasajero' ? (
            <div className="space-y-10">
                {/* Viajes Activos */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[4px]">Viajes Activos</p>
                    {sampleViajesPasajero.activos.length === 0 ? (
                        <div className='border-2 border-dashed border-slate-800 rounded-[30px] p-8 text-center'>
                            <p className='text-xs font-bold text-slate-700'>No tienes reservaciones activas.</p>
                        </div>
                    ) : sampleViajesPasajero.activos.map(viaje => (
                        <ViajeCardPasajero key={viaje.id} viaje={viaje} />
                    ))}
                </div>

                {/* Historial */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[4px]">Historial de Rutas</p>
                    {sampleViajesPasajero.historial.map(viaje => (
                        <ViajeCardPasajero key={viaje.id} viaje={viaje} />
                    ))}
                </div>
            </div>
          ) : (
            <div className="space-y-10">
                {/* Listado Chofer */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[4px]">Mis Publicaciones</p>
                    {sampleViajesChofer.length === 0 ? (
                        <div className='border-2 border-dashed border-slate-800 rounded-[30px] p-8 text-center'>
                            <p className='text-xs font-bold text-slate-700'>No has publicado ningún viaje todavía.</p>
                        </div>
                    ) : sampleViajesChofer.map(viaje => (
                        <ViajeCardChofer 
                            key={viaje.id} 
                            viaje={viaje} 
                            linked={viaje.linkedReturnId || viaje.linkedTripId}
                            onEdit={() => setEditingViaje(viaje)}
                            onDelete={() => console.log("Eliminando viaje:", viaje.id)}
                        />
                    ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
      
