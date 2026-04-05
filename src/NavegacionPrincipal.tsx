import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import {
  doc, onSnapshot, updateDoc, collection, query, addDoc, 
  serverTimestamp, orderBy
} from "firebase/firestore";
import {
  Search, Wallet, User, LogOut, Car, X, Send, ArrowLeft, Edit2, 
  Headset, PlusCircle, ShieldCheck, Camera, CheckCircle, MapPin, 
  ChevronRight, Luggage, Info, MessageSquare, Star, ArrowUpRight, ArrowDownLeft, LogIn
} from "lucide-react";

// ==========================================
// DICCIONARIO DE UBICACIONES (VENEZUELA)
// ==========================================
const UBICACIONES = {
  "Amazonas": ["Puerto Ayacucho", "San Fernando de Atabapo"],
  "Anzoátegui": ["Puerto La Cruz", "Barcelona", "Lechería", "El Tigre", "Anaco", "Cantaura"],
  "Apure": ["San Fernando de Apure", "Guasdualito", "Elorza"],
  "Aragua": ["Maracay", "Turmero", "La Victoria", "Cagua", "El Limón", "Palo Negro", "Villa de Cura"],
  "Barinas": ["Barinas", "Socopó", "Santa Bárbara"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar", "Upata", "Caicara del Orinoco"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego", "Puerto Cabello", "Los Guayos", "Mariara", "Morón"],
  "Cojedes": ["San Carlos", "Tinaquillo", "El Pao"],
  "Delta Amacuro": ["Tucupita", "Pedernales"],
  "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo", "Tucacas", "Dabajuro"],
  "Guárico": ["San Juan de los Morros", "Valle de la Pascua", "Calabozo", "Zaraza"],
  "Lara": ["Barquisimeto", "Cabudare", "Carora", "El Tocuyo", "Quíbor"],
  "La Guaira": ["La Guaira", "Maiquetía", "Catia La Mar", "Macuto", "Caraballeda"],
  "Mérida": ["Mérida", "Ejido", "El Vigía", "Tovar", "Mucuchíes"],
  "Miranda": ["Los Teques", "Guarenas", "Guatire", "Cúa", "Charallave", "Ocumare del Tuy", "Petare", "Baruta", "Chacao", "El Hatillo"],
  "Monagas": ["Maturín", "Punta de Mata", "Caripe"],
  "Nueva Esparta": ["Porlamar", "Pampatar", "La Asunción", "Juan Griego"],
  "Portuguesa": ["Acarigua", "Guanare", "Araure", "Turén"],
  "Sucre": ["Cumaná", "Carúpano", "Güiria"],
  "Táchira": ["San Cristóbal", "Táriba", "Rubio", "San Antonio", "La Grita"],
  "Trujillo": ["Valera", "Trujillo", "Boconó"],
  "Yaracuy": ["San Felipe", "Yaritagua", "Chivacoa", "Nirgua"],
  "Zulia": ["Maracaibo", "San Francisco", "Cabimas", "Ciudad Ojeda", "Machiques"]
};

const ESTADOS = Object.keys(UBICACIONES);

// ==========================================
// COMPONENTE 1: PANTALLA DE INICIO (LOGIN)
// ==========================================
function PantallaLogin() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !contrasena) return alert("⚠️ Ingresa tus credenciales.");
    try {
      await signInWithEmailAndPassword(auth, correo, contrasena);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center px-6 font-sans text-center">
      <div className="pt-32 flex flex-col items-center animate-in zoom-in duration-500">
        {/* LOGO "D" NUEVO */}
        <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-white font-black italic shadow-2xl border-4 border-white/5">
          <span className="text-white text-7xl transform -skew-x-6">D</span>
        </div>
        {/* NOMBRE NUEVO */}
        <h1 className="text-white text-5xl font-extrabold italic mt-10 tracking-tight">DameLaCola</h1>
        {/* ESLOGAN NUEVO */}
        <p className="text-slate-400 text-xs uppercase tracking-[0.3em] mt-2 font-bold">Tu cola de confianza</p>
      </div>

      <form onSubmit={manejarLogin} className="w-full mt-16 space-y-4 text-left">
        <input 
          type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)}
          className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white placeholder:text-slate-600 text-sm outline-none focus:border-blue-600 transition-all"
        />
        <input 
          type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
          className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white placeholder:text-slate-600 text-sm outline-none focus:border-blue-600 transition-all"
        />
        <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl text-white font-extrabold uppercase text-xs tracking-wider mt-8 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
          <LogIn size={16}/> Entrar a la App
        </button>
      </form>

      <div className="mt-10 pb-12">
        <p className="text-slate-500 text-xs font-bold italic">Uniendo destinos con seguridad</p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE 2: NAVEGACIÓN PRINCIPAL
