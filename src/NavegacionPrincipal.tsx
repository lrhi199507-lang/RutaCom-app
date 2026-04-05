import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, limit, where, updateDoc
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  Camera, CheckCircle, MessageSquare, Navigation, Search, 
  Dog, Snowflake, Star, ArrowUpRight, ArrowDownLeft, Trash2, 
  MessageCircle, Settings, ChevronRight
} from "lucide-react";

// --- DICCIONARIO DE VENEZUELA COMPLETO (Mismo estilo que Chófer) ---
const UBICACIONES = {
  "Carabobo": ["Valencia", "Naguanagua", "Guacara"], 
  "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Distrito Capital": ["Caracas"],
  "Zulia": ["Maracaibo"],
  "Lara": ["Barquisimeto"]
};
const ESTADOS = Object.keys(UBICACIONES);

// --- COMPONENTE PANTALLA LOGIN ---
export function PantallaLogin() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const manejarLogin = async (e: any) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, correo, contrasena);
    } catch (err: any) { alert("Error al entrar. Revisa tus datos."); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center px-8 font-sans justify-center">
      <div className="w-20 h-20 bg-blue-600 rounded-[25px] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">
        <span className="text-6xl transform -skew-x-12">D</span>
      </div>
      <h1 className="text-white text-4xl font-black italic mt-6 tracking-tighter">DameLaCola</h1>
      <form onSubmit={manejarLogin} className="w-full mt-10 space-y-3">
        <input type="email" placeholder="Email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        <input type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl text-white font-black uppercase text-xs mt-4">Entrar</button>
      </form>
    </div>
  );
}
export function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState<"pasajero" | "chofer">("pasajero");
  const [chatOpen, setChatOpen] = useState(false);
  const [msgChat, setMsgChat] = useState("");
  const [viajes, setViajes] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [configVehiculo, setConfigVehiculo] = useState(false);
  
  // Publicador y Buscador
  const [form, setForm] = useState({ 
    eOrig: "", cOrig: "", eDest: "", cDest: "", 
    precio: "", puestos: "4", extras: "" 
  });
  const [busqueda, setBusqueda] = useState({ eO: "", cO: "" });
  const [resultados, setResultados] = useState<any[]>([]);

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
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setViajes(lista);
      setResultados(lista);
    });
  }, []);

  const publicarRuta = async () => {
    if (!form.cOrig || !form.cDest || !form.precio) return alert("Llena los campos");
    try {
      // --- CORRECCIÓN DE PUBLICACIÓN ---
      await addDoc(collection(db, "Viajes"), {
        ...form,
        conductor: userData?.nombre || "Usuario",
        conductorId: user.uid,
        fecha: serverTimestamp(), // Ahora usamos directamente serverTimestamp()
        verificado: userData?.kycVerificado || false
      });
      alert("🚀 ¡Ruta publicada!");
      setForm({ eOrig: "", cOrig: "", eDest: "", cDest: "", precio: "", puestos: "4", extras: "" });
      setVista("inicio");
    } catch (e) { alert("Error al conectar con la base de datos."); }
  };

  const enviarASoporte = () => {
    if (!msgChat.trim()) return;
    alert("Mensaje enviado al soporte técnico: " + msgChat);
    setMsgChat("");
  };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic">CARGANDO...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col font-sans overflow-hidden relative">
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic transform -skew-x-6 text-xl">D</div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic">{userData.nombre}</p></div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2"><Wallet size={14} className="text-blue-400" /><span className="text-xs font-black italic">${userData.saldo?.toFixed(2)}</span></div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {vista === "inicio" && (
          <div className="space-y-4">
            <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-600 text-blue-600 bg-white">CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}</button>

            {modo === "chofer" ? (
              <div className="bg-white p-6 rounded-[35px] border-2 border-blue-50 shadow-xl space-y-3">
                <h3 className="text-xs font-black uppercase text-blue-600 flex items-center gap-2 italic"><Navigation size={16}/> Configurar Viaje</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.eOrig} onChange={(e)=>setForm({...form, eOrig: e.target.value})}><option value="">Estado Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                  <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.cOrig} onChange={(e)=>setForm({...form, cOrig: e.target.value})}><option value="">Ciudad Origen</option>{form.eOrig && UBICACIONES[form.eOrig].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <input type="number" placeholder="Precio $" className="w-full bg-slate-50 p-4 rounded-2xl border text-xs font-bold outline-none" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all">Publicar Ahora</button>
              </div>
            ) : (
              <div className="space-y-4">
                 {/* BUSCADOR PARA PASAJERO AUTOMATIZADO */}
                 <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar Destino</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={busqueda.eO} onChange={(e)=>setBusqueda({...busqueda, eO: e.target.value})}><option value="">Estado</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={busqueda.cO} onChange={(e)=>setBusqueda({...busqueda, cO: e.target.value})}><option value="">Ciudad</option>{busqueda.eO && UBICACIONES[busqueda.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {resultados.map(v => (
                      <div key={v.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">{v.verificado && <ShieldCheck size={12} className="text-blue-500" />}<p className="text-[10px] font-black text-slate-400 uppercase italic">{v.conductor}</p></div>
                          <p className="font-black uppercase text-xs text-slate-800 leading-tight">{v.cOrig} → {v.cDest}</p>
                        </div>
                        <div className="text-right"><p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p><button onClick={() => setViajeSeleccionado(v)} className="mt-2 text-[9px] bg-slate-900 text-white px-4 py-2 rounded-full font-black uppercase">Ver</button></div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}
        {/* VISTA PERFIL COMPLETA CON VEHÍCULO Y KYC */}
        {vista === "perfil" && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md relative">
                   <User size={40} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white"><CheckCircle size={12} className="text-white"/></div>}
                </div>
                <div className="flex items-center gap-1 text-yellow-500 mb-1"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                <h2 className="font-black italic text-slate-800 uppercase leading-none">{userData.nombre}</h2>
             </div>

             {/* Billetera Funcional */}
             <div className="bg-slate-900 p-6 rounded-[35px] text-white space-y-4 shadow-xl">
                <div className="flex justify-between items-center text-blue-400 uppercase font-black text-[10px] italic"><span>Mi Balance</span><Wallet size={18} /></div>
                <h1 className="text-4xl font-black italic tracking-tighter">${userData.saldo?.toFixed(2)}</h1>
                <div className="flex gap-2 pt-2">
                   <button className="flex-1 bg-blue-600 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1"><ArrowUpRight size={14}/> Recargar</button>
                   <button className="flex-1 bg-slate-800 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1"><ArrowDownLeft size={14}/> Retirar</button>
                </div>
             </div>

             {/* Registro de Vehículo Visible */}
             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-3">
                <h3 className="text-xs font-black uppercase italic text-slate-800 flex items-center gap-2"><Car size={16}/> Mi Vehículo</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase italic">
                   <div className="bg-slate-50 p-4 rounded-xl"><p className="text-[8px] text-slate-400 mb-1 font-bold">Modelo</p>{userData.vehiculo?.marca || "Pendiente"}</div>
                   <div className="bg-slate-50 p-4 rounded-xl"><p className="text-[8px] text-slate-400 mb-1 font-bold">Matrícula</p>{userData.vehiculo?.placa || "---"}</div>
                </div>
             </div>

             {/* Seguridad / KYC Robustecida (Licencia Incluida) */}
             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase italic text-slate-800 flex items-center gap-2"><ShieldCheck size={16}/> Seguridad KYC</h3><ChevronRight size={16} className="text-slate-300" /></div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase italic">
                   <div className="bg-blue-50/50 p-4 rounded-xl flex items-center gap-3"><Camera size={18} className="text-blue-600" /><p className="leading-tight">Cédula<br/>Cargada</p></div>
                   <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3"><Navigation size={18} className="text-slate-300" /><p className="leading-tight">Licencia<br/>Pendiente</p></div>
                </div>
             </div>

             <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic tracking-widest"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}
      </main>

      {/* CHAT BURBUJA SOPORTE FINA Y FUNCIONAL */}
      <div className="fixed bottom-28 right-6 z-50">
        {chatOpen && (
          <div className="bg-white w-80 h-[400px] mb-4 rounded-[30px] shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center font-black italic uppercase text-xs"><span>Soporte Técnico</span><button onClick={() => setChatOpen(false)}><X size={20}/></button></div>
            <div className="flex-1 p-4 bg-slate-50 text-[11px] font-bold text-slate-600 italic leading-relaxed">¡Hola {userData.nombre}! 👋 Escribe tu duda aquí y un agente te responderá lo más rápido posible.</div>
            <div className="p-4 bg-white border-t flex gap-2"><input type="text" placeholder="Escribe..." value={msgChat} onChange={(e)=>setMsgChat(e.target.value)} className="flex-1 bg-slate-100 p-3 rounded-xl text-[11px] font-bold outline-none" /><button onClick={enviarASoporte} className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200"><Send size={16}/></button></div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white"><MessageSquare size={28} /></button>
      </div>

      {/* NAVBAR INFERIOR FIJO CON SOPORTE */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixes bottom-0 w-full max-w-md shadow-[0_-5px_15px_rgba(0,0,0,0.02)] fixedbottom">
        <button onClick={() => { setVista("inicio"); setViajeSeleccionado(null); }} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={24} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => setChatOpen(true)} className="flex flex-col items-center gap-1 text-slate-300"><MessageSquare size={24} /><span className="text-[9px] font-black uppercase italic">Soporte</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={24} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}

export default NavegacionPrincipal;
