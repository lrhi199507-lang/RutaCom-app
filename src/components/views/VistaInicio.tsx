import React, { useState, useMemo } from 'react';
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { Search, MapPin, Navigation, Calendar, Clock, X } from 'lucide-react';
import { UBICACIONES } from '../../constants/ubicaciones';

// --- Sub-componente para el Input con sugerencias ---
const AutocompleteInput = ({ placeholder, icon: Icon, value, onChange, iconColor }) => {
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Aplanamos la lista de estados y ciudades para la búsqueda
  const opciones = useMemo(() => {
    let lista = [];
    UBICACIONES.forEach(est => {
      est.ciudades.forEach(ciu => {
        lista.push(`${ciu}, ${est.estado}`);
      });
    });
    return lista;
  }, []);

  const filtradas = value 
    ? opciones.filter(op => op.toLowerCase().includes(value.toLowerCase()))
    : [];

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-all">
        <Icon size={18} className={`${iconColor} mr-3`} />
        <input 
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setMostrarSugerencias(true);
          }}
          onFocus={() => setMostrarSugerencias(true)}
          onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
          className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-800 placeholder:text-slate-400"
        />
        {value && (
          <X size={16} className="text-slate-400 ml-2 cursor-pointer" onClick={() => onChange("")} />
        )}
      </div>

      {mostrarSugerencias && filtradas.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtradas.map((opcion, index) => (
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

export const VistaInicio = ({ viajes, setViajeSeleccionado, setVista }) => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  // Lógica de filtrado en tiempo real
  const viajesFiltrados = useMemo(() => {
    return viajes.filter(v => {
      const coincideOrigen = origen ? `${v.cO}, ${v.eO}`.toLowerCase().includes(origen.toLowerCase()) : true;
      const coincideDestino = destino ? `${v.cD}, ${v.eD}`.toLowerCase().includes(destino.toLowerCase()) : true;
      // El filtrado por fecha y hora se puede expandir según el formato de tus datos en Firebase
      return coincideOrigen && coincideDestino;
    });
  }, [viajes, origen, destino]);

  return (
    <div className="space-y-6 pb-24">
      
      {/* SECCIÓN DEL BUSCADOR (NUEVA) */}
      <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4 mt-2">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Search size={14} className="text-blue-500" />
          Buscar Cola
        </h2>
        
        <div className="space-y-3">
          <AutocompleteInput 
            placeholder="¿De dónde sales?" 
            icon={MapPin} 
            iconColor="text-blue-500" 
            value={origen} 
            onChange={setOrigen} 
          />
          <AutocompleteInput 
            placeholder="¿A dónde vas?" 
            icon={Navigation} 
            iconColor="text-green-500" 
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

      {/* LISTA DE VIAJES (LO QUE YA TENÍAS) */}
      <div className="space-y-4">
        <h2 className="text-sm font-black italic uppercase text-slate-800 px-2">Viajes Disponibles</h2>
        {viajesFiltrados.length > 0 ? (
          viajesFiltrados.map((viaje) => (
            <CardViajeOptimizada
              key={viaje.id}
              viaje={viaje}
              onClickDetalle={() => {
                setViajeSeleccionado(viaje);
                setVista("detalle");
              }}
              onClickPedir={() => {
                setViajeSeleccionado(viaje);
                setVista("detalle");
              }}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-[30px] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic uppercase text-[10px]">No se encontraron viajes</p>
          </div>
        )}
      </div>
    </div>
  );
};
