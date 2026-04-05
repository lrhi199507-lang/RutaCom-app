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
  ChevronRight, Star, Camera, MessageCircle
} from "lucide-react";

const UBICACIONES: Record<string, string[]> = {
  "Amazonas": ["Puerto Ayacucho"], "Anzoátegui": ["Puerto La Cruz", "Barcelona", "Lechería", "El Tigre"],
  "Apure": ["San Fernando"], "Aragua": ["Maracay", "Turmero", "La Victoria"], "Barinas": ["Barinas"],
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"], "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego"],
  "Cojedes": ["San Carlos", "Tinaquillo"], "Distrito Capital": ["Caracas"], "Falcón": ["Coro", "Punto Fijo"],
  "Lara": ["Barquisimeto", "Cabudare"], "Mérida": ["Mérida", "El Vigía"], "Miranda": ["Los Teques", "Chacao", "Baruta"],
  "Monagas": ["Maturín"], "Nueva Esparta": ["Porlamar"], "Portuguesa": ["Guanare", "Acarigua"],
  "Táchira": ["San Cristóbal"], "Trujillo": ["Valera"], "Yaracuy": ["San Felipe"], "Zulia": ["Maracaibo", "San Francisco"]
};

const ESTADOS = Object.keys(UBICACIONES);

