import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, Trash2, MessageCircle, CreditCard, Users, 
  ChevronLeft, MapPin, Bell, Edit2, AlertTriangle, Star, X,
  Map as MapIcon, Flag, Info, Clock, ArrowRight, Share2, Key, Lock, Trophy,
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase
} from "lucide-react";

// --- CONSTANTES DE UBICACIÓN ---
const UBICACIONES = {
  "Amazonas": ["Puerto Ayacucho"], "Anzoátegui": ["Barcelona", "Puerto La Cruz"],
  "Apure": ["San Fernando"], "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Barinas": ["Barinas"], "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego"],
  "Cojedes": ["San Carlos", "Tinaquillo"], "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo"], "Lara": ["Barquisimeto", "Cabudare"],
  "Mérida": ["Mérida", "El Vigía"], "Miranda": ["Los Teques", "Chacao", "Baruta"],
  "Monagas": ["Maturín"], "Nueva Esparta": ["Porlamar"], "Portuguesa": ["Guanare"],
  "Táchira": ["San Cristóbal"], "Trujillo": ["Valera"], "Yaracuy": ["San Felipe"],
  "Zulia": ["Maracaibo", "San Francisco"]
};
const ESTADOS = Object.keys(UBICACIONES);

// --- COMPONENTES DE APOYO (MÓDULO 1: REPUTACIÓN) ---
const BadgeEstatus = ({ nivel }) => {
  const configs = {
    "Bronce": { color: "text-slate-500", bg: "bg-slate-100", label: "Novato" },
    "Plata": { color: "text-zinc-500", bg: "bg-zinc-100", label: "Viajero" },
    "Oro": { color: "text-amber-600", bg: "bg-amber-100", label: "Super Driver" },
    "Diamante": { color: "text-blue-600", bg: "bg-blue-100", label: "Elite" }
  };
  const c = configs[nivel] || configs["Bronce"];
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} border border-white shadow-sm`}>
      <ShieldCheck size={10} className={c.color} />
      <span className={`text-[8px] font-black uppercase italic ${c.color}`}>{c.label}</span>
    </div>
  );
};

// --- COMPONENTES DE APOYO (MÓDULO 3: PREFERENCIAS) ---
const VisualizadorPreferencias = ({ prefs }) => {
  if (!prefs) return null;
  const items = [
    { id: 'ac', icon: <Wind size={12}/>, label: "A/C", active: prefs.ac },
    { id: 'noFumar', icon: <CigaretteOff size={12}/>, label: "No Fumar", active: prefs.noFumar },
    { id: 'mascotas', icon: <PawPrint size={12}/>, label: "Mascotas", active: prefs.mascotas },
    { id: 'conversar', icon: <MessageSquare size={12}/>, label: "Charlatán", active: prefs.conversar },
    { id: 'equipaje', icon: <Briefcase size={12}/>, label: "Maletero", active: prefs.equipaje },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map(item => (
        <div key={item.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[8px] font-black uppercase italic transition-all ${item.active ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-300 opacity-50'}`}>
          {item.icon} {item.label}
        </div>
      ))}
    </div>
  );
};

// --- COMPONENTES DE APOYO (MÓDULO 2: CONFIANZA) ---
const SenalesConfianza = ({ data }) => {
  const items = [
    { icon: <FileText size={12}/>, label: "Cédula", verificado: data?.kycVerificado },
    { icon: <Car size={12}/>, label: "Vehículo", verificado: !!data?.vehiculo?.placa },
    { icon: <Camera size={12}/>, label: "Foto Real", verificado: data?.fotoVerificada },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item, i) => (
        <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase italic transition-all ${item.verificado ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
          {item.icon}
          {item.label}
          {item.verificado ? <CheckCircle size={10} className="fill-green-600 text-white"/> : <X size={10}/>}
        </div>
      ))}
    </div>
  );
};

