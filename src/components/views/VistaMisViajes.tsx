import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Toast from "../ui/Toast";
import { 
  ArrowLeft, Edit2, Calendar, Clock, Users, 
  X, Repeat, ArrowLeftRight, Settings, Info, Check, Star, Navigation, Archive
} from 'lucide-react';
import MapaView from '../Map/MapaView'; 

// --- 1. AYUDANTES ULTRA-SEGUROS ---
const extractText = (val, fallback) => typeof val === 'string' && val.trim() !== '' ? val.split(',')[0] : fallback;

const formatearFechaCorta = (fechaStr) => {
  try {
    if (!fechaStr || typeof fechaStr !== 'string') return "Sin fecha";
    const p = fechaStr.split('-');
    if (p.length !== 3) return fechaStr;
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''); 
  } catch (e) { return "Sin fecha"; }
};

const formatearHora12h = (horaStr) => {
  try {
    if (!horaStr || typeof horaStr !== 'string') return "Sin hora";
    const [h, m] = horaStr.split(':');
    const horas = parseInt(h, 10);
    if (isNaN(horas)) return horaStr;
    return `${horas % 12 || 12}:${m} ${horas >= 12 ? 'PM' : 'AM'}`;
  } catch (e) { return "Sin hora"; }
};

// --- HELPER: DETECTAR VIAJE EXPIRADO/FANTASMA ---
const esViajeFantasma = (viaje) => {
  try {
    const estado = String(viaje.estado || 'disponible');
    if (estado === 'en_curso' || estado === 'buscando' || estado === 'finalizado' || estado === 'cancelado') return false;
    if (Array.isArray(viaje.pasajeros) && viaje.pasajeros.length > 0) return false;

    const fecha = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.fechaSalida || viaje.fecha) : (viaje.fecha || viaje.fechaSalida);
    const hora = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.horaSalida || viaje.hora) : (viaje.hora || viaje.horaSalida);
    if (!fecha || !hora) return false;

    const [year, month, day] = fecha.split('-');
    const [hour, minute] = hora.split(':');
    const fechaViaje = new Date(year, month - 1, day, hour, minute);
    
    return new Date() > fechaViaje; 
  } catch (e) {
    return false;
  }
};


