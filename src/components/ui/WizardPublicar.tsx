import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'; 
import { App } from '@capacitor/app';
import { 
  MapPin, Navigation, ShieldCheck, X, Map, Clock, Car, 
  Check, AlertTriangle, AlertCircle 
} from 'lucide-react'; 
import Toast from './Toast'; 
import MapaView from '../Map/MapaView'; 

// --- FUNCIÓN MATEMÁTICA PARA DISTANCIA ---
const calcularDistanciaKm = (origen, destino) => {
  if (!origen || !destino) return 0;
  const R = 6371; 
  const dLat = (destino.lat - origen.lat) * Math.PI / 180;
  const dLon = (destino.lon - origen.lon) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(origen.lat * Math.PI / 180) * Math.cos(destino.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1.2; 
};

// --- FUNCIÓN DEL TERMÓMETRO DE PRECIOS ---
const calcularRangoPrecio = (distanciaKm, precioIngresado) => {
  if (distanciaKm <= 0 || !precioIngresado) return null;
  const precioBase = Math.max(1.5, distanciaKm * 0.11); 
  const limiteVerde = precioBase * 1.15; 
  const limiteAmarillo = precioBase * 1.45;
  const maxVerdeSugerido = Math.floor(limiteVerde);

  if (precioIngresado <= limiteVerde) {
    return {
      estado: 'verde',
      mensaje: `¡Precio excelente! El ideal es hasta $${maxVerdeSugerido}.`,
      color: 'text-[#1F2937] bg-[#10B981]/10 border-[#10B981]/30',
      icono: <Check size={18} className="text-[#10B981]" />,
      sugerencia: maxVerdeSugerido
    };
  } else if (precioIngresado <= limiteAmarillo) {
    return {
      estado: 'amarillo',
      mensaje: `Precio algo alto. Para verde, usa $${maxVerdeSugerido} o menos.`,
      color: 'text-amber-900 bg-amber-50 border-amber-200',
      icono: <AlertTriangle size={18} className="text-amber-500" />,
      sugerencia: maxVerdeSugerido
    };
  } else {
    return {
      estado: 'rojo',
      mensaje: `Precio excesivo. Los pasajeros buscan cerca de $${maxVerdeSugerido}.`,
      color: 'text-red-900 bg-red-50 border-red-200',
      icono: <AlertCircle size={18} className="text-red-500" />,
      sugerencia: maxVerdeSugerido
    };
  }
};

const CarruselFechas = ({ fechaSeleccionada, onSelect, minDate }) => {
  const [showCalendarPublicar, setShowCalendarPublicar] = useState(false);
  const [mesSeleccionadoIndex, setMesSeleccionadoIndex] = useState(0);

  const mesesDisponibles = [...Array(12)].map((_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    return {
      numeroMes: d.getMonth(),
      anio: d.getFullYear(),
      nombre: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    };
  });

  const mesElegido = mesesDisponibles[mesSeleccionadoIndex] || mesesDisponibles[0];
  const primerDiaMes = new Date(mesElegido.anio, mesElegido.numeroMes, 1);
  const ultimoDiaMes = new Date(mesElegido.anio, mesElegido.numeroMes + 1, 0);
  
  const diasDelMes = [];
  let diaInicio = new Date(primerDiaMes);
  
  const [yearMin, monthMin, dayMin] = minDate.split('-');
  const hoyMin = new Date(yearMin, monthMin - 1, dayMin);
  hoyMin.setHours(0, 0, 0, 0);

  if (mesElegido.numeroMes === hoyMin.getMonth() && mesElegido.anio === hoyMin.getFullYear()) {
    diaInicio = new Date(hoyMin);
  }

  while (diaInicio <= ultimoDiaMes) {
    diasDelMes.push(new Date(diaInicio));
    diaInicio.setDate(diaInicio.getDate() + 1);
  }

  const diasCarrusel = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoyMin);
    d.setDate(hoyMin.getDate() + i);
    diasCarrusel.push(d);
  }

  const formatearAString = (d) => {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  };

  const formatearFechaLegible = (strDate) => {
    if (!strDate) return "";
    const [y, m, d] = strDate.split('-');
    const fechaObj = new Date(y, m - 1, d);
    return fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase text-slate-400">Fecha del Viaje</span>
        <button 
          type="button" 
          onClick={() => setShowCalendarPublicar(true)}
          className="text-[10px] font-black text-[#063971] uppercase tracking-wider bg-[#063971]/5 px-3 py-1 rounded-full border border-[#063971]/10 hover:bg-[#063971]/10 transition-colors"
        >
          📅 Ver Calendario Completo
        </button>
      </div>

      {fechaSeleccionada && (
        <div className="bg-[#063971]/5 border border-[#063971]/20 px-4 py-2.5 rounded-2xl flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase">Fecha Activa:</span>
          <span className="text-xs font-black italic uppercase text-[#063971]">
            {formatearFechaLegible(fechaSeleccionada)}
          </span>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {diasCarrusel.map((d, i) => {
          const strDate = formatearAString(d);
          const isSelected = fechaSeleccionada === strDate;
          return (
            <button 
              key={i} 
              type="button" 
              onClick={() => onSelect(strDate)} 
              className={`snap-center shrink-0 w-[70px] py-3 rounded-[22px] border flex flex-col items-center transition-all ${isSelected ? 'bg-[#063971] border-[#063971] text-white shadow-lg shadow-[#063971]/30' : 'bg-white border-slate-100 text-[#1F2937]'}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short' })}
              </span>
              <span className="text-xl font-black italic mt-1">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {showCalendarPublicar && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-[#1F2937]/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[35px] sm:rounded-[35px] flex flex-col shadow-2xl overflow-hidden h-[85vh] max-h-[650px] relative">
            <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between shrink-0 z-20">
              <h3 className="text-base font-black italic uppercase text-[#1F2937] tracking-tight">
                ¿Cuándo viajas?
              </h3>
              <button 
                type="button"
                onClick={() => setShowCalendarPublicar(false)} 
                className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-100 shrink-0 overflow-x-auto flex gap-2">
              {mesesDisponibles.map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMesSeleccionadoIndex(idx)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shrink-0 transition-all border ${
                    mesSeleccionadoIndex === idx
                      ? 'bg-[#063971] text-white border-[#063971] shadow-md shadow-[#063971]/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.nombre}
                </button>
              ))}
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto space-y-2.5">
              {diasDelMes.map((d, i) => {
                const strDate = formatearAString(d);
                const esSeleccionado = fechaSeleccionada === strDate;
                const esHoy = formatearAString(new Date()) === strDate;

                return (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => { onSelect(strDate); setShowCalendarPublicar(false); }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${
                      esSeleccionado 
                      ? 'bg-[#063971] border-[#063971] text-white shadow-lg shadow-[#063971]/20' 
                      : 'bg-slate-50 border-slate-100 text-[#1F2937] hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-[10px] font-black uppercase tracking-wider ${esSeleccionado ? 'text-white/80' : 'text-slate-400'}`}>
                        {esHoy ? 'Hoy' : d.toLocaleDateString('es-ES', { weekday: 'long' })}
                      </p>
                      <p className="text-sm font-black italic uppercase mt-0.5">
                        {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`font-black text-lg ${esSeleccionado ? 'text-white' : 'text-[#063971]'}`}>→</span>
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
            
const ModalHoraCustom = ({ isOpen, onClose, onConfirm, titulo, fechaSeleccionada }) => {
  const [hora, setHora] = useState("06");
  const [minuto, setMinuto] = useState("00");
  const [periodo, setPeriodo] = useState("AM");

  const horaLocalReal = new Date();
  const esHoy = fechaSeleccionada === `${horaLocalReal.getFullYear()}-${String(horaLocalReal.getMonth() + 1).padStart(2, '0')}-${String(horaLocalReal.getDate()).padStart(2, '0')}`;
  const horaActual24 = horaLocalReal.getHours();

  useEffect(() => {
    if (isOpen && esHoy) {
      const horaMinima = horaActual24 + 1;
      if (horaMinima < 24) {
        let hFormat = horaMinima % 12 || 12;
        setHora(String(hFormat).padStart(2, '0'));
        setPeriodo(horaMinima >= 12 ? 'PM' : 'AM');
      }
    }
  }, [isOpen, esHoy]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let h24 = parseInt(hora);
    if (periodo === "PM" && h24 < 12) h24 += 12;
    if (periodo === "AM" && h24 === 12) h24 = 0;
    onConfirm(`${String(h24).padStart(2, '0')}:${minuto}`);
    onClose();
  };

  const getHorasPermitidas = () => {
    const horasBoton = ["01","02","03","04","05","06","07","08","09","10","11","12"];
    return horasBoton.map(h => {
      let hNum = parseInt(h);
      if (periodo === "PM" && hNum < 12) hNum += 12;
      if (periodo === "AM" && hNum === 12) hNum = 0;
      const bloqueada = esHoy && hNum <= horaActual24;
      return { valor: h, bloqueada };
    });
  };

  return (
    <div className="fixed inset-0 z-[400] bg-[#1F2937]/60 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-white w-full max-w-sm rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-6 font-black uppercase italic text-lg text-[#1F2937]">{titulo}<button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={18} /></button></div>
        
        {esHoy && <p className="text-[10px] text-orange-600 font-bold uppercase mb-4 text-center bg-orange-50 py-2 rounded-xl border border-orange-100">Mostrando solo horas disponibles para hoy</p>}

        <div className="flex items-center justify-center gap-4 bg-slate-50 rounded-[30px] p-6 border mb-6 relative">
          <div className="flex flex-col items-center h-40 overflow-y-auto scrollbar-hide snap-y">
            {getHorasPermitidas().map(hObj => (
              <button 
                key={hObj.valor} 
                disabled={hObj.bloqueada}
                onClick={() => setHora(hObj.valor)} 
                className={`snap-center text-3xl font-black transition-all ${hObj.bloqueada ? 'text-slate-200 opacity-30 line-through' : hora === hObj.valor ? 'text-[#063971] scale-110' : 'text-slate-400'}`}
              >
                {hObj.valor}
              </button>
            ))}
          </div>
          
          <span className="text-3xl font-black text-slate-300">:</span>
          
          <div className="flex flex-col items-center h-40 overflow-y-auto scrollbar-hide snap-y">
            {["00","15","30","45"].map(m => (
              <button key={m} onClick={() => setMinuto(m)} className={`snap-center text-3xl font-black transition-all ${minuto === m ? 'text-[#063971] scale-110' : 'text-slate-400'}`}>{m}</button>
            ))}
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <button disabled={esHoy && horaActual24 >= 12} onClick={() => setPeriodo("AM")} className={`py-3 px-4 rounded-2xl font-black text-sm transition-all ${periodo === "AM" ? 'bg-[#063971] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'} ${esHoy && horaActual24 >= 12 ? 'opacity-30 line-through' : ''}`}>AM</button>
            <button onClick={() => setPeriodo("PM")} className={`py-3 px-4 rounded-2xl font-black text-sm transition-all ${periodo === "PM" ? 'bg-[#063971] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>PM</button>
          </div>
        </div>
        <button onClick={handleConfirm} className="w-full bg-[#063971] text-white rounded-full p-4 font-black uppercase text-xs active:scale-95 transition-all shadow-lg">Confirmar Hora</button>
      </div>
    </div>
  );
};

export const WizardPublicar = ({ 
  pasoWizard, setPasoWizard, viajeForm, setViajeForm, UBICACIONES, setVista, setModo, publicarRuta,
  viajeAEditar, userData 
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fechaLocal = new Date();
  const mesLocal = String(fechaLocal.getMonth() + 1).padStart(2, '0');
  const diaLocal = String(fechaLocal.getDate()).padStart(2, '0');
  const hoy = `${fechaLocal.getFullYear()}-${mesLocal}-${diaLocal}`;
  
  const [sugerencias, setSugerencias] = useState([]);
  const [campoActivo, setCampoActivo] = useState(null);
  const [showMapaModal, setShowMapaModal] = useState(false);
  const [tipoMapa, setTipoMapa] = useState(null); 
  const [coordsTemporales, setCoordsTemporales] = useState(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [showTimeModalIda, setShowTimeModalIda] = useState(false);
  const [showTimeModalRegreso, setShowTimeModalRegreso] = useState(false);
  const [ratingCalculado, setRatingCalculado] = useState("0.0");
  const [publicando, setPublicando] = useState(false);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  useEffect(() => {
    if (!userData?.id) return;
    const qResenas = query(collection(db, "Resenas"), where("idConductor", "==", userData.id));
    getDocs(qResenas).then(snap => {
      let suma = 0, total = 0;
      snap.forEach(d => { suma += d.data().estrellas || 0; total++; });
      setRatingCalculado(total > 0 ? (suma / total).toFixed(1) : "0.0");
    });
  }, [userData?.id]);

  useEffect(() => {
    if (window.google && window.google.maps) return;
    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCUNgw1YBOVZKYAhTgcW00G1c09alI2kMs&libraries=places";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);
  
  const inicializarGooglePlaces = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      if (!autocompleteService.current) autocompleteService.current = new window.google.maps.places.AutocompleteService();
      if (!placesService.current) placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      return true;
    }
    return false;
  };

  const manejarBusqueda = (texto, tipo) => {
    if (tipo === 'origen') setViajeForm(prev => ({...prev, origen: texto}));
    else setViajeForm(prev => ({...prev, destino: texto}));
    if (texto.length > 2) {
      if (!inicializarGooglePlaces()) return;
      setCampoActivo(tipo);
      autocompleteService.current.getPlacePredictions({ input: texto, componentRestrictions: { country: 've' } }, (predictions) => {
        if (predictions) setSugerencias(predictions.map(p => ({ place_id: p.place_id, ciudad: p.structured_formatting.main_text, estado: p.structured_formatting.secondary_text })));
        else setSugerencias([]);
      });
    } else setSugerencias([]);
  };

  const seleccionarSugerencia = (sugerencia) => {
    if (!inicializarGooglePlaces()) return;
    placesService.current.getDetails({ placeId: sugerencia.place_id, fields: ['geometry'] }, (place) => {
      if (place.geometry) {
        const coords = { lat: place.geometry.location.lat(), lon: place.geometry.location.lng() };
        if (campoActivo === 'origen') setViajeForm({...viajeForm, origen: sugerencia.ciudad, coordsOrigen: coords});
        else setViajeForm({...viajeForm, destino: sugerencia.ciudad, coordsDestino: coords});
        setSugerencias([]);
      }
    });
  };

  const confirmarUbicacionMapa = async () => {
  if (!coordsTemporales) return;
  setBuscandoDireccion(true);

  const aplicarTexto = (textoFinal) => {
    if (tipoMapa === 'origen') {
      setViajeForm(prev => ({ ...prev, origen: textoFinal, coordsOrigen: coordsTemporales }));
    } else {
      setViajeForm(prev => ({ ...prev, destino: textoFinal, coordsDestino: coordsTemporales }));
    }
    setShowMapaModal(false);
    setBuscandoDireccion(false);
  };

  if (window.google && window.google.maps && window.google.maps.Geocoder) {
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat: Number(coordsTemporales.lat), lng: Number(coordsTemporales.lon) };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const comps = results[0].address_components || [];
        const getComp = (tipos) => {
          const item = comps.find(c => tipos.some(t => c.types.includes(t)));
          return item ? item.long_name.trim() : "";
        };

        const calle = getComp(['route']);
        const sector = getComp([
          'neighborhood',
          'sublocality_level_1',
          'sublocality_level_2',
          'sublocality',
          'political'
        ]);
        const municipio = getComp(['locality', 'administrative_area_level_2']);

        // Si no hay calle/sector en components, sacar segmentos útiles de formatted_address
        let basePartes = [calle, sector, municipio].filter(Boolean);

        if (basePartes.length <= 1 && results[0].formatted_address) {
          const ignorar = ['venezuela', 'carabobo', /^\d+$/];
          const extraidos = results[0].formatted_address
            .split(',')
            .map(p => p.trim())
            .filter(p => p && !ignorar.some(reg => typeof reg === 'string' ? p.toLowerCase() === reg : reg.test(p)));
          if (extraidos.length > basePartes.length) {
            basePartes = extraidos.slice(0, 3);
          }
        }

        // Evitar duplicados (ej. "Los Guayos, Los Guayos")
        const unicos = [];
        for (const p of basePartes) {
          if (!unicos.some(u => u.toLowerCase() === p.toLowerCase())) {
            unicos.push(p);
          }
        }

        if (unicos.length > 0) {
          aplicarTexto(unicos.slice(0, 3).join(", "));
          return;
        }
      }
      respaldoNominatim();
    });
    return;
  }

  async function respaldoNominatim() {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordsTemporales.lat}&lon=${coordsTemporales.lon}&zoom=18`
      );
      if (!response.ok) throw new Error("Error en Nominatim");
      const data = await response.json();

      let txt = "Punto marcado en el mapa";
      if (data.address) {
        const calle = data.address.road || data.address.pedestrian || "";
        const sector = data.address.neighbourhood || data.address.suburb || data.address.residential || "";
        const ciudad = data.address.city || data.address.town || data.address.village || data.address.municipality || "";
        const partes = [...new Set([calle, sector, ciudad].filter(Boolean))];
        if (partes.length > 0) txt = partes.join(", ");
      }
      aplicarTexto(txt);
    } catch (error) {
      aplicarTexto("Punto marcado en el mapa");
    }
  }

  respaldoNominatim();
};
  
  
  const formatearHoraAmPm = (h24) => {
    if (!h24) return "Seleccionar";
    const [h, m] = h24.split(':');
    let horas = parseInt(h);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    return `${horas % 12 || 12}:${m} ${ampm}`;
  };

  const esChoferAutorizado = userData?.vehiculo?.placa && userData.vehiculo.placa !== "S/N" && userData?.fotoFrontalVerificada === true;

  if (!esChoferAutorizado && !viajeAEditar) {
    return (
      <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-6 mt-10 text-center">
        <div className="w-24 h-24 bg-[#063971]/10 text-[#063971] rounded-full flex items-center justify-center mx-auto border-4 border-[#063971]/20"><Car size={45} /></div>
        <h2 className="text-2xl font-black italic uppercase text-[#1F2937] tracking-tighter leading-none">Falta registrar<br/>tu vehículo</h2>
        <button onClick={() => setVista("perfil")} className="w-full bg-[#063971] text-white p-5 rounded-full font-black uppercase text-xs shadow-lg shadow-[#063971]/30">Ir a Mi Perfil</button>
      </div>
    );
  }

    // PASO 1: ORIGEN Y DESTINO
  if (pasoWizard === 1) {
    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right relative max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-[#1F2937] tracking-tighter leading-none mb-6">
          {viajeAEditar ? "Edita tu Ruta" : "¿Hacia dónde vas?"}
        </h2>

        <div className="relative pl-6 space-y-4">
          <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-200" />

                                 {/* SALIDA */}
          <div className="relative">
            <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#063971]/20 border-4 border-[#063971] rounded-full z-10" />
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-[#063971]/50 transition-colors">
              <input
                type="text"
                placeholder="Ciudad de salida"
                className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#1F2937] flex-1 min-w-0 placeholder:text-slate-400"
                value={viajeForm.origen || ""}
                onChange={(e) => manejarBusqueda(e.target.value, 'origen')}
              />
              <div className="flex items-center gap-3 shrink-0">
                {viajeForm.origen && (
                  <X
                    size={16}
                    className="text-slate-400 cursor-pointer active:scale-90 shrink-0"
                    onClick={() => setViajeForm({ ...viajeForm, origen: "", coordsOrigen: null })}
                  />
                )}
                <div className="w-[1px] h-5 bg-slate-200 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setTipoMapa('origen');
                    setCoordsTemporales(viajeForm.coordsOrigen || { lat: 10.1620, lon: -67.9567 });
                    setShowMapaModal(true);
                  }}
                  className="text-[#063971] hover:opacity-80 active:scale-90 transition-all shrink-0 flex items-center justify-center w-6 h-6"
                  title="Seleccionar en el mapa"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* LLEGADA */}
          <div className="relative">
            <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#10B981]/20 border-4 border-[#10B981] rounded-full z-10" />
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-[#10B981]/50 transition-colors">
              <input
                type="text"
                placeholder="Ciudad de llegada"
                className="bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-[#1F2937] flex-1 min-w-0 placeholder:text-slate-400"
                value={viajeForm.destino || ""}
                onChange={(e) => manejarBusqueda(e.target.value, 'destino')}
              />
              <div className="flex items-center gap-3 shrink-0">
                {viajeForm.destino && (
                  <X
                    size={16}
                    className="text-slate-400 cursor-pointer active:scale-90 shrink-0"
                    onClick={() => setViajeForm({ ...viajeForm, destino: "", coordsDestino: null })}
                  />
                )}
                <div className="w-[1px] h-5 bg-slate-200 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setTipoMapa('destino');
                    setCoordsTemporales(viajeForm.coordsDestino || { lat: 10.1620, lon: -67.9567 });
                    setShowMapaModal(true);
                  }}
                  className="text-[#10B981] hover:opacity-80 active:scale-90 transition-all shrink-0 flex items-center justify-center w-6 h-6"
                  title="Seleccionar en el mapa"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          
          {sugerencias.length > 0 && (
            <div className="absolute z-[110] w-[calc(100%-1.5rem)] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden mt-1 top-full">
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => seleccionarSugerencia(s)}
                  className="w-full text-left p-4 hover:bg-slate-50 border-b last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3 transition-colors"
                >
                  <MapPin size={14} className="text-[#063971] shrink-0" />
                  <div className="truncate">
                    <p className="text-[#1F2937] truncate">{s.ciudad}</p>
                    <p className="text-[9px] font-bold text-slate-400 truncate">{s.estado}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {(viajeForm.coordsOrigen || viajeForm.coordsDestino) && (
          <div className="pt-2 animate-in fade-in zoom-in">
            <div className="rounded-[25px] overflow-hidden border border-slate-100 h-48 relative">
              <MapaView origen={viajeForm.coordsOrigen} destino={viajeForm.coordsDestino} />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => { setVista("inicio"); setModo("pasajero"); }}
            className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase text-[9px] hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setPasoWizard(2)}
            disabled={!viajeForm.origen || !viajeForm.destino}
            className="flex-1 bg-[#063971] text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] shadow-lg shadow-[#063971]/20 disabled:opacity-50 transition-all active:scale-95"
          >
            Siguiente
          </button>
        </div>

        {showMapaModal && (
          <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-in slide-in-from-bottom">
            <div className="p-4 flex items-center justify-between shadow-sm z-10 font-black uppercase italic text-sm text-[#1F2937]">
              <span>{tipoMapa === 'origen' ? 'Punto de Salida' : 'Punto de Llegada'}</span>
              <button
                type="button"
                onClick={() => setShowMapaModal(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 relative">
              <MapaView
                origen={tipoMapa === 'origen' ? coordsTemporales : null}
                destino={tipoMapa === 'destino' ? coordsTemporales : null}
                onMarkerDragEnd={setCoordsTemporales}
                interactivo={true}
              />
            </div>
            <div className="p-6 bg-white z-10">
              <button
                type="button"
                onClick={confirmarUbicacionMapa}
                disabled={buscandoDireccion}
                className="w-full bg-[#063971] text-white rounded-full p-4 font-black uppercase text-xs disabled:opacity-50 shadow-lg shadow-[#063971]/30 active:scale-95 transition-transform"
              >
                {buscandoDireccion ? "Buscando dirección..." : "Confirmar Ubicación"}
              </button>
            </div>
          </div>
        )}

        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </div>
    );
  }
  
  // PASO 2: DETALLES 
  if (pasoWizard === 2) {
    if (!viajeForm.fecha) setViajeForm({...viajeForm, fecha: hoy});
    const distancia = calcularDistanciaKm(viajeForm.coordsOrigen, viajeForm.coordsDestino);
    const resultadoPrecio = calcularRangoPrecio(distancia, Number(viajeForm.precio));

    const precioUnitario = Number(viajeForm.precio) || 0;
    const asientosCount = Number(viajeForm.asientos) || 1;
    
    const precioTotalGlobal = precioUnitario * asientosCount;
    const comisionTotal = precioTotalGlobal * 0.15;
    const gananciaNetaTotal = precioTotalGlobal - comisionTotal;
    
    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-[#1F2937] tracking-tighter leading-none">Detalles del Viaje</h2>
        <div className="space-y-3">
          <CarruselFechas fechaSeleccionada={viajeForm.fecha} onSelect={(date) => setViajeForm({...viajeForm, fecha: date})} minDate={hoy} />
          <button onClick={() => setShowTimeModalIda(true)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[25px] flex items-center justify-between active:scale-95 transition-all">
             <div className="flex items-center gap-3"><Clock className="text-[#063971]" size={20} /><span className={`text-xl font-black italic ${viajeForm.hora ? 'text-[#1F2937]' : 'text-slate-300'}`}>{formatearHoraAmPm(viajeForm.hora)}</span></div>
             <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cambiar</div>
          </button>
        </div>
        <div className="bg-slate-50 p-5 rounded-[30px] border border-slate-100">
           <div className="flex gap-4">
             <div className="flex-[2]"><p className="text-[8px] font-black uppercase text-slate-400 mb-2">💰 Precio $ (Por puesto)</p><input type="number" placeholder="0.00" className="bg-white w-full p-4 rounded-2xl border-2 text-2xl font-black italic outline-none text-[#10B981] focus:border-[#10B981]/50 border-slate-100 transition-colors" value={viajeForm.precio || ""} onChange={(e) => setViajeForm({...viajeForm, precio: e.target.value})} /></div>
             <div className="flex-1"><p className="text-[8px] font-black uppercase text-slate-400 mb-2">🪑 Asientos</p><input type="number" placeholder="1-4" className="bg-white w-full p-4 rounded-2xl border-2 text-2xl font-black italic outline-none text-[#1F2937] border-slate-100 focus:border-[#063971]/30 transition-colors" value={viajeForm.asientos || ""} onChange={(e) => setViajeForm({...viajeForm, asientos: e.target.value})} /></div>
           </div>

           {precioUnitario > 0 && (
             <div className="mt-4 p-4 bg-white rounded-[20px] border border-slate-100 flex flex-col gap-1.5 shadow-sm animate-in zoom-in-95">
               <div className="flex justify-between items-center text-[10px] font-black uppercase text-[#063971] mb-1 border-b border-slate-50 pb-1">
                 <span>Cálculo global ({asientosCount} {asientosCount === 1 ? 'puesto' : 'puestos'}):</span>
               </div>
               <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                 <span>El pasajero paga (Total):</span>
                 <span>${precioTotalGlobal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] font-bold text-red-500">
                 <span>Tarifa de servicio (15%):</span>
                 <span>-${comisionTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-black text-[#10B981] mt-2 pt-2 border-t border-slate-50">
                 <span>Tu ganancia neta total:</span>
                 <span>${gananciaNetaTotal.toFixed(2)}</span>
               </div>
             </div>
           )}

           {resultadoPrecio && (
            <div className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 animate-in zoom-in-95 ${resultadoPrecio.color}`}>
              <div className="mt-0.5 shrink-0">{resultadoPrecio.icono}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1"><p className="text-[10px] font-black uppercase tracking-wider leading-none">Análisis</p><span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/50 border border-current italic tracking-tighter">MAX VERDE: ${resultadoPrecio.sugerencia}</span></div>
                <p className="text-xs font-bold leading-relaxed opacity-90">{resultadoPrecio.mensaje}</p>
              </div>
            </div>
           )}
        </div>

        <div className="grid grid-cols-3 gap-2">
            {[ {id:'ac', i:'❄️', l:'Aire'}, {id:'noFumar', i:'🚭', l:'Sin Humo'}, {id:'mascotas', i:'🐾', l:'Mascotas'} ].map(p => (
              <button key={p.id} onClick={() => setViajeForm({...viajeForm, preferencias: {...viajeForm.preferencias, [p.id]: !viajeForm.preferencias?.[p.id]}})} className={`p-3 rounded-[20px] border-2 flex flex-col items-center transition-all ${viajeForm.preferencias?.[p.id] ? 'border-[#063971] bg-[#063971]/5 text-[#063971]' : 'border-slate-50 bg-white text-slate-400'}`}>
                <span className="text-xl">{p.i}</span><span className="text-[8px] font-black uppercase mt-1">{p.l}</span>
              </button>
            ))}
        </div>
        <button onClick={() => setViajeForm({...viajeForm, publicarRegreso: !viajeForm.publicarRegreso, fechaRegreso: !viajeForm.publicarRegreso ? viajeForm.fecha : null})} className={`w-full p-5 rounded-[25px] border-2 flex items-center justify-between transition-all ${viajeForm.publicarRegreso ? 'border-[#10B981] bg-[#10B981]/10' : 'border-slate-100 bg-white'}`}>
          <span className={`text-[11px] font-black uppercase italic ${viajeForm.publicarRegreso ? 'text-[#10B981]' : 'text-slate-600'}`}>¿Publicar viaje de regreso?</span>
          <div className={`w-12 h-6 rounded-full relative transition-colors ${viajeForm.publicarRegreso ? 'bg-[#10B981]' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${viajeForm.publicarRegreso ? 'left-7' : 'left-1'}`} /></div>
        </button>
        {viajeForm.publicarRegreso && (
          <div className="space-y-3 animate-in slide-in-from-top"><p className="text-[9px] font-black uppercase text-slate-400">Fecha de Retorno</p><CarruselFechas fechaSeleccionada={viajeForm.fechaRegreso} onSelect={(d) => setViajeForm({...viajeForm, fechaRegreso: d})} minDate={viajeForm.fecha || hoy} />
           <button onClick={() => setShowTimeModalRegreso(true)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[25px] flex items-center justify-between active:scale-95 transition-all mt-2">
             <div className="flex items-center gap-3"><Clock className="text-[#10B981]" size={20} /><span className={`text-xl font-black italic ${viajeForm.horaRegreso ? 'text-[#1F2937]' : 'text-slate-300'}`}>{formatearHoraAmPm(viajeForm.horaRegreso)}</span></div>
             <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cambiar</div>
          </button>
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => setPasoWizard(1)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase text-[9px] transition-all active:scale-95 hover:bg-slate-200"> Atrás </button>
          <button 
            onClick={() => {
              if (viajeForm.publicarRegreso && (!viajeForm.fechaRegreso || !viajeForm.horaRegreso)) {
                setToastMessage("Selecciona fecha y hora de retorno.");
                setShowToast(true);
                return;
              }
              setPasoWizard(3);
            }} 
            disabled={!viajeForm.precio || !viajeForm.hora || !viajeForm.asientos} 
            className="flex-1 bg-[#063971] text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] shadow-lg shadow-[#063971]/20 disabled:opacity-50 transition-all active:scale-95"
          >
            Siguiente
          </button>   
        </div>
        <ModalHoraCustom isOpen={showTimeModalIda} onClose={() => setShowTimeModalIda(false)} onConfirm={(h) => setViajeForm({...viajeForm, hora: h})} titulo="Hora de Salida" fechaSeleccionada={viajeForm.fecha} />
        <ModalHoraCustom isOpen={showTimeModalRegreso} onClose={() => setShowTimeModalRegreso(false)} onConfirm={(h) => setViajeForm({...viajeForm, horaRegreso: h})} titulo="Hora de Retorno" fechaSeleccionada={viajeForm.fechaRegreso} />
        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  // PASO 3: AJUSTES FINALES Y PUBLICACIÓN 
  if (pasoWizard === 3) {
    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-[#1F2937] tracking-tighter leading-none mb-6">Ajustes Finales</h2>
        
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-400 ml-2">
            {viajeForm.publicarRegreso ? "Punto de encuentro (Ida)" : "Punto de encuentro"}
          </p>
          <textarea 
            rows={2} 
            placeholder="Ej: Frente al Farmatodo..." 
            className="bg-slate-50 w-full p-4 rounded-[25px] border border-slate-100 text-[11px] font-bold text-[#1F2937] outline-none resize-none focus:border-[#063971]/50 transition-colors" 
            value={viajeForm.referencia || ""} 
            onChange={(e) => setViajeForm({...viajeForm, referencia: e.target.value})} 
          />
        </div>

        {viajeForm.publicarRegreso && (
          <div className="space-y-1 animate-in slide-in-from-top">
            <p className="text-[9px] font-black uppercase text-[#10B981] ml-2">
              Punto de encuentro (Regreso)
            </p>
            <textarea 
              rows={2} 
              placeholder="Ej: Redoma de Guaparo / Centro Comercial..." 
              className="bg-[#10B981]/5 w-full p-4 rounded-[25px] border border-[#10B981]/30 text-[11px] font-bold text-[#1F2937] outline-none resize-none focus:border-[#10B981] transition-colors" 
              value={viajeForm.referenciaRegreso || ""} 
              onChange={(e) => setViajeForm({...viajeForm, referenciaRegreso: e.target.value})} 
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
            {[ {id:'ligero', i:'🎒'}, {id:'medio', i:'🧳'}, {id:'pesado', i:'📦'} ].map(eq => (
              <button key={eq.id} onClick={() => setViajeForm({...viajeForm, equipaje: eq.id})} className={`p-3 rounded-[20px] border-2 transition-all ${viajeForm.equipaje === eq.id ? 'border-[#063971] bg-[#063971]/5' : 'border-slate-50 bg-white hover:border-slate-100'}`}><span className="text-xl">{eq.i}</span></button>
            ))}
        </div>
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[25px] border border-slate-100">
          <div><p className="text-[10px] font-black text-[#1F2937] uppercase">Reserva Automática</p><p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aceptar sin preguntar</p></div>
          <button type="button" onClick={() => setViajeForm({...viajeForm, autoAceptar: !viajeForm.autoAceptar})} className={`w-12 h-6 rounded-full relative transition-colors ${viajeForm.autoAceptar ? 'bg-[#10B981]' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${viajeForm.autoAceptar ? 'left-7' : 'left-1'}`} /></button>
        </div>

        <div className="pt-4">
          <button 
            disabled={publicando}
            onClick={async () => {
              if (!userData?.id || !userData?.kycVerificado) { setToastMessage("Verifica tu identidad."); setShowToast(true); return; }
              
              if (viajeForm.publicarRegreso) {
                const refIda = (viajeForm.referencia || "").trim();
                const refVuelta = (viajeForm.referenciaRegreso || "").trim();

                if (!refVuelta) {
                  setToastMessage("Indica el punto de encuentro de regreso.");
                  setShowToast(true);
                  return;
                }

                if (refIda.toLowerCase() === refVuelta.toLowerCase()) {
                  setToastMessage("El punto de regreso debe ser distinto al de ida.");
                  setShowToast(true);
                  return;
                }
              }

              setPublicando(true);
              try {
                const [ciudadOri] = (viajeForm.origen || "").split(',');
                const [ciudadDest] = (viajeForm.destino || "").split(',');
                
                const fotoParaGuardar = userData?.fotoPerfil || userData?.foto || "";

                const datosBase = {
                  ...viajeForm, 
                  idCreador: userData.id, 
                  uidConductor: userData.id, 
                  conductor: userData?.nombre || "Usuario",
                  fotoPerfil: fotoParaGuardar,
                  datosConductor: { 
                    nombre: userData?.nombre || "Usuario", 
                    foto: fotoParaGuardar, 
                    rating: ratingCalculado, 
                    viajesRealizados: Number(userData?.viajesRealizados) || 0, 
                    bio: userData?.bio || "" 
                  },
                  vehiculo: userData?.vehiculo, 
                  cO: (ciudadOri || "S/N").trim(), 
                  cD: (ciudadDest || "S/N").trim(), 
                  coordsOrigen: viajeForm.coordsOrigen, 
                  coordsDestino: viajeForm.coordsDestino,
                  estado: "disponible", 
                  timestamp: Date.now(), 
                  pasajeros: [], 
                  reservasPendientes: [], 
                  precio: Number(viajeForm.precio) || 0,
                  asientos: Number(viajeForm.asientos) || 1
                };

                const idEnlaceUnico = `enlace_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                if (viajeForm.publicarRegreso) {
                   const objetoIda = { 
                     ...datosBase, 
                     referencia: (viajeForm.referencia || "").trim(),
                     conRetornoProgramado: true, 
                     tipoRuta: "ida_y_vuelta", 
                     idEnlace: idEnlaceUnico 
                   };
                   await publicarRuta(objetoIda, true);

                   const [nuevaCiudadOri] = (viajeForm.destino || "").split(',');
                   const [nuevaCiudadDest] = (viajeForm.origen || "").split(',');
                   
                   await publicarRuta({
                    ...objetoIda, 
                    origen: viajeForm.destino, 
                    destino: viajeForm.origen, 
                    cO: (nuevaCiudadOri || "S/N").trim(), 
                    cD: (nuevaCiudadDest || "S/N").trim(),
                    coordsOrigen: viajeForm.coordsDestino, 
                    coordsDestino: viajeForm.coordsOrigen,
                    fecha: viajeForm.fechaRegreso, 
                    hora: viajeForm.horaRegreso || viajeForm.hora, 
                    referencia: (viajeForm.referenciaRegreso || "").trim(),
                    tipoRuta: "vuelta_de_ruta", 
                    conRetornoProgramado: false, 
                    idEnlace: idEnlaceUnico
                   }, true);
                } else {
                  await publicarRuta({ 
                    ...datosBase, 
                    referencia: (viajeForm.referencia || "").trim(),
                    conRetornoProgramado: false, 
                    tipoRuta: "solo_ida" 
                  }, true);
                }

                setToastMessage("¡Publicado con éxito!"); setShowToast(true);
                setTimeout(() => { setShowToast(false); setVista("inicio"); setPasoWizard(1); setPublicando(false); }, 2000);
              } catch (e) { 
                console.error("Error al publicar:", e);
                setToastMessage("Error: " + e.message); 
                setShowToast(true); 
                setPublicando(false); 
              }
            }}
            className={`w-full p-5 rounded-[25px] font-black uppercase tracking-[2px] transition-all duration-75 ${publicando ? 'bg-slate-300 text-slate-500' : 'bg-[#063971] text-white shadow-[0_8px_0_#031E3F] active:shadow-none active:translate-y-2'}`}
          >
            <div className="flex items-center justify-center gap-3">
              {publicando ? 'PROCESANDO...' : (viajeAEditar ? "GUARDAR CAMBIOS" : "¡PUBLICAR AHORA!")}
            </div>
          </button>
        </div>
        
        <button type="button" onClick={() => setPasoWizard(2)} className="w-full text-slate-400 font-black italic uppercase tracking-widest text-xs py-4 rounded-[25px] transition-all active:scale-95 bg-slate-50 border border-slate-200 mt-2 flex items-center justify-center hover:bg-slate-100"> Atrás </button>
        
        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </div>
    );
  } 
  return null;
};
