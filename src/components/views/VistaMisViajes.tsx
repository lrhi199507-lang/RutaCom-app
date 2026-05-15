import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Toast from "../ui/Toast";
import { 
  ArrowLeft, Edit2, Trash2, Calendar, Clock, Users, 
  X, CheckCircle, Repeat, ArrowLeftRight, Settings, Info, Check, Star, Navigation 
} from 'lucide-react';
import MapaView from '../Map/MapaView'; 

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

const ModalConfirmarEliminar = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center">
      <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center">
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">¿Eliminar Viaje?</h3>
        <p className="text-xs font-bold text-slate-400 mb-8">Esta acción no se puede deshacer. (Solo permitido si no hay pasajeros).</p>
        
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

const ViajeCardChofer = ({ viaje, onEdit, onDelete, onClickGestionar }) => {
  const pasajerosCount = viaje.pasajeros ? viaje.pasajeros.length : 0;
  const puestosTotales = viaje.asientos || viaje.puestos || 1;
  const esRetorno = viaje.tipoRuta === 'vuelta_de_ruta';
  const solicitudes = viaje.reservasPendientes?.length || 0;
  const estadoActual = viaje.estado || 'disponible';
  
  const estaEnCurso = estadoActual === 'en_curso' || estadoActual === 'buscando';
  const esFinalizado = estadoActual === 'finalizado';

  // 🔥 LÓGICA DE COLOR NARANJA: 
  // Si hay solicitudes pendientes O el viaje está en curso, mantenlo naranja.
  const botonNaranja = !esFinalizado && (solicitudes > 0 || estaEnCurso);

  return (
    <div className={`bg-white p-6 rounded-[30px] border shadow-sm ${esRetorno ? 'border-dashed border-emerald-200 bg-emerald-50/10' : 'border-slate-100'} relative space-y-4`}>
      <div className={`absolute top-6 right-6 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest z-20 ${estaEnCurso ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : esFinalizado ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
          {estaEnCurso ? 'EN CURSO' : esFinalizado ? 'FINALIZADO' : 'DISPONIBLE'}
      </div>

      {esRetorno && (
        <div className="absolute top-6 left-6 text-emerald-600 flex items-center gap-1.5 z-20">
            <Repeat size={14} className='-rotate-90'/>
            <span className="text-[9px] font-black uppercase tracking-widest">RETORNO</span>
        </div>
      )}

      {(viaje.coordsOrigen || viaje.coordsDestino) && (
        <div className="h-32 rounded-2xl overflow-hidden mb-2 relative pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent z-10" />
           <MapaView origen={viaje.coordsOrigen} destino={viaje.coordsDestino} interactivo={false} />
        </div>
      )}

      <div className="flex justify-between items-start pt-2">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo ($)</p>
          <p className="text-4xl font-black italic text-blue-600 leading-none">${viaje.precio}</p>
        </div>
        
        {!esFinalizado && (
          <div className="flex gap-2.5">
            <button onClick={onEdit} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors">
              <Edit2 size={16} />
            </button>
            <button onClick={onDelete} className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-500 hover:bg-rose-100 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-center">
        <div className='flex-1'>
            <p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{viaje.cO || viaje.origen?.split(',')[0]}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase">Salida</p>
        </div>
        <ArrowLeftRight className='text-slate-300 shrink-0' size={18}/>
        <div className='flex-1'>
            <p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{viaje.cD || viaje.destino?.split(',')[0]}</p>
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

      {/* 🔥 BOTÓN INTELIGENTE: NARANJA PERSISTENTE 🔥 */}
      <button 
        onClick={() => onClickGestionar(viaje)}
        className={`w-full mt-4 text-white rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${
          botonNaranja 
            ? 'bg-orange-500 shadow-orange-500/40 animate-pulse' 
            : esFinalizado
            ? 'bg-slate-800 shadow-slate-900/30'
            : 'bg-green-500 shadow-green-500/30'
        }`}
      >
        {solicitudes > 0 && !esFinalizado ? (
          <><Info size={18} /> ¡Tienes {solicitudes} solicitud{solicitudes > 1 ? 'es' : ''}!</>
        ) : estaEnCurso ? (
          <><Navigation size={16} /> VIAJE ACTIVO - GESTIONAR</>
        ) : esFinalizado ? (
          <><Star size={16} className="fill-white" /> Ver Resumen del Viaje</>
        ) : (
          <><Settings size={16} /> Gestionar Viaje</>
        )}
      </button>
    </div>
  );
};

const ViajeCardPasajero = ({ viaje, tipo, onClickGestionar, userData }) => {
  const miReserva = viaje.pasajeros?.find(p => p.id === userData?.id || p.uid === userData?.id);
  const esConfirmado = !!miReserva;
  const yaCalifico = miReserva?.calificado === true;

  return (
    <div className={`bg-white p-6 rounded-[30px] shadow-sm border space-y-4 relative overflow-hidden ${esConfirmado && tipo !== 'finalizado' ? 'border-blue-200' : 'border-slate-100'}`}>
      {(viaje.coordsOrigen || viaje.coordsDestino) && (
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
           <MapaView origen={viaje.coordsOrigen} destino={viaje.coordsDestino} interactivo={false} />
           <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
        </div>
      )}

      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest z-20 ${tipo === 'activo' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
          {tipo === 'activo' ? 'ACTIVO' : 'FINALIZADO'}
      </div>
      
      <div className="flex items-center gap-4 pt-1 pr-20 relative z-10">
        <div className="w-12 h-12 rounded-[14px] bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
          {viaje.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <div className='font-black italic text-white text-xl'>D</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black italic text-slate-800 uppercase truncate bg-white/80 rounded px-1 -ml-1 inline-block">{viaje.cN || viaje.conductor || "Conductor"}</p>
          <p className="text-[8px] font-black text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 inline-block">Chofer Designado</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-center relative z-10 bg-white/90 p-3 rounded-2xl border border-slate-100/50 backdrop-blur-md">
        <div className='flex-1 min-w-0'>
            <p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{viaje.cO || viaje.origen?.split(',')[0]}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">Recogida</p>
        </div>
        <ArrowLeftRight className='text-slate-300 shrink-0' size={18}/>
        <div className='flex-1 min-w-0'>
            <p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{viaje.cD || viaje.destino?.split(',')[0]}</p>
            <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">Destino</p>
        </div>
      </div>

      <div className="bg-slate-50/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 flex justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-500 shrink-0"/>
          <p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-500 shrink-0"/>
          <p className="text-xs font-bold text-slate-700">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p>
        </div>
      </div>

      {tipo === 'activo' ? (
        <button 
            onClick={() => onClickGestionar(viaje)}
            className={`w-full mt-4 rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg relative z-10 ${
              esConfirmado 
              ? 'bg-blue-600 text-white shadow-blue-500/30' 
              : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {esConfirmado ? <><Check size={16} /> ¡Viaje Confirmado! Ver PIN</> : <><Info size={16} /> Esperando Confirmación</>}
        </button>
      ) : (
        <button 
            onClick={() => onClickGestionar(viaje)}
            className={`w-full mt-4 rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg relative z-10 ${
              yaCalifico 
              ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none' 
              : 'bg-amber-400 text-amber-950 shadow-amber-500/30 border border-amber-300 animate-pulse'
            }`}
          >
            {yaCalifico ? <><Check size={16} /> Experiencia Calificada</> : <><Star size={16} className="fill-amber-950" /> Calificar a {viaje.cN?.split(' ')[0] || "Conductor"}</>}
        </button>
      )}
    </div>
  );
};

