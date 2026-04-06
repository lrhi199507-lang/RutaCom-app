import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, limit, where, updateDoc, deleteDoc
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  Camera, CheckCircle, MessageSquare, Navigation, Search, 
  Star, Settings, ChevronRight, Edit, Trash2, Bell, MessageCircle, Info
} from "lucide-react";

const UBICACIONES: Record<string, string[]> = {
  "Amazonas": ["Puerto Ayacucho"], "Anzoátegui": ["Barcelona", "Puerto La Cruz"],
  "Apure": ["San Fernando"], "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Barinas": ["Barinas"], "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego"],
  "Cojedes": ["San Carlos", "Tinaquillo"], "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo"], "Lara": ["Barquisimeto", "Cabudare"],
  "Mérida": ["Mérida", "El Vigía"], "Miranda": ["Los Teques", "Chacao", "Baruta"],
  "Monagas": ["Maturín"], "Nueva Esparta": ["Porlamar"], "Portuguesa": ["Guanare"],
  "Táchira": ["San Cristóbal"], "Trujillo": ["Valera"], "Yaracuy": ["San Felipe"],
  "Zulia": ["Maracaibo", "San Francisco"]
};
const ESTADOS = Object.keys(UBICACIONES);

export function PantallaLogin() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const manejarLogin = async (e: any) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, correo, contrasena); } 
    catch (err) { alert("Credenciales incorrectas."); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center px-8 justify-center">
      <div className="w-20 h-20 bg-blue-600 rounded-[25px] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">
        <span className="text-6xl transform -skew-x-12">D</span>
      </div>
      <h1 className="text-white text-4xl font-black italic mt-6">DameLaCola</h1>
      <form onSubmit={manejarLogin} className="w-full mt-10 space-y-3">
        <input type="email" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none" />
        <input type="password" placeholder="Contraseña" value={contrasena} onChange={(e) => setContrasena(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-white outline-none" />
        <button type="submit" className="w-full bg-blue-600 p-4 rounded-2xl text-white font-black uppercase text-xs">Entrar</button>
      </form>
    </div>
  );
}
export function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState<"pasajero" | "chofer">("pasajero");
  const [userData, setUserData] = useState<any>(null);
  const [viajes, setViajes] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [chatActivo, setChatActivo] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  // Formulario Chofer
  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
  
  // Buscador Pasajero (4 SELECTORES RECOBRADOS)
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  useEffect(() => {
    if (!user) return;
    onSnapshot(doc(db, "usuarios", user.uid), (snap) => setUserData(snap.data()));
    const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const publicarRuta = async () => {
    if (!form.cO || !form.cD || !form.precio) return alert("Error: Datos incompletos para publicar.");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form, conductor: userData.nombre, conductorId: user.uid,
        fecha: serverTimestamp(), verificado: userData.kycVerificado || false
      });
      alert("🚀 ¡Viaje Publicado con éxito!");
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
    } catch (e) { alert("Error al conectar con la base de datos."); }
  };

  const eliminarViaje = async (id: string) => {
    if (window.confirm("¿Deseas eliminar este viaje permanentemente?")) {
      await deleteDoc(doc(db, "Viajes", id));
    }
  };

  // Filtrado de viajes en tiempo real
  const viajesFiltrados = viajes.filter(v => 
    (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD)
  );

  if (!userData) return null;
  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      {/* HEADER FIJO */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6">D</div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic">{userData.nombre}</p></div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2"><Wallet size={14} className="text-blue-400" /><span className="text-xs font-black italic">${userData.saldo?.toFixed(2)}</span></div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-3 mb-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-blue-600 text-blue-600 bg-white shadow-sm">CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}</button>

        {vista === "inicio" && modo === "chofer" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-3">
              <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2"><Navigation size={16}/> Publicar Nueva Ruta</h3>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value, cO: ""})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eO} value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad Origen</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value, cD: ""})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eD} value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad Destino</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <input type="number" placeholder="Precio del viaje $" className="w-full bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
              <textarea placeholder="Extras (Condiciones, maletas, etc...)" className="w-full bg-slate-50 p-3 rounded-xl border text-[10px] font-bold h-20" value={form.extras} onChange={(e)=>setForm({...form, extras: e.target.value})} />
              <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Viaje</button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase italic px-2">Mis Publicaciones Activas</p>
              {viajes.filter(v => v.conductorId === user.uid).map(v => (
                <div key={v.id} className="bg-white p-4 rounded-[25px] border flex justify-between items-center shadow-sm">
                  <div><p className="text-xs font-black uppercase">{v.cO} → {v.cD}</p><p className="text-[10px] text-blue-600 font-bold italic">${v.precio} - {v.puestos} puestos</p></div>
                  <div className="flex gap-2"><button className="p-2 bg-slate-100 rounded-lg"><Edit size={14}/></button><button onClick={()=>eliminarViaje(v.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vista === "inicio" && modo === "pasajero" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar mi Cola</p>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-2 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                <select className="bg-slate-50 p-2 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">DE: CIUDAD</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-2 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>{setFED(e.target.value); setFCD("");}}><option value="">A: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                <select className="bg-slate-50 p-2 rounded-xl border text-[9px] font-black" disabled={!fED} value={fCD} onChange={(e)=>setFCD(e.target.value)}><option value="">A: CIUDAD</option>{fED && UBICACIONES[fED].map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
            </div>
            {viajesFiltrados.map(v => (
              <div key={v.id} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm">
                <div className="flex-1"><p className="text-[9px] font-black text-slate-400 uppercase italic">{v.conductor}</p><p className="font-black uppercase text-xs text-slate-800 leading-tight">{v.cO} → {v.cD}</p></div>
                <div className="text-right"><p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p><button onClick={() => {setViajeSeleccionado(v); setChatActivo(true);}} className="mt-2 text-[9px] bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase shadow-md">Ver</button></div>
              </div>
            ))}
          </div>
        )}

        {vista === "perfil" && (
          <div className="space-y-4 animate-in fade-in">
             <div className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col items-center relative">
                <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100 shadow-sm"><Settings size={20}/></button>
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-md relative"><User size={40} className="text-slate-400" />{userData.kycVerificado && <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white"><CheckCircle size={12} className="text-white"/></div>}</div>
                <div className="flex items-center gap-1 text-yellow-500 mb-1"><Star size={12} fill="currentColor" stroke="none"/><Star size={12} fill="currentColor" stroke="none"/><Star size={12} fill="currentColor" stroke="none"/><Star size={12} fill="currentColor" stroke="none"/><Star size={12} fill="currentColor" stroke="none"/></div>
                <h2 className="font-black italic text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
             </div>

             {configOpen && (
               <div className="bg-white p-6 rounded-[35px] border-2 border-blue-600 space-y-4 animate-in zoom-in-95 shadow-2xl">
                  <div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase italic text-blue-600">Configuración de Seguridad</h3><button onClick={()=>setConfigOpen(false)}><X size={18}/></button></div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase italic">Completa tu perfil para publicar viajes seguros</p>
                  <div className="space-y-2">
                    <button onClick={()=>alert("Cargar Cédula Frontal")} className="w-full p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase italic"><span>1. Cédula Frontal</span><Camera size={16} className="text-blue-600"/></button>
                    <button onClick={()=>alert("Cargar Cédula Trasera")} className="w-full p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase italic"><span>2. Cédula Trasera</span><Camera size={16} className="text-blue-600"/></button>
                    <button onClick={()=>alert("Cargar Foto de Rostro")} className="w-full p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase italic"><span>3. Foto de Rostro</span><User size={16} className="text-blue-600"/></button>
                    <button onClick={()=>alert("Cargar Licencia de Conducir")} className="w-full p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase italic border-2 border-blue-100"><span>4. Licencia de Conducir</span><ShieldCheck size={16} className="text-blue-600"/></button>
                  </div>
               </div>
             )}
             <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}
      </main>

      {/* BURBUJA DE CHAT ACTIVO (Solo sale si pides una cola) */}
      {chatActivo && (
        <div className="fixed bottom-28 right-6 z-50">
           <div className="absolute -top-1 -right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg">1</div>
           <button onClick={()=>setChatActivo(false)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white active:scale-90 transition-transform"><MessageSquare size={28} /></button>
        </div>
      )}

      {/* NAVBAR INFERIOR FIJO */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl">
        <button onClick={() => {setVista("inicio"); setConfigOpen(false);}} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={24} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => alert("Chat de Soporte Técnico")} className="flex flex-col items-center gap-1 text-slate-300"><MessageCircle size={24} /><span className="text-[9px] font-black uppercase italic">Soporte</span></button>
        <button onClick={() => {setVista("perfil"); setConfigOpen(false);}} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={24} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}

export default NavegacionPrincipal;
