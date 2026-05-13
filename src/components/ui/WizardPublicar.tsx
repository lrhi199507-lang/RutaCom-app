import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { MapPin, Navigation, ShieldCheck, X, Map, Clock } from 'lucide-react'; 
import Toast from './Toast'; 
import MapaView from '../Map/MapaView'; 

// --- COMPONENTE AUXILIAR: CARRUSEL DE FECHAS ---
const CarruselFechas = ({ fechaSeleccionada, onSelect, minDate }) => {
  const dias = [];
  const hoy = new Date(minDate + "T00:00:00");
  
  for (let i = 0; i < 15; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    dias.push(d);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
      {dias.map((d, i) => {
        const strDate = d.toISOString().split('T')[0];
        const isSelected = fechaSeleccionada === strDate;
        const nombreDia = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short' });
        const numeroDia = d.getDate();

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(strDate)}
            className={`snap-center shrink-0 w-[70px] py-3 rounded-[20px] border flex flex-col items-center justify-center transition-all ${
              isSelected 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
              {nombreDia}
            </span>
            <span className="text-xl font-black italic mt-1">{numeroDia}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- COMPONENTE AUXILIAR: MODAL DE HORA CUSTOM ---
const ModalHoraCustom = ({ isOpen, onClose, onConfirm, titulo }) => {
  const [hora, setHora] = useState("06");
  const [minuto, setMinuto] = useState("00");
  const [periodo, setPeriodo] = useState("AM");

  if (!isOpen) return null;

  const handleConfirm = () => {
    let h24 = parseInt(hora);
    if (periodo === "PM" && h24 < 12) h24 += 12;
    if (periodo === "AM" && h24 === 12) h24 = 0;
    
    const horaFinal = `${String(h24).padStart(2, '0')}:${minuto}`;
    onConfirm(horaFinal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black italic uppercase text-slate-800">{titulo}</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18} /></button>
        </div>

        <div className="flex items-center justify-center gap-4 bg-slate-50 rounded-[30px] p-6 border border-slate-100 mb-6">
          <div className="flex flex-col items-center gap-2 h-40 overflow-y-auto scrollbar-hide snap-y">
            {["01","02","03","04","05","06","07","08","09","10","11","12"].map(h => (
              <button key={h} onClick={() => setHora(h)} className={`snap-center text-3xl font-black transition-all ${hora === h ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>{h}</button>
            ))}
          </div>
          <span className="text-3xl font-black text-slate-300 mb-2">:</span>
          <div className="flex flex-col items-center gap-2 h-40 overflow-y-auto scrollbar-hide snap-y">
            {["00","15","30","45"].map(m => (
              <button key={m} onClick={() => setMinuto(m)} className={`snap-center text-3xl font-black transition-all ${minuto === m ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>{m}</button>
            ))}
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <button onClick={() => setPeriodo("AM")} className={`py-3 px-4 rounded-2xl font-black text-sm transition-all ${periodo === "AM" ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white text-slate-400 border border-slate-200'}`}>AM</button>
            <button onClick={() => setPeriodo("PM")} className={`py-3 px-4 rounded-2xl font-black text-sm transition-all ${periodo === "PM" ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white text-slate-400 border border-slate-200'}`}>PM</button>
          </div>
        </div>

        <button onClick={handleConfirm} className="w-full bg-slate-900 text-white rounded-full p-4 font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
          Confirmar Hora
        </button>
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
  const hoy = new Date().toISOString().split('T')[0];
  
  const [sugerencias, setSugerencias] = useState([]);
  const [campoActivo, setCampoActivo] = useState(null);

  const [showMapaModal, setShowMapaModal] = useState(false);
  const [tipoMapa, setTipoMapa] = useState(null); 
  const [coordsTemporales, setCoordsTemporales] = useState(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);

  const [showTimeModalIda, setShowTimeModalIda] = useState(false);
  const [showTimeModalRegreso, setShowTimeModalRegreso] = useState(false);

  const [ratingCalculado, setRatingCalculado] = useState("0.0");

  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  // Calcula rating del conductor
  useEffect(() => {
    if (!userData?.id) return;
    const qResenas = query(collection(db, "Resenas"), where("idConductor", "==", userData.id));
    getDocs(qResenas).then(snap => {
      let suma = 0, total = 0;
      snap.forEach(d => { suma += d.data().estrellas || 0; total++; });
      setRatingCalculado(total > 0 ? (suma / total).toFixed(1) : "0.0");
    }).catch(e => console.error("Error rating en wizard:", e));
  }, [userData?.id]);

  // --- NUEVO: INYECTOR AUTOMÁTICO DE GOOGLE MAPS ---
  useEffect(() => {
    if (window.google && window.google.maps) return;

    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCUNgw1YBOVZKYAhTgcW00G1c09alI2kMs&libraries=places";
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("¡Google Maps inyectado con éxito!");
    };
    
    script.onerror = () => {
      setToastMessage("Error crítico: Google bloqueó la descarga del script.");
      setShowToast(true);
    };

    document.head.appendChild(script);
  }, []);
  
  // INICIALIZADOR DINÁMICO DE GOOGLE MAPS
  const inicializarGooglePlaces = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      if (!autocompleteService.current) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!placesService.current) {
        const dummyDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
      }
      return true;
    }
    return false;
  };

  // BÚSQUEDA DINÁMICA CON DETECTOR DE ERRORES EN PANTALLA
  const manejarBusqueda = (texto, tipo) => {
    if (tipo === 'origen') {
        setViajeForm(prev => ({...prev, origen: texto}));
    } else {
        setViajeForm(prev => ({...prev, destino: texto}));
    }

    if (texto.length > 2) {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        setToastMessage("Error: Google Maps no cargó. Revisa tu llave en index.html");
        setShowToast(true);
        return;
      }

      if (!inicializarGooglePlaces()) return;

      setCampoActivo(tipo);
      const request = {
        input: texto,
        componentRestrictions: { country: 've' }, 
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const sugerenciasGoogle = predictions.map(p => ({
            descripcion: p.description,
            place_id: p.place_id,
            ciudad: p.structured_formatting.main_text,
            estado: p.structured_formatting.secondary_text
          }));
          setSugerencias(sugerenciasGoogle);
        } else {
          setToastMessage(`Bloqueo de Google: ${status}`);
          setShowToast(true);
          setSugerencias([]);
        }
      });
    } else {
      setSugerencias([]);
    }
  }

  const seleccionarSugerencia = (sugerencia) => {
    if (!inicializarGooglePlaces()) return;

    placesService.current.getDetails({ placeId: sugerencia.place_id, fields: ['geometry', 'name', 'formatted_address'] }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        const coords = {
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng()
        };
        const nombreMostrar = sugerencia.ciudad; 
        
        if (campoActivo === 'origen') {
          setViajeForm({...viajeForm, origen: nombreMostrar, coordsOrigen: coords});
        } else {
          setViajeForm({...viajeForm, destino: nombreMostrar, coordsDestino: coords});
        }
        setSugerencias([]);
      }
    });
  };

  const confirmarUbicacionMapa = async () => {
    if (!coordsTemporales) return;
    setBuscandoDireccion(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordsTemporales.lat}&lon=${coordsTemporales.lon}&zoom=18`);
      const data = await response.json();
      
      const address = data.address || {};
      const zonaLocal = address.suburb || address.neighbourhood || address.residential || address.road || "";
      const ciudadMunicipio = address.city || address.town || address.village || address.county || data.name || "";
      const estado = address.state || "Venezuela";
      const partes = [zonaLocal, ciudadMunicipio, estado].filter(Boolean);
      const textoCompleto = [...new Set(partes)].join(", ");

      if (tipoMapa === 'origen') {
        setViajeForm({...viajeForm, origen: textoCompleto, coordsOrigen: coordsTemporales});
      } else {
        setViajeForm({...viajeForm, destino: textoCompleto, coordsDestino: coordsTemporales});
      }
      
      setShowMapaModal(false);
      setCoordsTemporales(null);
    } catch (error) {
      console.error("Error al obtener dirección:", error);
      setShowMapaModal(false);
    } finally {
      setBuscandoDireccion(false);
    }
  };

  const formatearHoraAmPm = (hora24) => {
    if (!hora24) return "Seleccionar";
    const [h, m] = hora24.split(':');
    let horas = parseInt(h);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;
    return `${horas}:${m} ${ampm}`;
  };

  // PASO 1: UBICACIONES (🔥 CORREGIDO RESPONSIVE)
  if (pasoWizard === 1) {
    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right relative max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">
          {viajeAEditar ? <>Edita tu<br/>Ruta Actual</> : <>¿Hacia dónde<br/>vas a manejar?</>}
        </h2>
        
        <div className="space-y-4 relative">
          <div className="relative">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-blue-400 focus-within:bg-blue-50/30 transition-colors">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <input type="text" placeholder="Punto de salida" className="bg-transparent w-full text-sm font-bold outline-none text-slate-700 placeholder:text-slate-400" value={viajeForm.origen || ""} onChange={(e) => manejarBusqueda(e.target.value, 'origen')} />
              <div className="flex items-center gap-3 shrink-0">
                {viajeForm.origen && <X size={16} className="text-slate-300 active:scale-90 cursor-pointer" onClick={() => setViajeForm({...viajeForm, origen: "", coordsOrigen: null})} />}
                <div className="w-[1px] h-5 bg-slate-200" />
                <button onClick={() => { setTipoMapa('origen'); setCoordsTemporales(viajeForm.coordsOrigen || {lat: 10.1620, lon: -67.9567}); setShowMapaModal(true); }} className="text-slate-400 hover:text-blue-600 active:scale-90 transition-all"><Map size={18} /></button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-green-400 focus-within:bg-green-50/30 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <input type="text" placeholder="Punto de llegada" className="bg-transparent w-full text-sm font-bold outline-none text-slate-700 placeholder:text-slate-400" value={viajeForm.destino || ""} onChange={(e) => manejarBusqueda(e.target.value, 'destino')} />
              <div className="flex items-center gap-3 shrink-0">
                {viajeForm.destino && <X size={16} className="text-slate-300 active:scale-90 cursor-pointer" onClick={() => setViajeForm({...viajeForm, destino: "", coordsDestino: null})} />}
                <div className="w-[1px] h-5 bg-slate-200" />
                <button onClick={() => { setTipoMapa('destino'); setCoordsTemporales(viajeForm.coordsDestino || {lat: 10.1620, lon: -67.9567}); setShowMapaModal(true); }} className="text-slate-400 hover:text-green-600 active:scale-90 transition-all"><Map size={18} /></button>
              </div>
            </div>
          </div>

          {sugerencias.length > 0 && (
            <div className="absolute z-[110] w-full bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden mt-1 top-[135px]">
              {sugerencias.map((s, i) => (
                <button key={i} type="button" onClick={() => seleccionarSugerencia(s)} 
                  className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-50 last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3 transition-colors"
                >
                  {campoActivo === 'origen' ? <MapPin size={14} className="text-blue-400 shrink-0"/> : <Navigation size={14} className="text-green-400 shrink-0"/>}
                  <div className="truncate">
                    <p className="text-slate-700 truncate">{s.ciudad}</p>
                    <p className="text-[9px] font-bold text-slate-400 truncate">{s.estado}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {(viajeForm.coordsOrigen || viajeForm.coordsDestino) && (
          <div className="pt-2 animate-in fade-in zoom-in duration-300">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 italic">📍 Ruta a publicar:</h3>
            <div className="rounded-[25px] overflow-hidden border border-slate-100 h-56 relative shrink-0">
                <MapaView origen={viajeForm.coordsOrigen} destino={viajeForm.coordsDestino} />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Cancelar</button>
          <button onClick={() => setPasoWizard(2)} disabled={!viajeForm.origen || !viajeForm.destino} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg disabled:opacity-50">Siguiente</button>
        </div>

        {showMapaModal && (
            <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
               <div className="p-4 flex items-center justify-between shadow-sm z-10">
                  <div>
                    <h3 className="font-black uppercase italic text-slate-800 text-sm">Ubica tu {tipoMapa === 'origen' ? 'Punto de Salida' : 'Destino'}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mueve el mapa para ajustar el pin</p>
                  </div>
                  <button onClick={() => setShowMapaModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18} /></button>
               </div>
               <div className="flex-1 relative bg-slate-100">
                  <MapaView origen={tipoMapa === 'origen' ? coordsTemporales : null} destino={tipoMapa === 'destino' ? coordsTemporales : null} onMarkerDragEnd={(coords) => setCoordsTemporales(coords)} interactivo={true} />
               </div>
               <div className="p-6 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-10">
                  <button onClick={confirmarUbicacionMapa} disabled={buscandoDireccion} className="w-full bg-blue-600 text-white rounded-full p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50">
                    {buscandoDireccion ? 'Traduciendo...' : 'Confirmar Ubicación'}
                  </button>
               </div>
            </div>
        )}
        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  // PASO 2: DETALLES (🔥 CORREGIDO RESPONSIVE)
  if (pasoWizard === 2) {
    if (!viajeForm.fecha) setViajeForm({...viajeForm, fecha: hoy});

    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Detalles del<br/>Viaje</h2>
        
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha de Salida</p>
          <CarruselFechas 
            fechaSeleccionada={viajeForm.fecha} 
            onSelect={(date) => setViajeForm({...viajeForm, fecha: date})} 
            minDate={hoy} 
          />
        </div>

        <div className="space-y-3">
           <p className="text-[10px] font-black uppercase text-slate-400 ml-1">Hora de Salida</p>
           <button 
             onClick={() => setShowTimeModalIda(true)}
             className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[25px] flex items-center justify-between active:scale-95 transition-all focus-within:border-blue-400 focus-within:bg-blue-50/30"
           >
             <div className="flex items-center gap-3">
               <Clock className="text-blue-600" size={20} />
               <span className={`text-xl font-black italic ${viajeForm.hora ? 'text-slate-800' : 'text-slate-300'}`}>
                 {formatearHoraAmPm(viajeForm.hora)}
               </span>
             </div>
             <div className="bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm text-[9px] font-bold text-slate-400 uppercase tracking-widest">
               Cambiar
             </div>
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-blue-400 focus-within:bg-blue-50/30 transition-colors">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">💰 Precio $</p>
            <input type="number" placeholder="0.00" className="bg-transparent w-full text-2xl font-black italic outline-none text-blue-600 placeholder:text-slate-300" value={viajeForm.precio || ""} onChange={(e) => setViajeForm({...viajeForm, precio: e.target.value})} />
          </div>
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-blue-400 focus-within:bg-blue-50/30 transition-colors">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">🪑 Asientos Libres</p>
            <input type="number" placeholder="1 a 4" className="bg-transparent w-full text-2xl font-black italic outline-none text-slate-700 placeholder:text-slate-300" value={viajeForm.asientos || ""} onChange={(e) => setViajeForm({...viajeForm, asientos: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">Comodidades</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ac', icon: '❄️', label: 'Aire A.' },
              { id: 'noFumar', icon: '🚭', label: 'Sin Humo' },
              { id: 'mascotas', icon: '🐾', label: 'Mascotas' },
            ].map((pref) => (
              <button 
                key={pref.id}
                type="button"
                onClick={() => setViajeForm({...viajeForm, preferencias: {...viajeForm.preferencias, [pref.id]: !viajeForm.preferencias?.[pref.id]}})}
                className={`p-3 rounded-[20px] border-2 transition-all flex flex-col items-center gap-1 ${viajeForm.preferencias?.[pref.id] ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-100'}`}
              >
                <span className="text-xl">{pref.icon}</span>
                <span className="text-[8px] font-black uppercase text-center tracking-widest mt-1">{pref.label}</span>
              </button>
            ))}
          </div>
        </div>

        {!viajeAEditar && (
          <button 
            type="button"
            onClick={() => {
              const nuevoRegreso = !viajeForm.publicarRegreso;
              setViajeForm({
                ...viajeForm, 
                publicarRegreso: nuevoRegreso,
                fechaRegreso: nuevoRegreso ? viajeForm.fecha : null
              });
            }}
            className={`w-full p-5 rounded-[25px] border-2 transition-all flex items-center justify-between ${viajeForm.publicarRegreso ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}
          >
            <span className={`text-[11px] font-black uppercase italic ${viajeForm.publicarRegreso ? 'text-emerald-700' : 'text-slate-600'}`}>¿Publicar Viaje de Regreso?</span>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${viajeForm.publicarRegreso ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${viajeForm.publicarRegreso ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
        )}

        {viajeForm.publicarRegreso && (
          <div className="p-6 bg-slate-900 rounded-[30px] space-y-6 animate-in slide-in-from-top">
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase text-slate-400">Fecha de Retorno</p>
              <CarruselFechas 
                fechaSeleccionada={viajeForm.fechaRegreso} 
                onSelect={(date) => setViajeForm({...viajeForm, fechaRegreso: date})} 
                minDate={viajeForm.fecha || hoy} 
              />
            </div>

            <div className="space-y-3">
               <p className="text-[9px] font-black uppercase text-slate-400">Hora de Retorno</p>
               <button 
                 onClick={() => setShowTimeModalRegreso(true)}
                 className="w-full bg-slate-800 border border-slate-700 p-4 rounded-[20px] flex items-center justify-between active:scale-95 transition-all"
               >
                 <div className="flex items-center gap-3">
                   <Clock className="text-emerald-400" size={18} />
                   <span className={`text-lg font-black italic ${viajeForm.horaRegreso ? 'text-white' : 'text-slate-500'}`}>
                     {formatearHoraAmPm(viajeForm.horaRegreso)}
                   </span>
                 </div>
                 <div className="bg-slate-700 px-3 py-1.5 rounded-full text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                   Elegir
                 </div>
               </button>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <button onClick={() => setPasoWizard(1)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Atrás</button>
          <button onClick={() => setPasoWizard(3)} disabled={!viajeForm.precio || !viajeForm.hora || !viajeForm.asientos} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg active:scale-95 disabled:opacity-50">Siguiente</button>    
        </div>

        <ModalHoraCustom isOpen={showTimeModalIda} onClose={() => setShowTimeModalIda(false)} onConfirm={(hora) => setViajeForm({...viajeForm, hora})} titulo="Hora de Salida" />
        <ModalHoraCustom isOpen={showTimeModalRegreso} onClose={() => setShowTimeModalRegreso(false)} onConfirm={(hora) => setViajeForm({...viajeForm, horaRegreso: hora})} titulo="Hora de Retorno" />
      </div>
    );
  }

  // PASO 3: AJUSTES FINALES (🔥 CORREGIDO RESPONSIVE)
  if (pasoWizard === 3) {
    return (
      <div className="bg-white p-5 sm:p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right max-h-[85vh] overflow-y-auto pb-24 no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Ajustes Finales</h2>
        
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Punto de encuentro / Referencia</p>
          <textarea rows={2} placeholder="Ej: Frente al Farmatodo de la redoma..." className="bg-slate-50 w-full p-4 rounded-[25px] border border-slate-100 text-[11px] font-bold outline-none resize-none focus:border-blue-400 focus:bg-blue-50/30 transition-colors" value={viajeForm.referencia} onChange={(e) => setViajeForm({...viajeForm, referencia: e.target.value})} />
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Equipaje permitido</p>
          <div className="grid grid-cols-3 gap-2">
            {[{id:'ligero', i:'🎒'}, {id:'medio', i:'🧳'}, {id:'pesado', i:'📦'}].map(eq => (
              <button key={eq.id} type="button" onClick={() => setViajeForm({...viajeForm, equipaje: eq.id})} className={`p-3 rounded-[20px] border-2 transition-all ${viajeForm.equipaje === eq.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-white hover:border-slate-100'}`}>
                <span className="text-xl">{eq.i}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[25px] border border-slate-100">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-700">Reserva Automática</p>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aceptar cola sin preguntar</p>
          </div>
          <button type="button" onClick={() => setViajeForm({...viajeForm, autoAceptar: !viajeForm.autoAceptar})} className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${viajeForm.autoAceptar ? 'bg-green-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${viajeForm.autoAceptar ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <button 
          onClick={async () => {
            if (!userData?.id) {
              setToastMessage("Sesión no detectada. Reinicia la aplicación.");
              setShowToast(true);
              return;
            }

            const estaVerificado = userData?.kycVerificado === true || userData?.identidadVerificada === true;
            
            if (!estaVerificado) {
              setToastMessage("Verifica tu identidad en 'Mi Cuenta' para publicar.");
              setShowToast(true);
              return; 
            }

            const [ciudadOri] = (viajeForm.origen || "").split(',');
            const [ciudadDest] = (viajeForm.destino || "").split(',');

            const datosBase = {
              ...viajeForm,
              idCreador: userData.id,
              uidConductor: userData.id,
              fotoPerfil: userData?.fotoPerfil || "",
              conductor: userData?.nombre || "Usuario",
              identidadVerificada: true,
              datosConductor: {
                nombre: userData?.nombre || "Usuario",
                foto: userData?.fotoPerfil || "",
                rating: ratingCalculado, 
                viajesRealizados: userData?.viajesRealizados || 0,
                bio: userData?.bio || ""
              },
              vehiculo: userData?.vehiculo || { marca: "No especificado", modelo: "", color: "", placa: "S/N" },
              cO: ciudadOri || "S/N", 
              cD: ciudadDest || "S/N",
              coordsOrigen: viajeForm.coordsOrigen || null,   
              coordsDestino: viajeForm.coordsDestino || null, 
              estado: "disponible",
              timestamp: Date.now(),
              pasajeros: [], 
              reservasPendientes: [], 
              precio: Number(viajeForm.precio) || 0 
            };
            
            try {
              if (viajeAEditar) {
                await publicarRuta(datosBase, true); 
                setToastMessage("Guardado con éxito");
              } else {
                const objetoIda = {
                  ...datosBase,
                  conRetornoProgramado: !!viajeForm.publicarRegreso,
                  tipoRuta: viajeForm.publicarRegreso ? "ida_y_vuelta" : "solo_ida",
                  fechaRegreso: viajeForm.publicarRegreso ? viajeForm.fechaRegreso : null,
                  horaRegreso: viajeForm.publicarRegreso ? viajeForm.horaRegreso : null,
                };
                
                await publicarRuta(objetoIda, true); 

                if (viajeForm.publicarRegreso) {
                  await publicarRuta({
                    ...objetoIda,
                    origen: viajeForm.destino,
                    destino: viajeForm.origen,
                    cO: ciudadDest || "S/N",
                    cD: ciudadOri || "S/N",
                    coordsOrigen: viajeForm.coordsDestino || null, 
                    coordsDestino: viajeForm.coordsOrigen || null, 
                    fecha: viajeForm.fechaRegreso,
                    hora: viajeForm.horaRegreso || viajeForm.hora,
                    tipoRuta: "vuelta_de_ruta",
                    conRetornoProgramado: false
                  }, true);
                }
                setToastMessage("¡Publicado con éxito!");
              }

              setShowToast(true);
              setTimeout(() => { 
                  setShowToast(false); 
                  setVista("inicio"); 
                  setPasoWizard(1);
              }, 2000);

            } catch (e) {
              console.error("ERROR CRÍTICO AL PUBLICAR:", e);
              setToastMessage("Ocurrió un error de conexión al publicar.");
              setShowToast(true);
            }
          }}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-[2px] py-5 px-6 rounded-full shadow-lg transition-colors mt-6"
        >
          <ShieldCheck size={20} /> 
          <span className="text-sm">{viajeAEditar ? "Guardar Cambios" : "¡Publicar Ahora!"}</span>
        </button>
              
        <button onClick={() => setPasoWizard(2)} className="w-full text-[10px] font-black uppercase text-slate-400 italic mt-4">Atrás</button>
        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </div>
    );
  } 

  return null;
};
