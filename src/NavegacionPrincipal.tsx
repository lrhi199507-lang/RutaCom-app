import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, getDocs, deleteDoc
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, MessageCircle, CreditCard, Users, 
  ChevronLeft, MapPin, Edit2, AlertTriangle, Star, X,
  Map as MapIcon, Flag, Clock, ArrowRight, Lock, Trophy,
  FileText, Camera, ShieldAlert, Wind, CigaretteOff, PawPrint, MessageSquare, Briefcase, Zap, Palette,
  PlusCircle, History, DollarSign, ChevronRight, LifeBuoy, Crown
} from "lucide-react";

// --- CONSTANTES DE UBICACIÓN ---
const UBICACIONES = {
  "Amazonas": ["Puerto Ayacucho"], 
  "Anzoátegui": ["Barcelona", "Puerto La Cruz"],
  "Apure": ["San Fernando"], 
  "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Barinas": ["Barinas"], 
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego"],
  "Cojedes": ["San Carlos", "Tinaquillo"], 
  "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo"], 
  "Lara": ["Barquisimeto", "Cabudare"],
  "Mérida": ["Mérida", "El Vigía"], 
  "Miranda": ["Los Teques", "Chacao", "Baruta"],
  "Monagas": ["Maturín"], 
  "Nueva Esparta": ["Porlamar"], 
  "Portuguesa": ["Guanare"],
  "Táchira": ["San Cristóbal"], 
  "Trujillo": ["Valera"], 
  "Yaracuy": ["San Felipe"],
  "Zulia": ["Maracaibo", "San Francisco"]
};

const ESTADOS = Object.keys(UBICACIONES).sort();

