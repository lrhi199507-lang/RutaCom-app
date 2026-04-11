import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where, getDocs
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, Trash2, MessageCircle, CreditCard, Users, 
  ChevronLeft, MapPin, Bell, Edit2, AlertTriangle, Star, X,
  Map as MapIcon, Flag, Info, Clock, ArrowRight, Share2, Key, Lock, Trophy,
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase, Zap, Palette,
  PlusCircle, History
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
               <span className="text-[9px] font-black text-amber-600 uppercase mt-2 bg-amber-100 px-3 py-1 rounded-lg animate-pulse border border-amber-200">¡Último puesto!</span>
            ) : (
               <span className="text-[9px] font-bold text-green-600 uppercase mt-2 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{viaje.puestos} disponibles</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="relative" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm cursor-pointer group-hover:scale-105 transition-transform">
              <User size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <ShieldCheck size={16} className="text-blue-600 fill-blue-50" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-black italic uppercase text-sm text-slate-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); onClickPerfil(); }}>
                {viaje.conductor}
              </h4>
              {(estatusChofer === "Oro" || estatusChofer === "Diamante" || estatusChofer === "Leyenda") && (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  <Star size={8} className="fill-amber-600"/>
                  <span className="text-[7px] font-black uppercase">Super Driver</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center text-slate-700">
                <Star size={10} className="fill-amber-500 text-amber-500" />
                <span className="text-[10px] font-black ml-0.5">{viaje.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{estatusChofer}</span>
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
          <button onClick={onClickDetalle} className="flex-1 py-3 rounded-2xl bg-slate-50 text-slate-500 font-black uppercase italic text-[9px] hover:bg-slate-100 transition-colors pointer-events-auto">
            Ver Viaje
          </button>
          <button onClick={onClickPedir} className="flex-[2] py-3 rounded-2xl bg-slate-900 text-white font-black uppercase italic text-[9px] shadow-md hover:bg-blue-600 transition-all active:scale-95 pointer-events-auto">
            Reservar ahora
          </button>
        </div>
      )}
    </div>
  );
};
// --- MÓDULO 13: GAMIFICACIÓN KYC (NUEVO) ---
const KYCProgressBar = ({ userData }) => {
  const hitos = [
    { id: 1, label: 'Foto Real', cumplido: !!userData?.fotoUrl },
    { id: 2, label: 'Teléfono', cumplido: !!userData?.telefonoVerificado },
    { id: 3, label: 'Email', cumplido: !!userData?.emailVerificado },
    { id: 4, label: 'Cédula (KYC)', cumplido: !!userData?.cedula },
    { id: 5, label: 'Vehículo', cumplido: !!userData?.vehiculo?.placa },
    { id: 6, label: 'Biografía', cumplido: !!userData?.bio && userData?.bio.length > 10 }
  ];

  const completados = hitos.filter(h => h.cumplido).length;
  const porcentaje = (completados / hitos.length) * 100;

  return (
    <div className="bg-white p-5 rounded-[30px] border shadow-sm space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest leading-none">Nivel de Confianza</p>
          <p className="text-xl font-black italic text-slate-800">{completados} de {hitos.length} completados</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{Math.round(porcentaje)}%</span>
        </div>
      </div>

      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1 border">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-2">
        {hitos.map(h => (
          <div key={h.id} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[7px] font-black uppercase italic transition-all ${h.cumplido ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
            {h.cumplido ? <CheckCircle size={8} className="fill-green-600 text-white"/> : <div className="w-2 h-2 rounded-full border border-slate-200"/>}
            <span className="truncate">{h.label}</span>
          </div>
        ))}
      </div>
      
      {porcentaje < 100 && (
        <p className="text-[8px] font-bold text-slate-400 italic text-center pt-1">Completa tu perfil para ser "Chofer de Confianza" y evitar comisiones.</p>
      )}
    </div>
  );
};


// --- COMPONENTES DE APOYO ---
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

const SenalesConfianza = ({ data }) => {
  const items = [
    { icon: <FileText size={12}/>, label: "Cédula", verificado: data?.cedula },
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
// --- MÓDULO 6: GAMIFICACIÓN Y ONBOARDING VISUAL ---
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
  if (viajesActuales >= 80) { metaViajes = viajesActuales; proxEstatus = "Leyenda"; }
  const faltan = metaViajes > viajesActuales ? metaViajes - viajesActuales : 0;

  return (
    <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4 relative overflow-hidden mt-4">
      <div className="absolute top-[-10px] right-[-10px] opacity-[0.03] pointer-events-none"><Trophy size={100} /></div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
           <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1"><Zap size={14}/> Sube de Nivel</p>
           <div className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">Próximo: {proxEstatus}</div>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
           <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-1000" style={{width: `${metaViajes === viajesActuales ? 100 : Math.min((viajesActuales/metaViajes)*100, 100)}%`}}></div>
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-1 text-right">Faltan {faltan} viajes para {proxEstatus}</p>
      </div>

      <div className="h-px w-full bg-slate-100 my-1"></div>

      <div>
        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-3 flex justify-between items-center">
           Misiones de Confianza <span className="text-slate-400">{completadas}/{misiones.length}</span>
        </p>
        <div className="space-y-2">
           {misiones.map(m => (
              <div key={m.id} className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${m.completado ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                 <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${m.completado ? 'bg-green-200 text-green-700' : 'bg-slate-200 text-slate-400'}`}>{m.icono}</div>
                    <span className={`text-[10px] font-black uppercase italic ${m.completado ? 'text-green-700' : 'text-slate-500'}`}>{m.label}</span>
                 </div>
                 {m.completado ? (
                    <CheckCircle size={14} className="text-green-500"/>
                 ) : (
                    <button onClick={onAbrirConfig} className="text-[8px] font-black uppercase italic bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md active:scale-95">Completar</button>
                 )}
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
  const [pasajerosViaje, setPasajerosViaje] = useState([]); 
  const [configOpen, setConfigOpen] = useState(false);

  // Estados de Chat e Inbox
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [historialChats, setHistorialChats] = useState([]); 

  // Perfil Público y MÓDULO 9 (Reseñas)
  const [perfilPublico, setPerfilPublico] = useState(null);
  const [modalResena, setModalResena] = useState({ visible: false, idSolicitud: null, evaluadoId: null, nombreEvaluado: "" });
  const [calificacion, setCalificacion] = useState(5);
  const [textoResena, setTextoResena] = useState("");
  const [opinionesPerfil, setOpinionesPerfil] = useState([]); 
  const [modalOpinionesVisible, setModalOpinionesVisible] = useState(false);

  // Estados de Viajes y Edición
  const [form, setForm] = useState({ 
    eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "",
    horaSalida: "", horaLlegada: "",
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true }
  });
  const [viajeEditando, setViajeEditando] = useState(null); 

  // Filtros y MÓDULO 10 (Búsquedas Recientes)
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");
  const [busquedasRecientes, setBusquedasRecientes] = useState([]);

  // Config Perfil (Se añade COLOR - MÓDULO 8)
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", color: "", cedula: "" });
  
  // Soporte
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  // Modal Cancelación
  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const motivosOpciones = ["Ya no quiero viajar", "Conseguí otra cola", "Surgió un imprevisto", "Cambiaré de ruta o fecha"];

  // MÓDULO 2: CHECKLIST
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [checkSeguridad, setCheckSeguridad] = useState({ placaOk: false, modeloOk: false, conductorOk: false });

  // VIAJE ACTIVO Y GPS
  const [viajeActivo, setViajeActivo] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [pinIngresado, setPinIngresado] = useState("");

  // LÓGICA REPUTACIÓN
  const calcularEstatus = (viajesCompletados = 0, calificacion = 0) => {
    if (viajesCompletados >= 80 && calificacion >= 4.9) return "Diamante";
    if (viajesCompletados >= 30 && calificacion >= 4.7) return "Oro";
    if (viajesCompletados >= 10 && calificacion >= 4.5) return "Plata";
    return "Bronce";
  };
  // EFECTOS FIREBASE
  useEffect(() => {
    if (!user) return;

    // Cargar búsquedas recientes del LocalStorage (MÓDULO 10)
    const savedSearches = JSON.parse(localStorage.getItem("busquedasRecientesDLC") || "[]");
    setBusquedasRecientes(savedSearches);

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
      const actual = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .find(s => (s.idPasajero === user.uid || s.idChofer === user.uid) && s.estado !== "completado" && s.estado !== "rechazado");
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

    const revisarResenasAutomaticas = async () => {
      const q = query(collection(db, "Solicitudes"), where("estado", "==", "completado"), where("idPasajero", "==", user.uid));
      const snap = await getDocs(q);
      snap.forEach(async (docSnap) => {
         const data = docSnap.data();
         const diasPasados = data.fechaFinalizacion ? (Date.now() - data.fechaFinalizacion.toMillis()) / (1000 * 60 * 60 * 24) : 0;
         if (diasPasados > 3 && !data.resenaGenerada) {
            await addDoc(collection(db, "Opiniones"), {
               evaluadoId: data.idChofer,
               evaluadorId: "sistema_auto",
               estrellas: 5,
               comentario: "El viaje se completó sin problemas. (Reseña Automática)",
               fecha: serverTimestamp(),
               viajeId: docSnap.id
            });
            await updateDoc(doc(db, "Solicitudes", docSnap.id), { resenaGenerada: true });
         }
      });
    };
    revisarResenasAutomaticas();

    return () => { 
      unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); 
      unsubR(); unsubE(); unsubSoporte(); unsubViajeActivo();
    };
  }, [user]);

  // MÓDULO 10: Efecto para Guardar Búsquedas Recientes automáticamente
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

  // Chat
  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      setMensajesChat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubMsg();
  }, [chatActivo]);

  // MÓDULO 8: Escuchar pasajeros confirmados de un viaje en detalle
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

  // MÓDULO 9: Cargar opiniones cuando se abre el perfil público
  useEffect(() => {
    if (!perfilPublico) return;
    const q = query(collection(db, "Opiniones"), where("evaluadoId", "==", perfilPublico.id), orderBy("fecha", "desc"));
    const unsubOps = onSnapshot(q, (snap) => {
       setOpinionesPerfil(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubOps();
  }, [perfilPublico]);

  // --- LÓGICA DE FLUJO ---
  
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
    if (!userData?.cedula) return alert("🚫 Debes verificar tu identidad (KYC) para publicar rutas.");
    if (!form.cO || !form.cD || !form.precio || !form.horaSalida || !form.horaLlegada) return alert("Completa los campos obligatorios, incluyendo horas.");
    try {
      const dataViaje = { 
        ...form, 
        precio: Number(form.precio), 
        puestos: Number(form.puestos),
        viajesTotales: userData.viajesCompletados || 0,
        rating: userData.rating || 5.0,
        cancelaciones: userData.cancelaciones || 0,
        vehiculoInfo: { marca: userData.vehiculo?.marca || "", modelo: userData.vehiculo?.modelo || "", placa: userData.vehiculo?.placa || "", color: userData.vehiculo?.color || "" }
      };
      if (viajeEditando) {
         await updateDoc(doc(db, "Viajes", viajeEditando), dataViaje);
         setViajeEditando(null);
      } else {
         await addDoc(collection(db, "Viajes"), { ...dataViaje, conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp() });
      }
      setForm({ 
        eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "",
        horaSalida: "", horaLlegada: "",
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
        ruta: `${viaje.cO} → ${viaje.cD}`, estado: "pendiente", fase: "solicitado", 
        fechaSolicitud: serverTimestamp(),
        precioViaje: viaje.precio, pagoEstado: "pendiente",
        vehiculoInfo: viaje.vehiculoInfo,
        preferenciasViaje: viaje.preferencias || null
      });
      alert("✅ ¡Cola pedida! Espera la aprobación del chofer.");
    } catch (e) { alert("Error al pedir cola."); }
  };

  const confirmarViajeChofer = async (idSolicitud) => {
    try {
      await updateDoc(doc(db, "Solicitudes", idSolicitud), { 
        estado: "confirmado", 
        fase: "chofer_en_camino", 
        fechaConfirmacion: serverTimestamp() 
      });
      alert("✅ Has aceptado al pasajero. El sistema monitorea el encuentro.");
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
      alert("✅ PIN Correcto. ¡Fondos RETENIDOS! Inicia el trayecto con seguridad.");
      setPinIngresado("");
    } else {
      alert("❌ PIN Incorrecto. Pídele el código al pasajero.");
    }
  };

  const finalizarViaje = async (rol) => {
    if(!viajeActivo) return;
    
    if(rol === "chofer" && user.uid !== viajeActivo.idChofer) return alert("Acción no autorizada.");
    if(rol === "pasajero" && user.uid !== viajeActivo.idPasajero) return alert("Acción no autorizada.");

    try {
      const actualizacion = {};
      if (rol === "chofer") actualizacion.finalizadoChofer = true;
      if (rol === "pasajero") actualizacion.finalizadoPasajero = true;

      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), actualizacion);

      if ((rol === "chofer" && viajeActivo.finalizadoPasajero) || (rol === "pasajero" && viajeActivo.finalizadoChofer)) {
        
        // --- MÓDULO 11: INCENTIVOS PARA EL KYC (Cálculo de Comisión) ---
        const tieneKYC = userData?.cedula && userData?.vehiculo?.placa;
        const porcentajeComision = tieneKYC ? 1.00 : 0.95; // 0% comisión si verificó datos, 5% si no.
        const montoFinal = viajeActivo.precioViaje * porcentajeComision;
        // ---------------------------------------------------------------

        await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { 
          fase: "finalizado", 
          estado: "completado",
          pagoEstado: "completado",
          montoNetoChofer: montoFinal,
          fechaFinalizacion: serverTimestamp()
        });
        alert(`🏁 ¡Cola Completada con éxito! Fondos liberados. (${tieneKYC ? 'Ganaste el 100% por ser Chofer de Confianza' : 'Se retuvo 5% de comisión'})`);
        
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
    } catch (e) { console.error(e); }
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
        vehiculo: { marca: perfilForm.marca, modelo: perfilForm.modelo, placa: perfilForm.placa.toUpperCase(), color: perfilForm.color },
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
      
      {/* MODAL MÓDULO 9: DEJAR RESEÑA */}
      {modalResena.visible && (
        <div className="absolute inset-0 bg-slate-900/95 z-[300] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in duration-300">
           <div className="bg-white rounded-[40px] p-8 w-full shadow-2xl space-y-5 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                 <Star size={32} className="fill-blue-600"/>
              </div>
              <h3 className="font-black italic uppercase text-2xl text-slate-800 leading-tight">Califica a {modalResena.nombreEvaluado}</h3>
              <p className="text-[10px] font-black uppercase text-slate-400">Tu opinión construye nuestra reputación</p>
              
              <div className="flex justify-center gap-2 my-4">
                 {[1,2,3,4,5].map(star => (
                   <button key={star} onClick={() => setCalificacion(star)} className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                      <Star size={36} className={`${calificacion >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                   </button>
                 ))}
              </div>
              
              <textarea 
                 value={textoResena} onChange={(e) => setTextoResena(e.target.value)}
                 placeholder="¿Cómo estuvo la cola? Deja un comentario corto..."
                 className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 text-xs font-bold outline-none focus:border-blue-600 resize-none h-24"
              ></textarea>

              <button onClick={enviarResena} className="w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg bg-blue-600 text-white transition-all active:scale-95">
                 Publicar Reseña
              </button>
              <button onClick={() => setModalResena({visible: false})} className="text-[10px] font-black uppercase text-slate-400 mt-2 hover:text-slate-600">Omitir por ahora</button>
           </div>
        </div>
      )}

      {/* MODAL MÓDULO 9: DESGLOSE DE OPINIONES */}
      {modalOpinionesVisible && (
        <div className="absolute inset-0 bg-slate-900/95 z-[200] flex flex-col p-6 backdrop-blur-md animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center mb-6 pt-10">
              <h3 className="font-black italic uppercase text-2xl text-white">Desglose de Puntuaciones</h3>
              <button onClick={() => setModalOpinionesVisible(false)} className="text-slate-400 bg-white/10 p-2 rounded-full"><X size={20}/></button>
           </div>
           
           <div className="bg-white rounded-[40px] p-8 w-full shadow-2xl flex-1 overflow-y-auto space-y-6">
              <div className="flex items-center gap-6 border-b pb-6">
                 <div className="text-center">
                    <p className="text-5xl font-black italic text-slate-800">{perfilPublico?.rating || "5.0"}</p>
                    <div className="flex items-center justify-center text-amber-400 fill-amber-400 mt-1"><Star size={16} className="fill-amber-400"/></div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{opinionesPerfil.length} Opiniones</p>
                 </div>
                 <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map(nivel => {
                       const count = opinionesPerfil.filter(o => o.estrellas === nivel).length;
                       const percent = opinionesPerfil.length ? (count / opinionesPerfil.length) * 100 : 0;
                       return (
                          <div key={nivel} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                             <span className="w-2">{nivel}</span>
                             <Star size={10} className="fill-slate-300 text-slate-300"/>
                             <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${nivel >= 4 ? 'bg-green-500' : nivel === 3 ? 'bg-amber-400' : 'bg-red-500'}`} style={{width: `${percent}%`}}></div>
                             </div>
                             <span className="w-4 text-right">{count}</span>
                          </div>
                       )
                    })}
                 </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Reseñas Recientes</p>
                 {opinionesPerfil.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 italic text-center py-4">No hay reseñas aún.</p>
                 ) : (
                    opinionesPerfil.map(op => (
                       <div key={op.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-[11px] font-black italic uppercase text-slate-800">{op.evaluadorNombre || "Usuario Anónimo"} {op.evaluadorId === "sistema_auto" && <span className="text-blue-500 ml-1 text-[8px] bg-blue-50 px-1 rounded">Auto</span>}</span>
                             <div className="flex text-amber-400">
                                {[...Array(op.estrellas)].map((_, i) => <Star key={i} size={10} className="fill-amber-400"/>)}
                             </div>
                          </div>
                          <p className="text-xs font-bold text-slate-600">{op.comentario}</p>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* MODAL CHECKLIST (MÓDULO 2) */}
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

              <button 
                disabled={!(checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk)}
                onClick={() => { setMostrarChecklist(false); pasajeroConfirmaEncuentro(); }}
                className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg transition-all ${checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk ? 'bg-blue-600 text-white opacity-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
              >
                 Confirmar y Ver PIN
              </button>
           </div>
        </div>
      )}

      {/* MODAL PERFIL PÚBLICO */}
      {perfilPublico && !modalOpinionesVisible && (
        <div className="absolute inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-[40px] p-8 w-full max-w-xs shadow-2xl relative text-center">
              <button onClick={() => setPerfilPublico(null)} className="absolute top-4 right-4 text-slate-300"><X size={24}/></button>
              <div className="relative mb-4 inline-block">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-inner">
                  <User size={48} className="text-blue-600"/>
                </div>
                <div className="absolute -bottom-2 right-0">
                  <BadgeEstatus nivel={perfilPublico.estatus || "Bronce"} />
                </div>
              </div>
              <h3 className="font-black italic uppercase text-2xl text-slate-800">{perfilPublico.nombre}</h3>
              <SenalesConfianza data={perfilPublico} />
              <div className="flex gap-2 mt-6 w-full">
                 <div onClick={() => setModalOpinionesVisible(true)} className="flex-1 bg-slate-50 p-4 rounded-3xl border cursor-pointer hover:bg-blue-50 transition-colors group">
                    <Star size={20} className="text-amber-500 fill-amber-500 mx-auto mb-1 group-hover:scale-110 transition-transform"/>
                    <p className="text-[10px] font-black uppercase text-blue-600 leading-none mb-1 opacity-0 group-hover:opacity-100 transition-opacity">Ver Reseñas</p>
                    <p className="text-xl font-black italic text-slate-800">{perfilPublico.rating || "5.0"}</p>
                 </div>
                 <div className="flex-1 bg-slate-50 p-4 rounded-3xl border">
                    <ShieldAlert size={20} className="text-red-400 mx-auto mb-1"/>
                    <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Cancelaciones</p>
                    <p className="text-xl font-black italic text-slate-800">{perfilPublico.cancelaciones || "0"}</p>
                 </div>
              </div>
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
           {viajeActivo && (
             <button onClick={() => setVista("en_viaje")} className="bg-green-500 text-white p-2 rounded-xl animate-pulse shadow-md"><MapIcon size={18}/></button>
           )}
           <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl active:scale-95">
             <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
           </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {vista === "inicio" && !viajeSeleccionado && (
           <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                ESTÁS EN MODO {modo === "pasajero" ? "PASAJERO" : "CHÓFER"} (CAMBIAR) ➔
              </button>

              {/* MÓDULO 11: INCENTIVOS PARA EL KYC (BANNER INTELIGENTE) */}
              {(!userData?.cedula || !userData?.vehiculo?.placa) ? (
                 <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-[30px] shadow-lg shadow-blue-200 flex items-center justify-between text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 pointer-events-none"><ShieldCheck size={80}/></div>
                    <div className="relative z-10 w-[70%]">
                       <div className="flex items-center gap-1 mb-1"><Zap size={10} className="text-amber-400 fill-amber-400"/><p className="text-[8px] font-black uppercase tracking-widest text-blue-200">Recompensa KYC</p></div>
                       <p className="text-xs font-black italic leading-tight">Verifica tu perfil (Cédula y Vehículo) y obtén tu próximo viaje sin comisión.</p>
                    </div>
                    <button onClick={() => { cambiarVista("perfil"); setTimeout(() => setConfigOpen(true), 300); }} className="relative z-10 bg-white text-indigo-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase shadow-md active:scale-95 transition-transform">Verificar</button>
                 </div>
              ) : (
                 <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-[30px] shadow-lg shadow-green-200 flex items-center justify-between text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 pointer-events-none"><CheckCircle size={80}/></div>
                    <div className="relative z-10 w-[70%]">
                       <div className="flex items-center gap-1 mb-1"><Star size={10} className="text-amber-300 fill-amber-300"/><p className="text-[8px] font-black uppercase tracking-widest text-emerald-100">Beneficio Activo</p></div>
                       <p className="text-xs font-black italic leading-tight">¡Eres Chofer de Confianza! Disfrutas de 0% de retención en tus viajes.</p>
                    </div>
                    <div className="relative z-10 bg-white/20 px-3 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm">Activado</div>
                 </div>
              )}

              {modo === "chofer" && (
                <div className="space-y-6 animate-in slide-in-from-right">
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

                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-3.5 text-slate-400"/>
                        <input type="time" title="Hora de Salida" className="w-full bg-slate-50 p-3 pl-8 rounded-xl border text-[10px] font-bold text-slate-600" value={form.horaSalida} onChange={(e)=>setForm({...form, horaSalida: e.target.value})} required/>
                      </div>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-3.5 text-slate-400"/>
                        <input type="time" title="Hora Estimada de Llegada" className="w-full bg-slate-50 p-3 pl-8 rounded-xl border text-[10px] font-bold text-slate-600" value={form.horaLlegada} onChange={(e)=>setForm({...form, horaLlegada: e.target.value})} required/>
                      </div>
                    </div>

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
                      <div className="relative"><Users size={14} className="absolute left-3 top-3.5 text-slate-400"/><input type="number" placeholder="Asientos" className="w-full bg-slate-50 p-3 pl-8 rounded-xl border text-xs font-bold" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} /></div>
                      <div className="relative"><CreditCard size={14} className="absolute left-3 top-3.5 text-blue-500"/><input type="number" placeholder="Precio $" className="w-full bg-slate-50 p-3 pl-8 rounded-xl border text-xs font-black text-blue-600" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} /></div>
                    </div>
                    <button onClick={publicarOEditarRuta} className={`w-full py-4 text-white rounded-2xl font-black uppercase italic shadow-lg ${viajeEditando ? 'bg-yellow-500' : 'bg-blue-600'}`}>{viajeEditando ? "Actualizar" : "Publicar"}</button>
                  </div>
                </div>
              )}

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

              {/* LISTA DE VIAJES */}
              {modo === "pasajero" && (
                <div className="space-y-5">
                   {viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD)).map(v => (
                      <CardViajeOptimizada 
                        key={v.id}
                        viaje={v}
                        estatusChofer={calcularEstatus(v.viajesTotales || 0, v.rating || 0)}
                        onClickDetalle={() => setViajeSeleccionado(v)}
                        onClickPedir={() => enviarSolicitudDirecta(v)}
                        onClickPerfil={() => setPerfilPublico({
                          nombre: v.conductor, id: v.idCreador, 
                          estatus: calcularEstatus(v.viajesTotales, v.rating), 
                          rating: v.rating, viajesTotales: v.viajesTotales, 
                          kycVerificado: true, vehiculo: v.vehiculoInfo, 
                          fotoVerificada: true, cancelaciones: v.cancelaciones, 
                          preferencias: v.preferencias
                        })}
                      />
                   ))}
                </div>
              )}
           </div>
        )}
        
        {/* VISTA PERFIL CON MÓDULO 13 */}
        {vista === "perfil" && (
          <div className="space-y-4 animate-in fade-in pb-10">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative">
               <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={22}/></button>
               <div className="relative mb-4">
                  <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                    {userData.fotoUrl ? <img src={userData.fotoUrl} className="w-full h-full object-cover" /> : <User size={56} className="text-slate-400" />}
                  </div>
                  <div className="absolute -bottom-2 -right-2"><BadgeEstatus nivel={calcularEstatus(userData.viajesCompletados || 0, userData.rating || 0)} /></div>
               </div>
               <h2 className="font-black italic text-2xl text-slate-800 uppercase">{userData.nombre}</h2>
            </div>

            {/* BARRA DE PROGRESO KYC (Módulo 13) */}
            <KYCProgressBar userData={userData} />

            {configOpen && (
              <div className="bg-white p-6 rounded-[35px] border shadow-2xl space-y-3">
                <p className="text-[10px] font-black uppercase text-blue-600 italic px-2">Identidad y Bio</p>
                <input type="text" placeholder="Cédula" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                <textarea placeholder="Cuéntanos un poco de ti (Mini-bio)..." className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold h-20 resize-none" value={perfilForm.bio} onChange={(e)=>setPerfilForm({...perfilForm, bio: e.target.value})} />
                <p className="text-[10px] font-black uppercase text-blue-600 italic px-2 pt-2">Vehículo</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Placa" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-black" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                  <input type="text" placeholder="Color" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-black" value={perfilForm.color} onChange={(e)=>setPerfilForm({...perfilForm, color: e.target.value})} />
                </div>
                <button onClick={guardarDatosPerfil} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition-all mt-2">Actualizar Credenciales</button>
              </div>
            )}
            <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3 italic bg-white rounded-[30px] border shadow-sm mt-4"><LogOut size={20} /> Salir</button>
          </div>
        )}
      </main>
        {/* --- VISTA MÓDULO 5: FLUJO ACTIVO --- */}
        {vista === "en_viaje" && viajeActivo && (
          <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-bottom duration-500">
             <div className="bg-blue-600 p-3 rounded-2xl flex items-center justify-between shadow-lg mx-1">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={16} className="text-white"/>
                   <span className="text-[9px] font-black text-white uppercase italic">Protocolo de Retención Activo</span>
                </div>
                <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase animate-pulse border-2 border-red-400">S.O.S</button>
             </div>

             <div className="bg-white p-4 rounded-[30px] shadow-sm border flex justify-between items-center">
                <button onClick={() => setVista("inicio")} className="text-slate-400"><ChevronLeft/></button>
                <div className="text-center">
                   <p className="text-[8px] font-black uppercase text-blue-600 leading-none">Trayecto Actual</p>
                   <p className="text-[11px] font-black italic">{viajeActivo.ruta}</p>
                </div>
                <button onClick={() => setModalCancelacion({visible: true, idSolicitud: viajeActivo.id})} className="text-red-500"><AlertTriangle size={20}/></button>
             </div>

             {/* INDICADOR DE FASES MÓDULO 5 */}
             <PasosProgreso fase={viajeActivo.fase} />

             <div className="flex-1 bg-slate-200 rounded-[40px] border-4 border-white shadow-2xl relative overflow-hidden">
                {viajeActivo.latChofer && (
                   <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={`https://www.openstreetmap.org/export/embed.html?bbox=${viajeActivo.lngChofer-0.005},${viajeActivo.latChofer-0.005},${viajeActivo.lngChofer+0.005},${viajeActivo.latChofer+0.005}&layer=mapnik&marker=${viajeActivo.latChofer},${viajeActivo.lngChofer}`} className="w-full h-full opacity-90 pointer-events-none"></iframe>
                )}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Car size={24}/></div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Vehículo Validado</p>
                      <p className="text-[11px] font-black italic uppercase text-slate-800">{viajeActivo.vehiculoInfo?.marca} {viajeActivo.vehiculoInfo?.modelo}</p>
                      <div className="flex gap-2 items-center mt-1">
                         <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100">{viajeActivo.vehiculoInfo?.placa}</p>
                         {viajeActivo.vehiculoInfo?.color && <p className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 border"><Palette size={10}/> {viajeActivo.vehiculoInfo.color}</p>}
                      </div>
                   </div>
                </div>
                {viajeActivo.idPasajero === user.uid && viajeActivo.pinVerificacion && viajeActivo.fase === "pasajero_confirmado_encuentro" && (
                   <div className="absolute top-6 left-6 right-6 bg-blue-600 p-4 rounded-2xl text-white text-center shadow-xl z-20 animate-bounce">
                      <p className="text-[10px] font-black uppercase">PIN de Encuentro (Módulo 5):</p>
                      <p className="text-3xl font-black tracking-[10px]">{viajeActivo.pinVerificacion}</p>
                   </div>
                )}
             </div>

             <div className="bg-white p-6 rounded-[35px] border shadow-lg space-y-3 z-10">
                {user.uid === viajeActivo.idChofer ? (
                  <div className="space-y-3">
                    {viajeActivo.fase === "chofer_en_camino" && <button onClick={() => updateDoc(doc(db,"Solicitudes",viajeActivo.id), {fase: "en_punto_de_encuentro"})} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-lg">He llegado al punto</button>}
                    {viajeActivo.fase === "pasajero_confirmado_encuentro" && (
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-blue-600 uppercase italic text-center">Valida el PIN del Pasajero</p>
                         <input type="number" placeholder="0000" className="w-full p-4 bg-slate-100 rounded-2xl text-center text-2xl font-black outline-none border-2 border-transparent focus:border-blue-600" value={pinIngresado} onChange={(e)=>setPinIngresado(e.target.value)} />
                         <button onClick={choferVerificaPIN} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase italic">Validar PIN y Retener Pago</button>
                      </div>
                    )}
                    {viajeActivo.fase === "viajando" && (
                      <button onClick={() => finalizarViaje("chofer")} disabled={viajeActivo.finalizadoChofer} className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 ${viajeActivo.finalizadoChofer ? 'bg-slate-400' : 'bg-slate-900 text-white'}`}>{viajeActivo.finalizadoChofer ? "Esperando Confirmación Pasajero..." : "Marcar Llegada"} <Flag size={18}/></button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viajeActivo.fase === "en_punto_de_encuentro" && <button onClick={() => setMostrarChecklist(true)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95"><ShieldCheck size={18}/> Iniciar Protocolo de Seguridad</button>}
                    {viajeActivo.fase === "viajando" && (
                       <button onClick={() => finalizarViaje("pasajero")} disabled={viajeActivo.finalizadoPasajero} className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg flex items-center justify-center gap-2 ${viajeActivo.finalizadoPasajero ? 'bg-slate-400' : 'bg-blue-600 text-white'}`}>{viajeActivo.finalizadoPasajero ? "Pago en proceso de liberación..." : "Confirmar Llegada al Destino"} <CheckCircle size={18}/></button>
                    )}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* DETALLE VIAJE (INCLUYE MÓDULO 8) */}
        {viajeSeleccionado && vista === "inicio" && (
           <div className="space-y-6 animate-in slide-in-from-right">
              <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic"><ChevronLeft size={16}/> Volver</button>
              <div className="bg-white rounded-[40px] border shadow-2xl p-8 space-y-6">
                 <div className="flex justify-between items-center border-b pb-4">
                    <p className="text-4xl font-black italic text-blue-600 leading-none">${viajeSeleccionado.precio}</p>
                    <BadgeEstatus nivel={calcularEstatus(viajeSeleccionado.viajesTotales, viajeSeleccionado.rating)} />
                 </div>
                 
                 <div className="space-y-6">
                    <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-600"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.cO} → {viajeSeleccionado.cD}</p></div>

                    <div className="bg-slate-50 p-4 rounded-3xl border flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Car size={24}/></div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Vehículo del viaje</p>
                          <p className="text-sm font-black italic uppercase text-slate-800">{viajeSeleccionado.vehiculoInfo?.marca} {viajeSeleccionado.vehiculoInfo?.modelo}</p>
                          <div className="flex gap-2 mt-1">
                             <span className="bg-white border text-slate-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">{viajeSeleccionado.vehiculoInfo?.placa}</span>
                             {viajeSeleccionado.vehiculoInfo?.color && (
                                <span className="bg-white border text-slate-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Palette size={10}/> {viajeSeleccionado.vehiculoInfo?.color}</span>
                             )}
                          </div>
                       </div>
                    </div>

                    <div onClick={() => setPerfilPublico({ nombre: viajeSeleccionado.conductor, id: viajeSeleccionado.idCreador, rating: viajeSeleccionado.rating, viajesTotales: viajeSeleccionado.viajesTotales, estatus: calcularEstatus(viajeSeleccionado.viajesTotales, viajeSeleccionado.rating), kycVerificado: true, vehiculo: viajeSeleccionado.vehiculoInfo, fotoVerificada: true, cancelaciones: viajeSeleccionado.cancelaciones, preferencias: viajeSeleccionado.preferencias })} className="flex items-center gap-3 cursor-pointer group bg-slate-50 p-3 rounded-2xl border">
                       <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center group-hover:bg-blue-50 border shadow-sm transition-colors"><User size={20} className="text-slate-400 group-hover:text-blue-600"/></div>
                       <div>
                          <p className="font-black uppercase text-xs italic underline text-slate-800">{viajeSeleccionado.conductor}</p>
                          <div className="flex items-center gap-1 text-green-600 mt-0.5"><CheckCircle size={10} className="fill-green-600 text-white"/><span className="text-[8px] font-black uppercase italic">Conductor Identificado</span></div>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-[30px] border">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2"><Users size={14}/> Pasajeros Confirmados ({pasajerosViaje.length}/{viajeSeleccionado.puestos + pasajerosViaje.length})</p>
                       {pasajerosViaje.length === 0 ? (
                          <p className="text-xs font-bold text-slate-400 italic text-center py-4">Sé el primero en reservar un puesto.</p>
                       ) : (
                          <div className="space-y-3 mb-3">
                             {pasajerosViaje.map(p => (
                                <div key={p.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border shadow-sm">
                                   <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl flex items-center justify-center border border-white shadow-sm"><User size={20} className="text-blue-500"/></div>
                                   <div className="flex-1">
                                      <p className="font-black uppercase text-xs italic text-slate-800">{p.nombrePasajero}</p>
                                      <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mt-0.5"><MapPin size={10}/> {p.ruta}</p>
                                   </div>
                                   <div className="bg-green-50 text-green-600 px-2 py-1 rounded-lg border border-green-100 flex items-center gap-1">
                                      <CheckCircle size={10} className="fill-green-600 text-white"/> <span className="text-[8px] font-black uppercase">Viaja</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                       <div className="space-y-2">
                         {Array.from({ length: viajeSeleccionado.puestos }).map((_, i) => (
                            <div key={`empty-${i}`} className="flex items-center gap-3 bg-transparent p-3 rounded-2xl border border-dashed border-slate-300 opacity-60">
                               <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center"><User size={20} className="text-slate-400"/></div>
                               <div className="flex-1">
                                  <p className="font-black uppercase text-xs italic text-slate-500">Asiento Disponible</p>
                               </div>
                            </div>
                         ))}
                       </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-[30px] border">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Preferencias</p>
                       <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'ac', icon: <Wind size={14}/>, label: "A/C", active: viajeSeleccionado.preferencias?.ac },
                            { id: 'noFumar', icon: <CigaretteOff size={14}/>, label: "No Fumar", active: viajeSeleccionado.preferencias?.noFumar },
                            { id: 'mascotas', icon: <PawPrint size={14}/>, label: "Mascotas", active: viajeSeleccionado.preferencias?.mascotas },
                            { id: 'conversar', icon: <MessageSquare size={14}/>, label: "Conversación", active: viajeSeleccionado.preferencias?.conversar },
                            { id: 'equipaje', icon: <Briefcase size={14}/>, label: "Espacio Equipaje", active: viajeSeleccionado.preferencias?.equipaje },
                          ].map(item => (
                            <div key={item.id} className={`flex items-center gap-2 p-2 rounded-xl border ${item.active ? 'bg-white border-blue-100 text-blue-600' : 'bg-slate-100/50 border-transparent text-slate-300'}`}>
                               {item.icon} <span className="text-[9px] font-black uppercase italic">{item.label}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                 </div>
                 <div className="flex gap-2 pt-4">
                    <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2 shadow-lg"><MessageCircle size={18}/> Chat</button>
                    <button onClick={() => enviarSolicitudDirecta(viajeSeleccionado)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Pedir Cola</button>
                 </div>
              </div>
           </div>
        )}

        {/* CHAT PRIVADO */}
        {vista === "chat_privado" && chatActivo && (
          <div className="flex flex-col h-full space-y-4 animate-in slide-in-from-right">
            <button onClick={() => setVista("inicio")} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><ChevronLeft size={16}/> Volver</button>
            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase flex items-center justify-center gap-2"><ShieldCheck size={12} className="text-blue-400"/> Chat Seguro: {chatActivo.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-4 rounded-3xl max-w-[80%] text-[11px] font-bold shadow-sm transition-all ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border text-slate-700 self-start rounded-tl-none'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrivado()} className="flex-1 bg-slate-100 p-3 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
               </div>
            </div>
          </div>
        )}

        {/* MÓDULO 12: EMPTY STATE PARA TUS VIAJES */}
        {vista === "mis_viajes" && (
           <div className="space-y-4 animate-in fade-in h-full flex flex-col">
             <div className="bg-blue-600 p-6 text-white text-center rounded-[30px] shadow-lg relative overflow-hidden shrink-0">
                <MapIcon size={60} className="absolute -right-2 -bottom-2 opacity-10" />
                <p className="font-black italic text-xl uppercase tracking-tighter">Tus Viajes</p>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Historial y Rutas Activas</p>
             </div>
             {misSolicitudes.length === 0 && solicitudesRecibidas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white p-10 rounded-[40px] border border-dashed border-slate-200 text-center shadow-sm my-4">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-slate-100">
                      <MapIcon size={40} className="text-slate-200" />
                   </div>
                   <h3 className="font-black uppercase italic text-slate-800 mb-2">¡Aún no hay rutas!</h3>
                   <p className="text-[11px] text-slate-400 font-bold italic mb-8 max-w-[200px]">Tus próximas colas aparecerán aquí. Empieza a explorar para viajar hoy.</p>
                   <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-[10px] shadow-xl active:scale-95 transition-all flex items-center gap-2">
                      Buscar mi primera cola <ArrowRight size={14}/>
                   </button>
                </div>
             ) : (
                <div className="space-y-3 overflow-y-auto">
                   {misSolicitudes.map(s => (
                     <div key={s.id} className="bg-white p-5 rounded-3xl border shadow-sm border-l-4 border-l-blue-500">
                       <p className="text-xs font-black italic uppercase text-slate-800">{s.ruta}</p>
                       <div className="flex justify-between items-center mt-2">
                          <p className="text-[9px] font-black text-slate-500 flex items-center gap-1"><User size={10}/> {s.nombreChofer}</p>
                          <p className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${s.estado === 'completado' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                             {s.estado}
                          </p>
                       </div>
                     </div>
                   ))}
                   {solicitudesRecibidas.map(s => (
                     <div key={s.id} className="bg-white p-5 rounded-3xl border shadow-sm border-l-4 border-l-amber-500">
                       <p className="text-[9px] font-black uppercase text-amber-500 mb-1">Solicitud Recibida</p>
                       <p className="text-xs font-black italic uppercase text-slate-800">{s.ruta}</p>
                       <p className="text-[9px] font-black text-slate-500 mt-1 flex items-center gap-1"><User size={10}/> {s.nombrePasajero}</p>
                     </div>
                   ))}
                </div>
             )}
           </div>
        )}

        {/* MÓDULO 12: EMPTY STATE PARA MENSAJES */}
        {vista === "inbox" && (
           <div className="space-y-4 animate-in fade-in h-full flex flex-col">
             <div className="bg-slate-900 p-6 text-white text-center rounded-[30px] shadow-lg relative overflow-hidden shrink-0">
                <MessageSquare size={60} className="absolute -left-2 -top-2 opacity-10" />
                <p className="font-black italic text-xl uppercase tracking-tighter">Mensajes</p>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Tu bandeja de entrada</p>
             </div>
             {historialChats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white p-10 rounded-[40px] border border-dashed border-slate-200 text-center shadow-sm my-4">
                   <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 border-2 border-blue-100">
                      <MessageCircle size={40} className="text-blue-200" />
                   </div>
                   <h3 className="font-black uppercase italic text-slate-800 mb-2">Sin chats activos</h3>
                   <p className="text-[11px] text-slate-400 font-bold italic mb-8 max-w-[200px]">Reserva una cola o publica un viaje para contactar con otros usuarios.</p>
                   <div className="flex gap-2">
                      <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] active:scale-95 transition-all">Buscar</button>
                      <button onClick={() => { setVista("inicio"); setModo("chofer"); }} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg active:scale-95 transition-all">Publicar</button>
                   </div>
                </div>
             ) : (
                <div className="space-y-3 overflow-y-auto">
                   {historialChats.map(c => (
                     <div key={c.chatId} onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors"><User size={20} className="text-blue-500 group-hover:text-white"/></div>
                        <div className="flex-1 overflow-hidden">
                           <p className="text-xs font-black italic uppercase text-slate-800">{c.nombreOtro}</p>
                           <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{c.ultimoMensaje}</p>
                        </div>
                        <ChevronLeft size={16} className="text-slate-300 transform rotate-180"/>
                     </div>
                   ))}
                </div>
             )}
           </div>
        )}

        {/* WALLET */}
        {vista === "wallet" && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Wallet</h2>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                 <p className="text-[10px] font-black uppercase opacity-80 mb-2 tracking-widest">Saldo Disponible</p>
                 <p className="text-6xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
                 <div className="absolute top-10 right-10 opacity-20"><Wallet size={80}/></div>
                 <div className="mt-8 flex items-center gap-2 bg-white/10 p-3 rounded-2xl backdrop-blur-sm"><Lock size={14}/><p className="text-[9px] font-black uppercase italic tracking-tighter leading-none">Fondos protegidos por el sistema de retención inteligente.</p></div>
              </div>
           </div>
        )}

        {/* SOPORTE */}
        {vista === "soporte" && (
          <div className="flex flex-col h-full bg-white rounded-[40px] border shadow-lg overflow-hidden animate-in fade-in">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-[10px] uppercase">Soporte Técnico</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                <div className="p-4 bg-white border rounded-3xl self-start text-[11px] font-bold text-slate-700 shadow-sm">👋 ¡Hola {userData.nombre}! Reporta cualquier incidente aquí.</div>
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-3xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.usuarioId === user.uid ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border text-slate-700 self-start rounded-tl-none'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2">
               <input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none" placeholder="Reportar incidente..." />
               <button onClick={async () => { if(!mensajeSoporte.trim()) return; await addDoc(collection(db, "MensajesSoporte"), { usuarioId: user.uid, texto: mensajeSoporte.trim(), fecha: serverTimestamp() }); setMensajeSoporte(""); }} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
             </div>
          </div>
        )}
             {/* PERFIL */}
        {vista === "perfil" && (
           <div className="space-y-4 animate-in fade-in pb-10">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative overflow-hidden">
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={22}/></button>
                 <div className="relative mb-4">
                    <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl relative overflow-hidden"><User size={56} className="text-slate-400" /></div>
                    <div className="absolute -bottom-2 -right-2"><BadgeEstatus nivel={calcularEstatus(userData.viajesCompletados || 0, userData.rating || 0)} /></div>
                 </div>
                 <h2 className="font-black italic text-2xl text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
                 <SenalesConfianza data={userData} />
              </div>

              {/* MÓDULO 6: TRACKER DE PROGRESO */}
              <ProgresoGamificacion userData={userData} onAbrirConfig={() => setConfigOpen(true)} />

              {configOpen && (
                <div className="bg-white p-6 rounded-[35px] border shadow-2xl space-y-3 animate-in slide-in-from-top">
                  <p className="text-[10px] font-black uppercase text-blue-600 italic tracking-widest px-2">Identidad</p>
                  <input type="text" placeholder="Cédula" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                  <p className="text-[10px] font-black uppercase text-blue-600 italic tracking-widest px-2 pt-2">Vehículo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Marca" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.marca} onChange={(e)=>setPerfilForm({...perfilForm, marca: e.target.value})} />
                    <input type="text" placeholder="Modelo" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.modelo} onChange={(e)=>setPerfilForm({...perfilForm, modelo: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Placa" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase outline-none focus:border-blue-600" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                    <input type="text" placeholder="Color" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase outline-none focus:border-blue-600" value={perfilForm.color} onChange={(e)=>setPerfilForm({...perfilForm, color: e.target.value})} />
                  </div>
                  <button onClick={guardarDatosPerfil} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition-all mt-2">Actualizar Credenciales</button>
                </div>
              )}
              <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3 italic tracking-widest bg-white rounded-[30px] border shadow-sm mt-4 active:bg-red-50 transition-colors"><LogOut size={20} /> Salir de la plataforma</button>
           </div>
        )}
      </main>

      {/* MÓDULO 10: BARRA DE NAVEGACIÓN INFERIOR (5 PILARES) */}
      <nav className="p-3 bg-white border-t flex justify-between items-center pb-8 fixed bottom-0 w-full max-w-md shadow-2xl z-50 px-6 rounded-t-3xl">
        <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className={`flex flex-col items-center gap-1 transition-all ${vista === "inicio" && modo === "pasajero" ? "text-blue-600 scale-110" : "text-slate-300"}`}>
           <Search size={24} /><span className="text-[8px] font-black uppercase italic">Buscar</span>
        </button>
        <button onClick={() => { setVista("inicio"); setModo("chofer"); }} className={`flex flex-col items-center gap-1 transition-all ${vista === "inicio" && modo === "chofer" ? "text-blue-600 scale-110" : "text-slate-300"}`}>
           <PlusCircle size={24} /><span className="text-[8px] font-black uppercase italic">Publicar</span>
        </button>
        <button onClick={() => cambiarVista("mis_viajes")} className={`flex flex-col items-center gap-1 transition-all ${vista === "mis_viajes" ? "text-blue-600 scale-110" : "text-slate-300"}`}>
           <MapIcon size={24} /><span className="text-[8px] font-black uppercase italic">Tus Viajes</span>
        </button>
        <button onClick={() => cambiarVista("inbox")} className={`flex flex-col items-center gap-1 transition-all ${vista === "inbox" ? "text-blue-600 scale-110" : "text-slate-300"}`}>
           <MessageSquare size={24} /><span className="text-[8px] font-black uppercase italic">Mensajes</span>
        </button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 transition-all ${vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-300"}`}>
           <User size={24} /><span className="text-[8px] font-black uppercase italic">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
