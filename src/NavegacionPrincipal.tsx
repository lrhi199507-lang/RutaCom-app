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
  MapPin
} from "lucide-react";

// 1. DICCIONARIO DE ESTADOS Y CIUDADES
// (Puedes agregar más ciudades a los arreglos si lo necesitas)
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
  
  // 2. ESTADOS DE BÚSQUEDA (PASAJERO)
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
  const [userData, setUserData] = useState<any>({
    nombre: "",
    saldo: 0,
    telefono: "",
  });
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });
  
  // 3. ESTADOS DE FORMULARIO DE VIAJE (CHÓFER)
  const [formViaje, setFormViaje] = useState({
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
          });
      }
    });
  }, [user, editando]);

  useEffect(() => {
    const q = query(collection(db, "Viajes"));
    return onSnapshot(q, (snap) => {
      setViajesReales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    if (!viajeActivo?.id) return;
    return onSnapshot(doc(db, "Viajes", viajeActivo.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEstadoViaje(data.estado || "buscando");
      }
    });
  }, [viajeActivo]);

  useEffect(() => {
    if (modo !== "chofer" || !user) return;
    const q = query(collection(db, "Viajes"), where("idCreador", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const misViajes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activo = misViajes.find(v => v.estado === "buscando" || v.estado === "confirmado");
      if (activo) setViajeActivo(activo);
    });
  }, [modo, user]);

  const publicarViaje = async () => {
    // Validación más estricta
    if (!formViaje.estadoOrigen || !formViaje.ciudadOrigen || !formViaje.estadoDestino || !formViaje.ciudadDestino || !formViaje.precio || !formViaje.modeloAuto) {
      return alert("⚠️ Por favor completa el Origen, Destino, Precio y Auto");
    }
    
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Chófer Profesional",
        estadoOrigen: formViaje.estadoOrigen,
        ciudadOrigen: formViaje.ciudadOrigen,
        estadoDestino: formViaje.estadoDestino,
        ciudadDestino: formViaje.ciudadDestino,
        precio: Number(formViaje.precio),
        vehiculo: formViaje.modeloAuto,
        puestos: Number(formViaje.puestos),
        detallesExtras: formViaje.detalles,
        idCreador: user.uid,
        fecha: serverTimestamp(),
        estado: "buscando"
      });
      alert("✅ ¡Ruta publicada con éxito!");
      setFormViaje({ ...formViaje, estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "", precio: "", detalles: "" });
    } catch (e) {
      alert("❌ Error de conexión");
    }
  };

  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio) return alert("⚠️ Saldo insuficiente");
    try {
      await updateDoc(doc(db, "usuarios", user.uid), {
        saldo: userData.saldo - viaje.precio,
      });
      setViajeActivo(viaje);
      setViajeSeleccionado(null);
      setVista("chat_conductor");
    } catch (e) {
      alert("Error al procesar la reserva");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      {!["chat_conductor", "chat_soporte"].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg italic">R</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">RutaCom {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800">{userData.nombre || "Usuario"}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100 shadow-sm transition-all active:scale-95">
            Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {vista === "inicio" && modo === "pasajero" && (
          <div className="p-6 space-y-4 pb-32">
            
            {/* PANEL DE BÚSQUEDA PASAJERO */}
            <div className="bg-white rounded-[25px] border shadow-sm p-4 space-y-4">
              
              {/* Selector de Origen */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><MapPin size={12} className="text-green-500"/> ¿Desde dónde viajas?</p>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none text-slate-700"
                    value={busquedaEstadoOrigen} 
                    onChange={(e) => { setBusquedaEstadoOrigen(e.target.value); setBusquedaCiudadOrigen(""); }}>
                    <option value="">Estado...</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <select 
                    disabled={!busquedaEstadoOrigen}
                    className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none text-slate-700 disabled:opacity-50"
                    value={busquedaCiudadOrigen} 
                    onChange={(e) => setBusquedaCiudadOrigen(e.target.value)}>
                    <option value="">Ciudad...</option>
                    {busquedaEstadoOrigen && UBICACIONES[busquedaEstadoOrigen].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              {/* Selector de Destino */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Search size={12} className="text-blue-600"/> ¿A dónde vas?</p>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none text-slate-700"
                    value={busquedaEstadoDestino} 
                    onChange={(e) => { setBusquedaEstadoDestino(e.target.value); setBusquedaCiudadDestino(""); }}>
                    <option value="">Estado...</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <select 
                    disabled={!busquedaEstadoDestino}
                    className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none text-slate-700 disabled:opacity-50"
                    value={busquedaCiudadDestino} 
                    onChange={(e) => setBusquedaCiudadDestino(e.target.value)}>
                    <option value="">Ciudad...</option>
                    {busquedaEstadoDestino && UBICACIONES[busquedaEstadoDestino].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            {/* LISTA DE VIAJES FILTRADA */}
            {viajesReales.filter((v) => {
              const origenOk = (!busquedaEstadoOrigen || v.estadoOrigen === busquedaEstadoOrigen) && (!busquedaCiudadOrigen || v.ciudadOrigen === busquedaCiudadOrigen);
              const destinoOk = (!busquedaEstadoDestino || v.estadoDestino === busquedaEstadoDestino) && (!busquedaCiudadDestino || v.ciudadDestino === busquedaCiudadDestino);
              return origenOk && destinoOk && v.estado !== "finalizado";
            }).map((v) => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-4 rounded-[30px] border flex flex-col gap-3 shadow-sm cursor-pointer hover:border-blue-300 transition-colors text-left">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0"><Car size={20} /></div>
                    <div>
                      <p className="font-black uppercase text-sm text-slate-800">{v.conductor}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculo} • {v.puestos} Puestos Libres</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
                </div>
                
                <div className="bg-slate-50 p-2 rounded-xl flex items-center gap-2 border border-slate-100">
                  <div className="flex flex-col items-center gap-1">
                     <div className="w-2 h-2 rounded-full bg-green-500"></div>
                     <div className="w-0.5 h-3 bg-slate-300"></div>
                     <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <div className="flex flex-col justify-between h-full text-[10px] font-bold text-slate-600 uppercase">
                     <p>{v.ciudadOrigen}, {v.estadoOrigen}</p>
                     <p className="mt-1">{v.ciudadDestino}, {v.estadoDestino}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {viajesReales.filter(v => {
              const origenOk = (!busquedaEstadoOrigen || v.estadoOrigen === busquedaEstadoOrigen) && (!busquedaCiudadOrigen || v.ciudadOrigen === busquedaCiudadOrigen);
              const destinoOk = (!busquedaEstadoDestino || v.estadoDestino === busquedaEstadoDestino) && (!busquedaCiudadDestino || v.ciudadDestino === busquedaCiudadDestino);
              return origenOk && destinoOk && v.estado !== "finalizado";
            }).length === 0 && (
              <p className="text-center text-slate-400 text-xs font-bold py-10 uppercase">No hay viajes disponibles para esta ruta.</p>
            )}
          </div>
        )}

        {vista === "inicio" && modo === "chofer" && (
          <div className="p-6 space-y-4 text-left pb-32">
            {viajeActivo && viajeActivo.estado !== "finalizado" && (
              <div className="bg-blue-600 p-5 rounded-[25px] text-white shadow-xl mb-4 flex justify-between items-center animate-pulse">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-blue-200" />
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-80">Ruta Activa</p>
                    <p className="text-[10px] font-black uppercase italic">{viajeActivo.ciudadOrigen} ➔ {viajeActivo.ciudadDestino}</p>
                  </div>
                </div>
                <button onClick={() => setVista("chat_conductor")} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-md active:scale-95">Ver Chat</button>
              </div>
            )}

            <h2 className="text-lg font-black uppercase italic flex items-center gap-2 text-slate-800">
              <PlusCircle size={20} className="text-green-600" /> Publicar Mi Ruta
            </h2>
            <div className="bg-white p-5 rounded-[30px] border space-y-4 shadow-sm">
              
              {/* ORIGEN CHOFER */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Punto de Partida</p>
                <div className="flex gap-2">
                  <select className="flex-1 bg-white p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none" value={formViaje.estadoOrigen} onChange={(e) => setFormViaje({ ...formViaje, estadoOrigen: e.target.value, ciudadOrigen: "" })}>
                    <option value="">Estado...</option>
                    {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
                  </select>
                  <select disabled={!formViaje.estadoOrigen} className="flex-1 bg-white p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none disabled:opacity-50" value={formViaje.ciudadOrigen} onChange={(e) => setFormViaje({ ...formViaje, ciudadOrigen: e.target.value })}>
                    <option value="">Ciudad...</option>
                    {formViaje.estadoOrigen && UBICACIONES[formViaje.estadoOrigen].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* DESTINO CHOFER */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Punto de Llegada</p>
                <div className="flex gap-2">
                  <select className="flex-1 bg-white p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none" value={formViaje.estadoDestino} onChange={(e) => setFormViaje({ ...formViaje, estadoDestino: e.target.value, ciudadDestino: "" })}>
                    <option value="">Estado...</option>
                    {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
                  </select>
                  <select disabled={!formViaje.estadoDestino} className="flex-1 bg-white p-3 rounded-xl border border-slate-200 font-bold text-xs outline-none disabled:opacity-50" value={formViaje.ciudadDestino} onChange={(e) => setFormViaje({ ...formViaje, ciudadDestino: e.target.value })}>
                    <option value="">Ciudad...</option>
                    {formViaje.estadoDestino && UBICACIONES[formViaje.estadoDestino].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none" placeholder="Auto (Ej: Corolla)" value={formViaje.modeloAuto} onChange={(e) => setFormViaje({ ...formViaje, modeloAuto: e.target.value })} />
                <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none" placeholder="Precio ($)" value={formViaje.precio} onChange={(e) => setFormViaje({ ...formViaje, precio: e.target.value })} />
              </div>
              <textarea className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm h-20 outline-none resize-none" placeholder="Detalles extra (maletas, mascotas...)" value={formViaje.detalles} onChange={(e) => setFormViaje({ ...formViaje, detalles: e.target.value })} />
              <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-[20px] font-black uppercase italic shadow-lg active:scale-95 transition-transform">Publicar Ahora</button>
            </div>
          </div>
        )}

        {vista === "perfil" && (
          <div className="p-6 space-y-6 text-center pb-32">
            <div className="w-24 h-24 bg-blue-600 rounded-[35px] mx-auto flex items-center justify-center text-white shadow-xl relative border-4 border-white">
              <User size={40} />
              <button onClick={() => setEditando(!editando)} className={`absolute -bottom-2 -right-2 p-2 rounded-xl text-white border-2 border-white shadow-md ${editando ? "bg-green-500" : "bg-slate-900"}`}><Edit2 size={14} /></button>
            </div>
            <div className="text-left space-y-4">
              <div className="bg-slate-900 p-6 rounded-[30px] shadow-xl border border-slate-800">
                <p className="text-blue-400 text-[10px] font-black uppercase italic">Billetera Digital</p>
                <p className="text-3xl font-black text-white italic">${Number(userData.saldo).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-[35px] border space-y-4 shadow-sm">
                <input disabled={!editando} className="w-full p-4 rounded-2xl font-bold uppercase text-sm border bg-slate-50 disabled:opacity-70" value={formPerfil.nombre} onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })} />
                <input disabled={!editando} className="w-full p-4 rounded-2xl font-bold text-sm border bg-slate-50 disabled:opacity-70" value={formPerfil.telefono} onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })} />
                {editando && <button onClick={async () => { await updateDoc(doc(db, "usuarios", user.uid), formPerfil); setEditando(false); alert("✅ Perfil actualizado"); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Guardar Cambios</button>}
              </div>
            </div>
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2 italic text-xs active:bg-red-100"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}

        {(vista === "chat_conductor" || vista === "chat_soporte") && (
          <div className="absolute inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-right duration-300">
            <div className={`p-6 pt-12 border-b flex items-center gap-4 shrink-0 ${vista === "chat_soporte" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
              <button onClick={() => setVista("inicio")} className="p-2 bg-slate-100 rounded-full text-slate-900 active:scale-90"><ArrowLeft size={20} /></button>
              <div className="text-left flex-1">
                <p className="font-black uppercase text-sm italic">{vista === "chat_soporte" ? "Soporte RutaCom" : viajeActivo?.conductor}</p>
                <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">• En línea ahora</p>
              </div>
            </div>
            
            {vista === "chat_conductor" && viajeActivo && (
               <div className="bg-slate-900 text-white p-2 text-center text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                 <MapPin size={12} className="text-green-400" /> {viajeActivo.ciudadOrigen} <ArrowLeft size={12} className="rotate-180 text-slate-500"/> {viajeActivo.ciudadDestino}
               </div>
            )}

            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50">
              {(vista === "chat_conductor" ? mensajesConductor : mensajesSoporte).map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[80%] text-left shadow-sm ${m.yo ? "bg-blue-600 text-white ml-auto rounded-tr-none" : "bg-white border rounded-tl-none"}`}>
                  <p className="text-xs font-bold italic">{m.texto}</p>
                </div>
              ))}
            </div>

            {vista === "chat_conductor" && viajeActivo && (
                <div className="px-4 py-3 bg-white border-t flex flex-col gap-2">
                  {estadoViaje === "buscando" && (
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => { await updateDoc(doc(db, "Viajes", viajeActivo.id), { estado: "confirmado" }); }} 
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg active:scale-95 transition-transform">
                        Confirmar Viaje
                      </button>
                      <button onClick={() => { setVista("inicio"); setViajeActivo(null); }} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase italic text-[10px]">
                        Cancelar
                      </button>
                    </div>
                  )}
                  {estadoViaje === "confirmado" && (
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, "Viajes", viajeActivo.id), { estado: "finalizado" });
                        alert("¡Viaje Finalizado! Gracias por usar RutaCom.");
                        setVista("inicio");
                        setViajeActivo(null);
                      }} 
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg animate-bounce">
                      Ya llegué (Finalizar)
                    </button>
                  )}
                </div>
            )}

            <div className="p-4 border-t flex gap-2 bg-white pb-8">
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

      {/* MODAL RESERVA PASAJERO */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[40px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 text-left flex-1">
                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black italic shadow-lg shrink-0">R</div>
                <div className="flex-1 pr-2">
                  <p className="text-xl font-black uppercase text-slate-800 leading-tight">{viajeSeleccionado.conductor}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viajeSeleccionado.vehiculo}</p>
                </div>
              </div>
              <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 shrink-0"><X size={20} /></button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-2 border border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><MapPin size={12}/></div>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase">Origen</p>
                     <p className="text-xs font-black text-slate-700 uppercase">{viajeSeleccionado.ciudadOrigen}, {viajeSeleccionado.estadoOrigen}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><MapPin size={12}/></div>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase">Destino</p>
                     <p className="text-xs font-black text-slate-700 uppercase">{viajeSeleccionado.ciudadDestino}, {viajeSeleccionado.estadoDestino}</p>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Precio Fijo</p>
                <p className="text-xl font-black text-blue-600 italic">${viajeSeleccionado.precio}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Puestos</p>
                <p className="text-xl font-black text-slate-800 italic">{viajeSeleccionado.puestos} Libres</p>
              </div>
            </div>
            
            {viajeSeleccionado.detallesExtras && (
               <div className="text-left bg-orange-50 p-3 rounded-xl border border-orange-100">
                 <p className="text-[9px] font-black text-orange-400 uppercase mb-1">Nota del conductor:</p>
                 <p className="text-xs font-bold text-orange-800 italic">{viajeSeleccionado.detallesExtras}</p>
               </div>
            )}

            <button onClick={() => manejarReserva(viajeSeleccionado)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic shadow-xl active:scale-95 transition-transform text-sm tracking-widest">Reservar Cupo Ahora</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button onClick={() => setVista("inicio")} className={vista === "inicio" ? "flex flex-col items-center gap-1 transition-colors text-blue-600" : "flex flex-col items-center gap-1 transition-colors text-slate-400"}>
          <Car size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Rutas</span>
        </button>
        <button onClick={() => setVista("chat_soporte")} className={vista === "chat_soporte" ? "flex flex-col items-center gap-1 transition-colors text-blue-600" : "flex flex-col items-center gap-1 transition-colors text-slate-400"}>
          <Headset size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Soporte</span>
        </button>
        <button onClick={() => setVista("perfil")} className={vista === "perfil" ? "flex flex-col items-center gap-1 transition-colors text-blue-600" : "flex flex-col items-center gap-1 transition-colors text-slate-400"}>
          <User size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
