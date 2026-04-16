import React, { useState } from 'react';
import { Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

export const VistaMisViajes = ({ misPublicaciones, viajesDondeVoy, alEliminar }) => {
  const [subVista, setSubVista] = useState("pasajero"); // o "chofer"

  return (
    <div className="space-y-6">
      {/* SELECTOR DE ROL DENTRO DE MIS VIAJES */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mx-2">
        <button 
          onClick={() => setSubVista("pasajero")}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${subVista === "pasajero" ? "bg-white shadow-sm text-blue-600" : "text-slate-400"}`}
        >
          Soy Pasajero
        </button>
        <button 
          onClick={() => setSubVista("chofer")}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${subVista === "chofer" ? "bg-white shadow-sm text-blue-600" : "text-slate-400"}`}
        >
          Soy Chofer
        </button>
      </div>

      <div className="space-y-4">
        {subVista === "chofer" ? (
          // LISTA DE LO QUE YO PUBLIQUÉ
          misPublicaciones.map(viaje => (
            <div key={viaje.id} className="bg-white p-4 rounded-[25px] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase italic">Activo</span>
                <button 
                  onClick={() => handleEliminar(viaje.id)} 
                  className="text-red-400 p-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm font-black italic">{viaje.fCO} → {viaje.fCD}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{viaje.fecha} • {viaje.hora}</p>
            </div>
          ))
        ) : (
          // LISTA DE COLAS QUE PEDÍ
          <p className="text-center text-slate-400 italic text-xs">No has pedido colas aún.</p>
        )}
      </div>

      {/* SECCIÓN DE HISTORIAL (Abajo, más discreto) */}
      <div className="pt-6">
        <h3 className="text-[10px] font-black uppercase text-slate-400 italic mb-4 px-2">Historial de Viajes</h3>
        <div className="opacity-60 grayscale space-y-3">
          {/* Ejemplo de viaje completado */}
          <div className="bg-slate-50 p-4 rounded-[25px] border border-dashed border-slate-200 flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold italic text-slate-600">Valencia → Caracas</p>
              <p className="text-[9px] font-medium text-slate-400">12 Abr 2026</p>
            </div>
            <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase italic">
              <CheckCircle size={12}/> Completado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};