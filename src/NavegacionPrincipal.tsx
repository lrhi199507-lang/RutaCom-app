import React, { useState, useEffect, useRef, useMemo } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where, getDocs,
  limit, increment, arrayUnion, arrayRemove
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, Trash2, MessageCircle, CreditCard, Users, 
  ChevronLeft, MapPin, Bell, Edit2, AlertTriangle, Star, X,
  Map as MapIcon, Flag, Info, Clock, ArrowRight, Share2, Key, Lock, Trophy,
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase, Zap, Palette,
  PlusCircle, History, Filter, Heart, Award
} from "lucide-react";

/**
 * --- DAME LA COLA: SISTEMA DE GESTIÓN GEOGRÁFICA ---
 * Definición exhaustiva de Estados y Ciudades de Venezuela.
 * Este objeto sirve como fuente de verdad para los selectores de rutas.
 */
const UBICACIONES = {
  "Amazonas": ["Puerto Ayacucho", "San Fernando de Atabapo"],
  "Anzoátegui": ["Barcelona", "Puerto La Cruz", "El Tigre", "Anaco", "Lechería"],
  "Apure": ["San Fernando", "Guasdualito", "Elorza"],
  "Aragua": ["Maracay", "Turmero", "La Victoria", "Cagua", "El Limón"],
  "Barinas": ["Barinas", "Socopó", "Barinitas"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar", "Upata", "Caicara del Orinoco"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego", "Puerto Cabello", "Los Guayos"],
  "Cojedes": ["San Carlos", "Tinaquillo"],
  "Delta Amacuro": ["Tucupita"],
  "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo", "Punta Cardón"],
  "Guárico": ["San Juan de los Morros", "Valle de la Pascua", "Calabozo"],
  "Lara": ["Barquisimeto", "Cabudare", "Carora", "El Tocuyo"],
  "Mérida": ["Mérida", "El Vigía", "Ejido", "Tovar"],
  "Miranda": ["Los Teques", "Chacao", "Baruta", "Guatire", "Guarenas", "Higuerote"],
  "Monagas": ["Maturín", "Punta de Mata"],
  "Nueva Esparta": ["Porlamar", "La Asunción", "Pampatar"],
  "Portuguesa": ["Guanare", "Acarigua", "Araure"],
  "Sucre": ["Cumaná", "Carúpano"],
  "Táchira": ["San Cristóbal", "Táriba", "Rubio", "San Antonio del Táchira"],
  "Trujillo": ["Valera", "Trujillo", "Boconó"],
  "Vargas": ["La Guaira", "Maiquetía", "Catia La Mar"],
  "Yaracuy": ["San Felipe", "Yaritagua", "Nirgua"],
  "Zulia": ["Maracaibo", "San Francisco", "Cabimas", "Ciudad Ojeda", "Machiques"]
};

const ESTADOS = Object.keys(UBICACIONES);

/**
 * --- MÓDULO 1 & 4: SISTEMA DE REPUTACIÓN VISUAL ---
 * Componente que renderiza el estatus del usuario basado en su historial.
 */
