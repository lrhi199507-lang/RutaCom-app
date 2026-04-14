import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { UBICACIONES, ESTADOS } from "./constants/ubicaciones";
import { Navbar } from "./components/layout/Navbar";
import { KYCProgressBar } from './components/ui/KYCProgressBar';
import { ModalInstruccionesFoto } from './components/ui/ModalInstruccionesFoto';
import { CardViaje } from './components/ui/CardViaje';
import { SenalesConfianza } from './components/ui/SenalesConfianza';
import { PantallaExito } from './components/ui/PantallaExito';
import { BadgeEstatus } from './components/ui/BadgeEstatus';
import { PasosProgreso } from './components/ui/PasosProgreso';
import { CardViajeOptimizada } from './components/ui/CardViajeOptimizada';
import { ProgresoGamificacion } from './components/ui/ProgresoGamificacion';
import { calcularDuracion, obtenerNivel, calcularEstatus } from './utils/helpers';
import { ModalResena } from './components/ui/ModalResena';
import { ModalOpiniones } from './components/ui/ModalOpiniones';
import { ModalChecklist } from './components/ui/ModalChecklist';
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';
import { Header } from './components/ui/Header';
import { SelectorModo } from './components/ui/SelectorModo';
import { BannerVerificacion } from './components/ui/BannerVerificacion';
import { WizardPublicar } from './components/ui/WizardPublicar';
// Importación de Vistas (Pantallas completas)
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, getDocs, deleteDoc, increment
} from "firebase/firestore";
import {
  User, LogOut, Car, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, MessageCircle, CreditCard, Users, 
  ChevronLeft, MapPin, Edit2, AlertTriangle, Star, X,
  Map as MapIcon, Flag, Clock, ArrowRight, Lock, Trophy,
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase, Zap, Palette,
  PlusCircle, History, DollarSign, ChevronRight, LifeBuoy, Crown , Wallet as WalletIcon
} from "lucide-react";

export default function NavegacionPrincipal({ user }) {
  // --- 1. ESTADOS ---
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]); // Los que ve el pasajero
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]); // General
  const [misViajesPublicados, setMisViajesPublicados] = useState([]); // Los del chofer
  
  // Estados de Interfaz
  const [showSearchModal, setShowSearchModal] = useState({ visible: false, type: 'origen' });
  const [searchTerm, setSearchTerm] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [pestañaActiva, setPestañaActiva] = useState("perfil");
  const [successData, setSuccessData] = useState({ show: false, titulo: "", subtitulo: "" });
  const [showFotoInstrucciones, setShowFotoInstrucciones] = useState(false);

  // Estados de Viajes/Solicitudes
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]); 
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [viajeEditando, setViajeEditando] = useState(null); 
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [pasajerosViaje, setPasajerosViaje] = useState([]);
  
  // MÓDULO 18: WIZARD DE PUBLICACIÓN (Chofer)
const [pasoWizard, setPasoWizard] = useState(1);
const [viajeForm, setViajeForm] = useState({
  origen: "", destino: "", paradas: [], rutaSeleccionada: null, precio: "", asientos: 3, horaSalida: "", horaLlegada: "", preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
});

const publicarRuta = async () => {
  console.log("Botón de publicar presionado");
  // Aquí puedes añadir la lógica de Firestore más adelante
}; // <--- ASEGÚRATE DE QUE ESTA LLAVE ESTÉ AQUÍ