export function PantallaLogin() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const manejarLogin = async (e: any) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, correo, contrasena); } 
    catch (err) { alert("Error de acceso."); }
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
  const [mensajesSoporte, setMensajesSoporte] = useState<{texto: string, soyYo: boolean}[]>([]);
  const [viajes, setViajes] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [chatConductor, setChatConductor] = useState(false);
  
  // Publicador
  const [form, setForm] = useState({ eOrig: "", cOrig: "", eDest: "", cDest: "", precio: "", puestos: "4", extras: "" });
  
  // Buscador Doble
  const [busqueda, setBusqueda] = useState({ eO: "", cO: "", eD: "", cD: "" });
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

  const buscarViaje = () => {
    const filtrados = viajes.filter(v => 
      (busqueda.cO === "" || v.cOrig === busqueda.cO) && 
      (busqueda.cD === "" || v.cDest === busqueda.cD)
    );
    setResultados(filtrados);
  };

  const publicarRuta = async () => {
    if (!form.cOrig || !form.cDest || !form.precio) return alert("Faltan datos");
    try {
      await addDoc(collection(db, "Viajes"), {
        eOrig: form.eOrig || "", cOrig: form.cOrig || "",
        eDest: form.eDest || "", cDest: form.cDest || "",
        precio: form.precio || "0", puestos: form.puestos || "4",
        extras: form.extras || "", conductor: userData?.nombre || "Usuario",
        conductorId: user.uid, fecha: serverTimestamp(),
        verificado: userData?.kycVerificado || false
      });
      alert("🚀 ¡Publicado!");
      setForm({ eOrig: "", cOrig: "", eDest: "", cDest: "", precio: "", puestos: "4", extras: "" });
      setVista("inicio");
    } catch (e) { alert("Error al conectar con la base de datos."); }
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
        {vista === "inicio" && (
          <div className="space-y-4">
            <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-600 text-blue-600 bg-white">CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}</button>

            {modo === "chofer" ? (
              <div className="bg-white p-6 rounded-[35px] border-2 border-blue-50 shadow-xl space-y-3">
                <h3 className="text-xs font-black uppercase text-blue-600 flex items-center gap-2 italic"><Navigation size={16}/> Publicar Viaje</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.eOrig} onChange={(e)=>setForm({...form, eOrig: e.target.value, cOrig: ""})}><option value="">Estado Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                  <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" disabled={!form.eOrig} value={form.cOrig} onChange={(e)=>setForm({...form, cOrig: e.target.value})}><option value="">Ciudad Origen</option>{form.eOrig && UBICACIONES[form.eOrig].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" value={form.eDest} onChange={(e)=>setForm({...form, eDest: e.target.value, cDest: ""})}><option value="">Estado Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                  <select className="bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none" disabled={!form.eDest} value={form.cDest} onChange={(e)=>setForm({...form, cDest: e.target.value})}><option value="">Ciudad Destino</option>{form.eDest && UBICACIONES[form.eDest].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <input type="number" placeholder="Precio $" className="w-full bg-slate-50 p-4 rounded-2xl border text-xs font-bold outline-none" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                <textarea placeholder="Extras (No mascotas, aire, maletas...)" className="w-full bg-slate-50 p-4 rounded-2xl border text-[10px] font-bold outline-none h-20" value={form.extras} onChange={(e)=>setForm({...form, extras: e.target.value})} />
                <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Ahora</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                   <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar Viaje</p>
                   <div className="grid grid-cols-2 gap-2">
                     <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={busqueda.eO} onChange={(e)=>setBusqueda({...busqueda, eO: e.target.value, cO: ""})}><option value="">De: Estado</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                     <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!busqueda.eO} value={busqueda.cO} onChange={(e)=>setBusqueda({...busqueda, cO: e.target.value})}><option value="">De: Ciudad</option>{busqueda.eO && UBICACIONES[busqueda.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={busqueda.eD} onChange={(e)=>setBusqueda({...busqueda, eD: e.target.value, cD: ""})}><option value="">A: Estado</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                     <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!busqueda.eD} value={busqueda.cD} onChange={(e)=>setBusqueda({...busqueda, cD: e.target.value})}><option value="">A: Ciudad</option>{busqueda.eD && UBICACIONES[busqueda.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                   </div>
                   <button onClick={buscarViaje} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase italic">Buscar Viaje</button>
                </div>

                {!viajeSeleccionado ? (
                  <div className="space-y-3">
                    {resultados.map(v => (
                      <div key={v.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase italic">{v.conductor}</p>
                          <p className="font-black uppercase text-xs text-slate-800 leading-tight">{v.cOrig} → {v.cDest}</p>
                        </div>
                        <div className="text-right"><p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p><button onClick={() => setViajeSeleccionado(v)} className="mt-2 text-[9px] bg-slate-900 text-white px-4 py-2 rounded-full font-black uppercase">Ver</button></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-[35px] shadow-2xl border-t-4 border-blue-600 space-y-4">
                    <button onClick={() => {setViajeSeleccionado(null); setChatConductor(false);}} className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-1"><X size={14}/> Volver</button>
                    {!chatConductor ? (
                      <>
                        <div>
                          <h2 className="text-xl font-black uppercase italic text-slate-900 flex items-center gap-2">{viajeSeleccionado.conductor} {viajeSeleccionado.verificado && <ShieldCheck size={18} className="text-blue-600"/>}</h2>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{viajeSeleccionado.cOrig} a {viajeSeleccionado.cDest}</p>
                          <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-600 italic border-l-4 border-blue-200">" {viajeSeleccionado.extras || "Sin condiciones."} "</div>
                        </div>
                        <button onClick={() => setChatConductor(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Pedir la Cola</button>
                      </>
                    ) : (
                      <div className="h-60 flex flex-col">
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl overflow-y-auto mb-2"><p className="text-[10px] font-bold text-blue-600 italic">Chat con {viajeSeleccionado.conductor} iniciado...</p></div>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Escribe..." className="flex-1 bg-slate-100 p-3 rounded-xl text-[11px] outline-none" />
                          <button className="bg-blue-600 p-3 rounded-xl text-white"><Send size={16}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {vista === "perfil" && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md relative">
                   <User size={40} className="text-slate-400" />
                   {userData?.kycVerificado && <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white"><CheckCircle size={12} className="text-white"/></div>}
                </div>
                <div className="flex items-center gap-1 text-yellow-500 mb-1"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                <h2 className="font-black italic text-slate-800 uppercase">{userData?.nombre}</h2>
             </div>

             <div className="bg-white p-5 rounded-[30px] border space-y-4">
                <div className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck size={20}/></div><div><p className="text-[11px] font-black uppercase italic">Verificar KYC</p><p className="text-[9px] text-slate-400 font-bold uppercase">Sube tus documentos</p></div></div>
                  <ChevronRight size={18} className="text-slate-300"/>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="bg-slate-50 p-4 rounded-xl"><p className="text-[8px] text-slate-400 mb-1 uppercase font-black">Modelo</p><p className="text-[10px] font-black uppercase italic italic">{userData?.vehiculo?.marca || "---"}</p></div>
                  <div className="bg-slate-50 p-4 rounded-xl"><p className="text-[8px] text-slate-400 mb-1 uppercase font-black">Matrícula</p><p className="text-[10px] font-black uppercase italic italic">{userData?.vehiculo?.placa || "---"}</p></div>
                </div>
             </div>

             <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic tracking-widest"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-lg">
        <button onClick={() => {setVista("inicio"); setViajeSeleccionado(null);}} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={24} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={24} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}

export default NavegacionPrincipal;
