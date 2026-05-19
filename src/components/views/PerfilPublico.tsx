import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  ArrowLeft, MessageCircle, Phone, ShieldCheck, 
  Star, Music, MessageSquare, User, Car, Trophy, Medal, MapPin, BadgeCheck
} from 'lucide-react';

// --- FUNCIÓN PARA CALCULAR EL NIVEL (RANGO) ---
const calcularNivel = (viajes) => {
  if (viajes < 5) return { titulo: 'NOVATO', color: 'text-slate-500', bg: 'bg-slate-100', icon: <User size={14} /> };
  if (viajes < 15) return { titulo: 'RECURRENTE', color: 'text-blue-600', bg: 'bg-blue-100', icon: <MapPin size={14} /> };
  if (viajes < 50) return { titulo: 'EXPERTO', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Medal size={14} /> };
  return { titulo: 'LEYENDA', color: 'text-purple-600', bg: 'bg-purple-100', icon: <Trophy size={14} /> };
};

const PerfilPublico = ({ conductor, onClose, setToastMessage, setShowToast }: any) => {
  if (!conductor) return null;

  const [estadisticas, setEstadisticas] = useState({
    viajesRealizados: 0,
    promedio: "0.0",
    totalOpiniones: 0
  });
  const [cargandoStats, setCargandoStats] = useState(true);
  const [listaResenas, setListaResenas] = useState([]);
  const [mostrarModalResenas, setMostrarModalResenas] = useState(false);
  
  const nombreMostrar = conductor.nombre || conductor.cN || conductor.conductor || 'Usuario';
  const inicialMostrar = nombreMostrar.charAt(0).toUpperCase();

  useEffect(() => {
    let unmounted = false;
    const idUsuario = conductor.uidConductor || conductor.idCreador || conductor.id;

    if (!idUsuario) {
      setCargandoStats(false);
      return;
    }

    const cargarEstadisticas = async () => {
      try {
        const qViajes = query(collection(db, "Viajes"), where("estado", "==", "finalizado"));
        const snapshotViajes = await getDocs(qViajes);
        let contadorViajes = 0;

        snapshotViajes.forEach((docSnap) => {
          const v = docSnap.data();
          const esConductor = v.uidConductor === idUsuario || v.idCreador === idUsuario;
          const esPasajero = v.pasajeros?.some(p => p.id === idUsuario && p.abordado === true);
          if (esConductor || esPasajero) contadorViajes++;
        });

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
        console.error("Error cargando estadísticas:", error);
        setCargandoStats(false);
      }
    };
    cargarEstadisticas();
    return () => { unmounted = true; };
  }, [conductor]);

  const nivel = calcularNivel(estadisticas.viajesRealizados);

  const manejarClickOpiniones = () => {
    if (estadisticas.totalOpiniones === 0) {
      setToastMessage("Aún no tiene reseñas. ¡Sé el primero en calificar!");
      setShowToast(true);
    } else {
      setMostrarModalResenas(true); 
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* ENCABEZADO */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-[14px] flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-black italic text-lg">{inicialMostrar}</span>
          </div>
          <div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Perfil Público</p>
            <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[150px]">{nombreMostrar}</p>
          </div>
        </div>

        <div className={`${nivel.bg} ${nivel.color} px-3.5 py-2 rounded-[18px] flex items-center gap-2 shadow-sm border border-white`}>
          {nivel.icon}
          <span className="text-[9px] font-black italic uppercase tracking-widest">{nivel.titulo}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 px-6">
        <div className="py-4">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[2px]">Volver</span>
          </button>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center mb-8 relative">
          <div className="w-28 h-28 bg-white rounded-[35px] border-4 border-slate-50 shadow-xl overflow-hidden mb-4 flex items-center justify-center relative">
            {conductor.fotoPerfil ? (
              <img src={conductor.fotoPerfil} className="w-full h-full object-cover" alt="" />
            ) : (
              <User size={40} className="text-slate-200" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2 italic text-center w-full">
            <span className="truncate max-w-[80%]">{nombreMostrar}</span>
            {conductor.identidadVerificada && <BadgeCheck size={26} className="text-green-500 fill-green-100 flex-shrink-0" strokeWidth={2.5} />}
          </h2>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[2px] mt-1 italic">
            {conductor.identidadVerificada ? 'Identidad Verificada' : 'Usuario Nuevo'}
          </p>
        </div>

        {/* ... (resto del cuerpo igual que antes) ... */}
        {/* OPINIONES DINÁMICAS */}
        <div className="mb-32">
          <button onClick={manejarClickOpiniones} className="w-full bg-white border border-slate-100 p-5 rounded-[35px] flex items-center justify-between shadow-sm active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${estadisticas.totalOpiniones > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                <Star size={20} className={estadisticas.totalOpiniones > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Calificación</p>
                <p className="text-base font-black text-slate-800 italic">
                  {cargandoStats ? "..." : estadisticas.promedio}
                  <span className="text-slate-400 font-bold text-xs ml-1">({cargandoStats ? 0 : estadisticas.totalOpiniones} reseñas)</span>
                </p>
              </div>
            </div>
            <ArrowLeft size={20} className="rotate-180 text-blue-600" />
          </button>
        </div>
      </div>
      
      {/* --- MODAL DE LISTA DE RESEÑAS --- */}
      {mostrarModalResenas && (
        <div className="fixed inset-0 z-[600] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
           {/* ... contenido del modal ... */}
        </div>
      )}
    </div>
  );
};
export default PerfilPublico;