const [chatActivo, setChatActivo] = useState(null);
const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [historialChats, setHistorialChats] = useState([]);

  const [perfilPublico, setPerfilPublico] = useState(null);
  const [modalResena, setModalResena] = useState({ visible: false, idSolicitud: null, evaluadoId: null, nombreEvaluado: "" });
  const [calificacion, setCalificacion] = useState(5);
  const [textoResena, setTextoResena] = useState("");
  const [opinionesPerfil, setOpinionesPerfil] = useState([]); 
  const [modalOpinionesVisible, setModalOpinionesVisible] = useState(false);


  // Filtros Búsqueda (Pasajero)
  const [fEO, setFEO] = useState("");
  const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); 
  const [fCD, setFCD] = useState("");
  const [busquedasRecientes, setBusquedasRecientes] = useState([]);

  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", color: "", cedula: "", edad: "", bio: "" });
  
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });

  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [checkSeguridad, setCheckSeguridad] = useState({ placaOk: false, modeloOk: false, conductorOk: false });

  const [viajeActivo, setViajeActivo] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [pinIngresado, setPinIngresado] = useState("");


  const handleLogout = () => {
    signOut(auth);
  };

  useEffect(() => {
    if (!user) return;

    const savedSearches = JSON.parse(localStorage.getItem("busquedasRecientesDLC") || "[]");
    setBusquedasRecientes(savedSearches);

    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPerfilForm({
          marca: data.vehiculo?.marca || "", 
          modelo: data.vehiculo?.modelo || "",
          placa: data.vehiculo?.placa || "", 
          color: data.vehiculo?.color || "", 
          cedula: data.cedula || "",
          edad: data.edad || "",
          bio: data.bio || ""
        });
      }
    });

    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
  const listaViajes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Aquí es donde ocurre la magia:
  setViajes(listaViajes); 
  setResultadosBusqueda(listaViajes); 
});
    const unsubSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idChofer", "==", user.uid), where("estado", "==", "pendiente")), (snap) => {
      setSolicitudesRecibidas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), (snap) => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubViajeActivo = onSnapshot(
  query(
    collection(db, "Solicitudes"), 
    // Usamos 'where' para que Firebase solo nos mande lo que nos interesa
    where("participantes", "array-contains", user.uid) 
  ), 
  (snap) => {
    const actual = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      // Aquí solo filtramos por el estado, porque los IDs ya vienen filtrados desde la base de datos
      .find(s => s.estado !== "completado" && s.estado !== "rechazado");
    
    setViajeActivo(actual || null);
  }
);

    let docsRecibidos = [];
    let docsEnviados = [];
    const actualizarHistorial = (todosLosDocs) => {
        const mapChats = new Map();
        todosLosDocs.forEach(d => {
           const data = d.data();
           const soyEmisor = data.emisorId === user.uid;
           const idOtro = soyEmisor ? data.receptorId : data.emisorId;
           const fechaMs = data.fecha ? data.fecha.toMillis() : Date.now();
           if (!mapChats.has(data.chatId)) {
              mapChats.set(data.chatId, { chatId: data.chatId, idViaje: data.idViaje, idOtro, nombreOtro: soyEmisor ? (data.nombreReceptor || "Usuario") : data.nombreEmisor, ultimoMensaje: data.texto, fecha: fechaMs });
           } else if (fechaMs > mapChats.get(data.chatId).fecha) {
              mapChats.set(data.chatId, { ...mapChats.get(data.chatId), ultimoMensaje: data.texto, fecha: fechaMs });
           }
        });
        setHistorialChats(Array.from(mapChats.values()).sort((a,b) => b.fecha - a.fecha));
    };

    const unsubR = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid)), snap => {
        docsRecibidos = snap.docs; actualizarHistorial([...docsRecibidos, ...docsEnviados]);
    });
    const unsubE = onSnapshot(query(collection(db, "MensajesPrivados"), where("emisorId", "==", user.uid)), snap => {
        docsEnviados = snap.docs; actualizarHistorial([...docsRecibidos, ...docsEnviados]);
    });

    const unsubSoporte = onSnapshot(query(collection(db, "MensajesSoporte"), where("usuarioId", "==", user.uid)), (snap) => {
      const msjs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatSoporte(msjs.sort((a, b) => (a.fecha?.toMillis() || 0) - (b.fecha?.toMillis() || 0)));
    });
