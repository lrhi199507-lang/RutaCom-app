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

    // LÓGICA DE HISTORIAL DE CHATS
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
             mapChats.set(data.chatId, {
                chatId: data.chatId, idViaje: data.idViaje, idOtro, nombreOtro,
                ultimoMensaje: data.texto, fecha: fechaMs
             });
          } else {
             const existente = mapChats.get(data.chatId);
             if (fechaMs > existente.fecha) {
                existente.ultimoMensaje = data.texto;
                existente.fecha = fechaMs;
                mapChats.set(data.chatId, existente);
             }
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

    // CHAT DE SOPORTE TÉCNICO
    const unsubSoporte = onSnapshot(query(collection(db, "MensajesSoporte"), where("usuarioId", "==", user.uid)), (snap) => {
      const msjs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msjs.sort((a, b) => (a.fecha?.toMillis() || 0) - (b.fecha?.toMillis() || 0));
      setChatSoporte(msjs);
    });

    return () => { 
      unsubUser(); unsubViajes(); unsubSoli(); unsubMisSoli(); 
      unsubNotif(); unsubR(); unsubE(); unsubSoporte(); 
    };
  }, [user]);

  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "MensajesPrivados"), where("chatId", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      const msjs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMensajesChat(msjs);
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.receptorId === user.uid && data.leido === false) {
           updateDoc(doc(db, "MensajesPrivados", docSnap.id), { leido: true });
        }
      });
    });
    return () => unsubMsg();
  }, [chatActivo, user.uid]);

  const enviarMensajePrivado = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      await addDoc(collection(db, "MensajesPrivados"), {
        chatId: chatActivo.id,
        idViaje: chatActivo.idViaje,
        texto: nuevoMensaje.trim(),
        emisorId: user.uid,
        nombreEmisor: userData.nombre || "Usuario",
        receptorId: chatActivo.idOtro,
        nombreReceptor: chatActivo.nombre,
        leido: false, 
        fecha: serverTimestamp()
      });
      setNuevoMensaje("");
    } catch (error) { alert("Error al enviar mensaje."); }
  };

  const enviarMensajeSoporte = async () => {
    if (!mensajeSoporte.trim()) return;
    try {
      await addDoc(collection(db, "MensajesSoporte"), {
        usuarioId: user.uid,
        texto: mensajeSoporte.trim(),
        mio: true,
        fecha: serverTimestamp()
      });
      setMensajeSoporte("");
    } catch (error) { 
      alert("Error al enviar el mensaje de soporte."); 
    }
  };

  const publicarOEditarRuta = async () => {
    if (userData?.kycVerificado !== true) return alert("🚫 Debes estar verificado para publicar.");
    if (!form.cO || !form.cD || !form.precio) return alert("Llena origen, destino y precio.");
    try {
      if (viajeEditando) {
         await updateDoc(doc(db, "Viajes", viajeEditando), {
            ...form, precio: Number(form.precio), puestos: Number(form.puestos)
         });
         alert("✅ Viaje Actualizado!");
         setViajeEditando(null);
      } else {
         await addDoc(collection(db, "Viajes"), {
            ...form, precio: Number(form.precio), puestos: Number(form.puestos),
            conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp(), verificado: true
         });
         alert("🚀 ¡Viaje Publicado!");
      }
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
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
        idViaje: viajeSeleccionado.id,
        idPasajero: user.uid,
        nombrePasajero: userData.nombre || "Pasajero",
        idChofer: viajeSeleccionado.idCreador,
        nombreChofer: viajeSeleccionado.conductor, 
        ruta: `${viajeSeleccionado.cO} → ${viajeSeleccionado.cD}`,
        estado: "pendiente",
        fechaSolicitud: serverTimestamp()
      });
      setSolicitudEnviada(docRef.id);
      alert("✅ Solicitud enviada al chofer.");
    } catch (e) { alert("Error al solicitar."); }
  };

  const procesarCancelacion = async () => {
    if (!motivoCancelacion) return alert("Por favor selecciona un motivo.");
    try {
      await deleteDoc(doc(db, "Solicitudes", modalCancelacion.idSolicitud));
      setModalCancelacion({ visible: false, idSolicitud: null });
      setMotivoCancelacion("");
      if (solicitudEnviada === modalCancelacion.idSolicitud) setSolicitudEnviada(null);
      alert("Petición cancelada exitosamente.");
    } catch (e) { alert("Error al cancelar."); }
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

  const abrirChat = (idViaje, idOtroUsuario, nombreOtro) => {
    const chatId = [user.uid, idOtroUsuario].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro: idOtroUsuario, idViaje: idViaje });
    setVista("chat_privado");
    setViajeSeleccionado(null);
  };

  const viajesFiltrados = viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD));
  const misViajesPublicados = viajes.filter(v => v.idCreador === user.uid);

  const cambiarVista = (nuevaVista) => {
     setVista(nuevaVista);
     setViajeSeleccionado(null);
     setChatActivo(null);
  };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic uppercase">Cargando...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* MODAL DE PERFIL PÚBLICO (Estrellas y reputación) */}
      {perfilPublico && (
        <div className="absolute inset-0 bg-black bg-opacity-60 z-[110] flex items-center justify-center p-4">
           <div className="bg-white rounded-[35px] p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 relative border-4 border-blue-50">
              <button onClick={() => setPerfilPublico(null)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full text-slate-500 hover:text-red-500"><X size={18}/></button>
              <div className="flex flex-col items-center mt-2">
                 <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-3 border-2 border-blue-500 shadow-inner">
                    <User size={36} className="text-blue-600"/>
                 </div>
                 <h3 className="font-black italic uppercase text-xl text-slate-800 text-center">{perfilPublico.nombre}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{perfilPublico.rol} en Dame La Cola</p>
                 
                 <div className="flex gap-3 w-full mt-6">
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border text-center flex flex-col items-center justify-center">
                       <Star size={24} className="text-yellow-400 fill-yellow-400 mb-1"/>
                       <p className="text-2xl font-black italic text-slate-800 leading-none">4.9</p>
                       <p className="text-[8px] font-black uppercase text-slate-400 mt-1">Estrellas</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border text-center flex flex-col items-center justify-center">
                       <Car size={24} className="text-blue-500 mb-1"/>
                       <p className="text-2xl font-black italic text-slate-800 leading-none">+50</p>
                       <p className="text-[8px] font-black uppercase text-slate-400 mt-1">Viajes</p>
                    </div>
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-4">Miembro desde 2024</p>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE CANCELACIÓN */}
      {modalCancelacion.visible && (
        <div className="absolute inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-red-500 mb-4">
                 <AlertTriangle size={24}/> <h3 className="font-black italic uppercase text-lg leading-none">Cancelar Viaje</h3>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-4">Por favor, indícanos por qué deseas cancelar esta solicitud:</p>
              
              <div className="space-y-2 mb-6">
                 {motivosOpciones.map(m => (
                    <button key={m} onClick={()=>setMotivoCancelacion(m)} className={`w-full p-3 rounded-xl text-xs font-black uppercase text-left border-2 transition-all ${motivoCancelacion === m ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                       {m}
                    </button>
                 ))}
              </div>

              <div className="flex gap-2">
                 <button onClick={()=>setModalCancelacion({visible:false, idSolicitud:null})} className="flex-1 p-3 bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs">Atrás</button>
                 <button onClick={procesarCancelacion} className="flex-1 p-3 bg-red-500 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-red-200">Confirmar</button>
              </div>
           </div>
        </div>
      )}

      {/* NOTIFICACIONES */}
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
        <div onClick={() => cambiarVista("wallet")} className="cursor-pointer bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2 font-black italic text-xs shadow-lg hover:scale-105 transition-transform">
          <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2) || "0.00"}
        </div>
      </header>

      {/* AQUÍ COMIENZA EL RENDERIZADO INDEPENDIENTE PARA EVITAR ERRORES DE SINTAXIS */}
      <main className="flex-1 overflow-y-auto p-5 pb-32 relative">
        
        {/* VISTA 1: CHAT PRIVADO */}
        {vista === "chat_privado" && chatActivo && (
          <div className="flex flex-col h-full space-y-4 animate-in slide-in-from-right duration-300">
             <button onClick={() => {setVista("inicio"); setChatActivo(null);}} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic">
               <ChevronLeft size={16}/> Volver
            </button>
            <div className="flex-1 bg-white rounded-[40px] border shadow-xl flex flex-col overflow-hidden">
               <div className="bg-slate-900 p-4 text-white text-center font-black italic text-[10px] uppercase tracking-widest">Chat con {chatActivo.nombre}</div>
               <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 flex flex-col">
                  {mensajesChat.map((m) => (
                    <div key={m.id} className={`p-3 rounded-2xl max-w-[85%] text-xs font-bold ${m.emisorId === user.uid ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                  ))}
               </div>
               <div className="p-4 bg-white border-t flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e)=>setNuevoMensaje(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajePrivado()} className="flex-1 bg-slate-100 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Escribe..." />
                  <button onClick={enviarMensajePrivado} className="bg-blue-600 w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg active:scale-95"><Send size={16}/></button>
               </div>
            </div>
          </div>
        )}

        {/* VISTA 2: WALLET */}
        {vista === "wallet" && (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Billetera</h2>
              <div className="bg-blue-600 p-8 rounded-[35px] shadow-xl text-white flex flex-col items-center relative overflow-hidden">
                 <Wallet size={120} className="absolute -right-6 -bottom-6 opacity-10 text-white" />
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Saldo Disponible</p>
                 <p className="text-5xl font-black italic leading-none">${userData.saldo?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="flex gap-4 mt-6">
                 <button onClick={() => alert("Próximamente: Pasarela de pago para recargar")} className="flex-1 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase italic text-xs shadow-lg flex flex-col items-center gap-2">
                    <CreditCard size={20} className="text-blue-400"/> Recargar Saldo
                 </button>
                 <button onClick={() => alert("Próximamente: Retiro a cuenta bancaria")} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 p-5 rounded-2xl font-black uppercase italic text-xs shadow-sm flex flex-col items-center gap-2">
                    <Wallet size={20} className="text-slate-400"/> Retirar Dinero
                 </button>
              </div>
              <p className="text-center text-[10px] font-bold text-slate-400 mt-6 px-4">El dinero en tu billetera te permite pagar las colas o retirar tus ganancias de forma segura.</p>
           </div>
        )}

        {/* VISTA 3: DETALLE DEL VIAJE SELECCIONADO */}
        {vista === "inicio" && viajeSeleccionado && (
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
                     <div className="flex items-center gap-3"><Users size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.puestos} Asientos Dispo.</p></div>
                     {viajeSeleccionado.extras && <p className="text-xs italic bg-blue-700 p-3 rounded-xl border border-blue-500">Extras: {viajeSeleccionado.extras}</p>}
                  </div>
               </div>
               
               <div className="p-8 space-y-6">
                  {/* AQUÍ ABRIMOS EL PERFIL PÚBLICO AL TOCAR EL CHOFER */}
                  <div className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition" onClick={() => setPerfilPublico({ nombre: viajeSeleccionado.conductor, rol: "Chófer", id: viajeSeleccionado.idCreador })}>
                     <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-inner relative">
                        <User size={28} className="text-blue-600"/>
                        {viajeSeleccionado.verificado && <ShieldCheck size={14} className="text-blue-600 absolute bottom-0 right-0 bg-white rounded-full"/>}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Chófer</p>
                        <p className="font-black text-slate-800 uppercase italic text-lg">{viajeSeleccionado.conductor}</p>
                        <p className="text-[9px] text-blue-600 font-bold uppercase mt-1">Ver Reputación ➔</p>
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t">
                     <div className="flex gap-2">
                        <button onClick={() => abrirChat(viajeSeleccionado.id, viajeSeleccionado.idCreador, viajeSeleccionado.conductor)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800">
                           <MessageCircle size={18}/> Chat Directo
                        </button>
                        {solicitudEnviada ? (
                          <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: solicitudEnviada })} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">
                             Cancelar Petición
                          </button>
                        ) : (
                          <button onClick={enviarSolicitud} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-blue-200">
                             Confirmar Viaje
                          </button>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* VISTA 4: INICIO PRINCIPAL (MODO CHOFER O PASAJERO) */}
        {vista === "inicio" && !viajeSeleccionado && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                MODO ACTUAL: {modo === "pasajero" ? "PASAJERO" : "CHÓFER"} (TOCA PARA CAMBIAR)
              </button>

              {/* BANDEJA DE CHATS ACTIVA */}
              {historialChats.length > 0 && (
                 <div className="bg-white p-4 rounded-[30px] shadow-sm border space-y-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2">
                       <MessageCircle size={14}/> Conversaciones Activas
                    </p>
                    {historialChats.map(c => (
                       <div key={c.chatId} onClick={() => abrirChat(c.idViaje, c.idOtro, c.nombreOtro)} className="bg-slate-50 p-3 rounded-2xl border flex flex-col shadow-sm cursor-pointer active:scale-95 transition-all">
                          <p className="text-[11px] font-black text-slate-800 uppercase italic">{c.nombreOtro}</p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">{c.ultimoMensaje}</p>
                       </div>
                    ))}
                 </div>
              )}

              {/* ----------------- SECCIÓN MODO CHOFER ----------------- */}
              {modo === "chofer" && (
                <div className="space-y-6">
                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2 animate-pulse"><Bell size={14}/> Solicitudes de Pasajeros:</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-3xl border-2 border-blue-500 flex flex-col gap-3 shadow-lg">
                           <div className="flex justify-between items-center">
                              {/* ABRIR PERFIL DEL PASAJERO AL TOCAR EL NOMBRE */}
                              <div className="cursor-pointer" onClick={() => setPerfilPublico({ nombre: s.nombrePasajero, rol: "Pasajero", id: s.idPasajero })}>
                                 <p className="text-[10px] font-black text-slate-800 uppercase italic underline decoration-blue-200">{s.nombrePasajero}</p>
                                 <p className="text-[8px] font-bold text-blue-600 uppercase">{s.ruta}</p>
                              </div>
                              <button onClick={() => abrirChat(s.idViaje, s.idPasajero, s.nombrePasajero)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><MessageCircle size={16}/></button>
                           </div>
                           <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: s.id })} className="w-full p-2 bg-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase">Rechazar Viaje</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`bg-white p-6 rounded-[35px] border shadow-xl space-y-3 ${viajeEditando ? 'border-4 border-yellow-400' : ''}`}>
                    <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2">
                       {viajeEditando ? <><Edit2 size={16}/> Editando Ruta Activa</> : <><Navigation size={16}/> Publicar Nueva Ruta</>}
                    </h3>
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
                    <input type="text" placeholder="Extras (Maletas, AC, Mascotas...)" className="w-full bg-slate-50 p-4 rounded-xl border text-xs font-bold outline-none" value={form.extras} onChange={(e)=>setForm({...form, extras: e.target.value})} />
                    
                    <div className="flex gap-2">
                       {viajeEditando && <button onClick={() => {setViajeEditando(null); setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });}} className="w-1/3 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase italic">Cancelar</button>}
                       <button onClick={publicarOEditarRuta} className={`flex-1 py-4 text-white rounded-2xl font-black uppercase italic shadow-lg ${viajeEditando ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                          {viajeEditando ? "Guardar Cambios" : "Publicar Ahora"}
                       </button>
                    </div>
                  </div>

                  {misViajesPublicados.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase italic flex items-center gap-2"><Car size={14}/> Tus Viajes Publicados:</p>
                      {misViajesPublicados.map(v => (
                        <div key={v.id} className="bg-white p-4 rounded-[25px] border flex justify-between items-center shadow-sm">
                           <div>
                              <p className="font-black uppercase text-[10px] text-slate-800 italic">{v.cO} → {v.cD}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{v.puestos} Puestos | ${v.precio}</p>
                           </div>
                           <div className="flex gap-1">
                              <button onClick={() => cargarParaEditar(v)} className="text-yellow-500 bg-yellow-50 p-2 rounded-xl hover:bg-yellow-100 transition"><Edit2 size={16}/></button>
                              <button onClick={async () => { if(confirm("¿Borrar ruta permanentemente?")) await deleteDoc(doc(db, "Viajes", v.id)); }} className="text-red-500 bg-red-50 p-2 rounded-xl hover:bg-red-100 transition"><Trash2 size={16}/></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <hr className="my-6 border-slate-200"/>
                </div>
              )}

              {/* ----------------- SECCIÓN MODO PASAJERO (Solo Solicitudes) ----------------- */}
              {modo === "pasajero" && misSolicitudes.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2">
                    <CheckCircle size={14}/> Solicitudes de Cola Enviadas:
                  </p>
                  {misSolicitudes.map(s => (
                    <div key={s.id} className="bg-blue-50 p-4 rounded-3xl border border-blue-200 flex flex-col gap-3 shadow-sm">
                       <div className="flex justify-between items-center">
                          <div className="cursor-pointer" onClick={() => setPerfilPublico({ nombre: s.nombreChofer || "Chófer", rol: "Chófer", id: s.idChofer })}>
                             <p className="text-[10px] font-black text-slate-800 uppercase italic underline decoration-blue-200">{s.nombreChofer || "Chófer"}</p>
                             <p className="text-[8px] font-bold text-blue-600 uppercase">{s.ruta}</p>
                          </div>
                          <button onClick={() => abrirChat(s.idViaje, s.idChofer, s.nombreChofer || "Chófer")} className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><MessageCircle size={16}/></button>
                       </div>
                       <button onClick={() => setModalCancelacion({ visible: true, idSolicitud: s.id })} className="w-full p-2 bg-red-100 text-red-500 rounded-xl text-[10px] font-black uppercase">Cancelar Petición</button>
                    </div>
                  ))}
                </div>
              )}

              {/* ----------------- SECCIÓN UNIVERSAL: EXPLORAR VIAJES ----------------- */}
              {/* Aquí ambos (Chofer y Pasajero) pueden ver el mercado para comparar o viajar */}
              <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2">
                   <Search size={14}/> {modo === "chofer" ? "Explorar Mercado (Para Comparar Precios)" : "Explorar Viajes Disponibles"}
                </p>
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
                    <div className="flex-1">
                       <div className="flex items-center gap-1 mb-1">
                          {v.verificado ? <ShieldCheck size={12} className="text-blue-500" /> : null}
                          <p className="text-[9px] font-black text-slate-400 uppercase italic leading-none">{v.conductor}</p>
                       </div>
                       <p className="font-black uppercase text-xs text-slate-800 italic">{v.cO} → {v.cD}</p>
                    </div>
                    <p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p>
                  </div>
                  <button onClick={() => setViajeSeleccionado(v)} className="text-[9px] bg-slate-900 text-white px-8 py-2.5 rounded-full font-black uppercase italic shadow-lg">Ver Detalle del Viaje</button>
                </div>
              ))}
            </div>
        )}

        {/* VISTA 5: PERFIL DEL USUARIO */}
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
                  <p className="text-[10px] font-black text-slate-400 uppercase italic mt-2">Datos del Vehículo (Solo Chóferes)</p>
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

        {/* VISTA 6: SOPORTE TÉCNICO */}
        {vista === "soporte" && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[40px] border shadow-lg overflow-hidden">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-xs uppercase flex items-center justify-center gap-2 tracking-widest"><MessageCircle size={16} /> Atención al Cliente</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.mio ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2">
               <input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensajeSoporte()} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none border" placeholder="Escribe tu problema..." />
               <button onClick={enviarMensajeSoporte} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lg active:scale-95"><Send size={18}/></button>
             </div>
          </div>
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => cambiarVista("inicio")} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Viajes</span></button>
        <button onClick={() => cambiarVista("soporte")} className={`flex flex-col items-center gap-1 ${vista === "soporte" ? "text-blue-600" : "text-slate-300"}`}><MessageCircle size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Soporte</span></button>
        <button onClick={() => cambiarVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Perfil</span></button>
      </nav>
    </div>
  );
}
