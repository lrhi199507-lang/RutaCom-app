import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, onSnapshot, arrayUnion, arrayRemove, addDoc, collection, query, where, getDocs, increment, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import PerfilPublico from './PerfilPublico';
import { PerfilUsuarioDetalle } from './PerfilUsuarioDetalle';
import { Geolocation } from '@capacitor/geolocation';
import MapaView from '../Map/MapaView';
import { functions } from '../../firebaseConfig'; 
import { httpsCallableFromURL, httpsCallable } from 'firebase/functions';
import { App } from '@capacitor/app';

import { 
  ArrowLeft, MapPin, User, Users, ShieldCheck, 
  MessageCircle, Repeat, ChevronRight, Snowflake, CigaretteOff, Dog, Check, X, Map, Key, Lock, Unlock, AlertTriangle, Navigation, Share2, Star, BadgeCheck, Clock, RefreshCcw
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
  
  const [toast, setToast] = useState(null);

  const setToastMessage = (msg) => {
    setToast({texto: msg, tipo: "exito"});
    setTimeout(() => setToast(null), 3000);
  };

  const [modalAbordaje, setModalAbordaje] = useState(false);
  const [pinesIngresados, setPinesIngresados] = useState({});
  const [modalFinalizar, setModalFinalizar] = useState(false);

  const [tiempoEsperaAbordaje, setTiempoEsperaAbordaje] = useState(300);

  const [modalCalificacion, setModalCalificacion] = useState(false);
  const [stars, setStars] = useState(0);
  const [comentarioResena, setComentarioResena] = useState("");

  const [modalCalificarPasajeros, setModalCalificarPasajeros] = useState(false);
  const [ratingsChofer, setRatingsChofer] = useState({});
  const [idUsuarioVer, setIdUsuarioVer] = useState(null);

  const [modalCancelar, setModalCancelar] = useState({ visible: false, rol: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  
  const [modalAcompanantes, setModalAcompanantes] = useState(false);
  const [modalTerminos, setModalTerminos] = useState(false);
  const [adultosExtra, setAdultosExtra] = useState(0);
  const [ninosExtra, setNinosExtra] = useState(0);

  const [viajeRetorno, setViajeRetorno] = useState(null);
  const [reservarIdaYVuelta, setReservarIdaYVuelta] = useState(false);

  useEffect(() => {
    const buscarRetorno = async () => {
      if (viaje?.conRetornoProgramado && viaje?.idEnlace) {
        try {
          const qRetorno = query(
            collection(db, "Viajes"),
            where("idEnlace", "==", viaje.idEnlace),
            where("tipoRuta", "==", "vuelta_de_ruta")
          );
          const snap = await getDocs(qRetorno);
          if (!snap.empty) setViajeRetorno({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } catch (error) { console.error("Error buscando retorno:", error); }
      }
    };
    buscarRetorno();
  }, [viaje?.conRetornoProgramado, viaje?.idEnlace]);
  
  const [ratingConductor, setRatingConductor] = useState({ promedio: "0.0", total: 0 });
  const [viajeActivoBloqueante, setViajeActivoBloqueante] = useState(false);
  
  const [reservaActivaBloqueante, setReservaActivaBloqueante] = useState(false);
  const [revisandoBloqueo, setRevisandoBloqueo] = useState(true);
  
  const soyConductor = viaje?.uidConductor === userData?.id || viaje?.idCreador === userData?.id;
  const estadoViaje = viaje?.estado || "disponible"; 

  const hayModalAbierto = modalAbordaje || modalAcompanantes || modalCancelar.visible || modalFinalizar || modalCalificarPasajeros || modalCalificacion || modalTerminos;

  const ejecutarConTimeout = async (promesa, tiempoMs = 15000) => {
    return Promise.race([
      promesa,
      new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT_RED")), tiempoMs))
    ]);
  };

  useEffect(() => {
    if (window.google && window.google.maps) return;
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCUNgw1YBOVZKYAhTgcW00G1c09alI2kMs&libraries=places";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    let watchId = null;
    
    const iniciarMonitoreoRuta = async () => {
      try {
        await Geolocation.requestPermissions();
        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          async (position, error) => {
            if (error || !position) return;
            try {
              await updateDoc(doc(db, "Viajes", viaje.id), {
                latChofer: position.coords.latitude,
                lngChofer: position.coords.longitude,
                posicionChofer: {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude,
                  heading: position.coords.heading || 0
                },
                ultimaActualizacion: new Date().toISOString()
              });
            } catch (fsError) {}
          }
        );
      } catch (e) {
        console.error("Error al activar GPS");
      }
    };

    if (soyConductor && (estadoViaje === 'en_curso' || estadoViaje === 'buscando')) {
      iniciarMonitoreoRuta();
    }

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [soyConductor, estadoViaje, viaje?.id]);

  useEffect(() => {
    if (!soyConductor || !userData?.id) return;
    
    const qActivos = query(collection(db, "Viajes"), where("uidConductor", "==", userData.id));
    const unsubActivos = onSnapshot(qActivos, (snap) => {
      const otroViajeActivo = snap.docs.some(d => {
        const data = d.data();
        return d.id !== viaje.id && (data.estado === "buscando" || data.estado === "en_curso");
      });
      setViajeActivoBloqueante(otroViajeActivo);
    });
    
    return () => unsubActivos();
  }, [soyConductor, userData?.id, viaje?.id]);

  const pasajerosConfirmados = obtenerArraySeguro(viaje?.pasajeros);
  const solicitudesPendientes = obtenerArraySeguro(viaje?.reservasPendientes);
  
  const miReserva = pasajerosConfirmados.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
  const yaSoyPasajero = !!miReserva;
  const yaSolicite = solicitudesPendientes.some(p => p && p.id === userData?.id);

  useEffect(() => {
    let interval;
    if (modalAbordaje && tiempoEsperaAbordaje > 0) {
      interval = setInterval(() => {
        setTiempoEsperaAbordaje((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalAbordaje, tiempoEsperaAbordaje]);

  const formatoTiempo = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (soyConductor || !userData?.id || yaSoyPasajero || yaSolicite) {
      setRevisandoBloqueo(false);
      return;
    }

    let isComponentMounted = true;

    const verificarBloqueo = async () => {
      try {
        const qSol = query(collection(db, "Solicitudes"), where("idPasajero", "==", String(userData.id)));
        const snap = await getDocs(qSol);
        let bloqueado = false;
        
        for (let docSnap of snap.docs) {
          const data = docSnap.data();
          if (data.idViaje !== viaje.id && (data.estado === 'pendiente' || data.estado === 'aprobada')) {
            const vSnap = await getDoc(doc(db, "Viajes", data.idViaje));
            if (vSnap.exists()) {
              const vData = vSnap.data();
              if (['disponible', 'buscando', 'en_curso'].includes(vData.estado)) {
                 const enConfirmados = (vData.pasajeros || []).some(p => p && (p.id === userData.id || p.uid === userData.id));
                 const enPendientes = (vData.reservasPendientes || []).some(p => p && (p.id === userData.id || p.uid === userData.id));
                 
                 if (enConfirmados || enPendientes) {
                   bloqueado = true;
                   break;
                 }
              }
            }
          }
        }
        
        if (isComponentMounted) {
          setReservaActivaBloqueante(bloqueado);
          setRevisandoBloqueo(false);
        }
      } catch (error) { 
        if (isComponentMounted) setRevisandoBloqueo(false);
      }
    };

    verificarBloqueo();
    return () => { isComponentMounted = false; };
  }, [soyConductor, userData?.id, viaje?.id, yaSoyPasajero, yaSolicite]);

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
    const reservaPasajero = pasajerosConfirmados.find(p => p && (p.id === userData?.id || p.uid === userData?.id));
    
    if (!esConductor && reservaPasajero && viaje?.estado === 'finalizado' && !reservaPasajero.calificado) {
      setModalCalificacion(true);
    }
  }, [viaje?.estado, viaje?.pasajeros, userData?.id]);
  
  const puestosTotales = Number(viaje?.asientos) || Number(viaje?.puestos) || 1;
  const asientosOcupados = pasajerosConfirmados.reduce((total, p) => {
    return p.abordado === 'ausente' ? total : total + (Number(p?.puestosSolicitados) || 1);
  }, 0);
  const cuposRestantes = Math.max(0, puestosTotales - asientosOcupados);
  const puestosQueQuiero = 1 + adultosExtra + ninosExtra;
  
  const yaCalifico = miReserva?.calificado === true; 
  const mostrarBannerRetorno = viaje?.publicarRegreso && viaje?.tipoRuta !== 'vuelta_de_ruta';

  const activarSOS = () => window.open('tel:911', '_system');

  const notificarLlegadaYAbrirModal = async () => {
    setModalAbordaje(true); 
    setTiempoEsperaAbordaje(300); 
    const promesasNotificaciones = pasajerosConfirmados.map(p => {
      if (p && !p.abordado && p.abordado !== 'ausente' && (p.id || p.uid)) {
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
    } catch (error) {}
  };

  const iniciarChatPrivado = async (usuarioObjetivo) => {
    setCargando(true);
    try {
      const miId = String(userData?.id || userData?.uid);
      const idChofer = String(viaje.uidConductor || viaje.idCreador);
      const idPas = soyConductor 
        ? String(usuarioObjetivo.id || usuarioObjetivo.uid) 
        : miId;

      const qChat = query(
        collection(db, "Chats"),
        where("idViaje", "==", viaje.id),
        where("uidPasajero", "==", idPas),
        where("participantes", "array-contains", miId)
      );
      
      const chatSnap = await ejecutarConTimeout(getDocs(qChat));
      
      if (!chatSnap.empty) {
        const chatExistente = chatSnap.docs[0];
        onIniciarChat({ id: chatExistente.id, ...chatExistente.data() });
        setTimeout(() => onRegresar(), 150); 
      } else {
        const datosNuevoChat = {
          estadoViaje: estadoViaje || "disponible",
          idViaje: viaje.id || "ID_DESCONOCIDO",
          mensajesSinLeer: 0,
          participantes: [idChofer, idPas],
          ruta: viaje.cO ? `${viaje.cO.split(',')[0]} - ${viaje.cD?.split(',')[0]}` : "Detalle de Ruta",
          timestamp: Date.now(),
          uidConductor: idChofer,
          uidPasajero: idPas,
          ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ultimoMensaje: "Chat iniciado",
          esSoporte: false,
          
          nombreConductor: soyConductor 
            ? String(userData?.nombre || "Conductor") 
            : String(usuarioObjetivo?.nombre || viaje?.cN || viaje?.conductor || "Conductor"),
            
          nombrePasajero: soyConductor 
            ? String(usuarioObjetivo?.nombre || "Pasajero") 
            : String(userData?.nombre || "Pasajero"),
            
          fotoConductor: soyConductor 
            ? (userData?.fotoPerfil || null) 
            : (usuarioObjetivo?.fotoPerfil || viaje?.fotoPerfil || null),
            
          fotoPasajero: soyConductor 
            ? (usuarioObjetivo?.fotoPerfil || null) 
            : (userData?.fotoPerfil || null),
            
          telefonoConductor: soyConductor 
            ? (userData?.telefono || "") 
            : (usuarioObjetivo?.telefono || viaje?.telefono || ""),
            
          telefonoPasajero: soyConductor 
            ? (usuarioObjetivo?.telefono || "") 
            : (userData?.telefono || "")
        };

        const nuevoChatRef = await ejecutarConTimeout(addDoc(collection(db, "Chats"), datosNuevoChat));
        onIniciarChat({ id: nuevoChatRef.id, ...datosNuevoChat });
        setTimeout(() => onRegresar(), 150);
      }
      
    } catch (e) {
      console.error("Error abriendo chat:", e);
      setToast({ texto: "Error de conexión al abrir chat", tipo: "error" });
      setTimeout(() => setToast(null), 3500);
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
      const objChofer = {
        id: viaje.uidConductor || viaje.idCreador,
        nombre: viaje.cN || viaje.conductor || "Conductor",
        fotoPerfil: viaje.fotoPerfil || null,
        telefono: viaje.telefono || ""
      };
      iniciarChatPrivado(objChofer); 
    }
  };

const solicitarCola = async () => {
    const costoViajeIda = Number(viaje?.precio || 0) * puestosQueQuiero;
    const costoViajeVuelta = (reservarIdaYVuelta && viajeRetorno) ? (Number(viajeRetorno?.precio || 0) * puestosQueQuiero) : 0;
    const costoTotalPeticion = costoViajeIda + costoViajeVuelta;
    
    const miSaldoActual = Number(userData?.saldo || 0);

    if (miSaldoActual < costoTotalPeticion) {
      setToast({ texto: `Saldo insuficiente. Necesitas $${costoTotalPeticion.toFixed(2)}`, tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (puestosQueQuiero > cuposRestantes) {
      setToast({ texto: "No hay suficientes puestos para la Ida", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (reservarIdaYVuelta && viajeRetorno) {
      const psjsRetorno = Array.isArray(viajeRetorno.pasajeros) ? viajeRetorno.pasajeros : Object.values(viajeRetorno.pasajeros || {});
      const asientosVueltaOcupados = psjsRetorno.reduce((total, p) => total + (Number(p?.puestosSolicitados) || 1), 0);
      const cuposVueltaRestantes = (Number(viajeRetorno.asientos) || Number(viajeRetorno.puestos) || 4) - asientosVueltaOcupados;
      
      if (puestosQueQuiero > cuposVueltaRestantes) {
         setToast({ texto: "No hay puestos suficientes para el Regreso", tipo: "error" });
         setTimeout(() => setToast(null), 3500);
         return;
      }
    }

    setCargando(true);
    try {
      let lat = 0; let lng = 0;
      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
        lat = position.coords.latitude; 
        lng = position.coords.longitude;
      } catch (gpsError) {
        setToast({ texto: "Enciende tu GPS o Ubicación para pedir la cola", tipo: "error" });
        setTimeout(() => setToast(null), 4000);
        setCargando(false); 
        return; 
      }

      const miId = userData?.id || userData?.uid;
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
        boardado: false, 
        abordado: false, 
      };

      const procesarReservaUnica = async (viajeObjetivo, esRetorno = false) => {
        const idConductorObj = viajeObjetivo.uidConductor || viajeObjetivo.idCreador;
        const autoAceptaViaje = viajeObjetivo.autoAceptar === true; 
        
        await addDoc(collection(db, "Solicitudes"), {
          idConductor: String(idConductorObj), 
          nombrePasajero: String(nombreUsuario), 
          idViaje: String(viajeObjetivo.id),
          idPasajero: String(miId), 
          estado: autoAceptaViaje ? "aprobada" : "pendiente",
          puestosSolicitados: Number(puestosQueQuiero), 
          fecha: serverTimestamp()
        });

        const extraTexto = puestosQueQuiero > 1 ? ` con ${puestosQueQuiero - 1} acompañante(s)` : "";
        let tituloNoti = autoAceptaViaje ? "¡Nuevo Pasajero!" : "¡Nueva Solicitud!";
        let cuerpoNoti = `${nombreUsuario} ${autoAceptaViaje ? 'se unió a' : 'quiere unirse a'} tu viaje${extraTexto}.`;

        if (reservarIdaYVuelta) {
            if (esRetorno) {
                tituloNoti = autoAceptaViaje ? "¡Regreso Confirmado! 🔁" : "¡Solicitud de Regreso! 🔁";
                cuerpoNoti = `${nombreUsuario} también ${autoAceptaViaje ? 'aseguró' : 'solicitó'} su puesto para el viaje de VUELTA${extraTexto}.`;
            } else {
                tituloNoti = autoAceptaViaje ? "¡Pasajero Ida y Vuelta! ✈️" : "¡Solicitud Ida y Vuelta! ✈️";
                cuerpoNoti = `${nombreUsuario} ${autoAceptaViaje ? 'se unió a' : 'quiere unirse a'} tu viaje de IDA, y también va en el de REGRESO${extraTexto}.`;
            }
        }

        if (autoAceptaViaje) {
          const procesadorEnNube = httpsCallableFromURL(functions, 'https://procesar-cancelacion-segura-1080063705561.us-central1.run.app');
          await procesadorEnNube({ 
            accion: 'reservar', 
            viajeId: viajeObjetivo.id, 
            pasajeroId: String(miId), 
            puestosSolicitados: Number(puestosQueQuiero),
            precio: Number(viajeObjetivo.precio), 
            esAutoAceptar: true, 
            datosPasajero: datosPasajeroBase 
          });
          if (idConductorObj) await enviarNotificacion(idConductorObj, tituloNoti, cuerpoNoti, "exito");
        } else {
          await updateDoc(doc(db, "Viajes", viajeObjetivo.id), {
            reservasPendientes: arrayUnion({ ...datosPasajeroBase, estado: 'pendiente' })
          });
          if (idConductorObj) {
            await enviarNotificacion(idConductorObj, tituloNoti, cuerpoNoti, "viaje");
          }
        }
      };

      await ejecutarConTimeout(procesarReservaUnica(viaje, false), 15000);

      if (reservarIdaYVuelta && viajeRetorno) {
        await ejecutarConTimeout(procesarReservaUnica(viajeRetorno, true), 15000);
      }

      setToast({ texto: viaje.autoAceptar ? "¡Reserva confirmada!" : "Solicitud enviada al chofer", tipo: "exito" });
      setModalAcompanantes(false); 
      setTimeout(() => setToast(null), 3000);

    } catch (e) { 
      const mensajeReal = e.message === "TIMEOUT_RED" ? "Red inestable. Validando..." : `Fallo: ${e.message}`;
      setToast({ texto: mensajeReal, tipo: "error" }); 
      setTimeout(() => setToast(null), 5000);
    } finally { 
      setCargando(false); 
    }
  };
  
  const cancelarSolicitud = async () => {
    setCargando(true);
    try {
      const pasajeroAborrar = solicitudesPendientes.find(p => p && p.id === userData?.id);
      if (pasajeroAborrar) await ejecutarConTimeout(updateDoc(doc(db, "Viajes", viaje.id), { reservasPendientes: arrayRemove(pasajeroAborrar) }));
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
      const cancelarEnNube = httpsCallableFromURL(functions, 'https://procesar-cancelacion-segura-1080063705561.us-central1.run.app');
      await ejecutarConTimeout(cancelarEnNube({ 
        viajeId: viaje.id, 
        pasajeroId: userData?.id, 
        rol: modalCancelar.rol, 
        motivo: motivoCancelacion 
      }), 15000);

      setModalCancelar({ visible: false, rol: null });
      setToast({ texto: "Cancelación procesada y reembolsada", tipo: "exito" });
      setTimeout(() => setToast(null), 4000);
      
      if (modalCancelar.rol === 'chofer') onRegresar(); 
      
    } catch (error) {
      const mensajeReal = error.message === "TIMEOUT_RED" ? "Red inestable. Procesando..." : `Fallo: ${error.message}`;
      setToast({ texto: mensajeReal, tipo: "error" });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setCargando(false); 
    }
  };
  
  const gestionarSolicitud = async (solicitud, accion) => {
    setCargando(true);
    try {
      const viajeRef = doc(db, "Viajes", viaje.id);
      const idPasajero = solicitud.id || solicitud.uid;

      if (accion === 'aceptar') {
        const puestosQuePidio = Number(solicitud.puestosSolicitados) || 1;
        if (puestosQuePidio > cuposRestantes) { 
          setToast({ texto: "Sin puestos suficientes", tipo: "error" }); 
          setCargando(false); return; 
        }

        const procesadorEnNube = httpsCallableFromURL(functions, 'https://procesar-cancelacion-segura-1080063705561.us-central1.run.app');
        
        await ejecutarConTimeout(procesadorEnNube({ 
          accion: 'reservar', 
          viajeId: viaje.id, 
          pasajeroId: idPasajero, 
          puestosSolicitados: puestosQuePidio,
          precio: Number(viaje.precio),
          esAutoAceptar: false,
          datosPasajero: solicitud
        }), 15000);
        
        await enviarNotificacion(idPasajero, "¡Cola Aceptada!", `${userData?.nombre} te confirmó. ¡Revisa tu PIN!`, "exito");
        setToast({ texto: "Pasajero aceptado y saldo retenido", tipo: "exito" });

      } else {
        await ejecutarConTimeout(updateDoc(viajeRef, { reservasPendientes: arrayRemove(solicitud) }));
        await enviarNotificacion(idPasajero, "Solicitud no confirmada", "El conductor no pudo procesar tu solicitud.", "alerta");
        setToast({ texto: "Solicitud rechazada", tipo: "exito" });
      }
    } catch (e) { 
      const mensajeReal = e.message === "TIMEOUT_RED" ? "Reintentando cobro..." : `Fallo: ${e.message}`;
      setToast({ texto: mensajeReal, tipo: "error" });
      setTimeout(() => setToast(null), 5000);
    } finally { 
      setCargando(false); 
    }
  };
  
  const validarPinIndividual = async (pasajero) => {
    const idPasajero = pasajero.id || pasajero.uid;
    const pinIngresado = String(pinesIngresados[idPasajero] || "").trim();
    const pinReal = String(pasajero.pin || "").trim();

    if (pinIngresado !== pinReal || pinReal === "") {
      setToast({ texto: "PIN Incorrecto", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setCargando(true);
    try {
      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (!p) return null;
        if ((p.id || p.uid) === idPasajero) return { ...p, abordado: true };
        return p;
      }).filter(Boolean);

      await ejecutarConTimeout(updateDoc(doc(db, "Viajes", viaje.id), { pasajeros: pasajerosActualizados }));
      setToast({ texto: `${pasajero.nombre} validado con éxito`, tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ texto: "Error al validar. Revisa tu señal.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCargando(false);
    }
  };

  const marcarPasajeroAusente = async (pasajero) => {
    setCargando(true);
    try {
      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (!p) return null;
        if ((p.id || p.uid) === (pasajero.id || pasajero.uid)) return { ...p, abordado: 'ausente' };
        return p;
      }).filter(Boolean);

      await ejecutarConTimeout(updateDoc(doc(db, "Viajes", viaje.id), { pasajeros: pasajerosActualizados }));
      setToast({ texto: `${pasajero.nombre} marcado como ausente`, tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ texto: "Error al actualizar.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCargando(false);
    }
  };

  const iniciarRutaDefinitiva = async () => {
    setCargando(true);
    try {
      await ejecutarConTimeout(updateDoc(doc(db, "Viajes", viaje.id), { estado: 'en_curso' }));
      setModalAbordaje(false);
      setToast({ texto: "¡Buen Viaje! Ruta Iniciada", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { 
      setToast({ texto: "Error al iniciar ruta.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
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
    } else { cambiarEstadoViaje('finalizado'); }
  };

  const enviarCalificacionesYFinalizar = async () => {
    setCargando(true);
    try {
      const llamarBunker = httpsCallableFromURL(functions, 'https://finalizar-viaje-v2-1080063705561.us-central1.run.app');
      const resultado = await ejecutarConTimeout(llamarBunker({ viajeId: viaje.id, ratingsChofer: ratingsChofer }), 15000);

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
      setToast({ texto: "Error al cobrar o procesar el viaje. Intenta otra vez.", tipo: "error" });
      setTimeout(() => setToast(null), 3500);
    } finally { setCargando(false); }
  };
  
  const cambiarEstadoViaje = async (nuevoEstado) => {
    setCargando(true);
    try {
      const viajeRef = doc(db, "Viajes", viaje.id);
      await ejecutarConTimeout(updateDoc(viajeRef, { estado: nuevoEstado }));
      
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
      await ejecutarConTimeout(addDoc(collection(db, "Resenas"), {
        idViaje: viaje.id, idConductor: idChofer, idPasajero: userData?.id || "SinID",
        nombrePasajero: userData?.nombre || "Usuario", estrellas: stars, comentario: String(comentarioResena || ""), fecha: new Date().toISOString()
      }));
      const pasajerosActualizados = pasajerosConfirmados.map(p => {
        if (!p) return null;
        return (p.id === userData?.id || p.uid === userData?.id) ? { ...p, calificado: true } : p;
      }).filter(Boolean);

      await ejecutarConTimeout(updateDoc(doc(db, "Viajes", viaje.id), { pasajeros: pasajerosActualizados }));
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
    
    if (viaje.latChofer && viaje.lngChofer) {
      const linkMapa = `https://maps.google.com/?q=${viaje.latChofer},${viaje.lngChofer}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(`${mensajeBase}\n\n📍 Ver ubicación en tiempo real del vehículo:\n${linkMapa}`)}`, '_blank');
      return; 
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude; 
          const lon = position.coords.longitude;
          const linkMapa = `https://maps.google.com/?q=${lat},${lon}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(`${mensajeBase}\n\n📍 Ver mi ubicación actual:\n${linkMapa}`)}`, '_blank');
        },
        () => { 
          window.open(`https://wa.me/?text=${encodeURIComponent(mensajeBase)}`, '_blank'); 
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 15000 }
      );
    } else { 
      window.open(`https://wa.me/?text=${encodeURIComponent(mensajeBase)}`, '_blank'); 
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col font-sans h-[100dvh] w-screen overflow-hidden animate-in slide-in-from-right duration-300">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[120000] w-max max-w-[95vw] animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-[#1F2937]' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? <ShieldCheck size={18} className="text-[#10B981] shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
            <span className="text-center leading-tight break-words">{toast.texto}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-32 relative">
        <div className="p-4 pt-6 flex justify-between items-center sticky top-0 z-[60] bg-slate-50/90 backdrop-blur-sm">
          <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 hover:text-[#063971] active:scale-95 transition-all"> 
            <ArrowLeft size={16} strokeWidth={3} />  <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
          {estadoViaje === 'en_curso' && (
            <div className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 animate-pulse border border-[#10B981]/30">
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
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                    <p className="text-[#1F2937] text-[11px] font-black uppercase tracking-widest"> 
                      {estadoViaje === 'buscando' ? (soyConductor ? "En ruta para recoger pasajeros" : "Chofer en camino a buscarte") : (viaje.latChofer ? `En ruta a ${viaje?.cD?.split(',')[0] || "Destino"}` : "Esperando Señal GPS...")}
                    </p>
                  </div>
               </div>
            </div>

            <button onClick={compartirRuta} className="w-full bg-[#063971]/5 border-2 border-[#063971]/20 text-[#063971] rounded-[30px] p-4 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm">
               <Share2 size={20} /> <span className="font-black uppercase text-xs tracking-wider">Compartir Ruta a Familiar</span>
            </button>

            {yaSoyPasajero && !soyConductor && (estadoViaje === 'buscando') && (
              <div className="bg-[#1F2937] p-6 rounded-[35px] shadow-lg border border-[#1F2937] flex flex-col items-center justify-center text-center mb-6 animate-in zoom-in duration-300">
                <div className="bg-[#063971]/20 p-3 rounded-full mb-3"><Key size={24} className="text-[#063971]" /></div>
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
                   const ausente = p.abordado === 'ausente';
                   const aBordo = p.abordado === true || p.boardado === true;

                   return (
                     <div key={`hud-${p.id || p.uid || index}`} className={`flex items-center gap-3 p-3.5 rounded-[25px] border ${ausente ? 'bg-red-50/50 border-red-100 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center">
                          {p.fotoPerfil ? <img src={p.fotoPerfil} className="w-full h-full object-cover"/> : <User size={20} className="text-slate-400" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className={`font-black text-xs uppercase truncate ${ausente ? 'text-red-700 line-through' : 'text-[#1F2937]'}`}>{String(p.nombre || "Usuario")}</p>
                          <p className={`text-[8px] font-black uppercase mt-0.5 ${aBordo ? 'text-[#10B981]' : (ausente ? 'text-red-500' : 'text-amber-500')}`}>
                            {aBordo ? 'A Bordo (Validado)' : (ausente ? 'No se presentó' : 'Falta Validar PIN')}
                          </p>
                       </div>
                       <div className={`${aBordo ? 'bg-[#10B981]/10' : (ausente ? 'bg-red-100' : 'bg-amber-100')} p-2 rounded-full shrink-0`}>
                         {aBordo ? <ShieldCheck size={18} className="text-[#10B981]" /> : (ausente ? <X size={18} className="text-red-600" /> : <Clock size={18} className="text-amber-600" />)}
                       </div>
                       
                       {soyConductor && !ausente && (
                         <button disabled={cargando} onClick={(e) => {  e.stopPropagation();  iniciarChatPrivado(p); }} 
                          className="w-10 h-10 rounded-full bg-[#1F2937] text-white flex items-center justify-center active:scale-90 transition-all shrink-0 ml-1 shadow-md shadow-[#1F2937]/30" >
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
                  <div className="flex items-start text-[#10B981]">
                    <span className="text-xl font-black italic mt-1">$</span>
                    <span className="text-5xl font-black italic leading-none">{String(viaje?.precio || "0")}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-9 h-9 rounded-full bg-[#063971]/5 flex items-center justify-center border-2 border-[#063971]"><div className="w-2.5 h-2.5 rounded-full bg-[#063971]" /></div>
                  <p className="text-[11px] font-black text-[#1F2937] mt-2 uppercase italic leading-none">{String(viaje?.cO || "N/A")}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje?.cO || "")}</p>
                </div>
                <div className="flex-1 px-2"><div className="w-full h-[2px] bg-slate-200 rounded-full" /></div>
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-9 h-9 rounded-full bg-[#10B981]/5 flex items-center justify-center border-2 border-[#10B981]"><MapPin size={16} className="text-[#10B981]" /></div>
                  <p className="text-[11px] font-black text-[#1F2937] mt-2 uppercase italic leading-none">{String(viaje?.cD || "N/A")}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{obtenerEstado(viaje?.cD || "")}</p>
                </div>
              </div>
            </div>

            {viaje.referencia && viaje.referencia.trim() !== "" && (
              <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Punto de Encuentro</p>
                <p className="text-base font-semibold text-[#1F2937]">{viaje.referencia}</p>
              </div>
            )}
            
            {mostrarBannerRetorno && (
              <div className="bg-[#10B981]/10 p-5 rounded-[30px] border border-[#10B981]/30 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center"><Repeat size={18} className="text-[#10B981]" /></div>
                <div>
                  <p className="text-[10px] font-black text-[#10B981] uppercase tracking-wider">CON RETORNO PROGRAMADO</p>
                  <p className="text-sm font-bold text-[#1F2937] mt-1">Regresa el {formatearFechaHoraRetorno(viaje?.fechaRegreso || viaje?.fechaRetorno, viaje?.horaRegreso || viaje?.horaRetorno)}</p>
                </div>
              </div>
            )}

            <div onClick={() => setVerPerfil(true)} className="bg-white p-5 rounded-[30px] border border-slate-100 flex flex-col gap-3 active:scale-95 transition-all shadow-sm cursor-pointer hover:border-[#063971]/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-[#063971] overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center">
                  {viaje?.fotoPerfil ? <img src={viaje.fotoPerfil} className="w-full h-full object-cover" /> : <span className="text-white font-black italic text-xl">D</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-base font-black italic text-[#1F2937] uppercase truncate">{String(viaje?.cN || viaje?.conductor || "Usuario")}</p>
                    {viaje?.identidadVerificada && <BadgeCheck size={18} className="text-[#10B981] fill-[#10B981]/20 shrink-0" strokeWidth={2.5} />}
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
                    <p className="text-xs font-black italic text-[#1F2937] uppercase truncate">{viaje.vehiculo.marca} {viaje.vehiculo.modelo}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-[20px] border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Color</p>
                    <p className="text-xs font-black italic text-[#1F2937] uppercase truncate">{viaje.vehiculo.color}</p>
                  </div>
                  <div className="col-span-2 bg-[#1F2937] p-4 rounded-[20px] flex items-center justify-between shadow-inner">
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
                        <p className="text-[11px] font-black uppercase text-[#1F2937] truncate">{String(solicitud.nombre || "Usuario")}</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">Pide <span className="text-orange-600 font-black">{puestosPedidos}</span> asiento(s)</p>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'rechazar')} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-red-100 hover:text-red-500"><X size={16} strokeWidth={3} /></button>
                        <button disabled={cargando} onClick={() => gestionarSolicitud(solicitud, 'aceptar')} className="w-10 h-10 bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30 rounded-full flex items-center justify-center active:scale-90 transition-all"><Check size={16} strokeWidth={3} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-white p-6 rounded-[35px] border border-slate-100 space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PUESTOS ({asientosOcupados}/{puestosTotales})</p>
                {cuposRestantes <= 0 && <span className="text-[9px] text-red-500 font-black uppercase bg-red-50 px-2 py-1 rounded-md">Lleno</span>}
              </div>
              
              <div className="space-y-3">
                {pasajerosConfirmados.map((pasajero, index) => {
                  if (!pasajero) return null;
                  const puestosPedidos = Number(pasajero.puestosSolicitados) || 1;
                  const ausente = pasajero.abordado === 'ausente';
                  const aBordo = pasajero.abordado === true || pasajero.boardado === true;

                  return (
                    <div  key={`pasajero-${pasajero.id || pasajero.uid || index}`}   onClick={() => setIdUsuarioVer(pasajero.id || pasajero.uid)}  className={`border-2 p-4 rounded-[25px] flex items-center gap-4 cursor-pointer active:scale-95 transition-all shadow-sm relative ${ausente ? 'border-red-100 bg-red-50/20 opacity-60' : 'border-[#063971]/20 bg-[#063971]/5 hover:border-[#063971]/50'}`}>
                        <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                           {pasajero.fotoPerfil ? <img src={pasajero.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold uppercase truncate ${ausente ? 'text-red-700 line-through' : 'text-[#1F2937]'}`}>{String(pasajero.nombre || "Pasajero")}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                              {aBordo && <span className="text-[8px] font-black text-[#10B981] uppercase">Ya a bordo</span>}
                              {ausente && <span className="text-[8px] font-black text-red-600 uppercase">No Presentó</span>}
                              {puestosPedidos > 1 && !ausente && <span className="text-[8px] font-black text-[#063971] uppercase bg-[#063971]/10 px-2 py-0.5 rounded-full">+{puestosPedidos - 1} Acompañante(s)</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {aBordo ? <ShieldCheck size={16} className="text-[#10B981]" /> : (ausente ? <X size={14} className="text-red-300" /> : <Lock size={14} className="text-slate-300" />)}
                          
                          {soyConductor && !ausente && (
                            <button disabled={cargando} onClick={(e) => { e.stopPropagation(); iniciarChatPrivado(pasajero); }} 
                              className="w-10 h-10 rounded-full bg-[#1F2937] text-white flex items-center justify-center active:scale-90 transition-all shadow-md shadow-[#1F2937]/30">
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                    </div>
                  );
                })}
                
                {[...Array(cuposRestantes)].map((_, index) => (
                  <div key={`empty-${index}`} className="border border-slate-200 border-dashed p-4 rounded-[25px] flex items-center gap-4 bg-slate-50/50">
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
                  <div className="bg-[#063971]/5 p-4 rounded-[20px] flex items-center gap-3 border border-[#063971]/20">
                    <Snowflake size={18} className="text-[#063971]" />
                    <p className="text-[9px] font-black text-[#063971] uppercase tracking-wide">Aire a.</p>
                  </div>
                )}
                {viaje?.preferencias?.noFumar && (
                  <div className="bg-[#063971]/5 p-4 rounded-[20px] flex items-center gap-3 border border-[#063971]/20">
                    <CigaretteOff size={18} className="text-[#063971]" />
                    <p className="text-[9px] font-black text-[#063971] uppercase tracking-wide">Sin humo</p>
                  </div>
                )}
                {viaje?.preferencias?.mascotas && (
                  <div className="bg-[#063971]/5 p-4 rounded-[20px] flex items-center gap-3 border border-[#063971]/20">
                    <Dog size={18} className="text-[#063971]" />
                    <p className="text-[9px] font-black text-[#063971] uppercase tracking-wide">Mascotas</p>
                  </div>
                )}
                <div className="bg-slate-50 p-4 rounded-[20px] flex items-center gap-3 border border-slate-100 col-span-2">
                  <span className="text-xl">{obtenerIconoEquipaje(viaje?.tipoEquipaje)}</span>
                  <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Equipaje permitido</p>
                      <p className="text-[10px] font-black text-[#1F2937] uppercase mt-0.5">{String(viaje?.tipoEquipaje || "Bolso Ligero")}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {!hayModalAbierto && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-white/90 backdrop-blur-md border-t border-slate-100 z-[100000]">
          
          {soyConductor && estadoViaje === 'disponible' && viajeActivoBloqueante && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-[95vw] animate-in slide-in-from-bottom duration-300">
              <div className="bg-[#1F2937] text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border border-slate-700">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                <span>No puedes iniciar. Finaliza tu ruta actual.</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 h-14 max-w-md mx-auto">
            
            {(estadoViaje === 'disponible' || estadoViaje === 'buscando' || estadoViaje === 'en_curso') && (
              <button disabled={cargando} onClick={manejarChatGlobal} className="w-14 sm:w-auto sm:px-6 shrink-0 bg-[#1F2937] text-white rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-90 transition-all hover:bg-slate-800">
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
                <div className="flex-1 flex gap-2">
                  <button disabled={cargando} onClick={() => setModalCancelar({ visible: true, rol: 'chofer' })} className="w-14 sm:w-auto sm:px-4 shrink-0 bg-red-50 text-red-600 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all border border-red-200">
                    <X size={18} strokeWidth={3} />
                  </button>
                  <button disabled={cargando} onClick={() => setModalFinalizar(true)} className="flex-1 bg-[#063971] text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg shadow-[#063971]/30 active:scale-95 transition-all hover:bg-blue-800">
                    Finalizar Viaje
                  </button>
                </div>
              ) : (
                <div className="flex-1 bg-[#063971]/10 text-[#063971] border border-[#063971]/30 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                  <Navigation size={16} /> En Ruta a Destino
                </div>
              )
            ) : estadoViaje === 'buscando' ? (
              soyConductor ? (
                 <div className="flex-1 flex gap-2">
                   <button disabled={cargando} onClick={() => setModalCancelar({ visible: true, rol: 'chofer' })} className="flex-1 bg-red-50 text-red-600 rounded-[22px] font-black uppercase text-[10px] active:scale-95 transition-all border border-red-200 flex items-center justify-center gap-1">
                     <X size={14} strokeWidth={3} /> Cancelar
                   </button>
                   <button disabled={cargando || pasajerosConfirmados.length === 0} onClick={notificarLlegadaYAbrirModal} className="flex-[2] bg-[#063971] text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none hover:bg-blue-800" >
                     <MapPin size={16} /> {pasajerosConfirmados.length === 0 ? 'Sin Pasajeros' : 'Verificar Pasajeros'}
                   </button>
                 </div>
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

                  {viajeActivoBloqueante ? (
                    <button disabled className="flex-[2] bg-[#1F2937] text-slate-400 rounded-[22px] font-black uppercase text-[10px] shadow-none flex items-center justify-center gap-2 leading-tight border border-slate-700">
                      <Lock size={16} className="text-amber-500" />
                      <div className="flex flex-col items-start text-left">
                        <span>Bloqueado</span>
                        <span className="text-[7px] text-amber-500/80">Termina tu viaje activo</span>
                      </div>
                    </button>
                  ) : (
                    <button disabled={cargando || pasajerosConfirmados.length === 0} onClick={() => cambiarEstadoViaje('buscando')} className="flex-[2] bg-amber-50 text-amber-600 rounded-[22px] font-black uppercase text-[10px] border border-amber-200 active:scale-95 transition-all disabled:bg-slate-300 disabled:text-white disabled:border-slate-300 shadow-sm shadow-amber-100/50">
                      {pasajerosConfirmados.length === 0 ? 'Sin Pasajeros' : 'Ir a recoger'}
                    </button>
                  )}

                </div>
              ) : (
                yaSoyPasajero ? (
                  <div className="flex-1 flex gap-2">
                    <button disabled={cargando} onClick={() => setModalCancelar({ visible: true, rol: 'pasajero' })} className="flex-1 bg-red-50 text-red-600 rounded-[22px] font-black uppercase text-[10px] active:scale-95 transition-all border border-red-200 flex items-center justify-center">
                      Cancelar
                    </button>
                    <div className="flex-[2] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                      <Check size={16} /> Confirmado
                    </div>
                  </div>
                ) : yaSolicite ? (
                  <button disabled={cargando} onClick={cancelarSolicitud} className="flex-1 bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center shadow-inner transition-all active:scale-95">Cancelar Solicitud</button>
                ) : revisandoBloqueo ? (
                  <button disabled className="flex-1 bg-slate-200 text-slate-400 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                    <RefreshCcw size={16} className="animate-spin" /> Verificando...
                  </button>
                ) : reservaActivaBloqueante ? (
                  <button disabled className="flex-1 bg-[#1F2937] text-slate-400 rounded-[22px] font-black uppercase text-[10px] shadow-none flex items-center justify-center gap-2 border border-slate-700">
                    <Lock size={16} className="text-amber-500" />
                    <div className="flex flex-col items-start text-left">
                      <span>Bloqueado</span>
                      <span className="text-[7px] text-amber-500/80">Ya tienes otro viaje</span>
                    </div>
                  </button>
                ) : cuposRestantes > 0 ? (
                    <button disabled={cargando} onClick={() => setModalTerminos(true)} className="flex-1 bg-[#063971] text-white rounded-[22px] font-black uppercase text-[10px] shadow-lg shadow-[#063971]/30 active:scale-95 transition-all hover:bg-blue-800">Pedir Cola</button>
                    ) : (
                  <button disabled className="flex-1 bg-slate-200 text-slate-400 rounded-[22px] font-black uppercase text-[10px]">Viaje Lleno</button>
                )
              )
            ) : yaSoyPasajero && estadoViaje === 'finalizado' && (
               yaCalifico ? (
                 <div className="w-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
                   <Star size={16} className="fill-[#10B981]" /> Viaje Calificado
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
          <div className="bg-[#1F2937] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center max-h-[85vh] overflow-y-auto">
            <div className="bg-[#10B981]/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-[#10B981]/30">
              <Check size={30} className="text-[#10B981]" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">¿Finalizar Viaje?</h3>
            <p className="text-xs font-bold text-slate-300 mb-8 leading-relaxed">Estás a punto de marcar esta ruta como terminada. {pasajerosConfirmados.length > 0 && "Podrás calificar a tus pasajeros a continuación."}</p>
            
            <div className="flex gap-3">
              <button disabled={cargando} onClick={() => setModalFinalizar(false)} className="flex-1 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all hover:bg-slate-700">Cancelar</button>
              <button disabled={cargando} onClick={iniciarFinalizacion} className="flex-1 bg-[#063971] text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] shadow-lg shadow-[#063971]/40 active:scale-95 transition-all hover:bg-blue-800">Continuar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHOFER CALIFICA PASAJEROS */}
      {modalCalificarPasajeros && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[110000] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#1F2937] w-full max-w-md rounded-[35px] shadow-2xl p-6 relative border border-slate-800 flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 text-center shrink-0">Califica a tus Pasajeros</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-6 text-center uppercase tracking-widest shrink-0">¿Cómo se comportaron durante el viaje?</p>

            <div className="space-y-4 overflow-y-auto no-scrollbar mb-6 flex-1">
              {pasajerosConfirmados.map((p, index) => {
                if (!p || p.abordado === 'ausente') return null; // No calificar al que no se presentó
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

            <button onClick={enviarCalificacionesYFinalizar} disabled={cargando} className="w-full shrink-0 bg-[#063971] hover:bg-blue-800 text-white rounded-full p-4 font-black uppercase text-xs tracking-[2px] shadow-lg shadow-[#063971]/50 active:scale-95 transition-all">
              {cargando ? 'Guardando...' : 'Finalizar y Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL PASAJERO CALIFICA CHOFER */}
      {modalCalificacion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#1F2937] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center max-h-[85vh] overflow-y-auto">
            <button onClick={() => setModalCalificacion(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            <div className="w-16 h-16 rounded-[20px] bg-[#063971] mx-auto overflow-hidden mb-4 border-2 border-[#063971]/50 flex items-center justify-center shadow-lg shadow-[#063971]/30">
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

      {/* 🔥 MODAL DE ABORDAJE 🔥 */}
      {modalAbordaje && (
        <div className="fixed inset-0 z-[110000] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 pb-8">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-lg font-black italic uppercase text-[#1F2937]">Verificar Abordaje</h3>
              <button onClick={() => setModalAbordaje(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={18} className="text-slate-500" /></button>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-6 shrink-0">Valida los PIN por separado a medida que suben los pasajeros.</p>
            
            <div className="space-y-4 overflow-y-auto mb-6 flex-1 pr-2">
              {pasajerosConfirmados.map((p, index) => {
                if (!p) return null;
                const idPasajero = p.id || p.uid;
                const ausente = p.abordado === 'ausente';
                const yaABordo = p.abordado === true || p.boardado === true;

                if (ausente) {
                  return (
                    <div key={`pin-${idPasajero || index}`} className="p-4 rounded-3xl border-2 border-red-100 bg-red-50 flex items-center justify-between opacity-70">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><User size={18} className="text-red-400" /></div>
                         <p className="text-xs font-black uppercase text-red-700 line-through">{String(p.nombre || "Usuario")}</p>
                       </div>
                       <span className="text-[9px] font-black uppercase text-red-500 bg-white px-2 py-1 rounded-full border border-red-100">No se presentó</span>
                    </div>
                  );
                }

                if (yaABordo) {
                  return (
                    <div key={`pin-${idPasajero || index}`} className="p-4 rounded-3xl border-2 border-[#10B981]/50 bg-[#10B981]/10 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#10B981]/30">
                           {p.fotoPerfil ? <img src={p.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-[#10B981]" />}
                         </div>
                         <p className="text-xs font-black uppercase text-[#1F2937]">{String(p.nombre || "Usuario")}</p>
                       </div>
                       <ShieldCheck size={24} className="text-[#10B981]" />
                    </div>
                  );
                }

                return (
                  <div key={`pin-${idPasajero || index}`} className="p-4 rounded-3xl border-2 border-slate-100 bg-slate-50 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                         {p.fotoPerfil ? <img src={p.fotoPerfil} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-400" />}
                      </div>
                      <p className="flex-1 text-xs font-black uppercase text-[#1F2937] truncate">{String(p.nombre || "Usuario")}</p>
                    </div>
                    
                
                <div className="flex flex-col gap-2 mt-2">
                 <input type="number" placeholder="PIN" value={pinesIngresados[idPasajero] || ''} onChange={(e) => setPinesIngresados({...pinesIngresados, [idPasajero]: e.target.value})} 
                   className="w-full bg-white border border-slate-200 rounded-xl p-3 text-center text-2xl font-black tracking-[10px] outline-none focus:border-[#063971] shadow-inner text-[#1F2937]" maxLength={4} />
                 <button 
                disabled={cargando || (pinesIngresados[idPasajero] || '').length < 4} onClick={() => validarPinIndividual(p)} className="w-full py-3.5 bg-[#1F2937] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300" >
               Validar PIN
                 </button>
                </div>
                    <button disabled={tiempoEsperaAbordaje > 0 || cargando} onClick={() => marcarPasajeroAusente(p)} className={`w-full py-2.5 rounded-xl border border-red-200 text-[9px] font-black uppercase tracking-wider transition-all ${tiempoEsperaAbordaje > 0 ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-600 active:scale-95'}`}>
                      {tiempoEsperaAbordaje > 0 ? `Se activa en ${formatoTiempo(tiempoEsperaAbordaje)}` : 'Marcar como "No se presentó"'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {(() => {
              const todosListos = pasajerosConfirmados.length > 0 && pasajerosConfirmados.every(p => p.abordado === true || p.boardado === true || p.abordado === 'ausente');
              const alMenosUnoABordo = pasajerosConfirmados.some(p => p.abordado === true || p.boardado === true);
              
              if (todosListos) {
                if (alMenosUnoABordo) {
                  return (
                    <button onClick={iniciarRutaDefinitiva} disabled={cargando} className="w-full bg-[#063971] text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#063971]/30 active:scale-95 transition-all shrink-0">
                      ¡Iniciar Viaje a Destino!
                    </button>
                  );
                } else {
                  return (
                    <div className="w-full bg-red-100 text-red-600 rounded-2xl p-4 font-black uppercase text-[10px] text-center border border-red-200">
                      Nadie se presentó. Cancela el viaje.
                    </div>
                  );
                }
              }

              return (
                 <div className="w-full bg-slate-100 text-slate-400 rounded-2xl p-4 font-black uppercase text-[10px] text-center tracking-widest">
                   Validando Pasajeros...
                 </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* MODAL TERMINOS */}
      {modalTerminos && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-200">
          <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto border-[3px] border-[#063971]/20">
             
             <div className="bg-[#063971]/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-[#063971]/20">
                <ShieldCheck size={30} className="text-[#063971]" />
             </div>
             
             <h3 className="text-lg font-black italic uppercase text-[#1F2937] text-center mb-4">Acuerdos de Viaje</h3>
             
             <div className="space-y-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 shadow-sm">
                   <Clock size={22} className="text-[#063971] shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-[#1F2937]">El tiempo es valioso</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">Si necesitas cancelar, hazlo <span className="text-[#1F2937] font-black">con anticipación</span>. Así no perderás tu dinero ni le harás perder tiempo al chofer.</p>
                   </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 flex gap-3 shadow-sm">
                   <Navigation size={22} className="text-orange-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-orange-700">Chofer en Camino</p>
                      <p className="text-[10px] font-bold text-orange-800 mt-1 leading-relaxed">Si cancelas en el momento que el chofer ya marcó que salió a buscarte, <span className="font-black text-red-600">NO habrá reembolso</span>. El pago irá completo al chofer por su gasolina.</p>
                   </div>
                </div>

                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 flex gap-3 shadow-sm">
                   <AlertTriangle size={22} className="text-red-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-red-700">Cancelaciones y Suspensiones</p>
                      <p className="text-[10px] font-bold text-red-800 mt-1 leading-relaxed">Para mantener la seriedad, al acumular <span className="font-black">3 viajes cancelados</span> tu cuenta será suspendida por 24 hrs o hasta revisión de Soporte.</p>
                   </div>
                </div>
             </div>

             <button 
                onClick={() => { setModalTerminos(false); setModalAcompanantes(true); }} 
                className="w-full bg-[#063971] text-white rounded-[20px] p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#063971]/30 active:scale-95 transition-all hover:bg-blue-800">
                Aceptar y Continuar
             </button>
             <button 
                onClick={() => setModalTerminos(false)} 
                className="w-full text-slate-400 font-black uppercase text-[10px] mt-4 tracking-widest active:scale-95 transition-colors hover:text-slate-600">
                Cancelar Reserva
             </button>
          </div>
        </div>
      )}

      {/* MODAL DE ACOMPAÑANTES */}
      {modalAcompanantes && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-end sm:items-center justify-center animate-in slide-in-from-bottom duration-200">
          <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-[#1F2937]">¿Vas con alguien más?</h3>
              <button onClick={() => setModalAcompanantes(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={18} /></button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Selecciona tus acompañantes</p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#063971]/10 text-[#063971] flex items-center justify-center"><User size={18} /></div>
                  <span className="text-sm font-black text-[#1F2937] uppercase">Tú (Principal)</span>
                </div>
                <span className="font-black text-lg text-slate-400">1</span>
              </div>

              <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><Users size={18} /></div>
                  <div><p className="text-sm font-black text-[#1F2937] uppercase leading-none">Adultos</p></div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <button onClick={() => setAdultosExtra(Math.max(0, adultosExtra - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-slate-600 hover:bg-slate-50">-</button>
                  <span className="font-black w-4 text-center text-[#1F2937]">{adultosExtra}</span>
                  <button onClick={() => setAdultosExtra(adultosExtra + 1)} disabled={puestosQueQuiero >= cuposRestantes} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-[#063971] disabled:opacity-50 disabled:text-slate-400 hover:bg-slate-50">+</button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><Users size={16} /></div>
                  <div><p className="text-sm font-black text-[#1F2937] uppercase leading-none">Niños</p></div>
                </div>
               <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <button onClick={() => setNinosExtra(Math.max(0, ninosExtra - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-slate-600 hover:bg-slate-50">-</button>
                  <span className="font-black w-4 text-center text-[#1F2937]">{ninosExtra}</span>
                  <button onClick={() => setNinosExtra(ninosExtra + 1)} disabled={puestosQueQuiero >= cuposRestantes} className="w-8 h-8 rounded-lg bg-white shadow-sm font-black text-[#063971] disabled:opacity-50 disabled:text-slate-400 hover:bg-slate-50">+</button>
                </div>
              </div>

              {/* SWITCH: IDA Y VUELTA */}
              {viajeRetorno && (
                <div className="flex items-center justify-between p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl mt-4 animate-in slide-in-from-bottom">
                   <div className="flex items-center gap-3">
                      <Repeat size={20} className="text-[#10B981] shrink-0" />
                      <div>
                         <p className="text-[10px] font-black uppercase text-[#10B981] tracking-wider">Asegurar Regreso</p>
                         <p className="text-[9px] font-bold text-emerald-700/80 mt-0.5">El {formatearFechaHoraRetorno(viajeRetorno.fecha, viajeRetorno.hora)}</p>
                      </div>
                   </div>
                   <button onClick={() => setReservarIdaYVuelta(!reservarIdaYVuelta)} className={`w-12 h-6 rounded-full relative transition-colors ${reservarIdaYVuelta ? 'bg-[#10B981] shadow-md shadow-[#10B981]/30' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${reservarIdaYVuelta ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>
              )}

            </div>

            {/* PRECIO DINÁMICO */}
            <div className="flex items-center justify-between p-4 bg-[#063971]/5 border border-[#063971]/20 rounded-2xl mb-6">
               <div>
                  <span className="text-[10px] font-black uppercase text-[#063971] tracking-wider block">Asientos a ocupar</span>
                  {reservarIdaYVuelta && <span className="text-[9px] font-bold text-[#10B981] uppercase block mt-1">+ Retorno Incluido</span>}
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">{puestosQueQuiero} / {cuposRestantes} Disponibles</span>
                  <span className="text-xl font-black italic text-[#10B981]">
                    ${(Number(viaje?.precio || 0) * puestosQueQuiero) + (reservarIdaYVuelta && viajeRetorno ? Number(viajeRetorno.precio || 0) * puestosQueQuiero : 0)}
                  </span>
               </div>
            </div>

            <button disabled={cargando || puestosQueQuiero > cuposRestantes} onClick={solicitarCola} className="w-full bg-[#063971] text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#063971]/30 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none hover:bg-blue-800">
              {cargando ? 'Enviando...' : 'Confirmar Solicitud'}
            </button>
          </div>
        </div>
      )}
      
      {/* MODAL DE CANCELACIÓN Y PENALIZACIÓN */}
      {modalCancelar.visible && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110000] p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#1F2937] w-full max-w-sm rounded-[35px] shadow-2xl p-8 relative border border-slate-800 text-center max-h-[85vh] overflow-y-auto">
            
            <div className="bg-red-500/10 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertTriangle size={30} className="text-red-500" />
            </div>
            
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              ¿Cancelar {modalCancelar.rol === 'chofer' ? 'el Viaje' : 'tu Asiento'}?
            </h3>
            
            {modalCancelar.rol === 'pasajero' ? (
              estadoViaje === 'buscando' ? (
                <p className="text-[11px] font-bold text-orange-400 mb-6 bg-orange-950/30 p-3 rounded-xl border border-orange-900/50">
                  ¡ATENCIÓN! El chofer ya va en camino a buscarte. Si cancelas ahora, indemnizaremos al conductor con tu pago y no habrá reembolso.
                </p>
              ) : (
                <p className="text-[11px] font-bold text-red-400 mb-6 bg-red-950/30 p-3 rounded-xl border border-red-900/50">
                  Cancelar sumará un "strike" a tu historial (Límite: 3). El monto pagado será reembolsado a tu saldo disponible inmediatamente.
                </p>
              )
            ) : modalCancelar.rol === 'chofer' ? (
              pasajerosConfirmados.length > 0 ? (
                <p className="text-[11px] font-bold text-red-400 mb-6 bg-red-950/30 p-3 rounded-xl border border-red-900/50">
                  ¡ATENCIÓN! Tienes pasajeros confirmados. Al cancelar, el dinero se les reembolsará a ellos inmediatamente y tú recibirás un "strike" en tu historial de chofer (Límite: 3).
                </p>
              ) : (
                <p className="text-[11px] font-bold text-[#10B981] mb-6 bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/30">
                  Como el viaje no tiene pasajeros confirmados, puedes cancelarlo sin penalización para publicar uno nuevo.
                </p>
              )
            ) : null}

            <div className="text-left mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Motivo de cancelación:</p>
              <div className="space-y-2">
                {[ "Emergencia personal / Salud", modalCancelar.rol === 'chofer' ? "Falla mecánica del auto" : "Conseguí otra alternativa", modalCancelar.rol === 'chofer' ? "No consiguió suficientes pasajeros" : "Se canceló mi compromiso", "Otro motivo" ].map(motivo => (
                  <button key={motivo} onClick={() => setMotivoCancelacion(motivo)} className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${motivoCancelacion === motivo ? 'bg-red-950/50 border-red-500 text-red-200' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
                    {motivo}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button disabled={cargando} onClick={() => {setModalCancelar({visible: false, rol: null}); setMotivoCancelacion("");}} className="flex-1 bg-slate-800 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all hover:bg-slate-700">Volver</button>
              <button disabled={cargando} onClick={ejecutarCancelacion} className={`flex-1 text-white rounded-full p-4 font-black uppercase text-[10px] tracking-[2px] shadow-lg active:scale-95 transition-all ${(modalCancelar.rol === 'pasajero' || (modalCancelar.rol === 'chofer' && pasajerosConfirmados.length > 0)) ? 'bg-red-600 shadow-red-900/50 hover:bg-red-500' : 'bg-[#10B981] shadow-[#10B981]/40 hover:bg-emerald-400'}`}>{cargando ? '...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
      
      {idUsuarioVer && <PerfilUsuarioDetalle uid={idUsuarioVer} onClose={() => setIdUsuarioVer(null)} />}
      {verPerfil && <PerfilPublico conductor={{ ...viaje, identidadVerificada: true }} onClose={() => setVerPerfil(false)} setToastMessage={setToastMessage} setShowToast={(bool) => { if(!bool) setToast(null); }} />}
    </div>
  );
};
