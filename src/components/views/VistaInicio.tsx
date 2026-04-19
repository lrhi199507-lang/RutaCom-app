import React, { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, Calendar, Clock } from 'lucide-react';

// Importamos la tarjeta detallada (asegúrate que el nombre del archivo sea exacto)
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { UBICACIONES } from '../../constants/ubicaciones';
export const VistaInicio = ({ viajes = [], setViajeSeleccionado, userData, modo }) => {
 
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
const [campoActivo, setCampoActivo] = useState(null); // 'origen' o 'destino'

const manejarBusqueda = (texto, tipo) => {
  if (tipo === 'origen') setOrigen(texto);
  else setDestino(texto);

  if (texto.length > 0) {
    const filtradas = UBICACIONES.filter(u => 
      u.ciudad.toLowerCase().includes(texto.toLowerCase())
    ).slice(0, 4); // Solo mostrar 4 sugerencias
    setSugerencias(filtradas);
    setCampoActivo(tipo);
  } else {
    setSugerencias([]);
  }
};

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
  {/* BUSCADOR - Le añadimos 'relative' para que las sugerencias se peguen a él */}
  <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4 relative">
    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
      <Search size={14} className="text-blue-600" />
      Buscar Cola
    </h2>
    
    <div className="space-y-3">
      {/* INPUT ORIGEN */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
        <MapPin size={16} className="text-blue-600 mr-3" />
        <input 
          placeholder="¿De dónde sales?" 
          className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700"
          value={origen} 
          onChange={(e) => manejarBusqueda(e.target.value, 'origen')} 
        />
      </div>

      {/* INPUT DESTINO */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
        <Navigation size={16} className="text-green-600 mr-3" />
        <input 
          placeholder="¿A dónde vas?" 
          className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-700"
          value={destino} 
          onChange={(e) => manejarBusqueda(e.target.value, 'destino')} 
        />
      </div>
    </div>

    {/* SUGERENCIAS: Ahora están dentro del div relativo del buscador */}
    {sugerencias.length > 0 && (
      <div className="absolute left-5 right-5 top-[85%] bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
        {sugerencias.map((s, i) => (
          <div 
            key={i} 
            className="p-4 border-b border-slate-50 last:border-0 active:bg-slate-50 flex items-center gap-3"
            onClick={() => {
              if (campoActivo === 'origen') setOrigen(s.ciudad);
              else setDestino(s.ciudad);
              setSugerencias([]);
            }}
          >
            <MapPin size={12} className="text-slate-300" />
            <div>
              <p className="text-xs font-black text-slate-700 leading-none">{s.ciudad}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{s.estado}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* LISTADO DE VIAJES... */}
        
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
