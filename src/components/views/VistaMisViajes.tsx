import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Toast from "../ui/Toast";
import { 
  ArrowLeft, Edit2, Calendar, Clock, Users, 
  X, CheckCircle, Repeat, ArrowLeftRight, Settings, Info, Check, Star, Navigation, Archive, MapPin, AlertTriangle
} from 'lucide-react';

// 🔥 BLINDAJE 1: Funciones de formato a prueba de errores
const formatearHora12h = (hora24) => {
  if (!hora24 || typeof hora24 !== 'string') return "Sin hora";
  try {
    const [horas, minutos] = hora24.split(':');
    const h = parseInt(horas, 10);
    if (isNaN(h)) return hora24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${minutos} ${ampm}`;
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

const getSafeArray = (arr) => {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (typeof arr === 'object') return Object.values(arr);
  return [];
};

const ModalEditarViaje = ({ viaje, isOpen, onClose, onSave }) => {
  if (!isOpen || !viaje) return null;

  const fechaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.fechaSalida || viaje.fecha) : (viaje.fecha || viaje.fechaSalida);
  const horaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.horaSalida || viaje.hora) : (viaje.hora || viaje.horaSalida);

  const [formData, setFormData] = useState({
    fechaForm: fechaActual || '', horaForm: horaActual || '',
    precio: viaje.precio || '', asientos: viaje.asientos || viaje.puestos || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'precio' || name === 'asientos' ? parseInt(value) || '' : value }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center">
      <div className="bg-[#0f172a] w-full max-w-md rounded-[35px] shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
        <h3 className="text-center text-xs font-black text-blue-500 uppercase tracking-[4px] mb-8">Editar Mi Viaje</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label><input type="date" name="fechaForm" value={formData.fechaForm} onChange={handleChange} className="w-full bg-slate-800 border-none text-white rounded-xl p-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hora</label><input type="time" name="horaForm" value={formData.horaForm} onChange={handleChange} className="w-full bg-slate-800 border-none text-white rounded-xl p-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo ($)</label><input type="number" name="precio" value={formData.precio} onChange={handleChange} className="w-full bg-slate-800 border-none text-white rounded-xl p-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Puestos Libres</label><input type="number" name="asientos" value={formData.asientos} onChange={handleChange} className="w-full bg-slate-800 border-none text-white rounded-xl p-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <button onClick={() => onSave({ id: viaje.id, tipoRuta: viaje.tipoRuta, ...formData })} className="w-full bg-blue-600 text-white rounded-full p-4 font-black uppercase text-xs tracking-[3px] shadow-lg active:scale-95 transition-all mt-4">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

const ViajeCardChofer = ({ viaje, onEdit, onArchivar, onClickGestionar }) => {
  try {
    if (!viaje) return null;
    
    const listaPasajeros = getSafeArray(viaje.pasajeros);
    const puestosTotales = Number(viaje.asientos || viaje.puestos || 1);
    const esRetorno = viaje.tipoRuta === 'vuelta_de_ruta';
    const solicitudes = getSafeArray(viaje.reservasPendientes).length; 
    const estadoActual = String(viaje.estado || 'disponible');
    
    const estaEnCurso = estadoActual === 'en_curso' || estadoActual === 'buscando';
    const esFinalizado = estadoActual === 'finalizado';
    const esCancelado = estadoActual === 'cancelado';

    const nuevosConfirmados = listaPasajeros.filter(p => p && !p.vistoPorChofer).length; 
    const botonNaranja = !esFinalizado && !esCancelado && (solicitudes > 0 || estaEnCurso || nuevosConfirmados > 0);

    const fechaViaje = viaje.fechaSalida || viaje.fecha;
    const horaViaje = viaje.horaSalida || viaje.hora;
    let esVencido = false;

    if (fechaViaje && typeof fechaViaje === 'string' && horaViaje && typeof horaViaje === 'string' && !estaEnCurso && !esFinalizado && !esCancelado && listaPasajeros.length === 0) {
      const limiteTiempo = new Date(`${fechaViaje}T${horaViaje}`).getTime() + (2 * 60 * 60 * 1000); 
      if (new Date().getTime() > limiteTiempo) esVencido = true;
    }

    const origenText = typeof viaje.cO === 'string' && viaje.cO ? viaje.cO.split(',')[0] : (typeof viaje.origen === 'string' && viaje.origen ? viaje.origen.split(',')[0] : "Origen");
    const destinoText = typeof viaje.cD === 'string' && viaje.cD ? viaje.cD.split(',')[0] : (typeof viaje.destino === 'string' && viaje.destino ? viaje.destino.split(',')[0] : "Destino");

    return (
      <div className={`bg-white p-6 rounded-[30px] border shadow-sm ${esRetorno ? 'border-dashed border-emerald-200 bg-emerald-50/10' : 'border-slate-100'} relative space-y-4`}>
        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest z-20 ${estaEnCurso ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : esFinalizado ? 'bg-green-50 border-green-200 text-green-600' : (esVencido || esCancelado) ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
            {estaEnCurso ? 'EN CURSO' : esFinalizado ? 'FINALIZADO' : esCancelado ? 'CANCELADO' : esVencido ? 'VENCIDO' : 'DISPONIBLE'}
        </div>

        {esRetorno && <div className="absolute top-6 left-6 text-emerald-600 flex items-center gap-1.5 z-20"><Repeat size={14} className='-rotate-90'/><span className="text-[9px] font-black uppercase tracking-widest">RETORNO</span></div>}

        {/* 🔥 MAPA ELIMINADO PARA EVITAR CRASHES. REEMPLAZADO POR FONDO SEGURO 🔥 */}
        <div className={`h-24 rounded-2xl overflow-hidden mb-2 relative pointer-events-none bg-blue-50/50 flex items-center justify-center border border-slate-100 ${(esFinalizado || esCancelado) ? 'opacity-60 grayscale-[50%]' : ''}`}>
           <MapPin size={30} className="text-blue-200" />
        </div>

        <div className="flex justify-between items-start pt-2">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo ($)</p>
            <p className={`text-4xl font-black italic leading-none ${(esFinalizado || esCancelado) ? 'text-slate-400' : 'text-blue-600'}`}>${String(viaje.precio || '0')}</p>
          </div>
          {!esFinalizado && !esCancelado && !esVencido && (
            <div className="flex gap-2.5">
              <button onClick={onEdit} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-center">
          <div className='flex-1'><p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{origenText}</p><p className="text-[7px] font-black text-slate-400 uppercase">Salida</p></div>
          <ArrowLeftRight className='text-slate-300 shrink-0' size={18}/>
          <div className='flex-1'><p className="text-[11px] font-bold text-slate-800 uppercase italic truncate">{destinoText}</p><p className="text-[7px] font-black text-slate-400 uppercase">Llegada</p></div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2.5"><Calendar size={16} className="text-blue-500"/><p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(String(viaje.fechaSalida || viaje.fecha || ""))}</p></div>
          <div className="flex items-center gap-2.5"><Clock size={16} className="text-blue-500"/><p className="text-xs font-bold text-slate-700">{formatearHora12h(String(viaje.horaSalida || viaje.hora || ""))}</p></div>
          <div className="flex items-center gap-2.5 col-span-2"><Users size={16} className="text-blue-500"/><p className="text-xs font-bold text-slate-700">{listaPasajeros.length} / {puestosTotales} Puestos Confirmados</p></div>
        </div>

        <button disabled={esCancelado} onClick={() => esVencido ? onArchivar(viaje.id) : onClickGestionar(viaje)}
          className={`w-full mt-4 rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 transition-all shadow-lg ${
            botonNaranja ? 'bg-orange-500 text-white shadow-orange-500/40 animate-pulse active:scale-95' 
            : esCancelado ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-default'
            : esFinalizado ? 'bg-slate-800 text-white shadow-slate-900/30 active:scale-95'
            : esVencido ? 'bg-slate-200 text-slate-600 border border-slate-300 shadow-none active:scale-95 hover:bg-slate-300'
            : 'bg-green-500 text-white shadow-green-500/30 active:scale-95'
          }`}>
          {esCancelado ? <><Archive size={16} /> Viaje Cancelado</> : esVencido ? <><Archive size={16} /> Archivar Viaje Vencido</>
          : solicitudes > 0 && !esFinalizado ? <><Info size={18} /> ¡Tienes {solicitudes} solicitud{solicitudes > 1 ? 'es' : ''}!</>
          : estaEnCurso ? <><Navigation size={16} /> VIAJE ACTIVO - GESTIONAR</> : esFinalizado ? <><Star size={16} className="fill-white" /> Ver Resumen</>
          : <><Settings size={16} /> Gestionar Viaje</>}
        </button>
      </div>
    );
  } catch (error) {
    return <div className="bg-white p-6 rounded-[30px] border border-red-100 shadow-sm text-center text-red-400 font-bold text-xs"><AlertTriangle className="mx-auto mb-2 opacity-50"/>Error al cargar este viaje</div>;
  }
};

const ViajeCardPasajero = ({ viaje, onClickGestionar, userData }) => {
  try {
    if (!viaje) return null; 

    const listaPasajeros = getSafeArray(viaje.pasajeros);
    const miReserva = listaPasajeros.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
    const esConfirmado = !!miReserva;
    const yaCalifico = miReserva?.calificado === true;

    const estadoActual = String(viaje.estado || 'disponible');
    const esFinalizado = estadoActual === 'finalizado';
    const esCancelado = estadoActual === 'cancelado';
    const esActivo = !esFinalizado && !esCancelado;

    const conductorNombre = String(viaje.cN || viaje.conductor || "Conductor");
    const primerNombreConductor = conductorNombre.split(' ')[0] || "Conductor";

    const origenText = typeof viaje.cO === 'string' && viaje.cO ? viaje.cO.split(',')[0] : (typeof viaje.origen === 'string' && viaje.origen ? viaje.origen.split(',')[0] : "Origen");
    const destinoText = typeof viaje.cD === 'string' && viaje.cD ? viaje.cD.split(',')[0] : (typeof viaje.destino === 'string' && viaje.destino ? viaje.destino.split(',')[0] : "Destino");

    return (
      <div className={`bg-white p-6 rounded-[30px] shadow-sm border space-y-4 relative overflow-hidden ${esConfirmado && esActivo ? 'border-blue-200' : 'border-slate-100'}`}>
        
        {/* 🔥 MAPA ELIMINADO PARA EVITAR CRASHES. REEMPLAZADO POR FONDO SEGURO 🔥 */}
        <div className={`absolute inset-0 pointer-events-none opacity-40 z-0 bg-slate-50 flex items-center justify-center ${(!esActivo) ? 'grayscale-[50%]' : ''}`}>
           <MapPin size={100} className="text-slate-200" />
           <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
        </div>

        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest z-20 ${esActivo ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
            {esActivo ? 'ACTIVO' : esCancelado ? 'CANCELADO' : 'FINALIZADO'}
        </div>
        
        <div className="flex items-center gap-4 pt-1 pr-20 relative z-10">
          <div className={`w-12 h-12 rounded-[14px] ${!esActivo ? 'bg-slate-400' : 'bg-blue-600'} border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0`}>
            {typeof viaje.fotoPerfil === 'string' && viaje.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <div className='font-black italic text-white text-xl'>D</div>}
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
          <div className="flex items-center gap-2"><Calendar size={16} className="text-blue-500 shrink-0"/><p className="text-xs font-bold text-slate-700 capitalize">{formatearFechaCorta(String(viaje.fechaSalida || viaje.fecha || ""))}</p></div>
          <div className="flex items-center gap-2"><Clock size={16} className="text-blue-500 shrink-0"/><p className="text-xs font-bold text-slate-700">{formatearHora12h(String(viaje.horaSalida || viaje.hora || ""))}</p></div>
        </div>

        {esActivo ? (
          <button onClick={() => onClickGestionar(viaje)} className={`w-full mt-4 rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg relative z-10 ${esConfirmado ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-white text-slate-500 border border-slate-200'}`}>
              {esConfirmado ? <><Check size={16} /> ¡Viaje Confirmado! Ver PIN</> : <><Info size={16} /> Esperando Confirmación</>}
          </button>
        ) : esCancelado ? (
          <button disabled className="w-full mt-4 bg-slate-100 text-slate-400 border border-slate-200 rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2 relative z-10">
            <Archive size={16} /> Viaje Cancelado
          </button>
        ) : (
          <button onClick={() => onClickGestionar(viaje)} className={`w-full mt-4 rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg relative z-10 ${yaCalifico ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none' : 'bg-amber-400 text-amber-950 shadow-amber-500/30 border border-amber-300 animate-pulse'}`}>
              {yaCalifico ? <><Check size={16} /> Experiencia Calificada</> : <><Star size={16} className="fill-amber-950" /> Calificar a {primerNombreConductor}</>}
          </button>
        )}
      </div>
    );
  } catch (error) {
    return <div className="bg-white p-6 rounded-[30px] border border-red-100 shadow-sm text-center text-red-400 font-bold text-xs"><AlertTriangle className="mx-auto mb-2 opacity-50"/>Error al cargar reserva</div>;
  }
};

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

  // ESTADOS PROTEGIDOS PARA LAS LISTAS
  const [choferActivos, setChoferActivos] = useState([]);
  const [choferHistorial, setChoferHistorial] = useState([]);
  const [pasajeroActivos, setPasajeroActivos] = useState([]);
  const [pasajeroHistorial, setPasajeroHistorial] = useState([]);

  // PROCESAR VIAJES DE FORMA SEGURA (SIN BLOQUEAR LA PANTALLA)
  useEffect(() => {
    try {
      const arr = getSafeArray(viajesChofer).filter(v => v && v.id);
      
      const activos = arr.filter(v => v.estado !== 'finalizado' && v.estado !== 'cancelado');
      activos.sort((a, b) => {
        const impA = (a.estado === 'en_curso' || a.estado === 'buscando') ? 3 : (getSafeArray(a.reservasPendientes).length > 0 ? 2 : (getSafeArray(a.pasajeros).length > 0 && a.estado === 'disponible' ? 1 : 0));
        const impB = (b.estado === 'en_curso' || b.estado === 'buscando') ? 3 : (getSafeArray(b.reservasPendientes).length > 0 ? 2 : (getSafeArray(b.pasajeros).length > 0 && b.estado === 'disponible' ? 1 : 0));
        return impB - impA;
      });
      setChoferActivos(activos);

      const historial = arr.filter(v => v.estado === 'finalizado' || v.estado === 'cancelado');
      historial.sort((a, b) => {
        const tA = new Date(a.fecha || a.fechaSalida || 0).getTime() || 0;
        const tB = new Date(b.fecha || b.fechaSalida || 0).getTime() || 0;
        return tB - tA;
      });
      setChoferHistorial(historial);
    } catch (e) { console.error(e); }
  }, [viajesChofer]);

  useEffect(() => {
    try {
      const arrActivos = getSafeArray(viajesPasajeroActivos).filter(v => v && v.id);
      const arrHistorial = getSafeArray(viajesPasajeroHistorial).filter(v => v && v.id);
      
      // Expulsamos a los cancelados de la lista de activos reales
      const pActivos = arrActivos.filter(v => v.estado !== 'finalizado' && v.estado !== 'cancelado');
      setPasajeroActivos(pActivos);

      // Metemos los cancelados en el historial
      const pColados = arrActivos.filter(v => v.estado === 'finalizado' || v.estado === 'cancelado');
      
      const mapIds = {};
      const pHistorial = [];
      [...pColados, ...arrHistorial].forEach(v => {
        if (!mapIds[v.id]) {
          mapIds[v.id] = true;
          pHistorial.push(v);
        }
      });

      pHistorial.sort((a, b) => {
        const tA = new Date(a.fecha || a.fechaSalida || 0).getTime() || 0;
        const tB = new Date(b.fecha || b.fechaSalida || 0).getTime() || 0;
        return tB - tA;
      });
      setPasajeroHistorial(pHistorial);
    } catch (e) { console.error(e); }
  }, [viajesPasajeroActivos, viajesPasajeroHistorial]);

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
    } catch (error) { setToastData({ show: true, message: 'Error de red al guardar' }); }
  };

  const handleArchivarViaje = async (viajeId) => {
    try {
      await updateDoc(doc(db, "Viajes", viajeId), { estado: 'cancelado' });
      if (onActualizarViajeFBD) await onActualizarViajeFBD({ id: viajeId, estado: 'cancelado' });
      setToastData({ show: true, message: 'Viaje archivado en el historial' });
    } catch (error) { setToastData({ show: true, message: 'Error de red al archivar' }); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Toast show={toastData.show} message={toastData.message} onClose={() => setToastData({ show: false, message: '' })} />
      {editingViaje && <ModalEditarViaje viaje={editingViaje} isOpen={true} onClose={() => setEditingViaje(null)} onSave={handleEditSave}/>}

      {/* Capa z-30 para no pisar la campana */}
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
