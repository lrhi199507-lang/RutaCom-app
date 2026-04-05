import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc, onSnapshot, updateDoc, collection, query, addDoc, 
  serverTimestamp, orderBy, where, getDocs, limit
} from "firebase/firestore";
import {
  Search, Wallet, User, LogOut, Car, X, Send, ArrowLeft, Edit2, 
  Headset, PlusCircle, ShieldCheck, Camera, CheckCircle, MapPin, 
  ChevronRight, Luggage, Info, MessageSquare, Star, CreditCard, 
  ArrowUpRight, ArrowDownLeft, Trash2, ShieldAlert
} from "lucide-react";

// --- DICCIONARIO DE VENEZUELA COMPLETO ---
const UBICACIONES: Record<string, string[]> = {
  "Amazonas": ["Puerto Ayacucho", "San Fernando de Atabapo"],
  "Anzoátegui": ["Puerto La Cruz", "Barcelona", "Lechería", "El Tigre", "Anaco"],
  "Apure": ["San Fernando de Apure", "Guasdualito"],
  "Aragua": ["Maracay", "Turmero", "La Victoria", "Cagua"],
  "Barinas": ["Barinas", "Socopó"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar", "Upata"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego", "Puerto Cabello", "Los Guayos"],
  "Cojedes": ["San Carlos", "Tinaquillo"],
  "Delta Amacuro": ["Tucupita"],
  "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo", "Tucacas"],
  "Guárico": ["San Juan de los Morros", "Valle de la Pascua", "Calabozo"],
  "Lara": ["Barquisimeto", "Cabudare", "Carora"],
  "La Guaira": ["La Guaira", "Maiquetía", "Catia La Mar"],
  "Mérida": ["Mérida", "El Vigía", "Ejido"],
  "Miranda": ["Los Teques", "Guarenas", "Guatire", "Charallave", "Chacao", "Baruta"],
  "Monagas": ["Maturín", "Punta de Mata"],
  "Nueva Esparta": ["Porlamar", "Pampatar", "La Asunción"],
  "Portuguesa": ["Acarigua", "Guanare"],
  "Sucre": ["Cumaná", "Carúpano"],
  "Táchira": ["San Cristóbal", "Táriba", "San Antonio"],
  "Trujillo": ["Valera", "Trujillo", "Boconó"],
  "Yaracuy": ["San Felipe", "Yaritagua"],
  "Zulia": ["Maracaibo", "San Francisco", "Cabimas", "Ciudad Ojeda"]
};

const ESTADOS = Object.keys(UBICACIONES);

