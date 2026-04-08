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
  ChevronLeft, MapPin, Bell, Edit2, AlertTriangle, Star, X,
  Map as MapIcon, Flag
} from "lucide-react";

// --- CONSTANTES DE UBICACIÓN ---
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

  // Estados de Viajes y Edición (Modo Chofer)
  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
  const [viajeEditando, setViajeEditando] = useState(null); 

  // Filtros de búsqueda (LAS 4 CASILLAS)
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  // Configuración Perfil
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });
  
  // Soporte Técnico
  const [mensajeSoporte, setMensajeSoporte] = useState("");
  const [chatSoporte, setChatSoporte] = useState([]);

  // Modal Cancelación
  const [modalCancelacion, setModalCancelacion] = useState({ visible: false, idSolicitud: null });
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const motivosOpciones = ["Ya no quiero viajar", "Conseguí otra cola", "Surgió un imprevisto", "Cambiaré de ruta o fecha"];

  // --- ESTADO DE VIAJE ACTIVO Y GPS ---
  const [viajeActivo, setViajeActivo] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null); // Nuevo estado para guardar las coordenadas

  // --- EFECTOS DE FIREBASE (SINCRONIZACIÓN TOTAL) ---
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

    const unsubSoporte = onSnapshot(query(collection(db, "MensajesSoporte"), where("usuarioId", "==", user.uid)), (snap) => {
      const msjs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatSoporte(msjs.sort((a, b) => (a.fecha?.toMillis() || 0) - (b.fecha?.toMillis() || 0)));
    });

    // ESCUCHA DE VIAJE ACTIVO (GPS/Confirmados)
    const unsubViajeActivo = onSnapshot(query(collection(db, "Solicitudes"), where("estado", "==", "confirmado")), (snap) => {
      const actual = snap.docs.map(d => ({id: d.id, ...d.data()})).find(s => s.idPasajero === user.uid || s.idChofer === user.uid);
      setViajeActivo(actual || null);
    });

    return () => { 
      unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); 
      unsubNotif(); unsubR(); unsubE(); unsubSoporte(); unsubViajeActivo();
    };
  }, [user]);

  // --- NUEVO: EFECTO DE RASTREO GPS ---
  useEffect(() => {
    let watchId;
    // Solo activamos el GPS si estamos dentro de un viaje
    if (vista === "en_viaje" && viajeActivo) {
      if ("geolocation" in navigator) {
        // watchPosition se ejecuta cada vez que el celular detecta que te moviste
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setMiUbicacion({ lat: latitude, lng: longitude });

            // Si soy el chofer, inyecto mis coordenadas en Firebase para que el pasajero las lea
            if (modo === "chofer") {
              updateDoc(doc(db, "Solicitudes", viajeActivo.id), {
                latChofer: latitude,
                lngChofer: longitude,
                ultimaActualizacionGPS: serverTimestamp()
              }).catch(e => console.error("Error subiendo GPS:", e));
            }
          },
          (error) => {
            console.warn("Error de GPS:", error);
            // Si el usuario niega el permiso, lanzamos la alerta
            if(error.code === 1) alert("⚠️ Debes darle permiso a la aplicación para usar tu ubicación.");
          },
          // Configuraciones para que sea en tiempo real y preciso
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      } else {
        alert("Tu dispositivo no soporta geolocalización.");
      }
    }

    // Limpiamos el rastreador al salir de la vista
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [vista, viajeActivo?.id, modo]);

  // --- LÓGICA DE CHAT ---
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

  // --- FUNCIONES ---
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
      alert("✅ Ruta publicada!");
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
      alert("✅ Solicitud enviada correctamente.");
    } catch (e) { alert("Error."); }
  };

  const confirmarViajeChofer = async (idSolicitud) => {
    try {
      await updateDoc(doc(db, "Solicitudes", idSolicitud), { 
        estado: "confirmado", 
        fase: "chofer_en_camino",
        fechaConfirmacion: serverTimestamp() 
      });
      setVista("en_viaje");
    } catch (e) { alert("Error al confirmar."); }
  };

  const actualizarFaseViaje = async (nuevaFase) => {
    if(!viajeActivo) return;
    try {
      await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { fase: nuevaFase });
      if(nuevaFase === "finalizado") {
        await updateDoc(doc(db, "Solicitudes", viajeActivo.id), { estado: "completado" });
        setVista("inicio");
        alert("¡Viaje completado!");
      }
    } catch (e) { console.error(e); }
  };

  const procesarCancelacion = async () => {
    if (!motivoCancelacion) return alert("Selecciona un motivo.");
    try {
      await deleteDoc(doc(db, "Solicitudes", modalCancelacion.idSolicitud));
      setModalCancelacion({ visible: false, idSolicitud: null });
      setMotivoCancelacion("");
      if(vista === "en_viaje") setVista("inicio");
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

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic">DAME LA COLA...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* --- MODALES --- */}
      {perfilPublico && (
        <div className="absolute inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[40px] p-8 w-full max-w-xs shadow-2xl relative">
              <button onClick={() => setPerfilPublico(null)} className="absolute top-4 right-4 text-slate-300"><X size={24}/></button>
              <div className="flex flex-col items-center">
                 <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-2 border-blue-200"><User size={48} className="text-blue-600"/></div>
                 <h3 className="font-black italic uppercase text-2xl text-slate-800">{perfilPublico.nombre}</h3>
                 <div className="flex gap-2 mt-6 w-full">
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border">
                       <Star size={20} className="text-yellow-400 fill-yellow-400 mx-auto mb-1"/>
                       <p className="text-xl font-black italic text-slate-800">4.9</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border">
                       <Car size={20} className="text-blue-500 mx-auto mb-1"/>
                       <p className="text-xl font-black italic text-slate-800">+50</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {modalCancelacion.visible && (
        <div className="absolute inset-0 bg-black/60 z-[160] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[35px] p-6 w-full max-w-xs shadow-2xl">
              <h3 className="font-black italic uppercase text-red-500 flex items-center gap-2 mb-4"><AlertTriangle/> ¿Cancelar?</h3>
              <div className="space-y-2 mb-6">
                 {motivosOpciones.map(m => (
                    <button key={m} onClick={()=>setMotivoCancelacion(m)} className={`w-full p-3 rounded-xl text-[10px] font-black uppercase text-left border-2 transition-all ${motivoCancelacion === m ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>{m}</button>
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
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-12 shadow-lg">D</div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic leading-none">{userData.nombre}</p></div>
        </div>
        <div className="flex items-center gap-2">
           {viajeActivo && (
             <button onClick={() => setVista("en_viaje")} className="bg-green-500 text-white p-2 rounded-xl animate-pulse"><MapIcon size={18}/></button>
           )}
           <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black italic text-xs shadow-xl active:scale-95">
             <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
           </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-5 pb-32">
        
        {vista === "inicio" && !viajeSeleccionado && (
           <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"} ➔
              </button>

              {/* Inbox de Chats Recientes */}
              {historialChats.length > 0 && (
                <div className="bg-white p-4 rounded-[30px] shadow-sm border space-y-3">
                   <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><MessageCircle size={14}/> Chats Recientes</p>
                   {historialChats.slice(0, 2).map(c => (
                      <div key={c.chatId} onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} className="bg-slate-50 p-3 rounded-2xl border flex flex-col cursor-pointer active:scale-95">
                         <p className="text-[11px] font-black text-slate-800 uppercase italic">{c.nombreOtro}</p>
                         <p className="text-[10px] font-bold text-slate-500 truncate">{c.ultimoMensaje}</p>
                      </div>
                   ))}
                </div>
              )}

              {/* --- MODO CHOFER --- */}
              {modo === "chofer" && (
                <div className="space-y-6">
                  <div className={`bg-white p-6 rounded-[35px] border shadow-xl space-y-3 ${viajeEditando ? 'ring-4 ring-yellow-400' : ''}`}>
                    <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2">{viajeEditando ? "Editando Ruta" : "Publicar Nueva Ruta"}</h3>
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
                    <button onClick={publicarOEditarRuta} className={`w-full py-4 text-white rounded-2xl font-black uppercase italic shadow-lg ${viajeEditando ? 'bg-yellow-500' : 'bg-blue-600'}`}>{viajeEditando ? "Actualizar" : "Publicar"}</button>
                  </div>

                  {/* Solicitudes para el Chofer */}
                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Bell size={14}/> Solicitudes Recibidas:</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-3xl border flex flex-col gap-3 shadow-md">
                           <div className="flex justify-between items-center">
                              <div onClick={() => setPerfilPublico({ nombre: s.nombrePasajero, id: s.idPasajero })} className="cursor-pointer underline font-black text-xs italic">{s.nombrePasajero}</div>
                              <button onClick={() => abrirChat(s.idViaje, s.idPasajero, s.nombrePasajero)} className="p-3 bg-blue-600 text-white rounded-xl"><MessageCircle size={16}/></button>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => confirmarViajeChofer(s.id)} className="flex-1 p-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic">Dar la cola</button>
                              <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: s.id })} className="flex-1 p-2 bg-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase">Rechazar</button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BUSCADOR DE 4 CASILLAS */}
              <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar Colas</p>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DESDE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">DESDE: CIUDAD</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>{setFED(e.target.value); setFCD("");}}><option value="">HASTA: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                   <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fED} value={fCD} onChange={(e)=>setFCD(e.target.value)}><option value="">HASTA: CIUDAD</option>{fED && UBICACIONES[fED].map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
              </div>

              {/* LISTA DE VIAJES */}
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

        {/* --- VISTA: EN VIAJE (GPS REAL IMPLEMENTADO) --- */}
        {vista === "en_viaje" && viajeActivo && (
          <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-bottom duration-500">
             <div className="bg-white p-4 rounded-[30px] shadow-sm border flex justify-between items-center">
                <button onClick={() => setVista("inicio")} className="text-slate-400"><ChevronLeft/></button>
                <div className="text-center">
                   <p className="text-[8px] font-black uppercase text-blue-600">Ruta Activa</p>
                   <p className="text-[11px] font-black italic">{viajeActivo.ruta}</p>
                </div>
                <button onClick={() => setModalCancelacion({visible: true, idSolicitud: viajeActivo.id})} className="text-red-500"><AlertTriangle size={20}/></button>
             </div>

             {/* Contenedor de Mapa/GPS REAL con OpenStreetMap */}
             <div className="flex-1 bg-slate-200 rounded-[40px] border-4 border-white shadow-2xl relative overflow-hidden">
                {/* Lógica para saber qué coordenadas mostrar: si soy chofer, las mías. Si soy pasajero, las del chofer desde Firebase */}
                {(() => {
                   const latMostrar = modo === "chofer" ? miUbicacion?.lat : viajeActivo?.latChofer;
                   const lngMostrar = modo === "chofer" ? miUbicacion?.lng : viajeActivo?.lngChofer;

                   if (latMostrar && lngMostrar) {
                      return (
                         <iframe 
                           width="100%" 
                           height="100%" 
                           frameBorder="0" 
                           scrolling="no" 
                           marginHeight="0" 
                           marginWidth="0" 
                           // Usamos un pequeño offset para el bounding box (bbox) para que el mapa haga un zoom perfecto centrado en el carro
                           src={`https://www.openstreetmap.org/export/embed.html?bbox=${lngMostrar-0.005},${latMostrar-0.005},${lngMostrar+0.005},${latMostrar+0.005}&layer=mapnik&marker=${latMostrar},${lngMostrar}`}
                           className="w-full h-full opacity-90 pointer-events-none"
                         ></iframe>
                      )
                   } else {
                      return (
                         <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                            <p className="text-slate-400 font-black italic uppercase text-[10px] tracking-widest animate-pulse flex flex-col items-center gap-2">
                               <Navigation size={24} className="animate-spin"/>
                               {modo === "chofer" ? "Conectando GPS..." : "Esperando señal del chofer..."}
                            </p>
                         </div>
                      )
                   }
                })()}

                {/* Flotante de Información del usuario */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-5 rounded-[30px] shadow-xl border flex justify-between items-center z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><User size={20} className="text-slate-400"/></div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase">Viajando con</p>
                         <p className="text-xs font-black italic">{modo === "chofer" ? viajeActivo.nombrePasajero : viajeActivo.nombreChofer}</p>
                      </div>
                   </div>
                   <button onClick={() => abrirChat(viajeActivo.idViaje, modo === "chofer" ? viajeActivo.idPasajero : viajeActivo.idChofer, modo === "chofer" ? viajeActivo.nombrePasajero : viajeActivo.nombreChofer)} className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg active:scale-90"><MessageCircle size={20}/></button>
                </div>
             </div>

             {/* Controles de Estado de Viaje */}
             <div className="bg-white p-6 rounded-[35px] border shadow-lg space-y-3 z-10">
                {modo === "chofer" ? (
                  <>
                    {viajeActivo.fase === "chofer_en_camino" && (
                      <button onClick={() => actualizarFaseViaje("en_punto_de_encuentro")} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-lg tracking-widest">Ya llegué al punto</button>
                    )}
                    {viajeActivo.fase === "en_punto_de_encuentro" && (
                      <button onClick={() => actualizarFaseViaje("viajando")} className="w-full py-5 bg-green-500 text-white rounded-[25px] font-black uppercase italic text-xs shadow-lg tracking-widest">Iniciar Viaje</button>
                    )}
                    {viajeActivo.fase === "viajando" && (
                      <button onClick={() => actualizarFaseViaje("finalizado")} className="w-full py-5 bg-slate-900 text-white rounded-[25px] font-black uppercase italic text-xs shadow-lg tracking-widest flex items-center justify-center gap-2"><Flag size={18}/> Finalizar Viaje</button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                     <p className="text-[10px] font-black text-blue-600 uppercase italic mb-1">Estatus del Viaje</p>
                     <p className="font-black italic uppercase text-sm">
                        {viajeActivo.fase === "chofer_en_camino" && "El chofer viene por ti"}
                        {viajeActivo.fase === "en_punto_de_encuentro" && "¡El chofer ha llegado!"}
                        {viajeActivo.fase === "viajando" && "Disfruta el camino..."}
                     </p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* DETALLE DEL VIAJE SELECCIONADO */}
        {viajeSeleccionado && vista === "inicio" && (
           <div className="space-y-6">
              <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic"><ChevronLeft size={16}/> Volver</button>
              <div className="bg-white rounded-[40px] border shadow-2xl p-8 space-y-6">
                 <div className="flex justify-between items-center border-b pb-4">
                    <p className="text-4xl font-black italic text-blue-600 leading-none">${viajeSeleccionado.precio}</p>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase italic text-slate-400">Asientos</p>
                       <p className="text-xl font-black italic text-slate-800">{viajeSeleccionado.puestos}</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-600"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.cO} → {viajeSeleccionado.cD}</p></div>
                    <div onClick={() => setPerfilPublico({ nombre: viajeSeleccionado.conductor, id: viajeSeleccionado.idCreador })} className="flex items-center gap-3 cursor-pointer"><User size={18} className="text-blue-600"/><p className="font-black uppercase text-sm italic underline">{viajeSeleccionado.conductor}</p></div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2"><MessageCircle size={18}/> Chat</button>
                    <button onClick={enviarSolicitud} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Pedir la cola</button>
                 </div>
              </div>
           </div>
        )}

        {/* --- CHAT PRIVADO --- */}
        {vista === "chat_privado" && chatActivo && (
          <div className="flex flex-col h-full space-y-4 animate-in slide-in-from-right">
            <button onClick={() => setVista("inicio")} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><ChevronLeft size={16}/> Volver</button>
            
            {/* Opciones de Acción dentro del Chat */}
            <div className="bg-white p-3 rounded-3xl border shadow-sm flex gap-2">
               <button onClick={enviarSolicitud} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic text-[10px]">Pedir la cola</button>
               <button onClick={() => {
                  const soli = misSolicitudes.find(s => s.idViaje === chatActivo.idViaje);
                  if(soli) setModalCancelacion({ visible: true, idSolicitud: soli.id });
                  else alert("No tienes una solicitud activa aquí.");
               }} className="flex-1 py-3 bg-red-100 text-red-500 rounded-xl font-black uppercase italic text-[10px]">Cancelar</button>
            </div>

            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase">Chat con {chatActivo.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-4 rounded-3xl max-w-[80%] text-[11px] font-bold shadow-sm ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} className="flex-1 bg-slate-100 p-3 rounded-2xl text-[11px] font-bold outline-none" placeholder="Mensaje..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={18}/></button>
               </div>
            </div>
          </div>
        )}

        {/* --- WALLET --- */}
        {vista === "wallet" && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Wallet</h2>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white">
                 <p className="text-[10px] font-black uppercase opacity-80 mb-2 tracking-widest">Balance Disponible</p>
                 <p className="text-6xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => alert("Próximamente")} className="bg-slate-900 text-white p-6 rounded-[30px] font-black uppercase italic text-xs shadow-lg flex flex-col items-center gap-3"><CreditCard size={24} className="text-blue-400"/> Recargar</button>
                 <button onClick={() => alert("Próximamente")} className="bg-white border text-slate-700 p-6 rounded-[30px] font-black uppercase italic text-xs flex flex-col items-center gap-3"><Wallet size={24} className="text-slate-400"/> Retirar</button>
              </div>
           </div>
        )}

        {/* --- SOPORTE TÉCNICO --- */}
        {vista === "soporte" && (
          <div className="flex flex-col h-full bg-white rounded-[40px] border shadow-lg overflow-hidden animate-in fade-in">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-[10px] uppercase">Soporte Dame La Cola</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                <div className="bg-blue-100 p-4 rounded-2xl text-[10px] font-bold text-blue-800 italic uppercase">¡Hola! Cuéntanos tu duda.</div>
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-3xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.usuarioId === user.uid ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2">
               <input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none" placeholder="Escribe al soporte..." />
               <button onClick={async () => {
                  if(!mensajeSoporte.trim()) return;
                  await addDoc(collection(db, "MensajesSoporte"), { usuarioId: user.uid, texto: mensajeSoporte.trim(), fecha: serverTimestamp() });
                  setMensajeSoporte("");
               }} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center"><Send size={18}/></button>
             </div>
          </div>
        )}

        {/* --- PERFIL --- */}
        {vista === "perfil" && (
           <div className="space-y-4 animate-in fade-in">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border flex flex-col items-center relative">
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={22}/></button>
                 <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl relative">
                   <User size={56} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full border-4 border-white"><CheckCircle size={16} className="text-white"/></div>}
                 </div>
                 <h2 className="font-black italic text-2xl text-slate-800 uppercase">{userData.nombre}</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{userData.kycVerificado ? "Verificado" : "Pendiente"}</p>
              </div>

              {configOpen && (
                <div className="bg-white p-6 rounded-[35px] border shadow-2xl space-y-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic">Editar Perfil</p>
                  <input type="text" placeholder="Cédula" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold" value={perfilForm.cedula} onChange={(e)=>setPerfilForm({...perfilForm, cedula: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Marca" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold" value={perfilForm.marca} onChange={(e)=>setPerfilForm({...perfilForm, marca: e.target.value})} />
                    <input type="text" placeholder="Modelo" className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-bold" value={perfilForm.modelo} onChange={(e)=>setPerfilForm({...perfilForm, modelo: e.target.value})} />
                  </div>
                  <input type="text" placeholder="Placa" className="w-full bg-slate-50 p-4 rounded-2xl border text-[11px] font-black uppercase" value={perfilForm.placa} onChange={(e)=>setPerfilForm({...perfilForm, placa: e.target.value})} />
                  <button onClick={guardarDatosPerfil} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs">Guardar</button>
                </div>
              )}
              <button onClick={() => signOut(auth)} className="w-full p-5 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-3 italic tracking-widest bg-white rounded-[30px] border shadow-sm mt-4"><LogOut size={20} /> Cerrar Sesión</button>
           </div>
        )}
      </main>

      {/* --- BARRA DE NAVEGACIÓN FIJA --- */}
      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => cambiarVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600 scale-110" : "text-slate-300"}`}><Car size={28} /><span className="text-[8px] font-black uppercase italic">Viajes</span></button>
        <button onClick={() => cambiarVista("soporte")} className={`flex flex-col items-center gap-1 ${vista === "soporte" ? "text-blue-600 scale-110" : "text-slate-300"}`}><MessageCircle size={28} /><span className="text-[8px] font-black uppercase italic">Ayuda</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600 scale-110" : "text-slate-300"}`}><User size={28} /><span className="text-[8px] font-black uppercase italic">Perfil</span></button>
      </nav>
    </div>
  );
}
