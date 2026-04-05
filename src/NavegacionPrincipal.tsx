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
    id: "",
    estadoOrigen: "",
    ciudadOrigen: "",
    estadoDestino: "",
    ciudadDestino: "",
    precio: "",
    modeloAuto: "",
    puestos: "4",
    detalles: "",
  });

  const resetFormViaje = () => {
    setFormViaje({ id: "", estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "", precio: "", modeloAuto: "", puestos: "4", detalles: "" });
  };

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

  useEffect(() => {
    const q = query(collection(db, "Viajes"));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setViajesReales(docs);
      
      // Auto-seleccionar viaje activo para el chat
      const activo = docs.find(v => (v.idCreador === user?.uid || v.pasajeroId === user?.uid) && v.estado !== "finalizado");
      if (activo) setViajeActivo(activo);
    });
  }, [user]);

  const publicarViaje = async () => {
    if (!formViaje.estadoOrigen || !formViaje.ciudadOrigen || !formViaje.precio) {
      return alert("⚠️ Por favor indica Origen, Ciudad y Precio");
    }
    
    try {
      const { id, ...dataParaEnviar } = formViaje; // Separamos el ID de los datos
      const payload = {
        ...dataParaEnviar,
        conductor: userData.nombre || "Chófer",
        idCreador: user.uid,
        precio: Number(formViaje.precio),
        puestos: Number(formViaje.puestos),
        vehiculo: userData.vehiculo?.modelo || formViaje.modeloAuto || "Vehículo",
        fecha: serverTimestamp(),
        estado: "buscando"
      };

      if (id) {
        await updateDoc(doc(db, "Viajes", id), payload);
        alert("✅ Cambios guardados con éxito");
      } else {
        await addDoc(collection(db, "Viajes"), payload);
        alert("✅ Ruta publicada correctamente");
      }
      resetFormViaje();
    } catch (e) {
      console.error(e);
      alert("❌ Error al guardar en la base de datos");
    }
  };

  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio) return alert("⚠️ Saldo insuficiente");
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { saldo: userData.saldo - viaje.precio });
      await updateDoc(doc(db, "Viajes", viaje.id), { pasajeroId: user.uid, estado: "confirmado" });
      setViajeSeleccionado(null);
      setVista("chat_conductor");
    } catch (e) { alert("Error al reservar"); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER */}
      {!["chat_conductor", "chat_soporte"].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setPerfilPublico(userData)} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">R</div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase">RutaCom {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1">
                  {userData.nombre || "Cargando..."} 
                  {modo === "chofer" && <Star size={10} className="text-yellow-500 fill-yellow-500"/>}
                </p>
              </div>
            </button>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => { setModo(modo === "pasajero" ? "chofer" : "pasajero"); setVista("inicio"); }} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border shadow-sm transition-all active:scale-95 ${modo === "pasajero" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-100"}`}>
            Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* INICIO PASAJERO */}
        {vista === "inicio" && modo === "pasajero" && (
          <div className="p-6 space-y-4 pb-32">
            <div className="bg-white rounded-[25px] border shadow-sm p-4 space-y-4">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><MapPin size={12} className="text-green-500"/> ¿Origen?</p>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold outline-none" value={busquedaEstadoOrigen} onChange={(e) => { setBusquedaEstadoOrigen(e.target.value); setBusquedaCiudadOrigen(""); }}>
                      <option value="">Estado</option>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select disabled={!busquedaEstadoOrigen} className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold outline-none" value={busquedaCiudadOrigen} onChange={(e) => setBusquedaCiudadOrigen(e.target.value)}>
                      <option value="">Ciudad</option>
                      {busquedaEstadoOrigen && UBICACIONES[busquedaEstadoOrigen].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Search size={12} className="text-blue-600"/> ¿Destino?</p>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold outline-none" value={busquedaEstadoDestino} onChange={(e) => { setBusquedaEstadoDestino(e.target.value); setBusquedaCiudadDestino(""); }}>
                      <option value="">Estado</option>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select disabled={!busquedaEstadoDestino} className="flex-1 bg-slate-50 p-3 rounded-xl border text-xs font-bold outline-none" value={busquedaCiudadDestino} onChange={(e) => setBusquedaCiudadDestino(e.target.value)}>
                      <option value="">Ciudad</option>
                      {busquedaEstadoDestino && UBICACIONES[busquedaEstadoDestino].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
            </div>

            {viajesReales.filter(v => (!busquedaEstadoOrigen || v.estadoOrigen === busquedaEstadoOrigen) && (!busquedaCiudadOrigen || v.ciudadOrigen === busquedaCiudadOrigen) && v.estado === "buscando" && v.idCreador !== user.uid).map((v) => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-4 rounded-[25px] border flex flex-col gap-3 shadow-sm text-left active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><Car size={20} /></div>
                    <div>
                      <p className="font-black uppercase text-sm text-slate-800">{v.conductor}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculo} • ⭐️ 5.0</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl flex flex-col text-[10px] font-bold text-slate-500 uppercase">
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"/> {v.ciudadOrigen}</span>
                  <span className="flex items-center gap-1 text-blue-600"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full"/> {v.ciudadDestino}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INICIO CHÓFER */}
        {vista === "inicio" && modo === "chofer" && (
          <div className="p-6 space-y-6 text-left pb-32">
            
            {/* Notificación de Viaje Activo / Publicación */}
            {viajesReales.filter(v => v.idCreador === user.uid && v.estado !== "finalizado").map(v => (
              <div key={v.id} className="bg-blue-600 p-5 rounded-[25px] text-white shadow-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-70">Publicación Activa</p>
                    <p className="text-sm font-black italic uppercase">{v.ciudadOrigen} ➔ {v.ciudadDestino}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFormViaje({...v, id: v.id, precio: v.precio.toString()})} className="p-2 bg-white/20 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={async () => { if(confirm("¿Eliminar publicación?")) { await deleteDoc(doc(db, "Viajes", v.id)); resetFormViaje(); } }} className="p-2 bg-red-500/80 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </div>
                {v.estado === "confirmado" && (
                  <button onClick={() => { setViajeActivo(v); setVista("chat_conductor"); }} className="w-full py-2 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase">¡Alguien reservó! Ir al Chat</button>
                )}
              </div>
            ))}

            {/* Formulario */}
            <div className="bg-white p-6 rounded-[30px] border shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <PlusCircle size={18} className={formViaje.id ? "text-blue-600" : "text-green-600"} />
                  <h2 className="text-sm font-black uppercase italic text-slate-800">{formViaje.id ? "Modificando Ruta" : "Nueva Ruta de Viaje"}</h2>
                </div>
                {formViaje.id && <button onClick={resetFormViaje} className="text-[10px] font-black text-red-500 uppercase">Cancelar</button>}
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.estadoOrigen} onChange={(e) => setFormViaje({...formViaje, estadoOrigen: e.target.value, ciudadOrigen: ""})}>
                    <option value="">Estado Origen</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <select disabled={!formViaje.estadoOrigen} className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.ciudadOrigen} onChange={(e) => setFormViaje({...formViaje, ciudadOrigen: e.target.value})}>
                    <option value="">Ciudad Origen</option>
                    {formViaje.estadoOrigen && UBICACIONES[formViaje.estadoOrigen].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.estadoDestino} onChange={(e) => setFormViaje({...formViaje, estadoDestino: e.target.value, ciudadDestino: ""})}>
                    <option value="">Estado Destino</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <select disabled={!formViaje.estadoDestino} className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.ciudadDestino} onChange={(e) => setFormViaje({...formViaje, ciudadDestino: e.target.value})}>
                    <option value="">Ciudad Destino</option>
                    {formViaje.estadoDestino && UBICACIONES[formViaje.estadoDestino].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 bg-slate-50 p-3 rounded-xl border font-bold text-xs outline-none" placeholder="Precio $" type="number" value={formViaje.precio} onChange={(e) => setFormViaje({...formViaje, precio: e.target.value})} />
                  <button onClick={publicarViaje} className={`flex-[2] text-white font-black uppercase italic rounded-xl py-3 text-xs shadow-md active:scale-95 ${formViaje.id ? "bg-blue-600" : "bg-green-600"}`}>
                    {formViaje.id ? "Guardar Cambios" : "Publicar Ahora"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase">🛒 Rutas activas de otros colegas</p>
              <div className="space-y-2 opacity-60">
                {viajesReales.filter(v => v.idCreador !== user.uid && v.estado === "buscando").slice(0, 3).map(v => (
                  <div key={v.id} className="bg-white p-3 rounded-2xl border flex justify-between items-center text-[10px] font-bold">
                    <span>{v.ciudadOrigen} ➔ {v.ciudadDestino}</span>
                    <span className="text-blue-600">${v.precio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PERFIL */}
        {vista === "perfil" && (
          <div className="p-6 space-y-6 pb-32">
            <div className="flex flex-col items-center gap-3">
               <div className="w-20 h-20 bg-slate-900 rounded-[30px] flex items-center justify-center text-white relative shadow-xl">
                 <User size={30} />
               </div>
               <div className="text-center">
                 <h2 className="font-black uppercase text-lg italic text-slate-800">{userData.nombre}</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Miembro Oro RutaCom</p>
               </div>
            </div>

            <div className="bg-white rounded-[30px] border p-6 space-y-6 shadow-sm">
               <div className="grid grid-cols-2 gap-4 border-b pb-6">
                 <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">Reputación</p>
                   <div className="flex items-center gap-1 font-black text-slate-800 italic"><Star size={14} className="text-yellow-500 fill-yellow-500"/> 5.0</div>
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">Vincular</p>
                   <p className="text-xs font-black text-blue-600 uppercase italic">Verificado</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2">
                       {modo === "chofer" ? <Car size={14}/> : <History size={14}/>} 
                       {modo === "chofer" ? "Datos del Vehículo" : "Historial Reciente"}
                    </p>
                    <button onClick={() => setEditando(!editando)} className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Settings size={14}/></button>
                 </div>

                 {modo === "chofer" ? (
                   <div className="grid grid-cols-1 gap-3">
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Modelo de Carro</p>
                        <input disabled={!editando} className="bg-transparent font-bold text-sm uppercase w-full outline-none" value={formPerfil.modelo} onChange={(e) => setFormPerfil({...formPerfil, modelo: e.target.value})} placeholder="Ej: Toyota Corolla 2015"/>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Número de Placa</p>
                        <input disabled={!editando} className="bg-transparent font-bold text-sm uppercase w-full outline-none" value={formPerfil.placa} onChange={(e) => setFormPerfil({...formPerfil, placa: e.target.value})} placeholder="Ej: AB123CD"/>
                     </div>
                     {editando && (
                       <button onClick={async () => {
                         await updateDoc(doc(db, "usuarios", user.uid), { vehiculo: { modelo: formPerfil.modelo, placa: formPerfil.placa } });
                         setEditando(false);
                         alert("✅ Datos guardados");
                       }} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase shadow-lg">Actualizar Datos</button>
                     )}
                   </div>
                 ) : (
                   <div className="bg-slate-50 p-10 rounded-3xl border border-dashed border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">No hay viajes completados aún</p>
                   </div>
                 )}
               </div>
            </div>
            
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2 italic text-[10px] active:scale-95 transition-all"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}

        {/* CHATS (CONSTRUCTOR DE VISTA DINÁMICO) */}
        {(vista === "chat_conductor" || vista === "chat_soporte") && (
          <div className="absolute inset-0 z-50 flex flex-col bg-slate-50 animate-in slide-in-from-right duration-300">
            <div className={`p-6 pt-12 border-b flex items-center gap-4 shrink-0 shadow-sm ${vista === "chat_soporte" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
              <button onClick={() => setVista("inicio")} className="p-2 bg-slate-100 rounded-full text-slate-900"><ArrowLeft size={20} /></button>
              <div className="text-left flex-1">
                <p className="font-black uppercase text-sm italic">{vista === "chat_soporte" ? "Soporte RutaCom" : (viajeActivo?.conductor || "Chat de Viaje")}</p>
                <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">• Conectado</p>
              </div>
              <button onClick={() => setPerfilPublico({nombre: viajeActivo?.conductor})} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={18}/></button>
            </div>
            
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="bg-blue-100 p-3 rounded-2xl text-[10px] font-bold text-blue-700 text-center uppercase">
                {vista === "chat_soporte" ? "Bienvenido al soporte técnico" : `Ruta: ${viajeActivo?.ciudadOrigen} ➔ ${viajeActivo?.ciudadDestino}`}
              </div>
              {(vista === "chat_conductor" ? mensajesConductor : mensajesSoporte).map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${m.yo ? "bg-blue-600 text-white ml-auto rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"}`}>
                  <p className="text-xs font-bold italic">{m.texto}</p>
                </div>
              ))}
            </div>

            {/* Acciones de Chófer dentro del chat */}
            {vista === "chat_conductor" && viajeActivo?.idCreador === user.uid && (
              <div className="px-6 py-2">
                 <button onClick={async () => {
                   await updateDoc(doc(db, "Viajes", viajeActivo.id), { estado: "finalizado" });
                   alert("✅ ¡Viaje finalizado con éxito!");
                   setVista("inicio");
                 }} className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg">Finalizar Carrera</button>
              </div>
            )}

            <div className="p-4 bg-white border-t flex gap-2 pb-10">
              <input className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm outline-none font-bold" placeholder="Escribe un mensaje..." value={vista === "chat_conductor" ? inputConductor : inputSoporte} onChange={(e) => vista === "chat_conductor" ? setInputConductor(e.target.value) : setInputSoporte(e.target.value)} />
              <button onClick={() => {
                const text = vista === "chat_conductor" ? inputConductor : inputSoporte;
                if (!text) return;
                if (vista === "chat_conductor") { setMensajesConductor([...mensajesConductor, { texto: text, yo: true }]); setInputConductor(""); }
                else { setMensajesSoporte([...mensajesSoporte, { texto: text, yo: true }]); setInputSoporte(""); }
              }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90"><Send size={20} /></button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL PERFIL PÚBLICO */}
      {perfilPublico && (
        <div className="absolute inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-8">
           <div className="bg-white w-full rounded-[40px] p-8 relative shadow-2xl animate-in zoom-in duration-200">
              <button onClick={() => setPerfilPublico(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-white text-3xl font-black italic shadow-xl">
                  {perfilPublico.nombre?.[0]}
                </div>
                <div>
                  <h3 className="font-black uppercase text-xl italic text-slate-800">{perfilPublico.nombre}</h3>
                  <div className="flex items-center justify-center gap-1 text-yellow-500 mt-1">
                    <Star size={14} fill="currentColor"/> <Star size={14} fill="currentColor"/> <Star size={14} fill="currentColor"/> <Star size={14} fill="currentColor"/> <Star size={14} fill="currentColor"/>
                    <span className="text-slate-800 font-black ml-2 text-sm italic">5.0</span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-3 mt-4">
                   <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Viajes</p>
                      <p className="text-lg font-black italic text-slate-800">14</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Puntos</p>
                      <p className="text-lg font-black italic text-blue-600">850</p>
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 italic mt-2 px-4 leading-relaxed">"Conductor excelente, muy puntual y el vehículo en perfectas condiciones."</p>
              </div>
           </div>
        </div>
      )}

      {/* MODAL RESERVA PASAJERO */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-200">
          <div className="w-full bg-white rounded-t-[40px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-start">
              <button onClick={() => setPerfilPublico({nombre: viajeSeleccionado.conductor})} className="flex gap-4 text-left flex-1">
                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black italic shadow-lg shrink-0">R</div>
                <div className="flex-1">
                  <p className="text-xl font-black uppercase text-slate-800 leading-tight">{viajeSeleccionado.conductor}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">Ver Reputación <Star size={10} fill="currentColor"/></p>
                </div>
              </button>
              <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="bg-slate-50 p-5 rounded-[25px] flex flex-col gap-2 border border-slate-100">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full"/>
                 <p className="text-[11px] font-black text-slate-700 uppercase">{viajeSeleccionado.ciudadOrigen}, {viajeSeleccionado.estadoOrigen}</p>
               </div>
               <div className="ml-1 w-px h-4 bg-slate-300"/>
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-blue-600 rounded-full"/>
                 <p className="text-[11px] font-black text-slate-700 uppercase">{viajeSeleccionado.ciudadDestino}, {viajeSeleccionado.estadoDestino}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-5 rounded-[30px] text-left">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-1 italic">Precio</p>
                <p className="text-2xl font-black text-white italic">${viajeSeleccionado.precio}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-[30px] border text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 italic">Puestos</p>
                <p className="text-2xl font-black text-slate-800 italic">{viajeSeleccionado.puestos}</p>
              </div>
            </div>
            <button onClick={() => manejarReserva(viajeSeleccionado)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic shadow-xl active:scale-95 transition-transform text-sm tracking-widest">Confirmar y Reservar</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10 shadow-lg">
        <button onClick={() => setVista("inicio")} className={vista === "inicio" ? "text-blue-600 scale-110" : "text-slate-400"}><Car size={26} /></button>
        <button onClick={() => setVista("chat_soporte")} className={vista === "chat_soporte" ? "text-blue-600 scale-110" : "text-slate-400"}><Headset size={26} /></button>
        <button onClick={() => setVista("perfil")} className={vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-400"}><User size={26} /></button>
      </nav>
    </div>
  );
}