// 5.5 Suscripción a Mis Viajes Publicados (Como Chofer)
const qMisViajes = query(collection(db, "Viajes"), where("idCreador", "==", user.uid), orderBy("fecha", "desc"));
const unsubMisViajes = onSnapshot(qMisViajes, (snap) => {
  setMisViajesPublicados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});
    return () => { 
      unsubUser(); unsubViajes();
      unsubSoli(); unsubMisSoli(); 
      unsubR(); unsubE(); unsubSoporte(); unsubViajeActivo(); unsubMisViajes() 
    };
  }, [user]);

  useEffect(() => {
    if (fCO && fCD) {
      const timer = setTimeout(() => {
        const b = { fEO, fCO, fED, fCD };
        const existe = busquedasRecientes.some(x => x.fCO === fCO && x.fCD === fCD);
        if (!existe) {
           const nuevas = [b, ...busquedasRecientes].slice(0, 5);
           setBusquedasRecientes(nuevas);
           localStorage.setItem("busquedasRecientesDLC", JSON.stringify(nuevas));
        }
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [fCD, fCO]);

  const aplicarBusquedaReciente = (b) => {
     setFEO(b.fEO); setFCO(b.fCO); setFED(b.fED); setFCD(b.fCD);
  };

  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      setMensajesChat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubMsg();
  }, [chatActivo]);

  useEffect(() => {
    if (!viajeSeleccionado) {
      setPasajerosViaje([]);
      return;
    }
    const q = query(collection(db, "Solicitudes"), where("idViaje", "==", viajeSeleccionado.id));
    const unsubPasajeros = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPasajerosViaje(list.filter(s => s.estado === "confirmado" || s.estado === "completado" || s.estado === "retenido"));
    });
    return () => unsubPasajeros();
  }, [viajeSeleccionado]);

  useEffect(() => {
    if (!perfilPublico) return;
    const q = query(collection(db, "Opiniones"), where("evaluadoId", "==", perfilPublico.id), orderBy("fecha", "desc"));
    const unsubOps = onSnapshot(q, (snap) => {
       setOpinionesPerfil(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubOps();
  }, [perfilPublico]);

  const abrirChat = (idViaje, idOtroUsuario, nombreOtro) => {
    const chatId = [user.uid, idOtroUsuario].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro: idOtroUsuario, idViaje: idViaje });
    setVista("chat_privado");
  };
  const manejarSubidaFoto = async (archivo) => {
  try {
    console.log("Archivo listo para procesar:", archivo);
    
    const urlTemporal = URL.createObjectURL(archivo);
    
    setUserData(prev => ({ ...prev, fotoPerfil: urlTemporal }));
    
    alert("Foto cargada localmente. ¡Se ve genial!");
  } catch (error) {
    console.error("Error al procesar la foto:", error);
    alert("Hubo un problema con la imagen.");
  }
};

// ACCIONES DE BASE DE DATOS
  const enviarMensajePrivado = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      await addDoc(collection(db, "MensajesPrivados"), {
        chatId: chatActivo.id, idViaje: chatActivo.idViaje, texto: nuevoMensaje.trim(),
        emisorId: user.uid, nombreEmisor: userData.nombre || "Usuario",
        receptorId: chatActivo.idOtro, nombreReceptor: chatActivo.nombre,
        leido: false, fecha: serverTimestamp()
      });
      setNuevoMensaje("");
    } catch (e) { console.error(e); }
  };
