import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, onSnapshot, arrayUnion, arrayRemove, addDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import PerfilPublico from './PerfilPublico';
import Toast from "../ui/Toast";
import { PerfilUsuarioDetalle } from './PerfilUsuarioDetalle';
import { 
  ArrowLeft, MapPin, User, Users, ShieldCheck, 
  MessageCircle, Repeat, ChevronRight, Snowflake, CigaretteOff, Dog, Check, X, Map, Key, Lock, Unlock, AlertTriangle, Navigation, Share2, Star, BadgeCheck, Clock
} from 'lucide-react';
import { UBICACIONES } from "../../constants/ubicaciones";

// --- FUNCIONES AYUDANTES BLINDADAS ---
const obtenerEstado = (ciudadNombre) => {
  try {
    if (!ciudadNombre || typeof ciudadNombre !== 'string') return "Destino";
    const [soloCiudad] = ciudadNombre.split(',');
    if (!UBICACIONES) return "Venezuela";
    const estadoEncontrado = Object.keys(UBICACIONES).find(estado => {
       const ciudades = UBICACIONES[estado];
       return Array.isArray(ciudades) && ciudades.includes(soloCiudad.trim());
    });
    return estadoEncontrado || "Venezuela";
  } catch (error) {
    return "Destino";
  }
};

const formatearFechaHoraRetorno = (fechaString, horaString) => {
  try {
    if (!fechaString || typeof fechaString !== 'string') return "";
    const partes = fechaString.split('-');
    if (partes.length !== 3) return fechaString;
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    const f = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase()); 
    if (!horaString || typeof horaString !== 'string') return f;
    const [horas, minutos] = horaString.split(':');
    const h = parseInt(horas);
    return `${f} a las ${h % 12 || 12}:${minutos} ${h >= 12 ? 'PM' : 'AM'}`;
  } catch (error) {
    return "";
  }
};

const obtenerIconoEquipaje = (tipo) => {
  switch(String(tipo || '').toLowerCase()) {
    case 'maleta': return '🧳';
    case 'caja': return '📦';
    case 'bolso': case 'bolso ligero': default: return '🎒';
  }
};

const obtenerArraySeguro = (dato) => {
  if (!dato) return [];
  if (Array.isArray(dato)) return dato;
  if (typeof dato === 'object') return Object.values(dato);
  return [];
};
// -----------------------------