// ==========================================
function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [editando, setEditando] = useState(false);
  const [verificandoKYC, setVerificandoKYC] = useState(false);
  
  const [busqueda, setBusqueda] = useState({ estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "" });
  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);

  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  
  const [userData, setUserData] = useState<any>({ 
    nombre: "", saldo: 0, telefono: "", kycVerificado: false, estrellas: 5.0, tiempoApp: "1 mes",
    vehiculo: { marca: "", modelo: "", placa: "", color: "" }
  });
  
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });
  const [formVehiculo, setFormVehiculo] = useState({ marca: "", modelo: "", placa: "", color: "" });
  const [formViaje, setFormViaje] = useState({
    estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "",
    precio: "", puestos: "4", kilosMaleta: "20", aceptaMaleta: true, detallesExtras: ""
  });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (!editando) {
          setFormPerfil({ nombre: data.nombre || "", telefono: data.telefono || "" });
          setFormVehiculo(data.vehiculo || { marca: "", modelo: "", placa: "", color: "" });
        }
      }
    });
  }, [user, editando]);

  useEffect(() => {
    const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => {
      setViajesReales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const publicarViaje = async () => {
    if (!formViaje.ciudadOrigen || !formViaje.ciudadDestino || !formViaje.precio) {
      return alert("⚠️ Completa los campos básicos.");
    }
    if (!userData.vehiculo?.placa) {
      return alert("⚠️ Registra tu placa en el Perfil.");
    }
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Conductor",
        estrellasConductor: userData.estrellas || 5.0,
        tiempoConductor: userData.tiempoApp || "Nuevo",
        origen: `${formViaje.estadoOrigen}, ${formViaje.ciudadOrigen}`,
        destino: `${formViaje.estadoDestino}, ${formViaje.ciudadDestino}`,
        precio: Number(formViaje.precio),
        vehiculoCompleto: `${userData.vehiculo.marca} ${userData.vehiculo.modelo}`,
        puestosDisponibles: Number(formViaje.puestos),
        kilosMaleta: Number(formViaje.kilosMaleta),
        aceptaMaleta: formViaje.aceptaMaleta,
        detallesExtras: formViaje.detallesExtras || "Sin detalles.",
        idCreador: user.uid,
        fecha: serverTimestamp(),
      });
      alert("✅ Cola publicada.");
      setModo("pasajero");
    } catch (e: any) { alert(`❌ Error: ${e.message}`); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER: DameLaCola */}
      {!["chat_conductor", "chat_soporte"].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg text-xl transform -skew-x-6">D</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">DameLaCola {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1">
                  {userData.nombre || "Usuario"} 
                  {userData.kycVerificado && <CheckCircle size={10} className="text-blue-500 fill-blue-500"/>}
                </p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${modo === "pasajero" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-100"}`}>
            Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-32">
        {/* VISTA INICIO */}
        {vista === "inicio" && (
          <div className="p-6 space-y-4">
            {modo === "pasajero" && (
               <div className="bg-white p-5 rounded-[25px] border shadow-sm space-y-3 text-left">
                 <p className="text-[9px] font-black text-slate-400 uppercase ml-1 italic">¿A dónde vamos hoy?</p>
                 <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={busqueda.estadoOrigen} onChange={(e) => setBusqueda({...busqueda, estadoOrigen: e.target.value, ciudadOrigen: ""})}>
                     <option value="">Estado Origen</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!busqueda.estadoOrigen} value={busqueda.ciudadOrigen} onChange={(e) => setBusqueda({...busqueda, ciudadOrigen: e.target.value})}>
                     <option value="">Ciudad Origen</option>
                     {busqueda.estadoOrigen && (UBICACIONES as any)[busqueda.estadoOrigen]?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={busqueda.estadoDestino} onChange={(e) => setBusqueda({...busqueda, estadoDestino: e.target.value, ciudadDestino: ""})}>
                     <option value="">Estado Destino</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!busqueda.estadoDestino} value={busqueda.ciudadDestino} onChange={(e) => setBusqueda({...busqueda, ciudadDestino: e.target.value})}>
                     <option value="">Ciudad Destino</option>
                     {busqueda.estadoDestino && (UBICACIONES as any)[busqueda.estadoDestino]?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
               </div>
            )}

            {modo === "chofer" && (
              <div className="bg-white p-6 rounded-[35px] border border-green-100 shadow-sm space-y-4 text-left">
                <h3 className="text-sm font-black uppercase italic text-green-600 flex items-center gap-2"><PlusCircle size={18}/> Ofrecer una Cola</h3>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.estadoOrigen} onChange={(e) => setFormViaje({...formViaje, estadoOrigen: e.target.value, ciudadOrigen: ""})}>
                     <option value="">Origen</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!formViaje.estadoOrigen} value={formViaje.ciudadOrigen} onChange={(e) => setFormViaje({...formViaje, ciudadOrigen: e.target.value})}>
                     <option value="">Ciudad</option>
                     {formViaje.estadoOrigen && (UBICACIONES as any)[formViaje.estadoOrigen]?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.estadoDestino} onChange={(e) => setFormViaje({...formViaje, estadoDestino: e.target.value, ciudadDestino: ""})}>
                     <option value="">Destino</option>
                     {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                   </select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!formViaje.estadoDestino} value={formViaje.ciudadDestino} onChange={(e) => setFormViaje({...formViaje, ciudadDestino: e.target.value})}>
                     <option value="">Ciudad</option>
                     {formViaje.estadoDestino && (UBICACIONES as any)[formViaje.estadoDestino]?.map((c: string) => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <input type="number" placeholder="Precio $" className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.precio} onChange={(e) => setFormViaje({...formViaje, precio: e.target.value})} />
                   <input type="number" placeholder="Asientos" className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={formViaje.puestos} onChange={(e) => setFormViaje({...formViaje, puestos: e.target.value})} />
                </div>
                <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase italic shadow-lg text-xs">Ofrecer Cola Ahora</button>
              </div>
            )}

            <p className="text-[10px] font-black text-slate-400 uppercase text-left ml-2 mt-4">Colas en tu Zona</p>
            {viajesReales.filter(v => 
              (!busqueda.estadoOrigen || v.origen?.includes(busqueda.estadoOrigen)) &&
              (!busqueda.estadoDestino || v.destino?.includes(busqueda.estadoDestino))
            ).map((v) => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm cursor-pointer hover:border-blue-400 transition-all text-left">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100"><Car size={22} /></div>
                  <div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase italic">{v.origen} <ChevronRight size={8}/> {v.destino}</div>
                    <p className="font-black uppercase text-sm text-slate-800">{v.conductor}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculoCompleto}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}

        {/* PERFIL */}
        {vista === "perfil" && (
          <div className="p-6 space-y-6 pb-32 text-left">
            <div className="bg-white rounded-[35px] border p-6 flex flex-col items-center shadow-sm relative">
              <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-white shadow-xl relative border-4 border-white mb-3">
                <User size={40} />
              </div>
              <p className="font-black uppercase text-lg italic text-slate-800">{userData.nombre || "Sin Nombre"}</p>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{userData.tiempoApp} en la app</span>
            </div>

            <div className="bg-slate-900 p-6 rounded-[35px] shadow-xl text-left">
              <p className="text-blue-400 text-[10px] font-black uppercase italic">Billetera</p>
              <p className="text-4xl font-black text-white italic mb-4">${Number(userData.saldo).toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-3">
                 <button className="bg-blue-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] italic shadow-lg">Recargar</button>
                 <button className="bg-slate-800 text-white py-3 rounded-2xl font-black uppercase text-[10px] italic border border-slate-700">Retirar</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase italic">Mis Datos</h3>
                 <button onClick={() => setEditando(!editando)} className="p-2 bg-slate-100 rounded-xl text-slate-600"><Edit2 size={14}/></button>
               </div>
               <input disabled={!editando} className="w-full p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Nombre" value={formPerfil.nombre} onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })} />
               <input disabled={!editando} className="w-full p-4 rounded-xl font-bold text-sm border bg-slate-50 outline-none" placeholder="Teléfono" value={formPerfil.telefono} onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })} />
               {!userData.kycVerificado && (
                  <button onClick={() => setVerificandoKYC(true)} className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 border border-red-100"><ShieldCheck size={14}/> Verificar con KYC</button>
               )}
            </div>

            {editando && (
              <button onClick={async () => { 
                await updateDoc(doc(db, "usuarios", user.uid), { ...formPerfil, vehiculo: formVehiculo }); 
                setEditando(false); 
                alert("✅ Datos guardados."); 
              }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg text-xs">Guardar Cambios</button>
            )}

            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 text-xs italic">Cerrar Sesión</button>
          </div>
        )}
      </main>

      {/* NAVBAR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-400"}`}>
          <Car size={24} /><span className="text-[9px] font-black uppercase">Colas</span>
        </button>
        <button onClick={() => setVista("chat_soporte")} className={`flex flex-col items-center gap-1 ${vista === "chat_soporte" ? "text-blue-600" : "text-slate-400"}`}>
          <Headset size={24} /><span className="text-[9px] font-black uppercase">Ayuda</span>
        </button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-400"}`}>
          <User size={24} /><span className="text-[9px] font-black uppercase">Perfil</span>
        </button>
      </nav>
    </div>
  );
}

// ==========================================
// COMPONENTE EXPORTADO (RAÍZ)
// ==========================================
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
      setCargando(false);
    });
  }, []);

  if (cargando) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black italic">Cargando DameLaCola...</div>;

  return user ? <NavegacionPrincipal user={user} /> : <PantallaLogin />;
}