export default function NavegacionPrincipal({ user }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]); 
  const [misSolicitudes, setMisSolicitudes] = useState([]); 
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Estados de Chat e Inbox
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [historialChats, setHistorialChats] = useState([]); 

  // Perfil Público
  const [perfilPublico, setPerfilPublico] = useState(null);

  // Estados de Viajes y Edición (Modo Chofer)
  const [form, setForm] = useState({ 
    eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "",
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true }
  });
  const [viajeEditando, setViajeEditando] = useState(null); 

  // Filtros de búsqueda
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  // Configuración Perfil
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });
  
  // Soporte Técnico
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  // Modal Cancelación
  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const motivosOpciones = ["Ya no quiero viajar", "Conseguí otra cola", "Surgió un imprevisto", "Cambiaré de ruta o fecha"];

  // --- ESTADOS MÓDULO 2: CHECKLIST DE VERIFICACIÓN ---
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [checkSeguridad, setCheckSeguridad] = useState({
    placaOk: false,
    modeloOk: false,
    conductorOk: false
  });

  // --- ESTADO DE VIAJE ACTIVO Y GPS ---
  const [viajeActivo, setViajeActivo] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [pinIngresado, setPinIngresado] = useState("");

  // --- LÓGICA DE REPUTACIÓN (MÓDULO 1) ---
  const calcularEstatus = (viajesCompletados = 0, calificacion = 0) => {
    if (viajesCompletados >= 80 && calificacion >= 4.9) return "Diamante";
    if (viajesCompletados >= 30 && calificacion >= 4.7) return "Oro";
    if (viajesCompletados >= 10 && calificacion >= 4.5) return "Plata";
    return "Bronce";
  };

  // --- EFECTOS DE FIREBASE ---
  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPerfilForm({
          marca: data.vehiculo?.marca || "", modelo: data.vehiculo?.modelo || "",
          placa: data.vehiculo?.placa || "", cedula: data.cedula || ""
        });
      }
    });

    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idChofer", "==", user.uid), where("estado", "==", "pendiente")), (snap) => {
      setSolicitudesRecibidas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), (snap) => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubViajeActivo = onSnapshot(query(collection(db, "Solicitudes"), where("estado", "==", "confirmado")), (snap) => {
      const actual = snap.docs.map(d => ({id: d.id, ...d.data()})).find(s => s.idPasajero === user.uid || s.idChofer === user.uid);
      setViajeActivo(actual || null);
    });

    let docsRecibidos = [];
    let docsEnviados = [];
    const actualizarHistorial = (todosLosDocs) => {
       const mapChats = new Map();
       todosLosDocs.forEach(d => {
          const data = d.data();
          const soyEmisor = data.emisorId === user.uid;
          const idOtro = soyEmisor ? data.receptorId : data.emisorId;
          const nombreOtro = soyEmisor ? (data.nombreReceptor || "Usuario") : data.nombreEmisor;
          const fechaMs = data.fecha ? data.fecha.toMillis() : Date.now();
          if (!mapChats.has(data.chatId)) {
             mapChats.set(data.chatId, { chatId: data.chatId, idViaje: data.idViaje, idOtro, nombreOtro, ultimoMensaje: data.texto, fecha: fechaMs });
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

    return () => { 
      unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); 
      unsubR(); unsubE(); unsubSoporte(); unsubViajeActivo();
    };
  }, [user]);

  // GPS
  useEffect(() => {
    let watchId;
    if (vista === "en_viaje" && viajeActivo && user.uid === viajeActivo.idChofer) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setMiUbicacion({ lat: latitude, lng: longitude });
            updateDoc(doc(db, "Solicitudes", viajeActivo.id), {
              latChofer: latitude, lngChofer: longitude, ultimaActualizacionGPS: serverTimestamp()
            }).catch(e => console.error("Error GPS:", e));
          },
          (error) => console.warn("GPS Error:", error),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      }
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [vista, viajeActivo?.id, user.uid]);

  // Mensajes de Chat
  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      setMensajesChat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubMsg();
  }, [chatActivo]);

  // --- FUNCIONES DE ACCIÓN ---
  const abrirChat = (idViaje, idOtroUsuario, nombreOtro) => {
    const chatId = [user.uid, idOtroUsuario].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro: idOtroUsuario, idViaje: idViaje });
    setVista("chat_privado");
  };

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

  const publicarOEditarRuta = async () => {
    if (userData?.kycVerificado !== true) return alert("🚫 Debes estar verificado para publicar rutas.");
    if (!form.cO || !form.cD || !form.precio) return alert("Completa los campos obligatorios.");
    try {
      const dataViaje = { 
        ...form, 
        precio: Number(form.precio), 
        puestos: Number(form.puestos),
        viajesTotales: userData.viajesCompletados || 0,
        rating: userData.rating || 5.0,
        cancelaciones: userData.cancelaciones || 0,
        vehiculoInfo: { marca: userData.vehiculo?.marca || "", modelo: userData.vehiculo?.modelo || "", placa: userData.vehiculo?.placa || "" }
      };
      if (viajeEditando) {
         await updateDoc(doc(db, "Viajes", viajeEditando), dataViaje);
         setViajeEditando(null);
      } else {
         await addDoc(collection(db, "Viajes"), { ...dataViaje, conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp() });
      }
      setForm({ 
        eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "",
        preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true }
      });
      alert("✅ ¡Ruta guardada!");
    } catch (e) { alert("Error al guardar."); }
  };

  const enviarSolicitudDirecta = async (viaje) => {
    if (user.uid === viaje.idCreador) return alert("No puedes pedirte una cola a ti mismo.");
    const yaExiste = misSolicitudes.some(s => s.idViaje === viaje.id && s.estado === "pendiente");
    if (yaExiste) return alert("Ya tienes una solicitud pendiente para este viaje.");

    try {
      await addDoc(collection(db, "Solicitudes"), {
        idViaje: viaje.id, idPasajero: user.uid, nombrePasajero: userData.nombre || "Pasajero",
        idChofer: viaje.idCreador, nombreChofer: viaje.conductor, 
        ruta: `${viaje.cO} → ${viaje.cD}`, estado: "pendiente", fechaSolicitud: serverTimestamp(),
        precioViaje: viaje.precio, pagoEstado: "pendiente",
        vehiculoInfo: viaje.vehiculoInfo,
        preferenciasViaje: viaje.preferencias || null
      });
      alert("✅ ¡Cola pedida! El chofer te avisará por chat.");
    } catch (e) { alert("Error al pedir cola."); }
  };

  const confirmarViajeChofer = async (idSolicitud) => {
    try {
      await updateDoc(doc(db, "Solicitudes", idSolicitud), { 
        estado: "confirmado", fase: "chofer_en_camino", fechaConfirmacion: serverTimestamp() 
      });
      setVista("en_viaje");
    } catch (e) { alert("Error al confirmar."); }
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
      alert("✅ PIN Correcto. El pago ha sido RETENIDO. ¡Viaje iniciado!");
      setPinIngresado("");
    } else {
      alert("❌ PIN Incorrecto. Pídele el código al pasajero.");
    }
  };

  const finalizarViaje = async (rol) => {
    if(!viajeActivo) return;
    try {
      const actualizacion = {};
      if (rol === "chofer") actualizacion.finalizadoChofer = true;
      if (rol === "pasajero") actualizacion.finalizadoPasajero = true;

      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), actualizacion);

      if ((rol === "chofer" && viajeActivo.finalizadoPasajero) || (rol === "pasajero" && viajeActivo.finalizadoChofer)) {
        const montoFinal = viajeActivo.precioViaje * 0.95; 
        await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { 
          fase: "finalizado", 
          estado: "completado",
          pagoEstado: "completado",
          montoNetoChofer: montoFinal
        });
        alert(`🏁 ¡Viaje Completado! Fondos liberados.`);
        setVista("inicio");
      } else {
        alert("Esperando que la otra parte también finalice el viaje...");
      }
    } catch (e) { console.error(e); }
  };

  const guardarDatosPerfil = async () => {
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { 
        vehiculo: { marca: perfilForm.marca, modelo: perfilForm.modelo, placa: perfilForm.placa.toUpperCase() },
        cedula: perfilForm.cedula
      });
      setConfigOpen(false);
      alert("✅ Perfil actualizado.");
    } catch (e) { alert("Error al guardar."); }
  };

  const cambiarVista = (v) => { setVista(v); setViajeSeleccionado(null); setChatActivo(null); };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic animate-pulse">CARGANDO DAME LA COLA...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans border-x shadow-2xl">
      
      {/* --- MODAL: CHECKLIST DE SEGURIDAD (MÓDULO 2) --- */}
      {mostrarChecklist && (
        <div className="absolute inset-0 bg-slate-900/95 z-[250] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in duration-300">
           <div className="bg-white rounded-[40px] p-8 w-full shadow-2xl space-y-6">
              <div className="text-center">
                 <ShieldCheck size={48} className="text-blue-600 mx-auto mb-2 drop-shadow-lg"/>
                 <h3 className="font-black italic uppercase text-xl text-slate-800 leading-tight">Protocolo de Confianza</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verifica antes de subirte:</p>
              </div>

              <div className="space-y-3">
                 {[
                   { id: 'placaOk', label: `Placa coincide: ${viajeActivo?.vehiculoInfo?.placa || 'ABC-123'}`, icon: <CreditCard size={14}/> },
                   { id: 'modeloOk', label: `Vehículo: ${viajeActivo?.vehiculoInfo?.marca || 'Auto'} ${viajeActivo?.vehiculoInfo?.modelo || ''}`, icon: <Car size={14}/> },
                   { id: 'conductorOk', label: "El conductor es el de la foto", icon: <User size={14}/> }
                 ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setCheckSeguridad({...checkSeguridad, [item.id]: !checkSeguridad[item.id]})}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-300 ${checkSeguridad[item.id] ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                    >
                       <div className="flex items-center gap-3">
                          <span className={checkSeguridad[item.id] ? 'text-blue-600' : 'text-slate-300'}>{item.icon}</span>
                          <span className="text-[11px] font-black uppercase italic">{item.label}</span>
                       </div>
                       {checkSeguridad[item.id] ? <CheckCircle size={20} className="fill-blue-600 text-white" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"/>}
                    </button>
                 ))}
              </div>

              <div className="pt-2">
                 <button 
                   disabled={!(checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk)}
                   onClick={() => {
                      setMostrarChecklist(false);
                      pasajeroConfirmaEncuentro();
                   }}
                   className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg transition-all ${checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk ? 'bg-blue-600 text-white translate-y-0 opacity-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 translate-y-2'}`}
                 >
                    {checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk ? "Todo Seguro - Generar PIN" : "Completa la verificación"}
                 </button>
                 <button onClick={() => setMostrarChecklist(false)} className="w-full mt-4 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">Cancelar / No estoy seguro</button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODALES GENERALES --- */}
      {perfilPublico && (
        <div className="absolute inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-[40px] p-8 w-full max-w-xs shadow-2xl relative">
              <button onClick={() => setPerfilPublico(null)} className="absolute top-4 right-4 text-slate-300"><X size={24}/></button>
              <div className="flex flex-col items-center">
                 <div className="relative mb-4">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-inner">
                      <User size={48} className="text-blue-600"/>
                    </div>
                    <div className="absolute -bottom-2 right-0">
                      <BadgeEstatus nivel={perfilPublico.estatus || "Bronce"} />
                    </div>
                 </div>
                 <h3 className="font-black italic uppercase text-2xl text-slate-800 text-center">{perfilPublico.nombre}</h3>
                 
                 {/* MÓDULO 2: SEÑALES DE CONFIANZA EN PERFIL */}
                 <SenalesConfianza data={perfilPublico} />

                 <div className="flex gap-2 mt-6 w-full">
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border">
                       <Star size={20} className="text-yellow-400 fill-yellow-400 mx-auto mb-1"/>
                       <p className="text-xl font-black italic text-slate-800">{perfilPublico.rating || "5.0"}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border">
                       <ShieldAlert size={20} className="text-red-400 mx-auto mb-1"/>
                       <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Cancelaciones</p>
                       <p className="text-xl font-black italic text-slate-800">{perfilPublico.cancelaciones || "0"}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {modalCancelacion.visible && (
        <div className="absolute inset-0 bg-black/60 z-[160] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[35px] p-6 w-full max-w-xs shadow-2xl">
              <h3 className="font-black italic uppercase text-red-500 flex items-center gap-2 mb-4"><AlertTriangle/> ¿Cancelar?</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-4 tracking-tighter">Nota: Las cancelaciones afectan tu índice de confianza y reputación.</p>
              <div className="space-y-2 mb-6">
                 {motivosOpciones.map(m => (
                    <button key={m} onClick={()=>setMotivoCancelacion(m)} className={`w-full p-3 rounded-xl text-[10px] font-black uppercase text-left border-2 transition-all ${motivoCancelacion === m ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>{m}</button>
                 ))}
              </div>
              <div className="flex gap-2">
                 <button onClick={()=>setModalCancelacion({visible:false})} className="flex-1 p-3 bg-slate-100 rounded-xl font-black text-xs">NO</button>
                 <button onClick={async () => {
                    await deleteDoc(doc(db, "Solicitudes", modalCancelacion.idSolicitud));
                    setModalCancelacion({ visible: false, idSolicitud: null });
                    if(vista === "en_viaje") setVista("inicio");
                    alert("Cola cancelada.");
                 }} className="flex-1 p-3 bg-red-500 text-white rounded-xl font-black text-xs shadow-lg">SÍ, CANCELAR</button>
              </div>
           </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-12 shadow-lg">D</div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p></div>
        </div>
        <div className="flex items-center gap-2">
           {viajeActivo && (
             <button onClick={() => setVista("en_viaje")} className="bg-green-500 text-white p-2 rounded-xl animate-pulse shadow-md"><MapIcon size={18}/></button>
           )}
           <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl active:scale-95">
             <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
           </div>
        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {vista === "inicio" && !viajeSeleccionado && (
           <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"} ➔
              </button>

              {/* PANEL CHOFER */}
              {modo === "chofer" && (
                <div className="space-y-6">
                  <div className={`bg-white p-6 rounded-[35px] border shadow-xl space-y-4 ${viajeEditando ? 'ring-4 ring-yellow-400' : ''}`}>
                    <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2">{viajeEditando ? "Editando Ruta" : "Publicar Nueva Ruta"}</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value, cO: ""})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eO} value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad Origen</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value, cD: ""})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eD} value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad Destino</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    
                    {/* MÓDULO 3: SELECTOR DE PREFERENCIAS (CHOFER) */}
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                       <p className="text-[9px] font-black uppercase text-slate-400 italic">Preferencias del Viaje:</p>
                       <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'ac', icon: <Wind size={14}/>, label: "A/C" },
                            { id: 'noFumar', icon: <CigaretteOff size={14}/>, label: "No Fumar" },
                            { id: 'mascotas', icon: <PawPrint size={14}/>, label: "Mascotas" },
                            { id: 'conversar', icon: <MessageSquare size={14}/>, label: "Hablo Mucho" },
                            { id: 'equipaje', icon: <Briefcase size={14}/>, label: "Maletero" },
                          ].map(pref => (
                            <button 
                              key={pref.id}
                              onClick={() => setForm({...form, preferencias: {...form.preferencias, [pref.id]: !form.preferencias[pref.id]}})}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all ${form.preferencias[pref.id] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                               {pref.icon} <span className="text-[9px] font-black uppercase italic">{pref.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                         <Users size={14} className="absolute left-3 top-3.5 text-slate-400"/>
                         <input type="number" placeholder="Asientos" className="w-full bg-slate-50 p-3 pl-8 rounded-xl border text-xs font-bold" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} />
                      </div>
                      <div className="relative">
                         <CreditCard size={14} className="absolute left-3 top-3.5 text-blue-500"/>
                         <input type="number" placeholder="Precio $" className="w-full bg-slate-50 p-3 pl-8 rounded-xl border text-xs font-black text-blue-600" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                      </div>
                    </div>
                    <button onClick={publicarOEditarRuta} className={`w-full py-4 text-white rounded-2xl font-black uppercase italic shadow-lg ${viajeEditando ? 'bg-yellow-500' : 'bg-blue-600'}`}>{viajeEditando ? "Actualizar" : "Publicar"}</button>
                  </div>

                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Bell size={14}/> Solicitudes Pendientes:</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-3xl border flex flex-col gap-3 shadow-md border-l-4 border-l-blue-500">
                           <div className="flex justify-between items-center">
                              <div onClick={() => setPerfilPublico({ nombre: s.nombrePasajero, id: s.idPasajero, kycVerificado: true })} className="flex items-center gap-2 cursor-pointer">
                                 <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><User size={14}/></div>
                                 <span className="underline font-black text-xs italic">{s.nombrePasajero}</span>
                              </div>
                              <button onClick={() => abrirChat(s.idViaje, s.idPasajero, s.nombrePasajero)} className="p-3 bg-blue-600 text-white rounded-xl"><MessageCircle size={16}/></button>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => confirmarViajeChofer(s.id)} className="flex-1 p-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2">Aceptar Cola <CheckCircle size={12}/></button>
                              <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: s.id })} className="flex-1 p-3 bg-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase">Rechazar</button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BUSCADOR */}
              <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> ¿A dónde vamos hoy?</p>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DESDE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">DESDE: CIUDAD</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>{setFED(e.target.value); setFCD("");}}><option value="">HASTA: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fED} value={fCD} onChange={(e)=>setFCD(e.target.value)}><option value="">HASTA: CIUDAD</option>{fED && UBICACIONES[fED].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
              </div>

              {/* LISTA DE VIAJES (CON MÓDULO 1, 2 y 3) */}
              <div className="space-y-4">
                 {viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD)).map(v => {
                   const estatusChofer = calcularEstatus(v.viajesTotales || 0, v.rating || 0);
                   
                   return (
                     <div key={v.id} className="bg-white p-5 rounded-[35px] border flex flex-col shadow-md space-y-4 hover:border-blue-200 transition-all relative overflow-hidden group">
                       
                       {/* MÓDULO 2: INDICADOR DE CONFIANZA ALTA */}
                       {(v.rating >= 4.8 && v.viajesTotales > 20) && (
                         <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase italic shadow-sm z-10 flex items-center gap-1">
                           <ShieldCheck size={10}/> Confianza Alta
                         </div>
                       )}

                       <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                             <div className="relative">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform"><Car size={24}/></div>
                                <div className="absolute -bottom-2 -right-2">
                                  <BadgeEstatus nivel={estatusChofer} />
                                </div>
                             </div>
                             <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <p onClick={() => setPerfilPublico({nombre: v.conductor, id: v.idCreador, estatus: estatusChofer, rating: v.rating, viajesTotales: v.viajesTotales, kycVerificado: true, vehiculo: v.vehiculoInfo, fotoVerificada: true, cancelaciones: v.cancelaciones, preferencias: v.preferencias})} className="text-[9px] font-black text-slate-400 uppercase italic cursor-pointer underline hover:text-blue-600">
                                    {v.conductor}
                                  </p>
                                  <CheckCircle size={10} className="fill-blue-500 text-white" />
                                </div>
                                <p className="font-black uppercase text-sm text-slate-800 italic leading-none">{v.cO} → {v.cD}</p>
                                
                                {/* MÓDULO 3: PREFERENCIAS EN CARD PRINCIPAL */}
                                <VisualizadorPreferencias prefs={v.preferencias} />

                                <div className="flex items-center gap-1 mt-2">
                                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                  <span className="text-[10px] font-black text-slate-600">{v.rating?.toFixed(1) || "5.0"}</span>
                                  <span className="text-[8px] font-bold text-slate-300 ml-1">• {v.viajesTotales || 0} viajes</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-2xl font-black text-blue-600 italic leading-none">${v.precio}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase mt-1">{v.puestos} puestos</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setViajeSeleccionado(v)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl text-[9px] font-black uppercase italic hover:bg-slate-200">Ver Detalles</button>
                          <button onClick={() => enviarSolicitudDirecta(v)} className="flex-[2] bg-blue-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase italic shadow-lg active:scale-95 transition-all">Pedir Cola</button>
                       </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        )}

        {/* --- VISTA: EN VIAJE --- */}
        {vista === "en_viaje" && viajeActivo && (
          <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-bottom duration-500">
             
             {/* SEÑAL DE SEGURIDAD SUPERIOR */}
             <div className="bg-blue-600 p-3 rounded-2xl flex items-center justify-between shadow-lg mx-1">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={16} className="text-white"/>
                   <span className="text-[9px] font-black text-white uppercase italic">Viaje Monitoreado por GPS</span>
                </div>
                <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase animate-pulse border-2 border-red-400 shadow-md active:scale-90">
                   S.O.S
                </button>
             </div>

             <div className="bg-white p-4 rounded-[30px] shadow-sm border flex justify-between items-center">
                <button onClick={() => setVista("inicio")} className="text-slate-400"><ChevronLeft/></button>
                <div className="text-center">
                   <p className="text-[8px] font-black uppercase text-blue-600 leading-none">Trayecto Actual</p>
                   <p className="text-[11px] font-black italic">{viajeActivo.ruta}</p>
                </div>
                <button onClick={() => setModalCancelacion({visible: true, idSolicitud: viajeActivo.id})} className="text-red-500"><AlertTriangle size={20}/></button>
             </div>

             <div className="flex-1 bg-slate-200 rounded-[40px] border-4 border-white shadow-2xl relative overflow-hidden">
                {viajeActivo.latChofer && (
                   <iframe 
                     width="100%" height="100%" frameBorder="0" scrolling="no" 
                     src={`https://www.openstreetmap.org/export/embed.html?bbox=${viajeActivo.lngChofer-0.005},${viajeActivo.latChofer-0.005},${viajeActivo.lngChofer+0.005},${viajeActivo.latChofer+0.005}&layer=mapnik&marker=${viajeActivo.latChofer},${viajeActivo.lngChofer}`}
                     className="w-full h-full opacity-90 pointer-events-none"
                   ></iframe>
                )}

                {/* Card de Vehículo (Módulo 2) */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Car size={24}/>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Vehículo Validado</p>
                      <p className="text-[11px] font-black italic uppercase text-slate-800">
                         {viajeActivo.vehiculoInfo?.marca} {viajeActivo.vehiculoInfo?.modelo}
                      </p>
                      <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block border border-blue-100">
                         {viajeActivo.vehiculoInfo?.placa}
                      </p>
                   </div>
                </div>
                
                {viajeActivo.idPasajero === user.uid && viajeActivo.pinVerificacion && viajeActivo.fase === "pasajero_confirmado_encuentro" && (
                   <div className="absolute top-6 left-6 right-6 bg-blue-600 p-4 rounded-2xl text-white text-center shadow-xl z-20 animate-bounce">
                      <p className="text-[10px] font-black uppercase">Código para el Chofer:</p>
                      <p className="text-3xl font-black tracking-[10px]">{viajeActivo.pinVerificacion}</p>
                   </div>
                )}
             </div>

             <div className="bg-white p-6 rounded-[35px] border shadow-lg space-y-3 z-10">
                {user.uid === viajeActivo.idChofer ? (
                  <div className="space-y-3">
                    {viajeActivo.fase === "chofer_en_camino" && (
                      <button onClick={() => updateDoc(doc(db,"Solicitudes",viajeActivo.id), {fase: "en_punto_de_encuentro"})} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-lg">He llegado al punto</button>
                    )}
                    
                    {viajeActivo.fase === "en_punto_de_encuentro" && (
                      <div className="bg-slate-50 p-4 rounded-2xl text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Esperando al pasajero...</p>
                         <div className="animate-pulse flex justify-center"><Clock className="text-blue-500"/></div>
                      </div>
                    )}

                    {viajeActivo.fase === "pasajero_confirmado_encuentro" && (
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-blue-600 uppercase italic text-center">Ingresa el PIN del Pasajero</p>
                         <input type="number" placeholder="0000" className="w-full p-4 bg-slate-100 rounded-2xl text-center text-2xl font-black outline-none border-2 border-transparent focus:border-blue-600 transition-all" value={pinIngresado} onChange={(e)=>setPinIngresado(e.target.value)} />
                         <button onClick={choferVerificaPIN} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase italic shadow-md">Validar PIN e Iniciar</button>
                      </div>
                    )}

                    {viajeActivo.fase === "viajando" && (
                      <button 
                        onClick={() => finalizarViaje("chofer")} 
                        disabled={viajeActivo.finalizadoChofer}
                        className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 ${viajeActivo.finalizadoChofer ? 'bg-slate-400' : 'bg-slate-900 text-white'}`}
                      >
                        {viajeActivo.finalizadoChofer ? "Esperando Pasajero..." : "Finalizar Viaje"} <Flag size={18}/>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viajeActivo.fase === "chofer_en_camino" && <p className="text-center font-black italic text-[11px] text-blue-600 animate-pulse uppercase tracking-widest">El chofer está cerca del punto...</p>}
                    
                    {viajeActivo.fase === "en_punto_de_encuentro" && (
                      <button 
                        onClick={() => setMostrarChecklist(true)} 
                        className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                         <ShieldCheck size={18}/> Iniciar Verificación
                      </button>
                    )}

                    {viajeActivo.fase === "pasajero_confirmado_encuentro" && <p className="text-center font-black italic text-[11px] text-green-600 uppercase tracking-widest">Muestra el código al chofer para subir</p>}
                    {viajeActivo.fase === "viajando" && (
                       <button 
                        onClick={() => finalizarViaje("pasajero")} 
                        disabled={viajeActivo.finalizadoPasajero}
                        className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 ${viajeActivo.finalizadoPasajero ? 'bg-slate-400' : 'bg-blue-600 text-white'}`}
                      >
                        {viajeActivo.finalizadoPasajero ? "Confirmación Pendiente..." : "Confirmar Destino"} <CheckCircle size={18}/>
                      </button>
                    )}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* DETALLE VIAJE (MÓDULO 3) */}
        {viajeSeleccionado && vista === "inicio" && (
           <div className="space-y-6 animate-in slide-in-from-right">
              <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic"><ChevronLeft size={16}/> Volver</button>
              <div className="bg-white rounded-[40px] border shadow-2xl p-8 space-y-6">
                 <div className="flex justify-between items-center border-b pb-4">
                    <p className="text-4xl font-black italic text-blue-600 leading-none">${viajeSeleccionado.precio}</p>
                    <BadgeEstatus nivel={calcularEstatus(viajeSeleccionado.viajesTotales, viajeSeleccionado.rating)} />
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-600"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.cO} → {viajeSeleccionado.cD}</p></div>
                       
                       {/* MÓDULO 3: PREFERENCIAS EN DETALLE */}
                       <div className="bg-slate-50 p-5 rounded-[30px] border">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Preferencias del Viaje</p>
                          <div className="grid grid-cols-2 gap-3">
                             {[
                               { id: 'ac', icon: <Wind size={14}/>, label: "Aire Acondicionado", active: viajeSeleccionado.preferencias?.ac },
                               { id: 'noFumar', icon: <CigaretteOff size={14}/>, label: "No Fumar", active: viajeSeleccionado.preferencias?.noFumar },
                               { id: 'mascotas', icon: <PawPrint size={14}/>, label: "Acepta Mascotas", active: viajeSeleccionado.preferencias?.mascotas },
                               { id: 'conversar', icon: <MessageSquare size={14}/>, label: "Conversación", active: viajeSeleccionado.preferencias?.conversar },
                               { id: 'equipaje', icon: <Briefcase size={14}/>, label: "Espacio Equipaje", active: viajeSeleccionado.preferencias?.equipaje },
                             ].map(item => (
                               <div key={item.id} className={`flex items-center gap-2 p-2 rounded-xl border ${item.active ? 'bg-white border-blue-100 text-blue-600' : 'bg-slate-100/50 border-transparent text-slate-300'}`}>
                                  {item.icon}
                                  <span className="text-[9px] font-black uppercase italic">{item.label}</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div onClick={() => setPerfilPublico({ nombre: viajeSeleccionado.conductor, id: viajeSeleccionado.idCreador, rating: viajeSeleccionado.rating, viajesTotales: viajeSeleccionado.viajesTotales, estatus: calcularEstatus(viajeSeleccionado.viajesTotales, viajeSeleccionado.rating), kycVerificado: true, vehiculo: viajeSeleccionado.vehiculoInfo, fotoVerificada: true, cancelaciones: viajeSeleccionado.cancelaciones, preferencias: viajeSeleccionado.preferencias })} className="flex items-center gap-3 cursor-pointer group">
                          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors"><User size={20} className="text-slate-400 group-hover:text-blue-600"/></div>
                          <div>
                             <p className="font-black uppercase text-sm italic underline">{viajeSeleccionado.conductor}</p>
                             <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={10} className="fill-green-600 text-white"/>
                                <span className="text-[8px] font-black uppercase italic">Conductor Identificado</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[30px] text-white">
                       <p className="text-[10px] font-black uppercase text-blue-400 mb-3 tracking-widest">Información del Auto</p>
                       <div className="flex items-center gap-3 mb-2">
                          <Car size={16} className="text-white"/>
                          <p className="text-xs font-black uppercase italic">{viajeSeleccionado.vehiculoInfo?.marca} {viajeSeleccionado.vehiculoInfo?.modelo}</p>
                       </div>
                       <p className="text-[10px] font-black text-blue-400 bg-white/10 px-3 py-1 rounded-lg inline-block border border-white/10">{viajeSeleccionado.vehiculoInfo?.placa}</p>
                    </div>
                 </div>

                 <div className="flex gap-2 pt-4">
                    <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2 shadow-lg"><MessageCircle size={18}/> Chat</button>
                    <button onClick={() => enviarSolicitudDirecta(viajeSeleccionado)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95">Pedir Cola</button>
                 </div>
              </div>
           </div>
        )}

        {/* --- CHAT PRIVADO --- */}
        {vista === "chat_privado" && chatActivo && (
          <div className="flex flex-col h-full space-y-4 animate-in slide-in-from-right">
            <button onClick={() => setVista("inicio")} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><ChevronLeft size={16}/> Volver</button>
            <div className="bg-white p-3 rounded-3xl border shadow-sm flex gap-2">
               <button onClick={() => {
                  const v = viajes.find(v => v.id === chatActivo.idViaje);
                  if(v) enviarSolicitudDirecta(v);
               }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic text-[10px]">Pedir Cola</button>
            </div>

            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase flex items-center justify-center gap-2">
                 <ShieldCheck size={12} className="text-blue-400"/> Chat Seguro: {chatActivo.nombre}
               </div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-4 rounded-3xl max-w-[80%] text-[11px] font-bold shadow-sm transition-all ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border text-slate-700 self-start rounded-tl-none'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrivado()} className="flex-1 bg-slate-100 p-3 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><Send size={18}/></button>
               </div>
            </div>
          </div>
        )}

        {/* --- WALLET --- */}
        {vista === "wallet" && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Wallet</h2>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                 <p className="text-[10px] font-black uppercase opacity-80 mb-2 tracking-widest">Saldo Disponible</p>
                 <p className="text-6xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
                 <div className="absolute top-10 right-10 opacity-20"><Wallet size={80}/></div>
                 <div className="mt-8 flex items-center gap-2 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                    <Lock size={14}/>
                    <p className="text-[9px] font-black uppercase italic tracking-tighter leading-none">Tus fondos están protegidos por el sistema de retención inteligente.</p>
                 </div>
              </div>
           </div>
        )}

        {/* --- SOPORTE --- */}
        {vista === "soporte" && (
          <div className="flex flex-col h-full bg-white rounded-[40px] border shadow-lg overflow-hidden animate-in fade-in">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-[10px] uppercase">Soporte Técnico</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                <div className="p-4 bg-white border rounded-3xl self-start text-[11px] font-bold text-slate-700 shadow-sm">
                   👋 ¡Hola {userData.nombre}! ¿En qué podemos ayudarte con tu viaje?
                </div>
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-3xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.usuarioId === user.uid ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border text-slate-700 self-start rounded-tl-none'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2">
               <input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none" placeholder="Reportar incidente..." />
               <button onClick={async () => {
                  if(!mensajeSoporte.trim()) return;
                  await addDoc(collection(db, "MensajesSoporte"), { usuarioId: user.uid, texto: mensajeSoporte.trim(), fecha: serverTimestamp() });
                  setMensajeSoporte("");
               }} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
             </div>
          </div>
        )}

        {/* --- PERFIL (ACTUALIZADO CON MÓDULO 2 Y 3) --- */}
        {vista === "perfil" && (
           <div className="space-y-4 animate-in fade-in pb-10">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 shadow-lg"></div>
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100 active:scale-90 transition-transform"><Settings size={22}/></button>
                 <div className="relative mb-4">
                    <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl relative overflow-hidden">
                      <User size={56} className="text-slate-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2">
                      <BadgeEstatus nivel={calcularEstatus(userData.viajesCompletados || 0, userData.rating || 0)} />
                    </div>
                 </div>
                 <h2 className="font-black italic text-2xl text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
                 
                 <SenalesConfianza data={userData} />
              </div>

              {configOpen && (
                <div className="bg-white p-6 rounded-[35px] border shadow-2xl space-y-3 animate-in slide-in-from-top">
                  <p className="text-[10px] font-black uppercase text-blue-600 italic tracking-widest px-2">Verificación de Identidad</p>
                  <input type="text" placeholder="Cédula de Identidad" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none focus:border-blue-600 transition-all" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                  
                  <p className="text-[10px] font-black uppercase text-blue-600 italic tracking-widest px-2 pt-2">Datos del Vehículo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Marca (Ej: Toyota)" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.marca} onChange={(e)=>setPerfilForm({...perfilForm, marca: e.target.value})} />
                    <input type="text" placeholder="Modelo (Ej: Corolla)" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.modelo} onChange={(e)=>setPerfilForm({...perfilForm, modelo: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Número de Placa" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase outline-none focus:border-blue-600" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                  
                  <button onClick={guardarDatosPerfil} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition-all mt-2">Actualizar Credenciales</button>
                </div>
              )}

              <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3 italic tracking-widest bg-white rounded-[30px] border shadow-sm mt-4 active:bg-red-50 transition-colors"><LogOut size={20} /> Salir de la plataforma</button>
           </div>
        )}
      </main>

      {/* --- BARRA DE NAVEGACIÓN --- */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => cambiarVista("inicio")} className={`flex flex-col items-center gap-1 transition-all ${vista === "inicio" ? "text-blue-600 scale-110" : "text-slate-300"}`}><Car size={28} /><span className="text-[8px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => cambiarVista("soporte")} className={`flex flex-col items-center gap-1 transition-all ${vista === "soporte" ? "text-blue-600 scale-110" : "text-slate-300"}`}><MessageCircle size={28} /><span className="text-[8px] font-black uppercase italic">Ayuda</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 transition-all ${vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-300"}`}><User size={28} /><span className="text-[8px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