export const VistaDetalleViaje = ({ viaje: viajeInicial, onRegresar, userData, onIniciarChat }) => {
  if (!viajeInicial) return null;
  
  const [viaje, setViaje] = useState(viajeInicial);
  const [verPerfil, setVerPerfil] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [cargando, setCargando] = useState(false);
  
  const [modalAbordaje, setModalAbordaje] = useState(false);
  const [pinesIngresados, setPinesIngresados] = useState({});
  const [modalFinalizar, setModalFinalizar] = useState(false);

  const [modalCalificacion, setModalCalificacion] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [comentarioResena, setComentarioResena] = useState("");

  const [modalCalificarPasajeros, setModalCalificarPasajeros] = useState(false);
  const [ratingsChofer, setRatingsChofer] = useState({});
  const [idUsuarioVer, setIdUsuarioVer] = useState(null);

  const [modalCancelar, setModalCancelar] = useState({ visible: false, rol: null }); // rol puede ser 'chofer' o 'pasajero'
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const [ratingConductor, setRatingConductor] = useState({ promedio: "0.0", total: 0 });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "Viajes", viajeInicial.id), (docSnap) => {
      if (docSnap.exists()) {
        setViaje({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, [viajeInicial.id]);

  useEffect(() => {
    const idChofer = viajeInicial?.uidConductor || viajeInicial?.idCreador;
    if (!idChofer) return;
    
    const qResenas = query(collection(db, "Resenas"), where("idConductor", "==", idChofer));
    getDocs(qResenas).then(snap => {
      let suma = 0; let total = 0;
      snap.forEach(d => { suma += d.data().estrellas || 0; total++; });
      setRatingConductor({
        promedio: total > 0 ? (suma / total).toFixed(1) : "0.0",
        total: total
      });
    }).catch(e => console.error(e));
  }, [viajeInicial.uidConductor, viajeInicial.idCreador]);

  useEffect(() => {
    const esConductor = viaje?.uidConductor === userData?.id || viaje?.idCreador === userData?.id;
    const listaPasajeros = obtenerArraySeguro(viaje?.pasajeros);
    const reservaPasajero = listaPasajeros.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
    
    if (!esConductor && reservaPasajero && viaje?.estado === 'finalizado' && !reservaPasajero.calificado) {
      setModalCalificacion(true);
    }
  }, [viaje?.estado, viaje?.pasajeros, userData?.id]);

  const soyConductor = viaje?.uidConductor === userData?.id || viaje?.idCreador === userData?.id;
  const estadoViaje = viaje?.estado || "disponible"; 
  
  const pasajerosConfirmados = obtenerArraySeguro(viaje?.pasajeros);
  const solicitudesPendientes = obtenerArraySeguro(viaje?.reservasPendientes);
  
  const puestosTotales = Number(viaje?.asientos) || Number(viaje?.puestos) || 1;
  const cuposRestantes = Math.max(0, puestosTotales - pasajerosConfirmados.length);

  const yaSolicite = solicitudesPendientes.some(p => p && p.id === userData?.id);
  const miReserva = pasajerosConfirmados.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
  const yaSoyPasajero = !!miReserva;
  const yaCalifico = miReserva?.calificado === true; 
  const mostrarBannerRetorno = viaje?.publicarRegreso && viaje?.tipoRuta !== 'vuelta_de_ruta';

  // --- ¡AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA Y CAUSABA LA PANTALLA BLANCA! ---
  const activarSOS = () => {
    setToastMessage("🚨 Alerta enviada a central (Simulación)");
    setShowToast(true);
  };
  // ------------------------------------------------------------------------
   const enviarNotificacion = async (idDestino, titulo, mensaje, tipo = 'alerta') => {
    if (!idDestino) return;

    try {
      // Importante: Chequea que "db" esté bien importado de tu config
      await addDoc(collection(db, "Notificaciones"), {
        idDestino: idDestino,
        titulo: titulo,
        mensaje: mensaje,
        tipo: tipo,
        leida: false,
        fecha: new Date().toISOString()
      });
      console.log("✅ Notificación guardada en Firebase");
    } catch (error) {
      console.error("❌ Error al guardar en Notificaciones:", error);
    }
  };
  
        
    const solicitarCola = async () => {
    if (cuposRestantes <= 0) return;
    setCargando(true);
    try {
      // 1. Guardamos la reserva
      await updateDoc(doc(db, "Viajes", viaje.id), {
        reservasPendientes: arrayUnion({ 
          id: userData?.id || userData?.uid, 
          nombre: userData?.nombre || "Usuario", 
          fotoPerfil: userData?.fotoPerfil || null, 
          estado: 'pendiente' 
        })
      });
      
            // 2. DETECTAR EL ID (Usamos las propiedades que ya tienes en el useEffect del rating)
      const idDestino = viaje?.uidConductor || viaje?.idCreador || viaje?.idUsuario || viaje?.uid;

      // DIAGNÓSTICO: Si esto falla, el Toast te avisará en el APK
      if (!idDestino) {
        setToastMessage("Error: El viaje no tiene ID de chofer asignado");
      } else {
        // 3. ENVIAR NOTIFICACIÓN
        await enviarNotificacion(
          idDestino, 
          "¡Nueva Solicitud!",
          `${userData?.nombre || 'Alguien'} quiere unirse a tu viaje.`,
          "viaje"
        );
        setToastMessage("Solicitud enviada con éxito");
      }
      setShowToast(true);
    } catch (e) { 
      setToastMessage("Error crítico al solicitar");
      setShowToast(true);
    } finally { 
      setCargando(false); 
    }
  };
  
  const cancelarSolicitud = async () => {
    setCargando(true);
    try {
      const pasajeroAborrar = solicitudesPendientes.find(p => p && p.id === userData?.id);
      if (pasajeroAborrar) await updateDoc(doc(db, "Viajes", viaje.id), { reservasPendientes: arrayRemove(pasajeroAborrar) });
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

        // --- SISTEMA DE CANCELACIONES ---
  const ejecutarCancelacion = async () => {
    if (!motivoCancelacion) {
      setToastMessage("Debes seleccionar un motivo");
      setShowToast(true);
      return;
    }
    
    setCargando(true);
    try {
      const miRef = doc(db, "usuarios", userData?.id);
      const viajeRef = doc(db, "Viajes", viaje.id);
      
      // EL FIX ESTÁ AQUÍ TAMBIÉN
      const idDelChofer = viaje.uidConductor || viaje.idCreador;

      if (modalCancelar.rol === 'pasajero') {
        const pasajeroAborrar = pasajerosConfirmados.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
        if (pasajeroAborrar) {
          await updateDoc(viajeRef, { pasajeros: arrayRemove(pasajeroAborrar) });
          await updateDoc(miRef, { cancelacionesPasajero: increment(1) });

          // NOTIFICACIÓN AL CHOFER: Un pasajero se bajó
          if (idDelChofer) {
             await enviarNotificacion(
               idDelChofer,
               "Asiento Liberado",
               `${userData?.nombre} ha cancelado su reserva para tu viaje. El puesto vuelve a estar disponible.`,
               "alerta"
             );
          }

          setToastMessage("Reserva cancelada. Se registró en tu historial.");
        }
      } 
      else if (modalCancelar.rol === 'chofer') {
        await updateDoc(viajeRef, { 
          estado: 'cancelado',
          motivoCancelacionChofer: motivoCancelacion
        });
        await updateDoc(miRef, { cancelacionesChofer: increment(1) });

        for (const p of pasajerosConfirmados) {
          if (!p) continue;
          await enviarNotificacion(
            p.id || p.uid,
            "Viaje Cancelado por el Chofer",
            `Lamentamos informarte que el viaje desde ${viaje.cO?.split(',')[0]} ha sido cancelado por motivos de: ${motivoCancelacion}.`,
            "alerta"
          );
        }

        setToastMessage("Viaje cancelado y pasajeros notificados");
      }

      setModalCancelar({ visible: false, rol: null });
      setShowToast(true);
      if (modalCancelar.rol === 'chofer') onRegresar();
      
    } catch (error) {
      console.error(error);
      setToastMessage("Error en la operación");
      setShowToast(true);
    } finally {
      setCargando(false);
    }
  };
  
  
  const gestionarSolicitud = async (solicitud, accion) => {
    setCargando(true);
    try {
      const viajeRef = doc(db, "Viajes", viaje.id);
      
      if (accion === 'aceptar') {
        if (cuposRestantes <= 0) { 
          setToastMessage("Sin puestos disponibles"); setShowToast(true); setCargando(false); return; 
        }
        const pinGenerado = Math.floor(1000 + Math.random() * 9000).toString();
        
        await updateDoc(viajeRef, {
          reservasPendientes: arrayRemove(solicitud),
          pasajeros: arrayUnion({ ...solicitud, estado: 'confirmado', pin: pinGenerado, abordado: false, calificado: false })
        });

        // NOTIFICACIÓN: ¡Aceptado!
        await enviarNotificacion(
          solicitud.id || solicitud.uid,
          "¡Cola Aceptada!",
          `${userData?.nombre} te ha confirmado en su viaje. ¡Revisa tu PIN de abordaje!`,
          "exito"
        );

      } else {
        // RECHAZAR
        await updateDoc(viajeRef, { reservasPendientes: arrayRemove(solicitud) });

        // NOTIFICACIÓN: Rechazado (Crucial para que busque otra opción rápido)
        await enviarNotificacion(
          solicitud.id || solicitud.uid,
          "Solicitud no confirmada",
          "El conductor no pudo procesar tu solicitud. Te invitamos a buscar otras rutas disponibles.",
          "alerta"
        );
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setCargando(false); 
    }
  };
  
  
  const procesarAbordajeEIniciar = async () => {
    setCargando(true);
    try {
      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (!p) return null;
        const idPasajero = p.id || p.uid;
        const pinIngresado = String(pinesIngresados[idPasajero] || "").trim();
        const pinReal = String(p.pin || "").trim();

        if (pinIngresado === pinReal && pinReal !== "") {
          return { ...p, abordado: true };
        }
        return { ...p, abordado: false }; 
      }).filter(Boolean);

      await updateDoc(doc(db, "Viajes", viaje.id), { 
        estado: 'en_curso',
        pasajeros: pasajerosActualizados
      });
      setModalAbordaje(false);
      setToastMessage("¡Viaje Iniciado!"); setShowToast(true);
    } catch (e) { 
      console.error(e); 
      setToastMessage("Error técnico. Reintenta."); setShowToast(true);
    } finally { 
      setCargando(false); 
    }
  };

  const iniciarFinalizacion = () => {
    setModalFinalizar(false);
    if (pasajerosConfirmados.length > 0) {
      const initRatings = {};
      pasajerosConfirmados.forEach(p => { if (p) initRatings[p.id || p.uid] = { estrellas: 0, comentario: "" }; });
      setRatingsChofer(initRatings);
      setModalCalificarPasajeros(true);
    } else {
      cambiarEstadoViaje('finalizado');
    }
  };

    const enviarCalificacionesYFinalizar = async () => {
    setCargando(true);
    try {
      // 1. Ciclo para los pasajeros
      for (const p of pasajerosConfirmados) {
        if (!p) continue;
        const pid = p.id || p.uid;
        const rat = ratingsChofer[pid];
        
        if (rat && rat.estrellas > 0) {
          // A) Guardar la reseña en la colección Resenas
          await addDoc(collection(db, "Resenas"), {
            idViaje: viaje.id,
            idConductor: pid, 
            idPasajero: userData?.id || "Conductor", 
            nombrePasajero: userData?.nombre || "Conductor",
            estrellas: rat.estrellas,
            comentario: String(rat.comentario || ""),
            fecha: new Date().toISOString()
          });

          // B) ACTUALIZAR AL PASAJERO: Sumarle +1 viaje como pasajero silenciosamente
          try {
            await updateDoc(doc(db, "usuarios", pid), {
              viajesComoPasajero: increment(1)
            });
          } catch (err) { console.log("Error al sumar viaje al pasajero", err); }
        }
      }

      // 2. ACTUALIZAR AL CHOFER: Sumarle +1 viaje conducido a él mismo
      if (userData?.id) {
         try {
           await updateDoc(doc(db, "usuarios", userData.id), {
             viajesRealizados: increment(1)
           });
         } catch (err) { console.log("Error al sumar viaje al chofer", err); }
      }

      // 3. Cerrar el viaje
      await cambiarEstadoViaje('finalizado');
      setModalCalificarPasajeros(false);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setCargando(false); 
    }
  };
  

  const cambiarEstadoViaje = async (nuevoEstado) => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "Viajes", viaje.id), { estado: nuevoEstado });
      if (nuevoEstado === 'finalizado') onRegresar(); 
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const enviarCalificacion = async () => {
    if (estrellas === 0) {
      setToastMessage("Selecciona al menos 1 estrella"); setShowToast(true); return;
    }
    setCargando(true);
    try {
      const idChofer = viaje.uidConductor || viaje.idCreador || "SinID";
      await addDoc(collection(db, "Resenas"), {
        idViaje: viaje.id,
        idConductor: idChofer,
        idPasajero: userData?.id || "SinID",
        nombrePasajero: userData?.nombre || "Usuario",
        estrellas: estrellas,
        comentario: String(comentarioResena || ""),
        fecha: new Date().toISOString()
      });

      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (!p) return null;
        return (p.id === userData?.id || p.uid === userData?.id) ? { ...p, calificado: true } : p;
      }).filter(Boolean);

      await updateDoc(doc(db, "Viajes", viaje.id), { pasajeros: pasajerosActualizados });

      setModalCalificacion(false);
      setToastMessage("¡Gracias por calificar!"); setShowToast(true);
    } catch (e) { 
      setToastMessage("Error al guardar. Revisa tu conexión."); setShowToast(true);
    } finally { setCargando(false); }
  };

  const compartirRuta = () => {
    const cD_seguro = obtenerEstado(viaje.cD || "");
    const cO_seguro = obtenerEstado(viaje.cO || "");
    const mensajeBase = `🚙 ¡Hola! Voy en ruta hacia ${cD_seguro} desde ${cO_seguro} en Dame la cola.`;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude; const lon = position.coords.longitude;
          const linkMapa = `https://www.google.com/maps?q=${lat},${lon}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(`${mensajeBase}\n\n📍 Ubicación:\n${linkMapa}`)}`, '_blank');
        },
        () => { window.open(`https://wa.me/?text=${encodeURIComponent(mensajeBase)}`, '_blank'); },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(mensajeBase)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative font-sans">
      <div className="flex-1 overflow-y-auto pb-48">
        
        {/* HEADER */}
        <div className="p-4 pt-6 flex justify-between items-center">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
          {estadoViaje === 'en_curso' && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
              <Navigation size={10} /> En Ruta
            </div>
          )}
        </div>

        {estadoViaje === 'en_curso' ? (
          
          <div className="px-5 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="bg-slate-900 rounded-[40px] h-64 relative overflow-hidden flex flex-col items-center justify-center border-4 border-slate-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
               <Map className="text-slate-800 absolute w-[150%] h-[150%] animate-[spin_60s_linear_infinite] opacity-50" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-0" />
               <div className="z-10 bg-blue-600 p-5 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.6)] animate-pulse border-4 border-blue-400/30">
                 <Navigation size={32} className="text-white fill-white" />
               </div>
               <div className="z-10 mt-6 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                 <p className="text-white text-[11px] font-black uppercase tracking-widest">En ruta a {obtenerEstado(viaje?.cD || "")}</p>
               </div>
            </div>

            <button onClick={compartirRuta} className="w-full bg-blue-50 border-2 border-blue-100 text-blue-600 rounded-[30px] p-4 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm">
               <Share2 size={20} />
               <span className="font-black uppercase text-xs tracking-wider">Compartir Ruta a Familiar</span>
            </button>

            {/* LISTA DE PASAJEROS HUD */}
            <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-5 shadow-sm">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                <Users size={14} /> Pasajeros Confirmados ({pasajerosConfirmados.length})
              </h3>
              <div className="space-y-3">
                 {pasajerosConfirmados.map((p, index) => {
                   if (!p) return null;
                   return (
                     <div key={`hud-${p.id || p.uid || index}`} className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-[25px] border border-slate-100">
                       <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center">
                          {p.fotoPerfil ? <img src={p.fotoPerfil} className="w-full h-full object-cover"/> : <User size={20} className="text-slate-400" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-black text-xs uppercase text-slate-700 truncate">{String(p.nombre || "Usuario")}</p>
                          <p className={`text-[8px] font-black uppercase mt-0.5 ${p.abordado ? 'text-green-500' : 'text-amber-500'}`}>
                            {p.abordado ? 'A Bordo (Validado)' : 'Falta Validar PIN'}
                          </p>
                       </div>
                       <div className={`${p.abordado ? 'bg-green-100' : 'bg-amber-100'} p-2 rounded-full shrink-0`}>
                         {p.abordado ? <ShieldCheck size={18} className="text-green-600" /> : <Clock size={18} className="text-amber-600" />}
                       </div>
                     </div>
                   );
                 })}
                 {pasajerosConfirmados.length === 0 && (
                   <p className="text-center text-xs font-bold text-slate-400 uppercase py-4">Viaje sin pasajeros en la app</p>
                 )}
              </div>
            </div>
          </div>

        ) : (

          <div className="px-5 space-y-4">
            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Total</p>
                  <div className="flex items-start text-blue-600">
                    <span className="text-xl font-black italic mt-1">$</span>
                    <span className="text-5xl font-black italic leading-none">{String(viaje?.precio || "0")}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-600"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /></div>
                  <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">{String(viaje?.cO || "N/A")}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje?.cO || "")}</p>
                </div>
                <div className="flex-1 px-2"><div className="w-full h-[2px] bg-blue-600 rounded-full" /></div>
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-200"><MapPin size={16} className="text-slate-300" /></div>
                  <p className="text-[11px] font-black text-slate-800 mt-2 uppercase italic leading-none">{String(viaje?.cD || "N/A")}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje?.cD || "")}</p>
                </div>
              </div>
            </div>

            {mostrarBannerRetorno && (
              <div className="bg-emerald-50 p-5 rounded-[30px] border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Repeat size={18} className="text-emerald-600" /></div>
                <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">CON RETORNO PROGRAMADO</p>
                  <p className="text-sm font-bold text-emerald-900 mt-1">Regresa el {formatearFechaHoraRetorno(viaje?.fechaRegreso || viaje?.fechaRetorno, viaje?.horaRegreso || viaje?.horaRetorno)}</p>
                </div>
              </div>
            )}

            {yaSoyPasajero && !soyConductor && estadoViaje === 'disponible' && (
              <div className="bg-slate-900 p-6 rounded-[35px] shadow-lg border border-slate-800 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                <div className="bg-blue-500/20 p-3 rounded-full mb-3"><Key size={24} className="text-blue-400" /></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tu PIN de abordaje</p>
                <p className="text-5xl font-black italic text-white tracking-[5px] leading-none mb-4">{String(miReserva?.pin || "0000")}</p>
                <div className="bg-slate-800 text-slate-300 text-[10px] font-bold uppercase px-4 py-2 rounded-xl">Dáselo al chofer al subir al vehículo</div>
              </div>
            )}

            {/* TARJETA DE PERFIL CONDUCTOR DINÁMICA */}
            <div onClick={() => setVerPerfil(true)} className="bg-white p-5 rounded-[30px] border border-slate-100 flex flex-col gap-3 active:scale-95 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-blue-600 overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center">
                  {viaje?.fotoPerfil ? (
                    <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> 
                  ) : (
                    <span className="text-white font-black italic text-xl">D</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-base font-black italic text-slate-700 uppercase truncate">{String(viaje?.cN || viaje?.conductor || "Usuario")}</p>
                    {viaje?.identidadVerificada && <BadgeCheck size={18} className="text-green-500 fill-green-100 shrink-0" strokeWidth={2.5} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={`star-${star}`} size={12} className={star <= parseFloat(ratingConductor.promedio) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'} />
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase italic">
                      {ratingConductor.promedio} ({ratingConductor.total} opiniones)
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PUESTOS ({pasajerosConfirmados.length}/{puestosTotales})</p>
                {cuposRestantes <= 0 && <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-2 py-1 rounded-md">Lleno</span>}
              </div>
              
              <div className="space-y-3">
                {pasajerosConfirmados.map((pasajero, index) => {
                  if (!pasajero) return null;
                  return (
                    <div  key={`pasajero-${pasajero.id || pasajero.uid || index}`}   onClick={() => setIdUsuarioVer(pasajero.id || pasajero.uid)}  className="border-2 border-blue-100 bg-blue-50/20 p-4 rounded-[25px] flex items-center gap-4 cursor-pointer active:scale-95 transition-all shadow-sm hover:border-blue-300">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">                     {pasajero.fotoPerfil ? <img src={pasajero.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-300" />}
                    </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 uppercase truncate">{String(pasajero.nombre || "Pasajero")}</p>
                          {pasajero.abordado && <span className="text-[8px] font-black text-green-600 uppercase">Ya a bordo</span>}
                        </div>
                        {pasajero.abordado ? <ShieldCheck size={16} className="text-green-500 shrink-0" /> : <Lock size={14} className="text-slate-300 shrink-0" />}
                    </div>
                  );
                })}
                
                {[...Array(cuposRestantes)].map((_, index) => (
                  <div key={`empty-${index}`} className="border border-slate-100 border-dashed p-4 rounded-[25px] flex items-center gap-4 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center"><User size={18} className="text-slate-300" /></div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ASIENTO DISPONIBLE</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PREFERENCIAS DEL VIAJE</p>
              <div className="grid grid-cols-2 gap-3">
                {viaje?.preferencias?.ac && (
                  <div className="bg-blue-50/70 p-4 rounded-[20px] flex items-center gap-3 border border-blue-100/50">
                    <Snowflake size={18} className="text-blue-500" />
                    <p className="text-[9px] font-black text-blue-700 uppercase tracking-wide">Aire a.</p>
                  </div>
                )}
                {viaje?.preferencias?.noFumar && (
                  <div className="bg-rose-50/70 p-4 rounded-[20px] flex items-center gap-3 border border-rose-100/50">
                    <CigaretteOff size={18} className="text-rose-500" />
                    <p className="text-[9px] font-black text-rose-700 uppercase tracking-wide">Sin humo</p>
                  </div>
                )}
                {viaje?.preferencias?.mascotas && (
                  <div className="bg-amber-50/70 p-4 rounded-[20px] flex items-center gap-3 border border-amber-100/50">
                    <Dog size={18} className="text-amber-600" />
                    <p className="text-[9px] font-black text-amber-800 uppercase tracking-wide">Mascotas</p>
                  </div>
                )}
                <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 border border-slate-100 col-span-2">
                  <span className="text-xl">{obtenerIconoEquipaje(viaje?.tipoEquipaje)}</span>
                  <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Equipaje permitido</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase mt-0.5">{String(viaje?.tipoEquipaje || "Bolso Ligero")}</p>
                  </div>
                </div>
              </div>
            </div>

            {soyConductor && solicitudesPendientes.length > 0 && estadoViaje === 'disponible' && (
              <div className="bg-orange-50 p-6 rounded-[35px] border-2 border-orange-200 shadow-sm space-y-4 animate-in slide-in-from-bottom mb-10">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Nuevas Solicitudes</p>
                {solicitudesPendientes.map((solicitud, index) => {
                  if (!solicitud) return null;
                  return (
                    <div key={`sol-${index}`} className="bg-white p-4 rounded-[25px] flex items-center gap-3 border border-orange-100 shadow-sm">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                         {solicitud.fotoPerfil ? <img src={solicitud.fotoPerfil} className="w-full h-full object-cover"/> : <User size={20} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase text-slate-800 truncate">{String(solicitud.nombre || "Usuario")}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Quiere viajar contigo</p>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'rechazar')} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-all"><X size={16} strokeWidth={3} /></button>
                        <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'aceptar')} className="w-10 h-10 bg-green-500 text-white shadow-lg shadow-green-200 rounded-full flex items-center justify-center active:scale-90 transition-all"><Check size={16} strokeWidth={3} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTONERA INFERIOR FIJA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/90 backdrop-blur-md border-t border-slate-100 z-[60] max-w-md mx-auto">
        <div className="flex gap-3 h-14">
          
          {estadoViaje === 'en_curso' ? (
            <>
              <button onClick={activarSOS} className="flex-1 bg-rose-50 text-rose-600 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all border border-rose-200">
                <AlertTriangle size={16} /> SOS
              </button>
              {soyConductor ? (
                 <button disabled={cargando} onClick={() => setModalFinalizar(true)} className="flex-[2] bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg shadow-slate-900/30 active:scale-95 transition-all">
                   Finalizar Viaje
                 </button>
              ) : (
                 <div className="flex-[2] bg-blue-50 text-blue-600 border border-blue-200 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                   <Navigation size={16} /> En Ruta a Destino
                 </div>
              )}
            </>
          ) : (
            <>
              <button onClick={() => onIniciarChat(viaje)} className="flex-1 bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                <MessageCircle size={16} /> Chat
              </button>

                 {soyConductor ? (
                 estadoViaje === 'disponible' ? (
                    <div className="flex-[2] flex gap-2">
                      <button disabled={cargando} onClick={() => setModalCancelar({ visible: true, rol: 'chofer' })} className="flex-1 bg-red-50 text-red-600 rounded-[22px] font-black uppercase text-[10px] active:scale-95 transition-all border border-red-200">
                        Cancelar
                      </button>
                      <button disabled={cargando || pasajerosConfirmados.length === 0} onClick={() => setModalAbordaje(true)} className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all disabled:bg-slate-300">
                        {pasajerosConfirmados.length === 0 ? 'Sin Pasajeros' : 'Iniciar Viaje'}
                      </button>
                    </div>
                 ) : (
                    <div className="flex-[2] bg-slate-100 text-slate-400 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center border border-slate-200">
                      Viaje Finalizado
                    </div>
                 )
              ) : (
                yaSoyPasajero ? (
                  estadoViaje === 'finalizado' ? (
                     yaCalifico ? (
                       <div className="flex-[2] bg-green-50 text-green-600 border border-green-200 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                         <Star size={16} className="fill-green-600" /> Viaje Calificado
                       </div>
                     ) : (
                       <button onClick={() => setModalCalificacion(true)} className="flex-[2] bg-amber-400 text-amber-950 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-95 transition-all border border-amber-300">
                         <Star size={16} className="fill-amber-950" /> Calificar Experiencia
                       </button>
                     )
                  ) : (
                     <button disabled={cargando} onClick={() => setModalCancelar({ visible: true, rol: 'pasajero' })} className="flex-[2] bg-red-100 text-red-600 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all border border-red-200">
                       <X size={16} strokeWidth={3} /> Cancelar Asiento
                     </button>
                  )
                ) : yaSolicite ? (
                  <button disabled={cargando} onClick={cancelarSolicitud} className="flex-[2] bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center shadow-inner transition-all active:scale-95">Cancelar Solicitud</button>
                ) : cuposRestantes > 0 ? (
                  <button disabled={cargando} onClick={solicitarCola} className="flex-[2] bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Pedir Cola</button>
                ) : (
                  <button disabled className="flex-[2] bg-slate-200 text-slate-400 rounded-[22px] font-black uppercase text-[10px]">Viaje Lleno</button>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL FINALIZAR VIAJE */}
      {modalFinalizar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center">
            <div className="bg-blue-500/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
              <Check size={30} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">¿Finalizar Viaje?</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed">Estás a punto de marcar esta ruta como terminada. {pasajerosConfirmados.length > 0 && "Podrás calificar a tus pasajeros a continuación."}</p>
            
            <div className="flex gap-3">
              <button disabled={cargando} onClick={() => setModalFinalizar(false)} className="flex-1 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all">
                Cancelar
              </button>
              <button disabled={cargando} onClick={iniciarFinalizacion} className="flex-1 bg-blue-600 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-blue-900/50 active:scale-95 transition-all">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHOFER CALIFICA PASAJEROS */}
      {modalCalificarPasajeros && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[90] p-6 flex items-center justify-center animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#0f172a] w-full max-w-md rounded-[35px] shadow-2xl p-6 relative border border-slate-800 my-auto">
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 text-center">Califica a tus Pasajeros</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-6 text-center uppercase tracking-widest">¿Cómo se comportaron durante el viaje?</p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar mb-6">
              {pasajerosConfirmados.map((p, index) => {
                if (!p) return null;
                const pid = p.id || p.uid;
                const rat = ratingsChofer[pid] || { estrellas: 0, comentario: "" };
                return (
                  <div key={`calif-${pid || index}`} className="bg-slate-900 p-4 rounded-3xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
                        {p.fotoPerfil ? <img src={p.fotoPerfil} className="w-full h-full object-cover"/> : <User size={20} className="text-slate-500"/>}
                      </div>
                      <p className="text-sm font-black text-white uppercase truncate">{String(p.nombre || "Pasajero")}</p>
                    </div>
                    <div className="flex justify-center gap-2 mb-2">
                      {[1,2,3,4,5].map(num => (
                        <button key={num} onClick={() => setRatingsChofer({...ratingsChofer, [pid]: {...rat, estrellas: num}})} className="active:scale-75 transition-all">
                          <Star size={32} className={rat.estrellas >= num ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-700'} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={enviarCalificacionesYFinalizar} disabled={cargando} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 font-black uppercase text-xs tracking-[2px] shadow-lg shadow-blue-900/50 active:scale-95 transition-all">
              {cargando ? 'Guardando...' : 'Finalizar y Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL PASAJERO CALIFICA CHOFER */}
      {modalCalificacion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center">
            <button onClick={() => setModalCalificacion(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-[20px] bg-blue-600 mx-auto overflow-hidden mb-4 border-2 border-slate-700 flex items-center justify-center">
              {viaje?.fotoPerfil ? (
                 <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> 
              ) : (
                 <span className="text-white font-black italic text-2xl">D</span>
              )}
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">Califica a {String(viaje?.cN || viaje?.conductor || "Usuario")}</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">¿Qué tal estuvo el viaje?</p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} onClick={() => setEstrellas(num)} className="active:scale-75 transition-all">
                  <Star size={36} className={`${estrellas >= num ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-700'} transition-colors`} />
                </button>
              ))}
            </div>

            <textarea 
              value={comentarioResena} 
              onChange={(e) => setComentarioResena(e.target.value)} 
              placeholder="Deja un breve comentario (Opcional)..." 
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-[20px] p-4 text-xs font-bold outline-none focus:border-amber-400 resize-none h-24 mb-6"
            />
            
            <button disabled={cargando || estrellas === 0} onClick={enviarCalificacion} className="w-full bg-amber-400 text-amber-950 rounded-full p-4 font-black uppercase text-xs tracking-[2px] shadow-lg shadow-amber-900/50 active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none">
              {cargando ? 'Enviando...' : 'Enviar Reseña'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ABORDAJE (PIN) */}
      {modalAbordaje && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-slate-800">Verificación de Abordaje</h3>
              <button onClick={() => setModalAbordaje(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-6">Solicita el PIN secreto a tus pasajeros para confirmar que están en el auto.</p>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-6">
              {pasajerosConfirmados.map((p, index) => {
                if (!p) return null;
                const idPasajero = p.id || p.uid;
                const pinCorrecto = String(pinesIngresados[idPasajero] || "").trim() === String(p.pin || "").trim() && p.pin;
                return (
                  <div key={`pin-${idPasajero || index}`} className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 ${pinCorrecto ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                         {p.fotoPerfil ? <img src={p.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-400" />}
                      </div>
                      <p className="flex-1 text-xs font-black uppercase text-slate-700 truncate">{String(p.nombre || "Usuario")}</p>
                      {pinCorrecto ? <Unlock size={18} className="text-green-500" /> : <Lock size={18} className="text-slate-400" />}
                    </div>
                    {!pinCorrecto ? (
                       <input type="number" placeholder="Ingresar PIN de 4 dígitos" value={pinesIngresados[idPasajero] || ''} onChange={(e) => setPinesIngresados({...pinesIngresados, [idPasajero]: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-center text-lg font-black tracking-[10px] outline-none focus:border-blue-500" maxLength={4} />
                    ) : (
                      <div className="bg-green-500 text-white text-[10px] font-black uppercase text-center py-2 rounded-xl">Pasajero Validado</div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={procesarAbordajeEIniciar} className="w-full bg-blue-600 text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Confirmar e Iniciar Viaje</button>
          </div>
        </div>
      )}

            {/* MODAL DE CANCELACIÓN Y PENALIZACIÓN */}
      {modalCancelar.visible && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-red-900/50 text-center">
            <div className="bg-red-500/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertTriangle size={30} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              ¿Cancelar {modalCancelar.rol === 'chofer' ? 'el Viaje' : 'tu Asiento'}?
            </h3>
            <p className="text-[11px] font-bold text-red-400 mb-6 bg-red-950/30 p-3 rounded-xl border border-red-900/50">
              ¡ATENCIÓN! Cancelar a esta altura sumará una penalización a tu historial. Demasiadas cancelaciones pueden bloquear tu cuenta.
            </p>

            <div className="text-left mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Motivo de cancelación:</p>
              <div className="space-y-2">
                {[
                  "Emergencia personal / Salud", 
                  modalCancelar.rol === 'chofer' ? "Falla mecánica del auto" : "Conseguí otra alternativa",
                  modalCancelar.rol === 'chofer' ? "No conseguí suficientes pasajeros" : "Se canceló mi compromiso",
                  "Otro motivo"
                ].map(motivo => (
                  <button 
                    key={motivo}
                    onClick={() => setMotivoCancelacion(motivo)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${motivoCancelacion === motivo ? 'bg-red-950/50 border-red-500 text-red-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    {motivo}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button disabled={cargando} onClick={() => {setModalCancelar({visible: false, rol: null}); setMotivoCancelacion("");}} className="flex-1 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all">
                Volver
              </button>
              <button disabled={cargando} onClick={ejecutarCancelacion} className="flex-1 bg-red-600 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-red-900/50 active:scale-95 transition-all">
                {cargando ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

     {/* COMPONENTE: PERFIL PÚBLICO DEL PASAJERO/CHOFER */}
      {idUsuarioVer && (
        <PerfilUsuarioDetalle 
          uid={idUsuarioVer} 
          onClose={() => setIdUsuarioVer(null)} 
        />
      )}

      {verPerfil && <PerfilPublico conductor={{ ...viaje, identidadVerificada: true }} onClose={() => setVerPerfil(false)} setToastMessage={setToastMessage} setShowToast={setShowToast} />}
      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    </div>
  );
};
