import React, { useState } from 'react';
import { 
  Trash2, Edit3, Calendar, Clock, 
  DollarSign, Users, X, CheckCircle2 
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Toast from "../ui/Toast";

export const VistaMisViajes = ({ misViajes = [], setVista, refrescarViajes }) => {
  const [viajeAEditarRapido, setViajeAEditarRapido] = useState(null);
  const [showModalEdicion, setShowModalEdicion] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleUpdateRapido = async () => {
    if (!viajeAEditarRapido?.id) return;
    try {
      const viajeRef = doc(db, "rutas", viajeAEditarRapido.id);
      await updateDoc(viajeRef, {
        precio: viajeAEditarRapido.precio,
        fecha: viajeAEditarRapido.fecha,
        hora: viajeAEditarRapido.hora,
        asientos: Number(viajeAEditarRapido.asientos) || 4,
      });
      setToastMessage("¡Cambios guardados!");
      setShowToast(true);
      setShowModalEdicion(false);
      if (refrescarViajes) refrescarViajes();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar");
    }
  };

  const onDelete = async (id) => {
    if (!id) return;
    if (window.confirm("¿Eliminar este viaje?")) {
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
      <div className="p-6 bg-white border-b border-slate-100">
        <h2 className="text-2xl font-black italic text-slate-800 uppercase">Mis Trayectos</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestiona tus rutas</p>
      </div>

      <div className="p-4 space-y-4">
        {!misViajes || misViajes.length === 0 ? (
          <div className="text-center py-20 opacity-40 italic font-bold text-slate-400 uppercase text-xs">
            No tienes viajes activos
          </div>
        ) : (
          misViajes.map((viaje) => (
            <div key={viaje.id} className="bg-white rounded-[30px] p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase italic leading-tight">
                      {viaje?.cO || "S/N"} → {viaje?.cD || "S/N"}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {viaje?.fecha || "Sin fecha"} • {viaje?.hora || "Sin hora"}
                  </p>
                </div>
                <span className="text-xl font-black text-blue-600 ml-2">${viaje?.precio || "0"}</span>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setViajeAEditarRapido({...viaje});
                    setShowModalEdicion(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all"
                >
                  <Edit3 size={14} /> Editar
                </button>
                <button 
                  onClick={() => onDelete(viaje.id)}
                  className="p-3 bg-red-50 text-red-500 rounded-2xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE EDICIÓN RÁPIDA */}
      {showModalEdicion && viajeAEditarRapido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end z-[100]">
          <div className="bg-[#0f172a] w-full rounded-t-[40px] p-8 max-w-md mx-auto border-t border-blue-500/20">
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" onClick={() => setShowModalEdicion(false)} />
            
            <h3 className="text-xl font-black text-white mb-6 uppercase italic">Edición Rápida</h3>

            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-2xl">
                <label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Precio ($)</label>
                <input 
                  type="number" 
                  value={viajeAEditarRapido.precio || ""}
                  onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, precio: e.target.value})}
                  className="bg-transparent w-full text-xl font-black text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-2xl">
                  <label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Fecha</label>
                  <input 
                    type="date" 
                    value={viajeAEditarRapido.fecha || ""}
                    onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, fecha: e.target.value})}
                    className="bg-transparent w-full text-xs font-bold text-white outline-none"
                  />
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl">
                  <label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Hora</label>
                  <input 
                    type="time" 
                    value={viajeAEditarRapido.hora || ""}
                    onChange={(e) => setViajeAEditarRapido({...viajeAEditarRapido, hora: e.target.value})}
                    className="bg-transparent w-full text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={handleUpdateRapido}
                className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-2xl mt-4 shadow-lg shadow-blue-900/40"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setShowModalEdicion(false)}
                className="w-full text-slate-500 font-bold uppercase text-[10px] py-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
    </div>
  );
};
