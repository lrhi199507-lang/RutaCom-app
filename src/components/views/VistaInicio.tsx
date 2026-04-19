import React, { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, Calendar, Clock } from 'lucide-react';

// Importamos la tarjeta detallada (asegúrate que el nombre del archivo sea exacto)
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, userData, modo }) => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");

  const viajesFiltrados = useMemo(() => {
    const lista = Array.isArray(viajes) ? viajes : [];
    return lista.filter(v => {
      const nomO = `${v.cO || ""} ${v.eO || ""}`.toLowerCase();
      const nomD = `${v.cD || ""} ${v.eD || ""}`.toLowerCase();
      return nomO.includes(origen.toLowerCase()) && nomD.includes(destino.toLowerCase());
    });
  }, [viajes, origen, destino]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* YA NO HAY HEADER AQUÍ. 
         Ahora el Header vive en NavegacionPrincipal.tsx 
      */}

      <div className="p-4 space-y-6">
        {/* BUSCADOR */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Search size={14} className="text-blue-600" />
            Buscar Cola
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <MapPin size={16} className="text-blue-600 mr-3" />
              <input 
                placeholder="¿De dónde sales?" 
                className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700"
                value={origen} onChange={(e) => setOrigen(e.target.value)} 
              />
            </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <Navigation size={16} className="text-green-600 mr-3" />
              <input 
                placeholder="¿A dónde vas?" 
                className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700"
                value={destino} onChange={(e) => setDestino(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* LISTADO DE VIAJES UTILIZANDO TU TARJETA OPTIMIZADA */}
        <div className="space-y-4 px-1">
          <h2 className="text-sm font-black italic uppercase text-slate-800 flex justify-between items-center">
            Viajes Disponibles
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full not-italic">
              {viajesFiltrados.length}
            </span>
          </h2>
          
          {viajesFiltrados.length > 0 ? (
            viajesFiltrados.map((viaje) => (
              <CardViajeOptimizada
                key={viaje.id}
                viaje={viaje}
                onClickDetalle={() => setViajeSeleccionado(viaje)}
                onClickPedir={() => setViajeSeleccionado(viaje)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-[30px] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold italic uppercase text-[10px]">No hay colas disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