export const VistaMisViajes = ({ 
  viajesChofer = [], 
  viajesPasajeroActivos = [], 
  viajesPasajeroHistorial = [], 
  userData, 
  onRegresar, 
  onActualizarViajeFBD,
  onEliminarViajeFBD,
  onVerDetalles 
}) => {
  const [activeTab, setActiveTab] = useState('chofer'); 
  const [editingViaje, setEditingViaje] = useState(null);
  const [viajeAEliminar, setViajeAEliminar] = useState(null);
  const [toastData, setToastData] = useState({ show: false, message: '' });

  useEffect(() => {
    if (window.google && window.google.maps) return;
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCUNgw1YBOVZKYAhTgcW00G1c09alI2kMs&libraries=places";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const handleEditSave = async (updatedViaje) => {
    try {
      const viajeRef = doc(db, "Viajes", updatedViaje.id);
      const datosNuevos = {
        precio: Number(updatedViaje.precio),
        asientos: Number(updatedViaje.asientos),
        puestos: Number(updatedViaje.asientos), 
        fecha: updatedViaje.fechaForm,
        hora: updatedViaje.horaForm,
        ...(updatedViaje.tipoRuta === 'vuelta_de_ruta' 
            ? { fechaRegreso: updatedViaje.fechaForm, horaRegreso: updatedViaje.horaForm }
            : { fechaSalida: updatedViaje.fechaForm, horaSalida: updatedViaje.horaForm })
      };

      await updateDoc(viajeRef, datosNuevos);

      if (onActualizarViajeFBD) await onActualizarViajeFBD({ ...updatedViaje, ...datosNuevos });
      
      setEditingViaje(null);
      setToastData({ show: true, message: '¡Viaje actualizado en todo el sistema!' });
    } catch (error) {
      console.error("Error al actualizar:", error);
      setToastData({ show: true, message: 'Error de conexión al guardar' });
    }
  };

  const handleIntentarEliminar = (viaje) => {
    const tienePasajeros = viaje.pasajeros?.length > 0;
    const tieneSolicitudes = viaje.reservasPendientes?.length > 0;

    if (tienePasajeros || tieneSolicitudes) {
      setToastData({ show: true, message: 'Hay reservas. Usa "Gestionar Viaje" para cancelar.' });
    } else {
      setViajeAEliminar(viaje.id);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (viajeAEliminar) {
      try {
        await deleteDoc(doc(db, "Viajes", viajeAEliminar));
        if (onEliminarViajeFBD) await onEliminarViajeFBD(viajeAEliminar);
        setViajeAEliminar(null);
        setToastData({ show: true, message: 'Viaje eliminado correctamente' });
      } catch (error) {
        setViajeAEliminar(null);
        setToastData({ show: true, message: 'No tienes permisos para borrarlo' });
      }
    }
  };

  // 🔥 LÓGICA DE GRAVEDAD CERO: Ordenar los viajes para que los activos salgan de primeros 🔥
  const ordenarViajesChofer = (viajes) => {
    return [...viajes].sort((a, b) => {
      const estadoA = a.estado || 'disponible';
      const estadoB = b.estado || 'disponible';
      
      const enCursoA = estadoA === 'en_curso' || estadoA === 'buscando' ? 2 : 0;
      const enCursoB = estadoB === 'en_curso' || estadoB === 'buscando' ? 2 : 0;
      
      const solA = a.reservasPendientes?.length > 0 ? 1 : 0;
      const solB = b.reservasPendientes?.length > 0 ? 1 : 0;

      // Prioridad 1: En curso/buscando
      if (enCursoA !== enCursoB) return enCursoB - enCursoA;
      // Prioridad 2: Solicitudes pendientes
      if (solA !== solB) return solB - solA;
      // Prioridad 3: Fecha (Los más nuevos primero)
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  };

  const viajesActivosChoferOrdenados = ordenarViajesChofer(viajesChofer.filter(v => v.estado !== 'finalizado'));

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Toast show={toastData.show} message={toastData.message} onClose={() => setToastData({ show: false, message: '' })} />
      
      {editingViaje && (
        <ModalEditarViaje viaje={editingViaje} isOpen={true} onClose={() => setEditingViaje(null)} onSave={handleEditSave}/>
      )}

      <ModalConfirmarEliminar isOpen={!!viajeAEliminar} onClose={() => setViajeAEliminar(null)} onConfirm={handleConfirmarEliminar}/>

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
                        <ViajeCardPasajero key={viaje.id} viaje={viaje} tipo="activo" onClickGestionar={onVerDetalles} userData={userData} />
                      ))
                    )}
                </div>

                {viajesPasajeroHistorial.length > 0 && (
                  <div className="space-y-6">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">Historial de Rutas</p>
                      {viajesPasajeroHistorial.map(viaje => (
                          <ViajeCardPasajero key={viaje.id} viaje={viaje} tipo="finalizado" onClickGestionar={onVerDetalles} userData={userData} />
                      ))}
                  </div>
                )}
            </div>
          ) : (
            <div className="space-y-10">
                <div className="space-y-6">
                    <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest px-1">Mis Publicaciones Activas</p>
                    
                    {viajesActivosChoferOrdenados.length === 0 ? (
                        <div className='border border-slate-100 rounded-[30px] p-10 text-center bg-slate-50'>
                            <p className='text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose'>No tienes viajes activos.</p>
                        </div>
                    ) : (
                      viajesActivosChoferOrdenados.map(viaje => (
                        <ViajeCardChofer key={viaje.id} viaje={viaje} onEdit={() => setEditingViaje(viaje)} onDelete={() => handleIntentarEliminar(viaje)} onClickGestionar={onVerDetalles} />
                      ))
                    )}
                </div>

                {viajesChofer.filter(v => v.estado === 'finalizado').length > 0 && (
                  <div className="space-y-6 opacity-80">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">Historial de Viajes Finalizados</p>
                      {viajesChofer.filter(v => v.estado === 'finalizado').map(viaje => (
                        <ViajeCardChofer key={viaje.id} viaje={viaje} onEdit={() => {}} onDelete={() => {}} onClickGestionar={onVerDetalles} />
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
