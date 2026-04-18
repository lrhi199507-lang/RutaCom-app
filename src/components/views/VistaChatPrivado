import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../firebaseConfig"; 
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Send, User } from 'lucide-react';

export const VistaChatPrivado = ({ chat, onBack }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!chat.id) return;
    const q = query(
      collection(db, "MensajesPrivados"),
      where("chatId", "==", chat.id),
      orderBy("fecha", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chat.id]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!nuevoMsg.trim()) return;

    try {
      const texto = nuevoMsg.trim();
      setNuevoMsg("");
      
      await addDoc(collection(db, "MensajesPrivados"), {
        chatId: chat.id,
        idViaje: chat.idViaje,
        texto: texto,
        emisorId: chat.idPropio, 
        nombreEmisor: "Yo",
        receptorId: chat.idOtro,
        nombreReceptor: chat.nombre,
        fecha: serverTimestamp()
      });
    } catch (error) {
      console.error("Error al enviar:", error);
    }
  };

  // AQUÍ EMPIEZA LO QUE EL ERROR MARCABA
  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-blue-600">
          <ChevronLeft size={28} />
        </button>
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
          <User size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-black italic uppercase text-sm text-slate-800 tracking-tighter">{chat.nombre}</h3>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] text-slate-400 font-black uppercase italic">Chat de Ruta</span>
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {mensajes.map((m) => {
          const soyYo = m.emisorId === chat.idPropio;
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

      {/* INPUT */}
      <form onSubmit={enviar} className="p-4 bg-white border-t flex gap-2 items-center pb-8">
        <input 
          type="text" 
          value={nuevoMsg}
          onChange={(e) => setNuevoMsg(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-slate-100 p-4 px-6 rounded-full text-sm font-bold outline-none border-none"
        />
        <button 
          type="submit"
          className="bg-blue-600 p-4 rounded-full text-white shadow-xl active:scale-90 transition-transform"
          disabled={!nuevoMsg.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
