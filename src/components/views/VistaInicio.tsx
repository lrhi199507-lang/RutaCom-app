import React, { useState, useMemo, useRef } from 'react';
import { Search, MapPin, Calendar, X, ChevronRight, Users, Plus, Minus } from 'lucide-react';
import { CardViajeOptimizada } from '../ui/CardViajeOptimizada';
import { UBICACIONES } from '../../constants/ubicaciones';
import MapaView from '../Map/MapaView'; // <-- Importación del mapa

export const VistaInicio = ({ viajes = [], setViajeSeleccionado, userData, modo }) => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [campoActivo, setCampoActivo] = useState(null);
  const [ordenPrecio, setOrdenPrecio] = useState('asc'); 
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPasajeros, setShowPasajeros] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  
  // <-- Nuevos estados para coordenadas
  const [coordsOrigen, setCoordsOrigen] = useState(null); 
  const [coordsDestino, setCoordsDestino] = useState(null);
  
  const [pasajeros, setPasajeros] = useState({ adultos: 1, niños: 0 });

  const totalPasajeros = pasajeros.adultos + pasajeros.niños;

  const locationsArray = useMemo(() => {
    return Object.entries(UBICACIONES).flatMap(([estado, ciudades]) =>
      ciudades.map(ciudad => ({ ciudad, estado }))
    );
  }, []);

  // El guardián del temporizador
  const timerRef = useRef(null);

  const manejarBusqueda = (texto, tipo) => {
    // 1. Actualizamos el texto en pantalla inmediatamente para que no se sienta lag
    if (tipo === 'origen') {
        if (typeof setViajeForm !== 'undefined') setViajeForm({...viajeForm, origen: texto});
        else setOrigen(texto); // Para VistaInicio
    } else {
        if (typeof setViajeForm !== 'undefined') setViajeForm({...viajeForm, destino: texto});
        else setDestino(texto); // Para VistaInicio
    }

    // 2. Lógica de búsqueda con Debounce
    if (texto.length > 2) {
      setCampoActivo(tipo);
      
      // Si el usuario sigue escribiendo, cancelamos el "fetch" anterior
      if (timerRef.current) clearTimeout(timerRef.current);
      
      // Iniciamos un nuevo temporizador de 600 milisegundos
      timerRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${texto}&countrycodes=ve&addressdetails=1&limit=5`
          );
          const data = await response.json();
          
          const sugerenciasFiltradas = data.map(item => ({
            ciudad: item.address?.city || item.address?.town || item.address?.village || item.name,
            estado: item.address?.state || "Venezuela",
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          }));
          
          setSugerencias(sugerenciasFiltradas);
        } catch (error) {
          console.error("Error buscando ubicación:", error);
        }
      }, 600); // <-- Magia aquí: espera 0.6 segundos sin teclear antes de buscar
      
    } else {
      setSugerencias([]);
    }
  };
  
  
  const formatearFechaBusqueda = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', day: 'numeric', month: 'short' 
    }).replace('.', '');
  };

const viajesFiltrados = useMemo(() => {
  const lista = Array.isArray(viajes) ? viajes : [];
  
  const fechaBusquedaBase = new Date(fechaSeleccionada);
  const fechaBusquedaStr = `${fechaBusquedaBase.getFullYear()}-${String(fechaBusquedaBase.getMonth() + 1).padStart(2, '0')}-${String(fechaBusquedaBase.getDate()).padStart(2, '0')}`;

  const filtrados = lista.filter(v => {
    const nomO = `${v.cO || v.origen || ""} ${v.eO || ""}`.toLowerCase();
    const nomD = `${v.cD || v.destino || ""} ${v.eD || ""}`.toLowerCase();
    const coincideTexto = nomO.includes(origen.toLowerCase()) && nomD.includes(destino.toLowerCase());

    const esRutaSoloVuelta = v.tipoRuta === "vuelta_de_ruta";
    const fechaRaw = esRutaSoloVuelta ? (v.fechaRegreso || v.fecha) : v.fecha;
    const fechaViajeStr = fechaRaw ? String(fechaRaw).split('T')[0] : "";
    const coincideFecha = fechaViajeStr === fechaBusquedaStr;

    // Solo verificamos que quepan los pasajeros que buscas, no si el viaje está al 100%
    const asientosDisponibles = parseInt(v.asientos || v.puestos || 0);
    const cabenTodos = asientosDisponibles >= totalPasajeros;

    return coincideTexto && coincideFecha && cabenTodos;
  });

  return [...filtrados].sort((a, b) => {
    const precioA = parseFloat(String(a.precio).replace(/[^0-9.]/g, '')) || 0;
    const precioB = parseFloat(String(b.precio).replace(/[^0-9.]/g, '')) || 0;
    return ordenPrecio === 'asc' ? precioA - precioB : precioB - precioA;
  });
}, [viajes, origen, destino, fechaSeleccionada, pasajeros, ordenPrecio, totalPasajeros]);
  

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="p-4 space-y-6">
        
        <div className="bg-white rounded-[35px] shadow-xl border border-slate-100 p-2 space-y-1 relative">
          
          <div className="bg-slate-50/50 rounded-[28px] overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <input 
                value={origen}
                onChange={(e) => manejarBusqueda(e.target.value, 'origen')}
                placeholder="¿Desde dónde sales?" 
                className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-slate-700 w-full placeholder:text-slate-400"
              />
              {/* <-- Limpiamos coordenadas al borrar texto */}
              {origen && <X size={14} className="text-slate-300" onClick={() => { setOrigen(""); setCoordsOrigen(null); }} />}
            </div>
            <div className="h-[1px] bg-white mx-4" />
            <div className="flex items-center gap-3 p-4">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <input 
                value={destino}
                onChange={(e) => manejarBusqueda(e.target.value, 'destino')}
                placeholder="¿A dónde vas?" 
                className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-slate-700 w-full placeholder:text-slate-400"
              />
              {/* <-- Limpiamos coordenadas al borrar texto */}
              {destino && <X size={14} className="text-slate-300" onClick={() => { setDestino(""); setCoordsDestino(null); }} />}
            </div>
          </div>

          <div className="flex gap-1 p-1">
            <button 
              onClick={() => setShowCalendar(true)}
              className="flex-1 flex items-center gap-2 p-3 bg-slate-50/50 rounded-2xl active:scale-95 transition-all"
            >
              <Calendar size={16} className="text-blue-600" />
              <span className="text-[11px] font-black text-slate-700 italic capitalize">
                {formatearFechaBusqueda(fechaSeleccionada)}
              </span>
            </button>

            <button 
              onClick={() => setShowPasajeros(true)}
              className="flex-1 flex items-center gap-2 p-3 bg-slate-50/50 rounded-2xl active:scale-95 transition-all"
            >
              <Users size={16} className="text-blue-600" />
              <span className="text-[11px] font-black text-slate-700 italic uppercase">
                {totalPasajeros} {totalPasajeros === 1 ? 'Persona' : 'Personas'}
              </span>
            </button>
          </div>

          {/* <-- MAPA DE REFERENCIA (Aparece si hay destino seleccionado) */}
          {coordsDestino && (
            <div className="p-2 animate-in fade-in zoom-in duration-300">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-2 ml-2 italic">📍 Destino seleccionado:</p>
              <MapaView origen={coordsOrigen} destino={coordsDestino} />
            </div>
          )}

          {sugerencias.length > 0 && (
            <div className="absolute left-4 right-4 top-[45%] bg-white shadow-2xl rounded-3xl border border-slate-100 z-[110] overflow-hidden">
              {sugerencias.map((s, i) => ( 
              <button  key={i} onClick={() => {
                if (campoActivo === 'origen') {
                  setOrigen(s.ciudad); 
                  setCoordsOrigen({ lat: s.lat, lon: s.lon }); // <-- Guardamos coordenadas
                } else {
                  setDestino(s.ciudad); 
                  setCoordsDestino({ lat: s.lat, lon: s.lon }); // <-- Guardamos coordenadas
                }   
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

        <div className="space-y-4 px-1">
         <h2 className="text-sm font-black italic uppercase text-slate-800 flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              {fechaSeleccionada.toDateString() === new Date().toDateString() 
                ? "Colas para Hoy" 
                : `Colas: ${formatearFechaBusqueda(fechaSeleccionada)}`}
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full not-italic">
                {viajesFiltrados.length}
              </span>
            </div>

            <button 
              onClick={() => setOrdenPrecio(ordenPrecio === 'asc' ? 'desc' : 'asc')}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all active:scale-95 border ${
                ordenPrecio === 'asc' ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <span className={`text-[9px] font-black uppercase italic ${ordenPrecio === 'asc' ? 'text-blue-600' : 'text-slate-500'}`}>
                {ordenPrecio === 'asc' ? 'Más baratos' : 'Precio alto'}
              </span>
              <div className={ordenPrecio === 'asc' ? 'text-blue-600' : 'text-slate-400'}>
                {/* <-- Se mantienen tus SVGs originales intactos */}
                {ordenPrecio === 'asc' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m7 9 5-5 5 5"/><path d="M12 15V4"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="M12 9V20"/></svg>
                )}
              </div>
            </button>
          </h2>
          
          {viajesFiltrados.length > 0 ? (
            viajesFiltrados.map((viaje) => {
              const pasajerosConfirmados = viaje.pasajeros || [];
              const asientosTotales = viaje.asientos || viaje.puestos || 1;
              const cuposRestantes = asientosTotales - pasajerosConfirmados.length;
              const viajeLleno = cuposRestantes <= 0;

                            return (
                <div key={viaje.id} className={viajeLleno ? 'opacity-65 pointer-events-none relative pt-3 mb-2' : 'relative'}>
                  {viajeLleno && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-black uppercase text-center py-1.5 px-5 rounded-full z-20 shadow-lg border border-slate-700 whitespace-nowrap flex items-center gap-1">
                      🚫 Cupos Completos
                    </div>
                  )}
                  <CardViajeOptimizada
                    viaje={viaje}
                    onClickDetalle={() => !viajeLleno && setViajeSeleccionado(viaje)}
                    onClickPedir={() => !viajeLleno && setViajeSeleccionado(viaje)}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-[40px] border border-dashed border-slate-200 px-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={24} />
              </div>
              <p className="text-slate-800 font-black italic uppercase text-xs mb-1">No hay colas disponibles</p>
              <p className="text-slate-400 font-bold text-[10px] uppercase leading-tight">
                No encontramos viajes para {totalPasajeros} {totalPasajeros === 1 ? 'persona' : 'personas'} el {formatearFechaBusqueda(fechaSeleccionada)}.
              </p>
            </div>
          )}
        </div>
      </div>

      {showPasajeros && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black italic uppercase text-slate-800">¿Quiénes viajan?</h3>
              <button onClick={() => setShowPasajeros(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black italic uppercase text-sm text-slate-700 leading-none">Adultos</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Mayores de 12 años</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setPasajeros(p => ({...p, adultos: Math.max(1, p.adultos - 1)}))} className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-400 active:bg-slate-50"><Minus size={16} /></button>
                  <span className="font-black italic text-lg w-4 text-center">{pasajeros.adultos}</span>
                  <button onClick={() => setPasajeros(p => ({...p, adultos: Math.min(4, p.adultos + 1)}))} className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 active:bg-blue-50"><Plus size={16} /></button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black italic uppercase text-sm text-slate-700 leading-none">Niños</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Menores de 12 años</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setPasajeros(p => ({...p, niños: Math.max(0, p.niños - 1)}))} className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-400 active:bg-slate-50"><Minus size={16} /></button>
                  <span className="font-black italic text-lg w-4 text-center">{pasajeros.niños}</span>
                  <button onClick={() => setPasajeros(p => ({...p, niños: Math.min(3, p.niños + 1)}))} className="w-10 h-10 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 active:bg-blue-50"><Plus size={16} /></button>
                </div>
              </div>
            </div>

            <button onClick={() => setShowPasajeros(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-sm mt-10 shadow-lg active:scale-95 transition-all">
              Confirmar {totalPasajeros} {totalPasajeros === 1 ? 'Viajero' : 'Viajeros'}
            </button>
          </div>
        </div>
      )}

      {showCalendar && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-6 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2">
              <h3 className="text-lg font-black italic uppercase text-slate-800">¿Cuándo sales?</h3>
              <button onClick={() => setShowCalendar(false)} className="p-2 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            
            <div className="space-y-2">
              {[...Array(14)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i); 
                
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
