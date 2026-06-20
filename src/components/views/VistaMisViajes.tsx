import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Toast from "../ui/Toast";
import { 
  ArrowLeft, Edit2, Calendar, Clock, Users, 
  X, CheckCircle, Repeat, ArrowLeftRight, Settings, Info, Check, Star, Navigation, Archive
} from 'lucide-react';
import MapaView from '../Map/MapaView'; 

// --- FUNCIONES AYUDANTES SEGURAS ---
const formatearHora12h = (hora24) => {
  if (!hora24 || typeof hora24 !== 'string') return "Sin hora";
  try {
    const [horas, minutos] = hora24.split(':');
    const h = parseInt(horas, 10);
    if (isNaN(h)) return hora24;
    return `${h % 12 || 12}:${minutos} ${h >= 12 ? 'PM' : 'AM'}`;
  } catch (e) { return "Sin hora"; }
};

const formatearFechaCorta = (fechaString) => {
  if (!fechaString || typeof fechaString !== 'string') return "Sin fecha";
  try {
    const partes = fechaString.split('-');
    if (partes.length !== 3) return fechaString;
    return new Date(partes[0], partes[1] - 1, partes[2]).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''); 
  } catch (e) { return "Sin fecha"; }
};

const getSafeArray = (arr) => Array.isArray(arr) ? arr : [];

// --- MODAL DE EDICIÓN ---
const ModalEditarViaje = ({ viaje, isOpen, onClose, onSave }) => {
  if (!isOpen || !viaje) return null;
  const fechaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.fechaSalida || viaje.fecha) : (viaje.fecha || viaje.fechaSalida);
  const horaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.horaSalida || viaje.hora) : (viaje.hora || viaje.horaSalida);

  const [formData, setFormData] = useState({ fechaForm: fechaActual || '', horaForm: horaActual || '', precio: viaje.precio || '', asientos: viaje.asientos || viaje.puestos || '' });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.name === 'precio' || e.target.name === 'asientos' ? parseInt(e.target.value) || '' : e.target.value }));

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center">
      <div className="bg-[#0f172a] w-full max-w-md rounded-[35px] shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
        <h3 className="text-center text-xs font-black text-blue-500 uppercase tracking-[4px] mb-8">Editar Mi Viaje</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label><input type="date" name="fechaForm" value={formData.fechaForm} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-xl p-3.5 text-sm font-bold" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hora</label><input type="time" name="horaForm" value={formData.horaForm} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-xl p-3.5 text-sm font-bold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo ($)</label><input type="number" name="precio" value={formData.precio} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-xl p-3.5 text-sm font-bold" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Puestos</label><input type="number" name="asientos" value={formData.asientos} onChange={handleChange} className="w-full bg-slate-800 text-white rounded-xl p-3.5 text-sm font-bold" /></div>
          </div>
          <button onClick={() => onSave({ id: viaje.id, tipoRuta: viaje.tipoRuta, ...formData })} className="w-full bg-blue-600 text-white rounded-full p-4 font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