const prepararEdicion = (viaje) => {
  setViajeEditando(viaje.id); // Guardamos el ID
setViajeForm({
    origen: `${viaje.cO}, ${viaje.eO}`,
    destino: `${viaje.cD}, ${viaje.eD}`,
    precio: viaje.precio?.toString() || "0",
    asientos: viaje.puestos || 3,
    horaSalida: viaje.horaSalida,
    horaLlegada: viaje.horaLlegada,
    preferencias: viaje.preferencias || { 
      ac: true, 
      noFumar: true, 
      mascotas: false, 
      conversar: true, 
      equipaje: true, 
      maxDosAtras: false 
    }
  });
  setPasoWizard(1); // Iniciamos desde el paso 1 del wizard
  setVista("publicar"); // Cambiamos a la vista de publicación
};
// ACCIONES DE BASE DE DATOS
  const publicarRutaWizard = async () => {
  if (!userData?.cedula) return alert("🚫 Debes verificar tu identidad (KYC) para publicar rutas.");
  if (!viajeForm.origen || !viajeForm.destino || !viajeForm.precio || !viajeForm.horaSalida || !viajeForm.horaLlegada) {
    return alert("Completa todos los campos obligatorios.");
  }

  try {
    const oParts = viajeForm.origen.split(",");
    const dParts = viajeForm.destino.split(",");

    const dataViaje = {
      idCreador: user.uid, // <--- ESTO ES VITAL para que aparezca en "Tus Viajes"
      conductor: userData.nombre,
      cO: oParts[0]?.trim() || viajeForm.origen,
      eO: oParts[1]?.trim() || "",
      cD: dParts[0]?.trim() || viajeForm.destino,
      eD: dParts[1]?.trim() || "",
      precio: Number(viajeForm.precio),
      puestos: Number(viajeForm.asientos),
      horaSalida: viajeForm.horaSalida,
      horaLlegada: viajeForm.horaLlegada,
      preferencias: viajeForm.preferencias,
      viajesTotales: userData.viajesCompletados || 0,
      rating: userData.rating || 5.0,
      fechaActualizacion: serverTimestamp(), // Registramos cuándo se movió
      vehiculoInfo: { 
        marca: userData.vehiculo?.marca || "", 
        modelo: userData.vehiculo?.modelo || "", 
        placa: userData.vehiculo?.placa || "", 
        color: userData.vehiculo?.color || "" 
      }
    };

    if (viajeEditando) {
      // SI HAY UN ID, ACTUALIZAMOS
      await updateDoc(doc(db, "Viajes", viajeEditando), dataViaje);
      alert("✅ Viaje actualizado correctamente.");
    } else {
      // SI NO HAY ID, ES NUEVO
      await addDoc(collection(db, "Viajes"), { ...dataViaje, fecha: serverTimestamp() });
      alert("✅ Viaje publicado con éxito.");
    }

    // LIMPIEZA TOTAL
    setViajeEditando(null);
    setViajeForm({
      origen: "", destino: "", paradas: [], rutaSeleccionada: null, precio: "", asientos: 3,
      horaSalida: "", horaLlegada: "",
      preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
    });
    setStep(1);
    setVista("inicio");

  } catch (e) {
    console.error("Error:", e);
    alert("Error al procesar la solicitud.");
  }
};
  // Función para eliminar un viaje (MÓDULO 12)
