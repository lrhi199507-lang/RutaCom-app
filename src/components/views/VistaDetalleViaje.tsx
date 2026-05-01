import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import PerfilPublico from './PerfilPublico';
import Toast from "../ui/Toast";
import { 
  ArrowLeft, MapPin, User, ShieldCheck, 
  MessageCircle, Repeat, ChevronRight, Snowflake, CigaretteOff, Dog, Check, X, Map, Key, Lock, Unlock
} from 'lucide-react';
import { UBICACIONES } from "../../constants/ubicaciones";

const obtenerEstado = (ciudadNombre) => {
  if (!ciudadNombre) return "Estado";
  const [soloCiudad] = ciudadNombre.split(',');
  const estadoEncontrado = Object.keys(UBICACIONES).find(estado => UBICACIONES[estado].includes(soloCiudad.trim()));
  return estadoEncontrado || "Venezuela";
};

const formatearFechaHoraRetorno = (fechaString, horaString) => {
  if (!fechaString) return "";
  const partes = fechaString.split('-');
  if (partes.length !== 3) return fechaString;
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  const f = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase()); 
  if (!horaString) return f;
  const [horas, minutos] = horaString.split(':');
  const h = parseInt(horas);
  return `${f} a las ${h % 12 || 12}:${minutos} ${h >= 12 ? 'PM' : 'AM'}`;
};

const obtenerIconoEquipaje = (tipo) => {
  switch(tipo?.toLowerCase()) {
    case 'maleta': return '🧳';
    case 'caja': return '📦';
    default: return '🎒';
  }
};

