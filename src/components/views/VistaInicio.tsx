import React, { useState, useMemo } from 'react';
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { Search, MapPin, Navigation, Calendar, Clock, Wallet } from 'lucide-react';
import { UBICACIONES } from '../../constants/ubicaciones';
import { AutocompleteInput } from '../ui/AutocompleteInput';

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, userData }) => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const viajesFiltrados = useMemo(() => {
    if (!Array.isArray(viajes)) return [];
    return viajes.filter(v => {
      const nomOrigen = `${v.cO || ""} ${v.eO || ""}`.toLowerCase();
      const nomDestino = `${v.cD || ""} ${v.eD || ""}`.toLowerCase();
      const coincideOrigen = origen ? nomOrigen.includes(origen.toLowerCase()) : true;
      const coincideDestino = destino ? nomDestino.includes(destino.toLowerCase()) : true;
      return coincideOrigen && coincideDestino;
    });
  }, [viajes, origen, destino]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-in fade-in duration-500">
      
      {/* HEADER CORREGIDO - FONDO BLANCO, LOGO AZUL */}
      <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Cuadro del Logo */}
          <div className="w-12 h-12 rounded-[18px] bg-blue-600 flex items-center justify-center shadow-md shadow-blue-100">
            <span className="font-black text-white text-xl italic leading-none">D</span>
          </div>

          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              MODO PASAJERO
            </p>
            <h1 className="text-sm font-black text-slate-900 tracking-tight mt-1">
              {userData?.nombre || 'Explorador'}
            </h1>
          </div>
        </div>

        {/* Wallet */}
        <button className="h-10 bg-slate-900 rounded-2xl flex items-center gap-2 px-4 active:scale-95 transition-all">
          <Wallet size={14} className="text-blue-400" />
          <p className="text-[11px] font-black text-white">
            ${Number(userData?.saldo || 0).toFixed(2)}
          </p>
        </button>
      </header>

      <main className="p-4 space-y-6">
        {/* BUSCADOR */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Search size={14} className="text-blue-600" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Buscar Cola
            </h2>
          </div>
          
          <div className="space-y-3">
            <AutocompleteInput 
              label="Desde"
              placeholder="¿Dónde estás?" 
              icon={MapPin} 
              value={origen} 
              onChange={setOrigen} 
              suggestions={UBICACIONES}
            />
            <AutocompleteInput 
              label="Hacia"
              placeholder="¿A dónde vas?" 
              icon={Navigation} 
              value={destino} 
              onChange={setDestino} 
              suggestions={UBICACIONES}
            />
            
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Fecha</p>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                  <Calendar size={16} className="text-slate-400 mr-2 shrink-0" />
                  <input 
                    type="date" 
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700"
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 ml-1">Hora</p>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                  <Clock size={16} className="text-slate-400 mr-2 shrink-0" />
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
        </div>

        {/* LISTADO */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-black italic uppercase text-slate-800">
              Colas Disponibles
            </h2>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {viajesFiltrados.length} encontrados
            </span>
          </div>
          
          <div className="space-y-3">
            {viajesFiltrados.length > 0 ? (
              viajesFiltrados.map((viaje) => (
                <CardViajeOptimizada
                  key={viaje.id}
                  viaje={viaje}
                  onClickDetalle={() => setViajeSeleccionado(viaje)}
                />
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-[30px] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic uppercase text-[9px]">No hay rutas activas</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
