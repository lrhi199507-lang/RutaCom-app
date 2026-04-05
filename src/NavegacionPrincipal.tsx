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
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  Search, Wallet, User, LogOut, Car, X, Send, ArrowLeft, Edit2, 
  Headset, PlusCircle, Bell, MapPin, Star, History, Trash2, 
  Settings, ShieldCheck, Camera, Mail, Lock, CheckCircle
} from "lucide-react";

// DICCIONARIO DE UBICACIONES (VENEZUELA)
const UBICACIONES: Record<string, string[]> = {
  "Carabobo": ["Valencia", "Puerto Cabello", "Guacara", "San Diego", "Los Guayos", "Naguanagua"],
  "Distrito Capital": ["Caracas"],
  "Aragua": ["Maracay", "Turmero", "Cagua"],
  "Zulia": ["Maracaibo", "Cabimas", "San Francisco"],
  "Lara": ["Barquisimeto", "Cabudare"],
  "Miranda": ["Los Teques", "Guarenas", "Guatire", "Charallave"]
};
const ESTADOS = Object.keys(UBICACIONES);

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [verificandoKYC, setVerificandoKYC] = useState(false);
  
  // ESTADOS DE DATOS
  const [userData, setUserData] = useState<any>(null);
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);
  const [inputChat, setInputChat] = useState("");

  // FORMULARIOS
  const [formViaje, setFormViaje] = useState({ id: "", estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "", precio: "", puestos: "4" });
  const [busqueda, setBusqueda] = useState({ edoO: "", ciuO: "", edoD: "", ciuD: "" });

  // 1. Escuchar datos del usuario y Viaje Activo
  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    const qViajes = query(collection(db, "Viajes"));
    const unsubViajes = onSnapshot(qViajes, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setViajesReales(docs);
      const activo = docs.find(v => (v.idCreador === user.uid || v.pasajeroId === user.uid) && v.estado !== "finalizado");
      setViajeActivo(activo || null);
    });

    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  // 2. Escuchar Mensajes del Chat en Tiempo Real
  useEffect(() => {
    if (!viajeActivo || vista !== "chat_conductor") return;
    const qMsg = query(
      collection(db, "Viajes", viajeActivo.id, "Mensajes"),
      orderBy("fecha", "asc")
    );
    return onSnapshot(qMsg, (snap) => {
      setMensajesChat(snap.docs.map(d => d.data()));
    });
  }, [viajeActivo, vista]);

  // FUNCIONES DE ACCIÓN
  const enviarMensaje = async () => {
    if (!inputChat.trim() || !viajeActivo) return;
    await addDoc(collection(db, "Viajes", viajeActivo.id, "Mensajes"), {
      texto: inputChat,
      remitenteId: user.uid,
      nombre: userData.nombre,
      fecha: serverTimestamp()
    });
    setInputChat("");
  };

  const publicarViaje = async () => {
    if (!formViaje.estadoOrigen || !formViaje.precio) return alert("Completa los campos");
    const payload = {
      ...formViaje,
      conductor: userData.nombre,
      idCreador: user.uid,
      precio: Number(formViaje.precio),
      puestos: Number(formViaje.puestos),
      vehiculo: userData.vehiculo?.modelo || "Particular",
      fecha: serverTimestamp(),
      estado: "buscando"
    };
    if (formViaje.id) {
      const { id, ...resto } = payload;
      await updateDoc(doc(db, "Viajes", id), resto);
    } else {
      await addDoc(collection(db, "Viajes"), payload);
    }
    setFormViaje({ id: "", estadoOrigen: "", ciudadOrigen: "", estadoDestino: "", ciudadDestino: "", precio: "", puestos: "4" });
  };

  const restablecerPassword = () => {
    sendPasswordResetEmail(auth, user.email)
      .then(() => alert("📧 Se ha enviado un correo para restablecer tu contraseña."))
      .catch(() => alert("Error al enviar correo."));
  };

  if (!userData) return <div className="h-screen flex items-center justify-center font-black italic text-blue-600 animate-pulse text-2xl">RutaCom...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER PRINCIPAL */}
      {vista !== "chat_conductor" && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">R</div>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Modo {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1">
                  {userData.nombre} {userData.kycVerificado && <CheckCircle size={10} className="text-blue-500 fill-blue-500"/>}
                </p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${userData.saldo?.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all active:scale-95 ${modo === "pasajero" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-100"}`}>
            Cambiar a {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* VISTA INICIO - LÓGICA PASAJERO */}
        {vista === "inicio" && modo === "pasajero" && (
          <div className="p-6 space-y-4 pb-32">
            {/* Buscador Simplificado */}
            <div className="bg-white p-4 rounded-[25px] border shadow-sm grid grid-cols-2 gap-2">
               <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" onChange={(e) => setBusqueda({...busqueda, edoO: e.target.value})}>
                 <option value="">Estado Origen</option>
                 {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
               </select>
               <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" onChange={(e) => setBusqueda({...busqueda, edoD: e.target.value})}>
                 <option value="">Estado Destino</option>
                 {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
               </select>
            </div>

            {viajesReales.filter(v => v.estado === "buscando" && v.idCreador !== user.uid).map(v => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-4 rounded-[25px] border flex flex-col gap-3 shadow-sm active:scale-95 transition-all">
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
                <div className="bg-slate-50 p-2 rounded-xl text-[10px] font-bold text-slate-500 uppercase flex flex-col gap-1">
                  <span>De: {v.ciudadOrigen}</span>
                  <span className="text-blue-600">Hacia: {v.ciudadDestino}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VISTA INICIO - LÓGICA CHÓFER */}
        {vista === "inicio" && modo === "chofer" && (
          <div className="p-6 space-y-6 pb-32">
            {/* Si hay publicación activa */}
            {viajeActivo && viajeActivo.idCreador === user.uid && (
              <div className="bg-blue-600 p-5 rounded-[25px] text-white shadow-xl">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase opacity-70">Ruta Publicada</p>
                    <div className="flex gap-2">
                       <button onClick={() => setFormViaje({...viajeActivo, precio: viajeActivo.precio.toString()})} className="p-2 bg-white/20 rounded-lg"><Edit2 size={16}/></button>
                       <button onClick={() => deleteDoc(doc(db, "Viajes", viajeActivo.id))} className="p-2 bg-red-500 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                 </div>
                 <p className="text-lg font-black italic uppercase mt-2">{viajeActivo.ciudadOrigen} ➔ {viajeActivo.ciudadDestino}</p>
                 {viajeActivo.estado === "confirmado" && (
                   <button onClick={() => setVista("chat_conductor")} className="w-full mt-4 py-2 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase shadow-lg">¡Pasajero en espera! Ir al Chat</button>
                 )}
              </div>
            )}

            {/* Crear Ruta */}
            <div className="bg-white p-6 rounded-[30px] border shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase italic text-slate-800 flex items-center gap-2"><PlusCircle size={18} className="text-green-600"/> Publicar mi Viaje</h2>
              <div className="grid grid-cols-2 gap-2">
                 <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={formViaje.estadoOrigen} onChange={(e) => setFormViaje({...formViaje, estadoOrigen: e.target.value})}>
                    <option value="">Origen</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                 </select>
                 <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={formViaje.estadoDestino} onChange={(e) => setFormViaje({...formViaje, estadoDestino: e.target.value})}>
                    <option value="">Destino</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                 </select>
              </div>
              <input className="w-full bg-slate-50 p-3 rounded-xl border font-bold text-xs" placeholder="Precio del viaje ($)" type="number" value={formViaje.precio} onChange={(e) => setFormViaje({...formViaje, precio: e.target.value})} />
              <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white font-black uppercase italic rounded-xl text-xs shadow-lg">Publicar Ahora</button>
            </div>
          </div>
        )}

        {/* VISTA PERFIL - EDICIÓN Y KYC */}
        {vista === "perfil" && (
          <div className="p-6 space-y-6 pb-32">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center text-white text-3xl font-black italic shadow-xl relative">
                {userData.nombre?.[0]}
                {userData.kycVerificado && <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1.5 rounded-xl border-4 border-white"><ShieldCheck size={16}/></div>}
              </div>
              <div className="text-center">
                <h2 className="font-black uppercase text-lg italic text-slate-800">{userData.nombre}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
              </div>
            </div>

            {/* SEGURIDAD Y CUENTA */}
            <div className="bg-white rounded-[30px] border p-6 space-y-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"><Lock size={14}/> Seguridad de Cuenta</p>
                  <button onClick={() => setEditandoPerfil(!editandoPerfil)} className="p-2 bg-slate-50 rounded-lg"><Settings size={14}/></button>
               </div>
               
               {editandoPerfil ? (
                 <div className="space-y-3 pt-2">
                    <button onClick={restablecerPassword} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"> Cambiar Contraseña <Mail size={14}/></button>
                    {!auth.currentUser?.emailVerified && <p className="text-[9px] font-black text-red-500 text-center uppercase">⚠️ Correo no verificado. Revisa tu bandeja.</p>}
                 </div>
               ) : (
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Estado KYC</p>
                       <p className={`text-[10px] font-black uppercase italic ${userData.kycVerificado ? "text-green-600" : "text-red-500"}`}>
                         {userData.kycVerificado ? "Verificado" : "Pendiente de Documentos"}
                       </p>
                    </div>
                    {!userData.kycVerificado && <button onClick={() => setVerificandoKYC(true)} className="px-3 py-2 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase">Verificar</button>}
                 </div>
               )}
            </div>

            {/* VEHÍCULO (Solo en modo chófer) */}
            {modo === "chofer" && (
              <div className="bg-white rounded-[30px] border p-6 space-y-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-800 uppercase flex items-center gap-2"><Car size={14}/> Datos del Vehículo</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[8px] text-slate-400 uppercase font-black">Modelo</p><p className="text-[10px] font-bold uppercase">{userData.vehiculo?.modelo || "No asignado"}</p></div>
                  <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[8px] text-slate-400 uppercase font-black">Placa</p><p className="text-[10px] font-bold uppercase">{userData.vehiculo?.placa || "No asignado"}</p></div>
                </div>
              </div>
            )}

            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2 italic text-[10px] active:scale-95"> <LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}

        {/* VISTA CHAT DINÁMICO */}
        {vista === "chat_conductor" && viajeActivo && (
          <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 pt-12 bg-white border-b flex items-center gap-4 shrink-0 shadow-sm">
               <button onClick={() => setVista("inicio")} className="p-2 bg-slate-100 rounded-full text-slate-900"><ArrowLeft size={20} /></button>
               <div className="text-left flex-1">
                 <p className="font-black uppercase text-sm italic">{user.uid === viajeActivo.idCreador ? "Chat con Pasajero" : viajeActivo.conductor}</p>
                 <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">• En Línea</p>
               </div>
            </div>
            
            <div className="flex-1 p-6 space-y-3 overflow-y-auto bg-white/50">
               <div className="bg-blue-50 p-3 rounded-2xl text-[9px] font-black text-blue-600 text-center uppercase border border-blue-100">
                 {viajeActivo.ciudadOrigen} ➔ {viajeActivo.ciudadDestino} (${viajeActivo.precio})
               </div>
               {mensajesChat.map((m, i) => (
                 <div key={i} className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${m.remitenteId === user.uid ? "bg-blue-600 text-white ml-auto rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"}`}>
                   <p className="text-xs font-bold">{m.texto}</p>
                 </div>
               ))}
            </div>

            {user.uid === viajeActivo.idCreador && (
              <div className="px-6 py-2 bg-white border-t">
                <button onClick={async () => {
                  await updateDoc(doc(db, "Viajes", viajeActivo.id), { estado: "finalizado" });
                  setVista("inicio");
                  alert("Viaje finalizado exitosamente");
                }} className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] italic shadow-lg">Finalizar Carrera</button>
              </div>
            )}

            <div className="p-4 bg-white border-t flex gap-2 pb-10">
               <input className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm outline-none font-bold" placeholder="Escribe al chat..." value={inputChat} onChange={(e) => setInputChat(e.target.value)} onKeyPress={(e) => e.key === "Enter" && enviarMensaje()} />
               <button onClick={enviarMensaje} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90"><Send size={20} /></button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL KYC (IDENTIDAD) */}
      {verificandoKYC && (
        <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full rounded-[40px] p-8 relative shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setVerificandoKYC(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
              <h3 className="font-black uppercase text-xl italic text-slate-800 mb-2">Verificación KYC</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 leading-relaxed">Para mayor seguridad, requerimos fotos reales de tus documentos de identidad.</p>
              
              <div className="space-y-4">
                 {[
                   { t: "Cédula (Frontal)", icon: <ShieldCheck size={18}/> },
                   { t: "Cédula (Trasera)", icon: <History size={18}/> },
                   { t: "Rostro con Cédula", icon: <Camera size={18}/> }
                 ].map((item, i) => (
                   <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-dashed border-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">{item.icon}</div>
                         <p className="text-[10px] font-black uppercase text-slate-600">{item.t}</p>
                      </div>
                      <button className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase">Subir</button>
                   </div>
                 ))}
                 <button onClick={async () => {
                   await updateDoc(doc(db, "usuarios", user.uid), { kycVerificado: true });
                   setVerificandoKYC(false);
                   alert("✅ Documentos enviados a revisión.");
                 }} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[11px] italic mt-4 shadow-xl">Enviar a Revisión</button>
              </div>
           </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10 shadow-lg">
        <button onClick={() => setVista("inicio")} className={vista === "inicio" ? "text-blue-600" : "text-slate-400"}><Car size={26} /></button>
        <button onClick={() => setVista("chat_soporte")} className={vista === "chat_soporte" ? "text-blue-600" : "text-slate-400"}><Headset size={26} /></button>
        <button onClick={() => setVista("perfil")} className={vista === "perfil" ? "text-blue-600" : "text-slate-400"}><User size={26} /></button>
      </nav>
    </div>
  );
}
