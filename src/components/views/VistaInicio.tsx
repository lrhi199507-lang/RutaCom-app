import React, { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, Calendar, X, ChevronRight } from 'lucide-react';
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { UBICACIONES } from '../../constants/ubicaciones';

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, userData, modo }) => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [campoActivo, setCampoActivo] = useState(null);
  
  // Estados para el Calendario
  const [showCalendar, setShowCalendar] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Convertimos UBICACIONES (objeto) en un array plano para el buscador
  const locationsArray = useMemo(() => {
    return Object.entries(UBICACIONES).flatMap(([estado, ciudades]) =>
      ciudades.map(ciudad => ({ ciudad, estado }))
    );
  }, []);

  const manejarBusqueda = (texto, tipo) => {
    if (tipo === 'origen') setOrigen(texto);
    else setDestino(texto);

    if (texto.length > 0) {
      const filtradas = locationsArray.filter(u => 
        u.ciudad.toLowerCase().includes(texto.toLowerCase())
      ).slice(0, 4);
      setSugerencias(filtradas);
      setCampoActivo(tipo);
    } else {
      setSugerencias([]);
    }
  };

  const viajesFiltrados = useMemo(() => {
  const lista = Array.isArray(viajes) ? viajes : [];
  
  // 1. Obtenemos la fecha del calendario en formato YYYY-MM-DD local
  const anioB = fechaSeleccionada.getFullYear();
  const mesB = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
  const diaB = String(fechaSeleccionada.getDate()).padStart(2, '0');
  const fechaBusquedaStr = `${anioB}-${mesB}-${diaB}`;

  return lista.filter(v => {
    // FILTRO DE TEXTO
    const nomO = `${v.cO || v.origen || ""} ${v.eO || ""}`.toLowerCase();
    const nomD = `${v.cD || v.destino || ""} ${v.eD || ""}`.toLowerCase();
    const coincideTexto = nomO.includes(origen.toLowerCase()) && nomD.includes(destino.toLowerCase());

    // FILTRO DE FECHA (Comparando solo YYYY-MM-DD)
    // Como en tu Firebase está como "2026-04-26T...", el split('T')[0] saca "2026-04-26"
    const fechaViajeStr = v.fecha ? String(v.fecha).split('T')[0] : "";
    
    const coincideFecha = fechaViajeStr === fechaBusquedaStr;

    return coincideTexto && coincideFecha;
  });
}, [viajes, origen, destino, fechaSeleccionada]);
  

  const formatearFechaBusqueda = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', day: 'numeric', month: 'short' 
    }).replace('.', '');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="p-4 space-y-6">
        
        {/* BUSCADOR ESTILO BLABLACAR */}
        <div className="bg-white rounded-[35px] shadow-xl border border-slate-100 p-2 space-y-1 relative">
          
          {/* INPUT ORIGEN */}
          <div className="relative">
            <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-t-[28px]">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <input 
                value={origen}
                onChange={(e) => manejarBusqueda(e.target.value, 'origen')}
                placeholder="¿Desde dónde sales?" 
                className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-slate-700 w-full placeholder:text-slate-400"
              />
              {origen && <X size={14} className="text-slate-300" onClick={() => setOrigen("")} />}
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 mx-4" />

          {/* INPUT DESTINO */}
          <div className="relative">
            <div className="flex items-center gap-3 p-4 bg-slate-50/50">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <input 
                value={destino}
                onChange={(e) => manejarBusqueda(e.target.value, 'destino')}
                placeholder="¿A dónde vas?" 
                className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-slate-700 w-full placeholder:text-slate-400"
              />
              {destino && <X size={14} className="text-slate-300" onClick={() => setDestino("")} />}
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 mx-4" />

          {/* BOTÓN CALENDARIO Y ACCIÓN */}
          <div className="flex items-center gap-2 p-2">
            <button 
              onClick={() => setShowCalendar(true)}
              className="flex-1 flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-transparent active:scale-95 transition-all"
            >
              <Calendar size={18} className="text-blue-600" />
              <div className="text-left">
                <p className="text-[7px] font-black uppercase text-slate-400 leading-none mb-1">Cuándo</p>
                <p className="text-xs font-black text-slate-700 leading-none italic capitalize">
                  {formatearFechaBusqueda(fechaSeleccionada)}
                </p>
              </div>
            </button>

            <button className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 active:scale-95 transition-all">
              <Search size={22} strokeWidth={3} />
            </button>
          </div>

          {/* SUGERENCIAS FLOTANTES */}
          {sugerencias.length > 0 && (
            <div className="absolute left-4 right-4 top-[40%] bg-white shadow-2xl rounded-2xl border border-slate-100 z-[110] overflow-hidden">
              {sugerencias.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    if (campoActivo === 'origen') setOrigen(s.ciudad);
                    else setDestino(s.ciudad);
                    setSugerencias([]);
                  }}
                  className="w-full p-4 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-slate-50 last:border-none"
                >
                  <MapPin size={14} className="text-slate-300" />
                  <div>
                    <p className="text-xs font-black text-slate-700">{s.ciudad}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{s.estado}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
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
              <p className="text-slate-400 font-bold italic uppercase text-[10px]">No hay colas disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CALENDARIO (LÓGICA AUTOMÁTICA) */}
{showCalendar && (
  <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-sm rounded-[40px] p-6 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2">
        <h3 className="text-lg font-black italic uppercase text-slate-800">¿Cuándo sales?</h3>
        <button onClick={() => setShowCalendar(false)} className="p-2 bg-slate-100 rounded-full">
          <X size={18} />
        </button>
      </div>
      
      <div className="space-y-2">
        {/* GENERAMOS 14 DÍAS AUTOMÁTICAMENTE */}
        {[...Array(14)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i); // Sumamos días a la fecha actual
          
          return (
            <button 
              key={i}
              onClick={() => { setFechaSeleccionada(d); setShowCalendar(false); }}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${
                fechaSeleccionada.toDateString() === d.toDateString() 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="text-left">
                <p className={`text-[10px] font-black uppercase ${fechaSeleccionada.toDateString() === d.toDateString() ? 'text-blue-100' : 'text-slate-400'}`}>
                  {i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'long' })}
                </p>
                <p className="text-sm font-black italic uppercase">
                  {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              <ChevronRight size={18} className={fechaSeleccionada.toDateString() === d.toDateString() ? 'text-white' : 'text-blue-600'} />
            </button>
          );
        })}
      </div>
    </div>
  </div>
)}
    </div>
  );
};
