import React, { useState, useMemo } from 'react';
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { Search, MapPin, Navigation, Calendar, Clock, X, Map, Wallet } from 'lucide-react';
import { UBICACIONES } from '../../constants/ubicaciones';

// ... (Componente AutocompleteInput se mantiene igual) ...

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, setVista, userData }) => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const viajesFiltrados = useMemo(() => {
    if (!Array.isArray(viajes)) return [];
    return viajes.filter(v => {
      const nomOrigen = `${v.cO || ""}, ${v.eO || ""}`.toLowerCase();
      const nomDestino = `${v.cD || ""}, ${v.eD || ""}`.toLowerCase();
      const coincideOrigen = origen ? nomOrigen.includes(origen.toLowerCase()) : true;
      const coincideDestino = destino ? nomDestino.includes(destino.toLowerCase()) : true;
      return coincideOrigen && coincideDestino;
    });
  }, [viajes, origen, destino]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-in fade-in duration-500">
      
      {/* --------------------------------------------------------- */}
      {/* NUEVO HEADER BLANCO FIJO PARA TODA LA PLATAFORMA */}
      {/* --------------------------------------------------------- */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Logo 'D' (Fondo Azul, 'D' Negra) */}
          <div className="w-14 h-14 rounded-[22px] bg-blue-600 flex items-center justify-center shadow-md">
            <span className="font-black text-slate-950 text-2xl italic">D</span>
          </div>

          {/* Información del Usuario */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              MODO PASAJERO
            </p>
            <h1 className="text-base font-black text-slate-900 tracking-tighter mt-0.5">
              {userData?.nombre || 'Luis Hernández'}
            </h1>
          </div>
        </div>

        {/* Botones Mapa y Wallet */}
        <div className="flex items-center gap-2">
          <button className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-all">
            <Map size={22} />
          </button>
          
          <button className="h-11 bg-slate-950 rounded-full flex items-center gap-2 px-4 shadow-sm active:scale-95 transition-all">
            <Wallet size={16} className="text-blue-500" />
            <p className="text-xs font-black text-white tracking-tighter">
              ${userData?.saldo?.toFixed(2) || "80.00"}
            </p>
          </button>
        </div>
      </div>
      {/* --------------------------------------------------------- */}

      <div className="p-4 space-y-6">
        {/* BUSCADOR */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Search size={14} className="text-blue-600" />
            Buscar Cola
          </h2>
          
          <div className="space-y-3">
            <AutocompleteInput 
              placeholder="¿De dónde sales?" 
              icon={MapPin} 
              iconColor="text-blue-600" 
              value={origen} 
              onChange={setOrigen} 
            />
            <AutocompleteInput 
              placeholder="¿A dónde vas?" 
              icon={Navigation} 
              iconColor="text-green-600" 
              value={destino} 
              onChange={setDestino} 
            />
            
            <div className="flex gap-3">
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <Calendar size={18} className="text-slate-400 mr-2 shrink-0" />
                <input 
                  type="date" 
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700"
                />
              </div>
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <Clock size={18} className="text-slate-400 mr-2 shrink-0" />
                <input 
                  type="time" 
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700"
                />
              </div>
            </div>
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
              <p className="text-slate-400 font-bold italic uppercase text-[10px]">No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
