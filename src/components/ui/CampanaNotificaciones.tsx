import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Bell, CheckCircle, Info, Car, X, Trash2, CheckCheck, MessageCircle } from 'lucide-react'; // 🔥 Agregamos MessageCircle

export const CampanaNotificaciones = ({ userData }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const miId = userData?.id || userData?.uid || userData?.idUsuario;
    
    if (!miId) return;

    const q = query(
      collection(db, "Notificaciones"), 
      where("idDestino", "==", String(miId)) 
    );
      
    const unsub = onSnapshot(q, (snap) => {
      let lista = [];
      snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
      
      // 🔥 CORRECCIÓN: Manejo seguro de fechas de Firebase
      lista.sort((a, b) => {
        const fechaA = a.fecha?.toDate ? a.fecha.toDate().getTime() : new Date(a.fecha || 0).getTime();
        const fechaB = b.fecha?.toDate ? b.fecha.toDate().getTime() : new Date(b.fecha || 0).getTime();
        return fechaB - fechaA;
      });
      
      setNotificaciones(lista);
    });

    return () => unsub();
  }, [userData]);
  
  // 🔥 CORRECCIÓN: Cambiamos 'leida' por 'leido' para que haga match con el envío
  const noLeidas = notificaciones.filter(n => !n.leido).length;

  const marcarComoLeida = async (id) => {
    try {
      await updateDoc(doc(db, "Notificaciones", id), { leido: true });
    } catch (error) { console.error("Error al marcar leída", error); }
  };

  const eliminarNotificacion = async (id) => {
    try {
      await deleteDoc(doc(db, "Notificaciones", id));
    } catch (error) { console.error("Error al eliminar", error); }
  };

  const marcarTodasLeidas = async () => {
    notificaciones.forEach(async (n) => {
      if (!n.leido) await updateDoc(doc(db, "Notificaciones", n.id), { leido: true });
    });
  };

  const obtenerIcono = (tipo) => {
    switch(tipo) {
      case 'exito': return <CheckCircle size={16} className="text-green-500" />;
      case 'viaje': return <Car size={16} className="text-blue-500" />;
      case 'alerta': return <Info size={16} className="text-amber-500" />;
      case 'chat': return <MessageCircle size={16} className="text-blue-600" />; // 🔥 NUEVO ÍCONO PARA SOPORTE/CHATS
      default: return <Bell size={16} className="text-slate-500" />;
    }
  };

  // Función para mostrar la fecha de forma segura
  const formatearFecha = (fechaFirebase) => {
    if (!fechaFirebase) return '';
    const fechaReal = fechaFirebase.toDate ? fechaFirebase.toDate() : new Date(fechaFirebase);
    return fechaReal.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className="relative">
      {/* ICONO DE CAMPANA */}
      <button 
        onClick={() => setAbierto(true)} 
        className="relative p-2.5 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 active:scale-90 transition-all hover:bg-slate-50"
      >
        <Bell size={20} />
        {noLeidas > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white animate-pulse">
            {noLeidas > 9 ? '+9' : noLeidas}
          </span>
        )}
      </button>

      {/* MODAL / DROPDOWN DE NOTIFICACIONES */}
      {abierto && (
        <div className="fixed inset-0 z-[400] flex justify-end bg-slate-900/20 backdrop-blur-sm sm:relative sm:inset-auto sm:bg-transparent sm:backdrop-blur-none">
          <div className="absolute inset-0 sm:hidden" onClick={() => setAbierto(false)}></div>
          
          <div className="absolute top-16 right-4 w-[90vw] max-w-[350px] bg-white rounded-[30px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-200 sm:top-12 sm:right-0">
            
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black italic text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <Bell size={14} className="text-blue-600" /> Notificaciones
              </h3>
              <button onClick={() => setAbierto(false)} className="bg-slate-200 p-1.5 rounded-full text-slate-500"><X size={14} /></button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2 bg-slate-50">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No tienes mensajes nuevos</p>
                </div>
              ) : (
                notificaciones.map(notif => (
                  <div key={notif.id} className={`p-4 rounded-[20px] flex gap-3 relative transition-colors ${!notif.leido ? 'bg-white border-l-4 border-blue-500 shadow-sm' : 'bg-slate-100 opacity-70'}`} onClick={() => !notif.leido && marcarComoLeida(notif.id)}>
                    <div className="shrink-0 mt-0.5">{obtenerIcono(notif.tipo)}</div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-[10px] uppercase tracking-wider truncate ${!notif.leido ? 'font-black text-slate-800' : 'font-bold text-slate-500'}`}>{notif.titulo}</p>
                      <p className="text-xs font-medium text-slate-600 mt-0.5 leading-snug">{notif.mensaje}</p>
                      <p className="text-[8px] font-black text-slate-400 mt-2 uppercase">
                        {formatearFecha(notif.fecha)}
                      </p>
                    </div>
                    {/* Botón de eliminar */}
                    <button onClick={(e) => { e.stopPropagation(); eliminarNotificacion(notif.id); }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {noLeidas > 0 && (
              <div className="p-3 bg-white border-t border-slate-50">
                <button onClick={marcarTodasLeidas} className="w-full py-3 rounded-2xl bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <CheckCheck size={14} /> Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
