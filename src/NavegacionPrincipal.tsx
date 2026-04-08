import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where, limit
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, Trash2, MessageCircle, CreditCard, Users, ChevronLeft, MapPin, Bell, Edit2, AlertTriangle, Info
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
  const [misSolicitudes, setMisSolicitudes] = useState([]); 
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [solicitudEnviada, setSolicitudEnviada] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Estados de Chat e Inbox
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState([]);
  const [historialChats, setHistorialChats] = useState([]);
  const [solicitudVinculadaChat, setSolicitudVinculadaChat] = useState(null);

  // Estados de Viajes y Edición
  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
  const [viajeEditando, setViajeEditando] = useState(null); 

  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });
  
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const motivosOpciones = ["Ya no quiero viajar", "Conseguí otra cola", "Surgió un imprevisto", "Cambiaré de ruta o fecha"];

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

    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idChofer", "==", user.uid)), (snap) => {
      setSolicitudesRecibidas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), (snap) => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubNotif = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid), where("leido", "==", false)), (snap) => {
      setMensajesNoLeidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    let docsRecibidos = []; let docsEnviados = [];
    const actualizarHistorial = (todosLosDocs) => {
       const mapChats = new Map();
       todosLosDocs.forEach(d => {
          const data = d.data();
          const soyEmisor = data.emisorId === user.uid;
          const idOtro = soyEmisor ? data.receptorId : data.emisorId;
          const nombreOtro = soyEmisor ? (data.nombreReceptor || "Usuario") : data.nombreEmisor;
          const fechaMs = data.fecha ? data.fecha.toMillis() : Date.now();
          if (!mapChats.has(data.chatId)) {
             mapChats.set(data.chatId, { chatId: data.chatId, idViaje: data.idViaje, idOtro, nombreOtro, ultimoMensaje: data.texto, fecha: fechaMs });
          } else if (fechaMs > mapChats.get(data.chatId).fecha) {
             mapChats.set(data.chatId, { ...mapChats.get(data.chatId), ultimoMensaje: data.texto, fecha: fechaMs });
          }
       });
       setHistorialChats(Array.from(mapChats.values()).sort((a,b) => b.fecha - a.fecha));
    };
    const unsubR = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid)), snap => { docsRecibidos = snap.docs; actualizarHistorial([...docsRecibidos, ...docsEnviados]); });
    const unsubE = onSnapshot(query(collection(db, "MensajesPrivados"), where("emisorId", "==", user.uid)), snap => { docsEnviados = snap.docs; actualizarHistorial([...docsRecibidos, ...docsEnviados]); });

    const unsubSoporte = onSnapshot(query(collection(db, "MensajesSoporte"), where("usuarioId", "==", user.uid)), (snap) => {
      const msjs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msjs.sort((a, b) => (a.fecha?.toMillis() || 0) - (b.fecha?.toMillis() || 0));
      setChatSoporte(msjs);
    });

    return () => { unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); unsubNotif(); unsubR(); unsubE(); unsubSoporte(); };
  }, [user]);

  // Listener para la solicitud vinculada al chat activo
  useEffect(() => {
    if (!chatActivo) { setSolicitudVinculadaChat(null); return; }
    const idPasajero = modo === "pasajero" ? user.uid : chatActivo.idOtro;
    const idChofer = modo === "chofer" ? user.uid : chatActivo.idOtro;
    const qS = query(collection(db, "Solicitudes"), where("idViaje", "==", chatActivo.idViaje), where("idPasajero", "==", idPasajero), where("idChofer", "==", idChofer), limit(1));
    const unsubSoliVin = onSnapshot(qS, (snap) => {
       if (!snap.empty) setSolicitudVinculadaChat({ id: snap.docs[0].id, ...snap.docs[0].data() });
       else setSolicitudVinculadaChat(null);
    });
    return () => unsubSoliVin();
  }, [chatActivo, modo, user.uid]);

  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      setMensajesChat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      snap.docs.forEach(docSnap => {
        if (docSnap.data().receptorId === user.uid && !docSnap.data().leido) updateDoc(doc(db, "MensajesPrivados", docSnap.id), { leido: true });
      });
    });
    return () => unsubMsg();
  }, [chatActivo, user.uid]);

  const enviarMensajePrivado = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      await addDoc(collection(db, "MensajesPrivados"), {
        chatId: chatActivo.id, idViaje: chatActivo.idViaje, texto: nuevoMensaje.trim(), emisorId: user.uid, nombreEmisor: userData.nombre,
        receptorId: chatActivo.idOtro, nombreReceptor: chatActivo.nombre, leido: false, fecha: serverTimestamp()
      });
      setNuevoMensaje("");
    } catch (e) { alert("Error."); }
  };

  const enviarMensajeSoporte = async () => {
    if (!mensajeSoporte.trim()) return;
    try {
      await addDoc(collection(db, "MensajesSoporte"), { usuarioId: user.uid, texto: mensajeSoporte.trim(), mio: true, fecha: serverTimestamp() });
      setMensajeSoporte("");
      setTimeout(async () => {
        await addDoc(collection(db, "MensajesSoporte"), { usuarioId: user.uid, texto: "¡Hola! 👋 Hemos recibido tu reporte. Un asesor te contactará pronto.", mio: false, fecha: serverTimestamp() });
      }, 1500);
    } catch (e) { alert("Error."); }
  };

  const publicarOEditarRuta = async () => {
    if (userData?.kycVerificado !== true) return alert("🚫 Debes estar verificado.");
    if (!form.cO || !form.cD || !form.precio) return alert("Llena los campos.");
    try {
      if (viajeEditando) {
         await updateDoc(doc(db, "Viajes", viajeEditando), { ...form, precio: Number(form.precio), puestos: Number(form.puestos) });
         setViajeEditando(null);
      } else {
         await addDoc(collection(db, "Viajes"), { ...form, precio: Number(form.precio), puestos: Number(form.puestos), conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp(), verificado: true });
      }
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
      alert("Listo!");
    } catch (e) { alert("Error."); }
  };

  const enviarSolicitud = async (viaje) => {
    const v = viaje || viajeSeleccionado;
    if (!v) return;
    try {
      const docRef = await addDoc(collection(db, "Solicitudes"), {
        idViaje: v.id, idPasajero: user.uid, nombrePasajero: userData.nombre, idChofer: v.idCreador, nombreChofer: v.conductor, 
        ruta: `${v.cO} → ${v.cD}`, estado: "pendiente", fechaSolicitud: serverTimestamp()
      });
      setSolicitudEnviada(docRef.id);
      alert("✅ Solicitud enviada.");
    } catch (e) { alert("Error."); }
  };

  const confirmarViaje = async (idSoli) => {
     try {
        await updateDoc(doc(db, "Solicitudes", idSoli), { estado: "confirmado", fechaConfirmacion: serverTimestamp() });
        alert("🎉 ¡Viaje Confirmado! Prepárate para el encuentro.");
     } catch (e) { alert("Error al confirmar."); }
  };

  const procesarCancelacion = async () => {
    if (!motivoCancelacion) return alert("Selecciona un motivo.");
    try {
      await deleteDoc(doc(db, "Solicitudes", modalCancelacion.idSolicitud));
      setModalCancelacion({ visible: false, idSolicitud: null }); setMotivoCancelacion("");
      alert("Cancelado.");
    } catch (e) { alert("Error."); }
  };

  const guardarDatosPerfil = async () => {
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { vehiculo: { marca: perfilForm.marca, modelo: perfilForm.modelo, placa: perfilForm.placa.toUpperCase() }, cedula: perfilForm.cedula });
      setConfigOpen(false); alert("Guardado.");
    } catch (e) { alert("Error."); }
  };

  const abrirChat = (idViaje, idOtroUsuario, nombreOtro) => {
    const chatId = [user.uid, idOtroUsuario].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro: idOtroUsuario, idViaje: idViaje });
    setVista("chat_privado");
  };

  const verDetalleDesdeChat = () => {
     const v = viajes.find(v => v.id === chatActivo.idViaje);
     if (v) { setViajeSeleccionado(v); setVista("inicio"); }
  };

  const viajesFiltrados = viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD));
  const misViajesPublicados = viajes.filter(v => v.idCreador === user.uid);

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic uppercase">Cargando...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      {modalCancelacion.visible && (
        <div className="absolute inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
              <div className="flex items-center gap-2 text-red-500 mb-4"><AlertTriangle size={24}/> <h3 className="font-black italic uppercase text-lg">Cancelar</h3></div>
              <div className="space-y-2 mb-6">
                 {motivosOpciones.map(m => (
                    <button key={m} onClick={()=>setMotivoCancelacion(m)} className={`w-full p-3 rounded-xl text-xs font-black uppercase text-left border-2 ${motivoCancelacion === m ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 text-slate-500'}`}>{m}</button>
                 ))}
              </div>
              <div className="flex gap-2">
                 <button onClick={()=>setModalCancelacion({visible:false, idSolicitud:null})} className="flex-1 p-3 bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs">Atrás</button>
                 <button onClick={procesarCancelacion} className="flex-1 p-3 bg-red-500 text-white rounded-xl font-black uppercase text-xs">Confirmar</button>
              </div>
           </div>
        </div>
      )}

      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6 shadow-lg">D</div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic">{userData.nombre}</p></div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2 font-black italic text-xs shadow-lg">
          <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32 relative">
        {vista === "chat_privado" ? (
          <div className="flex flex-col h-full space-y-3 animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center">
                <button onClick={() => {setVista("inicio"); setChatActivo(null);}} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic"><ChevronLeft size={16}/> Volver</button>
                <button onClick={verDetalleDesdeChat} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full font-black uppercase text-[9px] italic border border-blue-100"><Info size={14}/> Ver Viaje</button>
             </div>

             {/* BARRA DE ACCIÓN DENTRO DEL CHAT */}
             <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border-b-4 border-blue-600">
                <div className="flex justify-between items-center mb-3">
                   <p className="text-[10px] font-black text-blue-400 uppercase italic">Estado de la Cola:</p>
                   <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${!solicitudVinculadaChat ? 'bg-slate-800 text-slate-500' : solicitudVinculadaChat.estado === 'confirmado' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                      {!solicitudVinculadaChat ? "Sin Petición" : solicitudVinculadaChat.estado}
                   </span>
                </div>
                
                <div className="flex gap-2">
                   {modo === "pasajero" ? (
                      !solicitudVinculadaChat ? (
                        <button onClick={() => enviarSolicitud(viajes.find(v=>v.id === chatActivo.idViaje))} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] italic shadow-lg">Pedir la Cola Ahora</button>
                      ) : solicitudVinculadaChat.estado === "pendiente" ? (
                        <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: solicitudVinculadaChat.id })} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] italic shadow-lg">Cancelar Petición</button>
                      ) : (
                        <p className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] italic text-center">¡Cola Confirmada!</p>
                      )
                   ) : (
                      solicitudVinculadaChat && solicitudVinculadaChat.estado === "pendiente" && (
                        <>
                           <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: solicitudVinculadaChat.id })} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-black uppercase text-[10px] italic">Rechazar</button>
                           <button onClick={() => confirmarViaje(solicitudVinculadaChat.id)} className="flex-[2] py-3 bg-green-500 text-white rounded-xl font-black uppercase text-[10px] italic shadow-lg shadow-green-900/50 animate-pulse">Confirmar Viaje</button>
                        </>
                      )
                   )}
                </div>
             </div>

            <div className="flex-1 bg-white rounded-[35px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-50 p-3 text-slate-400 text-center font-black italic text-[9px] uppercase tracking-widest border-b">Chat con {chatActivo?.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-3 rounded-2xl max-w-[85%] text-xs font-bold ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrivado()} className="flex-1 bg-slate-100 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Escribe..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg"><Send size={16}/></button>
               </div>
            </div>
          </div>
        ) : viajeSeleccionado ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic"><ChevronLeft size={16}/> Volver</button>
            <div className="bg-white rounded-[40px] border shadow-2xl overflow-hidden">
               <div className="bg-blue-600 p-8 text-white">
                  <div className="flex justify-between items-start mb-4">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-80 italic">Detalles</p>
                     <p className="text-3xl font-black italic leading-none">${viajeSeleccionado.precio}</p>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.cO} → {viajeSeleccionado.cD}</p></div>
                     <div className="flex items-center gap-3"><Users size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.puestos} Asientos</p></div>
                  </div>
               </div>
               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-blue-500"><User size={24} className="text-blue-600"/></div>
                     <div><p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Chófer</p><p className="font-black text-slate-800 uppercase italic">{viajeSeleccionado.conductor}</p></div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2">
                        <MessageCircle size={18}/> Chat
                     </button>
                     <button onClick={()=>enviarSolicitud()} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Pedir Cola</button>
                  </div>
               </div>
            </div>
          </div>
        ) : vista === "inicio" && (
           <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm">
                MODO: {modo.toUpperCase()} (CAMBIAR)
              </button>

              {historialChats.length > 0 && (
                 <div className="bg-white p-4 rounded-[30px] shadow-sm border space-y-3 mb-6">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><MessageCircle size={14}/> Chats Activos</p>
                    {historialChats.map(c => (
                       <div key={c.chatId} onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} className="bg-slate-50 p-3 rounded-2xl border flex flex-col shadow-sm cursor-pointer">
                          <p className="text-[11px] font-black text-slate-800 uppercase italic">{c.nombreOtro}</p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">{c.ultimoMensaje}</p>
                       </div>
                    ))}
                 </div>
              )}

              {modo === "chofer" ? (
                <div className="space-y-6">
                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Bell size={14}/> Solicitudes:</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className={`bg-white p-4 rounded-3xl border-2 flex flex-col gap-3 shadow-lg ${s.estado === 'confirmado' ? 'border-green-500' : 'border-blue-500'}`}>
                           <div className="flex justify-between items-center">
                              <div><p className="text-[10px] font-black text-slate-800 uppercase italic">{s.nombrePasajero}</p><p className="text-[8px] font-bold text-blue-600 uppercase">{s.ruta}</p></div>
                              <button onClick={() => abrirChat(s.idViaje, s.idPasajero, s.nombrePasajero)} className="p-3 bg-blue-600 text-white rounded-xl"><MessageCircle size={16}/></button>
                           </div>
                           {s.estado === "pendiente" ? (
                              <button onClick={() => confirmarViaje(s.id)} className="w-full py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase italic">Confirmar Viaje</button>
                           ) : (
                              <p className="text-center text-green-600 font-black uppercase text-[10px] italic">Viaje Confirmado ✅</p>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* ... resto del modo chofer ... */}
                  <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-3">
                    <h3 className="text-xs font-black uppercase text-blue-600 italic">{viajeEditando ? 'Editando' : 'Publicar'} Ruta</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <input type="number" placeholder="Asientos" className="bg-slate-50 p-4 rounded-xl border text-xs font-bold" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} />
                       <input type="number" placeholder="Precio $" className="bg-slate-50 p-4 rounded-xl border text-xs font-black text-blue-600" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                    </div>
                    <button onClick={publicarOEditarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Ahora</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Explorador de viajes del pasajero */}
                  <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic"><Search size={14}/> Buscar Viaje</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>setFEO(e.target.value)}><option value="">DESDE</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>setFED(e.target.value)}><option value="">HACIA</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                    </div>
                  </div>
                  {viajesFiltrados.map(v => (
                    <div key={v.id} className="bg-white p-5 rounded-[35px] border flex flex-col shadow-md space-y-3">
                      <div className="flex justify-between items-start">
                        <div><div className="flex items-center gap-1 mb-1">{v.verificado && <ShieldCheck size={12} className="text-blue-500" />}<p className="text-[9px] font-black text-slate-400 uppercase italic">{v.conductor}</p></div><p className="font-black uppercase text-xs text-slate-800 italic">{v.cO} → {v.cD}</p></div>
                        <p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p>
                      </div>
                      <button onClick={() => setViajeSeleccionado(v)} className="text-[9px] bg-slate-900 text-white px-8 py-2.5 rounded-full font-black uppercase italic">Ver Detalle</button>
                    </div>
                  ))}
                </div>
              )}
           </div>
        )}

        {/* VISTAS DE PERFIL Y SOPORTE (se mantienen igual que antes) */}
        {vista === "perfil" && (
           <div className="space-y-4 animate-in fade-in">
              <div className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col items-center">
                 <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl relative">
                   <User size={48} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-1 right-1 bg-blue-600 p-1.5 rounded-full border-2 border-white"><CheckCircle size={14} className="text-white"/></div>}
                 </div>
                 <h2 className="font-black italic text-xl text-slate-800 uppercase">{userData.nombre}</h2>
                 <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">CI: {userData.cedula || "Pendiente"}</p>
              </div>
              <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic bg-white rounded-2xl border">Cerrar Sesión</button>
           </div>
        )}

        {vista === "soporte" && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[40px] border shadow-lg overflow-hidden">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-xs uppercase">Soporte Técnico</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-[11px] font-bold ${m.mio ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2">
               <input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe..." />
               <button onClick={enviarMensajeSoporte} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
             </div>
          </div>
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => {setVista("inicio"); setViajeSeleccionado(null); setChatActivo(null);}} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={26} /><span className="text-[9px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => {setVista("soporte"); setViajeSeleccionado(null); setChatActivo(null);}} className={`flex flex-col items-center gap-1 ${vista === "soporte" ? "text-blue-600" : "text-slate-300"}`}><MessageCircle size={26} /><span className="text-[9px] font-black uppercase italic">Soporte</span></button>
        <button onClick={() => {setVista("perfil"); setViajeSeleccionado(null); setChatActivo(null);}} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={26} /><span className="text-[9px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
