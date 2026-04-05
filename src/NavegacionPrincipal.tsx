import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Search,
  Wallet,
  User,
  LogOut,
  Car,
  X,
  Send,
  ArrowLeft,
  Edit2,
  Headset,
  PlusCircle,
  Bell,
  MapPin,
  Star,
  History,
  Trash2,
  Settings
} from "lucide-react";

// DICCIONARIO DE ESTADOS Y CIUDADES (VENEZUELA)
const UBICACIONES: Record<string, string[]> = {
  "Amazonas": ["Puerto Ayacucho"],
  "Anzoátegui": ["Barcelona", "Puerto La Cruz", "El Tigre", "Anaco"],
  "Apure": ["San Fernando de Apure", "Elorza"],
  "Aragua": ["Maracay", "Turmero", "La Victoria", "Cagua"],
  "Barinas": ["Barinas", "Socopó"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar", "Upata"],
  "Carabobo": ["Valencia", "Puerto Cabello", "Guacara", "San Diego", "Los Guayos", "Naguanagua", "Mariara"],
  "Cojedes": ["San Carlos", "Tinaco", "Tinaquillo"],
  "Delta Amacuro": ["Tucupita"],
  "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo", "Tucacas"],
  "Guárico": ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"],
  "Lara": ["Barquisimeto", "Cabudare", "Carora"],
  "Mérida": ["Mérida", "El Vigía", "Ejido"],
  "Miranda": ["Los Teques", "Guarenas", "Guatire", "Charallave", "Cúa", "Petare", "San Antonio de los Altos"],
  "Monagas": ["Maturín"],
  "Nueva Esparta": ["Porlamar", "Pampatar", "La Asunción", "Juan Griego"],
  "Portuguesa": ["Guanare", "Acarigua", "Araure"],
  "Sucre": ["Cumaná", "Carúpano"],
  "Táchira": ["San Cristóbal", "Táriba", "Rubio", "San Antonio del Táchira"],
  "Trujillo": ["Trujillo", "Valera", "Boconó"],
  "La Guaira": ["La Guaira", "Catia La Mar", "Maiquetía", "Caraballeda"],
  "Yaracuy": ["San Felipe", "Yaritagua", "Chivacoa"],
  "Zulia": ["Maracaibo", "San Francisco", "Cabimas", "Ciudad Ojeda"]
};

