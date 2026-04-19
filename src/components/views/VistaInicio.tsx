import React, { useState, useMemo } from 'react';
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { Search, MapPin, Navigation, Calendar, Clock, Wallet } from 'lucide-react';
import { UBICACIONES } from '../../constants/ubicaciones';
import { AutocompleteInput } from '../ui/AutocompleteInput';

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, userData }) => {
  // 1. ESTADO DE SEGURIDAD: Si no hay componentes críticos, mostramos un error claro
  if (!CardViajeOptimizada) return <div className="p-10 text-red-500 font-bold">Error: No se encuentra CardViajeOptimizada</div>;
  if (!AutocompleteInput) return <div className="p-10 text-red-500 font-bold">Error: No se encuentra AutocompleteInput</div>;

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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER */}
      <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[18px] bg-blue-600 flex items-center justify-center">
            <span className="font-black text-white text-xl italic">D</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">MODO PASAJERO</p>
            <h1 className="text-sm font-black text-slate-900 mt-1">{userData?.nombre || 'Usuario'}</h1>
          </div>
        </div>
        <div className="h-10 bg-slate-950 rounded-2xl flex items-center px-4">
          <Wallet size={14} className="text-blue-400 mr-2" />
          <p className="text-[11px] font-black text-white">${Number(userData?.saldo || 0).toFixed(2)}</p>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* BUSCADOR */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase text-slate-400">Buscar Ruta</span>
          </div>
          
          <div className="space-y-3">
            <AutocompleteInput 
              label="Origen"
              placeholder="¿De dónde sales?" 
              icon={MapPin} 
              value={origen} 
              onChange={setOrigen} 
              suggestions={UBICACIONES || []}
            />
            <AutocompleteInput 
              label="Destino"
              placeholder="¿A dónde vas?" 
              icon={Navigation} 
              value={destino} 
              onChange={setDestino} 
              suggestions={UBICACIONES || []}
            />
          </div>
        </div>

        {/* LISTADO */}
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
              <p className="text-slate-400 font-bold italic text-[9px]">NO HAY VIAJES</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