export const VistaDetalleViaje = ({ viaje: viajeInicial, onRegresar, userData, onIniciarChat }) => {
  if (!viajeInicial) return null;
  
  const [viaje, setViaje] = useState(viajeInicial);
  const [verPerfil, setVerPerfil] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [cargando, setCargando] = useState(false);
  
  // NUEVOS ESTADOS PARA EL PIN Y ABORDAJE
  const [modalAbordaje, setModalAbordaje] = useState(false);
  const [pinesIngresados, setPinesIngresados] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "Viajes", viajeInicial.id), (docSnap) => {
      if (docSnap.exists()) setViaje({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsub();
  }, [viajeInicial.id]);

  const soyConductor = viaje.uidConductor === userData?.id || viaje.idCreador === userData?.id;
  const estadoViaje = viaje.estado || "disponible"; 
  
  const pasajerosConfirmados = viaje.pasajeros || [];
  const solicitudesPendientes = viaje.reservasPendientes || [];
  const puestosTotales = viaje.asientos || viaje.puestos || 1;
  const cuposRestantes = puestosTotales - pasajerosConfirmados.length;

  const yaSolicite = solicitudesPendientes.some(p => p.id === userData.id);
  const miReserva = pasajerosConfirmados.find(p => p.id === userData.id);
  const yaSoyPasajero = !!miReserva;
  const mostrarBannerRetorno = viaje.publicarRegreso && viaje.tipoRuta !== 'vuelta_de_ruta';

  const solicitarCola = async () => {
    if (cuposRestantes <= 0) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "Viajes", viaje.id), {
        reservasPendientes: arrayUnion({ id: userData.id, nombre: userData.nombre, fotoPerfil: userData.fotoPerfil || null, estado: 'pendiente' })
      });
      setToastMessage("Solicitud enviada al conductor"); setShowToast(true);
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const cancelarSolicitud = async () => {
    setCargando(true);
    try {
      const pasajeroAborrar = solicitudesPendientes.find(p => p.id === userData.id);
      if (pasajeroAborrar) await updateDoc(doc(db, "Viajes", viaje.id), { reservasPendientes: arrayRemove(pasajeroAborrar) });
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const gestionarSolicitud = async (solicitud, accion) => {
    setCargando(true);
    try {
      const viajeRef = doc(db, "Viajes", viaje.id);
      if (accion === 'aceptar') {
        if (cuposRestantes <= 0) { alert("Ya no tienes puestos disponibles."); setCargando(false); return; }
        
        // MAGIA: GENERAMOS EL PIN ALEATORIO DE 4 DÍGITOS
        const pinGenerado = Math.floor(1000 + Math.random() * 9000).toString();
        
        await updateDoc(viajeRef, {
          reservasPendientes: arrayRemove(solicitud),
          pasajeros: arrayUnion({ ...solicitud, estado: 'confirmado', pin: pinGenerado, abordado: false })
        });
      } else {
        await updateDoc(viajeRef, { reservasPendientes: arrayRemove(solicitud) });
      }
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  // NUEVA FUNCIÓN: INICIAR VIAJE CON VALIDACIÓN DE PINES
  const procesarAbordajeEIniciar = async () => {
    setCargando(true);
    try {
      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (pinesIngresados[p.id] === p.pin) return { ...p, abordado: true };
        return p;
      });

      await updateDoc(doc(db, "Viajes", viaje.id), { 
        estado: 'en_curso',
        pasajeros: pasajerosActualizados
      });
      setModalAbordaje(false);
      setToastMessage("¡Viaje Iniciado Correctamente!"); setShowToast(true);
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const cambiarEstadoViaje = async (nuevoEstado) => {
    if (!window.confirm(`¿Seguro que deseas FINALIZAR el viaje?`)) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "Viajes", viaje.id), { estado: nuevoEstado });
      if (nuevoEstado === 'finalizado') onRegresar(); 
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative font-sans">
      <div className="flex-1 overflow-y-auto pb-48">
        
        <div className="p-4 pt-6 flex justify-between items-center">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
          {estadoViaje === 'en_curso' && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
              <Map size={10} /> En Curso
            </div>
          )}
        </div>

        <div className="px-5 space-y-4">
          
          <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Total</p>
                <div className="flex items-start text-blue-600">
                  <span className="text-xl font-black italic mt-1">$</span>
                  <span className="text-5xl font-black italic leading-none">{viaje.precio || "0"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-600"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /></div>
                <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">{viaje.cO}</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje.cO)}</p>
              </div>
              <div className="flex-1 px-2"><div className="w-full h-[2px] bg-blue-600 rounded-full" /></div>
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-200"><MapPin size={16} className="text-slate-300" /></div>
                <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">{viaje.cD}</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje.cD)}</p>
              </div>
            </div>
          </div>

          {mostrarBannerRetorno && (
            <div className="bg-emerald-50 p-5 rounded-[30px] border border-emerald-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Repeat size={18} className="text-emerald-600" /></div>
              <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">CON RETORNO PROGRAMADO</p>
                <p className="text-sm font-bold text-emerald-900 mt-1">Regresa el {formatearFechaHoraRetorno(viaje.fechaRegreso || viaje.fechaRetorno, viaje.horaRegreso || viaje.horaRetorno)}</p>
              </div>
            </div>
          )}

          {/* VISTA DEL PIN PARA EL PASAJERO (SOLO SI FUE ACEPTADO) */}
          {yaSoyPasajero && !soyConductor && estadoViaje === 'disponible' && (
            <div className="bg-slate-900 p-6 rounded-[35px] shadow-lg border border-slate-800 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
              <div className="bg-blue-500/20 p-3 rounded-full mb-3"><Key size={24} className="text-blue-400" /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tu PIN de abordaje</p>
              <p className="text-5xl font-black italic text-white tracking-[5px] leading-none mb-4">{miReserva.pin}</p>
              <div className="bg-slate-800 text-slate-300 text-[10px] font-bold uppercase px-4 py-2 rounded-xl">Dáselo al chofer al subir al vehículo</div>
            </div>
          )}

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

          <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PUESTOS ({pasajerosConfirmados.length}/{puestosTotales})</p>
              {cuposRestantes === 0 && <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-2 py-1 rounded-md">Lleno</span>}
            </div>
            
            <div className="space-y-3">
              {pasajerosConfirmados.map((pasajero, index) => (
                  <div key={index} className="border-2 border-blue-100 bg-blue-50/20 p-4 rounded-[25px] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                          {pasajero.fotoPerfil ? <img src={pasajero.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-300" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700 uppercase">{pasajero.nombre}</p>
                        {pasajero.abordado && <span className="text-[8px] font-black text-green-600 uppercase">Ya a bordo</span>}
                      </div>
                      {pasajero.abordado ? <ShieldCheck size={16} className="text-green-500" /> : <Lock size={14} className="text-slate-300" />}
                  </div>
              ))}
              
              {[...Array(Math.max(0, cuposRestantes))].map((_, index) => (
                <div key={`empty-${index}`} className="border border-slate-100 border-dashed p-4 rounded-[25px] flex items-center gap-4 bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center"><User size={18} className="text-slate-300" /></div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ASIENTO DISPONIBLE</p>
                </div>
              ))}
            </div>
          </div>

          {soyConductor && solicitudesPendientes.length > 0 && estadoViaje === 'disponible' && (
            <div className="bg-orange-50 p-6 rounded-[35px] border-2 border-orange-200 shadow-sm space-y-4 animate-in slide-in-from-bottom">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Nuevas Solicitudes</p>
              {solicitudesPendientes.map((solicitud, index) => (
                <div key={index} className="bg-white p-4 rounded-[25px] flex items-center gap-3 border border-orange-100 shadow-sm">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100">
                     {solicitud.fotoPerfil ? <img src={solicitud.fotoPerfil} className="w-full h-full object-cover"/> : <User size={20} className="m-auto mt-3 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase text-slate-800 truncate">{solicitud.nombre}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">Quiere viajar contigo</p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'rechazar')} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-all"><X size={16} strokeWidth={3} /></button>
                    <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'aceptar')} className="w-10 h-10 bg-green-500 text-white shadow-lg shadow-green-200 rounded-full flex items-center justify-center active:scale-90 transition-all"><Check size={16} strokeWidth={3} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/90 backdrop-blur-md border-t border-slate-100 z-[60] max-w-md mx-auto">
        <div className="flex gap-3 h-14">
          <button onClick={() => onIniciarChat(viaje)} className="flex-1 bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <MessageCircle size={16} /> Chat
          </button>

          {soyConductor ? (
             estadoViaje === 'disponible' ? (
                <button disabled={cargando || pasajerosConfirmados.length === 0} onClick={() => setModalAbordaje(true)} className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all disabled:bg-slate-300">
                  {pasajerosConfirmados.length === 0 ? 'Sin Pasajeros' : 'Iniciar Viaje'}
                </button>
             ) : estadoViaje === 'en_curso' ? (
                <button disabled={cargando} onClick={() => cambiarEstadoViaje('finalizado')} className="flex-[2] bg-red-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                  Finalizar Viaje
                </button>
             ) : (
                <div className="flex-[2] bg-slate-100 text-slate-400 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center border border-slate-200">
                  Viaje Finalizado
                </div>
             )
          ) : (
            yaSoyPasajero ? (
              <div className="flex-[2] bg-green-500 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg"><Check size={16} /> Puesto Confirmado</div>
            ) : yaSolicite ? (
              <button disabled={cargando} onClick={cancelarSolicitud} className="flex-[2] bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center shadow-inner transition-all active:scale-95">Cancelar Solicitud</button>
            ) : cuposRestantes > 0 ? (
              <button disabled={cargando} onClick={solicitarCola} className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Pedir Cola</button>
            ) : (
              <button disabled className="flex-[2] bg-slate-200 text-slate-400 rounded-[22px] font-black uppercase text-[10px]">Viaje Lleno</button>
            )
          )}
        </div>
      </div>

      {/* NUEVO MODAL DE ABORDAJE (VALIDACIÓN PIN) */}
      {modalAbordaje && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-slate-800">Verificación de Abordaje</h3>
              <button onClick={() => setModalAbordaje(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            
            <p className="text-xs font-bold text-slate-500 mb-6">Solicita el PIN secreto a tus pasajeros para confirmar que están en el auto.</p>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-6">
              {pasajerosConfirmados.map(p => {
                const pinCorrecto = pinesIngresados[p.id] === p.pin;
                return (
                  <div key={p.id} className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 ${pinCorrecto ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                         {p.fotoPerfil ? <img src={p.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="m-auto mt-2 text-slate-400" />}
                      </div>
                      <p className="flex-1 text-xs font-black uppercase text-slate-700 truncate">{p.nombre}</p>
                      {pinCorrecto ? <Unlock size={18} className="text-green-500" /> : <Lock size={18} className="text-slate-400" />}
                    </div>
                    
                    {!pinCorrecto ? (
                       <input 
                         type="number" 
                         placeholder="Ingresar PIN de 4 dígitos"
                         value={pinesIngresados[p.id] || ''}
                         onChange={(e) => setPinesIngresados({...pinesIngresados, [p.id]: e.target.value})}
                         className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-center text-lg font-black tracking-[10px] outline-none focus:border-blue-500"
                         maxLength={4}
                       />
                    ) : (
                      <div className="bg-green-500 text-white text-[10px] font-black uppercase text-center py-2 rounded-xl">Pasajero Validado</div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={procesarAbordajeEIniciar} className="w-full bg-blue-600 text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
              Confirmar e Iniciar Viaje
            </button>
          </div>
        </div>
      )}

      {verPerfil && <PerfilPublico conductor={{ ...viaje, identidadVerificada: true }} onClose={() => setVerPerfil(false)} setToastMessage={setToastMessage} setShowToast={setShowToast} />}
      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    </div>
  );
};
