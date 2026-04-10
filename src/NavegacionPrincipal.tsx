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
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase, Zap, Gift, Target
} from "lucide-react";

// --- CONSTANTES DE UBICACIÓN (VENEZUELA) ---
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

// --- MÓDULO 1 & 4: REPUTACIÓN Y BADGES ---
const BadgeEstatus = ({ nivel, mini = false }) => {
  const configs = {
    "Bronce": { color: "text-slate-500", bg: "bg-slate-100", label: "Novato" },
    "Plata": { color: "text-zinc-500", bg: "bg-zinc-200", label: "Viajero" },
    "Oro": { color: "text-amber-600", bg: "bg-amber-100", label: "Super Driver" },
    "Diamante": { color: "text-blue-600", bg: "bg-blue-100", label: "Elite" }
  };
  const c = configs[nivel] || configs["Bronce"];
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} border border-white shadow-sm`}>
      <ShieldCheck size={mini ? 8 : 10} className={c.color} />
      <span className={`font-black uppercase italic ${mini ? 'text-[6px]' : 'text-[8px]'} ${c.color}`}>{c.label}</span>
    </div>
  );
};

// --- MÓDULO 6: COMPONENTES DE GAMIFICACIÓN & BONOS ---
const CardPromoBono = ({ titulo, desc, icon, color }) => (
  <div className={`p-4 rounded-3xl border-2 border-dashed ${color} bg-white flex items-center gap-4 mb-4 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
    <div className={`p-3 rounded-2xl ${color.replace('border-', 'bg-').split(' ')[0]} bg-opacity-10`}>
      {icon}
    </div>
    <div>
      <h4 className="font-black italic uppercase text-[10px] leading-tight text-slate-800">{titulo}</h4>
      <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight mt-1">{desc}</p>
    </div>
    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:rotate-12 transition-transform">
      {icon}
    </div>
  </div>
);

const RastreadorProgreso = ({ user }) => {
  const tareas = [
    { label: "Verificar Cédula", completada: user?.kycVerificado },
    { label: "Foto de Perfil Real", completada: user?.fotoVerificada },
    { label: "Registrar Vehículo", completada: !!user?.vehiculo?.placa },
    { label: "Primer Viaje", completada: (user?.viajesCompletados || 0) > 0 }
  ];
  const completadas = tareas.filter(t => t.completada).length;
  const porcentaje = (completadas / tareas.length) * 100;

  return (
    <div className="bg-slate-900 rounded-[35px] p-6 text-white shadow-2xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] font-black uppercase text-blue-400 italic">Misión Onboarding</p>
            <h3 className="text-xl font-black italic uppercase">Camino al Éxito</h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black italic text-blue-400">{porcentaje}%</span>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${porcentaje}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tareas.map((t, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border ${t.completada ? 'border-blue-500/30 bg-blue-500/10' : 'border-slate-800 bg-slate-800/50'}`}>
              {t.completada ? <CheckCircle size={10} className="text-blue-400"/> : <Target size={10} className="text-slate-500"/>}
              <span className={`text-[8px] font-black uppercase italic ${t.completada ? 'text-white' : 'text-slate-500'}`}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
      <Zap className="absolute -bottom-4 -right-4 text-blue-600 opacity-20 w-24 h-24" />
    </div>
  );
};

