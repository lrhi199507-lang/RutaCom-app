import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where, getDocs
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, Trash2, MessageCircle, CreditCard, Users, ChevronLeft, MapPin, Bell
} from "lucide-react";

const UBICACIONES = {
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

export default function NavegacionPrincipal({ user }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([]); 
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [solicitudEnviada, setSolicitudEnviada] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);

  // ESTADOS DEL CHAT
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  // NUEVO: Estado para notificaciones en vivo
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState([]);

  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });

  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  // ESCUCHADORES GLOBALES (Usuarios, Viajes, Solicitudes y Notificaciones)
  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPerfilForm({
          marca: data.vehiculo?.marca || "", modelo: data.vehiculo?.modelo || "",
          placa: data.vehiculo?.placa || "", cedula: data.cedula || ""
        });
      }
    });

    const qViajes = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    const unsubViajes = onSnapshot(qViajes, (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qSoli = query(collection(db, "Solicitudes"), where("idChofer", "==", user.uid), where("estado", "==", "pendiente"));
    const unsubSoli = onSnapshot(qSoli, (snap) => {
      setSolicitudesRecibidas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // NUEVO: Escuchador global de mensajes no leídos para TODA LA APP
    const qNotificaciones = query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid), where("leido", "==", false));
    const unsubNotif = onSnapshot(qNotificaciones, (snap) => {
      setMensajesNoLeidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubViajes(); unsubSoli(); unsubNotif(); };
  }, [user]);

  // ESCUCHADOR DE CHAT ACTIVO
  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      const msjs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMensajesChat(msjs);

      // NUEVO: Marcar como leídos los mensajes en cuanto entramos al chat
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.receptorId === user.uid && data.leido === false) {
           updateDoc(doc(db, "MensajesPrivados", docSnap.id), { leido: true });
        }
      });
    });
    return () => unsubMsg();
  }, [chatActivo]);

  // NUEVO: Modificado para incluir quién recibe el mensaje (receptorId)
  const enviarMensajePrivado = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      await addDoc(collection(db, "MensajesPrivados"), {
        chatId: chatActivo.id,
        idViaje: chatActivo.idViaje,
        texto: nuevoMensaje.trim(),
        emisorId: user.uid,
        nombreEmisor: userData.nombre || "Usuario",
        receptorId: chatActivo.idOtro, // Sabe a quién avisarle
        leido: false, // Inicia como no leído
        fecha: serverTimestamp()
      });
      setNuevoMensaje("");
    } catch (error) {
      alert("Error al enviar mensaje.");
    }
  };

  const publicarRuta = async () => {
    if (userData?.kycVerificado !== true) return alert("🚫 Debes estar verificado para publicar.");
    if (!form.cO || !form.cD || !form.precio) return alert("Llena origen, destino y precio.");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form, precio: Number(form.precio), puestos: Number(form.puestos),
        conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp(), verificado: true
      });
      alert("🚀 ¡Viaje Publicado!");
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
    } catch (e) { alert("Error al publicar."); }
  };

  const enviarSolicitud = async () => {
    if (!viajeSeleccionado) return;
    try {
      const docRef = await addDoc(collection(db, "Solicitudes"), {
        idViaje: viajeSeleccionado.id,
        idPasajero: user.uid,
        nombrePasajero: userData.nombre || "Pasajero",
        idChofer: viajeSeleccionado.idCreador,
        ruta: `${viajeSeleccionado.cO} → ${viajeSeleccionado.cD}`,
        estado: "pendiente",
        fechaSolicitud: serverTimestamp()
      });
      setSolicitudEnviada(docRef.id);
      alert("✅ Solicitud enviada al chofer.");
    } catch (e) { 
      console.error(e);
      alert("Error al solicitar. Verifica las reglas de Firebase."); 
    }
  };

  const cancelarSolicitud = async () => {
    if (!solicitudEnviada) return;
    if (confirm("¿Quieres cancelar tu petición de cola?")) {
      try {
        await deleteDoc(doc(db, "Solicitudes", solicitudEnviada));
        setSolicitudEnviada(null);
        alert("Petición cancelada.");
      } catch (e) { alert("Error al cancelar."); }
    }
  };

  const guardarDatosPerfil = async () => {
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { 
        vehiculo: { marca: perfilForm.marca, modelo: perfilForm.modelo, placa: perfilForm.placa.toUpperCase() },
        cedula: perfilForm.cedula
      });
      setConfigOpen(false);
      alert("✅ Datos guardados exitosamente.");
    } catch (e) { alert("Error al guardar datos."); }
  };

  const enviarMensajeSoporte = () => {
    if (!mensajeSoporte.trim()) return;
    setChatSoporte([...chatSoporte, { texto: mensajeSoporte, mio: true }]);
    setMensajeSoporte("");
    setTimeout(() => setChatSoporte(p => [...p, { texto: "Recibido. Pronto te atenderemos.", mio: false }]), 1000);
  };

  // NUEVO: Se actualizaron los parámetros para guardar el ID del otro usuario
  const abrirChat = (idViaje, idOtroUsuario, nombreOtro) => {
    const chatId = [user.uid, idOtroUsuario].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro: idOtroUsuario, idViaje: idViaje });
    setVista("chat_privado");
  };

  const viajesFiltrados = viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD));
  const misViajesPublicados = viajes.filter(v => v.idCreador === user.uid);

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic uppercase">Cargando...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* NUEVO: NOTIFICACIÓN GLOBAL FLOTANTE DE MENSAJE NUEVO */}
      {mensajesNoLeidos.length > 0 && vista !== "chat_privado" && (
         <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-11/12 bg-blue-600 text-white p-4 rounded-3xl shadow-2xl z-50 animate-bounce border-4 border-white">
            <p className="text-xs font-black italic flex items-center gap-2"><Bell size={18} className="animate-pulse"/> ¡Tienes mensajes nuevos!</p>
            <p className="text-[10px] font-bold mt-1 opacity-80">{mensajesNoLeidos[0].nombreEmisor} te ha escrito.</p>
            <button 
               onClick={() => abrirChat(mensajesNoLeidos[0].idViaje, mensajesNoLeidos[0].emisorId, mensajesNoLeidos[0].nombreEmisor)}
               className="mt-3 bg-white text-blue-600 px-4 py-3 rounded-2xl text-xs font-black uppercase w-full shadow-lg">
               Abrir Chat
            </button>
         </div>
      )}

      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6 shadow-lg shadow-blue-200">D</div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic">{userData.nombre}</p></div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2 font-black italic text-xs shadow-lg">
          <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32 relative">
        {vista === "chat_privado" ? (
          <div className="flex flex-col h-full space-y-4 animate-in slide-in-from-right duration-300">
             <button onClick={() => {setVista("inicio"); setChatActivo(null);}} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic">
               <ChevronLeft size={16}/> Volver
            </button>
            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase tracking-widest">Chat con {chatActivo?.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-3 rounded-2xl max-w-[85%] text-xs font-bold ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text"
value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrivado()} className="flex-1 bg-slate-100 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Escribe..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg active:scale-95"><Send size={16}/></button>
               </div>
            </div>
          </div>
        ) : viajeSeleccionado ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic">
               <ChevronLeft size={16}/> Volver a la lista
            </button>

            <div className="bg-white rounded-[40px] border shadow-2xl overflow-hidden">
               <div className="bg-blue-600 p-8 text-white">
                  <div className="flex justify-between items-start mb-4">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-80 italic">Detalles de la Cola</p>
                     <p className="text-3xl font-black italic leading-none">${viajeSeleccionado.precio}</p>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.cO} <span className="opacity-50 mx-2">→</span> {viajeSeleccionado.cD}</p></div>
                     <div className="flex items-center gap-3"><Users size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.puestos} Asientos</p></div>
                     {viajeSeleccionado.extras && <p className="text-xs italic bg-blue-700 p-2 rounded-lg">Extras: {viajeSeleccionado.extras}</p>}
                  </div>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-blue-500"><User size={24} className="text-blue-600"/></div>
                     <div><p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Chófer</p><p className="font-black text-slate-800 uppercase italic">{viajeSeleccionado.conductor}</p></div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                     <div className="flex gap-2">
                        <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2 shadow-lg">
                           <MessageCircle size={18}/> Chat
                        </button>
                        {solicitudEnviada ? (
                          <button onClick={cancelarSolicitud} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">
                             Cancelar
                          </button>
                        ) : (
                          <button onClick={enviarSolicitud} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-blue-200">
                             Pedir Cola
                          </button>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          vista === "inicio" && (
            <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                MODO: {modo === "pasajero" ? "PASAJERO" : "CHÓFER"} (CAMBIAR)
              </button>

              {modo === "chofer" && (
                <div className="space-y-6">
                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2 animate-pulse"><Bell size={14}/> Solicitudes Entrantes:</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-3xl border-2 border-blue-500 flex justify-between items-center shadow-lg">
                           <div>
                              <p className="text-[10px] font-black text-slate-800 uppercase italic">{s.nombrePasajero}</p>
                              <p className="text-[8px] font-bold text-blue-600 uppercase">{s.ruta}</p>
                           </div>
                           <button onClick={() => abrirChat(s.idViaje, s.idPasajero, s.nombrePasajero)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><MessageCircle size={16}/></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-3">
                    <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2"><Navigation size={16}/> Publicar Nueva Ruta</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value, cO: ""})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!form.eO} value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad Origen</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value, cD: ""})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!form.eD} value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad Destino</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Asientos" className="bg-slate-50 p-4 rounded-xl border text-xs font-bold outline-none" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} />
                      <input type="number" placeholder="Precio $" className="bg-slate-50 p-4 rounded-xl border text-xs font-black text-blue-600 outline-none" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                    </div>
                    <input type="text" placeholder="Extras (Maletas, AC...)" className="w-full bg-slate-50 p-4 rounded-xl border text-xs font-bold outline-none" value={form.extras} onChange={(e)=>setForm({...form, extras: e.target.value})} />
                    <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Ahora</button>
                  </div>

                  {/* VIAJES PUBLICADOS POR EL CHOFER */}
                  {misViajesPublicados.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase italic flex items-center gap-2"><Car size={14}/> Tus Viajes Activos:</p>
                      {misViajesPublicados.map(v => (
                        <div key={v.id} className="bg-white p-4 rounded-[25px] border flex justify-between items-center shadow-sm">
                           <div>
                              <p className="font-black uppercase text-[10px] text-slate-800 italic">{v.cO} → {v.cD}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{v.puestos} Puestos | ${v.precio}</p>
                           </div>
                           <button onClick={async () => { if(confirm("¿Borrar ruta?")) await deleteDoc(doc(db, "Viajes", v.id)); }} className="text-red-500 p-2"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <hr className="my-6 border-slate-200"/>
                </div>
              )}

              {/* BUSCADOR Y LISTA GENERAL (Visible para ambos modos ahora) */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Explorar Viajes</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">DE: CIUDAD</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>{setFED(e.target.value); setFCD("");}}><option value="">A: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fED} value={fCD} onChange={(e)=>setFCD(e.target.value)}><option value="">A: CIUDAD</option>{fED && UBICACIONES[fED].map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                </div>
                {viajesFiltrados.map(v => (
                  <div key={v.id} className="bg-white p-5 rounded-[35px] border flex flex-col shadow-md space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1"><div className="flex items-center gap-1 mb-1">{v.verificado && <ShieldCheck size={12} className="text-blue-500" />}<p className="text-[9px] font-black text-slate-400 uppercase italic leading-none">{v.conductor}</p></div><p className="font-black uppercase text-xs text-slate-800 italic">{v.cO} → {v.cD}</p></div>
                      <p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p>
                    </div>
                    <button onClick={() => setViajeSeleccionado(v)} className="text-[9px] bg-slate-900 text-white px-8 py-2.5 rounded-full font-black uppercase italic shadow-lg">Ver Detalle</button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {vista === "perfil" && (
           <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col items-center relative">
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100 hover:bg-blue-50 transition-colors"><Settings size={20}/></button>
                 <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl relative">
                   <User size={48} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-1 right-1 bg-blue-600 p-1.5 rounded-full border-2 border-white"><CheckCircle size={14} className="text-white"/></div>}
                 </div>
                 <h2 className="font-black italic text-xl text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
                 <div className="flex items-center gap-2 mt-2 bg-slate-50 px-4 py-1.5 rounded-full border">
                    <CreditCard size={14} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-600 uppercase italic tracking-tighter">CI: {userData.cedula || "NO REGISTRADA"}</p>
                 </div>
              </div>

              {configOpen && (
                <div className="bg-white p-5 rounded-[30px] border shadow-lg space-y-3 animate-in slide-in-from-top-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2 mb-2"><Settings size={14}/> Configuración de Perfil</p>
                  <input type="text" placeholder="Cédula de Identidad" className="w-full bg-slate-50 p-3 rounded-xl border text-[11px] font-bold outline-none" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                  <p className="text-[10px] font-black text-slate-400 uppercase italic mt-2">Datos del Vehículo (Choferes)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Marca (Ej. Ford)" className="bg-slate-50 p-3 rounded-xl border text-[11px] font-bold outline-none" value={perfilForm.marca} onChange={(e)=>setPerfilForm({...perfilForm, marca: e.target.value})} />
                    <input type="text" placeholder="Modelo (Ej. Fiesta)" className="bg-slate-50 p-3 rounded-xl border text-[11px] font-bold outline-none" value={perfilForm.modelo} onChange={(e)=>setPerfilForm({...perfilForm, modelo: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Placa" className="w-full bg-slate-50 p-3 rounded-xl border text-[11px] font-bold uppercase outline-none" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                  <button onClick={guardarDatosPerfil} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic text-[11px] shadow-lg mt-2">Guardar Datos</button>
                </div>
              )}

              <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic tracking-widest bg-white rounded-2xl border shadow-sm mt-4"><LogOut size={16} /> Cerrar Sesión</button>
           </div>
        )}

        {vista === "soporte" && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[40px] border shadow-lg overflow-hidden">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-xs uppercase flex items-center justify-center gap-2 tracking-widest"><MessageCircle size={16} /> Soporte Técnico</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.mio ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2"><input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none border" placeholder="Problema..." /><button onClick={enviarMensajeSoporte} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lg"><Send size={18}/></button></div>
          </div>
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => {setVista("inicio"); setViajeSeleccionado(null); setChatActivo(null);}} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Viajes</span></button>
        <button onClick={() => {setVista("soporte"); setViajeSeleccionado(null); setChatActivo(null);}} className={`flex flex-col items-center gap-1 ${vista === "soporte" ? "text-blue-600" : "text-slate-300"}`}><MessageCircle size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Soporte</span></button>
        <button onClick={() => {setVista("perfil"); setViajeSeleccionado(null); setChatActivo(null);}} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Perfil</span></button>
      </nav>
    </div>
  );
}
