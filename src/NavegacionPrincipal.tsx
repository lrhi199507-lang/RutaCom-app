import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, Trash2, MessageCircle, CreditCard, Users, 
  ChevronLeft, MapPin, Bell, Edit2, AlertTriangle, Star, X
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

  // Perfil Público
  const [perfilPublico, setPerfilPublico] = useState(null);

  // Estados de Viajes y Edición
  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
  const [viajeEditando, setViajeEditando] = useState(null); 

  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });
  
  // Estados de Soporte Técnico
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  // Estado Modal Cancelación
  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const motivosOpciones = ["Ya no quiero viajar", "Conseguí otra cola", "Surgió un imprevisto", "Cambiaré de ruta o fecha"];

  // --- EFECTOS DE FIREBASE (SINCRONIZACIÓN TOTAL) ---
  useEffect(() => {
    if (!user) return;

    // 1. Datos del Usuario
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

    // 2. Cargar Viajes
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Solicitudes recibidas (Modo Chofer)
    const unsubSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idChofer", "==", user.uid)), (snap) => {
      setSolicitudesRecibidas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Mis solicitudes enviadas (Modo Pasajero)
    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), (snap) => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 5. Notificaciones de mensajes no leídos
    const unsubNotif = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid), where("leido", "==", false)), (snap) => {
      setMensajesNoLeidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 6. Lógica de Inbox / Historial de Chats
    let docsRecibidos = [];
    let docsEnviados = [];
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

    const unsubR = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid)), snap => {
       docsRecibidos = snap.docs; actualizarHistorial([...docsRecibidos, ...docsEnviados]);
    });
    const unsubE = onSnapshot(query(collection(db, "MensajesPrivados"), where("emisorId", "==", user.uid)), snap => {
       docsEnviados = snap.docs; actualizarHistorial([...docsRecibidos, ...docsEnviados]);
    });

    // 7. Soporte Técnico
    const unsubSoporte = onSnapshot(query(collection(db, "MensajesSoporte"), where("usuarioId", "==", user.uid)), (snap) => {
      const msjs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatSoporte(msjs.sort((a, b) => (a.fecha?.toMillis() || 0) - (b.fecha?.toMillis() || 0)));
    });

    return () => { 
      unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); 
      unsubNotif(); unsubR(); unsubE(); unsubSoporte(); 
    };
  }, [user]);

  // --- LÓGICA DE CHAT ACTIVO ---
  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      setMensajesChat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      snap.docs.forEach(docSnap => {
        if (docSnap.data().receptorId === user.uid && !docSnap.data().leido) {
           updateDoc(doc(db, "MensajesPrivados", docSnap.id), { leido: true });
        }
      });
    });
    return () => unsubMsg();
  }, [chatActivo, user.uid]);

  // --- FUNCIONES DE ACCIÓN ---
  const enviarMensajePrivado = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      await addDoc(collection(db, "MensajesPrivados"), {
        chatId: chatActivo.id, idViaje: chatActivo.idViaje, texto: nuevoMensaje.trim(),
        emisorId: user.uid, nombreEmisor: userData.nombre || "Usuario",
        receptorId: chatActivo.idOtro, nombreReceptor: chatActivo.nombre,
        leido: false, fecha: serverTimestamp()
      });
      setNuevoMensaje("");
    } catch (e) { console.error(e); }
  };

  const publicarOEditarRuta = async () => {
    if (userData?.kycVerificado !== true) return alert("🚫 Debes estar verificado para publicar.");
    if (!form.cO || !form.cD || !form.precio) return alert("Llena origen, destino y precio.");
    try {
      const dataViaje = { ...form, precio: Number(form.precio), puestos: Number(form.puestos) };
      if (viajeEditando) {
         await updateDoc(doc(db, "Viajes", viajeEditando), dataViaje);
         setViajeEditando(null);
      } else {
         await addDoc(collection(db, "Viajes"), { ...dataViaje, conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp(), verificado: true });
      }
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
      alert("Operación exitosa!");
    } catch (e) { alert("Error al guardar."); }
  };

  const cargarParaEditar = (v) => {
     setViajeEditando(v.id);
     setForm({ eO: v.eO, cO: v.cO, eD: v.eD, cD: v.cD, precio: v.precio, puestos: v.puestos, extras: v.extras || "" });
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const enviarSolicitud = async () => {
    if (!viajeSeleccionado) return;
    try {
      const docRef = await addDoc(collection(db, "Solicitudes"), {
        idViaje: viajeSeleccionado.id, idPasajero: user.uid, nombrePasajero: userData.nombre || "Pasajero",
        idChofer: viajeSeleccionado.idCreador, nombreChofer: viajeSeleccionado.conductor, 
        ruta: `${viajeSeleccionado.cO} → ${viajeSeleccionado.cD}`, estado: "pendiente", fechaSolicitud: serverTimestamp()
      });
      setSolicitudEnviada(docRef.id);
      alert("✅ Solicitud enviada.");
    } catch (e) { alert("Error."); }
  };

  const procesarCancelacion = async () => {
    if (!motivoCancelacion) return alert("Selecciona un motivo.");
    try {
      await deleteDoc(doc(db, "Solicitudes", modalCancelacion.idSolicitud));
      setModalCancelacion({ visible: false, idSolicitud: null });
      setMotivoCancelacion("");
      alert("Cancelado correctamente.");
    } catch (e) { alert("Error."); }
  };

  const guardarDatosPerfil = async () => {
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { 
        vehiculo: { marca: perfilForm.marca, modelo: perfilForm.modelo, placa: perfilForm.placa.toUpperCase() },
        cedula: perfilForm.cedula
      });
      setConfigOpen(false);
      alert("✅ Datos guardados.");
    } catch (e) { alert("Error."); }
  };

  const abrirChat = (idViaje, idOtroUsuario, nombreOtro) => {
    const chatId = [user.uid, idOtroUsuario].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro: idOtroUsuario, idViaje: idViaje });
    setVista("chat_privado");
  };

  const cambiarVista = (v) => { setVista(v); setViajeSeleccionado(null); setChatActivo(null); };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic">CARGANDO...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* --- MODALES Y OVERLAYS --- */}
      {perfilPublico && (
        <div className="absolute inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[40px] p-8 w-full max-w-xs shadow-2xl relative border-t-8 border-blue-600">
              <button onClick={() => setPerfilPublico(null)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><X size={24}/></button>
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-2 border-blue-200">
                    <User size={48} className="text-blue-600"/>
                 </div>
                 <h3 className="font-black italic uppercase text-2xl text-slate-800">{perfilPublico.nombre}</h3>
                 <div className="flex gap-2 mt-6 w-full">
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border">
                       <Star size={20} className="text-yellow-400 fill-yellow-400 mx-auto mb-1"/>
                       <p className="text-xl font-black italic text-slate-800">4.9</p>
                       <p className="text-[8px] font-black uppercase text-slate-400">Puntuación</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border">
                       <Car size={20} className="text-blue-500 mx-auto mb-1"/>
                       <p className="text-xl font-black italic text-slate-800">+50</p>
                       <p className="text-[8px] font-black uppercase text-slate-400">Colas</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {modalCancelacion.visible && (
        <div className="absolute inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[35px] p-6 w-full max-w-xs shadow-2xl">
              <h3 className="font-black italic uppercase text-red-500 flex items-center gap-2 mb-4"><AlertTriangle/> ¿Cancelar?</h3>
              <div className="space-y-2 mb-6">
                 {motivosOpciones.map(m => (
                    <button key={m} onClick={()=>setMotivoCancelacion(m)} className={`w-full p-3 rounded-xl text-[10px] font-black uppercase text-left border-2 transition-all ${motivoCancelacion === m ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                       {m}
                    </button>
                 ))}
              </div>
              <div className="flex gap-2">
                 <button onClick={()=>setModalCancelacion({visible:false})} className="flex-1 p-3 bg-slate-100 rounded-xl font-black text-xs">NO</button>
                 <button onClick={procesarCancelacion} className="flex-1 p-3 bg-red-500 text-white rounded-xl font-black text-xs">SÍ, CANCELAR</button>
              </div>
           </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-12 shadow-lg shadow-blue-200">D</div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p></div>
        </div>
        <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl active:scale-95 transition-transform">
          <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {/* INICIO (Dashboard Pasajero/Chofer) */}
        {vista === "inicio" && !viajeSeleccionado && (
           <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"} ➔
              </button>

              {/* Inbox Rápido */}
              {historialChats.length > 0 && (
                <div className="bg-white p-4 rounded-[30px] shadow-sm border space-y-3">
                   <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><MessageCircle size={14}/> Chats Recientes</p>
                   {historialChats.slice(0, 3).map(c => (
                      <div key={c.chatId} onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} className="bg-slate-50 p-3 rounded-2xl border flex flex-col cursor-pointer active:scale-95 transition-all">
                         <p className="text-[11px] font-black text-slate-800 uppercase italic">{c.nombreOtro}</p>
                         <p className="text-[10px] font-bold text-slate-500 truncate">{c.ultimoMensaje}</p>
                      </div>
                   ))}
                </div>
              )}

              {/* Secciones de Modo Chofer */}
              {modo === "chofer" && (
                <div className="space-y-6">
                  {/* Publicar Viaje */}
                  <div className={`bg-white p-6 rounded-[35px] border shadow-xl space-y-3 ${viajeEditando ? 'ring-4 ring-yellow-400' : ''}`}>
                    <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2">
                       {viajeEditando ? "Editando Ruta Activa" : "Publicar Nueva Ruta"}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value, cO: ""})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eO} value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad Origen</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value, cD: ""})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold" disabled={!form.eD} value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad Destino</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Asientos" className="bg-slate-50 p-3 rounded-xl border text-xs font-bold" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} />
                      <input type="number" placeholder="Precio $" className="bg-slate-50 p-3 rounded-xl border text-xs font-black text-blue-600" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                    </div>
                    <button onClick={publicarOEditarRuta} className={`w-full py-4 text-white rounded-2xl font-black uppercase italic shadow-lg ${viajeEditando ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                       {viajeEditando ? "Actualizar Viaje" : "Publicar Ahora"}
                    </button>
                  </div>

                  {/* Solicitudes de Pasajeros */}
                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Bell size={14} className="animate-bounce"/> Solicitudes Recibidas:</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-3xl border-2 border-blue-500 flex flex-col gap-3 shadow-lg">
                           <div className="flex justify-between items-center">
                              <div className="cursor-pointer" onClick={() => setPerfilPublico({ nombre: s.nombrePasajero, rol: "Pasajero", id: s.idPasajero })}>
                                 <p className="text-[11px] font-black text-slate-800 uppercase italic underline">{s.nombrePasajero}</p>
                                 <p className="text-[8px] font-bold text-blue-600 uppercase">{s.ruta}</p>
                              </div>
                              <button onClick={() => abrirChat(s.idViaje, s.idPasajero, s.nombrePasajero)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><MessageCircle size={16}/></button>
                           </div>
                           <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: s.id })} className="w-full p-2 bg-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase">Rechazar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Market Universal (Filtros) */}
              <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar Colas Disponibles</p>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">A: ESTADO</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
              </div>

              {/* Lista de Viajes */}
              <div className="space-y-4">
                 {viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD)).map(v => (
                   <div key={v.id} className="bg-white p-5 rounded-[35px] border flex flex-col shadow-md space-y-4">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase italic mb-1">{v.conductor}</p>
                           <p className="font-black uppercase text-sm text-slate-800 italic">{v.cO} → {v.cD}</p>
                        </div>
                        <p className="text-2xl font-black text-blue-600 italic leading-none">${v.precio}</p>
                     </div>
                     <button onClick={() => setViajeSeleccionado(v)} className="w-full bg-slate-900 text-white py-3 rounded-2xl text-[9px] font-black uppercase italic tracking-widest shadow-lg">Ver Detalles del Viaje</button>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* DETALLE DEL VIAJE */}
        {viajeSeleccionado && vista === "inicio" && (
           <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic"><ChevronLeft size={16}/> Volver</button>
              <div className="bg-white rounded-[40px] border shadow-2xl overflow-hidden">
                 <div className="bg-blue-600 p-8 text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 italic mb-2">Resumen de la Cola</p>
                    <p className="text-4xl font-black italic leading-none mb-6">${viajeSeleccionado.precio}</p>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.cO} → {viajeSeleccionado.cD}</p></div>
                       <div className="flex items-center gap-3"><Users size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.puestos} Puestos Libres</p></div>
                    </div>
                 </div>
                 <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setPerfilPublico({ nombre: viajeSeleccionado.conductor, rol: "Chófer", id: viajeSeleccionado.idCreador })}>
                       <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-inner"><User size={28} className="text-blue-600"/></div>
                       <div><p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Chófer Verificado</p><p className="font-black text-slate-800 uppercase italic text-lg">{viajeSeleccionado.conductor}</p></div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                       <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2"><MessageCircle size={18}/> Chat</button>
                       <button onClick={enviarSolicitud} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Confirmar</button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* CHAT PRIVADO */}
        {vista === "chat_privado" && chatActivo && (
          <div className="flex flex-col h-[70vh] animate-in slide-in-from-right">
            <button onClick={() => setVista("inicio")} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] mb-4"><ChevronLeft size={16}/> Volver</button>
            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase tracking-widest">Conversando con {chatActivo.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-4 rounded-3xl max-w-[80%] text-[11px] font-bold shadow-sm ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} className="flex-1 bg-slate-100 p-3 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe un mensaje..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
               </div>
            </div>
          </div>
        )}

        {/* WALLET */}
        {vista === "wallet" && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Billetera</h2>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                 <Wallet size={150} className="absolute -right-10 -bottom-10 opacity-10" />
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Saldo en Cuenta</p>
                 <p className="text-6xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => alert("Próximamente: Pago móvil y tarjetas")} className="bg-slate-900 text-white p-6 rounded-[30px] font-black uppercase italic text-xs shadow-lg flex flex-col items-center gap-3"><CreditCard size={24} className="text-blue-400"/> Recargar</button>
                 <button onClick={() => alert("Próximamente: Retiros bancarios")} className="bg-white border-2 border-slate-200 text-slate-700 p-6 rounded-[30px] font-black uppercase italic text-xs flex flex-col items-center gap-3"><Wallet size={24} className="text-slate-400"/> Retirar</button>
              </div>
           </div>
        )}

        {/* SOPORTE */}
        {vista === "soporte" && (
          <div className="flex flex-col h-[70vh] bg-white rounded-[40px] border shadow-lg overflow-hidden animate-in fade-in">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-[10px] uppercase tracking-widest">Soporte Dame La Cola</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                <div className="bg-blue-100 p-4 rounded-2xl text-[10px] font-bold text-blue-800 italic">¡Hola! Cuéntanos tu problema o duda y un administrador te responderá aquí mismo.</div>
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-3xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.mio ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2">
               <input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe al soporte..." />
               <button onClick={async () => {
                  if(!mensajeSoporte.trim()) return;
                  await addDoc(collection(db, "MensajesSoporte"), { usuarioId: user.uid, texto: mensajeSoporte.trim(), mio: true, fecha: serverTimestamp() });
                  setMensajeSoporte("");
               }} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center"><Send size={18}/></button>
             </div>
          </div>
        )}

        {/* PERFIL */}
        {vista === "perfil" && (
           <div className="space-y-4 animate-in fade-in">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative">
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={22}/></button>
                 <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl relative">
                   <User size={56} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full border-4 border-white"><CheckCircle size={16} className="text-white"/></div>}
                 </div>
                 <h2 className="font-black italic text-2xl text-slate-800 uppercase">{userData.nombre}</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-1">{userData.kycVerificado ? "Usuario Verificado" : "Pendiente Verificación"}</p>
              </div>

              {configOpen && (
                <div className="bg-white p-6 rounded-[35px] border shadow-2xl space-y-3 animate-in slide-in-from-top-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic mb-2">Editar Datos Personales</p>
                  <input type="text" placeholder="Cédula" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Marca Vehículo" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.marca} onChange={(e)=>setPerfilForm({...perfilForm, marca: e.target.value})} />
                    <input type="text" placeholder="Modelo Vehículo" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold outline-none" value={perfilForm.modelo} onChange={(e)=>setPerfilForm({...perfilForm, modelo: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Placa" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase outline-none" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                  <button onClick={guardarDatosPerfil} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Guardar Cambios</button>
                </div>
              )}
              <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3 italic tracking-widest bg-white rounded-[30px] border shadow-sm mt-4"><LogOut size={20} /> Cerrar Sesión</button>
           </div>
        )}
      </main>

      {/* --- NAV BAR --- */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <button onClick={() => cambiarVista("inicio")} className={`flex flex-col items-center gap-1 transition-all ${vista === "inicio" ? "text-blue-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><Car size={28} /><span className="text-[8px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => cambiarVista("soporte")} className={`flex flex-col items-center gap-1 transition-all ${vista === "soporte" ? "text-blue-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><MessageCircle size={28} /><span className="text-[8px] font-black uppercase italic">Ayuda</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 transition-all ${vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><User size={28} /><span className="text-[8px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
