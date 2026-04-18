import React, { useState, useMemo } from 'react';
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { Search, MapPin, Navigation, Calendar, Clock, X } from 'lucide-react';
import { UBICACIONES } from '../../constants/ubicaciones';

const AutocompleteInput = ({ placeholder, icon: Icon, value, onChange, iconColor }) => {
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Adaptado para tu estructura de OBJETO {}
  const opciones = useMemo(() => {
    const lista = [];
    if (UBICACIONES) {
      Object.keys(UBICACIONES).forEach(estado => {
        const ciudades = UBICACIONES[estado];
        if (Array.isArray(ciudades)) {
          ciudades.forEach(ciu => {
            lista.push(`${ciu}, ${estado}`);
          });
        }
      });
    }
    return lista.sort();
  }, []);

  const filtradas = value 
    ? opciones.filter(op => op.toLowerCase().includes(value.toLowerCase()))
    : [];

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-all">
        <Icon size={18} className={`${iconColor} mr-3 shrink-0`} />
        <input 
          type="text"
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            setMostrarSugerencias(true);
          }}
          onFocus={() => setMostrarSugerencias(true)}
          onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
          className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-800 placeholder:text-slate-400"
        />
        {value ? (
          <X size={16} className="text-slate-400 ml-2 cursor-pointer" onClick={() => onChange("")} />
        ) : null}
      </div>

      {mostrarSugerencias && filtradas.length > 0 && (
        <ul className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {filtradas.slice(0, 10).map((opcion, index) => ( // Mostramos las primeras 10 para que sea fluido
            <li 
              key={index} 
              onMouseDown={() => {
                onChange(opcion);
                setMostrarSugerencias(false);
              }}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-bold text-slate-700 border-b border-slate-50 last:border-0"
            >
              {opcion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, setVista }) => {
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
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4 mt-2">
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
      onClickDetalle={() => {
        setViajeSeleccionado(viaje); // Esto activará el detalle en NavegacionPrincipal
      }}
      onClickPedir={() => {
        setViajeSeleccionado(viaje);
      }}
    />
  ))
) : (
      
          <div className="text-center py-12 bg-slate-50 rounded-[30px] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic uppercase text-[10px]">No se encontraron resultados</p>
          </div>
        )}
      </div>
    </div>
  );
};
