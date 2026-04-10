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
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase, Zap, Paintbrush
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

// --- MÓDULO 1 & 4: REPUTACIÓN Y BADGES ---
const BadgeEstatus = ({ nivel, mini = false }) => {
  const configs = {
    "Bronce": { color: "text-slate-500", bg: "bg-slate-100", label: "Novato" },
    "Plata": { color: "text-zinc-500", bg: "bg-zinc-200", label: "Viajero" },
    "Oro": { color: "text-amber-600", bg: "bg-amber-100", label: "Super Driver" },
    "Diamante": { color: "text-blue-600", bg: "bg-blue-100", label: "Elite" },
    "Leyenda": { color: "text-purple-600", bg: "bg-purple-100", label: "Leyenda" }
  };
  const c = configs[nivel] || configs["Bronce"];
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} border border-white shadow-sm`}>
      <ShieldCheck size={mini ? 8 : 10} className={c.color} />
      <span className={`font-black uppercase italic ${mini ? 'text-[6px]' : 'text-[8px]'} ${c.color}`}>{c.label}</span>
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

// --- MÓDULO 7: TARJETA DE VIAJE (RESULTADOS DE BÚSQUEDA) ---
const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir, onClickPerfil, estatusChofer }) => {
  const sinPuestos = viaje.puestos === 0;
  const ultimoPuesto = viaje.puestos === 1;

  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return "--h --m";
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };
  const duracion = calcularDuracion(viaje.horaSalida, viaje.horaLlegada);

  return (
    <div className={`bg-white rounded-[32px] border shadow-sm transition-all duration-300 overflow-hidden group ${sinPuestos ? 'opacity-60 grayscale-[0.5] pointer-events-none' : 'hover:shadow-xl hover:border-blue-100 border-slate-100'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center justify-between py-1 min-h-[60px]">
               <span className="text-sm font-black text-slate-800 leading-none">{viaje.horaSalida || "--:--"}</span>
               <span className="text-[9px] font-bold text-slate-400">{duracion}</span>
               <span className="text-sm font-black text-slate-800 leading-none">{viaje.horaLlegada || "--:--"}</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-1.5">
              <div className="w-2.5 h-2.5 rounded-full border-[3px] border-slate-800 bg-white z-10" />
              <div className="w-[2px] flex-1 bg-slate-200" />
              <div className="w-2.5 h-2.5 rounded-full border-[3px] border-blue-600 bg-white z-10" />
            </div>
            <div className="flex flex-col justify-between py-1 min-h-[60px]">
               <span className="text-sm font-black text-slate-800 uppercase leading-none">{viaje.cO}</span>
               <span className="text-sm font-black text-slate-800 uppercase leading-none">{viaje.cD}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-3xl font-black italic text-slate-800 leading-none">${viaje.precio}</span>
            {sinPuestos ? (
               <span className="text-[10px] font-black text-slate-500 uppercase mt-2 bg-slate-200 px-3 py-1 rounded-lg">Completo</span>
            ) : ultimoPuesto ? (
               <span className="text-[9px] font-black text-amber-600 uppercase mt-2 bg-amber-100 px-3 py-1 rounded-lg animate-pulse border border-amber-200">¡Último!</span>
            ) : (
               <span className="text-[9px] font-bold text-green-600 uppercase mt-2 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{viaje.puestos} puestos</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="relative" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
              <User size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <ShieldCheck size={16} className="text-blue-600 fill-blue-50" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-black italic uppercase text-sm text-slate-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>{viaje.conductor}</h4>
              {(estatusChofer === "Oro" || estatusChofer === "Diamante") && <Star size={10} className="fill-amber-500 text-amber-500" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center text-slate-700">
                <Star size={10} className="fill-amber-500 text-amber-500" />
                <span className="text-[10px] font-black ml-0.5">{viaje.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">{estatusChofer}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {viaje.preferencias?.ac && <div className="p-1.5 bg-blue-50 text-blue-500 rounded-full"><Wind size={12}/></div>}
            {viaje.preferencias?.noFumar && <div className="p-1.5 bg-slate-50 text-slate-400 rounded-full"><CigaretteOff size={12}/></div>}
          </div>
        </div>
      </div>
      {!sinPuestos && (
        <div className="px-3 pb-3 flex gap-2">
          <button onClick={onClickDetalle} className="flex-1 py-3 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase italic text-[9px]">Ver Viaje</button>
          <button onClick={onClickPedir} className="flex-[2] py-3 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[9px] shadow-md active:scale-95">Reservar ahora</button>
        </div>
      )}
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
    <div className="flex flex-wrap gap-2 mt-3 justify-center">
      {items.map((item, i) => (
        <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase italic ${item.verificado ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
          {item.icon} {item.label} {item.verificado && <CheckCircle size={10} className="fill-green-600 text-white"/>}
        </div>
      ))}
    </div>
  );
};

const ProgresoGamificacion = ({ userData, onAbrirConfig }) => {
  const misiones = [
    { id: 'datos', label: 'Datos Básicos', completado: !!userData?.nombre, icono: <User size={14}/> },
    { id: 'cedula', label: 'Verificación KYC', completado: !!userData?.cedula, icono: <ShieldCheck size={14}/> },
    { id: 'vehiculo', label: 'Registrar Vehículo', completado: !!userData?.vehiculo?.placa, icono: <Car size={14}/> }
  ];
  const completadas = misiones.filter(m => m.completado).length;
  const viajesActuales = userData?.viajesCompletados || 0;
  let metaViajes = 10; let proxEstatus = "Plata";
  if (viajesActuales >= 10) { metaViajes = 30; proxEstatus = "Oro"; }
  if (viajesActuales >= 30) { metaViajes = 80; proxEstatus = "Diamante"; }
  const faltan = metaViajes > viajesActuales ? metaViajes - viajesActuales : 0;

  return (
    <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4 relative overflow-hidden mt-4">
      <div className="absolute top-[-10px] right-[-10px] opacity-[0.03] pointer-events-none"><Trophy size={100} /></div>
      <div>
        <div className="flex justify-between items-center mb-2">
           <p className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1"><Zap size={14}/> Sube de Nivel</p>
           <div className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">Próximo: {proxEstatus}</div>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
           <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-1000" style={{width: `${(viajesActuales/metaViajes)*100}%`}}></div>
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-1 text-right">Faltan {faltan} viajes para {proxEstatus}</p>
      </div>
      <div className="h-px w-full bg-slate-100 my-1"></div>
      <div>
        <p className="text-[10px] font-black uppercase text-blue-600 mb-3 flex justify-between items-center">Misiones de Confianza <span className="text-slate-400">{completadas}/{misiones.length}</span></p>
        <div className="space-y-2">
           {misiones.map(m => (
              <div key={m.id} className={`flex justify-between items-center p-3 rounded-2xl border ${m.completado ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                 <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${m.completado ? 'bg-green-200 text-green-700' : 'bg-slate-200 text-slate-400'}`}>{m.icono}</div>
                    <span className={`text-[10px] font-black uppercase italic ${m.completado ? 'text-green-700' : 'text-slate-500'}`}>{m.label}</span>
                 </div>
                 {m.completado ? <CheckCircle size={14} className="text-green-500"/> : <button onClick={onAbrirConfig} className="text-[8px] font-black uppercase italic bg-blue-600 text-white px-3 py-1.5 rounded-lg active:scale-95">Completar</button>}
              </div>
           ))}
        </div>
      </div>
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
  const [pasajerosConfirmados, setPasajerosConfirmados] = useState([]); // MÓDULO 8
  const [configOpen, setConfigOpen] = useState(false);

  const [chatActivo, setChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [historialChats, setHistorialChats] = useState([]); 
  const [perfilPublico, setPerfilPublico] = useState(null);

  const [form, setForm] = useState({ 
    eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", 
    horaSalida: "", horaLlegada: "",
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true }
  });
  const [viajeEditando, setViajeEditando] = useState(null); 
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", color: "", cedula: "" });
  
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);
  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [checkSeguridad, setCheckSeguridad] = useState({ placaOk: false, modeloOk: false, conductorOk: false });
  const [viajeActivo, setViajeActivo] = useState(null);
  const [pinIngresado, setPinIngresado] = useState("");

  const calcularEstatus = (v = 0, r = 0) => {
    if (v >= 80 && r >= 4.9) return "Diamante";
    if (v >= 30 && r >= 4.7) return "Oro";
    if (v >= 10 && r >= 4.5) return "Plata";
    return "Bronce";
  };

  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPerfilForm({
          marca: data.vehiculo?.marca || "", modelo: data.vehiculo?.modelo || "",
          placa: data.vehiculo?.placa || "", color: data.vehiculo?.color || "", cedula: data.cedula || ""
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
      const actual = snap.docs.map(d => ({id: d.id, ...d.data()}))
        .find(s => (s.idPasajero === user.uid || s.idChofer === user.uid) && s.estado !== "completado" && s.estado !== "rechazado");
      setViajeActivo(actual || null);
    });

    return () => { unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); unsubViajeActivo(); };
  }, [user]);

  // --- MÓDULO 8: Lógica para cargar pasajeros confirmados al seleccionar un viaje ---
  useEffect(() => {
    if (!viajeSeleccionado) {
      setPasajerosConfirmados([]);
      return;
    }
    const qP = query(collection(db, "Solicitudes"), where("idViaje", "==", viajeSeleccionado.id), where("estado", "==", "confirmado"));
    const unsubPasajeros = onSnapshot(qP, (snap) => {
      setPasajerosConfirmados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubPasajeros();
  }, [viajeSeleccionado]);

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
    if (userData?.kycVerificado !== true) return alert("🚫 Debes estar verificado.");
    if (!form.cO || !form.cD || !form.precio || !form.horaSalida) return alert("Completa los campos.");
    try {
      const dataViaje = { 
        ...form, precio: Number(form.precio), puestos: Number(form.puestos),
        viajesTotales: userData.viajesCompletados || 0, rating: userData.rating || 5.0,
        vehiculoInfo: { 
          marca: userData.vehiculo?.marca || "", 
          modelo: userData.vehiculo?.modelo || "", 
          placa: userData.vehiculo?.placa || "",
          color: userData.vehiculo?.color || "No especificado" // Módulo 8
        }
      };
      if (viajeEditando) {
         await updateDoc(doc(db, "Viajes", viajeEditando), dataViaje);
         setViajeEditando(null);
      } else {
         await addDoc(collection(db, "Viajes"), { ...dataViaje, conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp() });
      }
      setForm({ 
        eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", 
        horaSalida: "", horaLlegada: "",
        preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true }
      });
      alert("✅ ¡Ruta guardada!");
    } catch (e) { alert("Error."); }
  };

  const enviarSolicitudDirecta = async (viaje) => {
    if (user.uid === viaje.idCreador) return alert("No puedes pedirte cola a ti mismo.");
    try {
      await addDoc(collection(db, "Solicitudes"), {
        idViaje: viaje.id, idPasajero: user.uid, nombrePasajero: userData.nombre || "Pasajero",
        idChofer: viaje.idCreador, nombreChofer: viaje.conductor, 
        ruta: `${viaje.cO} → ${viaje.cD}`, estado: "pendiente", fase: "solicitado", 
        fechaSolicitud: serverTimestamp(), precioViaje: viaje.precio,
        vehiculoInfo: viaje.vehiculoInfo
      });
      alert("✅ ¡Solicitud enviada!");
    } catch (e) { alert("Error."); }
  };

  const confirmarViajeChofer = async (idS) => {
    try {
      await updateDoc(doc(db, "Solicitudes", idS), { estado: "confirmado", fase: "chofer_en_camino", fechaConfirmacion: serverTimestamp() });
      alert("✅ Aceptado.");
      setVista("en_viaje");
    } catch (e) { alert("Error."); }
  };

  const choferVerificaPIN = async () => {
    if (pinIngresado === viajeActivo.pinVerificacion) {
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: "viajando", pagoEstado: "retenido" });
      alert("✅ PIN Correcto. ¡Viaje iniciado!");
      setPinIngresado("");
    } else { alert("❌ PIN Incorrecto."); }
  };

  const finalizarViaje = async (rol) => {
    if(!viajeActivo) return;
    try {
      const act = {};
      if (rol === "chofer") act.finalizadoChofer = true;
      if (rol === "pasajero") act.finalizadoPasajero = true;
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), act);
      if ((rol === "chofer" && viajeActivo.finalizadoPasajero) || (rol === "pasajero" && viajeActivo.finalizadoChofer)) {
        await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: "finalizado", estado: "completado" });
        alert(`🏁 ¡Llegamos!`);
        setVista("inicio");
      }
    } catch (e) { console.error(e); }
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
        cedula: perfilForm.cedula
      });
      setConfigOpen(false);
      alert("✅ Perfil actualizado.");
    } catch (e) { alert("Error."); }
  };

  const cambiarVista = (v) => { setVista(v); setViajeSeleccionado(null); setChatActivo(null); };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic animate-pulse">DAME LA COLA...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans border-x shadow-2xl">
      
      {/* MODAL CHECKLIST */}
      {mostrarChecklist && (
        <div className="absolute inset-0 bg-slate-900/95 z-[250] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="bg-white rounded-[40px] p-8 w-full shadow-2xl space-y-6">
              <div className="text-center">
                 <ShieldCheck size={48} className="text-blue-600 mx-auto mb-2"/>
                 <h3 className="font-black italic uppercase text-xl text-slate-800">Protocolo de Confianza</h3>
              </div>
              <div className="space-y-3">
                 {[
                   { id: 'placaOk', label: `Placa: ${viajeActivo?.vehiculoInfo?.placa}`, icon: <CreditCard size={14}/> },
                   { id: 'modeloOk', label: `Carro: ${viajeActivo?.vehiculoInfo?.marca} ${viajeActivo?.vehiculoInfo?.modelo}`, icon: <Car size={14}/> },
                   { id: 'conductorOk', label: "Es el chofer de la foto", icon: <User size={14}/> }
                 ].map((item) => (
                    <button key={item.id} onClick={() => setCheckSeguridad({...checkSeguridad, [item.id]: !checkSeguridad[item.id]})} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between ${checkSeguridad[item.id] ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                       <div className="flex items-center gap-3">
                          {item.icon} <span className="text-[11px] font-black uppercase italic">{item.label}</span>
                       </div>
                       {checkSeguridad[item.id] ? <CheckCircle size={20} className="fill-blue-600 text-white" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"/>}
                    </button>
                 ))}
              </div>
              <button disabled={!(checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk)} onClick={() => { setMostrarChecklist(false); updateDoc(doc(db,"Solicitudes",viajeActivo.id), {fase: "pasajero_confirmado_encuentro", pinVerificacion: Math.floor(1000 + Math.random()*9000).toString()}); }} className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs ${checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>Confirmar y Ver PIN</button>
           </div>
        </div>
      )}

      {/* HEADER */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-12">D</div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p></div>
        </div>
        <div className="flex items-center gap-2">
           <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl">
             <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
           </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {vista === "inicio" && !viajeSeleccionado && (
           <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white">CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"} ➔</button>

              {modo === "chofer" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-4">
                    <h3 className="text-xs font-black uppercase text-blue-600 italic">Publicar Nueva Ruta</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value, cO: ""})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eO} value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad Origen</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value, cD: ""})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eD} value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad Destino</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" title="Salida" className="w-full bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.horaSalida} onChange={(e)=>setForm({...form, horaSalida: e.target.value})} required/>
                      <input type="time" title="Llegada" className="w-full bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.horaLlegada} onChange={(e)=>setForm({...form, horaLlegada: e.target.value})} required/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Asientos" className="w-full bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} />
                      <input type="number" placeholder="Precio $" className="w-full bg-slate-50 p-3 rounded-xl border text-xs font-black text-blue-600" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                    </div>
                    <button onClick={publicarOEditarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar</button>
                  </div>
                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase italic">Pendientes:</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-3xl border flex flex-col gap-3 shadow-md border-l-4 border-l-blue-500">
                           <div className="flex justify-between items-center">
                              <span className="font-black text-xs italic underline">{s.nombrePasajero}</span>
                              <button onClick={() => abrirChat(s.idViaje, s.idPasajero, s.nombrePasajero)} className="p-3 bg-blue-600 text-white rounded-xl"><MessageCircle size={16}/></button>
                           </div>
                           <button onClick={() => confirmarViajeChofer(s.id)} className="w-full p-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic">Aprobar Cola</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white p-5 rounded-[30px] border space-y-3 shadow-sm">
                <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar Cola</p>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>setFEO(e.target.value)}><option value="">DESDE EDO.</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>setFED(e.target.value)}><option value="">HASTA EDO.</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                </div>
              </div>

              <div className="space-y-5">
                 {viajes.filter(v => (fEO === "" || v.eO === fEO) && (fED === "" || v.eD === fED)).map(v => (
                    <CardViajeOptimizada 
                      key={v.id} viaje={v} estatusChofer={calcularEstatus(v.viajesTotales, v.rating)}
                      onClickDetalle={() => setViajeSeleccionado(v)}
                      onClickPedir={() => enviarSolicitudDirecta(v)}
                      onClickPerfil={() => setPerfilPublico({nombre: v.conductor, rating: v.rating, kycVerificado: true})}
                    />
                 ))}
              </div>
           </div>
        )}

        {/* --- MÓDULO 8: VISTA DE DETALLE COMPLETA --- */}
        {viajeSeleccionado && vista === "inicio" && (
           <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic"><ChevronLeft size={16}/> Regresar</button>
              
              <div className="bg-white rounded-[40px] border shadow-2xl p-8 space-y-6 overflow-hidden relative">
                 <div className="flex justify-between items-center border-b pb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Costo del asiento</p>
                      <p className="text-4xl font-black italic text-blue-600 leading-none">${viajeSeleccionado.precio}</p>
                    </div>
                    <BadgeEstatus nivel={calcularEstatus(viajeSeleccionado.viajesTotales, viajeSeleccionado.rating)} />
                 </div>

                 {/* INFO DEL VEHÍCULO (Módulo 8 - Requisito 1) */}
                 <div className="bg-slate-900 p-5 rounded-[30px] text-white space-y-3 shadow-lg">
                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Vehículo del Viaje</p>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Car size={24}/></div>
                          <div>
                             <p className="text-sm font-black italic uppercase leading-none">{viajeSeleccionado.vehiculoInfo?.marca} {viajeSeleccionado.vehiculoInfo?.modelo}</p>
                             <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Placa: {viajeSeleccionado.vehiculoInfo?.placa || "N/A"}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="flex items-center gap-1 justify-end text-blue-400"><Paintbrush size={12}/><span className="text-[9px] font-black uppercase italic">Color</span></div>
                          <p className="text-[11px] font-black uppercase">{viajeSeleccionado.vehiculoInfo?.color || "No indicado"}</p>
                       </div>
                    </div>
                 </div>

                 {/* RUTA Y HORARIOS */}
                 <div className="space-y-4 px-2">
                    <div className="flex items-start gap-4">
                       <div className="flex flex-col items-center gap-1 mt-1">
                          <div className="w-3 h-3 rounded-full border-2 border-slate-800 bg-white" />
                          <div className="w-[2px] h-8 bg-slate-200" />
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                       </div>
                       <div className="flex-1 space-y-5">
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Salida: {viajeSeleccionado.horaSalida}</p>
                             <p className="font-black text-sm italic uppercase text-slate-800">{viajeSeleccionado.cO}, {viajeSeleccionado.eO}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Llegada aprox: {viajeSeleccionado.horaLlegada}</p>
                             <p className="font-black text-sm italic uppercase text-slate-800">{viajeSeleccionado.cD}, {viajeSeleccionado.eD}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* PASAJEROS CONFIRMADOS (Módulo 8 - Requisito 2, 3 y 4) */}
                 <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                       <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Users size={14}/> Pasajeros en el carro</p>
                       <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{pasajerosConfirmados.length} confirmados</span>
                    </div>
                    
                    <div className="space-y-3">
                       {pasajerosConfirmados.length > 0 ? (
                         pasajerosConfirmados.map((pas) => (
                           <div key={pas.id} className="bg-white p-3 rounded-2xl flex items-center justify-between border shadow-sm">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border text-slate-400"><User size={20}/></div>
                                 <div>
                                    <p className="text-xs font-black uppercase italic text-slate-800 leading-none">{pas.nombrePasajero}</p>
                                    <div className="flex items-center gap-1 mt-1"><MapPin size={10} className="text-blue-500"/><p className="text-[9px] font-bold text-slate-400 uppercase leading-none">{pas.ruta}</p></div>
                                 </div>
                              </div>
                              <div className="bg-green-50 p-1.5 rounded-lg"><ShieldCheck size={14} className="text-green-600"/></div>
                           </div>
                         ))
                       ) : (
                         <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-3xl">
                            <p className="text-[10px] font-bold text-slate-400 italic">Aún no hay otros pasajeros confirmados.<br/>¡Sé el primero en reservar!</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* BOTONES DE ACCIÓN */}
                 <div className="flex gap-2 pt-4">
                    <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2"><MessageCircle size={18}/> Chat</button>
                    <button onClick={() => enviarSolicitudDirecta(viajeSeleccionado)} className="flex-[1.5] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition-all">Solicitar mi Asiento</button>
                 </div>
              </div>
           </div>
        )}

        {/* --- VISTA EN VIAJE --- */}
        {vista === "en_viaje" && viajeActivo && (
          <div className="h-full flex flex-col space-y-4">
             <PasosProgreso fase={viajeActivo.fase} />
             <div className="flex-1 bg-slate-200 rounded-[40px] border-4 border-white shadow-2xl flex items-center justify-center">
                <MapIcon size={40} className="text-slate-400 animate-pulse"/>
             </div>
             <div className="bg-white p-6 rounded-[35px] border shadow-lg space-y-3">
                {user.uid === viajeActivo.idChofer ? (
                  <button onClick={() => updateDoc(doc(db,"Solicitudes",viajeActivo.id), {fase: "en_punto_de_encuentro"})} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs">He llegado al punto</button>
                ) : (
                  <button onClick={() => setMostrarChecklist(true)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs">Iniciar Protocolo Seguridad</button>
                )}
             </div>
          </div>
        )}

        {/* PERFIL Y CONFIGURACIÓN */}
        {vista === "perfil" && (
           <div className="space-y-4 pb-10">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative overflow-hidden">
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={22}/></button>
                 <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl mb-4"><User size={56} className="text-slate-400" /></div>
                 <h2 className="font-black italic text-2xl text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
                 <SenalesConfianza data={userData} />
              </div>

              <ProgresoGamificacion userData={userData} onAbrirConfig={() => setConfigOpen(true)} />

              {configOpen && (
                <div className="bg-white p-6 rounded-[35px] border shadow-2xl space-y-3">
                  <p className="text-[10px] font-black uppercase text-blue-600 italic px-2">Identidad</p>
                  <input type="text" placeholder="Cédula" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                  <p className="text-[10px] font-black uppercase text-blue-600 italic px-2 pt-2">Vehículo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Marca" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold" value={perfilForm.marca} onChange={(e)=>setPerfilForm({...perfilForm, marca: e.target.value})} />
                    <input type="text" placeholder="Modelo" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold" value={perfilForm.modelo} onChange={(e)=>setPerfilForm({...perfilForm, modelo: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Placa" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                    <input type="text" placeholder="Color del Carro" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase" value={perfilForm.color} onChange={(e)=>setPerfilForm({...perfilForm, color: e.target.value})} />
                  </div>
                  <button onClick={guardarDatosPerfil} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs mt-2">Guardar Cambios</button>
                </div>
              )}
              <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] italic bg-white rounded-[30px] border shadow-sm mt-4 active:bg-red-50 transition-colors"><LogOut size={20} /> Cerrar Sesión</button>
           </div>
        )}

        {/* CHAT PRIVADO */}
        {vista === "chat_privado" && chatActivo && (
          <div className="flex flex-col h-full space-y-4">
            <button onClick={() => setVista("inicio")} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><ChevronLeft size={16}/> Regresar</button>
            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase">{chatActivo.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-4 rounded-3xl max-w-[80%] text-[11px] font-bold shadow-sm ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} className="flex-1 bg-slate-100 p-3 rounded-2xl text-[11px] font-bold outline-none" placeholder="Mensaje..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center"><Send size={18}/></button>
               </div>
            </div>
          </div>
        )}

        {/* WALLET */}
        {vista === "wallet" && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Billetera</h2>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                 <p className="text-[10px] font-black uppercase opacity-80 mb-2">Saldo</p>
                 <p className="text-6xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
                 <div className="absolute top-10 right-10 opacity-20"><Wallet size={80}/></div>
              </div>
           </div>
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => cambiarVista("inicio")} className={`flex flex-col items-center gap-1 transition-all ${vista === "inicio" ? "text-blue-600 scale-110" : "text-slate-300"}`}><Car size={28} /><span className="text-[8px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => cambiarVista("wallet")} className={`flex flex-col items-center gap-1 transition-all ${vista === "wallet" ? "text-blue-600 scale-110" : "text-slate-300"}`}><Wallet size={28} /><span className="text-[8px] font-black uppercase italic">Wallet</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 transition-all ${vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-300"}`}><User size={28} /><span className="text-[8px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