const eliminarViaje = async (idViaje) => {
  // Siempre es mejor pedir confirmación antes de borrar algo de la DB
  const confirmar = window.confirm("¿Estás seguro de que quieres eliminar esta ruta? No podrás deshacer esta acción.");
  
  if (confirmar) {
    try {
      await deleteDoc(doc(db, "Viajes", idViaje));
      // No necesitas hacer nada más, onSnapshot actualizará la lista automáticamente
    } catch (e) {
      console.error("Error al eliminar:", e);
      alert("No se pudo eliminar el viaje.");
    }
  }
};
  const enviarSolicitudDirecta = async (viaje) => {
    if (user.uid === viaje.idCreador) return alert("No puedes pedirte una cola a ti mismo.");
    const yaExiste = misSolicitudes.some(s => s.idViaje === viaje.id && s.estado === "pendiente");
    if (yaExiste) return alert("Ya tienes una solicitud pendiente para este viaje.");
    try {
      await addDoc(collection(db, "Solicitudes"), {
        idViaje: viaje.id, idPasajero: user.uid, nombrePasajero: userData.nombre || "Pasajero",
        idChofer: viaje.idCreador, nombreChofer: viaje.conductor, 
        ruta: `${viaje.cO} → ${viaje.cD}`, estado: "pendiente", fase: "solicitado", 
        fechaSolicitud: serverTimestamp(),
        precioViaje: viaje.precio, pagoEstado: "pendiente",
        vehiculoInfo: viaje.vehiculoInfo,
        preferenciasViaje: viaje.preferencias || null
      });
      alert("✅ ¡Cola pedida! Espera la aprobación del chofer.");
    } catch (e) { alert("Error al pedir cola."); }
  };

  const generarPIN = () => Math.floor(1000 + Math.random() * 9000).toString();
  const pasajeroConfirmaEncuentro = async () => {
    const pin = generarPIN();
    try {
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { 
        fase: "pasajero_confirmado_encuentro", 
        pinVerificacion: pin
      });
      alert("Muéstrale este código al chofer para iniciar el viaje.");
    } catch (e) { console.error(e); }
  };

  const choferVerificaPIN = async () => {
    if (pinIngresado === viajeActivo.pinVerificacion) {
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { 
        fase: "viajando",
        pagoEstado: "retenido" 
      });
      alert("✅ PIN Correcto. ¡Fondos RETENIDOS! Inicia el trayecto con seguridad.");
      setPinIngresado("");
    } else {
      alert("❌ PIN Incorrecto. Pídele el código al pasajero.");
    }
  };

  const finalizarViaje = async (rol) => {
    if (!viajeActivo) return;
    if (rol === "chofer" && user.uid !== viajeActivo.idChofer) return alert("Acción no autorizada.");
    if (rol === "pasajero" && user.uid !== viajeActivo.idPasajero) return alert("Acción no autorizada.");

    try {
      const actualizacion = {};
      if (rol === "chofer") actualizacion.finalizadoChofer = true;
      if (rol === "pasajero") actualizacion.finalizadoPasajero = true;

      // 1. Marcamos que esta persona ya confirmó
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), actualizacion);

      // Verificamos si con este clic ya ambas partes finalizaron
      if ((rol === "chofer" && viajeActivo.finalizadoPasajero) || (rol === "pasajero" && viajeActivo.finalizadoChofer)) {
        
        const montoFinal = viajeActivo.precioViaje;

        // 2. Finalizamos la solicitud globalmente
        await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { 
          fase: "finalizado", 
          estado: "completado",
          pagoEstado: "completado",
          montoNetoChofer: montoFinal,
          fechaFinalizacion: serverTimestamp()
        });

        // 3. Sumamos el viaje a los perfiles
        await updateDoc(doc(db, "usuarios", viajeActivo.idChofer), {
          viajesRealizados: increment(1)
        });
        await updateDoc(doc(db, "usuarios", viajeActivo.idPasajero), {
          viajesRealizados: increment(1)
        });

        alert(`🏁 ¡Cola Completada con éxito! Fondos liberados y viaje sumado a tu perfil.`);

        // 4. Abrimos el modal de reseña
        setModalResena({
          visible: true,
          idSolicitud: viajeActivo.id,
          evaluadoId: rol === "chofer" ? viajeActivo.idPasajero : viajeActivo.idChofer,
          nombreEvaluado: rol === "chofer" ? viajeActivo.nombrePasajero : viajeActivo.nombreChofer
        });
        setVista("inicio");
      } else {
        alert("Anotado. Esperando que la otra parte también confirme la llegada.");
      }
    } catch (error) {
      console.error("Error al finalizar:", error);
      alert("No se pudo finalizar el viaje.");
    }
  };
  const enviarResena = async () => {
    if(!modalResena.evaluadoId) return;
    try {
      await addDoc(collection(db, "Opiniones"), {
         evaluadoId: modalResena.evaluadoId,
         evaluadorId: user.uid,
         evaluadorNombre: userData.nombre,
         estrellas: calificacion,
         comentario: textoResena,
         fecha: serverTimestamp(),
         viajeId: modalResena.idSolicitud
      });
      await updateDoc(doc(db, "Solicitudes", modalResena.idSolicitud), { resenaGenerada: true });
      
      setModalResena({ visible: false, idSolicitud: null, evaluadoId: null, nombreEvaluado: "" });
      setCalificacion(5); setTextoResena("");
      alert("✅ Reseña publicada. ¡Gracias por contribuir a la comunidad!");
    } catch(e) { console.error(e); }
  };

  const guardarDatosPerfil = async () => {
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { 
        vehiculo: { 
          marca: perfilForm.marca, 
          modelo: perfilForm.modelo, 
          placa: perfilForm.placa.toUpperCase(), 
          color: perfilForm.color 
        },
        cedula: perfilForm.cedula,
        edad: perfilForm.edad,
        bio: perfilForm.bio
      });
      setConfigOpen(false);
      setSuccessData({
        show: true,
        titulo: "¡Perfil Actualizado!",
        subtitulo: "Tus cambios se guardaron correctamente. Ahora tu perfil genera más confianza."
      });
    } catch (e) { 
      console.error(e);
      alert("Error al guardar los cambios.");
    }
  };

  const cambiarVista = (v) => { setVista(v); setViajeSeleccionado(null); setChatActivo(null); };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic animate-pulse">CARGANDO DAME LA COLA...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans border-x shadow-2xl">
      
      {/* MODALES */}
      <ModalResena 
        modalResena={modalResena}
        setModalResena={setModalResena}
        calificacion={calificacion}
        setCalificacion={setCalificacion}
        textoResena={textoResena}
        setTextoResena={setTextoResena}
        enviarResena={enviarResena}
      />

      <ModalInstruccionesFoto 
        isOpen={showFotoInstrucciones} 
        onClose={() => setShowFotoInstrucciones(false)} 
        onConfirm={() => {
          setShowFotoInstrucciones(false);
          abrirCamara(); 
        }} 
      />

      <ModalOpiniones 
        modalOpinionesVisible={modalOpinionesVisible}
        setModalOpinionesVisible={setModalOpinionesVisible}
        perfilPublico={perfilPublico}
        opinionesPerfil={opinionesPerfil}
      />

      <ModalChecklist 
        mostrarChecklist={mostrarChecklist}
        setMostrarChecklist={setMostrarChecklist}
        viajeActivo={viajeActivo}
        checkSeguridad={checkSeguridad}
        setCheckSeguridad={setCheckSeguridad}
        pasajeroConfirmaEncuentro={pasajeroConfirmaEncuentro}
      />

      <ModalPerfilPublico 
        perfilPublico={perfilPublico}
        setPerfilPublico={setPerfilPublico}
        modalOpinionesVisible={modalOpinionesVisible}
        setModalOpinionesVisible={setModalOpinionesVisible}
      />

      {/* HEADER */}
      <Header 
        userData={userData} 
        modo={modo} 
        viajeActivo={viajeActivo} 
        setVista={setVista} 
        cambiarVista={cambiarVista} 
      />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {vista === "inicio" && !viajeSeleccionado && (
          <div className="space-y-6">
            <SelectorModo modo={modo} setModo={setModo} />
{/* BUSCADOR */}
              {modo === "pasajero" && (
                <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3 animate-in slide-in-from-left">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> ¿A dónde vamos hoy?</p>
                  <div className="grid grid-cols-2 gap-2">
                     <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DESDE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                     <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">DESDE: CIUDAD</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>{setFED(e.target.value); setFCD("");}}><option value="">HASTA: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                     <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fED} value={fCD} onChange={(e)=>setFCD(e.target.value)}><option value="">HASTA: CIUDAD</option>{fED && UBICACIONES[fED].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>

                  {/* MÓDULO 10: BÚSQUEDAS RECIENTES */}
                  {busquedasRecientes.length > 0 && (
                     <div className="pt-3 border-t border-slate-100 mt-2">
                       <p className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><History size={12}/> Búsquedas Recientes</p>
                       <div className="flex gap-2 overflow-x-auto pb-2" style={{scrollbarWidth: 'none'}}>
                          {busquedasRecientes.map((b, i) => (
                            <button key={i} onClick={() => aplicarBusquedaReciente(b)} className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors active:scale-95">
                              <History size={12} className="text-slate-400"/>
                              <div className="text-left">
                                 <p className="text-[9px] font-black italic text-slate-700 leading-none mb-0.5">{b.fCO} <span className="text-blue-500">→</span></p>
                                 <p className="text-[9px] font-black italic text-slate-700 leading-none">{b.fCD}</p>
                              </div>
                            </button>
                          ))}
                       </div>
                     </div>
                  )}
                </div>
              )}
              {/* LISTA DE VIAJES (FILTRADO ACTUALIZADO) */}
    <div className="space-y-4">
       <h3 className="font-black italic uppercase text-lg text-slate-800 pl-2">Viajes Disponibles</h3>
       {viajes.filter(v => (fEO === "" || v.eO === fEO) && (fED === "" || v.eD === fED)).length === 0 ? (
          <div className="bg-slate-100/50 border border-dashed border-slate-300 rounded-[30px] p-8 text-center text-slate-500 font-bold text-xs italic">
             No hay viajes publicados para esta ruta actualmente.
          </div>
       ) : (
         viajes.filter(v => (fEO === "" || v.eO === fEO) && (fED === "" || v.eD === fED)).map(v => (
            <CardViajeOptimizada 
              key={v.id}
              viaje={v}
              estatusChofer={calcularEstatus(v.viajesTotales || 0, v.rating || 0)}
              onClickDetalle={() => setViajeSeleccionado(v)}
              onClickPedir={() => enviarSolicitudDirecta(v)}
              onClickPerfil={() => setPerfilPublico({ /* ... datos ... */ })}
            />
         ))
       )}
    </div>
  </div>
)}
            {/* MODO CHOFER: Wizard de Publicación */}
{modo === "chofer" && (
  <div className="mt-6">
    {/* Aquí empieza el paso 1 que me pasaste */}
    {pasoWizard === 1 && (
      <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">
          ¿Hacia dónde<br/>vas a manejar?
        </h2>
        
        <div className="space-y-4">
          {/* ORIGEN con Autocompletado */}
          <div className="relative">
            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[25px] border border-slate-100 focus-within:border-blue-400">
              <MapPin size={22} className="text-blue-600"/>
              <input 
                type="text" 
                placeholder="Punto de salida (Ej. Valencia)" 
                className="bg-transparent w-full text-sm font-bold outline-none text-slate-700"
                value={viajeForm.origen}
                onChange={(e) => setViajeForm({...viajeForm, origen: e.target.value})}
              />
            </div>
            
            {/* Sugerencias de Origen */}
            {viajeForm.origen.length > 1 && !viajeForm.origen.includes(',') && (
              <div className="absolute z-[100] w-full bg-white border rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                {Object.keys(UBICACIONES).flatMap(estado => 
                  UBICACIONES[estado]
                    .filter(ciudad => ciudad.toLowerCase().includes(viajeForm.origen.toLowerCase()))
                    .map(ciudad => (
                      <button 
                        key={`ori-${estado}-${ciudad}`}
                        onClick={() => setViajeForm({...viajeForm, origen: `${ciudad}, ${estado}`})}
                        className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3"
                      >
                        <MapPin size={14} className="text-blue-400"/> {ciudad}, {estado}
                      </button>
                    ))
                ).slice(0, 5)}
              </div>
            )}
          </div>

          {/* DESTINO con Autocompletado */}
          <div className="relative">
            {/* ... (Repite la misma lógica para el input de destino que tienes en tu código) ... */}
          </div>
        </div>

        <button 
          onClick={() => setPasoWizard(2)}
          disabled={!viajeForm.origen.includes(',') || !viajeForm.destino.includes(',')}
          className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-xl disabled:opacity-30 transition-all active:scale-95"
        >
          Continuar a los detalles
        </button>
      </div>
    )}

    {/* AQUÍ IRÁN LOS PASOS 2, 3, etc. MÁS ADELANTE */}
  </div>
)}

        {/* VISTAS RESTANTES */}
        <div className="space-y-3">
          {vista === "inbox" && (
            <VistaInbox 
              historialChats={historialChats} 
              misViajesPublicados={misViajesPublicados} 
              abrirChat={abrirChat} 
            />
          )}

          {vista === "perfil" && (
            <VistaPerfil 
              userData={userData} 
              pestañaActiva={pestañaActiva} 
              setPestañaActiva={setPestañaActiva} 
              handleLogout={handleLogout} 
              abrirModalFoto={() => setShowFotoInstrucciones(true)}
            />
          )}
        </div>
      </main>
    </div>
  );
};
