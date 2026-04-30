import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../firebaseConfig"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { ChevronLeft, Send, User, ShieldCheck, Info, Headset, Phone, AlertTriangle } from 'lucide-react';

export const VistaChatPrivado = ({ chat, userData, onRegresar }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const scrollRef = useRef(null);

  // 1. IDENTIFICAMOS SI ES SOPORTE O CHAT NORMAL
  const isSoporte = chat.esSoporte;
  // Si es soporte, creamos un ID único para este usuario. Si no, usamos el ID del viaje.
  const chatIdReal = isSoporte ? `soporte_${userData.id}` : chat.id;

  // 2. SUGERENCIAS DINÁMICAS
  const sugerenciasPasajero = ["¡Hola! ¿Aún tienes cupo disponible?", "¿Cuál es el punto exacto?", "Llevo equipaje, ¿hay problema?"];
  const sugerenciasChofer = ["¡Hola! Sí, aún tengo cupo.", "Estoy confirmando los pasajeros.", "El punto de encuentro es el de la app."];
  const sugerenciasSoporte = ["Tengo un problema con un viaje", "Falla en la aplicación", "Tengo una sugerencia"];

  const soyConductor = !isSoporte && chat.uidConductor === userData.id;
  
  const sugerencias = isSoporte ? sugerenciasSoporte : (soyConductor ? sugerenciasChofer : sugerenciasPasajero);
  const nombreContacto = isSoporte ? "Soporte Dame la cola" : (soyConductor ? chat.nombrePasajero : chat.nombreConductor);
  const fotoContacto = isSoporte ? null : (soyConductor ? chat.fotoPasajero : chat.fotoConductor);

  // 3. MENSAJE AUTOMÁTICO DE SOPORTE (Visual, no gasta base de datos)
  const mensajeBienvenidaSoporte = {
    id: 'msg-bienvenida-bot',
    texto: `¡Hola ${userData.nombre}! Soy el asistente virtual de Dame la cola. Elige una opción abajo o escribe tu duda, y un asesor te responderá pronto.`,
    uidRemitente: 'admin',
    timestamp: new Date()
  };

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

        {/* BOTONES DE ACCIÓN (Solo en chats entre usuarios) */}
        {!isSoporte && (
          <div className="flex items-center gap-1 pr-1">
            <button 
              onClick={() => alert("Aquí abriremos el WhatsApp del usuario")}
              className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-all active:scale-90"
            >
              <Phone size={18} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => alert("Aquí abriremos el modal para reportar")}
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
        
        {/* Botones de Sugerencias */}
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

        {/* INPUT DE TEXTO */}
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
    </div>
  );
};
