import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, onSnapshot, arrayUnion, arrayRemove, addDoc, collection, query, where, getDocs, increment, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import PerfilPublico from './PerfilPublico';
import { PerfilUsuarioDetalle } from './PerfilUsuarioDetalle';
import { Geolocation } from '@capacitor/geolocation';
import MapaView from '../Map/MapaView';
import { functions } from '../../firebaseConfig'; 
import { httpsCallableFromURL } from 'firebase/functions';
import { App } from '@capacitor/app';

import { 
  ArrowLeft, MapPin, User, Users, ShieldCheck, 
  MessageCircle, Repeat, ChevronRight, Snowflake, CigaretteOff, Dog, Check, X, Map, Key, Lock, Unlock, AlertTriangle, Navigation, Share2, Star, BadgeCheck, Clock
} from 'lucide-react';
import { UBICACIONES } from "../../constants/ubicaciones";

// --- FUNCIONES AYUDANTES BLINDADAS ---
const obtenerEstado = (ciudadNombre) => {
  try {
    if (!ciudadNombre || typeof ciudadNombre !== 'string') return "Destino";
    if (!UBICACIONES) return "Venezuela";
    
    const textoBusqueda = ciudadNombre.toLowerCase();

    for (const estado of Object.keys(UBICACIONES)) {
      if (textoBusqueda.includes(estado.toLowerCase())) return estado; 
    }

    for (const estado of Object.keys(UBICACIONES)) {
      const ciudades = UBICACIONES[estado];
      if (Array.isArray(ciudades)) {
        for (const ciudad of ciudades) {
          if (textoBusqueda.includes(ciudad.toLowerCase())) return estado;
        }
      }
    }

    const [primeraParte] = ciudadNombre.split(',');
    return primeraParte ? primeraParte.trim() : "Venezuela";
    
  } catch (error) {
    return "Destino";
  }
};

let watcherId = null;

const iniciarRastreoChofer = async (viajeId) => {
  try {
    watcherId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      async (position, error) => {
        if (error) return; 
        if (position) {
          await updateDoc(doc(db, "Viajes", viajeId), {
            posicionChofer: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              heading: position.coords.heading || 0
            }
          });
        }
      }
    );
  } catch (error) { console.error("Error iniciando rastreo:", error); }
};