const ESTADOS = Object.keys(UBICACIONES);

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [editando, setEditando] = useState(false);
  
  // BÚSQUEDA (PASAJERO)
  const [busquedaEstadoOrigen, setBusquedaEstadoOrigen] = useState("");
  const [busquedaCiudadOrigen, setBusquedaCiudadOrigen] = useState("");
  const [busquedaEstadoDestino, setBusquedaEstadoDestino] = useState("");
  const [busquedaCiudadDestino, setBusquedaCiudadDestino] = useState("");

  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);

  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  const [perfilPublico, setPerfilPublico] = useState<any>(null);

  const [userData, setUserData] = useState<any>({
    nombre: "",
    saldo: 0,
    telefono: "",
    estrellas: 5.0,
    viajesRealizados: 0,
    vehiculo: { modelo: "", color: "", placa: "" }
  });
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "", modelo: "", color: "", placa: "" });
  
  const [formViaje, setFormViaje] = useState({
    id: "", // Para edición
    estadoOrigen: "",
    ciudadOrigen: "",
    estadoDestino: "",
    ciudadDestino: "",
    precio: "",
    modeloAuto: "",
    puestos: "4",
    detalles: "",
  });
  const [estadoViaje, setEstadoViaje] = useState("buscando");

  // Sincronización de usuario
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (!editando)
          setFormPerfil({
            nombre: data.nombre || "",
            telefono: data.telefono || "",
            modelo: data.vehiculo?.modelo || "",
            color: data.vehiculo?.color || "",
            placa: data.vehiculo?.placa || "",
          });
      }
    });
  }, [user, editando]);

  // Escucha global de viajes
  useEffect(() => {
    const q = query(collection(db, "Viajes"));
    return onSnapshot(q, (snap) => {
      setViajesReales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Publicar o Editar Viaje
  const publicarViaje = async () => {
    if (!formViaje.estadoOrigen || !formViaje.ciudadOrigen || !formViaje.precio) {
      return alert("⚠️ Completa los datos mínimos");
    }
    try {
      const dataViaje = {
        conductor: userData.nombre,
        idCreador: user.uid,
        estadoOrigen: formViaje.estadoOrigen,
        ciudadOrigen: formViaje.ciudadOrigen,
        estadoDestino: formViaje.estadoDestino,
        ciudadDestino: formViaje.ciudadDestino,
        precio: Number(formViaje.precio),
        vehiculo: userData.vehiculo?.modelo || formViaje.modeloAuto,
        puestos: Number(formViaje.puestos),
        detallesExtras: formViaje.detalles,
        fecha: serverTimestamp(),
        estado: "buscando"
      };

      if (formViaje.id) {
        await updateDoc(doc(db, "Viajes", formViaje.id), dataViaje);
        alert("✅ Viaje actualizado");
      } else {
        await addDoc(collection(db, "Viajes"), dataViaje);
        alert("✅ ¡Viaje publicado!");
      }
      setFormViaje({ id: "", estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "", precio: "", modeloAuto: "", puestos: "4", detalles: "" });
    } catch (e) { alert("Error al guardar"); }
  };

  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio) return alert("⚠️ Saldo insuficiente");
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { saldo: userData.saldo - viaje.precio });
      setViajeActivo(viaje);
      setViajeSeleccionado(null);
      setVista("chat_conductor");
    } catch (e) { alert("Error"); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER DINÁMICO */}
      {!["chat_conductor", "chat_soporte"].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setPerfilPublico(userData)} className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg italic">R</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">RutaCom {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1">
                  {userData.nombre || "Usuario"} 
                  {modo === "chofer" && <Star size={10} className="text-yellow-500 fill-yellow-500"/>}
                </p>
              </div>
            </button>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border shadow-sm transition-all active:scale-95 ${modo === "pasajero" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-100"}`}>
            Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* VISTA INICIO - PASAJERO */}
        {vista === "inicio" && modo === "pasajero" && (
          <div className="p-6 space-y-4 pb-32">
            <div className="bg-white rounded-[25px] border shadow-sm p-4 space-y-4">
              <div className="space-y-4">
                {/* Selector Origen */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><MapPin size={12} className="text-green-500"/> ¿Desde dónde?</p>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={busquedaEstadoOrigen} onChange={(e) => { setBusquedaEstadoOrigen(e.target.value); setBusquedaCiudadOrigen(""); }}>
                      <option value="">Estado</option>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select disabled={!busquedaEstadoOrigen} className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={busquedaCiudadOrigen} onChange={(e) => setBusquedaCiudadOrigen(e.target.value)}>
                      <option value="">Ciudad</option>
                      {busquedaEstadoOrigen && UBICACIONES[busquedaEstadoOrigen].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {/* Selector Destino */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Search size={12} className="text-blue-600"/> ¿A dónde vas?</p>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={busquedaEstadoDestino} onChange={(e) => { setBusquedaEstadoDestino(e.target.value); setBusquedaCiudadDestino(""); }}>
                      <option value="">Estado</option>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select disabled={!busquedaEstadoDestino} className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={busquedaCiudadDestino} onChange={(e) => setBusquedaCiudadDestino(e.target.value)}>
                      <option value="">Ciudad</option>
                      {busquedaEstadoDestino && UBICACIONES[busquedaEstadoDestino].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista Viajes Pasajero */}
            {viajesReales.filter(v => (!busquedaEstadoOrigen || v.estadoOrigen === busquedaEstadoOrigen) && (!busquedaCiudadOrigen || v.ciudadOrigen === busquedaCiudadOrigen) && v.estado !== "finalizado").map((v) => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-4 rounded-[25px] border flex flex-col gap-3 shadow-sm text-left">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><Car size={20} /></div>
                    <div>
                      <p className="font-black uppercase text-sm text-slate-800">{v.conductor}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculo} • ⭐️ 4.9</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl flex flex-col text-[9px] font-bold text-slate-500 uppercase">
                  <span>De: {v.ciudadOrigen}</span>
                  <span className="text-blue-600">A: {v.ciudadDestino}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VISTA INICIO - CHÓFER */}
        {vista === "inicio" && modo === "chofer" && (
          <div className="p-6 space-y-6 text-left pb-32">
            
            {/* Mis Publicaciones (Edición) */}
            {viajesReales.filter(v => v.idCreador === user.uid && v.estado === "buscando").length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-blue-600 uppercase italic">Mi Publicación Activa</p>
                {viajesReales.filter(v => v.idCreador === user.uid && v.estado === "buscando").map(v => (
                  <div key={v.id} className="bg-blue-600 p-4 rounded-[25px] text-white flex justify-between items-center shadow-lg">
                    <div>
                      <p className="text-[10px] font-black uppercase opacity-70">{v.ciudadOrigen} ➔ {v.ciudadDestino}</p>
                      <p className="text-xl font-black italic">${v.precio}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setFormViaje({...v, id: v.id, modeloAuto: v.vehiculo, precio: v.precio.toString()})} className="p-3 bg-white/20 rounded-xl"><Edit2 size={16}/></button>
                      <button onClick={async () => { if(confirm("¿Eliminar ruta?")) await deleteDoc(doc(db, "Viajes", v.id)) }} className="p-3 bg-red-500 rounded-xl"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Crear / Editar Ruta */}
            <div className="bg-white p-5 rounded-[30px] border shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <PlusCircle size={18} className="text-green-600" />
                <h2 className="text-sm font-black uppercase italic text-slate-800">{formViaje.id ? "Editar Mi Ruta" : "Nueva Ruta"}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={formViaje.estadoOrigen} onChange={(e) => setFormViaje({...formViaje, estadoOrigen: e.target.value, ciudadOrigen: ""})}>
                  <option value="">Estado Origen</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select disabled={!formViaje.estadoOrigen} className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={formViaje.ciudadOrigen} onChange={(e) => setFormViaje({...formViaje, ciudadOrigen: e.target.value})}>
                  <option value="">Ciudad Origen</option>
                  {formViaje.estadoOrigen && UBICACIONES[formViaje.estadoOrigen].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={formViaje.estadoDestino} onChange={(e) => setFormViaje({...formViaje, estadoDestino: e.target.value, ciudadDestino: ""})}>
                  <option value="">Estado Destino</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select disabled={!formViaje.estadoDestino} className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={formViaje.ciudadDestino} onChange={(e) => setFormViaje({...formViaje, ciudadDestino: e.target.value})}>
                  <option value="">Ciudad Destino</option>
                  {formViaje.estadoDestino && UBICACIONES[formViaje.estadoDestino].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-slate-50 p-3 rounded-xl border font-bold text-xs" placeholder="Precio ($)" type="number" value={formViaje.precio} onChange={(e) => setFormViaje({...formViaje, precio: e.target.value})} />
                <button onClick={publicarViaje} className="flex-[2] bg-green-600 text-white font-black uppercase italic rounded-xl py-3 text-xs shadow-md">{formViaje.id ? "Guardar Cambios" : "Publicar Ruta"}</button>
              </div>
            </div>

            {/* Feed Global para el Chófer (Comparar Precios) */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">🛒 Otros viajes activos (Para comparar)</p>
              <div className="space-y-2 opacity-80">
                {viajesReales.filter(v => v.idCreador !== user.uid && v.estado === "buscando").slice(0, 3).map(v => (
                  <div key={v.id} className="bg-white p-3 rounded-2xl border flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-600">{v.ciudadOrigen} ➔ {v.ciudadDestino}</span>
                    <span className="text-blue-600">${v.precio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VISTA PERFIL */}
        {vista === "perfil" && (
          <div className="p-6 space-y-6 pb-32">
            <div className="flex flex-col items-center gap-3">
               <div className="w-20 h-20 bg-slate-900 rounded-[30px] flex items-center justify-center text-white relative">
                 <User size={30} />
                 <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-lg border-2 border-white"><Star size={10} className="fill-white"/></div>
               </div>
               <div className="text-center">
                 <h2 className="font-black uppercase text-lg italic text-slate-800">{userData.nombre}</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Miembro desde 2026</p>
               </div>
            </div>

            <div className="bg-white rounded-[30px] border p-5 space-y-4 shadow-sm">
               <div className="flex justify-between items-center border-b pb-4">
                 <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">Estado Cuenta</p>
                   <p className="text-sm font-black text-green-600 uppercase italic">Verificado</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Reputación</p>
                   <div className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500"/><span className="text-sm font-black italic">{userData.estrellas || 5.0}</span></div>
                 </div>
               </div>

               {/* Si es modo Chófer, mostramos el Vehículo */}
               {modo === "chofer" ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-blue-600 uppercase">Mi Vehículo</p>
                     <button onClick={() => setEditando(!editando)} className="text-slate-400"><Settings size={14}/></button>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-50 p-3 rounded-xl">
                       <p className="text-[8px] font-black text-slate-400 uppercase">Modelo</p>
                       <input disabled={!editando} className="bg-transparent font-bold text-xs uppercase w-full outline-none" value={formPerfil.modelo} onChange={(e) => setFormPerfil({...formPerfil, modelo: e.target.value})}/>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-xl">
                       <p className="text-[8px] font-black text-slate-400 uppercase">Placa</p>
                       <input disabled={!editando} className="bg-transparent font-bold text-xs uppercase w-full outline-none" value={formPerfil.placa} onChange={(e) => setFormPerfil({...formPerfil, placa: e.target.value})}/>
                     </div>
                   </div>
                   {editando && (
                     <button onClick={async () => {
                       await updateDoc(doc(db, "usuarios", user.uid), { vehiculo: { modelo: formPerfil.modelo, placa: formPerfil.placa, color: formPerfil.color } });
                       setEditando(false);
                       alert("Vehículo actualizado");
                     }} className="w-full py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase">Guardar Cambios</button>
                   )}
                 </div>
               ) : (
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><History size={14}/> Historial Pasajero</p>
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                       <p className="text-[9px] font-bold text-slate-400 uppercase">No tienes viajes realizados recientemente</p>
                    </div>
                 </div>
               )}
            </div>
            
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2 italic text-xs active:bg-red-100"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}
      </main>

      {/* MODAL PERFIL PÚBLICO (REPUTACIÓN) */}
      {perfilPublico && (
        <div className="absolute inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full rounded-[40px] p-8 relative shadow-2xl animate-in zoom-in duration-300">
              <button onClick={() => setPerfilPublico(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-white text-3xl font-black italic shadow-xl">
                  {perfilPublico.nombre?.[0]}
                </div>
                <div>
                  <h3 className="font-black uppercase text-xl italic text-slate-800">{perfilPublico.nombre}</h3>
                  <div className="flex items-center justify-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor"/> <Star size={16} fill="currentColor"/> <Star size={16} fill="currentColor"/> <Star size={16} fill="currentColor"/> <Star size={16} fill="currentColor"/>
                    <span className="text-slate-800 font-black ml-2">5.0</span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-4 mt-4">
                   <div className="bg-slate-50 p-4 rounded-3xl border">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Viajes</p>
                      <p className="text-lg font-black italic text-slate-800">{perfilPublico.viajesRealizados || 12}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-3xl border">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Antigüedad</p>
                      <p className="text-lg font-black italic text-slate-800">1 Año</p>
                   </div>
                </div>
                <p className="text-xs font-bold text-slate-400 italic">"Usuario verificado y confiable en la comunidad de RutaCom"</p>
              </div>
           </div>
        </div>
      )}

      {/* MODAL RESERVA PASAJERO (Se mantiene igual de bonito) */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[40px] p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <button onClick={() => setPerfilPublico({nombre: viajeSeleccionado.conductor})} className="flex gap-4 text-left flex-1">
                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black italic shadow-lg shrink-0">R</div>
                <div className="flex-1">
                  <p className="text-xl font-black uppercase text-slate-800 leading-tight">{viajeSeleccionado.conductor}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">Ver Perfil <Star size={10} fill="currentColor"/></p>
                </div>
              </button>
              <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2 border border-slate-100 text-[10px] font-bold uppercase text-slate-600">
               <p>De: {viajeSeleccionado.ciudadOrigen}, {viajeSeleccionado.estadoOrigen}</p>
               <p className="text-blue-600">A: {viajeSeleccionado.ciudadDestino}, {viajeSeleccionado.estadoDestino}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-[25px] text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase">Precio</p>
                <p className="text-xl font-black text-blue-600 italic">${viajeSeleccionado.precio}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[25px] text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase">Cupos</p>
                <p className="text-xl font-black text-slate-800 italic">{viajeSeleccionado.puestos}</p>
              </div>
            </div>
            <button onClick={() => manejarReserva(viajeSeleccionado)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic shadow-xl active:scale-95 text-sm tracking-widest">Reservar Cupo Ahora</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10 shadow-lg">
        <button onClick={() => setVista("inicio")} className={vista === "inicio" ? "text-blue-600" : "text-slate-400"}><Car size={24} /></button>
        <button onClick={() => setVista("chat_soporte")} className={vista === "chat_soporte" ? "text-blue-600" : "text-slate-400"}><Headset size={24} /></button>
        <button onClick={() => setVista("perfil")} className={vista === "perfil" ? "text-blue-600" : "text-slate-400"}><User size={24} /></button>
      </nav>
    </div>
  );
}
