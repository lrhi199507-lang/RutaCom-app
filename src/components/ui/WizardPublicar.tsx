import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { MapPin, Navigation, Users, DollarSign, Clock, ShieldCheck, Check, Briefcase, Zap, Calendar, X, Map } from 'lucide-react'; 
import Toast from './Toast'; 
import MapaView from '../Map/MapaView'; 

export const WizardPublicar = ({ 
  pasoWizard, setPasoWizard, viajeForm, setViajeForm, UBICACIONES, setVista, setModo, publicarRuta,
  viajeAEditar,
  userData 
}) => {

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hoy = new Date().toISOString().split('T')[0];
  
  const [sugerencias, setSugerencias] = useState([]);
  const [campoActivo, setCampoActivo] = useState(null);

  // <-- ESTADOS PARA EL MODAL DEL MAPA
  const [showMapaModal, setShowMapaModal] = useState(false);
  const [tipoMapa, setTipoMapa] = useState(null); 
  const [coordsTemporales, setCoordsTemporales] = useState(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);

  const [ratingCalculado, setRatingCalculado] = useState("0.0");

  useEffect(() => {
    if (!userData?.id) return;
    const qResenas = query(collection(db, "Resenas"), where("idConductor", "==", userData.id));
    getDocs(qResenas).then(snap => {
      let suma = 0, total = 0;
      snap.forEach(d => { suma += d.data().estrellas || 0; total++; });
      setRatingCalculado(total > 0 ? (suma / total).toFixed(1) : "0.0");
    }).catch(e => console.error("Error rating en wizard:", e));
  }, [userData?.id]);

  const timerRef = useRef(null);

      const manejarBusqueda = (texto, tipo) => {
    if (tipo === 'origen') {
        if (typeof setViajeForm !== 'undefined') setViajeForm(prev => ({...prev, origen: texto}));
        else setOrigen(texto); 
    } else {
        if (typeof setViajeForm !== 'undefined') setViajeForm(prev => ({...prev, destino: texto}));
        else setDestino(texto); 
    }

    if (texto.length > 2) {
      setCampoActivo(tipo);
      if (timerRef.current) clearTimeout(timerRef.current);
      
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

          // 🔥 EL MISMO TRUCO AQUÍ: Guarda las coordenadas en silencio al publicar
          if (sugerenciasFiltradas.length > 0) {
            const mejorOpcion = { lat: sugerenciasFiltradas[0].lat, lon: sugerenciasFiltradas[0].lon };
            if (tipo === 'origen') {
              if (typeof setViajeForm !== 'undefined') setViajeForm(prev => ({...prev, coordsOrigen: mejorOpcion}));
              else setCoordsOrigen(mejorOpcion);
            } else {
              if (typeof setViajeForm !== 'undefined') setViajeForm(prev => ({...prev, coordsDestino: mejorOpcion}));
              else setCoordsDestino(mejorOpcion);
            }
          }
        } catch (error) {
          console.error("Error buscando ubicación:", error);
        }
      }, 600); 
    } else {
      setSugerencias([]);
    }
  };

  // <-- Función Reverse Geocoding
   const confirmarUbicacionMapa = async () => {
    if (!coordsTemporales) return;
    
    setBuscandoDireccion(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordsTemporales.lat}&lon=${coordsTemporales.lon}&zoom=18` 
        // Nota: Le subí el zoom a 18 para que traiga datos de calles y barrios
      );
      const data = await response.json();
      
      const address = data.address || {};
      
      // 1. Buscamos lo más específico (Barrio, urbanización, calle)
      const zonaLocal = address.suburb || address.neighbourhood || address.residential || address.road || "";
      // 2. Buscamos la ciudad o municipio
      const ciudadMunicipio = address.city || address.town || address.village || address.county || data.name || "";
      // 3. Buscamos el estado
      const estado = address.state || "Venezuela";

      // Juntamos todo filtrando los vacíos y evitando repeticiones
      const partes = [zonaLocal, ciudadMunicipio, estado].filter(Boolean);
      const partesUnicas = [...new Set(partes)]; 
      const textoCompleto = partesUnicas.join(", "); // Ej: "Paraparal, Los Guayos, Carabobo"

      if (tipoMapa === 'origen') {
        // Usa setViajeForm si estás en WizardPublicar, o setOrigen si estás en VistaInicio
        if (typeof setViajeForm !== 'undefined') {
            setViajeForm({...viajeForm, origen: textoCompleto, coordsOrigen: coordsTemporales});
        } else {
            setOrigen(textoCompleto);
            setCoordsOrigen(coordsTemporales);
        }
      } else {
        if (typeof setViajeForm !== 'undefined') {
            setViajeForm({...viajeForm, destino: textoCompleto, coordsDestino: coordsTemporales});
        } else {
            setDestino(textoCompleto);
            setCoordsDestino(coordsTemporales);
        }
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



  // PASO 1: UBICACIONES
  if (pasoWizard === 1) {
    return (
      <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right relative">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">
          {viajeAEditar ? <>Edita tu<br/>Ruta Actual</> : <>¿Hacia dónde<br/>vas a manejar?</>}
        </h2>
        
        <div className="space-y-4 relative">
          
          {/* CAMPO ORIGEN CON ÍCONO INTEGRADO */}
          <div className="relative">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-blue-400 focus-within:bg-blue-50/30 transition-colors">
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <input 
                type="text" 
                placeholder="Punto de salida (Ej. Valencia)" 
                className="bg-transparent w-full text-sm font-bold outline-none text-slate-700 placeholder:text-slate-400" 
                value={viajeForm.origen || ""} 
                onChange={(e) => manejarBusqueda(e.target.value, 'origen')} 
              />
              <div className="flex items-center gap-3 shrink-0">
                {viajeForm.origen && <X size={16} className="text-slate-300 active:scale-90 cursor-pointer" onClick={() => setViajeForm({...viajeForm, origen: "", coordsOrigen: null})} />}
                <div className="w-[1px] h-5 bg-slate-200" />
                <button 
                  onClick={() => { setTipoMapa('origen'); setCoordsTemporales(viajeForm.coordsOrigen || {lat: 10.1620, lon: -67.9567}); setShowMapaModal(true); }}
                  className="text-slate-400 hover:text-blue-600 active:scale-90 transition-all"
                >
                  <Map size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* CAMPO DESTINO CON ÍCONO INTEGRADO */}
          <div className="relative">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[25px] border border-slate-100 focus-within:border-green-400 focus-within:bg-green-50/30 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <input 
                type="text" 
                placeholder="Punto de llegada (Ej. Caracas)" 
                className="bg-transparent w-full text-sm font-bold outline-none text-slate-700 placeholder:text-slate-400" 
                value={viajeForm.destino || ""} 
                onChange={(e) => manejarBusqueda(e.target.value, 'destino')} 
              />
              <div className="flex items-center gap-3 shrink-0">
                {viajeForm.destino && <X size={16} className="text-slate-300 active:scale-90 cursor-pointer" onClick={() => setViajeForm({...viajeForm, destino: "", coordsDestino: null})} />}
                <div className="w-[1px] h-5 bg-slate-200" />
                <button 
                  onClick={() => { setTipoMapa('destino'); setCoordsTemporales(viajeForm.coordsDestino || {lat: 10.1620, lon: -67.9567}); setShowMapaModal(true); }}
                  className="text-slate-400 hover:text-green-600 active:scale-90 transition-all"
                >
                  <Map size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* CAJA DE SUGERENCIAS FLOTANTE */}
          {sugerencias.length > 0 && (
            <div className="absolute z-[110] w-full bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden mt-1 top-full">
              {sugerencias.map((s, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => {
                    if (campoActivo === 'origen') {
                      setViajeForm({
                        ...viajeForm, 
                        origen: `${s.ciudad}, ${s.estado}`,
                        coordsOrigen: { lat: s.lat, lon: s.lon }
                      });
                    } else {
                      setViajeForm({
                        ...viajeForm, 
                        destino: `${s.ciudad}, ${s.estado}`,
                        coordsDestino: { lat: s.lat, lon: s.lon }
                      });
                    }
                    setSugerencias([]);
                  }} 
                  className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-50 last:border-0 text-[11px] font-black uppercase italic flex items-center gap-3 transition-colors"
                >
                  {campoActivo === 'origen' ? <MapPin size={14} className="text-blue-400 shrink-0"/> : <Navigation size={14} className="text-green-400 shrink-0"/>}
                  <div>
                    <p className="text-slate-700">{s.ciudad}</p>
                    <p className="text-[9px] font-bold text-slate-400">{s.estado}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAPA DE CONFIRMACIÓN DE RUTA PARA EL CHOFER */}
        {(viajeForm.coordsOrigen || viajeForm.coordsDestino) && (
          <div className="pt-2 animate-in fade-in zoom-in duration-300">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 italic">📍 Ruta a publicar:</h3>
            <div className="rounded-[25px] overflow-hidden border border-slate-100">
                <MapaView origen={viajeForm.coordsOrigen} destino={viajeForm.coordsDestino} />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <button onClick={() => { setVista("inicio"); setModo("pasajero"); }} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Cancelar</button>
          <button onClick={() => setPasoWizard(2)} disabled={!viajeForm.origen || !viajeForm.destino} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg disabled:opacity-50">Siguiente</button>
        </div>

        {/* <-- MODAL DEL MAPA --> */}
        {showMapaModal && (
            <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
               <div className="p-4 flex items-center justify-between shadow-sm z-10">
                  <div>
                    <h3 className="font-black uppercase italic text-slate-800 text-sm">
                      Ubica tu {tipoMapa === 'origen' ? 'Punto de Salida' : 'Destino'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Mueve el mapa para ajustar el pin
                    </p>
                  </div>
                  <button onClick={() => setShowMapaModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                    <X size={18} />
                  </button>
               </div>
               
               <div className="flex-1 relative bg-slate-100">
                  <MapaView 
                    origen={tipoMapa === 'origen' ? coordsTemporales : null}
                    destino={tipoMapa === 'destino' ? coordsTemporales : null}
                    onMarkerDragEnd={(coords) => setCoordsTemporales(coords)}
                    interactivo={true}
                  />
               </div>

               <div className="p-6 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-10">
                  <button 
                    onClick={confirmarUbicacionMapa}
                    disabled={buscandoDireccion}
                    className="w-full bg-blue-600 text-white rounded-full p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {buscandoDireccion ? 'Traduciendo Dirección...' : 'Confirmar Ubicación'}
                  </button>
               </div>
            </div>
        )}
      </div>
    );
  }

  // PASO 2: DETALLES (INTACTO)
  if (pasoWizard === 2) {
    return (
      <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-5 animate-in slide-in-from-right">
        <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Detalles del<br/>Viaje</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">📅 Fecha Ida</p>
            <input 
              type="date" 
              min={hoy} 
              className="bg-transparent w-full text-[11px] font-black outline-none" 
              value={viajeForm.fecha || ""} 
              onChange={(e) => setViajeForm({...viajeForm, fecha: e.target.value})} 
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">⏰ Hora Ida</p>
            <input 
              type="time" 
              className="bg-transparent w-full text-[11px] font-black outline-none" 
              value={viajeForm.hora || ""} 
              onChange={(e) => setViajeForm({...viajeForm, hora: e.target.value})} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">💰 Precio $</p>
            <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-blue-600" value={viajeForm.precio} onChange={(e) => setViajeForm({...viajeForm, precio: e.target.value})} />
          </div>
          <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100">
            <p className="text-[8px] font-black uppercase text-slate-400 mb-2">🪑 Asientos</p>
            <input type="number" className="bg-transparent w-full text-xl font-black italic outline-none text-slate-700" value={viajeForm.asientos} onChange={(e) => setViajeForm({...viajeForm, asientos: e.target.value})} />
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
                onClick={() => setViajeForm({
                  ...viajeForm, 
                  preferencias: {
                    ...viajeForm.preferencias, 
                    [pref.id]: !viajeForm.preferencias?.[pref.id]
                  }
                })}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${viajeForm.preferencias?.[pref.id] ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 opacity-60 text-slate-500'}`}
              >
                <span className="text-xl">{pref.icon}</span>
                <span className="text-[8px] font-black uppercase text-center leading-tight">{pref.label}</span>
              </button>
            ))}
          </div>
        </div>

        {!viajeAEditar && (
          <button 
            type="button"
            onClick={() => setViajeForm({...viajeForm, publicarRegreso: !viajeForm.publicarRegreso})}
            className={`w-full p-4 rounded-[25px] border-2 transition-all flex items-center justify-between ${viajeForm.publicarRegreso ? 'border-green-500 bg-green-50' : 'border-slate-100'}`}
          >
            <span className="text-[10px] font-black uppercase italic">¿Publicar viaje de regreso?</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${viajeForm.publicarRegreso ? 'bg-green-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viajeForm.publicarRegreso ? 'left-6' : 'left-1'}`} />
            </div>
          </button>
        )}

        {viajeForm.publicarRegreso && (
          <div className="p-5 bg-blue-600 rounded-[30px] space-y-3 animate-in slide-in-from-top">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-white">
                <p className="text-[7px] font-black uppercase mb-1">Fecha Regreso</p>
                <input 
                  type="date" 
                  min={viajeForm.fecha || hoy} 
                  className="bg-transparent w-full text-[10px] font-bold outline-none" 
                  value={viajeForm.fechaRegreso || ""} 
                  onChange={(e) => setViajeForm({...viajeForm, fechaRegreso: e.target.value})} 
                />
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-white">
                <p className="text-[7px] font-black uppercase mb-1">Hora Regreso</p>
                <input 
                  type="time" 
                  className="bg-transparent w-full text-[10px] font-bold outline-none" 
                  value={viajeForm.horaRegreso || ""} 
                  onChange={(e) => setViajeForm({...viajeForm, horaRegreso: e.target.value})} 
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <button onClick={() => setPasoWizard(1)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase italic text-[9px]">Atrás</button>
          <button onClick={() => setPasoWizard(3)} disabled={!viajeForm.precio || !viajeForm.fecha} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg active:scale-95 disabled:opacity-50">Siguiente</button>    
        </div>
      </div>
    );
  }

  // PASO 3: AJUSTES FINALES Y GUARDADO
  if (pasoWizard === 3) {
    return (
      <>
        <div className="bg-white p-7 rounded-[40px] border shadow-sm space-y-6 animate-in slide-in-from-right">
          <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Ajustes Finales</h2>
          
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Punto de encuentro / Referencia</p>
            <textarea 
              rows={2}
              placeholder="Ej: Frente al Farmatodo de la redoma..." 
              className="bg-slate-50 w-full p-4 rounded-[25px] border border-slate-100 text-[11px] font-bold outline-none resize-none"
              value={viajeForm.referencia} 
              onChange={(e) => setViajeForm({...viajeForm, referencia: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-slate-400 ml-2">Equipaje permitido</p>
            <div className="grid grid-cols-3 gap-2">
              {[{id:'ligero', i:'🎒'}, {id:'medio', i:'🧳'}, {id:'pesado', i:'📦'}].map(eq => (
                <button 
                  key={eq.id}
                  type="button"
                  onClick={() => setViajeForm({...viajeForm, equipaje: eq.id})}
                  className={`p-3 rounded-2xl border-2 transition-all ${viajeForm.equipaje === eq.id ? 'border-blue-600 bg-blue-50' : 'border-slate-50'}`}
                >
                  <span className="text-xl">{eq.i}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[25px] border border-slate-100">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-700">Reserva Automática</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Aceptar cola sin preguntar</p>
            </div>
            <button 
              type="button"
              onClick={() => setViajeForm({...viajeForm, autoAceptar: !viajeForm.autoAceptar})}
              className={`w-10 h-5 rounded-full relative transition-colors ${viajeForm.autoAceptar ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viajeForm.autoAceptar ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

                    <button 
            onClick={async () => {
              // 1. Verificación de sesión
              if (!userData?.id) {
                setToastMessage("Sesión no detectada. Reinicia la aplicación.");
                setShowToast(true);
                return;
              }

              // 2. VERIFICACIÓN KYC BLINDADA
              const estaVerificado = userData?.kycVerificado === true || userData?.identidadVerificada === true;
              
              if (!estaVerificado) {
                setToastMessage("Por seguridad, verifica tu identidad en 'Mi Cuenta' para publicar.");
                setShowToast(true);
                return; 
              }

              const [ciudadOri] = (viajeForm.origen || "").split(', ');
              const [ciudadDest] = (viajeForm.destino || "").split(', ');

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
                cO: ciudadOri || "S/N", 
                cD: ciudadDest || "S/N",
                coordsOrigen: viajeForm.coordsOrigen || null,   
                coordsDestino: viajeForm.coordsDestino || null, 
                estado: "disponible",
                timestamp: Date.now()
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
            <span className="text-sm">
              {viajeAEditar ? "Guardar Cambios" : "¡Publicar Ahora!"}
            </span>
          </button>
          
                
          <button 
            onClick={() => setPasoWizard(2)} 
            className="w-full text-[10px] font-black uppercase text-slate-400 italic mt-4"
          >
            Atrás
          </button>
        </div>
        <Toast show={showToast} message={toastMessage} onClose={() => setShowToast(false)} />
      </>
    );
  } 

  return null;
};