const detenerRastreoChofer = async () => {
  if (watcherId != null) {
    await Geolocation.clearWatch({ id: watcherId });
    watcherId = null;
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

export const VistaDetalleViaje = ({ viaje: viajeInicial, onRegresar, userData, onIniciarChat }) => {
  if (!viajeInicial) return null;
  
  const [viaje, setViaje] = useState(viajeInicial);
  const [verPerfil, setVerPerfil] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  const [toast, setToast] = useState<{texto: string, tipo: 'exito'|'error'} | null>(null);

  const setToastMessage = (msg) => {
    setToast({texto: msg, tipo: "exito"});
    setTimeout(() => setToast(null), 3000);
  };
  const setShowToast = (bool) => { if(!bool) setToast(null); };

  const [modalAbordaje, setModalAbordaje] = useState(false);
  const [pinesIngresados, setPinesIngresados] = useState({});
  const [modalFinalizar, setModalFinalizar] = useState(false);

  const [modalCalificacion, setModalCalificacion] = useState(false);
  const [stars, setStars] = useState(0);
  const [comentarioResena, setComentarioResena] = useState("");

  const [modalCalificarPasajeros, setModalCalificarPasajeros] = useState(false);
  const [ratingsChofer, setRatingsChofer] = useState({});
  const [idUsuarioVer, setIdUsuarioVer] = useState(null);

  const [modalCancelar, setModalCancelar] = useState({ visible: false, rol: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  
  const [modalAcompanantes, setModalAcompanantes] = useState(false);
  const [adultosExtra, setAdultosExtra] = useState(0);
  const [ninosExtra, setNinosExtra] = useState(0);
  
  const [ratingConductor, setRatingConductor] = useState({ promedio: "0.0", total: 0 });
   const [viajeActivoBloqueante, setViajeActivoBloqueante] = useState(false);
  const soyConductor = viaje?.uidConductor === userData?.id || viaje?.idCreador === userData?.id;
  const estadoViaje = viaje?.estado || "disponible"; 

  // 🔥 CONTROL MAESTRO DE MODALES PARA OCULTAR LA BARRA INFERIOR
  const hayModalAbierto = modalAbordaje || modalAcompanantes || modalCancelar.visible || modalFinalizar || modalCalificarPasajeros || modalCalificacion;

  useEffect(() => {
    if (window.google && window.google.maps) return;
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCUNgw1YBOVZKYAhTgcW00G1c09alI2kMs&libraries=places";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    let intervaloGps;
    const iniciarTransmision = async () => {
      try { await Geolocation.requestPermissions(); } catch (e) { console.error("Permiso GPS denegado"); }
      intervaloGps = setInterval(async () => {
        try {
          const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
          await updateDoc(doc(db, "Viajes", viaje.id), {
            latChofer: position.coords.latitude,
            lngChofer: position.coords.longitude,
            ultimaActualizacion: new Date().toISOString()
          });
        } catch (error) {}
      }, 10000); 
    };

    if (soyConductor && (estadoViaje === 'en_curso' || estadoViaje === 'buscando')) {
      iniciarTransmision();
    }
    return () => { if (intervaloGps) clearInterval(intervaloGps); };
  }, [soyConductor, estadoViaje, viaje?.id]);

    // 🔥 NUEVO RADAR: Verifica si el conductor tiene OTRO viaje en curso
  useEffect(() => {
    if (!soyConductor || !userData?.id) return;
    
    // Buscamos todos los viajes de este conductor
    const qActivos = query(
      collection(db, "Viajes"),
      where("uidConductor", "==", userData.id)
    );
    
    const unsubActivos = onSnapshot(qActivos, (snap) => {
      // Filtramos localmente para evitar errores de Firebase
      const otroViajeActivo = snap.docs.some(d => {
        const data = d.data();
        // Es un viaje activo SI NO es el viaje actual, Y está en_curso o buscando
        return d.id !== viaje.id && (data.estado === "buscando" || data.estado === "en_curso");
      });
      setViajeActivoBloqueante(otroViajeActivo);
    });
    
    return () => unsubActivos();
  }, [soyConductor, userData?.id, viaje?.id]);
  
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
      setRatingConductor({ promedio: total > 0 ? (suma / total).toFixed(1) : "0.0", total: total });
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
  
  const pasajerosConfirmados = obtenerArraySeguro(viaje?.pasajeros);
  const solicitudesPendientes = obtenerArraySeguro(viaje?.reservasPendientes);
  
  const puestosTotales = Number(viaje?.asientos) || Number(viaje?.puestos) || 1;
  const asientosOcupados = pasajerosConfirmados.reduce((total, p) => total + (Number(p?.puestosSolicitados) || 1), 0);
  const cuposRestantes = Math.max(0, puestosTotales - asientosOcupados);
  const puestosQueQuiero = 1 + adultosExtra + ninosExtra;
  
  const yaSolicite = solicitudesPendientes.some(p => p && p.id === userData?.id);
  const miReserva = pasajerosConfirmados.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
  const yaSoyPasajero = !!miReserva;
  const yaCalifico = miReserva?.calificado === true; 
  const mostrarBannerRetorno = viaje?.publicarRegreso && viaje?.tipoRuta !== 'vuelta_de_ruta';

  const activarSOS = () => window.open('tel:911', '_system');

  const notificarLlegadaYAbrirModal = async () => {
    setModalAbordaje(true); 
    const promesasNotificaciones = pasajerosConfirmados.map(p => {
      if (p && !p.abordado && (p.id || p.uid)) {
        return enviarNotificacion(
          p.id || p.uid,
          "🚘 ¡Tu chofer ha llegado!",
          `${userData?.nombre || "El conductor"} ya te está esperando afuera. Por favor, acércate y dale tu PIN secreto.`,
          "viaje"
        );
      }
      return null;
    });

    await Promise.all(promesasNotificaciones.filter(n => n !== null));
    setToast({ texto: "Pasajeros notificados", tipo: "exito" });
    setTimeout(() => setToast(null), 3000);
  };
  
  const enviarNotificacion = async (idDestino, titulo, mensaje, tipo = 'alerta') => {
    try {
      await addDoc(collection(db, "Notificaciones"), {
        idDestino: String(idDestino), titulo, mensaje, tipo, leida: false, fecha: new Date().toISOString()
      });
    } catch (error) { console.error(error); }
  };

     const iniciarChatPrivado = async (pasajeroObjetivo) => {
    setCargando(true);
    try {
      const miId = String(userData?.id || userData?.uid);
      const idChofer = String(viaje.uidConductor || viaje.idCreador);
      const idPas = String(pasajeroObjetivo.id || pasajeroObjetivo.uid);
      
      const qChat = query(
        collection(db, "Chats"),
        where("idViaje", "==", viaje.id),
        where("uidPasajero", "==", idPas),
        where("participantes", "array-contains", miId)
      );
      
      const chatSnap = await getDocs(qChat);
      
      if (!chatSnap.empty) {
        const chatExistente = chatSnap.docs[0];
        onIniciarChat({ id: chatExistente.id, ...chatExistente.data() });
        // 🔥 CERRAMOS LA VISTA DEL VIAJE CON UN RETRASO MÍNIMO PARA EVITAR CORTOS CIRCUITOS
        setTimeout(() => onRegresar(), 150); 
      } else {
        const datosNuevoChat = {
          estadoViaje: estadoViaje,
          fotoConductor: soyConductor ? (userData?.fotoPerfil || null) : (viaje.fotoPerfil || null),
          fotoPasajero: soyConductor ? (pasajeroObjetivo.fotoPerfil || null) : (userData?.fotoPerfil || null),
          idViaje: viaje.id,
          mensajesSinLeer: 0,
          nombreConductor: soyConductor ? String(userData?.nombre || "Conductor") : String(viaje.cN || viaje.conductor || "Conductor"),
          nombrePasajero: soyConductor ? String(pasajeroObjetivo.nombre || "Pasajero") : String(userData?.nombre || "Pasajero"),
          participantes: [idChofer, idPas],
          ruta: viaje.cO ? `${viaje.cO.split(',')[0]} - ${viaje.cD?.split(',')[0]}` : "Detalle de Ruta",
          telefonoConductor: soyConductor ? (userData?.telefono || "") : (viaje.telefono || ""),
          telefonoPasajero: soyConductor ? (pasajeroObjetivo.telefono || "") : (userData?.telefono || ""),
          timestamp: Date.now(),
          uidConductor: idChofer,
          uidPasajero: idPas,
          ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ultimoMensaje: "Chat iniciado",
          esSoporte: false
        };

        const nuevoChatRef = await addDoc(collection(db, "Chats"), datosNuevoChat);
        onIniciarChat({ id: nuevoChatRef.id, ...datosNuevoChat });
        // 🔥 CERRAMOS LA VISTA
        setTimeout(() => onRegresar(), 150);
      }
      
    } catch (e) {
      console.error("Error al gestionar sala de chat:", e);
      setToast({ texto: "Error de conexión al abrir el chat", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCargando(false);
    }
  };

  const manejarChatGlobal = () => {
    if (soyConductor) {
      if (pasajerosConfirmados.length === 1) {
        iniciarChatPrivado(pasajerosConfirmados[0]);
      } else if (pasajerosConfirmados.length > 1) {
        setToast({ texto: "Toca el ícono de chat del pasajero en la lista" });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ texto: "Aún no tienes pasajeros confirmados", tipo: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } else {
      // Si soy pasajero, mi "objetivo" soy yo mismo para la lógica
      iniciarChatPrivado(userData); 
    }
  };

  const solicitarCola = async () => {
    const costoTotalPeticion = Number(viaje?.precio || 0) * puestosQueQuiero;
    const miSaldoActual = Number(userData?.saldo || 0);

    if (miSaldoActual < costoTotalPeticion) {
      setToast({ texto: `Saldo insuficiente. Necesitas $${costoTotalPeticion.toFixed(2)}`, tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (puestosQueQuiero > cuposRestantes) {
      setToast({ texto: "No hay suficientes puestos", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setCargando(true);
    try {
      let lat = 0; let lng = 0;
      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (gpsError) {
        setToast({ texto: "Enciende tu GPS o Ubicación para pedir la cola", tipo: "error" });
        setTimeout(() => setToast(null), 4000);
        setCargando(false);
        return; 
      }

      const miId = userData?.id || userData?.uid;
      const idConductor = viaje?.uidConductor || viaje?.idCreador;
      const viajeRef = doc(db, "Viajes", viaje.id);
      const nombreUsuario = userData?.nombre || "Usuario";
      
      const datosPasajeroBase = {
        id: String(miId), 
        nombre: String(nombreUsuario), 
        fotoPerfil: userData?.fotoPerfil || null, 
        puestosSolicitados: Number(puestosQueQuiero),
        adultosExtra: Number(adultosExtra),           
        ninosExtra: Number(ninosExtra),
        lat: lat,
        lng: lng,
        abordado: false,
      };

      const esAutoAceptar = viaje.autoAceptar === true;

      await addDoc(collection(db, "Solicitudes"), {
        idConductor: String(idConductor),
        nombrePasajero: String(nombreUsuario),
        idViaje: String(viaje.id),
        idPasajero: String(miId),
        estado: esAutoAceptar ? "aprobada" : "pendiente",
        puestosSolicitados: Number(puestosQueQuiero),
        fecha: serverTimestamp()
      });

      if (esAutoAceptar) {
        const pinGenerado = Math.floor(1000 + Math.random() * 9000).toString();
        await updateDoc(viajeRef, {
          pasajeros: arrayUnion({ 
            ...datosPasajeroBase, estado: 'confirmado', pin: pinGenerado, calificado: false 
          })
        });
        if (idConductor) await enviarNotificacion(idConductor, "¡Nuevo Pasajero!", `${nombreUsuario} se unió a tu viaje.`, "exito");
        setToast({ texto: "¡Reserva confirmada!", tipo: "exito" });
      } else {
        await updateDoc(viajeRef, {
          reservasPendientes: arrayUnion({ ...datosPasajeroBase, estado: 'pendiente' })
        });
        if (idConductor) {
          const extraTexto = puestosQueQuiero > 1 ? ` y ${puestosQueQuiero - 1} acompañante(s)` : "";
          await enviarNotificacion(idConductor, "¡Nueva Solicitud!", `${nombreUsuario} quiere unirse a tu viaje${extraTexto}.`, "viaje");
        }
        setToast({ texto: "Solicitud enviada al chofer", tipo: "exito" });
      }
      
      setModalAcompanantes(false); 
      setTimeout(() => setToast(null), 3000);

    } catch (e: any) { 
      console.error("Error en reserva:", e);
      setToast({ texto: `Error de sistema: ${e.message || "No se pudo procesar"}`, tipo: "error" });
      setTimeout(() => setToast(null), 4000);
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

  const ejecutarCancelacion = async () => {
    if (!motivoCancelacion) {
      setToast({ texto: "Debes seleccionar un motivo", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setCargando(true);
    try {
      const miRef = doc(db, "usuarios", userData?.id);
      const viajeRef = doc(db, "Viajes", viaje.id);
      const idDelChofer = viaje.uidConductor || viaje.idCreador;

      if (modalCancelar.rol === 'pasajero') {
        const pasajeroAborrar = pasajerosConfirmados.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
        if (pasajeroAborrar) {
          await updateDoc(viajeRef, { pasajeros: arrayRemove(pasajeroAborrar) });
          await updateDoc(miRef, { cancelacionesPasajero: increment(1) });
          if (idDelChofer) await enviarNotificacion(idDelChofer, "Asiento Liberado", `${userData?.nombre} ha cancelado su reserva.`, "alerta");
          setToast({ texto: "Reserva cancelada y registrada.", tipo: "exito" });
        }
      } 
      else if (modalCancelar.rol === 'chofer') {
        await updateDoc(viajeRef, { estado: 'cancelado', motivoCancelacionChofer: motivoCancelacion });
        await updateDoc(miRef, { cancelacionesChofer: increment(1) });
        for (const p of pasajerosConfirmados) {
          if (!p) continue;
          await enviarNotificacion(p.id || p.uid, "Viaje Cancelado", `El viaje desde ${viaje.cO?.split(',')[0]} fue cancelado: ${motivoCancelacion}.`, "alerta");
        }
        setToast({ texto: "Viaje cancelado.", tipo: "exito" });
      }

      setModalCancelar({ visible: false, rol: null });
      setTimeout(() => setToast(null), 3000);
      if (modalCancelar.rol === 'chofer') onRegresar(); 
      
    } catch (error) {
      setToast({ texto: "Error en la operación", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };

  const gestionarSolicitud = async (solicitud, accion) => {
    setCargando(true);
    try {
      const viajeRef = doc(db, "Viajes", viaje.id);
      if (accion === 'aceptar') {
        const puestosQuePidio = Number(solicitud.puestosSolicitados) || 1;
        if (puestosQuePidio > cuposRestantes) { 
          setToast({ texto: "Sin puestos suficientes", tipo: "error" }); 
          setTimeout(() => setToast(null), 3000);
          setCargando(false); return; 
        }
        const pinGenerado = Math.floor(1000 + Math.random() * 9000).toString();
        const idPasajero = solicitud.id || solicitud.uid;
        
        await updateDoc(viajeRef, {
          reservasPendientes: arrayRemove(solicitud),
          pasajeros: arrayUnion({ ...solicitud, estado: 'confirmado', pin: pinGenerado, abordado: false, calificado: false })
        });
        await enviarNotificacion(idPasajero, "¡Cola Aceptada!", `${userData?.nombre} te confirmó. ¡Revisa tu PIN!`, "exito");
      } else {
        await updateDoc(viajeRef, { reservasPendientes: arrayRemove(solicitud) });
        await enviarNotificacion(solicitud.id || solicitud.uid, "Solicitud no confirmada", "El conductor no pudo procesar tu solicitud.", "alerta");
      }
    } catch (e) { 
      setToast({ texto: "Fallo de conexión", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };
  
  const procesarAbordajeEIniciar = async () => {
    setCargando(true);
    try {
      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (!p) return null;
        const idPasajero = p.id || p.uid;
        const pinIngresado = String(pinesIngresados[idPasajero] || "").trim();
        const pinReal = String(p.pin || "").trim();
        return (pinIngresado === pinReal && pinReal !== "") ? { ...p, abordado: true } : { ...p, abordado: false }; 
      }).filter(Boolean);

      await updateDoc(doc(db, "Viajes", viaje.id), { estado: 'en_curso', pasajeros: pasajerosActualizados });
      setModalAbordaje(false);
      setToast({ texto: "¡Viaje Iniciado!", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { 
      setToast({ texto: "Error al iniciar", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };

  const iniciarFinalizacion = () => {
    setModalFinalizar(false);
    if (pasajerosConfirmados.length > 0) {
      const initRatings = {};
      pasajerosConfirmados.forEach(p => { if (p) initRatings[p.id || p.uid] = { estrellas: 0, comentario: "" }; });
      setRatingsChofer(initRatings);
      setModalCalificarPasajeros(true);
    } else { cambiarEstadoViaje('finalizado'); }
  };

  const enviarCalificacionesYFinalizar = async () => {
    setCargando(true);
    try {
      const llamarBunker = httpsCallableFromURL(functions, 'https://finalizar-viaje-v2-1080063705561.us-central1.run.app');
      const resultado = await llamarBunker({ viajeId: viaje.id, ratingsChofer: ratingsChofer });

      if (resultado.data.success) {
        pasajerosConfirmados.forEach(p => {
          if (p && (p.id || p.uid)) {
            enviarNotificacion(p.id || p.uid, "¡Llegaste a tu destino!", `Recuerda calificar a ${userData.nombre}.`, "viaje");
          }
        });
        setToast({ texto: "¡Viaje finalizado con éxito!", tipo: "exito" });
        setTimeout(() => setToast(null), 3000);
        setModalCalificarPasajeros(false);
        onRegresar(); 
      }
    } catch (e) { 
      setToast({ texto: "Error al cobrar el viaje", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };
  
  const cambiarEstadoViaje = async (nuevoEstado) => {
    setCargando(true);
    try {
      const viajeRef = doc(db, "Viajes", viaje.id);
      await updateDoc(viajeRef, { estado: nuevoEstado });
      
      if (nuevoEstado === 'buscando') {
        const promesas = pasajerosConfirmados.map(p => {
          if (p.id || p.uid) return enviarNotificacion(p.id || p.uid, "¡Chofer en camino!", `${userData.nombre} inició la ruta.`, "viaje");
          return null;
        });
        await Promise.all(promesas.filter(p => p !== null));
        setToast({ texto: "¡Ruta iniciada!", tipo: "exito" });
      }
      
      if (nuevoEstado === 'finalizado') onRegresar(); 
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ texto: "Error al actualizar estado", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };
  
  const enviarCalificacion = async () => {
    if (stars === 0) {
      setToast({ texto: "Selecciona al menos 1 estrella", tipo: "error" });
      setTimeout(() => setToast(null), 3000); return;
    }
    setCargando(true);
    try {
      const idChofer = viaje.uidConductor || viaje.idCreador || "SinID";
      await addDoc(collection(db, "Resenas"), {
        idViaje: viaje.id, idConductor: idChofer, idPasajero: userData?.id || "SinID",
        nombrePasajero: userData?.nombre || "Usuario", estrellas: stars, comentario: String(comentarioResena || ""), fecha: new Date().toISOString()
      });
      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (!p) return null;
        return (p.id === userData?.id || p.uid === userData?.id) ? { ...p, calificado: true } : p;
      }).filter(Boolean);

      await updateDoc(doc(db, "Viajes", viaje.id), { pasajeros: pasajerosActualizados });
      setModalCalificacion(false);
      setToast({ texto: "¡Gracias por calificar!", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { 
      setToast({ texto: "Error al guardar reseña", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
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
    } else { window.open(`https://wa.me/?text=${encodeURIComponent(mensajeBase)}`, '_blank'); }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col font-sans h-[100dvh] w-screen overflow-hidden animate-in slide-in-from-right duration-300">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[120000] w-max max-w-[95vw] animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-slate-900' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? <ShieldCheck size={18} className="text-green-400 shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
            <span className="text-center leading-tight break-words">{toast.texto}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-32 relative">
        <div className="p-4 pt-6 flex justify-between items-center sticky top-0 z-[60] bg-slate-50/90 backdrop-blur-sm">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 active:scale-95 transition-all"> 
            <ArrowLeft size={16} strokeWidth={3} />  <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
          {estadoViaje === 'en_curso' && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
              <Navigation size={10} /> En Ruta
            </div>
          )}
        </div>

      {(estadoViaje === 'en_curso' || estadoViaje === 'buscando') ? (
          
          <div className="px-5 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[40px] h-72 relative overflow-hidden border-4 border-slate-100 shadow-xl z-0">
               <MapaView origen={viaje.coordsOrigen} destino={viaje.coordsDestino} posicionChofer={viaje.latChofer && viaje.lngChofer ? { lat: viaje.latChofer, lon: viaje.lngChofer } : null} pasajeros={pasajerosConfirmados} estadoViaje={estadoViaje} interactivo={false} />
               <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <p className="text-slate-800 text-[11px] font-black uppercase tracking-widest"> 
                      {estadoViaje === 'buscando' ? (soyConductor ? "En ruta para recoger pasajeros" : "Chofer en camino a buscarte") : (viaje.latChofer ? `En ruta a ${viaje?.cD?.split(',')[0] || "Destino"}` : "Esperando Señal GPS...")}
                    </p>
                  </div>
               </div>
            </div>

            <button onClick={compartirRuta} className="w-full bg-blue-50 border-2 border-blue-100 text-blue-600 rounded-[30px] p-4 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm">
               <Share2 size={20} /> <span className="font-black uppercase text-xs tracking-wider">Compartir Ruta a Familiar</span>
            </button>

            {yaSoyPasajero && !soyConductor && (estadoViaje === 'buscando') && (
              <div className="bg-slate-900 p-6 rounded-[35px] shadow-lg border border-slate-800 flex flex-col items-center justify-center text-center mb-6 animate-in zoom-in duration-300">
                <div className="bg-blue-500/20 p-3 rounded-full mb-3"><Key size={24} className="text-blue-400" /></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tu PIN de abordaje</p>
                <p className="text-5xl font-black italic text-white tracking-[5px] leading-none mb-4">{String(miReserva?.pin || "0000")}</p>
                <div className="bg-slate-800 text-slate-300 text-[10px] font-bold uppercase px-4 py-2 rounded-xl">Dáselo al chofer al subir</div>
              </div>
            )}

            <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-5 shadow-sm">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                <Users size={14} /> Pasajeros Confirmados ({pasajerosConfirmados.length})
              </h3>
                            <div className="space-y-3">
                 {pasajerosConfirmados.map((p, index) => {
                   if (!p) return null;
                   return (
                     <div key={`hud-${p.id || p.uid || index}`} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-[25px] border border-slate-100">
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
                       
                         {soyConductor && (
                         <button disabled={cargando} onClick={(e) => {  e.stopPropagation();  iniciarChatPrivado(p); // <-- ESTO ES VITAL
                        }} 
                      className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center active:scale-90 transition-all shrink-0 ml-1 shadow-md shadow-slate-900/30" >
                     <MessageCircle size={16} />
                     </button>
                     )}
                     </div>
                   );
                 })}
                 {pasajerosConfirmados.length === 0 && <p className="text-center text-xs font-bold text-slate-400 uppercase py-4">Viaje sin pasajeros en la app</p>}
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

            {viaje.referencia && viaje.referencia.trim() !== "" && (
              <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Punto de Encuentro</p>
                <p className="text-base font-semibold text-[#0f172a]">{viaje.referencia}</p>
              </div>
            )}
            
            {mostrarBannerRetorno && (
              <div className="bg-emerald-50 p-5 rounded-[30px] border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Repeat size={18} className="text-emerald-600" /></div>
                <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">CON RETORNO PROGRAMADO</p>
                  <p className="text-sm font-bold text-emerald-900 mt-1">Regresa el {formatearFechaHoraRetorno(viaje?.fechaRegreso || viaje?.fechaRetorno, viaje?.horaRegreso || viaje?.horaRetorno)}</p>
                </div>
              </div>
            )}

            <div onClick={() => setVerPerfil(true)} className="bg-white p-5 rounded-[30px] border border-slate-100 flex flex-col gap-3 active:scale-95 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-blue-600 overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center">
                  {viaje?.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <span className="text-white font-black italic text-xl">D</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-base font-black italic text-slate-700 uppercase truncate">{String(viaje?.cN || viaje?.conductor || "Usuario")}</p>
                    {viaje?.identidadVerificada && <BadgeCheck size={18} className="text-green-500 fill-green-100 shrink-0" strokeWidth={2.5} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => <Star key={`star-${star}`} size={12} className={star <= parseFloat(ratingConductor.promedio) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'} />)}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase italic">{ratingConductor.promedio} ({ratingConductor.total} opiniones)</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 shrink-0" />
              </div>
            </div>

            {viaje?.vehiculo && (
              <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm flex flex-col gap-3">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">Vehículo Asignado</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-[20px] border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Modelo</p>
                    <p className="text-xs font-black italic text-slate-700 uppercase truncate">{viaje.vehiculo.marca} {viaje.vehiculo.modelo}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-[20px] border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Color</p>
                    <p className="text-xs font-black italic text-slate-700 uppercase truncate">{viaje.vehiculo.color}</p>
                  </div>
                  <div className="col-span-2 bg-slate-900 p-4 rounded-[20px] flex items-center justify-between shadow-inner">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Placa / Patente</p>
                    <p className="text-base font-black italic text-white tracking-[3px] uppercase">{viaje.vehiculo.placa}</p>
                  </div>
                </div>
              </div>
            )}
            
            {soyConductor && solicitudesPendientes.length > 0 && estadoViaje === 'disponible' && (
              <div className="bg-orange-50 p-6 rounded-[35px] border-2 border-orange-200 shadow-sm space-y-4 animate-in slide-in-from-bottom">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Nuevas Solicitudes</p>
                {solicitudesPendientes.map((solicitud, index) => {
                  if (!solicitud) return null;
                  const puestosPedidos = Number(solicitud.puestosSolicitados) || 1;
                  return (
                    <div key={`sol-${index}`} className="bg-white p-4 rounded-[25px] flex items-center gap-3 border border-orange-100 shadow-sm">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                         {solicitud.fotoPerfil ? <img src={solicitud.fotoPerfil} className="w-full h-full object-cover"/> : <User size={20} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase text-slate-800 truncate">{String(solicitud.nombre || "Usuario")}</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">Pide <span className="text-orange-600 font-black">{puestosPedidos}</span> asiento(s)</p>
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

            {/* PUESTOS */}
            <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PUESTOS ({asientosOcupados}/{puestosTotales})</p>
                {cuposRestantes <= 0 && <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-2 py-1 rounded-md">Lleno</span>}
              </div>
              
              <div className="space-y-3">
                {pasajerosConfirmados.map((pasajero, index) => {
                  if (!pasajero) return null;
                  const puestosPedidos = Number(pasajero.puestosSolicitados) || 1;
                  return (
                    <div  key={`pasajero-${pasajero.id || pasajero.uid || index}`}   onClick={() => setIdUsuarioVer(pasajero.id || pasajero.uid)}  className="border-2 border-blue-100 bg-blue-50/20 p-4 rounded-[25px] flex items-center gap-4 cursor-pointer active:scale-95 transition-all shadow-sm hover:border-blue-300 relative">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">                     {pasajero.fotoPerfil ? <img src={pasajero.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-300" />}
                    </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 uppercase truncate">{String(pasajero.nombre || "Pasajero")}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                              {pasajero.abordado && <span className="text-[8px] font-black text-green-600 uppercase">Ya a bordo</span>}
                              {puestosPedidos > 1 && <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-0.5 rounded-full">+{puestosPedidos - 1} Acompañante(s)</span>}
                          </div>
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

            {/* PREFERENCIAS DEL VIAJE */}
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

          </div>
        )}
      </div>

      {/* 🔥 REGLA DE ORO: SI HAY UN MODAL ABIERTO, ESTA BARRA AZUL DESAPARECE POR COMPLETO */}
      {!hayModalAbierto && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-white/90 backdrop-blur-md border-t border-slate-100 z-[100000]">
          <div className="flex gap-2 sm:gap-3 h-14 max-w-md mx-auto">
            
            {(estadoViaje === 'disponible' || estadoViaje === 'buscando' || estadoViaje === 'en_curso') && (
              <button disabled={cargando} onClick={manejarChatGlobal} className="w-14 sm:w-auto sm:px-6 shrink-0 bg-slate-900 text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-90 transition-all">
                <MessageCircle size={18} /> <span className="hidden sm:inline">Chat</span>
              </button>
            )}

            {estadoViaje === 'en_curso' && !soyConductor && (
              <button onClick={activarSOS} className="w-14 sm:w-auto sm:px-6 shrink-0 bg-rose-50 text-rose-600 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-sm border border-rose-200 active:scale-95 transition-all">
                <AlertTriangle size={18} /> <span className="hidden sm:inline">SOS</span>
              </button>
            )}

            {estadoViaje === 'en_curso' ? (
              soyConductor ? (
                <button disabled={cargando} onClick={() => setModalFinalizar(true)} className="flex-1 bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg shadow-blue-600/30 active:scale-95 transition-all">
                  Finalizar Viaje
                </button>
              ) : (
                <div className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                  <Navigation size={16} /> En Ruta a Destino
                </div>
              )
            ) : estadoViaje === 'buscando' ? (
              soyConductor ? (
                 <button disabled={cargando} onClick={notificarLlegadaYAbrirModal} className="flex-1 bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2" >
                   <MapPin size={16} /> ¡Ya llegué! (Validar)
                 </button>
              ) : (
                 <button disabled={cargando} onClick={() => setModalCancelar({ visible: true, rol: 'pasajero' })} className="flex-1 bg-red-100 text-red-600 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all border border-red-200">
                   <X size={16} strokeWidth={3} /> Cancelar Asiento
                 </button>
              )
            ) : estadoViaje === 'disponible' ? (
              soyConductor ? (
                <div className="flex-1 flex gap-2">
                  <button disabled={cargando} onClick={() => setModalCancelar({ visible: true, rol: 'chofer' })} className="flex-1 bg-red-50 text-red-600 rounded-[22px] font-black uppercase text-[10px] active:scale-95 transition-all border border-red-200">
                    Cancelar
                  </button>
                  <button disabled={cargando || pasajerosConfirmados.length === 0} onClick={() => cambiarEstadoViaje('buscando')} className="flex-[2] bg-amber-500 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all disabled:bg-slate-300">
                    {pasajerosConfirmados.length === 0 ? 'Sin Pasajeros' : 'Ir a recoger'}
                  </button>
                </div>
              ) : (
                yaSoyPasajero ? (
                  <div className="flex-1 bg-green-50 text-green-600 border border-green-200 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                    <Check size={16} /> Confirmado
                  </div>
                ) : yaSolicite ? (
                  <button disabled={cargando} onClick={cancelarSolicitud} className="flex-1 bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center shadow-inner transition-all active:scale-95">Cancelar Solicitud</button>
                ) : cuposRestantes > 0 ? (
                  <button disabled={cargando} onClick={() => setModalAcompanantes(true)} className="flex-1 bg-blue-600 text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Pedir Cola</button>
                ) : (
                  <button disabled className="flex-1 bg-slate-200 text-slate-400 rounded-[22px] font-black uppercase text-[10px]">Viaje Lleno</button>
                )
              )
            ) : yaSoyPasajero && estadoViaje === 'finalizado' && (
               yaCalifico ? (
                 <div className="w-full bg-green-50 text-green-600 border border-green-200 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                   <Star size={16} className="fill-green-600" /> Viaje Calificado
                 </div>
               ) : (
                 <button onClick={() => setModalCalificacion(true)} className="w-full bg-amber-400 text-amber-950 rounded-[22px] h-14 font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-95 transition-all border border-amber-300">
                   <Star size={16} className="fill-amber-950" /> Calificar Experiencia
                 </button>
               )
            )}
          </div>
        </div>
      )}
      
      {/* MODAL FINALIZAR VIAJE */}
      {modalFinalizar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center max-h-[85vh] overflow-y-auto">
            <div className="bg-blue-500/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
              <Check size={30} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">¿Finalizar Viaje?</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed">Estás a punto de marcar esta ruta como terminada. {pasajerosConfirmados.length > 0 && "Podrás calificar a tus pasajeros a continuación."}</p>
            
            <div className="flex gap-3">
              <button disabled={cargando} onClick={() => setModalFinalizar(false)} className="flex-1 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all">Cancelar</button>
              <button disabled={cargando} onClick={iniciarFinalizacion} className="flex-1 bg-blue-600 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-blue-900/50 active:scale-95 transition-all">Continuar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHOFER CALIFICA PASAJEROS */}
      {modalCalificarPasajeros && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[110000] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full max-w-md rounded-[35px] shadow-2xl p-6 relative border border-slate-800 flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 text-center shrink-0">Califica a tus Pasajeros</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-6 text-center uppercase tracking-widest shrink-0">¿Cómo se comportaron durante el viaje?</p>

            <div className="space-y-4 overflow-y-auto no-scrollbar mb-6 flex-1">
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

            <button onClick={enviarCalificacionesYFinalizar} disabled={cargando} className="w-full shrink-0 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 font-black uppercase text-xs tracking-[2px] shadow-lg shadow-blue-900/50 active:scale-95 transition-all">
              {cargando ? 'Guardando...' : 'Finalizar y Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL PASAJERO CALIFICA CHOFER */}
      {modalCalificacion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center max-h-[85vh] overflow-y-auto">
            <button onClick={() => setModalCalificacion(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            <div className="w-16 h-16 rounded-[20px] bg-blue-600 mx-auto overflow-hidden mb-4 border-2 border-slate-700 flex items-center justify-center">
              {viaje?.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <span className="text-white font-black italic text-2xl">D</span>}
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">Califica a {String(viaje?.cN || viaje?.conductor || "Usuario")}</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">¿Qué tal estuvo el viaje?</p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} onClick={() => setStars(num)} className="active:scale-75 transition-all">
                  <Star size={36} className={`${stars >= num ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-700'} transition-colors`} />
                </button>
              ))}
            </div>

            <textarea value={comentarioResena} onChange={(e) => setComentarioResena(e.target.value)} placeholder="Deja un breve comentario (Opcional)..." className="w-full bg-slate-900 border border-slate-700 text-white rounded-[20px] p-4 text-xs font-bold outline-none focus:border-amber-400 resize-none h-24 mb-6" />
            <button disabled={cargando || stars === 0} onClick={enviarCalificacion} className="w-full bg-amber-400 text-amber-950 rounded-full p-4 font-black uppercase text-xs tracking-[2px] shadow-lg shadow-amber-900/50 active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none">
              {cargando ? 'Enviando...' : 'Enviar Reseña'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ABORDAJE (PIN) - AHORA CON SCROLL INTERNO SI HACE FALTA */}
      {modalAbordaje && (
        <div className="fixed inset-0 z-[110000] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 pb-8">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-lg font-black italic uppercase text-slate-800">Verificación de Abordaje</h3>
              <button onClick={() => setModalAbordaje(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-6 shrink-0">Solicita el PIN secreto a tus pasajeros para confirmar que están en el auto.</p>
            <div className="space-y-4 overflow-y-auto mb-6 flex-1">
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
            <button onClick={procesarAbordajeEIniciar} className="w-full bg-blue-600 text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all shrink-0">Confirmar e Iniciar Viaje</button>
          </div>
        </div>
      )}

      {/* MODAL DE ACOMPAÑANTES */}
      {modalAcompanantes && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-200">
          <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-slate-800">¿Vas con alguien más?</h3>
              <button onClick={() => setModalAcompanantes(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={18} /></button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Selecciona tus acompañantes</p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><User size={18} /></div>
                  <span className="text-sm font-black text-slate-700 uppercase">Tú (Principal)</span>
                </div>
                <span className="font-black text-lg text-slate-400">1</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><Users size={18} /></div>
                  <div><p className="text-sm font-black text-slate-700 uppercase leading-none">Adultos</p></div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <button onClick={() => setAdultosExtra(Math.max(0, adultosExtra - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-slate-600">-</button>
                  <span className="font-black w-4 text-center">{adultosExtra}</span>
                  <button onClick={() => setAdultosExtra(adultosExtra + 1)} disabled={puestosQueQuiero >= cuposRestantes} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-blue-600 disabled:opacity-50">+</button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><Users size={16} /></div>
                  <div><p className="text-sm font-black text-slate-700 uppercase leading-none">Niños</p></div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <button onClick={() => setNinosExtra(Math.max(0, ninosExtra - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-slate-600">-</button>
                  <span className="font-black w-4 text-center">{ninosExtra}</span>
                  <button onClick={() => setNinosExtra(ninosExtra + 1)} disabled={puestosQueQuiero >= cuposRestantes} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-blue-600 disabled:opacity-50">+</button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
               <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Asientos a ocupar</span>
               <span className="text-xl font-black italic text-blue-600">{puestosQueQuiero} / {cuposRestantes}</span>
            </div>

            <button disabled={cargando || puestosQueQuiero > cuposRestantes} onClick={solicitarCola} className="w-full bg-blue-600 text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none">
              {cargando ? 'Enviando...' : 'Confirmar Solicitud'}
            </button>
          </div>
        </div>
      )}
      
      {/* MODAL DE CANCELACIÓN Y PENALIZACIÓN */}
      {modalCancelar.visible && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-red-900/50 text-center max-h-[85vh] overflow-y-auto">
            <div className="bg-red-500/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertTriangle size={30} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              ¿Cancelar {modalCancelar.rol === 'chofer' ? 'el Viaje' : 'tu Asiento'}?
            </h3>
            <p className="text-[11px] font-bold text-red-400 mb-6 bg-red-950/30 p-3 rounded-xl border border-red-900/50">
              ¡ATENCIÓN! Cancelar a esta altura sumará una penalización a tu historial.
            </p>

            <div className="text-left mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Motivo de cancelación:</p>
              <div className="space-y-2">
                {[ "Emergencia personal / Salud", modalCancelar.rol === 'chofer' ? "Falla mecánica del auto" : "Conseguí otra alternativa", modalCancelar.rol === 'chofer' ? "No conseguí suficientes pasajeros" : "Se canceló mi compromiso", "Otro motivo" ].map(motivo => (
                  <button key={motivo} onClick={() => setMotivoCancelacion(motivo)} className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${motivoCancelacion === motivo ? 'bg-red-950/50 border-red-500 text-red-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    {motivo}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button disabled={cargando} onClick={() => {setModalCancelar({visible: false, rol: null}); setMotivoCancelacion("");}} className="flex-1 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all">Volver</button>
              <button disabled={cargando} onClick={ejecutarCancelacion} className="flex-1 bg-red-600 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-red-900/50 active:scale-95 transition-all">{cargando ? '...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {idUsuarioVer && <PerfilUsuarioDetalle uid={idUsuarioVer} onClose={() => setIdUsuarioVer(null)} />}
      {verPerfil && <PerfilPublico conductor={{ ...viaje, identidadVerificada: true }} onClose={() => setVerPerfil(false)} setToastMessage={setToastMessage} setShowToast={setShowToast} />}
    </div>
  );
};