// --- MÓDULO 13: GAMIFICACIÓN DE LA CONFIANZA (KYC Progress Bar) ---
const KYCProgressBar = ({ userData, onAbrirConfig }) => {
  const hitos = [
    { id: 'foto', label: 'Foto de Perfil', completado: !!userData?.fotoPerfil, icono: <Camera size={14}/> },
    { id: 'telefono', label: 'Teléfono verificado', completado: !!userData?.telefonoVerificado, icono: <ShieldCheck size={14}/> },
    { id: 'correo', label: 'Correo verificado', completado: !!userData?.correoVerificado, icono: <CheckCircle size={14}/> },
    { id: 'cedula', label: 'Cédula de Identidad', completado: !!userData?.cedula, icono: <FileText size={14}/> },
    { id: 'vehiculo', label: 'Datos del Vehículo', completado: !!userData?.vehiculo?.placa, icono: <Car size={14}/> },
    { id: 'bio', label: 'Mini-biografía', completado: !!userData?.bio, icono: <Edit2 size={14}/> }
  ];

  const completados = hitos.filter(h => h.completado).length;
  const porcentaje = Math.round((completados / hitos.length) * 100);

  return (
    <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4 relative overflow-hidden mt-4">
      <div className="absolute top-[-10px] right-[-10px] opacity-[0.03] pointer-events-none text-blue-900">
        <ShieldCheck size={100} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-end mb-2">
           <div>
             <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-1">
                 <ShieldAlert size={14}/> Nivel de Confianza
             </p>
             <h3 className="text-xl font-black italic uppercase text-slate-800">{completados} de {hitos.length} completados</h3>
           </div>
           <div className="text-right">
             <span className="text-2xl font-black italic text-blue-600">{porcentaje}%</span>
           </div>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 p-1">
           <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-1000" style={{ width: `${porcentaje}%` }}></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mt-4">
         {hitos.map(h => (
            <div key={h.id} className={`flex justify-between items-center p-3 rounded-2xl border ${h.completado ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${h.completado ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{h.icono}</div>
                  <span className={`text-[11px] font-black uppercase italic ${h.completado ? 'text-slate-800' : 'text-slate-400'}`}>{h.label}</span>
               </div>
               {h.completado ? <CheckCircle size={16} className="text-blue-600"/> : <button onClick={onAbrirConfig} className="text-[9px] font-black uppercase italic bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg shadow-sm">Pendiente</button>}
            </div>
         ))}
      </div>
    </div>
  );
};

// --- MÓDULO 14: UX DE SEGURIDAD EN FOTOS DE PERFIL ---
const ModalInstruccionesFoto = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
            <Camera size={40} />
          </div>
          <h3 className="text-2xl font-black italic uppercase text-slate-800 leading-tight">Foto de Perfil</h3>
          <p className="text-slate-500 text-sm font-medium">Para tu seguridad y la de los demás, sigue estas reglas:</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="bg-red-100 text-red-600 p-2 rounded-lg"><CigaretteOff size={20} /></div>
            <p className="text-[11px] font-black uppercase italic text-slate-700">Sin lentes de sol ni gorras</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><User size={20} /></div>
            <p className="text-[11px] font-black uppercase italic text-slate-700">De frente y donde se vea tu cara</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Users size={20} /></div>
            <p className="text-[11px] font-black uppercase italic text-slate-700">Tú solo, sin acompañantes</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <p className="text-[10px] text-blue-800 font-bold text-center leading-relaxed">
            "Tómate una foto clara: sin gorra, sin lentes de sol y de frente. ¡Queremos saber quién eres!"
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
          >
             Entendido, subir foto
          </button>
          <button 
            onClick={onClose}
            className="w-full text-slate-400 font-black uppercase italic py-2 text-[10px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MÓDULO 17: FEEDBACK POST-ACCIÓN (Success Screen) ---
const PantallaExito = ({ visible, titulo, subtitulo, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-300">
      <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <CheckCircle size={60} className="text-green-600" />
      </div>
      
      <h2 className="text-3xl font-black italic text-slate-800 uppercase text-center leading-none mb-4 tracking-tighter">
        {titulo}
      </h2>
      
      <p className="text-slate-500 text-center font-medium text-sm mb-10 leading-relaxed">
        {subtitulo}
      </p>

      <button 
        onClick={onClose}
        className="w-full py-5 bg-slate-900 text-white rounded-[25px] font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all"
      >
        Entendido
      </button>
    </div>
  );
};

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

  {/* PASO 4: ETIQUETA VIP PARA EL PASAJERO */}
  {viaje.preferencias?.maxDosAtras && (
    <div className="mt-1.5 inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg shadow-sm">
      <Crown size={10} className="text-purple-600" />
      <span className="text-[8px] font-black uppercase tracking-wider">Máximo 2 Atrás</span>
    </div>
  )}
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
  const [modo, setModo] = useState("pasajero"); // "pasajero" o "chofer"
  const [showSearchModal, setShowSearchModal] = useState({ visible: false, type: 'origen' }); // type: 'origen' o 'destino'
const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]); 
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [viajes, setViajes] = useState([]); // Todos los viajes (para búsqueda)
const [misViajesPublicados, setMisViajesPublicados] = useState([]); // NUEVO: Tus viajes creados
const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]); 
const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [viajeEditando, setViajeEditando] = useState(null); // Almacenará el ID del viaje a editar
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [pasajerosViaje, setPasajerosViaje] = useState([]); 
  const [configOpen, setConfigOpen] = useState(false);
  const [pestañaActiva, setPestañaActiva] = useState("perfil");
  const [successData, setSuccessData] = useState({ show: false, titulo: "", subtitulo: "" });
  
  // MÓDULO 18: WIZARD DE PUBLICACIÓN (Chofer)
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeForm, setViajeForm] = useState({
  origen: "", destino: "", paradas: [], rutaSeleccionada: null, precio: "", asientos: 3, horaSalida: "", horaLlegada: "", preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
});

  const [showFotoInstrucciones, setShowFotoInstrucciones] = useState(false);

  const abrirCamara = () => {
    alert("Próximamente: Aquí conectaremos el selector de fotos.");
  };

  const obtenerNivel = (viajes = 0) => {
    if (viajes >= 50) return { etiqueta: "Embajador", clase: "bg-purple-100 text-purple-700" };
    if (viajes >= 10) return { etiqueta: "Viajero Frecuente", clase: "bg-blue-100 text-blue-700" };
    return { etiqueta: "Principiante", clase: "bg-slate-100 text-slate-600" };
  };

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

  const [viajeEditando, setViajeEditando] = useState(null); 

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

  const calcularEstatus = (viajesCompletados = 0, calificacion = 0) => {
    if (viajesCompletados >= 80 && calificacion >= 4.9) return "Diamante";
    if (viajesCompletados >= 30 && calificacion >= 4.7) return "Oro";
    if (viajesCompletados >= 10 && calificacion >= 4.5) return "Plata";
    return "Bronce";
  };

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
    precio: viaje.precio.toString(),
    asientos: viaje.puestos,
    horaSalida: viaje.horaSalida,
    horaLlegada: viaje.horaLlegada,
    preferencias: viaje.preferencias || { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });
  setStep(1); // Iniciamos desde el paso 1 del wizard
  setVista("publicar"); // Cambiamos a la vista de publicación
};
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
    if(!viajeActivo) return;
    if(rol === "chofer" && user.uid !== viajeActivo.idChofer) return alert("Acción no autorizada.");
    if(rol === "pasajero" && user.uid !== viajeActivo.idPasajero) return alert("Acción no autorizada.");
    try {
      const actualizacion = {};
      if (rol === "chofer") actualizacion.finalizadoChofer = true;
      if (rol === "pasajero") actualizacion.finalizadoPasajero = true;

      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), actualizacion);
      if ((rol === "chofer" && viajeActivo.finalizadoPasajero) || (rol === "pasajero" && viajeActivo.finalizadoChofer)) {
        
        const tieneKYC = userData?.cedula && userData?.vehiculo?.placa;
        const porcentajeComision = tieneKYC ? 1.00 : 0.95; 
        const montoFinal = viajeActivo.precioViaje * porcentajeComision;

        await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { 
          fase: "finalizado", 
          estado: "completado",
          pagoEstado: "completado",
          montoNetoChofer: montoFinal,
          fechaFinalizacion: serverTimestamp()
        });
        alert(`🏁 ¡Cola Completada con éxito! Fondos liberados.`);
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
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[20px]">
                <button onClick={() => setModo("pasajero")} className={`flex-1 py-3 rounded-[15px] text-[10px] font-black uppercase italic transition-all ${modo === "pasajero" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>Buscar Cola</button>
                <button onClick={() => setModo("chofer")} className={`flex-1 py-3 rounded-[15px] text-[10px] font-black uppercase italic transition-all ${modo === "chofer" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>Publicar Viaje</button>
              </div>

             {/* MODO CHOFER: WIZARD DE PUBLICACIÓN */}
      {modo === "chofer" && (
        <div className="space-y-6 animate-in slide-in-from-right">
          {(!userData?.cedula || !userData?.vehiculo?.placa) ? (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-[30px] flex items-start gap-4">
              <ShieldAlert size={30} className="text-amber-500 shrink-0" />
              <div>
                <h3 className="text-amber-800 font-black italic uppercase text-sm mb-1">Verificación Requerida</h3>
                <p className="text-[10px] text-amber-700 font-bold mb-3">Para publicar rutas y llevar pasajeros, primero debes completar tu perfil de conductor (Cédula y Vehículo).</p>
                <button onClick={() => { cambiarVista("perfil"); setTimeout(() => setConfigOpen(true), 300); }} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95">Ir a verificarme</button>
              </div>
            </div>
          ) : (
            <>
              {/* PASO 1: DIRECCIONES CON AUTOCOMPLETADO */}
              {vista === "inicio" && pasoWizard === 1 && (
                <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right">
                  <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">¿Hacia dónde<br/>vas a manejar?</h2>
                  
                  <div className="space-y-4">
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

                    <div className="relative">
                      <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[25px] border border-slate-100 focus-within:border-green-400">
                        <Navigation size={22} className="text-green-600"/>
                        <input 
                          type="text" 
                          placeholder="Punto de llegada (Ej. Caracas)" 
                          className="bg-transparent w-full text-sm font-bold outline-none text-slate-700"
                          value={viajeForm.destino}
                          onChange={(e) => setViajeForm({...viajeForm, destino: e.target.value})}
                        />
                      </div>

                      {viajeForm.destino.length > 1 && !viajeForm.destino.includes(',') && (
                        <div className="absolute z-[100] w-full bg-white border rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                          {Object.keys(UBICACIONES).flatMap(estado => 
                            UBICACIONES[estado]
                              .filter(ciudad => ciudad.toLowerCase().includes(viajeForm.destino.toLowerCase()))
                              .map(ciudad => (
                                <button 
                                  key={`dest-${estado}-${ciudad}`}
                                  onClick={() => setViajeForm({...viajeForm, destino: `${ciudad}, ${estado}`})}
                                  className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3"
                                >
                                  <Navigation size={14} className="text-green-400"/> {ciudad}, {estado}
                                </button>
                              ))
                          ).slice(0, 5)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] active:scale-95 transition-all">Buscar</button>
                    <button onClick={() => setPasoWizard(2)} disabled={!viajeForm.origen || !viajeForm.destino} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg active:scale-95 transition-all disabled:opacity-50">Siguiente Paso</button>
                  </div>
                </div>
              )}

              {/* VISTAS RESTANTES */}
              {vista !== "inicio" && (
                <div className="space-y-3 overflow-y-auto">
                  {vista === "inbox" && (
                    <div className="space-y-3">
                      {historialChats.map(c => {
                        const soyChofer = misViajesPublicados.some(v => v.id === c.idViaje);
                        return (
                          <div key={c.chatId} onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} className="bg-white p-4 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[7px] font-black uppercase italic ${soyChofer ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              Chat como {soyChofer ? 'Chofer' : 'Pasajero'}
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                              <User size={20} className="text-blue-500 group-hover:text-white"/>
                            </div>
                            <div className="flex-1 overflow-hidden pt-2">
                              <p className="text-xs font-black italic uppercase text-slate-800">{c.nombreOtro}</p>
                              <p className="text-[10px] text-slate-500 font-bold truncate">{c.ultimoMensaje}</p>
                            </div>
                            <ChevronLeft size={16} className="text-slate-300 transform rotate-180 shrink-0"/>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {vista === "wallet" && (
                    <div className="space-y-6 animate-in fade-in">
                      <h2 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Wallet</h2>
                      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase opacity-80 mb-2 tracking-widest">Saldo Disponible</p>
                        <p className="text-6xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
                        <div className="absolute top-10 right-10 opacity-20"><Wallet size={80}/></div>
                        <div className="mt-8 flex items-center gap-2 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                          <Lock size={14}/><p className="text-[9px] font-black uppercase italic tracking-tighter leading-none">Fondos protegidos por el sistema de retención inteligente.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {vista === "soporte" && (
                    <div className="flex flex-col h-[500px] bg-white rounded-[40px] border shadow-lg overflow-hidden animate-in fade-in">
                      <div className="bg-blue-600 p-4 text-white text-center font-black italic text-[10px] uppercase">Soporte Técnico</div>
                      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                        <div className="p-4 bg-white border rounded-3xl self-start text-[11px] font-bold text-slate-700 shadow-sm">👋 ¡Hola {userData.nombre}! Reporta cualquier incidente aquí.</div>
                        {chatSoporte.map((m, i) => (
                          <div key={i} className={`p-4 rounded-3xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.usuarioId === user.uid ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border text-slate-700 self-start rounded-tl-none'}`}>{m.texto}</div>
                        ))}
                      </div>
                      <div className="p-4 bg-white border-t flex gap-2">
                        <input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none" placeholder="Reportar incidente..." />
                        <button className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
                      </div>
                    </div>
                  )}

                  {vista === "perfil" && (
                    <div className="space-y-4 animate-in fade-in pb-10">
                      <div className="flex bg-slate-100 p-1.5 rounded-[25px] border shadow-inner">
                        <button onClick={() => setPestañaActiva("perfil")} className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase italic transition-all ${pestañaActiva === "perfil" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Mi Perfil</button>
                        <button onClick={() => setPestañaActiva("cuenta")} className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase italic transition-all ${pestañaActiva === "cuenta" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Cuenta</button>
                      </div>
                      {pestañaActiva === "perfil" ? (
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative overflow-hidden">
                          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl relative overflow-hidden">
                            {userData?.fotoPerfil ? <img src={userData.fotoPerfil} alt="Perfil" className="w-full h-full object-cover"/> : <User size={56} className="text-slate-400" />}
                          </div>
                          <h2 className="mt-4 font-black italic text-2xl text-slate-800 uppercase tracking-tighter">{userData?.nombre}</h2>
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-[35px] border shadow-sm">
                          <button onClick={handleLogout} className="w-full p-4 bg-red-50 rounded-2xl flex items-center justify-between border border-red-100 text-red-600">
                            <div className="flex items-center gap-3"><LogOut size={18}/><span className="text-xs font-black uppercase italic">Cerrar Sesión</span></div>
                          </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <nav className="p-3 bg-white border-t flex justify-between items-center pb-8 fixed bottom-0 w-full max-w-md shadow-2xl z-50 px-6 rounded-t-3xl left-1/2 -translate-x-1/2">
        <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className={`flex flex-col items-center gap-1 ${vista === "inicio" && modo === "pasajero" ? "text-blue-600" : "text-slate-300"}`}><Search size={24} /><span className="text-[8px] font-black uppercase italic">Buscar</span></button>
        <button onClick={() => { setVista("inicio"); setModo("chofer"); }} className={`flex flex-col items-center gap-1 ${vista === "inicio" && modo === "chofer" ? "text-blue-600" : "text-slate-300"}`}><PlusCircle size={24} /><span className="text-[8px] font-black uppercase italic">Publicar</span></button>
        <button onClick={() => cambiarVista("inbox")} className={`flex flex-col items-center gap-1 ${vista === "inbox" ? "text-blue-600" : "text-slate-300"}`}><MessageSquare size={24} /><span className="text-[8px] font-black uppercase italic">Mensajes</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={24} /><span className="text-[8px] font-black uppercase italic">Perfil</span></button>
      </nav>

      <ModalBusquedaAvanzada 
        isOpen={showSearchModal.visible} 
        onClose={() => setShowSearchModal({ ...showSearchModal, visible: false })} 
        onSelect={(estado, ciudad) => { 
          if (showSearchModal.type === 'origen') { setFEO(estado); setFCO(ciudad); } 
          else { setFED(estado); setFCD(ciudad); } 
        }} 
        ubicaciones={UBICACIONES} 
      />
    </div>
  );
};

export default NavegacionPrincipal;
