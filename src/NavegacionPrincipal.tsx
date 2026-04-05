import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, limit, where
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  CheckCircle, MessageSquare, Navigation, Search, 
  ChevronRight, ArrowUpRight, ArrowDownLeft
} from "lucide-react";

const UBICACIONES: Record<string, string[]> = {
  "Amazonas": ["Puerto Ayacucho"],
  "Anzoátegui": ["Puerto La Cruz", "Barcelona", "Lechería", "El Tigre"],
  "Apure": ["San Fernando"],
  "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Barinas": ["Barinas"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego", "Puerto Cabello"],
  "Cojedes": ["San Carlos", "Tinaquillo"],
  "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo"],
  "Lara": ["Barquisimeto", "Cabudare"],
  "Mérida": ["Mérida", "El Vigía"],
  "Miranda": ["Los Teques", "Chacao", "Baruta", "Guarenas"],
  "Monagas": ["Maturín"],
  "Nueva Esparta": ["Porlamar"],
  "Portuguesa": ["Guanare", "Acarigua"],
  "Táchira": ["San Cristóbal"],
  "Zulia": ["Maracaibo", "San Francisco", "Cabimas"]
};

const ESTADOS = Object.keys(UBICACIONES);

export function PantallaLogin() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const manejarLogin = async (e: any) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, correo, contrasena); } 
    catch (err) { alert("Error al entrar. Revisa tus datos."); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center px-8 justify-center font-sans">
      <div className="w-20 h-20 bg-blue-600 rounded-[25px] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">
        <span className="text-6xl transform -skew-x-12">D</span>
      </div>
      <h1 className="text-white text-4xl font-black italic mt-6 tracking-tighter">DameLaCola</h1>
      <form onSubmit={manejarLogin} className="w-full mt-10 space-y-3">
        <input type="email" placeholder="Correo Electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        <input type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-blue-600 text-sm" />
        <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl text-white font-black uppercase text-xs mt-4 shadow-xl active:scale-95 transition-transform">Entrar</button>
      </form>
    </div>
  );
}
export function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState<"pasajero" | "chofer">("pasajero");
  const [chatOpen, setChatOpen] = useState(false);
  const [msgChat, setMsgChat] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<{texto: string, soyYo: boolean}[]>([]);
  const [viajes, setViajes] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  
  // Estado para el Publicador (Chofer)
  const [form, setForm] = useState({ eOrig: "", cOrig: "", eDest: "", cDest: "", precio: "", puestos: "4", extras: "" });
  
  // Estado para el Buscador (Pasajero) - ¡AHORA AUTOMATIZADO!
  const [filtro, setFiltro] = useState({ eOrig: "", cOrig: "", eDest: "", cDest: "" });

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
    if (!form.cOrig || !form.cDest || !form.precio) return alert("Por favor indica Origen, Destino y Precio.");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form,
        conductor: userData?.nombre || "Usuario",
        conductorId: user.uid,
        fecha: serverTimestamp(),
        verificado: userData?.kycVerificado || false
      });
      alert("🚀 ¡Ruta publicada con éxito!");
      setForm({ eOrig: "", cOrig: "", eDest: "", cDest: "", precio: "", puestos: "4", extras: "" });
      setVista("inicio");
    } catch (e) { alert("Error al conectar con la base de datos."); }
  };

  const enviarASoporte = () => {
    if (!msgChat.trim()) return;
    setMensajesSoporte([...mensajesSoporte, { texto: msgChat, soyYo: true }]);
    setMsgChat("");
  };
  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6">D</div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic leading-none">{userData?.nombre}</p></div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2"><Wallet size={14} className="text-blue-400" /><span className="text-xs font-black italic">${userData?.saldo?.toFixed(2)}</span></div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-3 mb-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-600 text-blue-600 bg-white active:bg-blue-50 transition-colors">CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}</button>

        {modo === "chofer" ? (
          <div className="bg-white p-6 rounded-[35px] border-2 border-blue-50 shadow-xl space-y-3 animate-in fade-in zoom-in-95">
            <h3 className="text-xs font-black uppercase text-blue-600 flex items-center gap-2 italic"><Navigation size={16}/> Nueva Ruta</h3>
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
              <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})}>{[1,2,3,4,5,6].map(n => <option key={n} value={n.toString()}>{n} Puestos</option>)}</select>
            </div>
            <textarea placeholder="Extras: Mascotas, Aire, Equipaje..." className="w-full bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none h-20" value={form.extras} onChange={(e)=>setForm({...form, extras: e.target.value})} />
            <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg shadow-blue-200">Publicar Ahora</button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            {/* BUSCADOR DE PASAJERO AUTOMATIZADO */}
            <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 space-y-3">
               <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar Destino</p>
               <div className="grid grid-cols-2 gap-2">
                 <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={filtro.eOrig} onChange={(e)=>setFiltro({...filtro, eOrig: e.target.value, cOrig: ""})}><option value="">Estado</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                 <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!filtro.eOrig} value={filtro.cOrig} onChange={(e)=>setFiltro({...filtro, cOrig: e.target.value})}><option value="">Ciudad</option>{filtro.eOrig && UBICACIONES[filtro.eOrig].map(c => <option key={c} value={c}>{c}</option>)}</select>
               </div>
            </div>

            {!viajeSeleccionado ? (
              <div className="space-y-3">
                {viajes.map(v => (
                  <div key={v.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase italic">{v.conductor}</p>
                      <p className="font-black uppercase text-xs text-slate-800 leading-tight">{v.cOrig} → {v.cDest}</p>
                    </div>
                    <div className="text-right"><p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p><button onClick={() => setViajeSeleccionado(v)} className="mt-2 text-[9px] bg-slate-900 text-white px-4 py-2 rounded-full font-black uppercase">Ver</button></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-[35px] shadow-2xl border-t-4 border-blue-600 space-y-4 animate-in slide-in-from-bottom-10">
                <button onClick={() => setViajeSeleccionado(null)} className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-1 hover:text-blue-600 transition-colors"><X size={14}/> Volver</button>
                <div className="pb-2">
                  <h2 className="text-xl font-black uppercase italic text-slate-900 flex items-center gap-2">{viajeSeleccionado.conductor} {viajeSeleccionado.verificado && <ShieldCheck size={18} className="text-blue-600"/>}</h2>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{viajeSeleccionado.cOrig} a {viajeSeleccionado.cDest}</p>
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-600 italic border-l-4 border-blue-200">" {viajeSeleccionado.extras || "Sin condiciones adicionales."} "</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100 active:scale-95 transition-transform">Pedir la Cola</button>
                  <button onClick={() => setViajeSeleccionado(null)} className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase text-xs active:scale-95 transition-transform">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CHAT SOPORTE */}
      <div className="fixed bottom-28 right-6 z-50">
        {chatOpen && (
          <div className="bg-white w-80 h-[400px] mb-4 rounded-[30px] shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center font-black italic uppercase text-xs"><span>Soporte Técnico</span><button onClick={() => setChatOpen(false)}><X size={20}/></button></div>
            <div className="flex-1 p-4 bg-slate-50 overflow-y-auto space-y-2">
              {mensajesSoporte.length === 0 && <p className="text-[10px] text-center text-slate-400 font-bold italic mt-10 uppercase">No hay mensajes aún</p>}
              {mensajesSoporte.map((m, i) => (
                <div key={i} className={`p-3 rounded-2xl text-[11px] font-bold max-w-[85%] ${m.soyYo ? "bg-blue-600 text-white self-end ml-auto rounded-tr-none shadow-md" : "bg-white text-slate-800 rounded-tl-none shadow-sm"}`}>{m.texto}</div>
              ))}
            </div>
            <div className="p-4 bg-white border-t flex gap-2">
              <input type="text" placeholder="Escribe al soporte..." value={msgChat} onChange={(e)=>setMsgChat(e.target.value)} className="flex-1 bg-slate-100 p-3 rounded-xl text-[11px] font-bold outline-none focus:bg-white border focus:border-blue-200 transition-all" />
              <button onClick={enviarASoporte} className="bg-blue-600 p-3 rounded-xl text-white shadow-lg active:scale-90 transition-transform"><Send size={16}/></button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white active:scale-90 transition-all"><MessageSquare size={28} /></button>
      </div>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-lg">
        <button onClick={() => {setVista("inicio"); setViajeSeleccionado(null);}} className={`flex flex-col items-center gap-1 transition-colors ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={24} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 transition-colors ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={24} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}

export default NavegacionPrincipal;