const BadgeEstatus = ({ nivel, mini = false }) => {
  const configs = {
    "Bronce": { 
      color: "text-slate-500", 
      bg: "bg-slate-100", 
      border: "border-slate-200",
      label: "Novato",
      icon: <ShieldCheck size={mini ? 8 : 10} />
    },
    "Plata": { 
      color: "text-zinc-600", 
      bg: "bg-zinc-200", 
      border: "border-zinc-300",
      label: "Viajero",
      icon: <Award size={mini ? 8 : 10} />
    },
    "Oro": { 
      color: "text-amber-600", 
      bg: "bg-amber-100", 
      border: "border-amber-200",
      label: "Super Driver",
      icon: <Star size={mini ? 8 : 10} className="fill-amber-600" />
    },
    "Diamante": { 
      color: "text-blue-600", 
      bg: "bg-blue-100", 
      border: "border-blue-200",
      label: "Elite",
      icon: <Zap size={mini ? 8 : 10} className="fill-blue-600" />
    },
    "Leyenda": { 
      color: "text-purple-600", 
      bg: "bg-purple-100", 
      border: "border-purple-200",
      label: "Leyenda",
      icon: <Trophy size={mini ? 8 : 10} className="fill-purple-600" />
    }
  };

  const c = configs[nivel] || configs["Bronce"];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${c.bg} border ${c.border} shadow-sm transition-all duration-300`}>
      <span className={c.color}>{c.icon}</span>
      <span className={`font-black uppercase italic tracking-tighter ${mini ? 'text-[7px]' : 'text-[9px]'} ${c.color}`}>
        {c.label}
      </span>
    </div>
  );
};
/**
 * --- MÓDULO 5: INDICADOR DE PROGRESO DE FLUJO (REAL-TIME) ---
 * Visualiza en qué etapa se encuentra la cola actual.
 */
const PasosProgreso = ({ fase }) => {
  const pasos = [
    { id: "solicitado", label: "Pedido", activo: ["pendiente", "confirmado", "chofer_en_camino", "en_punto_de_encuentro", "pasajero_confirmado_encuentro", "viajando"].includes(fase) },
    { id: "aprobado", label: "Aprobado", activo: ["confirmado", "chofer_en_camino", "en_punto_de_encuentro", "pasajero_confirmado_encuentro", "viajando"].includes(fase) },
    { id: "retenido", label: "En Camino", activo: ["viajando"].includes(fase) },
    { id: "finalizado", label: "Destino", activo: ["finalizado"].includes(fase) }
  ];

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white rounded-[25px] border shadow-sm mb-6">
      {pasos.map((p, i) => (
        <React.Fragment key={p.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${p.activo ? 'bg-blue-600 border-blue-200 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-100 border-slate-200'}`} />
            <span className={`text-[8px] font-black uppercase tracking-tight ${p.activo ? 'text-blue-600' : 'text-slate-300'}`}>{p.label}</span>
          </div>
          {i < pasos.length - 1 && (
            <div className={`flex-1 h-[3px] mx-2 mb-4 rounded-full transition-all duration-700 ${pasos[i+1].activo ? 'bg-blue-600' : 'bg-slate-100'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * --- MÓDULO 13: GAMIFICACIÓN KYC (EL CORAZÓN DE LA CONFIANZA) ---
 * Este componente incentiva al usuario a completar su perfil para reducir comisiones.
 */
const KYCProgressBar = ({ userData }) => {
  const hitos = [
    { id: 1, label: 'Foto Real', cumplido: !!userData?.fotoUrl },
    { id: 2, label: 'Teléfono', cumplido: !!userData?.telefonoVerificado },
    { id: 3, label: 'Correo', cumplido: !!userData?.emailVerificado },
    { id: 4, label: 'Cédula KYC', cumplido: !!userData?.cedula },
    { id: 5, label: 'Vehículo', cumplido: !!userData?.vehiculo?.placa },
    { id: 6, label: 'Bio Activa', cumplido: !!userData?.bio && userData?.bio.length > 10 }
  ];

  const completados = hitos.filter(h => h.cumplido).length;
  const porcentaje = (completados / hitos.length) * 100;

  return (
    <div className="bg-white p-6 rounded-[35px] border border-blue-50 shadow-xl space-y-4 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-blue-50/50 group-hover:text-blue-100/50 transition-colors">
        <ShieldCheck size={120} />
      </div>

      <div className="relative z-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 bg-blue-600 rounded-lg text-white"><Zap size={12} fill="currentColor"/></div>
            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest leading-none">Nivel de Confianza</p>
          </div>
          <p className="text-2xl font-black italic text-slate-800">{completados} de {hitos.length}</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-2xl border border-blue-100">
            {Math.round(porcentaje)}%
          </span>
        </div>
      </div>

      <div className="relative z-10 w-full bg-slate-100 h-5 rounded-full overflow-hidden p-1 border shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-2 pt-2">
        {hitos.map(h => (
          <div key={h.id} className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-[8px] font-black uppercase italic transition-all duration-500 ${h.cumplido ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
            {h.cumplido ? (
              <CheckCircle size={10} className="fill-green-600 text-white shrink-0"/>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200 shrink-0"/>
            )}
            <span className="truncate">{h.label}</span>
          </div>
        ))}
      </div>
      
      {porcentaje < 100 ? (
        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-center gap-3 animate-pulse">
           <Info size={16} className="text-amber-500 shrink-0"/>
           <p className="text-[9px] font-bold text-amber-700 leading-tight">
             Completa tu perfil para ser <span className="font-black">"Chofer de Confianza"</span> y recibir tus pagos sin comisiones de plataforma.
           </p>
        </div>
      ) : (
        <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex items-center gap-3">
           <Trophy size={16} className="text-green-500 shrink-0"/>
           <p className="text-[9px] font-black text-green-700 uppercase italic">¡Felicidades! Eres un miembro verificado de Dame la cola.</p>
        </div>
      )}
    </div>
  );
};
/**
 * --- MÓDULO 7: TARJETA DE VIAJE OPTIMIZADA ---
 * Diseñada para resaltar precio, puestos y reputación del chofer.
 */
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

  return (
    <div className={`group relative bg-white rounded-[40px] border-2 shadow-sm transition-all duration-500 overflow-hidden ${sinPuestos ? 'opacity-60 grayscale-[0.8] pointer-events-none' : 'hover:shadow-2xl hover:border-blue-200 border-slate-100 active:scale-[0.98]'}`}>
      <div className="p-6">
        {/* Cabecera: Ruta y Precio */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-5">
            <div className="flex flex-col items-center justify-between py-1 min-h-[70px]">
               <span className="text-base font-black text-slate-900 leading-none">{viaje.horaSalida}</span>
               <div className="h-full w-px border-l-2 border-dashed border-slate-200 my-1" />
               <span className="text-base font-black text-slate-900 leading-none">{viaje.horaLlegada}</span>
            </div>
            
            <div className="flex flex-col justify-between py-1 min-h-[70px]">
               <div>
                 <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Origen</p>
                 <span className="text-sm font-black text-slate-800 uppercase italic">{viaje.cO}</span>
               </div>
               <div>
                 <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest leading-none mb-1">Destino</p>
                 <span className="text-sm font-black text-slate-800 uppercase italic">{viaje.cD}</span>
               </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="flex items-start">
              <span className="text-sm font-black text-slate-400 mt-1 mr-0.5">$</span>
              <span className="text-4xl font-black italic text-slate-900 leading-none tracking-tighter">{viaje.precio}</span>
            </div>
            {sinPuestos ? (
               <span className="text-[9px] font-black text-slate-500 uppercase mt-3 bg-slate-100 px-3 py-1 rounded-full">Lleno</span>
            ) : (
               <div className={`mt-3 px-3 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${ultimoPuesto ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-green-50 border-green-100 text-green-600'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${ultimoPuesto ? 'bg-red-500' : 'bg-green-500'}`} />
                 <span className="text-[9px] font-black uppercase tracking-tighter">{viaje.puestos} disponibles</span>
               </div>
            )}
          </div>
        </div>

        {/* Info del Conductor */}
        <div className="flex items-center gap-4 pt-5 border-t border-slate-50">
          <div className="relative" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl flex items-center justify-center text-slate-400 border-2 border-white shadow-md cursor-pointer group-hover:rotate-3 transition-transform">
              <User size={28} />
            </div>
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-lg border-2 border-white">
              <ShieldCheck size={12} fill="currentColor" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-black italic uppercase text-sm text-slate-800 cursor-pointer hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
                {viaje.conductor}
              </h4>
              <BadgeEstatus nivel={estatusChofer} mini />
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center bg-amber-400/10 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100">
                <Star size={10} className="fill-amber-600 mr-1" />
                <span className="text-[10px] font-black">{viaje.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase italic tracking-tighter">{viaje.viajesTotales || 0} viajes</span>
            </div>
          </div>
          
          <div className="flex gap-1.5">
            {viaje.preferencias?.ac && <div className="p-2 bg-blue-50 text-blue-500 rounded-xl border border-blue-100"><Wind size={14}/></div>}
            {viaje.preferencias?.noFumar && <div className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100"><CigaretteOff size={14}/></div>}
          </div>
        </div>
      </div>

      {!sinPuestos && (
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClickDetalle} className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase italic text-[10px] hover:bg-slate-100 transition-colors">
            Ver Detalles
          </button>
          <button onClick={onClickPedir} className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase italic text-[10px] shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95">
            Apartar mi puesto
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * --- SEÑALES DE CONFIANZA (MÓDULO 2) ---
 * Visualización rápida de documentos verificados.
 */
const SenalesConfianza = ({ data }) => {
  const checks = [
    { icon: <FileText size={14}/>, label: "Cédula", ok: !!data?.cedula },
    { icon: <Car size={14}/>, label: "Placas", ok: !!data?.vehiculo?.placa },
    { icon: <Camera size={14}/>, label: "Rostro", ok: !!data?.fotoVerificada },
  ];
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {checks.map((c, i) => (
        <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all ${c.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
          <span className={c.ok ? 'text-green-600' : 'text-slate-300'}>{c.icon}</span>
          <span className="text-[9px] font-black uppercase italic">{c.label}</span>
          {c.ok && <CheckCircle size={10} className="fill-green-600 text-white" />}
        </div>
      ))}
    </div>
  );
};
export default function NavegacionPrincipal({ user }) {
  // --- ESTADOS DE NAVEGACIÓN Y MODO ---
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [configOpen, setConfigOpen] = useState(false);
  
  // --- DATOS DE FIREBASE ---
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]); 
  const [misSolicitudes, setMisSolicitudes] = useState([]); 
  const [viajeActivo, setViajeActivo] = useState(null);

  // --- INTERACCIÓN Y MODALES ---
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [perfilPublico, setPerfilPublico] = useState(null);
  const [pasajerosViaje, setPasajerosViaje] = useState([]);
  const [busquedasRecientes, setBusquedasRecientes] = useState([]);

  // --- FORMULARIOS ---
  const [form, setForm] = useState({ 
    eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", 
    horaSalida: "", horaLlegada: "",
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true }
  });
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", color: "", cedula: "" });

  // --- CHAT Y SOPORTE ---
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [historialChats, setHistorialChats] = useState([]);
  const [chatSoporte, setChatSoporte] = useState([]);
  const [mensajeSoporte, setMensajeSoporte] = useState("");

  // --- REPUTACIÓN Y RESEÑAS ---
  const [modalResena, setModalResena] = useState({ visible: false, idSolicitud: null, evaluadoId: null, nombreEvaluado: "" });
  const [calificacion, setCalificacion] = useState(5);
  const [textoResena, setTextoResena] = useState("");

  /**
   * --- EFECTO: CARGA DE DATOS MAESTROS ---
   * Escuchamos en tiempo real todos los cambios del ecosistema.
   */
  useEffect(() => {
    if (!user) return;

    // 1. Cargar Búsquedas Recientes (Módulo 10)
    const stored = JSON.parse(localStorage.getItem("DLC_SEARCHES") || "[]");
    setBusquedasRecientes(stored);

    // 2. Perfil de Usuario
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setUserData(d);
        setPerfilForm({
          marca: d.vehiculo?.marca || "", modelo: d.vehiculo?.modelo || "",
          placa: d.vehiculo?.placa || "", color: d.vehiculo?.color || "", cedula: d.cedula || ""
        });
      }
    });

    // 3. Viajes Globales
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Viaje Activo (Seguimiento fase a fase)
    const unsubActivo = onSnapshot(query(collection(db, "Solicitudes")), (snap) => {
      const actual = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .find(s => (s.idPasajero === user.uid || s.idChofer === user.uid) && s.estado !== "completado" && s.estado !== "rechazado");
      setViajeActivo(actual || null);
    });

    return () => { unsubUser(); unsubViajes(); unsubActivo(); };
  }, [user]);

  /**
   * --- LOGICA DE COMISIÓN (MÓDULO 11/13) ---
   * Calcula cuánto recibe el chofer basado en su nivel de KYC.
   */
  const calcularMontoFinal = (precio) => {
    const tieneKYC = userData?.cedula && userData?.vehiculo?.placa;
    const porcentaje = tieneKYC ? 1.00 : 0.90; // 10% de comisión si no es de confianza.
    return {
      monto: (precio * porcentaje).toFixed(2),
      ahorro: (precio * (1 - porcentaje)).toFixed(2),
      verificado: tieneKYC
    };
  };

  const publicarRuta = async () => {
    if (!userData?.cedula) return alert("❌ Por seguridad, debes verificar tu Cédula en el Perfil antes de publicar.");
    if (!form.cO || !form.cD || !form.precio) return alert("Completa los campos de ruta y precio.");
    
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form,
        conductor: userData.nombre,
        idCreador: user.uid,
        rating: userData.rating || 5.0,
        viajesTotales: userData.viajesCompletados || 0,
        fecha: serverTimestamp(),
        vehiculoInfo: { ...userData.vehiculo }
      });
      alert("🚀 ¡Ruta publicada! Dame la cola te avisará cuando alguien se interese.");
      setVista("inicio");
    } catch (e) { console.error(e); }
  };
    // --- RENDERIZADO FINAL ---
  if (!userData) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-white font-black italic animate-pulse tracking-widest uppercase text-xs">Dame la cola...</p>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans border-x shadow-2xl">
      
      {/* HEADER DINÁMICO */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 transform -rotate-6">
            <Car size={24} fill="white"/>
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5 italic">Dame la cola</p>
            <p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p>
          </div>
        </div>
        <div onClick={() => setVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-xl hover:scale-105 transition-transform">
           <Wallet size={16} className="text-blue-400" />
           <span className="font-black italic text-sm">${userData.saldo?.toFixed(2) || "0.00"}</span>
        </div>
      </header>

      {/* CONTENIDO SCROLLABLE */}
      <main className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
        
        {vista === "inicio" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* SWITCHER DE MODO */}
            <div className="flex p-1.5 bg-slate-200 rounded-[25px] border shadow-inner">
               <button onClick={() => setModo("pasajero")} className={`flex-1 py-3 rounded-[20px] font-black uppercase italic text-[10px] transition-all ${modo === "pasajero" ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Buscar Cola</button>
               <button onClick={() => setModo("chofer")} className={`flex-1 py-3 rounded-[20px] font-black uppercase italic text-[10px] transition-all ${modo === "chofer" ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Publicar Viaje</button>
            </div>

            {/* MÓDULO 13: BANNER DE GAMIFICACIÓN (En el Home para visibilidad) */}
            <KYCProgressBar userData={userData} />

            {modo === "chofer" ? (
              <div className="space-y-4 animate-in slide-in-from-right">
                <div className="bg-white p-7 rounded-[40px] border-2 border-blue-50 shadow-xl space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-blue-600 rounded-full" />
                    <h3 className="text-xs font-black uppercase text-slate-800 italic">Nueva Ruta de Viaje</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-black" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-black" value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-black" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-black" value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Clock size={14} className="absolute left-4 top-4 text-blue-500"/>
                        <input type="time" className="w-full bg-slate-50 p-4 pl-10 rounded-2xl border text-xs font-black" value={form.horaSalida} onChange={(e)=>setForm({...form, horaSalida: e.target.value})} />
                      </div>
                      <div className="relative">
                        <CreditCard size={14} className="absolute left-4 top-4 text-green-500"/>
                        <input type="number" placeholder="Precio $" className="w-full bg-slate-50 p-4 pl-10 rounded-2xl border text-xs font-black" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <button onClick={publicarRuta} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-2xl shadow-blue-200 active:scale-95 transition-all">
                    Lanzar Ruta al Mapa
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-left">
                 {/* LISTADO DE VIAJES */}
                 {viajes.length === 0 ? (
                    <div className="p-10 text-center space-y-4">
                       <MapIcon size={48} className="mx-auto text-slate-200" />
                       <p className="text-slate-400 font-bold italic text-sm italic uppercase tracking-tighter">Buscando colas en tu zona...</p>
                    </div>
                 ) : (
                    viajes.map(v => (
                       <CardViajeOptimizada 
                         key={v.id} 
                         viaje={v} 
                         estatusChofer="Oro" 
                         onClickDetalle={() => setViajeSeleccionado(v)}
                       />
                    ))
                 )}
              </div>
            )}
          </div>
        )}

        {/* ... AQUÍ CONTINUARÍAN LAS VISTAS DE PERFIL, CHAT Y EN_VIAJE ... */}

      </main>

      {/* BARRA DE NAVEGACIÓN (MÓDULO 10) */}
      <nav className="p-4 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50 rounded-t-[35px]">
        {[
          { id: 'inicio', icon: <Search size={22}/>, label: "Explorar" },
          { id: 'mis_viajes', icon: <MapIcon size={22}/>, label: "Mis Colas" },
          { id: 'inbox', icon: <MessageSquare size={22}/>, label: "Mensajes" },
          { id: 'perfil', icon: <User size={22}/>, label: "Perfil" }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setVista(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${vista === item.id ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
          >
            {item.icon}
            <span className="text-[8px] font-black uppercase italic tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