// --- MÓDULO 5: INDICADOR DE PROGRESO DE FLUJO ---
const PasosProgreso = ({ fase }) => {
  const pasos = [
    { id: "solicitado", label: "Pedido", activo: ["pendiente", "confirmado", "chofer_en_camino", "en_punto_de_encuentro", "pasajero_confirmado_encuentro", "viajando"].includes(fase) },
    { id: "aprobado", label: "Aprobado", activo: ["confirmado", "chofer_en_camino", "en_punto_de_encuentro", "pasajero_confirmado_encuentro", "viajando"].includes(fase) },
    { id: "retenido", label: "Retenido", activo: ["viajando"].includes(fase) },
    { id: "finalizado", label: "Llegada", activo: ["finalizado"].includes(fase) }
  ];

  return (
    <div className="flex justify-between items-center px-4 py-2 bg-white rounded-2xl border mb-4">
      {pasos.map((p, i) => (
        <React.Fragment key={p.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${p.activo ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'bg-slate-200'}`} />
            <span className={`text-[7px] font-black uppercase ${p.activo ? 'text-blue-600' : 'text-slate-300'}`}>{p.label}</span>
          </div>
          {i < pasos.length - 1 && <div className={`flex-1 h-[2px] mx-1 mb-3 ${pasos[i+1].activo ? 'bg-blue-600' : 'bg-slate-100'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- MÓDULO 4: TARJETA DE VIAJE REDISEÑADA ---
const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir, onClickPerfil, estatusChofer }) => {
  const ultimosPuestos = viaje.puestos <= 2;
  
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 overflow-hidden group">
      <div className="p-5 flex justify-between items-start">
        <div className="flex gap-4">
          <div className="relative" onClick={() => onClickPerfil()}>
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[22px] flex items-center justify-center text-slate-400 border-2 border-white shadow-md group-hover:scale-105 transition-transform">
              <User size={32} />
            </div>
            <div className="absolute -bottom-2 -right-1">
              <BadgeEstatus nivel={estatusChofer} mini />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <h4 className="font-black italic uppercase text-sm text-slate-800 leading-none underline cursor-pointer" onClick={() => onClickPerfil()}>
                {viaje.conductor}
              </h4>
              <CheckCircle size={12} className="fill-blue-500 text-white" />
            </div>
            
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center text-amber-500">
                <Star size={10} className="fill-amber-500" />
                <span className="text-[10px] font-black ml-0.5">{viaje.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{viaje.viajesTotales || 0} opiniones</span>
            </div>

            <div className="flex gap-1 mt-2">
              {viaje.preferencias?.ac && <div className="p-1 bg-blue-50 text-blue-500 rounded-md"><Wind size={10}/></div>}
              {viaje.preferencias?.noFumar && <div className="p-1 bg-slate-50 text-slate-400 rounded-md"><CigaretteOff size={10}/></div>}
              {viaje.preferencias?.equipaje && <div className="p-1 bg-slate-50 text-slate-400 rounded-md"><Briefcase size={10}/></div>}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-2xl shadow-lg shadow-blue-200">
            <p className="text-xl font-black italic leading-none">${viaje.precio}</p>
          </div>
          {ultimosPuestos && (
            <span className="text-[7px] font-black text-amber-600 uppercase italic mt-1 block animate-pulse">¡Últimos {viaje.puestos} puestos!</span>
          )}
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full border-2 border-blue-600 bg-white" />
          <div className="w-0.5 h-4 bg-slate-100" />
          <div className="w-2 h-2 rounded-full bg-blue-600" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{viaje.cO}</p>
          <p className="text-[11px] font-black text-slate-800 uppercase italic leading-none">{viaje.cD}</p>
        </div>
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button onClick={onClickDetalle} className="flex-1 py-3 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase italic text-[9px] hover:bg-slate-100 transition-colors">
          Info del viaje
        </button>
        <button onClick={onClickPedir} className="flex-[2] py-3 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[9px] shadow-md hover:bg-blue-600 transition-all active:scale-95">
          Reservar ahora
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTES DE APOYO ---
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

  // Chat e Inbox
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [historialChats, setHistorialChats] = useState([]); 

  // Perfil Público
  const [perfilPublico, setPerfilPublico] = useState(null);

  // Estados de Viajes y Edición
  const [form, setForm] = useState({ 
    eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "",
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true }
  });
  const [viajeEditando, setViajeEditando] = useState(null); 

  // Filtros
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  // Config Perfil
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });
  
  // Soporte
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  // Modal Cancelación
  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  // MÓDULO 2: CHECKLIST
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [checkSeguridad, setCheckSeguridad] = useState({ placaOk: false, modeloOk: false, conductorOk: false });

  // VIAJE ACTIVO Y GPS
  const [viajeActivo, setViajeActivo] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [pinIngresado, setPinIngresado] = useState("");

  // REPUTACIÓN
  const calcularEstatus = (viajesCompletados = 0, calificacion = 0) => {
    if (viajesCompletados >= 80 && calificacion >= 4.9) return "Diamante";
    if (viajesCompletados >= 30 && calificacion >= 4.7) return "Oro";
    if (viajesCompletados >= 10 && calificacion >= 4.5) return "Plata";
    return "Bronce";
  };

  // EFECTOS FIREBASE (Manteniendo lógica de listeners)
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

    const unsubViajeActivo = onSnapshot(query(collection(db, "Solicitudes")), (snap) => {
      const actual = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .find(s => (s.idPasajero === user.uid || s.idChofer === user.uid) && s.estado !== "completado" && s.estado !== "rechazado");
      setViajeActivo(actual || null);
    });

    // Chat Historial
    let docsRecibidos = []; let docsEnviados = [];
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

    return () => { 
      unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); 
      unsubR(); unsubE(); unsubViajeActivo();
    };
  }, [user]);

  // GPS Activo
  useEffect(() => {
    let watchId;
    if (vista === "en_viaje" && viajeActivo && user.uid === viajeActivo.idChofer) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            updateDoc(doc(db, "Solicitudes", viajeActivo.id), {
              latChofer: latitude, lngChofer: longitude, ultimaActualizacionGPS: serverTimestamp()
            }).catch(e => console.error("Error GPS:", e));
          },
          null, { enableHighAccuracy: true }
        );
      }
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [vista, viajeActivo?.id, user.uid]);

  // FUNCIONES DE ACCIÓN (MÓDULO 5 & 6)
  const abrirChat = (idViaje, idOtroUsuario, nombreOtro) => {
    const chatId = [user.uid, idOtroUsuario].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro: idOtroUsuario, idViaje: idViaje });
    setVista("chat_privado");
  };

  const enviarSolicitudDirecta = async (viaje) => {
    if (user.uid === viaje.idCreador) return alert("Es tu propio viaje.");
    try {
      await addDoc(collection(db, "Solicitudes"), {
        idViaje: viaje.id, idPasajero: user.uid, nombrePasajero: userData.nombre || "Pasajero",
        idChofer: viaje.idCreador, nombreChofer: viaje.conductor, 
        ruta: `${viaje.cO} → ${viaje.cD}`, estado: "pendiente", fase: "solicitado", 
        fechaSolicitud: serverTimestamp(), precioViaje: viaje.precio, pagoEstado: "pendiente",
        vehiculoInfo: viaje.vehiculoInfo
      });
      alert("✅ ¡Cola pedida!");
    } catch (e) { alert("Error."); }
  };

  const confirmarViajeChofer = async (idSolicitud) => {
    try {
      await updateDoc(doc(db, "Solicitudes", idSolicitud), { estado: "confirmado", fase: "chofer_en_camino", fechaConfirmacion: serverTimestamp() });
      setVista("en_viaje");
    } catch (e) { console.error(e); }
  };

  const choferVerificaPIN = async () => {
    if (pinIngresado === viajeActivo.pinVerificacion) {
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: "viajando", pagoEstado: "retenido" });
      alert("✅ Fondos RETENIDOS. ¡Arrancamos!");
      setPinIngresado("");
    } else {
      alert("❌ PIN Incorrecto.");
    }
  };

  const finalizarViaje = async (rol) => {
    if(!viajeActivo) return;
    try {
      const field = rol === "chofer" ? { finalizadoChofer: true } : { finalizadoPasajero: true };
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), field);

      if ((rol === "chofer" && viajeActivo.finalizadoPasajero) || (rol === "pasajero" && viajeActivo.finalizadoChofer)) {
        await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: "finalizado", estado: "completado", pagoEstado: "completado" });
        alert("🏁 Cola Completada.");
        setVista("inicio");
      }
    } catch (e) { console.error(e); }
  };

  const guardarDatosPerfil = async () => {
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { 
        vehiculo: { marca: perfilForm.marca, modelo: perfilForm.modelo, placa: perfilForm.placa.toUpperCase() },
        cedula: perfilForm.cedula
      });
      setConfigOpen(false); alert("✅ Datos guardados.");
    } catch (e) { alert("Error."); }
  };

  const cambiarVista = (v) => { setVista(v); setViajeSeleccionado(null); setChatActivo(null); };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic animate-pulse">CARGANDO DAME LA COLA...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans border-x shadow-2xl">
      
      {/* MODAL CHECKLIST SEGURIDAD (MÓDULO 2) */}
      {mostrarChecklist && (
        <div className="absolute inset-0 bg-slate-900/95 z-[250] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in duration-300">
           <div className="bg-white rounded-[40px] p-8 w-full shadow-2xl space-y-6">
              <div className="text-center">
                 <ShieldCheck size={48} className="text-blue-600 mx-auto mb-2 drop-shadow-lg"/>
                 <h3 className="font-black italic uppercase text-xl text-slate-800 leading-tight">Protocolo de Confianza</h3>
              </div>
              <div className="space-y-3">
                 {[
                   { id: 'placaOk', label: `Placa coincide: ${viajeActivo?.vehiculoInfo?.placa}`, icon: <CreditCard size={14}/> },
                   { id: 'modeloOk', label: `Vehículo: ${viajeActivo?.vehiculoInfo?.marca} ${viajeActivo?.vehiculoInfo?.modelo}`, icon: <Car size={14}/> },
                   { id: 'conductorOk', label: "El chofer es el de la foto", icon: <User size={14}/> }
                 ].map((item) => (
                    <button key={item.id} onClick={() => setCheckSeguridad({...checkSeguridad, [item.id]: !checkSeguridad[item.id]})} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${checkSeguridad[item.id] ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                       <div className="flex items-center gap-3">
                          <span className={checkSeguridad[item.id] ? 'text-blue-600' : 'text-slate-300'}>{item.icon}</span>
                          <span className="text-[11px] font-black uppercase italic">{item.label}</span>
                       </div>
                       {checkSeguridad[item.id] ? <CheckCircle size={20} className="fill-blue-600 text-white" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"/>}
                    </button>
                 ))}
              </div>
              <button disabled={!(checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk)} onClick={async () => { const pin = Math.floor(1000 + Math.random() * 9000).toString(); await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: "pasajero_confirmado_encuentro", pinVerificacion: pin }); setMostrarChecklist(false); }} className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg transition-all ${checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 opacity-50'}`}>Confirmar y Ver PIN</button>
           </div>
        </div>
      )}

      {/* HEADER */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-12 shadow-lg">D</div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p></div>
        </div>
        <div className="flex items-center gap-2">
           {viajeActivo && <button onClick={() => setVista("en_viaje")} className="bg-green-500 text-white p-2 rounded-xl animate-pulse shadow-md"><MapIcon size={18}/></button>}
           <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl active:scale-95">
             <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
           </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {vista === "inicio" && !viajeSeleccionado && (
           <div className="space-y-6">
              
              {/* MÓDULO 6: BANNER PROMOCIONAL */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[35px] shadow-xl text-white relative overflow-hidden group">
                 <div className="relative z-10">
                    <h3 className="font-black italic uppercase text-sm mb-1 flex items-center gap-2">Bonos de Temporada <Gift size={16}/></h3>
                    <p className="text-[10px] font-bold opacity-90 uppercase leading-tight">Gana $5 por cada amigo que realice su primera cola.</p>
                    <button className="mt-3 bg-white text-blue-700 px-4 py-2 rounded-xl font-black uppercase italic text-[9px] shadow-lg active:scale-95 transition-all">Copiar Link</button>
                 </div>
                 <Gift className="absolute -right-4 -top-4 w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform" />
              </div>

              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"} ➔</button>

              {modo === "chofer" && (
                <div className="space-y-6">
                   {/* Formulario de publicación simplificado para este ejemplo */}
                   <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-4">
                    <h3 className="text-xs font-black uppercase text-blue-600 italic">Publicar Nueva Ruta</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    </div>
                    <button onClick={async () => { 
                      if(!form.eO || !form.eD) return;
                      await addDoc(collection(db, "Viajes"), { 
                        cO: form.eO, cD: form.eD, precio: 10, puestos: 4, conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp(),
                        vehiculoInfo: { marca: userData.vehiculo?.marca, modelo: userData.vehiculo?.modelo, placa: userData.vehiculo?.placa }
                      });
                    }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic">Publicar</button>
                  </div>
                </div>
              )}

              {/* MÓDULO 6: CARDS DE CRECIMIENTO */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase italic px-2">Logros Disponibles</p>
                <CardPromoBono titulo="Perfil de Confianza" desc="Completa tu KYC y gana insignia de Oro instantánea." icon={<ShieldCheck size={20} className="text-blue-600"/>} color="border-blue-200" />
                <CardPromoBono titulo="Driver del Mes" desc="Realiza 20 colas este mes y no pagues comisión." icon={<Trophy size={20} className="text-amber-500"/>} color="border-amber-200" />
              </div>

              {/* BUSCADOR & LISTA */}
              <div className="bg-white p-5 rounded-[30px] border space-y-3 shadow-sm">
                <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscador de Colas</p>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>setFEO(e.target.value)}><option value="">ORIGEN</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>setFED(e.target.value)}><option value="">DESTINO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                </div>
              </div>

              <div className="space-y-5">
                 {viajes.map(v => (
                    <CardViajeOptimizada key={v.id} viaje={v} estatusChofer={calcularEstatus(v.viajesTotales, v.rating)} onClickDetalle={() => setViajeSeleccionado(v)} onClickPedir={() => enviarSolicitudDirecta(v)} onClickPerfil={() => setPerfilPublico(v)} />
                 ))}
              </div>
           </div>
        )}

        {/* VISTA MÓDULO 5: FLUJO ACTIVO */}
        {vista === "en_viaje" && viajeActivo && (
          <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-bottom duration-500">
             <div className="bg-blue-600 p-3 rounded-2xl flex items-center justify-between shadow-lg mx-1">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-white"/><span className="text-[9px] font-black text-white uppercase italic">Protocolo de Retención Activo</span></div>
                <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase animate-pulse border-2 border-red-400">S.O.S</button>
             </div>

             <PasosProgreso fase={viajeActivo.fase} />

             <div className="flex-1 bg-slate-200 rounded-[40px] border-4 border-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase italic">[ Mapa en Tiempo Real ]</div>
                {viajeActivo.idPasajero === user.uid && viajeActivo.pinVerificacion && viajeActivo.fase === "pasajero_confirmado_encuentro" && (
                   <div className="absolute top-6 left-6 right-6 bg-blue-600 p-4 rounded-2xl text-white text-center shadow-xl z-20 animate-bounce">
                      <p className="text-[10px] font-black uppercase">PIN de Encuentro:</p>
                      <p className="text-3xl font-black tracking-[10px]">{viajeActivo.pinVerificacion}</p>
                   </div>
                )}
             </div>

             <div className="bg-white p-6 rounded-[35px] border shadow-lg space-y-3 z-10">
                {user.uid === viajeActivo.idChofer ? (
                  <div className="space-y-3">
                    {viajeActivo.fase === "chofer_en_camino" && <button onClick={() => updateDoc(doc(db,"Solicitudes",viajeActivo.id), {fase: "en_punto_de_encuentro"})} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic">He llegado al punto</button>}
                    {viajeActivo.fase === "pasajero_confirmado_encuentro" && (
                      <div className="space-y-3">
                         <input type="number" placeholder="PIN" className="w-full p-4 bg-slate-100 rounded-2xl text-center text-2xl font-black outline-none border-2 border-blue-600" value={pinIngresado} onChange={(e)=>setPinIngresado(e.target.value)} />
                         <button onClick={choferVerificaPIN} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase italic">Validar y Arrancar</button>
                      </div>
                    )}
                    {viajeActivo.fase === "viajando" && <button onClick={() => finalizarViaje("chofer")} className="w-full py-5 bg-slate-900 text-white rounded-[25px] font-black uppercase italic">Marcar Llegada</button>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viajeActivo.fase === "en_punto_de_encuentro" && <button onClick={() => setMostrarChecklist(true)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic">Checklist de Seguridad</button>}
                    {viajeActivo.fase === "viajando" && <button onClick={() => finalizarViaje("pasajero")} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic">Confirmar Llegada</button>}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* PERFIL (MODIFICADO CON MÓDULO 6) */}
        {vista === "perfil" && (
           <div className="space-y-6 animate-in fade-in pb-10">
              
              <RastreadorProgreso user={userData} />

              <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative">
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={22}/></button>
                 <div className="relative mb-4">
                    <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden"><User size={56} className="text-slate-400" /></div>
                    <div className="absolute -bottom-2 -right-2"><BadgeEstatus nivel={calcularEstatus(userData.viajesCompletados, userData.rating)} /></div>
                 </div>
                 <h2 className="font-black italic text-2xl text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
                 <SenalesConfianza data={userData} />
              </div>

              {configOpen && (
                <div className="bg-white p-6 rounded-[35px] border shadow-2xl space-y-3">
                  <input type="text" placeholder="Cédula" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Marca" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.marca} onChange={(e)=>setPerfilForm({...perfilForm, marca: e.target.value})} />
                    <input type="text" placeholder="Placa" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase outline-none" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                  </div>
                  <button onClick={guardarDatosPerfil} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic">Actualizar</button>
                </div>
              )}

              <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3 italic bg-white rounded-[30px] border shadow-sm">Log Out</button>
           </div>
        )}
      </main>

      {/* NAVBAR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => cambiarVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={28} /><span className="text-[8px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={28} /><span className="text-[8px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
