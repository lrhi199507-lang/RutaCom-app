import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, User, ShieldCheck, Star, BadgeCheck, Car, Navigation, Quote } from 'lucide-react';

export const PerfilUsuarioDetalle = ({ uid, onClose }) => {
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  
  // Estados para Reseñas
  const [estadisticas, setEstadisticas] = useState({ promedio: "0.0", total: 0 });
  const [listaResenas, setListaResenas] = useState<any[]>([]);
  const [mostrarResenas, setMostrarResenas] = useState(false);

  useEffect(() => {
    let unmounted = false;

    const fetchDatos = async () => {
      if (!uid) return;
      try {
        // 1. Obtener datos del usuario
        const userRef = doc(db, "usuarios", uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUsuario({ id: userSnap.id, ...userSnap.data() });
        }

        // 2. Obtener Reseñas recibidas (idConductor guarda el ID del destinatario en nuestra lógica)
        const qResenas = query(collection(db, "Resenas"), where("idConductor", "==", uid));
        const snapshotResenas = await getDocs(qResenas);
        
        let sumaEstrellas = 0;
        let total = 0;
        let resenasObtenidas: any[] = [];

        snapshotResenas.forEach((docSnap) => {
          const data = docSnap.data();
          sumaEstrellas += data.estrellas || 0;
          total++;
          resenasObtenidas.push({ id: docSnap.id, ...data });
        });

        // Ordenar reseñas de más nuevas a más viejas
        resenasObtenidas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        if (!unmounted) {
          setEstadisticas({
            promedio: total > 0 ? (sumaEstrellas / total).toFixed(1) : "0.0",
            total: total
          });
          setListaResenas(resenasObtenidas);
          setCargando(false);
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
        if (!unmounted) setCargando(false);
      }
    };

    fetchDatos();
    return () => { unmounted = true; };
  }, [uid]);

  // Lógica de Niveles compartida
  const obtenerRango = (totalViajes) => {
    if (totalViajes >= 50) return { nombre: "LEYENDA", color: "bg-slate-900" };
    if (totalViajes >= 20) return { nombre: "ORO", color: "bg-yellow-500" };
    if (totalViajes >= 10) return { nombre: "PLATA", color: "bg-slate-400" };
    return { nombre: "NOVATO", color: "bg-blue-600" };
  };

  if (cargando) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center animate-in fade-in">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-[3px] animate-pulse">Cargando Perfil...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center p-6">
        <p className="text-sm font-black text-slate-500 uppercase text-center">Usuario no encontrado</p>
        <button onClick={onClose} className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Volver</button>
      </div>
    );
  }

  const viajesCond = usuario.viajesRealizados || 0;
  const viajesPas = usuario.viajesComoPasajero || 0;
  const totalTrayectoria = viajesCond + viajesPas;
  const rango = obtenerRango(totalTrayectoria);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col font-sans animate-in slide-in-from-bottom duration-300">
      
      {/* HEADER FLOTANTE */}
      <div className="p-4 pt-6 flex justify-between items-center sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 border-b border-slate-100">
        <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-500 active:scale-90 transition-all">
          <ArrowLeft size={18} />
        </button>
        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[3px]">Perfil Público</p>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-4">
        
        {/* TARJETA PRINCIPAL DE PERFIL */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center relative mt-4">
          <div className={`absolute -top-4 ${rango.color} text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[3px] shadow-lg shadow-black/10`}>
            Nivel {rango.nombre}
          </div>

          <div className="w-28 h-28 bg-slate-100 rounded-[35px] border-4 border-white shadow-xl overflow-hidden mb-5 flex items-center justify-center mt-2">
            {usuario.fotoPerfil ? (
              <img src={usuario.fotoPerfil} className="w-full h-full object-cover" alt="Perfil" />
            ) : (
              <span className="text-slate-300 font-black italic text-4xl">{usuario.nombre?.charAt(0) || "U"}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter text-center">{usuario.nombre || "Usuario"}</h2>
            {usuario.kycVerificado && <BadgeCheck size={22} className="text-green-500 fill-green-100" />}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Miembro de la comunidad</p>

          <div className="flex w-full justify-center gap-8 mt-6 border-t border-slate-50 pt-5">
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Como Chofer</p>
              <p className="font-black text-blue-600 italic text-lg leading-none">{viajesCond} <span className="text-[10px]">VJS</span></p>
            </div>
            <div className="w-px bg-slate-100"></div>
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Como Pasajero</p>
              <p className="font-black text-orange-500 italic text-lg leading-none">{viajesPas} <span className="text-[10px]">VJS</span></p>
            </div>
          </div>
        </div>

        {/* BIO Y PREFERENCIAS */}
        {usuario.bio && (
          <div className="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100/50 relative">
            <Quote size={24} className="text-blue-200 absolute top-4 right-4 rotate-180" />
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Sobre Mí</p>
            <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"{usuario.bio}"</p>
          </div>
        )}

        {/* REPUTACIÓN (BOTÓN PARA VER RESEÑAS) */}
        <button 
          onClick={() => estadisticas.total > 0 && setMostrarResenas(true)}
          className={`w-full bg-white border border-slate-100 p-5 rounded-[30px] flex items-center justify-between shadow-sm transition-all ${estadisticas.total > 0 ? 'active:scale-95 cursor-pointer' : 'cursor-default opacity-80'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${estadisticas.total > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <Star size={24} className={estadisticas.total > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-300 fill-slate-200'} />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Reputación Total</p>
              <p className="text-lg font-black text-slate-800 italic leading-none">
                {estadisticas.promedio}
                <span className="text-slate-400 font-bold text-[10px] ml-2 tracking-widest">
                  ({estadisticas.total} OPINIONES)
                </span>
              </p>
            </div>
          </div>
          {estadisticas.total > 0 && <ArrowLeft size={18} className="rotate-180 text-blue-600" />}
        </button>

      </div>

      {/* --- MODAL INTERNO DE RESEÑAS --- */}
      {mostrarResenas && (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 pt-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
            <button onClick={() => setMostrarResenas(false)} className="w-10 h-10 bg-slate-50 rounded-full text-slate-500 active:scale-90 transition-all flex items-center justify-center">
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-black italic uppercase text-slate-800 text-sm tracking-widest">Opiniones ({estadisticas.total})</h3>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
            {listaResenas.map((resena) => (
              <div key={resena.id} className="bg-white p-5 rounded-[25px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center border border-blue-100">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-800">{resena.nombrePasajero || "Usuario"}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(resena.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-amber-50 px-2.5 py-1 rounded-xl items-center gap-1 border border-amber-100">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-[11px] font-black text-amber-700">{resena.estrellas}.0</span>
                  </div>
                </div>
                {resena.comentario && (
                  <p className="text-[11px] font-bold text-slate-600 italic bg-slate-50 p-4 rounded-[20px] border border-slate-100 mt-2">
                    "{resena.comentario}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
            
