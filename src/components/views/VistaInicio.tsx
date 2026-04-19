import React, { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, Wallet, Users, Star, ShieldCheck, Car, Clock } from 'lucide-react';

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
      {/* HEADER BLANCO INTEGRADO (El que querías) */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="font-black text-white text-xl italic">D</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] leading-none">
              {modo === "pasajero" ? "MODO PASAJERO" : "MODO CONDUCTOR"}
            </p>
            <h1 className="text-sm font-black text-slate-900 mt-1 tracking-tight">
              {userData?.nombre || 'Usuario'}
            </h1>
          </div>
        </div>
        <div className="h-10 bg-slate-950 rounded-full flex items-center gap-2 px-4">
          <Wallet size={14} className="text-blue-500" />
          <p className="text-xs font-black text-white tracking-tighter">
            ${userData?.saldo || "0.00"}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* BUSCADOR SIMPLE */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-3">
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

        {/* LISTADO DE VIAJES */}
        <div className="space-y-4 px-1">
          <h2 className="text-sm font-black italic uppercase text-slate-800 flex justify-between items-center">
            Viajes Disponibles
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full not-italic">
              {viajesFiltrados.length}
            </span>
          </h2>
          
          {viajesFiltrados.map((viaje) => (
            <div 
              key={viaje.id}
              onClick={() => setViajeSeleccionado(viaje)}
              className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm active:scale-95 transition-all space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                    <ShieldCheck size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">
                      {viaje.conductorNombre || "Conductor"}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Verificado</p>
                  </div>
                </div>
                <p className="text-2xl font-black italic text-blue-600 leading-none">${viaje.precio || "0"}</p>
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600">
                <span className="truncate">{viaje.cO || "Origen"}</span>
                <span className="text-slate-300">→</span>
                <span className="truncate">{viaje.cD || "Destino"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
