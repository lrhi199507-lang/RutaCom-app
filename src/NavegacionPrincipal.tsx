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
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase, Zap, Inbox
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

// --- COMPONENTES VISUALES ---

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
            {sinPuestos ? <span className="text-[10px] font-black text-slate-500 uppercase mt-2 bg-slate-200 px-3 py-1 rounded-lg">Completo</span> :
             ultimoPuesto ? <span className="text-[9px] font-black text-amber-600 uppercase mt-2 bg-amber-100 px-3 py-1 rounded-lg animate-pulse">¡Último puesto!</span> :
             <span className="text-[9px] font-bold text-green-600 uppercase mt-2 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{viaje.puestos} disponibles</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="relative" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm cursor-pointer"><User size={24} /></div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm"><ShieldCheck size={16} className="text-blue-600 fill-blue-50" /></div>
          </div>
          <div className="flex-1">
            <h4 className="font-black italic uppercase text-sm text-slate-800">{viaje.conductor}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star size={10} className="fill-amber-500 text-amber-500" /><span className="text-[10px] font-black">{viaje.rating?.toFixed(1) || "5.0"}</span>
              <span className="text-slate-300 text-[10px]">•</span><span className="text-[9px] font-bold text-slate-400 uppercase">{estatusChofer}</span>
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
          <button onClick={onClickPedir} className="flex-[2] py-3 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[9px] shadow-md">Reservar ahora</button>
        </div>
      )}
    </div>
  );
};

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
          {item.icon}{item.label}{item.verificado ? <CheckCircle size={10} className="fill-green-600 text-white"/> : <X size={10}/>}
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
  const faltan = metaViajes > viajesActuales ? metaViajes - viajesActuales : 0;

  return (
    <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4 mt-4">
      <div>
        <div className="flex justify-between items-center mb-2">
           <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1"><Zap size={14}/> Nivel</p>
           <div className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">Próximo: {proxEstatus}</div>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border">
           <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full" style={{width: `${(viajesActuales/metaViajes)*100}%`}}></div>
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-1 text-right">Faltan {faltan} viajes para {proxEstatus}</p>
      </div>
      <div className="space-y-2">
           {misiones.map(m => (
              <div key={m.id} className={`flex justify-between items-center p-3 rounded-2xl border ${m.completado ? 'bg-green-50' : 'bg-slate-50'}`}>
                 <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${m.completado ? 'bg-green-200 text-green-700' : 'bg-slate-200'}`}>{m.icono}</div>
                    <span className="text-[10px] font-black uppercase italic">{m.label}</span>
                 </div>
                 {m.completado ? <CheckCircle size={14} className="text-green-500"/> : <button onClick={onAbrirConfig} className="text-[8px] font-black uppercase bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md">Ir</button>}
              </div>
           ))}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function NavegacionPrincipal({ user }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]); 
  const [misSolicitudes, setMisSolicitudes] = useState([]); 
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Estados Chat e Inbox (Módulo 8 Integrado)
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
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);
  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [checkSeguridad, setCheckSeguridad] = useState({ placaOk: false, modeloOk: false, conductorOk: false });
  const [viajeActivo, setViajeActivo] = useState(null);
  const [pinIngresado, setPinIngresado] = useState("");

  const calcularEstatus = (v = 0, c = 0) => {
    if (v >= 80 && c >= 4.9) return "Diamante";
    if (v >= 30 && c >= 4.7) return "Oro";
    if (v >= 10 && c >= 4.5) return "Plata";
    return "Bronce";
  };

  // FIREBASE LISTENERS
  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), snap => {
      if (snap.exists()) {
        const d = snap.data(); setUserData(d);
        setPerfilForm({ marca: d.vehiculo?.marca || "", modelo: d.vehiculo?.modelo || "", placa: d.vehiculo?.placa || "", cedula: d.cedula || "" });
      }
    });
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), snap => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idChofer", "==", user.uid), where("estado", "==", "pendiente")), snap => {
      setSolicitudesRecibidas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), snap => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubViajeActivo = onSnapshot(query(collection(db, "Solicitudes")), snap => {
      const act = snap.docs.map(d => ({id: d.id, ...d.data()}))
        .find(s => (s.idPasajero === user.uid || s.idChofer === user.uid) && !["completado", "rechazado"].includes(s.estado));
      setViajeActivo(act || null);
    });

    // Lógica Inbox (Módulo 8)
    let docsRecibidos = []; let docsEnviados = [];
    const actHistorial = (todos) => {
       const mapChats = new Map();
       todos.forEach(d => {
          const data = d.data();
          const soyEmisor = data.emisorId === user.uid;
          const idOtro = soyEmisor ? data.receptorId : data.emisorId;
          const fechaMs = data.fecha ? data.fecha.toMillis() : Date.now();
          if (!mapChats.has(data.chatId) || fechaMs > mapChats.get(data.chatId).fecha) {
             mapChats.set(data.chatId, { 
               chatId: data.chatId, idViaje: data.idViaje, idOtro, 
               nombreOtro: soyEmisor ? (data.nombreReceptor || "Usuario") : data.nombreEmisor, 
               ultimoMensaje: data.texto, fecha: fechaMs, leido: data.leido 
             });
          }
       });
       setHistorialChats(Array.from(mapChats.values()).sort((a,b) => b.fecha - a.fecha));
    };
    const unsubR = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid)), snap => { docsRecibidos = snap.docs; actHistorial([...docsRecibidos, ...docsEnviados]); });
    const unsubE = onSnapshot(query(collection(db, "MensajesPrivados"), where("emisorId", "==", user.uid)), snap => { docsEnviados = snap.docs; actHistorial([...docsRecibidos, ...docsEnviados]); });

    return () => { unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); unsubR(); unsubE(); unsubViajeActivo(); };
  }, [user]);

  // Chat individual
  useEffect(() => {
    if (!chatActivo) return;
    const unsubMsg = onSnapshot(query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc")), snap => {
      setMensajesChat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubMsg();
  }, [chatActivo]);

  // FUNCIONES LOGICA
  const abrirChat = (idViaje, idOtro, nombreOtro) => {
    const cid = [user.uid, idOtro].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: cid, nombre: nombreOtro, idOtro, idViaje });
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
    if (userData?.kycVerificado !== true) return alert("Verifícate primero.");
    if (!form.cO || !form.cD || !form.precio || !form.horaSalida) return alert("Campos incompletos.");
    try {
      const vData = { ...form, precio: Number(form.precio), puestos: Number(form.puestos), viajesTotales: userData.viajesCompletados || 0, rating: userData.rating || 5.0, vehiculoInfo: userData.vehiculo };
      if (viajeEditando) { await updateDoc(doc(db, "Viajes", viajeEditando), vData); setViajeEditando(null); }
      else { await addDoc(collection(db, "Viajes"), { ...vData, conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp() }); }
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", horaSalida: "", horaLlegada: "", preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true } });
      alert("Ruta publicada.");
    } catch (e) { alert("Error."); }
  };

  const enviarSolicitudDirecta = async (v) => {
    if (user.uid === v.idCreador) return;
    try {
      await addDoc(collection(db, "Solicitudes"), {
        idViaje: v.id, idPasajero: user.uid, nombrePasajero: userData.nombre, idChofer: v.idCreador, nombreChofer: v.conductor, 
        ruta: `${v.cO} → ${v.cD}`, estado: "pendiente", fase: "solicitado", fechaSolicitud: serverTimestamp(),
        precioViaje: v.precio, vehiculoInfo: v.vehiculoInfo, preferenciasViaje: v.preferencias
      });
      alert("Solicitud enviada.");
    } catch (e) { console.error(e); }
  };

  const choferVerificaPIN = async () => {
    if (pinIngresado === viajeActivo.pinVerificacion) {
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: "viajando", pagoEstado: "retenido" });
      alert("PIN Correcto. Pago Retenido."); setPinIngresado("");
    } else alert("PIN Incorrecto.");
  };

  const finalizarViaje = async (rol) => {
    const upd = rol === "chofer" ? { finalizadoChofer: true } : { finalizadoPasajero: true };
    await updateDoc(doc(db, "Solicitudes", viajeActivo.id), upd);
    if ((rol === "chofer" && viajeActivo.finalizadoPasajero) || (rol === "pasajero" && viajeActivo.finalizadoChofer)) {
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: "finalizado", estado: "completado", pagoEstado: "completado" });
      alert("Viaje finalizado."); setVista("inicio");
    }
  };

  const cambiarVista = (v) => { setVista(v); setViajeSeleccionado(null); setChatActivo(null); };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic animate-pulse">CARGANDO DAME LA COLA...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans border-x shadow-2xl">
      
      {/* HEADER */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-12">D</div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p></div>
        </div>
        <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl active:scale-95">
          <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {vista === "inicio" && (
           <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white">
                CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"} ➔
              </button>

              {modo === "chofer" && (
                <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-blue-600 italic">Publicar Nueva Ruta</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-bold" value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad Origen</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" className="bg-slate-50 p-3 rounded-xl border text-[10px]" value={form.horaSalida} onChange={(e)=>setForm({...form, horaSalida: e.target.value})} />
                    <input type="number" placeholder="Precio $" className="bg-slate-50 p-3 rounded-xl border text-xs font-black text-blue-600" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                  </div>
                  <button onClick={publicarOEditarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Viaje</button>
                </div>
              )}

              {viajes.map(v => (
                <CardViajeOptimizada key={v.id} viaje={v} estatusChofer={calcularEstatus(v.viajesTotales, v.rating)} onClickDetalle={() => setViajeSeleccionado(v)} onClickPedir={() => enviarSolicitudDirecta(v)} onClickPerfil={() => setPerfilPublico(v)} />
              ))}
           </div>
        )}

        {/* --- VISTA INBOX (MÓDULO 8 INTEGRADO) --- */}
        {vista === "inbox" && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-2xl font-black italic text-slate-800 uppercase">Mensajes</h2>
            {historialChats.length === 0 ? (
              <div className="p-10 text-center text-slate-300 font-black uppercase italic text-xs">No hay conversaciones activas</div>
            ) : (
              historialChats.map((c) => (
                <div key={c.chatId} onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} className="bg-white p-5 rounded-[30px] border shadow-sm flex items-center gap-4 active:scale-95 transition-all">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner relative">
                    <User size={28} />
                    {!c.leido && <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-black uppercase italic text-sm text-slate-800 leading-none">{c.nombreOtro}</p>
                      <p className="text-[8px] font-bold text-slate-400">{new Date(c.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-bold italic opacity-70">{c.ultimoMensaje}</p>
                  </div>
                  <ChevronLeft size={16} className="text-slate-200 rotate-180" />
                </div>
              ))
            )}
          </div>
        )}

        {/* CHAT PRIVADO */}
        {vista === "chat_privado" && chatActivo && (
          <div className="flex flex-col h-full space-y-4">
            <button onClick={() => setVista("inbox")} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><ChevronLeft size={16}/> Volver al Inbox</button>
            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase">{chatActivo.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-4 rounded-3xl max-w-[80%] text-[11px] font-bold shadow-sm ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border text-slate-700 self-start rounded-tl-none'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrivado()} className="flex-1 bg-slate-100 p-3 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
               </div>
            </div>
          </div>
        )}

        {/* WALLET */}
        {vista === "wallet" && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black italic text-slate-800 uppercase">Mi Wallet</h2>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white">
                 <p className="text-[10px] font-black uppercase opacity-80 mb-2">Saldo Disponible</p>
                 <p className="text-6xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
                 <div className="mt-8 flex items-center gap-2 bg-white/10 p-3 rounded-2xl"><Lock size={14}/><p className="text-[9px] font-black uppercase">Fondos protegidos por el sistema inteligente.</p></div>
              </div>
           </div>
        )}

        {/* PERFIL */}
        {vista === "perfil" && (
           <div className="space-y-4 animate-in fade-in pb-10">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center">
                 <div className="relative mb-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center"><User size={48} className="text-slate-400" /></div>
                    <div className="absolute -bottom-2 -right-2"><BadgeEstatus nivel={calcularEstatus(userData.viajesCompletados, userData.rating)} /></div>
                 </div>
                 <h2 className="font-black italic text-2xl text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
                 <SenalesConfianza data={userData} />
              </div>
              <ProgresoGamificacion userData={userData} onAbrirConfig={() => setConfigOpen(true)} />
              <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3 bg-white rounded-[30px] border shadow-sm mt-4 italic"><LogOut size={20} /> Cerrar Sesión</button>
           </div>
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN (Módulo 8 Integrado) */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => cambiarVista("inicio")} className={`flex flex-col items-center gap-1 transition-all ${vista === "inicio" ? "text-blue-600 scale-110" : "text-slate-300"}`}><Car size={26} /><span className="text-[7px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => cambiarVista("inbox")} className={`flex flex-col items-center gap-1 transition-all ${["inbox", "chat_privado"].includes(vista) ? "text-blue-600 scale-110" : "text-slate-300"}`}><Inbox size={26} /><span className="text-[7px] font-black uppercase italic">Inbox</span></button>
        <button onClick={() => cambiarVista("wallet")} className={`flex flex-col items-center gap-1 transition-all ${vista === "wallet" ? "text-blue-600 scale-110" : "text-slate-300"}`}><CreditCard size={26} /><span className="text-[7px] font-black uppercase italic">Wallet</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 transition-all ${vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-300"}`}><User size={26} /><span className="text-[7px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
