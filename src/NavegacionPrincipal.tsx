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
// DICCIONARIO DE VENEZUELA (TU LÓGICA PERFECTA)
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
// PANTALLA DE INICIO (NUEVO BRANDING)
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
      <div className="pt-32 flex flex-col items-center">
        <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-white font-black italic shadow-2xl border-4 border-white/5">
          <span className="text-white text-7xl transform -skew-x-6">D</span>
        </div>
        <h1 className="text-white text-5xl font-extrabold italic mt-10 tracking-tight">DameLaCola</h1>
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] mt-2 font-black">Tu cola de confianza</p>
      </div>

      <form onSubmit={manejarLogin} className="w-full mt-16 space-y-4 text-left">
        <input 
          type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)}
          className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white text-sm outline-none focus:border-blue-600 transition-all"
        />
        <input 
          type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)}
          className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white text-sm outline-none focus:border-blue-600 transition-all"
        />
        <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl text-white font-black uppercase text-xs tracking-wider mt-8 flex items-center justify-center gap-2">
          <LogIn size={16}/> Entrar a la App
        </button>
      </form>
    </div>
  );
}
function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState({ estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "" });
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>({ nombre: "", saldo: 0, kycVerificado: false, vehiculo: { marca: "", modelo: "", placa: "" } });
  
  const [formViaje, setFormViaje] = useState({
    estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "", precio: "", puestos: "4"
  });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => {
      setViajesReales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const publicarViaje = async () => {
    if (!formViaje.ciudadOrigen || !formViaje.ciudadDestino || !formViaje.precio) return alert("⚠️ Completa los campos.");
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Usuario",
        origen: `${formViaje.estadoOrigen}, ${formViaje.ciudadOrigen}`,
        destino: `${formViaje.estadoDestino}, ${formViaje.ciudadDestino}`,
        precio: Number(formViaje.precio),
        idCreador: user.uid,
        fecha: serverTimestamp(),
      });
      alert("✅ Cola publicada.");
      setVista("inicio");
    } catch (e) { alert("❌ Error al publicar."); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6">D</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase italic">DameLaCola {modo}</p>
            <p className="text-xs font-bold uppercase text-slate-800">{userData.nombre || "Usuario"}</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
          <Wallet size={12} className="text-blue-400" />
          <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {vista === "inicio" && (
          <div className="p-6 space-y-4">
            <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-2 rounded-xl text-[10px] font-black uppercase border bg-blue-50 text-blue-600 mb-2">
              Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
            </button>
            {/* LÓGICA DE BÚSQUEDA Y LISTA DE VIAJES AQUÍ */}
            <p className="text-[10px] font-black text-slate-400 uppercase text-left ml-2">Colas Disponibles</p>
            {viajesReales.map((v) => (
              <div key={v.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm text-left">
                <div>
                  <p className="text-[9px] font-black text-blue-600 uppercase italic">{v.origen} → {v.destino}</p>
                  <p className="font-black uppercase text-sm text-slate-800">{v.conductor}</p>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center ${vista === "inicio" ? "text-blue-600" : "text-slate-400"}`}><Car size={24} /><span className="text-[9px] font-black uppercase">Colas</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center ${vista === "perfil" ? "text-blue-600" : "text-slate-400"}`}><User size={24} /><span className="text-[9px] font-black uppercase">Perfil</span></button>
      </nav>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
      setCargando(false);
    });
  }, []);

  if (cargando) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black italic">Iniciando DameLaCola...</div>;
  return user ? <NavegacionPrincipal user={user} /> : <PantallaLogin />;
}