// --- TARJETA CHOFER ---
const ViajeCardChofer = ({ viaje, onEdit, onArchivar, onClickGestionar }) => {
  if (!viaje) return null;
  
  const pasajerosCount = getSafeArray(viaje.pasajeros).length;
  const estadoActual = String(viaje.estado || 'disponible');
  const esRetorno = viaje.tipoRuta === 'vuelta_de_ruta';
  
  const estaEnCurso = estadoActual === 'en_curso' || estadoActual === 'buscando';
  const esFinalizado = estadoActual === 'finalizado';
  const esCancelado = estadoActual === 'cancelado';
  
  const solicitudes = getSafeArray(viaje.reservasPendientes).length; 
  const nuevosConfirmados = getSafeArray(viaje.pasajeros).filter(p => p && !p.vistoPorChofer).length; 
  const botonNaranja = !esFinalizado && !esCancelado && (solicitudes > 0 || estaEnCurso || nuevosConfirmados > 0);

  const origenText = viaje.cO || String(viaje.origen || "").split(',')[0] || "Origen";
  const destinoText = viaje.cD || String(viaje.destino || "").split(',')[0] || "Destino";

  return (
    <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm relative space-y-4">
      <div className={`absolute top-6 right-6 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest z-20 ${estaEnCurso ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : esFinalizado ? 'bg-green-50 border-green-200 text-green-600' : esCancelado ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
          {estaEnCurso ? 'EN CURSO' : esFinalizado ? 'FINALIZADO' : esCancelado ? 'CANCELADO' : 'DISPONIBLE'}
      </div>

      {esRetorno && <div className="absolute top-6 left-6 text-emerald-600 flex items-center gap-1.5 z-20"><Repeat size={14} className='-rotate-90'/><span className="text-[9px] font-black uppercase tracking-widest">RETORNO</span></div>}

      <div className="h-32 rounded-2xl overflow-hidden mb-2 relative pointer-events-none bg-slate-100">
         <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent z-10" />
         {viaje.coordsOrigen && viaje.coordsDestino && <MapaView origen={viaje.coordsOrigen} destino={viaje.coordsDestino} interactivo={false} />}
      </div>

      <div className="flex justify-between items-start pt-2">
        <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo ($)</p><p className="text-4xl font-black italic text-blue-600 leading-none">${viaje.precio || '0'}</p></div>
        {!esFinalizado && !esCancelado && <button onClick={onEdit} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500"><Edit2 size={16} /></button>}
      </div>

      <div className="flex items-center gap-4 text-center">
        <div className='flex-1'><p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{origenText}</p><p className="text-[7px] font-black text-slate-400 uppercase">Salida</p></div>
        <ArrowLeftRight className='text-slate-300 shrink-0' size={18}/>
        <div className='flex-1'><p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{destinoText}</p><p className="text-[7px] font-black text-slate-400 uppercase">Llegada</p></div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2.5"><Calendar size={16} className="text-blue-500"/><p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p></div>
        <div className="flex items-center gap-2.5"><Clock size={16} className="text-blue-500"/><p className="text-xs font-bold text-slate-700">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p></div>
        <div className="flex items-center gap-2.5 col-span-2"><Users size={16} className="text-blue-500"/><p className="text-xs font-bold text-slate-700">{pasajerosCount} / {viaje.asientos || viaje.puestos || 1} Puestos</p></div>
      </div>

      <button disabled={esCancelado} onClick={() => onClickGestionar(viaje)}
        className={`w-full mt-4 rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 transition-all shadow-lg ${
          botonNaranja ? 'bg-orange-500 text-white shadow-orange-500/40 animate-pulse' 
          : esCancelado ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none'
          : esFinalizado ? 'bg-slate-800 text-white shadow-slate-900/30'
          : 'bg-green-500 text-white shadow-green-500/30 active:scale-95'
        }`}>
        {esCancelado ? <><Archive size={16} /> Viaje Cancelado</>
        : solicitudes > 0 && !esFinalizado ? <><Info size={18} /> ¡Tienes {solicitudes} solicitud!</>
        : estaEnCurso ? <><Navigation size={16} /> VIAJE ACTIVO - GESTIONAR</> 
        : esFinalizado ? <><Star size={16} className="fill-white" /> Ver Resumen</>
        : <><Settings size={16} /> Gestionar Viaje</>}
      </button>
    </div>
  );
};

// --- TARJETA PASAJERO ---
const ViajeCardPasajero = ({ viaje, onClickGestionar, userData }) => {
  if (!viaje) return null; 

  const miReserva = getSafeArray(viaje.pasajeros).find(p => p && p.id === userData?.id);
  const esConfirmado = !!miReserva;
  
  const estadoActual = String(viaje.estado || 'disponible');
  const esFinalizado = estadoActual === 'finalizado';
  const esCancelado = estadoActual === 'cancelado';
  const esActivo = !esFinalizado && !esCancelado;

  const conductorNombre = String(viaje.cN || viaje.conductor || "Conductor");
  const origenText = viaje.cO || String(viaje.origen || "").split(',')[0] || "Origen";
  const destinoText = viaje.cD || String(viaje.destino || "").split(',')[0] || "Destino";

  return (
    <div className={`bg-white p-6 rounded-[30px] shadow-sm border space-y-4 relative overflow-hidden ${esConfirmado && esActivo ? 'border-blue-200' : 'border-slate-100'}`}>
      <div className={`absolute inset-0 pointer-events-none opacity-40 z-0 bg-slate-100 ${(!esActivo) ? 'grayscale-[50%]' : ''}`}>
         {viaje.coordsOrigen && viaje.coordsDestino && <MapaView origen={viaje.coordsOrigen} destino={viaje.coordsDestino} interactivo={false} />}
         <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
      </div>

      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest z-20 ${esActivo ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
          {esActivo ? 'ACTIVO' : esCancelado ? 'CANCELADO' : 'FINALIZADO'}
      </div>
      
      <div className="flex items-center gap-4 pt-1 pr-20 relative z-10">
        <div className={`w-12 h-12 rounded-[14px] ${!esActivo ? 'bg-slate-400' : 'bg-blue-600'} border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0`}>
          {viaje.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <div className='font-black italic text-white text-xl'>D</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black italic text-slate-800 uppercase truncate bg-white/80 rounded px-1 -ml-1 inline-block">{conductorNombre}</p>
          <p className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 inline-block ${!esActivo ? 'bg-slate-100 text-slate-500' : 'bg-blue-100/80 text-blue-800'}`}>Chofer Designado</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-center relative z-10 bg-white/90 p-3 rounded-2xl border border-slate-100/50 backdrop-blur-md">
        <div className='flex-1 min-w-0'><p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{origenText}</p><p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">Recogida</p></div>
        <ArrowLeftRight className='text-slate-300 shrink-0' size={18}/>
        <div className='flex-1 min-w-0'><p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{destinoText}</p><p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">Destino</p></div>
      </div>

      <div className="bg-slate-50/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 flex justify-between gap-4 relative z-10">
        <div className="flex items-center gap-2"><Calendar size={16} className="text-blue-500 shrink-0"/><p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p></div>
        <div className="flex items-center gap-2"><Clock size={16} className="text-blue-500 shrink-0"/><p className="text-xs font-bold text-slate-700">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p></div>
      </div>

      {esActivo ? (
        <button onClick={() => onClickGestionar(viaje)} className="w-full mt-4 rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg relative z-10 bg-blue-600 text-white shadow-blue-500/30">
            {esConfirmado ? <><Check size={16} /> ¡Viaje Confirmado! Ver PIN</> : <><Info size={16} /> Esperando Confirmación</>}
        </button>
      ) : esCancelado ? (
        <button disabled className="w-full mt-4 bg-slate-100 text-slate-400 border border-slate-200 rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2 relative z-10">
          <Archive size={16} /> Viaje Cancelado
        </button>
      ) : (
        <button onClick={() => onClickGestionar(viaje)} className="w-full mt-4 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2 relative z-10">
            <Star size={16} className="fill-white" /> Ver Resumen
        </button>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const VistaMisViajes = ({ 
  viajesChofer = [], 
  viajesPasajeroActivos = [], 
  viajesPasajeroHistorial = [], 
  userData, 
  onRegresar, 
  onActualizarViajeFBD,
  onVerDetalles 
}) => {
  const [activeTab, setActiveTab] = useState('chofer'); 
  const [subTabChofer, setSubTabChofer] = useState('activos'); 
  const [subTabPasajero, setSubTabPasajero] = useState('activos'); 
  const [editingViaje, setEditingViaje] = useState(null);
  const [toastData, setToastData] = useState({ show: false, message: '' });

  useEffect(() => {
    if (window.google && window.google.maps) return;
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCUNgw1YBOVZKYAhTgcW00G1c09alI2kMs&libraries=places";
    script.async = true; script.defer = true;
    document.head.appendChild(script);
  }, []);

  const handleEditSave = async (updatedViaje) => {
    try {
      const datosNuevos = {
        precio: Number(updatedViaje.precio), asientos: Number(updatedViaje.asientos), puestos: Number(updatedViaje.asientos), 
        fecha: updatedViaje.fechaForm, hora: updatedViaje.horaForm,
        ...(updatedViaje.tipoRuta === 'vuelta_de_ruta' ? { fechaRegreso: updatedViaje.fechaForm, horaRegreso: updatedViaje.horaForm } : { fechaSalida: updatedViaje.fechaForm, horaSalida: updatedViaje.horaForm })
      };
      await updateDoc(doc(db, "Viajes", updatedViaje.id), datosNuevos);
      if (onActualizarViajeFBD) await onActualizarViajeFBD({ ...updatedViaje, ...datosNuevos });
      setEditingViaje(null); setToastData({ show: true, message: '¡Viaje actualizado en todo el sistema!' });
    } catch (error) { setToastData({ show: true, message: 'Error de conexión al guardar' }); }
  };

  const handleArchivarViaje = async (viajeId) => {
    try {
      await updateDoc(doc(db, "Viajes", viajeId), { estado: 'cancelado' });
      if (onActualizarViajeFBD) await onActualizarViajeFBD({ id: viajeId, estado: 'cancelado' });
      setToastData({ show: true, message: 'Viaje archivado en el historial' });
    } catch (error) { setToastData({ show: true, message: 'Error de red al archivar' }); }
  };

  // 🔥 LÓGICA ULTRA-SIMPLE (SIN SORT, CERO CRASHES) 🔥
  const choferTodos = getSafeArray(viajesChofer);
  const choferActivos = choferTodos.filter(v => v && v.estado !== 'finalizado' && v.estado !== 'cancelado');
  const choferHistorial = choferTodos.filter(v => v && (v.estado === 'finalizado' || v.estado === 'cancelado'));

  const pasajeroActivosBase = getSafeArray(viajesPasajeroActivos);
  const pasajeroHistorialBase = getSafeArray(viajesPasajeroHistorial);

  // 1. De los activos que manda Firebase, sacamos solo los verdaderamente activos
  const pasajeroActivos = pasajeroActivosBase.filter(v => v && v.estado !== 'finalizado' && v.estado !== 'cancelado');
  
  // 2. Extraemos los cancelados que llegaron "colados" en la lista de activos
  const colados = pasajeroActivosBase.filter(v => v && (v.estado === 'finalizado' || v.estado === 'cancelado'));
  
  // 3. Juntamos el historial base con los colados, sin duplicados y SIN ORDENAR.
  const pasajeroHistorial = [];
  const mapIds = {};
  [...colados, ...pasajeroHistorialBase].forEach(viaje => {
      if (viaje && viaje.id && !mapIds[viaje.id]) {
          mapIds[viaje.id] = true;
          pasajeroHistorial.push(viaje);
      }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Toast show={toastData.show} message={toastData.message} onClose={() => setToastData({ show: false, message: '' })} />
      {editingViaje && <ModalEditarViaje viaje={editingViaje} isOpen={true} onClose={() => setEditingViaje(null)} onSave={handleEditSave}/>}

      {/* Z-30 para no pisar notificaciones */}
      <div className="p-4 pt-8 bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onRegresar} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 active:scale-90 transition-all border border-slate-100"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-black italic text-slate-800 tracking-tight uppercase">Mis Rutas</h2>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-full relative shadow-inner">
          <div className={`absolute top-1.5 bottom-1.5 bg-blue-600 rounded-full transition-all duration-300 shadow-sm ${activeTab === 'pasajero' ? 'left-[calc(50%+3px)] w-[calc(50%-6px)]' : 'left-1.5 w-[calc(50%-6px)]'}`} />
          <button onClick={() => setActiveTab('chofer')} className={`relative flex-1 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all z-10 flex items-center justify-center gap-2 ${activeTab === 'chofer' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>Como Chofer</button>
          <button onClick={() => setActiveTab('pasajero')} className={`relative flex-1 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all z-10 flex items-center justify-center gap-2 ${activeTab === 'pasajero' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>Como Pasajero</button>
        </div>
      </div>

      <div className="flex-1 p-4 pb-24 overflow-y-auto">
        {activeTab === 'chofer' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex bg-white p-1 rounded-full mb-6 max-w-[220px] mx-auto border border-slate-200 shadow-sm">
              <button onClick={() => setSubTabChofer('activos')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabChofer === 'activos' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Activos</button>
              <button onClick={() => setSubTabChofer('historial')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabChofer === 'historial' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Historial</button>
            </div>
            {subTabChofer === 'activos' ? (
              choferActivos.length > 0 ? (
                <div className="space-y-4">{choferActivos.map(viaje => <ViajeCardChofer key={viaje.id} viaje={viaje} onEdit={() => setEditingViaje(viaje)} onArchivar={handleArchivarViaje} onClickGestionar={onVerDetalles} />)}</div>
              ) : (
                <div className="text-center py-20 opacity-60"><Repeat size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Panel Limpio</p></div>
              )
            ) : (
              choferHistorial.length > 0 ? (
                <div className="space-y-4 opacity-90">{choferHistorial.map(viaje => <ViajeCardChofer key={viaje.id} viaje={viaje} onEdit={() => {}} onArchivar={() => {}} onClickGestionar={onVerDetalles} />)}</div>
              ) : (
                <div className="text-center py-20 opacity-60"><Archive size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Historial Vacío</p></div>
              )
            )}
          </div>
        )}

        {activeTab === 'pasajero' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex bg-white p-1 rounded-full mb-6 max-w-[220px] mx-auto border border-slate-200 shadow-sm">
              <button onClick={() => setSubTabPasajero('activos')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabPasajero === 'activos' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Activos</button>
              <button onClick={() => setSubTabPasajero('historial')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabPasajero === 'historial' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Historial</button>
            </div>
            {subTabPasajero === 'activos' ? (
              pasajeroActivos.length > 0 ? (
                <div className="space-y-4">{pasajeroActivos.map(viaje => <ViajeCardPasajero key={viaje.id} viaje={viaje} userData={userData} onClickGestionar={onVerDetalles} />)}</div>
              ) : (
                <div className="text-center py-20 opacity-60"><User size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sin reservas activas</p></div>
              )
            ) : (
              pasajeroHistorial.length > 0 ? (
                <div className="space-y-4 opacity-90">{pasajeroHistorial.map(viaje => <ViajeCardPasajero key={viaje.id} viaje={viaje} userData={userData} onClickGestionar={onVerDetalles} />)}</div>
              ) : (
                <div className="text-center py-20 opacity-60"><Archive size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sin historial de viajes</p></div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
