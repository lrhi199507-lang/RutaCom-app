import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, onSnapshot, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import PerfilPublico from './PerfilPublico';
import Toast from "../ui/Toast";
import { 
  ArrowLeft, MapPin, User, ShieldCheck, 
  MessageCircle, Repeat, ChevronRight, Snowflake, CigaretteOff, Dog, Check, X, Map
} from 'lucide-react';
import { UBICACIONES } from "../../constants/ubicaciones";

// FUNCIONES DE APOYO
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
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '').replace(/^\w/, (c) => c.toUpperCase()); 
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
    case 'bolso': case 'bolso ligero': default: return '🎒';
  }
};

export const VistaDetalleViaje = ({ viaje: viajeInicial, onRegresar, userData, onIniciarChat }) => {
  if (!viajeInicial) return null;
  
  // ESTADOS
  const [viaje, setViaje] = useState(viajeInicial); // <-- Ahora escuchamos el viaje en tiempo real
  const [verPerfil, setVerPerfil] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [cargando, setCargando] = useState(false);

  // ESCUCHA EN TIEMPO REAL A LA BASE DE DATOS
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "Viajes", viajeInicial.id), (docSnap) => {
      if (docSnap.exists()) {
        setViaje({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, [viajeInicial.id]);

  // VARIABLES LÓGICAS
  const soyConductor = viaje.uidConductor === userData?.id || viaje.idCreador === userData?.id;
  const estadoViaje = viaje.estado || "disponible"; // disponible -> en_curso -> finalizado
  
  const pasajerosConfirmados = viaje.pasajeros || [];
  const solicitudesPendientes = viaje.reservasPendientes || [];
  const puestosTotales = viaje.asientos || viaje.puestos || 1;
  const cuposRestantes = puestosTotales - pasajerosConfirmados.length;

  const yaSolicite = solicitudesPendientes.some(p => p.id === userData.id);
  const yaSoyPasajero = pasajerosConfirmados.some(p => p.id === userData.id);
  const mostrarBannerRetorno = viaje.publicarRegreso && viaje.tipoRuta !== 'vuelta_de_ruta';

  // --- LÓGICA DEL PASAJERO ---
  const solicitarCola = async () => {
    if (cuposRestantes <= 0) return;
    setCargando(true);
    try {
      const pasajeroData = {
        id: userData.id,
        nombre: userData.nombre,
        fotoPerfil: userData.fotoPerfil || null,
        estado: 'pendiente'
      };
      await updateDoc(doc(db, "Viajes", viaje.id), {
        reservasPendientes: arrayUnion(pasajeroData)
      });
      setToastMessage("Solicitud enviada al conductor");
      setShowToast(true);
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const cancelarSolicitud = async () => {
    setCargando(true);
    try {
      const pasajeroAborrar = solicitudesPendientes.find(p => p.id === userData.id);
      if (pasajeroAborrar) {
        await updateDoc(doc(db, "Viajes", viaje.id), {
          reservasPendientes: arrayRemove(pasajeroAborrar)
        });
      }
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  // --- LÓGICA DEL CONDUCTOR ---
  const gestionarSolicitud = async (solicitud, accion) => {
    setCargando(true);
    try {
      const viajeRef = doc(db, "Viajes", viaje.id);
      
      if (accion === 'aceptar') {
        if (cuposRestantes <= 0) {
          alert("Ya no tienes puestos disponibles.");
          setCargando(false);
          return;
        }
        await updateDoc(viajeRef, {
          reservasPendientes: arrayRemove(solicitud),
          pasajeros: arrayUnion({ ...solicitud, estado: 'confirmado' })
        });
      } else {
        await updateDoc(viajeRef, {
          reservasPendientes: arrayRemove(solicitud)
        });
      }
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const cambiarEstadoViaje = async (nuevoEstado) => {
    if (!window.confirm(`¿Seguro que deseas ${nuevoEstado === 'en_curso' ? 'INICIAR' : 'FINALIZAR'} el viaje?`)) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "Viajes", viaje.id), { estado: nuevoEstado });
      if (nuevoEstado === 'finalizado') {
        onRegresar(); // Lo saca a la pantalla principal
      }
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative font-sans">
      <div className="flex-1 overflow-y-auto pb-48">
        
        {/* ENCABEZADO */}
        <div className="p-4 pt-6 flex justify-between items-center">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
          
          {/* BADGE DE ESTADO DEL VIAJE */}
          {estadoViaje === 'en_curso' && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
              <Map size={10} /> En Curso
            </div>
          )}
        </div>

        <div className="px-5 space-y-4">
          
          {/* TARJETA PRINCIPAL (Sin cambios, solo usa `viaje`) */}
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

          {/* LISTA DE PUESTOS CONFIRMADOS */}
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                PUESTOS ({pasajerosConfirmados.length}/{puestosTotales})
              </p>
              {cuposRestantes === 0 && <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-2 py-1 rounded-md">Lleno</span>}
            </div>
            
            <div className="space-y-3">
              {pasajerosConfirmados.map((pasajero, index) => (
                  <div key={index} className="border-2 border-blue-100 bg-blue-50/20 p-4 rounded-[25px] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                          {pasajero.fotoPerfil ? <img src={pasajero.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-300" />}
                      </div>
                      <p className="text-xs font-bold text-slate-700 uppercase">{pasajero.nombre}</p>
                      <ShieldCheck size={14} className="text-blue-500 ml-auto" />
                  </div>
              ))}
              
              {[...Array(Math.max(0, cuposRestantes))].map((_, index) => (
                <div key={`empty-${index}`} className="border border-slate-100 border-dashed p-4 rounded-[25px] flex items-center gap-4 bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                    <User size={18} className="text-slate-300" />
                  </div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ASIENTO DISPONIBLE</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN EXCLUSIVA PARA EL CONDUCTOR: SOLICITUDES PENDIENTES */}
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
                    <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'rechazar')} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-all">
                      <X size={16} strokeWidth={3} />
                    </button>
                    <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'aceptar')} className="w-10 h-10 bg-green-500 text-white shadow-lg shadow-green-200 rounded-full flex items-center justify-center active:scale-90 transition-all">
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PREFERENCIAS DEL VIAJE */}
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PREFERENCIAS</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* BOTONERA INFERIOR FIJA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/90 backdrop-blur-md border-t border-slate-100 z-[60] max-w-md mx-auto">
        <div className="flex gap-3 h-14">
          
          {/* BOTÓN DE CHAT (Para todos) */}
          <button 
            onClick={() => onIniciarChat(viaje)}
            className="flex-1 bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <MessageCircle size={16} /> Chat
          </button>

             {/* LÓGICA DE BOTÓN PRINCIPAL: CONDUCTOR */}
          {soyConductor ? (
             estadoViaje === 'disponible' ? (
                <button disabled={cargando} onClick={() => cambiarEstadoViaje('en_curso')} className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                  Iniciar Viaje
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
            // BOTONES DEL PASAJERO
            yaSoyPasajero ? (
              <div className="flex-[2] bg-green-500 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg">
                <Check size={16} /> ¡Puesto Confirmado!
              </div>
            ) : yaSolicite ? (
              <button disabled={cargando} onClick={cancelarSolicitud} className="flex-[2] bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center shadow-inner transition-all active:scale-95">
                 Cancelar Solicitud
              </button>
            ) : cuposRestantes > 0 ? (
              <button disabled={cargando} onClick={solicitarCola} className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                Pedir Cola
              </button>
            ) : (
              <button disabled className="flex-[2] bg-slate-200 text-slate-400 rounded-[22px] font-black uppercase text-[10px]">
                Viaje Lleno
              </button>
            )
          )}
        </div>
      </div>

      {/* MODALES EXTRAS */}
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
      