// --- 2. MODAL DE EDICIÓN ---
const ModalEditarViaje = ({ viaje, isOpen, onClose, onSave }) => {
  if (!isOpen || !viaje) return null;
  const fechaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.fechaSalida || viaje.fecha) : (viaje.fecha || viaje.fechaSalida);
  const horaActual = viaje.tipoRuta === 'vuelta_de_ruta' ? (viaje.horaSalida || viaje.hora) : (viaje.hora || viaje.horaSalida);

  const [formData, setFormData] = useState({ fechaForm: fechaActual || '', horaForm: horaActual || '', precio: viaje.precio || '', asientos: viaje.asientos || viaje.puestos || '' });
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.name === 'precio' || e.target.name === 'asientos' ? parseInt(e.target.value) || '' : e.target.value }));

  return (
    <div className="fixed inset-0 bg-[#1F2937]/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[35px] shadow-2xl p-8 relative border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[#1F2937] transition-colors"><X size={24} /></button>
        <h3 className="text-center text-xs font-black text-[#063971] uppercase tracking-[4px] mb-8">Editar Mi Viaje</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label>
              <input type="date" name="fechaForm" value={formData.fechaForm} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-[#1F2937] rounded-xl p-3.5 text-sm font-bold outline-none focus:border-[#063971]/50 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hora</label>
              <input type="time" name="horaForm" value={formData.horaForm} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-[#1F2937] rounded-xl p-3.5 text-sm font-bold outline-none focus:border-[#063971]/50 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo ($)</label>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-[#10B981] rounded-xl p-3.5 text-sm font-bold outline-none focus:border-[#10B981]/50 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Puestos</label>
              <input type="number" name="asientos" value={formData.asientos} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-[#1F2937] rounded-xl p-3.5 text-sm font-bold outline-none focus:border-[#063971]/50 transition-colors" />
            </div>
          </div>
          <button onClick={() => onSave({ id: viaje.id, tipoRuta: viaje.tipoRuta, ...formData })} className="w-full bg-[#063971] text-white rounded-full p-4 font-black uppercase text-xs tracking-[3px] shadow-lg shadow-[#063971]/30 active:scale-95 transition-all mt-4 hover:bg-blue-800">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

// --- 3. TARJETA CHOFER ---
const ViajeCardChofer = ({ viaje, onEdit, onArchivar, onClickGestionar }) => {
  if (!viaje) return null;
  
  // Detectamos si el viaje expiró vacío
  const expiradoVacio = esViajeFantasma(viaje);
  let estado = String(viaje.estado || 'disponible');
  
  // Si ya expiró, forzamos visualmente a que esté cancelado/agotado
  if (expiradoVacio && estado === 'disponible') estado = 'expirado';

  const esActivo = estado !== 'finalizado' && estado !== 'cancelado' && estado !== 'expirado';
  const esCancelado = estado === 'cancelado' || estado === 'expirado';
  const esFinalizado = estado === 'finalizado';
  const estaEnCurso = estado === 'en_curso' || estado === 'buscando';
  const esRetorno = viaje.tipoRuta === 'vuelta_de_ruta';
  
  let totalPasajeros = 0;
  if (Array.isArray(viaje.pasajeros)) totalPasajeros = viaje.pasajeros.length;
  const solicitudes = Array.isArray(viaje.reservasPendientes) ? viaje.reservasPendientes.length : 0;
  const botonNaranja = esActivo && (solicitudes > 0 || estaEnCurso || totalPasajeros > 0);

  return (
    <div className={`bg-white p-6 rounded-[30px] border shadow-sm relative space-y-4 transition-colors ${esActivo ? 'border-slate-100 hover:border-[#063971]/20' : 'border-slate-200 opacity-80'}`}>
      
      {/* ETIQUETA DINÁMICA CON EL ESTADO REAL */}
      <div className={`absolute top-6 right-6 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest z-20 ${estaEnCurso ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : esFinalizado ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' : estado === 'expirado' ? 'bg-red-50 border-red-200 text-red-500' : esCancelado ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[#063971]/10 border-[#063971]/20 text-[#063971]'}`}>
          {estaEnCurso ? 'EN CURSO' : esFinalizado ? 'FINALIZADO' : estado === 'expirado' ? 'TIEMPO AGOTADO' : esCancelado ? 'CANCELADO' : 'DISPONIBLE'}
      </div>

      {esRetorno && <div className="absolute top-6 left-6 text-[#10B981] flex items-center gap-1.5 z-20"><Repeat size={14} className='-rotate-90'/><span className="text-[9px] font-black uppercase tracking-widest">RETORNO</span></div>}

      <div className="h-32 rounded-2xl overflow-hidden mb-2 relative pointer-events-none bg-slate-100">
         <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent z-10" />
         {viaje.coordsOrigen && viaje.coordsDestino && <MapaView origen={viaje.coordsOrigen} destino={viaje.coordsDestino} interactivo={false} />}
      </div>

      <div className="flex justify-between items-start pt-2">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo ($)</p>
          <p className="text-4xl font-black italic text-[#10B981] leading-none">${viaje.precio || '0'}</p>
        </div>
        {esActivo && <button onClick={onEdit} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 hover:text-[#063971] hover:bg-[#063971]/5 transition-colors"><Edit2 size={16} /></button>}
      </div>

      <div className="flex items-center gap-4 text-center">
        <div className='flex-1'><p className="text-[11px] font-bold text-[#1F2937] uppercase italic truncate">{extractText(viaje.cO || viaje.origen, "Origen")}</p><p className="text-[7px] font-black text-slate-400 uppercase">Salida</p></div>
        <ArrowLeftRight className='text-slate-300 shrink-0' size={18}/>
        <div className='flex-1'><p className="text-[11px] font-bold text-[#1F2937] uppercase italic truncate">{extractText(viaje.cD || viaje.destino, "Destino")}</p><p className="text-[7px] font-black text-slate-400 uppercase">Llegada</p></div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2.5"><Calendar size={16} className="text-[#063971]"/><p className="text-xs font-bold text-[#1F2937] capitalize">{formatearFechaCorta(viaje.fechaSalida || viaje.fecha)}</p></div>
        <div className="flex items-center gap-2.5"><Clock size={16} className="text-[#063971]"/><p className="text-xs font-bold text-[#1F2937]">{formatearHora12h(viaje.horaSalida || viaje.hora)}</p></div>
        <div className="flex items-center gap-2.5 col-span-2"><Users size={16} className="text-[#063971]"/><p className="text-xs font-bold text-[#1F2937]">{totalPasajeros} / {viaje.asientos || viaje.puestos || 1} Confirmados</p></div>
      </div>

      {/* BOTÓN DINÁMICO */}
      <button disabled={esCancelado || esFinalizado} onClick={() => onClickGestionar(viaje)}
        className={`w-full mt-4 rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 transition-all shadow-lg ${
          (esCancelado || esFinalizado) ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none' : 
          botonNaranja ? 'bg-orange-500 text-white shadow-orange-500/40 animate-pulse active:scale-95' :
          esActivo ? 'bg-[#063971] text-white shadow-[#063971]/30 active:scale-95' : 
          'bg-[#1F2937] text-white shadow-[#1F2937]/30 active:scale-95'
        }`}>
        {estado === 'expirado' ? <><Archive size={16} /> Tiempo Agotado</> 
        : esCancelado ? <><Archive size={16} /> Viaje Cancelado</> 
        : esFinalizado ? <><Check size={16} /> Viaje Finalizado</>
        : (solicitudes > 0 && esActivo) ? <><Info size={18} /> ¡Tienes {solicitudes} solicitud{solicitudes > 1 ? 'es' : ''}!</>
        : estaEnCurso ? <><Navigation size={16} /> VIAJE ACTIVO - GESTIONAR</>
        : (totalPasajeros > 0 && esActivo) ? <><Users size={16} /> Pasajeros Confirmados</>
        : <><Settings size={16} /> Gestionar Viaje</>}
      </button>
    </div>
  );
};


// --- 4. TARJETA PASAJERO ---
const ViajeCardPasajero = ({ viaje, onClickGestionar, userData }) => {
  if (!viaje) return null;

  // 🔥 1. Aplicamos la misma lógica para saber si el tiempo se agotó
  const expiradoVacio = esViajeFantasma(viaje);
  let estado = String(viaje.estado || 'disponible');
  
  // Si expiró, forzamos visualmente a que diga agotado
  if (expiradoVacio && estado === 'disponible') estado = 'expirado';

  const esActivo = estado !== 'finalizado' && estado !== 'cancelado' && estado !== 'expirado';
  const esCancelado = estado === 'cancelado' || estado === 'expirado';
  const esFinalizado = estado === 'finalizado';
  
  const origen = extractText(viaje.cO || viaje.origen, "Origen");
  const destino = extractText(viaje.cD || viaje.destino, "Destino");
  const conductor = extractText(viaje.cN || viaje.conductor, "Conductor");
  const precio = String(viaje.precio || '0');

  let esConfirmado = false;
  let yaCalifico = false;
  if (viaje.pasajeros) {
    try {
      const arr = Array.isArray(viaje.pasajeros) ? viaje.pasajeros : Object.values(viaje.pasajeros);
      const miReserva = arr.find(p => p && p.id === userData?.id);
      if (miReserva) {
        esConfirmado = true;
        yaCalifico = miReserva.calificado === true;
      }
    } catch(e) {}
  }

  return (
    <div className={`bg-white p-5 rounded-3xl shadow-sm border mb-4 relative transition-colors ${esConfirmado && esActivo ? 'border-[#063971]/30 hover:border-[#063971]/50' : esActivo ? 'border-slate-100 hover:border-[#063971]/20' : 'border-slate-200 opacity-80'}`}>
      
      <div className="flex justify-between items-center mb-4">
         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${esActivo ? 'bg-[#063971]/10 text-[#063971]' : estado === 'expirado' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
            {esActivo ? 'ACTIVO' : estado === 'expirado' ? 'TIEMPO AGOTADO' : esCancelado ? 'CANCELADO' : 'FINALIZADO'}
         </span>
         <span className={`text-2xl font-black italic ${esActivo || esFinalizado ? 'text-[#10B981]' : 'text-slate-400'}`}>${precio}</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
         <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
           {typeof viaje.fotoPerfil === 'string' && viaje.fotoPerfil.startsWith('http') ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <Users size={20} className="text-slate-400" />}
         </div>
         <div className="flex-1 min-w-0">
           <p className={`font-black text-sm uppercase truncate ${esActivo || esFinalizado ? 'text-[#1F2937]' : 'text-slate-500'}`}>{conductor}</p>
           <p className="text-[9px] font-black text-[#063971] uppercase">Chofer Designado</p>
         </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-center gap-2 mb-4 border border-slate-100">
         <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-[#1F2937] uppercase truncate">{origen}</p></div>
         <ArrowLeftRight size={14} className="text-slate-300 shrink-0" />
         <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-[#1F2937] uppercase truncate">{destino}</p></div>
      </div>

      {esActivo ? (
        <button onClick={() => onClickGestionar(viaje)} className={`w-full rounded-full p-4 font-black uppercase text-xs tracking-[2px] flex items-center justify-center gap-2 transition-all ${esConfirmado ? 'bg-[#063971] text-white shadow-lg shadow-[#063971]/30 active:scale-95' : 'bg-white text-slate-500 border border-slate-200 hover:text-[#063971] hover:border-[#063971]/30'}`}>
            {esConfirmado ? <><Check size={16} /> Ver Detalles / PIN</> : <><Info size={16} /> Esperando Confirmación</>}
        </button>
      ) : estado === 'expirado' ? (
        <button disabled className="w-full bg-slate-100 text-slate-400 rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2">
            <Archive size={16} /> Tiempo Agotado
        </button>
      ) : esCancelado ? (
        <button disabled className="w-full bg-slate-100 text-slate-400 rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2">
            <Archive size={16} /> Viaje Cancelado
        </button>
      ) : (
        <button onClick={() => onClickGestionar(viaje)} className={`w-full rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2 transition-all ${yaCalifico ? 'bg-slate-100 text-slate-400' : 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/30 active:scale-95'}`}>
            {yaCalifico ? <><Check size={16} /> Ya Calificado</> : <><Star size={16} /> Calificar Chofer</>}
        </button>
      )}
    </div>
  );
};


// --- 5. COMPONENTE PRINCIPAL ---
export const VistaMisViajes = ({ 
  viajesChofer = [], viajesPasajeroActivos = [], viajesPasajeroHistorial = [], 
  userData, onRegresar, onActualizarViajeFBD, onVerDetalles 
}) => {
  const [activeTab, setActiveTab] = useState('chofer'); 
  const [subTabChofer, setSubTabChofer] = useState('activos'); 
  const [subTabPasajero, setSubTabPasajero] = useState('activos'); 
  const [editingViaje, setEditingViaje] = useState(null);
  const [toastData, setToastData] = useState({ show: false, message: '' });


  let cActivos = []; let cHistorial = [];
  let pActivos = []; let pHistorial = [];

  try {
    const listC = Array.isArray(viajesChofer) ? viajesChofer : [];
    listC.forEach(v => {
      if (v && v.id) {
        const est = String(v.estado || 'disponible');
        const expiradoVacio = esViajeFantasma(v);
        
        // Si finalizó, canceló, o es un "fantasma", va al historial
        if (est === 'finalizado' || est === 'cancelado' || expiradoVacio) {
          cHistorial.push(v);
        } else {
          cActivos.push(v);
        }
      }
    });
  } catch (e) {}

  try {
    const arrAct = Array.isArray(viajesPasajeroActivos) ? viajesPasajeroActivos : [];
    const arrHist = Array.isArray(viajesPasajeroHistorial) ? viajesPasajeroHistorial : [];
    
    const todos = [...arrAct, ...arrHist];
    const unicos = {};
    todos.forEach(v => { if (v && v.id) unicos[v.id] = v; });

    Object.values(unicos).forEach(v => {
      const est = String(v.estado || 'disponible');
      // Para el pasajero la regla es igual
      if (est === 'finalizado' || est === 'cancelado') {
        pHistorial.push(v);
      } else {
        pActivos.push(v);
      }
    });
  } catch (e) {}

  const handleEditSave = async (updatedViaje) => {
    try {
      const datosNuevos = {
        precio: Number(updatedViaje.precio), asientos: Number(updatedViaje.asientos), puestos: Number(updatedViaje.asientos), 
        fecha: updatedViaje.fechaForm, hora: updatedViaje.horaForm,
        ...(updatedViaje.tipoRuta === 'vuelta_de_ruta' ? { fechaRegreso: updatedViaje.fechaForm, horaRegreso: updatedViaje.horaForm } : { fechaSalida: updatedViaje.fechaForm, horaSalida: updatedViaje.horaForm })
      };
      await updateDoc(doc(db, "Viajes", updatedViaje.id), datosNuevos);
      if (onActualizarViajeFBD) await onActualizarViajeFBD({ ...updatedViaje, ...datosNuevos });
      setEditingViaje(null); setToastData({ show: true, message: 'Actualizado' });
    } catch (error) { setToastData({ show: true, message: 'Error al guardar' }); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Toast show={toastData.show} message={toastData.message} onClose={() => setToastData({ show: false, message: '' })} />
      {editingViaje && <ModalEditarViaje viaje={editingViaje} isOpen={true} onClose={() => setEditingViaje(null)} onSave={handleEditSave}/>}

      <div className="p-4 pt-8 bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onRegresar} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-[#063971] hover:bg-[#063971]/5 active:scale-90 transition-all border border-slate-100"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-black italic text-[#1F2937] tracking-tight uppercase">Mis Rutas</h2>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-full relative shadow-inner">
          <div className={`absolute top-1.5 bottom-1.5 bg-[#063971] rounded-full transition-all duration-300 shadow-sm ${activeTab === 'pasajero' ? 'left-[calc(50%+3px)] w-[calc(50%-6px)]' : 'left-1.5 w-[calc(50%-6px)]'}`} />
          <button onClick={() => setActiveTab('chofer')} className={`relative flex-1 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all z-10 ${activeTab === 'chofer' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>Como Chofer</button>
          <button onClick={() => setActiveTab('pasajero')} className={`relative flex-1 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all z-10 ${activeTab === 'pasajero' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>Como Pasajero</button>
        </div>
      </div>

      <div className="flex-1 p-4 pb-24 overflow-y-auto">
        {activeTab === 'chofer' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex bg-white p-1 rounded-full mb-6 max-w-[220px] mx-auto border border-slate-200 shadow-sm">
              <button onClick={() => setSubTabChofer('activos')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabChofer === 'activos' ? 'bg-[#1F2937] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Activos</button>
              <button onClick={() => setSubTabChofer('historial')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabChofer === 'historial' ? 'bg-[#1F2937] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Historial</button>
            </div>
            {subTabChofer === 'activos' ? (
              cActivos.length > 0 ? cActivos.map(v => <ViajeCardChofer key={v.id} viaje={v} onEdit={() => setEditingViaje(v)} onArchivar={() => {}} onClickGestionar={onVerDetalles} />)
              : <div className="text-center py-20 opacity-60"><Navigation size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sin rutas activas</p></div>
            ) : (
              cHistorial.length > 0 ? cHistorial.map(v => <ViajeCardChofer key={v.id} viaje={v} onEdit={() => {}} onArchivar={() => {}} onClickGestionar={onVerDetalles} />)
              : <div className="text-center py-20 opacity-60"><Archive size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Historial Vacío</p></div>
            )}
          </div>
        )}

        {activeTab === 'pasajero' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex bg-white p-1 rounded-full mb-6 max-w-[220px] mx-auto border border-slate-200 shadow-sm">
              <button onClick={() => setSubTabPasajero('activos')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabPasajero === 'activos' ? 'bg-[#1F2937] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Activos</button>
              <button onClick={() => setSubTabPasajero('historial')} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${subTabPasajero === 'historial' ? 'bg-[#1F2937] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Historial</button>
            </div>
            {subTabPasajero === 'activos' ? (
              pActivos.length > 0 ? pActivos.map(v => <ViajeCardPasajero key={v.id} viaje={v} userData={userData} onClickGestionar={onVerDetalles} />)
              : <div className="text-center py-20 opacity-60"><Users size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sin reservas activas</p></div>
            ) : (
              pHistorial.length > 0 ? pHistorial.map(v => <ViajeCardPasajero key={v.id} viaje={v} userData={userData} onClickGestionar={onVerDetalles} />)
              : <div className="text-center py-20 opacity-60"><Archive size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sin historial de viajes</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
