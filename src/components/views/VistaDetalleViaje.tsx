import React, { useState } from 'react';
import { 
  Trash2, Edit3, Calendar, Clock, 
  DollarSign, Users, X, CheckCircle2 
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Ajusta tu ruta
import Toast from "../ui/Toast";

export const VistaMisViajes = ({ misViajes, setVista, setViajeAEditar, refrescarViajes }) => {
  const [viajeAEditarRapido, setViajeAEditarRapido] = useState(null);
  const [showModalEdicion, setShowModalEdicion] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // --- LÓGICA DE FIREBASE ---
  const handleUpdateRapido = async () => {
    if (!viajeAEditarRapido) return;

    try {
      const viajeRef = doc(db, "rutas", viajeAEditarRapido.id);
      await updateDoc(viajeRef, {
        precio: viajeAEditarRapido.precio,
        fecha: viajeAEditarRapido.fecha,
        hora: viajeAEditarRapido.hora,
        asientos: Number(viajeAEditarRapido.asientos) || 4,
      });

      setToastMessage("¡Cambios guardados con éxito!");
      setShowToast(true);
      setShowModalEdicion(false);
      if (refrescarViajes) refrescarViajes(); // Para recargar la lista
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("No se pudo actualizar el viaje.");
    }
  };

  const onDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este viaje?")) {
      try {
        await deleteDoc(doc(db, "rutas", id));
        setToastMessage("Viaje eliminado");
        setShowToast(true);
        if (refrescarViajes) refrescarViajes();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER */}
      <div className="p-6 bg-white border-b border-slate-100">
        <h2 className="text-2xl font-black italic text-slate-800 uppercase">Mis Trayectos</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestiona tus rutas publicadas</p>
      </div>

      <div className="p-4 space-y-4">
        {misViajes.length === 0 ? (
          <div className="text-center py-20 opacity-40 italic font-bold text-slate-400 uppercase text-xs">
            No tienes viajes activos
          </div>
        ) : (
          misViajes.map((viaje) => (
            <div key={viaje.id} className="bg-white rounded-[30px] p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase italic">
                      {viaje.cO} → {viaje.cD}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {viaje.fecha} • {viaje.hora}
                  </p>
                </div>
                <span className="text-xl font-black text-blue-600">${viaje.precio}</span>
              </div>

              <div className="flex gap-2">
                {/* BOTÓN EDITAR RÁPIDO */}
                <button 
                  onClick={() => {
                    setViajeAEditarRapido(viaje);
                    setShowModalEdicion(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all"
                >
                  <Edit3 size={14} /> Editar
                </button>
                
                <button 
                  onClick={() => onDelete(viaje.id)}
                  className="p-3 bg-red-50 text-red-500 rounded-2xl active:bg-red-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE EDICIÓN RÁPIDA (MODO OSCURO PREMIUM) */}
      {showModalEdicion && viajeAEditarRapido && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end z-[100] transition-all">
          <div className="bg-[#0f172a] w-full rounded-t-[40px] p-8 shadow-2xl border-t border-blue-500/30 max-w-md mx-auto">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-8" onClick={() => setShowModalEdicion(false)} />
            
            <h3 className="text-2xl font-black text-white mb-1 uppercase italic italic">Edición Rápida</h3>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-none">
              {viajeAEditarRapido.cO} a {viajeAEditarRapido.cD}
            </p>

            <div className="space-y-5">
              {/* PRECIO */}
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Precio por puesto ($)</label>
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-white opacity-50" />
                  <input 
                    type="number" 
                    value={viajeAEditarRapido.precio}
                    onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, precio: e.target.value})}
                    className="bg-transparent w-full text-2xl font-black text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* FECHA */}
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
                  <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Fecha</label>
                  <input 
                    type="date" 
                    value={viajeAEditarRapido.fecha}
                    onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, fecha: e.target.value})}
                    className="bg-transparent w-full text-sm font-bold text-white outline-none"
                  />
                </div>
                {/* HORA */}
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
                  <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Hora</label>
                  <input 
                    type="time" 
                    value={viajeAEditarRapido.hora}
                    onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, hora: e.target.value})}
                    className="bg-transparent w-full text-sm font-bold text-white outline-none"
                  />
                </div>
              </div>

              {/* PUESTOS */}
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Asientos Totales</label>
                <div className="flex items-center gap-4">
                  <Users size={18} className="text-white opacity-50" />
                  <select 
                    value={viajeAEditarRapido.asientos}
                    onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, asientos: e.target.value})}
                    className="bg-transparent w-full text-sm font-bold text-white outline-none appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-slate-900 text-white">{n} puestos</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowModalEdicion(false)}
                  className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] italic"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateRapido}
                  className="flex-[2] bg-blue-600 text-white font-black uppercase text-[11px] italic rounded-[20px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    </div>
  );
};
