import React, { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, Calendar, Clock, X, Map, Wallet } from 'lucide-react';

// IMPORTACIÓN SEGURA (Asegúrate de que la ruta sea esta)
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { UBICACIONES } from '../../constants/ubicaciones';

// Componente interno para evitar errores de importación externa
const AutocompleteInput = ({ placeholder, icon: Icon, iconColor, value, onChange }) => (
  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-500 transition-all">
    <Icon size={18} className={`${iconColor} mr-3 shrink-0`} />
    <input 
      type="text" 
      placeholder={placeholder} 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700 placeholder:text-slate-400"
    />
  </div>
);

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, setVista, userData }) => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");

  const viajesFiltrados = useMemo(() => {
    // Protección por si 'viajes' llega como undefined de Firebase
    const listaSegura = Array.isArray(viajes) ? viajes : [];
    return listaSegura.filter(v => {
      const nomOrigen = `${v.cO || ""} ${v.eO || ""}`.toLowerCase();
      const nomDestino = `${v.cD || ""} ${v.eD || ""}`.toLowerCase();
      return nomOrigen.includes(origen.toLowerCase()) && nomDestino.includes(destino.toLowerCase());
    });
  }, [viajes, origen, destino]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER INTEGRADO */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
            <span className="font-black text-white text-xl italic">D</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">MODO PASAJERO</p>
            <h1 className="text-sm font-black text-slate-900 mt-0.5">{userData?.nombre || 'Usuario'}</h1>
          </div>
        </div>
        <div className="h-10 bg-slate-950 rounded-full flex items-center gap-2 px-4">
          <Wallet size={14} className="text-blue-500" />
          <p className="text-xs font-black text-white">${userData?.saldo || "0.00"}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* BUSCADOR */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
          <AutocompleteInput placeholder="¿De dónde sales?" icon={MapPin} iconColor="text-blue-600" value={origen} onChange={setOrigen} />
          <AutocompleteInput placeholder="¿A dónde vas?" icon={Navigation} iconColor="text-green-600" value={destino} onChange={setDestino} />
        </div>

        {/* LISTADO */}
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
            <div className="text-center py-10 bg-white rounded-[30px] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-[10px]">No hay resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
