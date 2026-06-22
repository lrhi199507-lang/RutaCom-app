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
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icono: <Check size={18} className="text-emerald-500" />,
      sugerencia: maxVerdeSugerido
    };
  } else if (precioIngresado <= limiteAmarillo) {
    return {
      estado: 'amarillo',
      mensaje: `Precio algo alto. Para verde, usa $${maxVerdeSugerido} o menos.`,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      icono: <AlertTriangle size={18} className="text-amber-500" />,
      sugerencia: maxVerdeSugerido
    };
  } else {
    return {
      estado: 'rojo',
      mensaje: `Precio excesivo. Los pasajeros buscan cerca de $${maxVerdeSugerido}.`,
      color: 'text-red-700 bg-red-50 border-red-200',
      icono: <AlertCircle size={18} className="text-red-500" />,
      sugerencia: maxVerdeSugerido
    };
  }
};

const CarruselFechas = ({ fechaSeleccionada, onSelect, minDate }) => {
  const dias = [];
  
  // Dividimos el string para forzar a JavaScript a usar tu zona horaria local
  const [year, month, day] = minDate.split('-');
  const hoy = new Date(year, month - 1, day); 

  for (let i = 0; i < 15; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d);
  }
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
      {dias.map((d, i) => {
        // Formateamos la fecha manualmente SIN usar toISOString()
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        const strDate = `${d.getFullYear()}-${mes}-${dia}`;
        
        const isSelected = fechaSeleccionada === strDate;
        return (
          <button key={i} type="button" onClick={() => onSelect(strDate)} className={`snap-center shrink-0 w-[70px] py-3 rounded-[22px] border flex flex-col items-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white border-slate-100 text-slate-500'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
            <span className="text-xl font-black italic mt-1">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
};

const ModalHoraCustom = ({ isOpen, onClose, onConfirm, titulo, fechaSeleccionada }) => {
  const [hora, setHora] = useState("06");
  const [minuto, setMinuto] = useState("00");
  const [periodo, setPeriodo] = useState("AM");

  // Validación de hora actual si la fecha elegida es "hoy"
  const horaLocalReal = new Date();
  const esHoy = fechaSeleccionada === `${horaLocalReal.getFullYear()}-${String(horaLocalReal.getMonth() + 1).padStart(2, '0')}-${String(horaLocalReal.getDate()).padStart(2, '0')}`;
  const horaActual24 = horaLocalReal.getHours();

  useEffect(() => {
    // Si abren el modal y es para hoy, forzamos la hora base a la hora siguiente actual
    if (isOpen && esHoy) {
      const horaMinima = horaActual24 + 1; // Le sumamos 1 hora para dar margen
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
      
      // Si es hoy, bloqueamos las horas pasadas (o la actual para dar margen de tiempo)
      const bloqueada = esHoy && hNum <= horaActual24;
      return { valor: h, bloqueada };
    });
  };

  return (
    <div className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-white w-full max-w-sm rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center mb-6 font-black uppercase italic text-lg">{titulo}<button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18} /></button></div>
        
        {esHoy && <p className="text-[10px] text-orange-500 font-bold uppercase mb-4 text-center bg-orange-50 py-2 rounded-xl border border-orange-100">Mostrando solo horas disponibles para hoy</p>}

        <div className="flex items-center justify-center gap-4 bg-slate-50 rounded-[30px] p-6 border mb-6 relative">
          
          <div className="flex flex-col items-center h-40 overflow-y-auto scrollbar-hide snap-y">
            {getHorasPermitidas().map(hObj => (
              <button 
                key={hObj.valor} 
                disabled={hObj.bloqueada}
                onClick={() => setHora(hObj.valor)} 
                className={`snap-center text-3xl font-black transition-all ${hObj.bloqueada ? 'text-slate-200 opacity-30 line-through' : hora === hObj.valor ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
              >
                {hObj.valor}
              </button>
            ))}
          </div>
          
          <span className="text-3xl font-black text-slate-300">:</span>
          
          <div className="flex flex-col items-center h-40 overflow-y-auto scrollbar-hide snap-y">
            {["00","15","30","45"].map(m => (
              <button key={m} onClick={() => setMinuto(m)} className={`snap-center text-3xl font-black ${minuto === m ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>{m}</button>
            ))}
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <button disabled={esHoy && horaActual24 >= 12} onClick={() => setPeriodo("AM")} className={`py-3 px-4 rounded-2xl font-black text-sm transition-all ${periodo === "AM" ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'} ${esHoy && horaActual24 >= 12 ? 'opacity-30 line-through' : ''}`}>AM</button>
            <button onClick={() => setPeriodo("PM")} className={`py-3 px-4 rounded-2xl font-black text-sm transition-all ${periodo === "PM" ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>PM</button>
          </div>

        </div>
        <button onClick={handleConfirm} className="w-full bg-slate-900 text-white rounded-full p-4 font-black uppercase text-xs active:scale-95 transition-all">Confirmar Hora</button>
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
  }

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
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordsTemporales.lat}&lon=${coordsTemporales.lon}&zoom=18`);
    
    if (!response.ok) throw new Error("Error en la API de Nominatim");
    
    const data = await response.json();
    
    // --- NUEVA LÓGICA DE DETALLE ---
    let txt = "Ubicación Seleccionada";
    if (data.address) {
      // Extraemos todo el detalle posible
      const lugar = data.name || "";
      const calle = data.address.road || data.address.pedestrian || "";
      const sector = data.address.neighbourhood || data.address.suburb || data.address.residential || "";
      const ciudad = data.address.city || data.address.town || data.address.village || "";
      
      // Filtramos los que vengan vacíos y unimos con comas
      const partes = [lugar, calle, sector, ciudad].filter(Boolean);
      
      // Usamos Set para eliminar duplicados (por si 'lugar' y 'calle' se llaman igual)
      txt = [...new Set(partes)].join(", ");
    } else if (data.display_name) {
      // Plan B: Cortar la dirección larga cruda a solo 3 fragmentos
      txt = data.display_name.split(',').slice(0, 3).join(', ');
    }
    
    if (tipoMapa === 'origen') setViajeForm({...viajeForm, origen: txt, coordsOrigen: coordsTemporales});
    else setViajeForm({...viajeForm, destino: txt, coordsDestino: coordsTemporales});
    
    setShowMapaModal(false);
  } catch (error) {
    alert("No se pudo traducir la dirección, pero la ubicación fue guardada.");
    const txtEmergencia = "Punto marcado en el mapa";
    if (tipoMapa === 'origen') setViajeForm({...viajeForm, origen: txtEmergencia, coordsOrigen: coordsTemporales});
    else setViajeForm({...viajeForm, destino: txtEmergencia, coordsDestino: coordsTemporales});
    
    setShowMapaModal(false);
  } finally { 
    setBuscandoDireccion(false); 
  }
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
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border-4 border-blue-100"><Car size={45} /></div>
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Falta registrar<br/>tu vehículo</h2>
        <button onClick={() => setVista("perfil")} className="w-full bg-blue-600 text-white p-5 rounded-full font-black uppercase text-xs shadow-lg">Ir a Mi Perfil</button>
      </div>
    );
  }

  // PASOS (RENDERIZADO)
  if (pasoWizard === 1) {
    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right relative max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none mb-6">{viajeAEditar ? "Edita tu Ruta" : "¿Hacia dónde vas?"}</h2>
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-200" />
          <div className="relative">
            <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-100 border-4 border-blue-600 rounded-full z-10" />
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-blue-400 transition-colors">
              <input type="text" placeholder="Ciudad de salida" className="bg-transparent w-full text-sm font-bold outline-none" value={viajeForm.origen || ""} onChange={(e) => manejarBusqueda(e.target.value, 'origen')} />
              {viajeForm.origen && <X size={16} className="text-slate-300 cursor-pointer" onClick={() => setViajeForm({...viajeForm, origen: "", coordsOrigen: null})} />}
              <button onClick={() => { setTipoMapa('origen'); setCoordsTemporales(viajeForm.coordsOrigen || {lat: 10.16, lon: -67.95}); setShowMapaModal(true); }} className="text-slate-400"><Map size={18} /></button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-4 h-4 bg-green-100 border-4 border-green-500 rounded-full z-10" />
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-green-400 transition-colors">
              <input type="text" placeholder="Ciudad de llegada" className="bg-transparent w-full text-sm font-bold outline-none" value={viajeForm.destino || ""} onChange={(e) => manejarBusqueda(e.target.value, 'destino')} />
              {viajeForm.destino && <X size={16} className="text-slate-300 cursor-pointer" onClick={() => setViajeForm({...viajeForm, destino: "", coordsDestino: null})} />}
              <button onClick={() => { setTipoMapa('destino'); setCoordsTemporales(viajeForm.coordsDestino || {lat: 10.16, lon: -67.95}); setShowMapaModal(true); }} className="text-slate-400"><Map size={18} /></button>
            </div>
          </div>
          {sugerencias.length > 0 && (
            <div className="absolute z-[110] w-[calc(100%-1.5rem)] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden mt-1 top-full">
              {sugerencias.map((s, i) => (
                <button key={i} type="button" onClick={() => seleccionarSugerencia(s)} className="w-full text-left p-4 hover:bg-slate-50 border-b last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <div className="truncate"><p className="text-slate-700 truncate">{s.ciudad}</p><p className="text-[9px] font-bold text-slate-400 truncate">{s.estado}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>
        {(viajeForm.coordsOrigen || viajeForm.coordsDestino) && (
          <div className="pt-2 animate-in fade-in zoom-in"><div className="rounded-[25px] overflow-hidden border border-slate-100 h-48 relative"><MapaView origen={viajeForm.coordsOrigen} destino={viajeForm.coordsDestino} /></div></div>
        )}
        <div className="flex gap-3 pt-6">
          <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase text-[9px]">Cancelar</button>
          <button onClick={() => setPasoWizard(2)} disabled={!viajeForm.origen || !viajeForm.destino} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] shadow-lg disabled:opacity-50 transition-all">Siguiente</button>
        </div>
        {showMapaModal && (
          <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-in slide-in-from-bottom">
             <div className="p-4 flex items-center justify-between shadow-sm z-10 font-black uppercase italic text-sm">Ubica el Pin<button onClick={() => setShowMapaModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18} /></button></div>
             <div className="flex-1 relative"><MapaView origen={tipoMapa === 'origen' ? coordsTemporales : null} destino={tipoMapa === 'destino' ? coordsTemporales : null} onMarkerDragEnd={setCoordsTemporales} interactivo={true} /></div>
             <div className="p-6 bg-white z-10"><button onClick={confirmarUbicacionMapa} disabled={buscandoDireccion} className="w-full bg-blue-600 text-white rounded-full p-4 font-black uppercase text-xs disabled:opacity-50 shadow-lg">Confirmar Ubicación</button></div>
          </div>
        )}
      </div>
    );
  }

// PASO 2: DETALLES 
  if (pasoWizard === 2) {
    if (!viajeForm.fecha) setViajeForm({...viajeForm, fecha: hoy});
    const distancia = calcularDistanciaKm(viajeForm.coordsOrigen, viajeForm.coordsDestino);
    const resultadoPrecio = calcularRangoPrecio(distancia, Number(viajeForm.precio));

    // --- NUEVO: CÁLCULO DE COMISIÓN ---
    const precioOriginal = Number(viajeForm.precio) || 0;
    const comision = precioOriginal * 0.10;
    const gananciaNeta = precioOriginal - comision;
    
  return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Detalles del Viaje</h2>
        <div className="space-y-3">
          <CarruselFechas fechaSeleccionada={viajeForm.fecha} onSelect={(date) => setViajeForm({...viajeForm, fecha: date})} minDate={hoy} />
          <button onClick={() => setShowTimeModalIda(true)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[25px] flex items-center justify-between active:scale-95 transition-all">
             <div className="flex items-center gap-3"><Clock className="text-blue-600" size={20} /><span className={`text-xl font-black italic ${viajeForm.hora ? 'text-slate-800' : 'text-slate-300'}`}>{formatearHoraAmPm(viajeForm.hora)}</span></div>
             <div className="bg-white px-3 py-1.5 rounded-full border text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cambiar</div>
          </button>
        </div>
                <div className="bg-slate-50 p-5 rounded-[30px] border border-slate-100">
           <div className="flex gap-4">
             <div className="flex-[2]"><p className="text-[8px] font-black uppercase text-slate-400 mb-2">💰 Precio $</p><input type="number" placeholder="0.00" className="bg-white w-full p-4 rounded-2xl border-2 text-2xl font-black italic outline-none text-blue-600 focus:border-blue-400 border-slate-100 transition-colors" value={viajeForm.precio || ""} onChange={(e) => setViajeForm({...viajeForm, precio: e.target.value})} /></div>
             <div className="flex-1"><p className="text-[8px] font-black uppercase text-slate-400 mb-2">🪑 Asientos</p><input type="number" placeholder="1-4" className="bg-white w-full p-4 rounded-2xl border-2 text-2xl font-black italic outline-none text-slate-700 border-slate-100" value={viajeForm.asientos || ""} onChange={(e) => setViajeForm({...viajeForm, asientos: e.target.value})} /></div>
           </div>

           {/* --- NUEVO: DESGLOSE DE COMISIÓN --- */}
           {precioOriginal > 0 && (
             <div className="mt-4 p-4 bg-white rounded-[20px] border border-slate-100 flex flex-col gap-1.5 shadow-sm animate-in zoom-in-95">
               <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                 <span>El pasajero paga:</span>
                 <span>${precioOriginal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] font-bold text-red-500">
                 <span>Tarifa de servicio (10%):</span>
                 <span>-${comision.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-black text-emerald-600 mt-2 pt-2 border-t border-slate-50">
                 <span>Tu ganancia neta:</span>
                 <span>${gananciaNeta.toFixed(2)}</span>
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
              <button key={p.id} onClick={() => setViajeForm({...viajeForm, preferencias: {...viajeForm.preferencias, [p.id]: !viajeForm.preferencias?.[p.id]}})} className={`p-3 rounded-[20px] border-2 flex flex-col items-center transition-all ${viajeForm.preferencias?.[p.id] ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 bg-white text-slate-400'}`}>
                <span className="text-xl">{p.i}</span><span className="text-[8px] font-black uppercase mt-1">{p.l}</span>
              </button>
            ))}
        </div>
        <button onClick={() => setViajeForm({...viajeForm, publicarRegreso: !viajeForm.publicarRegreso, fechaRegreso: !viajeForm.publicarRegreso ? viajeForm.fecha : null})} className={`w-full p-5 rounded-[25px] border-2 flex items-center justify-between transition-all ${viajeForm.publicarRegreso ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
          <span className={`text-[11px] font-black uppercase italic ${viajeForm.publicarRegreso ? 'text-emerald-700' : 'text-slate-600'}`}>¿Publicar viaje de regreso?</span>
          <div className={`w-12 h-6 rounded-full relative transition-colors ${viajeForm.publicarRegreso ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${viajeForm.publicarRegreso ? 'left-7' : 'left-1'}`} /></div>
        </button>
        {viajeForm.publicarRegreso && (
          <div className="space-y-3 animate-in slide-in-from-top"><p className="text-[9px] font-black uppercase text-slate-400">Fecha de Retorno</p><CarruselFechas fechaSeleccionada={viajeForm.fechaRegreso} onSelect={(d) => setViajeForm({...viajeForm, fechaRegreso: d})} minDate={viajeForm.fecha || hoy} />
           <button onClick={() => setShowTimeModalRegreso(true)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[25px] flex items-center justify-between active:scale-95 transition-all mt-2">
             <div className="flex items-center gap-3"><Clock className="text-emerald-500" size={20} /><span className={`text-xl font-black italic ${viajeForm.horaRegreso ? 'text-slate-800' : 'text-slate-300'}`}>{formatearHoraAmPm(viajeForm.horaRegreso)}</span></div>
             <div className="bg-white px-3 py-1.5 rounded-full border text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cambiar</div>
          </button>
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => setPasoWizard(1)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase text-[9px] transition-all active:scale-95"> Atrás </button>
          <button onClick={() => setPasoWizard(3)} disabled={!viajeForm.precio || !viajeForm.hora || !viajeForm.asientos} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] shadow-lg disabled:opacity-50 transition-all">Siguiente</button>    
        </div>
       <ModalHoraCustom isOpen={showTimeModalIda} onClose={() => setShowTimeModalIda(false)} onConfirm={(h) => setViajeForm({...viajeForm, hora: h})} titulo="Hora de Salida" fechaSeleccionada={viajeForm.fecha} />
        <ModalHoraCustom isOpen={showTimeModalRegreso} onClose={() => setShowTimeModalRegreso(false)} onConfirm={(h) => setViajeForm({...viajeForm, horaRegreso: h})} titulo="Hora de Retorno" fechaSeleccionada={viajeForm.fechaRegreso} />
      </div>
    );
  }

  // PASO 3: AJUSTES FINALES Y PUBLICACIÓN 
  if (pasoWizard === 3) {
    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none mb-6">Ajustes Finales</h2>
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Punto de encuentro</p>
          <textarea rows={2} placeholder="Ej: Frente al Farmatodo..." className="bg-slate-50 w-full p-4 rounded-[25px] border border-slate-100 text-[11px] font-bold outline-none resize-none focus:border-blue-400 transition-colors" value={viajeForm.referencia} onChange={(e) => setViajeForm({...viajeForm, referencia: e.target.value})} />
        </div>
        <div className="grid grid-cols-3 gap-2">
            {[ {id:'ligero', i:'🎒'}, {id:'medio', i:'🧳'}, {id:'pesado', i:'📦'} ].map(eq => (
              <button key={eq.id} onClick={() => setViajeForm({...viajeForm, equipaje: eq.id})} className={`p-3 rounded-[20px] border-2 transition-all ${viajeForm.equipaje === eq.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-white hover:border-slate-100'}`}><span className="text-xl">{eq.i}</span></button>
            ))}
        </div>
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[25px] border border-slate-100">
          <div><p className="text-[10px] font-black text-slate-700 uppercase">Reserva Automática</p><p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aceptar sin preguntar</p></div>
          <button type="button" onClick={() => setViajeForm({...viajeForm, autoAceptar: !viajeForm.autoAceptar})} className={`w-12 h-6 rounded-full relative transition-colors ${viajeForm.autoAceptar ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${viajeForm.autoAceptar ? 'left-7' : 'left-1'}`} /></button>
        </div>

        <div className="pt-4">
          <button 
            disabled={publicando}
            onClick={async () => {
              if (!userData?.id || !userData?.kycVerificado) { setToastMessage("Verifica tu identidad."); setShowToast(true); return; }
              setPublicando(true);
              try {
                const [ciudadOri] = (viajeForm.origen || "").split(',');
                const [ciudadDest] = (viajeForm.destino || "").split(',');
                
                // 🔥 AQUÍ FORZAMOS EL GUARDADO DE LA FOTO CORRECTAMENTE
                const fotoParaGuardar = userData?.fotoPerfil || userData?.foto || "";

                const datosBase = {
                  ...viajeForm, 
                  idCreador: userData.id, 
                  uidConductor: userData.id, 
                  conductor: userData?.nombre || "Usuario",
                  fotoPerfil: fotoParaGuardar, // Foto en la raíz
                  datosConductor: { 
                    nombre: userData?.nombre || "Usuario", 
                    foto: fotoParaGuardar, // Foto dentro del objeto conductor
                    rating: ratingCalculado, 
                    viajesRealizados: Number(userData?.viajesRealizados) || 0, 
                    bio: userData?.bio || "" 
                  },
                  vehiculo: userData?.vehiculo, 
                  cO: ciudadOri || "S/N", 
                  cD: ciudadDest || "S/N", 
                  coordsOrigen: viajeForm.coordsOrigen, 
                  coordsDestino: viajeForm.coordsDestino,
                  estado: "disponible", 
                  timestamp: Date.now(), 
                  pasajeros: [], 
                  reservasPendientes: [], 
                  precio: Number(viajeForm.precio) || 0,
                  asientos: Number(viajeForm.asientos) || 1
                };

                if (viajeForm.publicarRegreso) {
                   const objetoIda = { ...datosBase, conRetornoProgramado: true, tipoRuta: "ida_y_vuelta" };
                   await publicarRuta(objetoIda, true);
                   await publicarRuta({
                    ...objetoIda, origen: viajeForm.destino, destino: viajeForm.origen, cO: ciudadDest, cD: ciudadOri,
                    coordsOrigen: viajeForm.coordsDestino, coordsDestino: viajeForm.coordsOrigen,
                    fecha: viajeForm.fechaRegreso, hora: viajeForm.horaRegreso || viajeForm.hora, tipoRuta: "vuelta_de_ruta", conRetornoProgramado: false
                   }, true);
                } else {
                  await publicarRuta({ ...datosBase, conRetornoProgramado: false, tipoRuta: "solo_ida" }, true);
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
            className={`w-full p-5 rounded-[25px] font-black uppercase tracking-[2px] transition-all duration-75 ${publicando ? 'bg-slate-300' : 'bg-blue-600 text-white shadow-[0_8px_0_#1e40af] active:shadow-none active:translate-y-2'}`}
          >
            <div className="flex items-center justify-center gap-3">
              {publicando ? 'PROCESANDO...' : (viajeAEditar ? "GUARDAR CAMBIOS" : "¡PUBLICAR AHORA!")}
            </div>
          </button>
        </div>
        
        <button type="button" onClick={() => setPasoWizard(2)} className="w-full text-slate-400 font-black italic uppercase tracking-widest text-xs py-4 rounded-[25px] transition-all active:scale-95 bg-slate-50 border border-slate-200 mt-2 flex items-center justify-center"> Atrás </button>
        

        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </div>
    );
  } 
  return null;
};