export function PantallaLogin() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const manejarLogin = async (e: any) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, correo, contrasena);
    } catch (err: any) {
      setError("Credenciales incorrectas.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center px-8 font-sans text-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center text-white font-black italic shadow-[0_0_50px_rgba(37,99,235,0.3)]">
          <span className="text-7xl transform -skew-x-12">D</span>
        </div>
        <h1 className="text-white text-5xl font-black italic mt-8 tracking-tighter">DameLaCola</h1>
        <p className="text-blue-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">Tu cola de confianza</p>
      </div>
      <form onSubmit={manejarLogin} className="w-full mt-12 space-y-3">
        <input type="email" placeholder="Email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        <input type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl text-white font-black uppercase text-xs mt-6 shadow-xl active:scale-95 transition-transform">Iniciar Sesión</button>
      </form>
    </div>
  );
}
export function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState<"pasajero" | "chofer">("pasajero");
  const [chatOpen, setChatOpen] = useState(false);
  const [viajes, setViajes] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [form, setForm] = useState({ eOrig: "", cOrig: "", eDest: "", cDest: "", precio: "", puestos: "4", maletas: "Pequeñas" });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"), limit(20));
    return onSnapshot(q, (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const publicarRuta = async () => {
    if (!form.cOrig || !form.cDest || !form.precio) return alert("Llena los campos");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form,
        conductor: userData?.nombre || "Usuario",
        conductorId: user.uid,
        fecha: serverTimestamp(),
        verificado: userData?.kycVerificado || false
      });
      alert("¡Ruta publicada!");
      setVista("inicio");
    } catch (e) { alert("Error al publicar"); }
  };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic uppercase">Cargando DameLaCola...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col font-sans overflow-hidden relative">
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic transform -skew-x-6 shadow-lg text-xl">D</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Modo {modo}</p>
            <p className="text-sm font-black text-slate-800 italic">{userData.nombre}</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2">
          <Wallet size={14} className="text-blue-400" />
          <span className="text-xs font-black italic">${userData.saldo?.toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {vista === "inicio" && (
          <div className="space-y-4">
             <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-600 text-blue-600 bg-white shadow-md">
                CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}
             </button>

             {modo === "chofer" ? (
               <div className="bg-white p-6 rounded-[35px] border-2 border-blue-50 shadow-xl space-y-4">
                  <h3 className="text-xs font-black uppercase italic text-blue-600 flex items-center gap-2"><Car size={16}/> Configurar mi viaje</h3>
                  <div className="space-y-2">
                    <select className="w-full bg-slate-50 p-4 rounded-2xl border text-xs font-bold outline-none" value={form.eOrig} onChange={(e)=>setForm({...form, eOrig: e.target.value, cOrig: ""})}>
                      <option value="">Estado Origen</option>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select className="w-full bg-slate-50 p-4 rounded-2xl border text-xs font-bold outline-none" disabled={!form.eOrig} value={form.cOrig} onChange={(e)=>setForm({...form, cOrig: e.target.value})}>
                      <option value="">Ciudad Origen</option>
                      {form.eOrig && UBICACIONES[form.eOrig].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Precio $" className="flex-1 bg-slate-50 p-4 rounded-2xl border text-xs font-bold" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                      <select className="bg-slate-50 p-4 rounded-2xl border text-xs font-bold" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})}>
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n.toString()}>{n} Puestos</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Ahora</button>
               </div>
             ) : (
               <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Rutas activas en Venezuela</p>
                 {viajes.map(v => (
                   <div key={v.id} className="bg-white p-5 rounded-[30px] border border-slate-100 flex justify-between items-center shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                           {v.verificado && <ShieldCheck size={12} className="text-blue-500" />}
                           <p className="text-[10px] font-black text-slate-400 uppercase italic">{v.conductor}</p>
                        </div>
                        <p className="font-black uppercase text-xs text-slate-800 leading-tight">{v.cOrig} → {v.cDest}</p>
                        <div className="flex gap-3 mt-1 text-[9px] font-bold text-blue-600">
                          <span className="flex items-center gap-1"><User size={10}/> {v.puestos} puestos</span>
                          <span className="flex items-center gap-1"><Luggage size={10}/> {v.maletas}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p>
                        <button className="mt-2 text-[9px] bg-slate-900 text-white px-3 py-1.5 rounded-full font-black uppercase">Ver</button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
        {vista === "perfil" && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md relative">
                   <User size={40} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white"><CheckCircle size={12} className="text-white"/></div>}
                </div>
                <h2 className="font-black italic text-slate-800 uppercase">{userData.nombre}</h2>
                <p className="text-[10px] font-bold text-slate-400">{userData.email}</p>
             </div>

             <div className="bg-slate-900 p-6 rounded-[35px] text-white space-y-4 shadow-xl">
                <div className="flex justify-between items-center text-blue-400 uppercase font-black text-[10px] italic"><span>Balance Disponible</span><Wallet size={18} /></div>
                <h1 className="text-4xl font-black italic">${userData.saldo?.toFixed(2)}</h1>
                <div className="flex gap-2">
                   <button className="flex-1 bg-blue-600 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1"><ArrowUpRight size={14}/> Recargar</button>
                   <button className="flex-1 bg-slate-800 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1"><ArrowDownLeft size={14}/> Retirar</button>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-3">
                <h3 className="text-xs font-black uppercase italic text-slate-800 flex items-center gap-2"><Car size={16}/> Mi Vehículo</h3>
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase">Marca/Modelo</p><p className="text-[11px] font-black uppercase italic">{userData.vehiculo?.marca || "Pendiente"}</p></div>
                   <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase">Placa</p><p className="text-[11px] font-black uppercase italic">{userData.vehiculo?.placa || "---"}</p></div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-3">
                <h3 className="text-xs font-black uppercase italic text-slate-800 flex items-center gap-2"><ShieldCheck size={16}/> Seguridad KYC</h3>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
                   <div className="flex items-center gap-3"><Camera size={20} className="text-blue-600" /><p className="text-[10px] font-black uppercase italic tracking-tighter">Identidad Verificada</p></div>
                   {userData.kycVerificado ? <CheckCircle className="text-green-500" /> : <ChevronRight size={16} />}
                </div>
             </div>

             <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic tracking-widest"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}
      </main>

      <div className="fixed bottom-28 right-6 z-50">
        {chatOpen && (
          <div className="bg-white w-80 h-[450px] mb-4 rounded-[30px] shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center font-black italic uppercase text-xs"><span>Soporte DameLaCola</span><button onClick={() => setChatOpen(false)}><X size={20}/></button></div>
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 text-xs font-bold text-slate-600">¡Hola {userData.nombre}! 👋 ¿En qué podemos ayudarte con tu cola hoy?</div>
            <div className="p-4 bg-white border-t flex gap-2"><input type="text" placeholder="Escribe..." className="flex-1 bg-slate-100 p-3 rounded-xl text-[11px] font-bold outline-none" /><button className="bg-blue-600 p-3 rounded-xl text-white shadow-lg"><Send size={16}/></button></div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white"><MessageSquare size={28} /></button>
      </div>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 shrink-0 fixed bottom-0 w-full max-w-md shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600 scale-110" : "text-slate-300"} transition-all`}><Car size={24} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-300"} transition-all`}><User size={24} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}

export default NavegacionPrincipal;
