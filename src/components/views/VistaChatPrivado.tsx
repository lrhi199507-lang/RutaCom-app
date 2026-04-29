import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../firebaseConfig"; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { ChevronLeft, Send, User, Car, ShieldCheck, Info } from 'lucide-react';

export const VistaChatPrivado = ({ chat, userData, onRegresar }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const scrollRef = useRef(null);

  // Sugerencias profesionales predeterminadas
  const sugerenciasPasajero = [
    "¡Hola! ¿Aún tienes cupo disponible?",
    "¿Cuál es el punto exacto de salida?",
    "Llevo equipaje, ¿hay problema?"
  ];

  const sugerenciasChofer = [
    "¡Hola! Sí, aún tengo cupo.",
    "Estoy confirmando los pasajeros.",
    "El punto de encuentro es el de la app."
  ];

  // Identificamos quién es quién en este chat
  const soyConductor = chat.uidConductor === userData.id;
  const sugerencias = soyConductor ? sugerenciasChofer : sugerenciasPasajero;
  const nombreContacto = soyConductor ? chat.nombrePasajero : chat.nombreConductor;
  const fotoContacto = soyConductor ? chat.fotoPasajero : chat.fotoConductor;

  useEffect(() => {
    if (!chat.id) return;
    
    // Conectamos a la subcolección correcta: Chats -> [id] -> Mensajes
    const q = query(
      collection(db, `Chats/${chat.id}/Mensajes`),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

        // Limpiar notificaciones (mensajes sin leer) al entrar
    const limpiarNotificaciones = async () => {
      if (chat.mensajesSinLeer > 0 && chat.remitenteUltimoMensaje !== userData.id) {
        await updateDoc(doc(db, "Chats", chat.id), { mensajesSinLeer: 0 });
      }
    };
    limpiarNotificaciones();

    return () => unsub();
  }, [chat.id]);

  const enviar = async (e, textoSugerido = null) => {
    if (e) e.preventDefault();
    
    const texto = textoSugerido || nuevoMsg.trim();
    if (!texto) return;

    try {
      setNuevoMsg(""); // Limpiar input visualmente de inmediato
      
      // 1. Guardar mensaje
      await addDoc(collection(db, `Chats/${chat.id}/Mensajes`), {
        texto: texto,
        uidRemitente: userData.id,
        timestamp: serverTimestamp()
      });

      // 2. Actualizar el último mensaje en la tarjeta de afuera
      await updateDoc(doc(db, "Chats", chat.id), {
        await updateDoc(doc(db, "Chats", chat.id), {
        ultimoMensaje: texto,
        ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mensajesSinLeer: 1, // Aquí puedes cambiar el 1 por increment(1) si importas increment de firestore
        remitenteUltimoMensaje: userData.id // <--- ESTA LÍNEA ES LA CLAVE
      });

    } catch (error) {
      console.error("Error al enviar:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm pt-8">
        <button onClick={onRegresar} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-blue-600">
          <ChevronLeft size={28} />
        </button>
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden shrink-0">
          {fotoContacto ? <img src={fotoContacto} className="w-full h-full object-cover"/> : <User size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black italic uppercase text-sm text-slate-800 tracking-tighter truncate flex items-center gap-1">
            {nombreContacto} <ShieldCheck size={14} className="text-green-500" />
          </h3>
          <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">
            {chat.ruta}
          </p>
        </div>
      </div>

      {/* CUERPO DE MENSAJES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="flex justify-center mb-6 mt-2">
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
            <Info size={12} /> Inicio del chat seguro
          </div>
        </div>

        {mensajes.map((m) => {
          const soyYo = m.uidRemitente === userData.id;
          return (
            <div key={m.id} className={`flex ${soyYo ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 px-4 shadow-sm text-sm font-bold ${
                soyYo 
                ? 'bg-blue-600 text-white rounded-[20px] rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-[20px] rounded-tl-none'
              }`}>
                {m.texto}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* ZONA INFERIOR: SUGERENCIAS Y TECLADO */}
      <div className="bg-white border-t border-slate-100 pb-safe">
        
        {/* Botones de Sugerencias (Se ocultan si ya hay mucha charla) */}
        {mensajes.length < 4 && (
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
