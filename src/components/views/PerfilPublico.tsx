import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { App } from '@capacitor/app';
import { 
  ArrowLeft, MessageCircle, Phone, ShieldCheck, 
  Star, Music, MessageSquare, User, Car, Trophy, Medal, MapPin, BadgeCheck, Calendar
} from 'lucide-react';
import { calcularRangoGlobal } from '../../utils/rangoUsuario';

// --- HELPER: FORMATO MIEMBRO DESDE (CON ABRIL 2026 POR DEFECTO) ---
const formatearMesAño = (isoString) => {
  // Si no tiene fecha guardada, por defecto es Abril 2026
  if (!isoString) return 'Abril 2026';
  
  const date = new Date(isoString);
  
  // Por si la fecha se guardó con un formato inválido
  if (isNaN(date.getTime())) return 'Abril 2026';

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[date.getMonth()]} ${date.getFullYear()}`;
};

const PerfilPublico = ({ conductor, onClose, setToastMessage, setShowToast }: any) => {
  if (!conductor) return null;

  const [estadisticas, setEstadisticas] = useState({
    viajesRealizados: 0,
    promedio: "0.0",
    totalOpiniones: 0
  });
  
  // 🔥 NUEVO ESTADO: Guarda los datos 100% actualizados desde la BD 🔥
  const [datosActualizados, setDatosActualizados] = useState<any>(null);

  const [cargandoStats, setCargandoStats] = useState(true);
  const [listaResenas, setListaResenas] = useState([]);
  const [mostrarModalResenas, setMostrarModalResenas] = useState(false);
  

  // 1. MEJORA: Atrapar el nombre correcto sin importar de dónde venga
  const nombreMostrar = conductor.nombre || conductor.cN || conductor.conductor || 'Usuario';
  const inicialMostrar = nombreMostrar.charAt(0).toUpperCase();

      // 🔥 ESCUCHADOR DEL CEREBRO MAESTRO 🔥
  useEffect(() => {
    window.perfilPublicoAbierto = true; 
    
    const handleCierre = () => {
      onClose(); // Ejecuta el cierre visual
    };

    // Escucha la orden que le manda NavegacionPrincipal
    window.addEventListener('cerrarPerfilGlobal', handleCierre);
    
    return () => { 
      window.perfilPublicoAbierto = false; 
      window.removeEventListener('cerrarPerfilGlobal', handleCierre);
    };
  }, [onClose]);
  
  useEffect(() => {
    let unmounted = false;
    const idUsuario = conductor.uidConductor || conductor.idCreador || conductor.id;

    if (!idUsuario) {
      setCargandoStats(false);
      return;
    }

    const cargarEstadisticasYPerfil = async () => {
      try {
        // 🔥 AQUÍ OBTENEMOS EL PERFIL MAESTRO EN TIEMPO REAL 🔥
        const userSnap = await getDocs(query(collection(db, "usuarios"), where("__name__", "==", idUsuario)));
        let contadorViajes = 0;

        if (!userSnap.empty) {
          const uData = userSnap.docs[0].data();
          const viajesCond = uData.viajesRealizados || 0;
          const viajesPas = uData.viajesComoPasajero || 0;
          contadorViajes = viajesCond + viajesPas; 
          
          // Guardamos la info fresca (bio, edad, foto, etc)
          if (!unmounted) {
             setDatosActualizados(uData);
          }
        }

        const qResenas = query(collection(db, "Resenas"), where("idConductor", "==", idUsuario));
        const snapshotResenas = await getDocs(qResenas);
        
        let sumaEstrellas = 0;
        let totalResenas = 0;
        let resenasObtenidas = [];

        snapshotResenas.forEach((docSnap) => {
          const data = docSnap.data();
          sumaEstrellas += data.estrellas || 0;
          totalResenas++;
          resenasObtenidas.push({ id: docSnap.id, ...data });
        });

        resenasObtenidas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const promedioCalculado = totalResenas > 0 ? (sumaEstrellas / totalResenas).toFixed(1) : "0.0";

        if (!unmounted) {
          setEstadisticas({
            viajesRealizados: contadorViajes, 
            promedio: promedioCalculado,
            totalOpiniones: totalResenas
          });
          setListaResenas(resenasObtenidas);
          setCargandoStats(false);
        }
      } catch (error) {
        console.error("Error cargando estadísticas y perfil:", error);
        setCargandoStats(false);
      }
    };

    cargarEstadisticasYPerfil();
    return () => { unmounted = true; };
  }, [conductor]);

  const nivel = calcularRangoGlobal(estadisticas.viajesRealizados);

  const manejarClickOpiniones = () => {
    if (estadisticas.totalOpiniones === 0) {
      setToastMessage("Aún no tiene reseñas. ¡Sé el primero en calificar!");
      setShowToast(true);
    } else {
      setMostrarModalResenas(true); // Abre el nuevo modal
    }
  };
  
  // 🔥 VARIABLES DINÁMICAS: Si el dato existe en BD, lo usa. Si no, usa el del viaje. 🔥
  const bioMostrar = datosActualizados?.bio || conductor.bio || "Este usuario prefiere que lo conozcas durante el viaje.";
  const edadMostrar = datosActualizados?.edad || conductor.edad;
  const habladorMostrar = datosActualizados?.hablador ?? conductor.hablador;
  const musicaMostrar = datosActualizados?.musica ?? conductor.musica;
  const verificadoMostrar = datosActualizados?.kycVerificado ?? conductor.identidadVerificada;
  const fotoMostrar = datosActualizados?.fotoPerfil || conductor.fotoPerfil;
  const fechaRegMostrar = datosActualizados?.fechaRegistro || datosActualizados?.fechaCreacion || conductor.fechaRegistro || conductor.fechaCreacion;

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* ENCABEZADO */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#063971] rounded-[14px] flex items-center justify-center shadow-lg shadow-[#063971]/20">
            <span className="text-white font-black italic text-lg">{inicialMostrar}</span>
          </div>
          <div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Perfil Público</p>
            <p className="text-xs font-black text-[#1F2937] leading-none truncate max-w-[150px]">{nombreMostrar}</p>
          </div>
        </div>

        {/* ETIQUETA DINÁMICA DE NIVEL */}
        <div className={`${nivel.bgBadge} ${nivel.colorText} px-3.5 py-2 rounded-[18px] flex items-center gap-2 shadow-sm border border-white`}> {nivel.icon}
         <span className="text-[9px] font-black italic uppercase tracking-widest">{nivel.titulo}</span>
       </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 px-6">
        
        <div className="py-4">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-[#063971] active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
        </div>
        
        {/* TARJETA DE PERFIL CENTRAL */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center mb-8 relative">
          
          <div className="w-28 h-28 bg-[#063971]/5 rounded-[35px] border-4 border-[#063971]/10 shadow-xl overflow-hidden mb-4 flex items-center justify-center relative">
            {fotoMostrar ? (
              <img src={fotoMostrar} className="w-full h-full object-cover" alt="" />
            ) : (
              <User size={40} className="text-[#063971]/40" />
            )}
          </div>
            
          
          <h2 className="text-2xl font-black text-[#1F2937] flex items-center justify-center gap-2 italic text-center w-full">
            <span className="truncate max-w-[80%]">{nombreMostrar}</span>
            {verificadoMostrar && (
              <BadgeCheck size={26} className="text-[#10B981] fill-[#10B981]/20 flex-shrink-0" strokeWidth={2.5} />
            )}
          </h2>
          
          {/* --- NUEVO: EDAD Y MIEMBRO DESDE EN PERFIL PÚBLICO --- */}
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[2px] mt-1 italic flex items-center justify-center gap-1">
             {verificadoMostrar ? 'Identidad Verificada' : 'Usuario Nuevo'}
             {edadMostrar && <><span className="mx-1 text-slate-300">•</span>{edadMostrar} AÑOS</>}
          </p>
          <p className="text-[9px] font-black text-[#063971] uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5 bg-[#063971]/5 px-3 py-1.5 rounded-full border border-[#063971]/10">
             <Calendar size={12} className="text-[#063971]" /> Miembro desde {formatearMesAño(fechaRegMostrar)}
          </p>

        </div>

        {/* SOBRE EL USUARIO */}
        <div className="mb-8">
          <p className="text-[9px] font-black text-[#063971] uppercase tracking-[3px] ml-4 mb-2 italic">Sobre Mí</p>
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
            <p className="text-[#1F2937] leading-relaxed font-bold italic text-[11px]">
              "{bioMostrar}"
            </p>
          </div>
        </div>

        {/* ESTILO DE VIAJE */}
        <div className="mb-8">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] ml-4 mb-3 italic">Estilo de viaje</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-5 rounded-[30px] bg-white border-2 flex flex-col items-center gap-2 ${habladorMostrar === 'hablador' || habladorMostrar === true ? 'border-[#063971] bg-[#063971]/5' : 'border-slate-50 opacity-60'}`}>
              <MessageSquare size={20} className={habladorMostrar === 'hablador' || habladorMostrar === true ? 'text-[#063971]' : 'text-slate-300'} />
              <p className={`text-[9px] font-black uppercase ${habladorMostrar === 'hablador' || habladorMostrar === true ? 'text-[#063971]' : 'text-[#1F2937]'}`}>{habladorMostrar === 'hablador' || habladorMostrar === true ? 'Conversador' : 'Tranquilo'}</p>
            </div>
            <div className={`p-5 rounded-[30px] bg-white border-2 flex flex-col items-center gap-2 ${musicaMostrar === 'con_musica' || musicaMostrar === true ? 'border-[#063971] bg-[#063971]/5' : 'border-slate-50 opacity-60'}`}>
              <Music size={20} className={musicaMostrar === 'con_musica' || musicaMostrar === true ? 'text-[#063971]' : 'text-slate-300'} />
              <p className={`text-[9px] font-black uppercase ${musicaMostrar === 'con_musica' || musicaMostrar === true ? 'text-[#063971]' : 'text-[#1F2937]'}`}>{musicaMostrar === 'con_musica' || musicaMostrar === true ? 'Música' : 'Sin música'}</p>
            </div>
          </div>
        </div>

        {/* ESTADÍSTICAS REALES */}
        <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-white p-4 rounded-[28px] border border-slate-100 flex items-center gap-3 shadow-sm">
              <ShieldCheck size={18} className={verificadoMostrar ? "text-[#063971]" : "text-slate-300"} />
              <p className="text-[8px] font-black text-[#1F2937] uppercase leading-tight italic">
                Identidad<br/>{verificadoMostrar ? 'Verificada' : 'Pendiente'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-[28px] border border-slate-100 flex items-center gap-3 shadow-sm">
              <Car size={18} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-[#063971] italic leading-none mb-0.5">
                  {cargandoStats ? "..." : estadisticas.viajesRealizados}
                </span>
                <p className="text-[7px] font-black text-slate-400 uppercase leading-tight">Viajes en app</p>
              </div>
            </div>
        </div>

        {/* OPINIONES DINÁMICAS */}
        <div className="mb-32">
          <button 
            onClick={manejarClickOpiniones}
            className="w-full bg-white border border-slate-100 p-5 rounded-[35px] flex items-center justify-between shadow-sm active:scale-95 hover:bg-[#063971]/5 hover:border-[#063971]/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${estadisticas.totalOpiniones > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <Star size={20} className={estadisticas.totalOpiniones > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Calificación</p>
                <p className="text-base font-black text-[#1F2937] italic">
                  {cargandoStats ? "..." : estadisticas.promedio}
                  <span className="text-slate-400 font-bold text-xs ml-1">
                    ({cargandoStats ? 0 : estadisticas.totalOpiniones} reseñas)
                  </span>
                </p>
              </div>
            </div>
            <ArrowLeft size={20} className="rotate-180 text-[#063971] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* --- MODAL DE LISTA DE RESEÑAS --- */}
      {mostrarModalResenas && (
        <div className="fixed inset-0 z-[600] bg-[#1F2937]/70 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
          <div className="flex-1 overflow-y-auto mt-20 bg-slate-50 rounded-t-[40px] shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10 rounded-t-[40px]">
              <h3 className="font-black italic uppercase text-[#1F2937] text-lg">Opiniones ({estadisticas.totalOpiniones})</h3>
              <button onClick={() => setMostrarModalResenas(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-[#063971] active:scale-90 transition-all">
                <ArrowLeft size={20} className="rotate-180" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {listaResenas.map((resena) => (
                <div key={resena.id} className="bg-white p-5 rounded-[25px] border border-slate-100 shadow-sm hover:border-[#063971]/20 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#063971]/10 rounded-full flex items-center justify-center border border-[#063971]/20">
                        <User size={16} className="text-[#063971]" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-[#1F2937]">{resena.nombrePasajero || "Pasajero"}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {new Date(resena.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex bg-amber-50 px-2 py-1.5 rounded-xl items-center gap-1 border border-amber-100">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-black text-amber-700">{resena.estrellas}.0</span>
                    </div>
                  </div>
                  {resena.comentario && (
                    <p className="text-[11px] font-bold text-[#1F2937] italic bg-slate-50 p-4 rounded-2xl mt-2 border border-slate-100">
                      "{resena.comentario}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default PerfilPublico;
