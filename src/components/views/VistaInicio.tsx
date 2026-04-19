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
      return (origen ? nomOrigen.includes(origen.toLowerCase()) : true) &&
             (destino ? nomDestino.includes(destino.toLowerCase()) : true);
    });
  }, [viajes, origen, destino]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* HEADER LIMPIO (Sin errores de cierre) */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
            <span className="font-black text-white text-xl italic leading-none">D</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">MODO PASAJERO</p>
            <h1 className="text-sm font-black text-slate-900 mt-0.5">{userData?.nombre || 'Usuario'}</h1>
          </div>
        </div>

        <div className="h-10 bg-slate-900 rounded-2xl flex items-center px-4">
          <Wallet size={14} className="text-blue-400 mr-2" />
          <p className="text-[11px] font-black text-white">
            ${Number(userData?.saldo || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* BUSCADOR */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Search size={14} className="text-blue-600" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscar Cola</h2>
          </div>
          
          <div className="space-y-3">
            <AutocompleteInput 
              label="Desde"
              placeholder="¿De dónde sales?" 
              icon={MapPin} 
              value={origen} 
              onChange={setOrigen} 
              suggestions={UBICACIONES || []}
            />
            <AutocompleteInput 
              label="Hacia"
              placeholder="¿A dónde vas?" 
              icon={Navigation} 
              value={destino} 
              onChange={setDestino} 
              suggestions={UBICACIONES || []}
            />
            
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center">
                <Calendar size={16} className="text-slate-400 mr-2" />
                <input type="date" className="bg-transparent text-xs font-bold outline-none w-full" />
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center">
                <Clock size={16} className="text-slate-400 mr-2" />
                <input type="time" className="bg-transparent text-xs font-bold outline-none w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* LISTADO DE VIAJES */}
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
              <p className="text-slate-400 font-bold italic text-[9px]">SIN COLAS DISPONIBLES</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
