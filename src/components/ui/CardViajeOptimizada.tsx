import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MapPin, Navigation, Clock, Users, Star, Car, ChevronRight, User, BadgeCheck, Repeat } from 'lucide-react';

export const CardViajeOptimizada = ({ viaje, onClickDetalle, onClickPedir }) => {
  if (!viaje) return null;

  const [ratingInfo, setRatingInfo] = useState({ promedio: "0.0", total: 0 });

  // EFECTO: Buscar calificación real del conductor para esta tarjeta
  useEffect(() => {
    let unmounted = false;
    const idChofer = viaje.uidConductor || viaje.idCreador;
    
    if (!idChofer) return;

    const qResenas = query(collection(db, "Resenas"), where("idConductor", "==", idChofer));
    getDocs(qResenas).then(snap => {
      let suma = 0;
      let total = 0;
      snap.forEach(d => { suma += d.data().estrellas || 0; total++; });
      
      if (!unmounted) {
        setRatingInfo({
          promedio: total > 0 ? (suma / total).toFixed(1) : "0.0",
          total: total
        });
      }
    }).catch(e => console.error(e));

    return () => { unmounted = true; };
  }, [viaje.uidConductor, viaje.idCreador]);

  const esRutaCompleta = viaje.tipoRuta === "ida_y_vuelta";
  const esRutaSoloVuelta = viaje.tipoRuta === "vuelta_de_ruta";
  const fechaCorrecta = (esRutaSoloVuelta && viaje.fechaRegreso) ? viaje.fechaRegreso : viaje.fecha;
  
  // --- LÓGICA PROFESIONAL DE CUPOS ---
  const pasajerosConfirmados = Array.isArray(viaje.pasajeros) ? viaje.pasajeros : [];
  const asientosOcupados = pasajerosConfirmados.reduce((total, p) => total + (Number(p?.puestosSolicitados) || 1), 0);
  const puestosTotales = Number(viaje.asientos) || Number(viaje.puestos) || 1;
  const cuposRestantes = Math.max(0, puestosTotales - asientosOcupados);
  const estaLleno = cuposRestantes === 0;

  const formatearLugar = (texto, index) => {
    if (!texto || typeof texto !== 'string') return index === 0 ? "No especificado" : "";
    const partes = texto.split(',');
    return partes[index] ? partes[index].trim() : "";
  };

  const formatearFechaManual = (fechaValor) => {
    if (!fechaValor) return "Fecha n/d"; 
    
    try {
      const limpio = String(fechaValor).split('T')[0];
      const partes = limpio.split('-');
      
      if (partes.length !== 3) return "Error Formato";
      
      const year = parseInt(partes[0]);
      const month = parseInt(partes[1]);
      const day = parseInt(partes[2]);
      
      const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
      
      const fechaObj = new Date(year, month - 1, day);
      const diaSemanaIndex = fechaObj.getDay();
      
      if (isNaN(diaSemanaIndex)) return "Error Fecha";

      return `${dias[diaSemanaIndex]}, ${day} ${obtenerMesCorto(month)}`;

    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Error";
    }
  };

  const obtenerMesCorto = (month) => {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return meses[month - 1] || "";
  };
  
  return (
    <div
      onClick={onClickDetalle}
      className={`bg-white p-5 rounded-[30px] border shadow-sm transition-all relative overflow-hidden cursor-pointer active:scale-[0.98] ${estaLleno ? 'border-red-100 opacity-90' : 'border-slate-100 hover:border-blue-100'}`}
    >
      
      {/* ETIQUETA DE RUTA CON RETORNO */}
      {esRutaCompleta && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-2xl flex items-center gap-1.5 shadow-sm">
          <Repeat size={10} className="animate-pulse" />
          <span className="text-[8px] font-black uppercase italic tracking-wider">Ruta con Retorno</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          
          {/* AVATAR: SE PONE GRIS SI ESTÁ LLENO */}
          <div className={`w-12 h-12 rounded-[14px] border-2 border-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center ${estaLleno ? 'bg-slate-300' : 'bg-blue-600'}`}>
            {viaje.fotoPerfil ? ( 
              <img src={viaje.fotoPerfil} className={`w-full h-full object-cover ${estaLleno ? 'grayscale opacity-80' : ''}`} alt="Perfil" /> 
            ) : ( 
              <span className="text-white font-black italic text-xl">D</span> 
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className={`text-sm font-black italic uppercase truncate tracking-tight leading-none ${estaLleno ? 'text-slate-500' : 'text-slate-800'}`}>
                {viaje.conductor || viaje.cN || "Usuario"}
              </h3>
              <BadgeCheck size={16} className={`shrink-0 ${estaLleno ? 'text-slate-300' : 'text-green-500 fill-green-100'}`} strokeWidth={2.5} />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <Star size={12} className={parseFloat(ratingInfo.promedio) > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-300 fill-slate-200'} />
                <span className={`text-[10px] font-black italic ${parseFloat(ratingInfo.promedio) > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {ratingInfo.promedio}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase italic text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {obtenerNivel(viaje.datosConductor?.viajesRealizados || viaje.viajesRealizados)}
              </span>
            </div>
          </div>
        </div>

        {/* ÁREA DE PRECIO Y BADGE DE CUPOS */}
        <div className={`text-right shrink-0 ${esRutaCompleta ? 'mt-6' : ''}`}>
          <p className={`text-2xl font-black italic leading-none ${estaLleno ? 'text-slate-400' : 'text-blue-600'}`}>
            ${viaje.precio || "0"}
          </p>
          <div className="mt-1 flex justify-end">
            {estaLleno ? (
              <span className="bg-red-50 text-red-500 border border-red-200 text-[8px] font-black uppercase italic px-2 py-0.5 rounded-full flex items-center gap-1">
                ● Completo
              </span>
            ) : cuposRestantes <= 2 ? (
              <span className="bg-amber-500 text-white text-[8px] font-black uppercase italic px-2 py-0.5 rounded-full flex items-center gap-1">
                ● Queda{cuposRestantes === 1 ? '' : 'n'} {cuposRestantes}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* RUTA SEGURA */}
      <div className="flex items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mt-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-blue-200 flex items-center justify-center bg-white shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">
              {formatearLugar(viaje.origen || viaje.cO, 0)}
            </p>
            <p className="text-[9px] font-bold text-slate-400 truncate uppercase">
              {formatearLugar(viaje.origen || viaje.cO, 1) || viaje.eO || "Ver mapa"}
            </p>
          </div>
        </div>
        
        <ChevronRight size={18} className="text-slate-300 shrink-0"/>

        <div className="flex-1 min-w-0 flex items-center justify-end gap-2 text-right">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">
              {formatearLugar(viaje.destino || viaje.cD, 0)}
            </p>
            <p className="text-[9px] font-bold text-slate-400 truncate uppercase">
              {formatearLugar(viaje.destino || viaje.cD, 1) || viaje.eD || "Ver mapa"}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full border border-green-200 flex items-center justify-center bg-white shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* INFO ADICIONAL */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={14} />
          <p className="text-[10px] font-bold truncate flex items-center gap-1">
            Salida: 
            <span className='font-black'>
              {viaje.hora ? new Date(`2000-01-01T${viaje.hora}`).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              }) : "--:--"}
            </span>
            <span className="text-[12px]">
              {viaje.hora && (
                parseInt(viaje.hora.split(':')[0]) >= 6 && parseInt(viaje.hora.split(':')[0]) < 18 ? '☀️' : '🌙'
              )}
            </span>
          </p>
        </div>
          
        <div className={`flex items-center gap-2 ${estaLleno ? 'text-red-500' : 'text-slate-500'}`}>
          <Users size={14} />
          <p className="text-[10px] font-bold">
            {estaLleno ? <span className="font-black uppercase">Agotado</span> : <>Libres: <span className='font-black'>{cuposRestantes}</span></>}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-slate-500 col-span-2 border-t border-slate-50 pt-2">
          <Clock size={14} className="text-blue-400" /> <p className="text-[10px] font-bold">  Fecha: <span className='font-black'>{formatearFechaManual(fechaCorrecta)}</span></p>
        </div>  
      </div>
     
    </div>
  );
};

const obtenerNivel = (viajes) => {
  const num = parseInt(viajes) || 0;
  if (num === 0) return "Nuevo";
  if (num < 10) return "Novato";
  if (num < 50) return "Bronce";
  if (num < 100) return "Plata";
  return "Oro";
};
