import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../firebaseConfig"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { ChevronLeft, Send, User, ShieldCheck, Info, Headset, Phone, AlertTriangle, Lock, X, Map } from 'lucide-react';

const IconoWhatsApp = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.38c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.333.158 11.892c0 2.097.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.714 1.447h.005c6.559 0 11.896-5.333 11.893-11.893a11.821 11.821 0 00-3.484-8.413z"/>
  </svg>
);

// 👇 SE AGREGÓ LA PROPIEDAD onVerViaje 👇
export const VistaChatPrivado = ({ chat, userData, onRegresar, onVerViaje }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const [viajeActual, setViajeActual] = useState(null); 
  const scrollRef = useRef(null);

  const [toast, setToast] = useState(null); 

  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  const isSoporte = chat.esSoporte;
  const chatIdReal = isSoporte ? `soporte_${userData.id}` : chat.id;

  const sugerenciasPasajero = ["¡Hola! ¿Aún tienes cupo disponible?", "¿Cuál es el punto exacto?", "Llevo equipaje, ¿hay problema?"];
  const sugerenciasChofer = ["¡Hola! Sí, aún tengo cupo.", "Estoy confirmando los pasajeros.", "El punto de encuentro es el de la app."];
  const sugerenciasSoporte = ["Tengo un problema con un viaje", "Falla en la aplicación", "Tengo una sugerencia"];

  const soyConductor = !isSoporte && chat.uidConductor === userData.id;
  const idOtroUsuario = soyConductor ? chat.uidPasajero : chat.uidConductor;
  
  const sugerencias = isSoporte ? sugerenciasSoporte : (soyConductor ? sugerenciasChofer : sugerenciasPasajero);
  const nombreContacto = isSoporte ? "Soporte Dame la cola" : (soyConductor ? chat.nombrePasajero : chat.nombreConductor);
  const fotoContacto = isSoporte ? null : (soyConductor ? chat.fotoPasajero : chat.fotoConductor);

  const mensajeBienvenidaSoporte = {
    id: 'msg-bienvenida-bot',
    texto: `¡Hola ${userData.nombre}! Soy el asistente virtual de Dame la cola. Elige una opción abajo o escribe tu duda, y un asesor te responderá pronto.`,
    uidRemitente: 'admin',
    timestamp: new Date()
  };

  useEffect(() => {
    if (isSoporte || !chat.idViaje) return;
    const unsubViaje = onSnapshot(doc(db, "Viajes", chat.idViaje), (docSnap) => {
      if (docSnap.exists()) setViajeActual(docSnap.data());
    });
    return () => unsubViaje();
  }, [chat.idViaje, isSoporte]);

  const pasajeroConfirmado = viajeActual?.pasajeros?.some(p => 
    (p.id === chat.uidPasajero || p.uid === chat.uidPasajero) && p.estado === 'confirmado'
  );

  useEffect(() => {
    if (!chatIdReal) return;
    
    const q = query(
      collection(db, `Chats/${chatIdReal}/Mensajes`),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    const limpiarNotificaciones = async () => {
      if (chat.mensajesSinLeer > 0 && chat.remitenteUltimoMensaje !== userData.id) {
        await setDoc(doc(db, "Chats", chatIdReal), { mensajesSinLeer: 0 }, { merge: true });
      }
    };
    limpiarNotificaciones();

    return () => unsub();
  }, [chatIdReal]);

  const enviar = async (e, textoSugerido = null) => {
    if (e) e.preventDefault();
    
    const texto = textoSugerido || nuevoMsg.trim();
    if (!texto) return;

    try {
      setNuevoMsg(""); 
      
      await addDoc(collection(db, `Chats/${chatIdReal}/Mensajes`), {
        texto: texto,
        uidRemitente: userData.id,
        timestamp: serverTimestamp()
      });

      await setDoc(doc(db, "Chats", chatIdReal), {
        ultimoMensaje: texto,
        ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mensajesSinLeer: 1, 
        remitenteUltimoMensaje: userData.id,
        ...(isSoporte && {
            esSoporte: true,
            uidPasajero: userData.id,
            nombrePasajero: userData.nombre,
            ruta: "Soporte Técnico"
        })
      }, { merge: true });

    } catch (error) {
      console.error("Error al enviar:", error);
    }
  };

  const abrirWhatsApp = () => {
    if (!pasajeroConfirmado) {
      setToast({ texto: "🔒 El número se habilita al confirmar", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const numeroDestino = soyConductor ? chat.telefonoPasajero : chat.telefonoConductor;
    if (!numeroDestino) {
      setToast({ texto: "El usuario no registró su número", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    let numeroLimpio = numeroDestino.replace(/\D/g, ''); 
    if (numeroLimpio.startsWith('0')) {
      numeroLimpio = '58' + numeroLimpio.substring(1);
    } else if (!numeroLimpio.startsWith('58')) {
      numeroLimpio = '58' + numeroLimpio; 
    }
    
    const mensaje = `¡Hola! Te escribo desde Dame la cola por el viaje: ${chat.ruta}.`;
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const manejarReporte = async () => {
    if (!motivoReporte.trim()) return;
    setEnviandoReporte(true);
    try {
      await addDoc(collection(db, "Reportes"), {
        idReportado: idOtroUsuario || "Desconocido",
        nombreReportado: nombreContacto || "Usuario",
        idReportador: userData?.id || "Desconocido",
        nombreReportador: userData?.nombre || "Usuario",
        idChat: chatIdReal || "N/A",
        idViaje: chat.idViaje || "N/A",
        motivo: motivoReporte,
        fecha: new Date().toISOString(),
        estado: "pendiente" 
      });
      
      setMostrarModalReporte(false);
      setMotivoReporte("");
      setToast({ texto: "Reporte enviado. Revisaremos el caso.", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
      
    } catch (error) {
      console.error("Error al reportar:", error);
      setToast({ texto: "Hubo un error al enviar el reporte.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setEnviandoReporte(false);
    }
  };
  
  const mensajesAMostrar = isSoporte ? [mensajeBienvenidaSoporte, ...mensajes] : mensajes;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className={`p-4 border-b flex items-center gap-3 shadow-sm pt-8 ${isSoporte ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <button onClick={onRegresar} className={`p-2 -ml-2 rounded-full transition-colors ${isSoporte ? 'text-white hover:bg-slate-800' : 'text-blue-600 hover:bg-slate-100'}`}>
          <ChevronLeft size={28} />
        </button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden shrink-0 ${isSoporte ? 'bg-blue-600 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
          {fotoContacto ? <img src={fotoContacto} className="w-full h-full object-cover"/> : (isSoporte ? <Headset size={20} /> : <User size={20} />)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-black italic uppercase text-sm tracking-tighter truncate flex items-center gap-1 ${isSoporte ? 'text-white' : 'text-slate-800'}`}>
            {nombreContacto} {isSoporte ? <ShieldCheck size={14} className="text-blue-400" /> : <ShieldCheck size={14} className="text-green-500" />}
          </h3>
          <p className={`text-[10px] font-bold truncate uppercase tracking-widest ${isSoporte ? 'text-blue-300' : 'text-slate-400'}`}>
            {isSoporte ? 'Atención 24/7' : chat.ruta}
          </p>
        </div>

        {/* BOTONES DE ACCIÓN */}
        {!isSoporte && (
          <div className="flex items-center gap-1 pr-1">
            
            {/* 👇 NUEVO BOTÓN: PUENTE HACIA EL VIAJE 👇 */}
            {onVerViaje && (
              <button 
                onClick={onVerViaje}
                className="px-3 py-1.5 mr-1 bg-blue-600 text-white shadow-md shadow-blue-600/30 rounded-full transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Map size={14} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-widest">Viaje</span>
              </button>
            )}

            <button 
              onClick={abrirWhatsApp}
              type="button"
              className={`p-2 rounded-full transition-all active:scale-90 ${pasajeroConfirmado ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-50'}`}
            >
              {pasajeroConfirmado ? <IconoWhatsApp size={22} className="text-green-500" /> : <Lock size={20} className="text-slate-300" />}
            </button>
            <button 
              onClick={() => setMostrarModalReporte(true)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
            >
              <AlertTriangle size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* CUERPO DE MENSAJES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="flex justify-center mb-6 mt-2">
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
            <Info size={12} /> {isSoporte ? 'Conexión Segura con Soporte' : 'Inicio del chat seguro'}
          </div>
        </div>

        {mensajesAMostrar.map((m) => {
          const soyYo = m.uidRemitente === userData.id;
          const esBot = m.uidRemitente === 'admin';
          
          return (
            <div key={m.id} className={`flex ${soyYo ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 px-4 shadow-sm text-sm font-bold ${
                soyYo 
                ? 'bg-blue-600 text-white rounded-[20px] rounded-tr-none' 
                : esBot 
                  ? 'bg-slate-800 text-white border border-slate-700 rounded-[20px] rounded-tl-none'
                  : 'bg-white text-slate-700 border border-slate-200 rounded-[20px] rounded-tl-none'
              }`}>
                {m.texto}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* ZONA INFERIOR */}
      <div className="bg-white border-t border-slate-100 pb-safe">
        {mensajes.length < (isSoporte ? 5 : 4) && (
          <div className="flex overflow-x-auto gap-2 px-4 py-3 no-scrollbar border-b border-slate-50">
            {sugerencias.map((sug, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => enviar(null, sug)}
                className="whitespace-nowrap bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={enviar} className="p-4 flex gap-2 items-center">
          <input 
            type="text" 
            value={nuevoMsg}
            onChange={(e) => setNuevoMsg(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-slate-100 p-4 px-6 rounded-full text-xs font-bold outline-none border-none text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button 
            type="submit"
            className="bg-blue-600 w-12 h-12 flex items-center justify-center rounded-full text-white shadow-lg active:scale-90 transition-transform disabled:bg-slate-300"
            disabled={!nuevoMsg.trim()}
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>

      {/* TOAST FLOTANTE LÍNEAL Y ESTÉTICO */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] w-max max-w-[95vw] animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-slate-900' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? (
              <ShieldCheck size={18} className="text-green-400 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="shrink-0" />
            )}
            <span className="truncate whitespace-nowrap">{toast.texto}</span>
          </div>
        </div>
      )}

      {/* MODAL DE REPORTE */}
      {mostrarModalReporte && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setMostrarModalReporte(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle size={24} strokeWidth={2.5} />
              <h3 className="font-black italic uppercase tracking-tighter">Reportar Usuario</h3>
            </div>
            
            <p className="text-xs font-medium text-slate-500 mb-4">
              ¿Por qué estás reportando a <span className="font-bold text-slate-800">{nombreContacto}</span>? Tu reporte es anónimo y nos ayuda a mantener la comunidad segura.
            </p>

            <textarea
              value={motivoReporte}
              onChange={(e) => setMotivoReporte(e.target.value)}
              placeholder="Explica brevemente lo sucedido..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 text-sm font-medium outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all resize-none h-28 mb-4"
            ></textarea>

            <button
              onClick={manejarReporte}
              disabled={!motivoReporte.trim() || enviandoReporte}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-black italic uppercase tracking-widest text-xs py-4 rounded-full shadow-lg transition-all active:scale-95"
            >
              {enviandoReporte ? "Enviando..." : "Enviar Reporte"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
                 
