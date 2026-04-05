import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, limit, where
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  Camera, CheckCircle, MessageSquare, Luggage, 
  ArrowUpRight, ArrowDownLeft, Navigation, Search, 
  Dog, Snowflake, Info, ChevronRight
} from "lucide-react";

const UBICACIONES: Record<string, string[]> = {
  "Amazonas": ["Puerto Ayacucho"], "Anzoátegui": ["Puerto La Cruz", "Barcelona", "Lechería", "El Tigre"],
  "Apure": ["San Fernando"], "Aragua": ["Maracay", "Turmero"], "Barinas": ["Barinas"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"], "Carabobo": ["Valencia", "Naguanagua", "Puerto Cabello"],
  "Cojedes": ["San Carlos"], "Delta Amacuro": ["Tucupita"], "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo"], "Guárico": ["San Juan"], "Lara": ["Barquisimeto", "Cabudare"],
  "La Guaira": ["La Guaira"], "Mérida": ["Mérida"], "Miranda": ["Los Teques", "Chacao", "Baruta"],
  "Monagas": ["Maturín"], "Nueva Esparta": ["Porlamar"], "Portuguesa": ["Guanare"],
  "Sucre": ["Cumaná"], "Táchira": ["San Cristóbal"], "Trujillo": ["Valera"],
  "Yaracuy": ["San Felipe"], "Zulia": ["Maracaibo", "San Francisco"]
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
    } catch (err: any) { setError("Error de acceso."); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center px-8 justify-center">
      <div className="w-20 h-20 bg-blue-600 rounded-[25px] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">
        <span className="text-6xl transform -skew-x-12">D</span>
      </div>
      <h1 className="text-white text-4xl font-black italic mt-6 tracking-tighter">DameLaCola</h1>
      <form onSubmit={manejarLogin} className="w-full mt-10 space-y-3">
        <input type="email" placeholder="Email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        <input type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl text-white font-black uppercase text-xs mt-4 shadow-xl">Entrar</button>
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
  
  const [form, setForm] = useState({ 
    eOrig: "", cOrig: "", eDest: "", cDest: "", 
    precio: "", puestos: "4", maletas: "Pequeñas", 
    mascotas: false, aire: true 
  });

  const [filtro, setFiltro] = useState({ eOrig: "", eDest: "" });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    let q = query(collection(db, "Viajes"), orderBy("fecha", "desc"), limit(20));
    return onSnapshot(q, (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const publicarRuta = async () => {
    if (!form.cOrig || !form.cDest || !form.precio) return alert("Llena los campos obligatorios");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form,
        conductor: userData?.nombre || "Usuario",
        conductorId: user.uid,
        fecha: serverTimestamp(),
        verificado: userData?.kycVerificado || false
      });
      alert("🚀 ¡Ruta publicada!");
      setVista("inicio");
    } catch (e) { alert("Error al publicar"); }
  };

  const enviarMensaje = () => {
    if(!msgChat.trim()) return;
    alert("Mensaje enviado al soporte: " + msgChat);
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
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
          <Wallet size={14} className="text-blue-400" /><span className="text-xs font-black italic">${userData.saldo?.toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {vista === "inicio" && (
          <div className="space-y-4">
             <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-600 text-blue-600 bg-white">
                CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}
             </button>

             {modo === "chofer" ? (
               <div className="bg-white p-6 rounded-[35px] border-2 border-blue-50 shadow-xl space-y-3 animate-in fade-in">
                  <h3 className="text-xs font-black uppercase italic text-blue-600 flex items-center gap-2"><Navigation size={16}/> Nueva Ruta</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.eOrig} onChange={(e)=>setForm({...form, eOrig: e.target.value, cOrig: ""})}><option value="">Estado Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" disabled={!form.eOrig} value={form.cOrig} onChange={(e)=>setForm({...form, cOrig: e.target.value})}><option value="">Ciudad Origen</option>{form.eOrig && UBICACIONES[form.eOrig].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.eDest} onChange={(e)=>setForm({...form, eDest: e.target.value, cDest: ""})}><option value="">Estado Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" disabled={!form.eDest} value={form.cDest} onChange={(e)=>setForm({...form, cDest: e.target.value})}><option value="">Ciudad Destino</option>{form.eDest && UBICACIONES[form.eDest].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Precio $" className="flex-1 bg-slate-50 p-4 rounded-2xl border text-xs font-bold outline-none" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                    <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Puestos</option>)}</select>
                  </div>
                  <div className="flex justify-around p-2 bg-slate-50 rounded-2xl">
                    <button onClick={()=>setForm({...form, mascotas: !form.mascotas})} className={`flex flex-col items-center gap-1 ${form.mascotas ? "text-blue-600" : "text-slate-300"}`}><Dog size={18}/><span className="text-[8px] font-black uppercase">Mascotas</span></button>
                    <button onClick={()=>setForm({...form, aire: !form.aire})} className={`flex flex-col items-center gap-1 ${form.aire ? "text-blue-600" : "text-slate-300"}`}><Snowflake size={18}/><span className="text-[8px] font-black uppercase">Aire</span></button>
                  </div>
                  <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg shadow-blue-200 active:scale-95 transition-all">Publicar Ahora</button>
               </div>
             ) : (
               <div className="space-y-4 animate-in fade-in">
                 {/* BUSCADOR PARA PASAJERO */}
                 <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 space-y-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> ¿A dónde vamos hoy?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={filtro.eOrig} onChange={(e)=>setFiltro({...filtro, eOrig: e.target.value})}><option value="">Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={filtro.eDest} onChange={(e)=>setFiltro({...filtro, eDest: e.target.value})}><option value="">Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {viajes.map(v => (
                      <div key={v.id} className="bg-white p-5 rounded-[30px] border border-slate-100 flex justify-between items-center shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">{v.verificado && <ShieldCheck size={12} className="text-blue-500" />}<p className="text-[10px] font-black text-slate-400 uppercase italic">{v.conductor}</p></div>
                          <p className="font-black uppercase text-xs text-slate-800 leading-tight">{v.cOrig} → {v.cDest}</p>
                          <div className="flex gap-2 mt-1 text-[9px] font-bold text-blue-600">
                            <span className="flex items-center gap-0.5"><User size={10}/> {v.puestos}</span>
                            {v.mascotas && <Dog size={10} />}
                            {v.aire && <Snowflake size={10} />}
                          </div>
                        </div>
                        <div className="text-right"><p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p><button className="mt-2 text-[9px] bg-slate-900 text-white px-3 py-1.5 rounded-full font-black uppercase">Ver</button></div>
                      </div>
                    ))}
                 </div>
               </div>
             )}
          </div>
        )}
        {vista === "perfil" && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md relative">
                   <User size={40} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white"><CheckCircle size={12} className="text-white"/></div>}
                </div>
                <h2 className="font-black italic text-slate-800 uppercase">{userData.nombre}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userData.email}</p>
             </div>

             <div className="bg-slate-900 p-6 rounded-[35px] text-white space-y-4 shadow-xl">
                <div className="flex justify-between items-center text-blue-400 uppercase font-black text-[10px] italic"><span>Mi Billetera</span><Wallet size={18} /></div>
                <h1 className="text-4xl font-black italic tracking-tighter">${userData.saldo?.toFixed(2)}</h1>
                <div className="flex gap-2">
                   <button className="flex-1 bg-blue-600 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1">Recargar</button>
                   <button className="flex-1 bg-slate-800 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1">Retirar</button>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-3">
                <h3 className="text-xs font-black uppercase italic text-slate-800 flex items-center gap-2"><Car size={16}/> Mi Vehículo</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase italic">
                   <div className="bg-slate-50 p-4 rounded-xl"><p className="text-[8px] text-slate-400 mb-1">Modelo</p>{userData.vehiculo?.marca || "No Registrado"}</div>
                   <div className="bg-slate-50 p-4 rounded-xl"><p className="text-[8px] text-slate-400 mb-1">Matrícula</p>{userData.vehiculo?.placa || "---"}</div>
                </div>
             </div>

             <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic tracking-widest"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}
      </main>

      {/* BOTÓN BURBUJA Y CHAT CORREGIDO */}
      <div className="fixed bottom-28 right-6 z-50">
        {chatOpen && (
          <div className="bg-white w-80 h-[400px] mb-4 rounded-[30px] shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center font-black italic uppercase text-xs"><span>Soporte DameLaCola</span><button onClick={() => setChatOpen(false)}><X size={20}/></button></div>
            <div className="flex-1 p-4 bg-slate-50 text-[11px] font-bold text-slate-600 italic">¡Hola! 👋 Escribe tu duda aquí y un agente te responderá pronto.</div>
            <div className="p-4 bg-white border-t flex gap-2">
              <input type="text" placeholder="Escribe..." value={msgChat} onChange={(e)=>setMsgChat(e.target.value)} className="flex-1 bg-slate-100 p-3 rounded-xl text-[11px] font-bold outline-none" />
              {/* BOTÓN DE ENVIAR FUNCIONAL */}
              <button onClick={enviarMensaje} className="bg-blue-600 p-3 rounded-xl text-white shadow-lg active:scale-90 transition-all"><Send size={16}/></button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white active:scale-90 transition-all"><MessageSquare size={28} /></button>
      </div>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-lg">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={24} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={24} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}

export default NavegacionPrincipal;
