import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  doc, onSnapshot, setDoc, updateDoc, collection, query, arrayUnion 
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Wallet, User, LogOut, Send, Save, Car, X, Briefcase, Users, CheckCircle, Star
} from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  
  // Estados de datos
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [userData, setUserData] = useState({ 
    nombre: "", telefono: "", saldo: 0, viajesRealizados: 0 
  });
  const [editando, setEditando] = useState(false);

  // 1. ESCUCHAR DATOS DEL USUARIO (PERFIL)
  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) setUserData(snap.data() as any);
    });
    return () => unsub();
  }, [user]);

  // 2. ESCUCHAR VIAJES REALES DESDE FIREBASE
  useEffect(() => {
    const q = query(collection(db, "Viajes")); 
    const unsubViajes = onSnapshot(q, (snapshot) => {
      setViajesReales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubViajes();
  }, []);

  // 3. LÓGICA DE RESERVA Y VALIDACIÓN DE SALDO
  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio) {
      alert("⚠️ Saldo insuficiente. Por favor, recarga tu cuenta.");
      return;
    }

    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      await updateDoc(userDoc, {
        saldo: userData.saldo - viaje.precio,
        viajesRealizados: (userData.viajesRealizados || 0) + 1,
        historial: arrayUnion({
          idViaje: viaje.id,
          destino: viaje.destino,
          conductor: viaje.conductor,
          fecha: new Date().toISOString()
        })
      });
      alert(`✅ ¡Reserva confirmada para ${viaje.destino}!`);
      setViajeSeleccionado(null);
    } catch (error) {
      alert("Error al procesar reserva: " + error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden font-sans flex flex-col">
      
      {/* HEADER DINÁMICO */}
      <header className="p-6 pt-12 bg-white flex justify-between items-center border-b shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-blue-100 text-center">R</div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-400 italic">RutaCom Pro</p>
            <p className="text-xs font-bold uppercase tracking-tighter">{userData.nombre || "Cargando..."}</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
          <Wallet size={12} className="text-blue-400"/>
          <span className="text-[11px] font-black italic">${userData.saldo.toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        {vista === 'inicio' && (
          <div className="space-y-6">
             {/* BUSCADOR */}
             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 active:bg-slate-50" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black uppercase text-slate-400 italic">¿A dónde vas?</p>
                  <p className="text-sm font-black uppercase">{busqueda || "Seleccionar ciudad"}</p>
                </div>
             </div>

             {mostrarDestinos && (
               <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                 {ESTADOS.map(e => (
                   <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="bg-white p-3 rounded-xl font-black text-[9px] uppercase border shadow-sm active:bg-blue-600 active:text-white transition-colors">{e}</button>
                 ))}
               </div>
             )}

             {/* LISTA DE VIAJES REALES */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase italic px-2">Rutas Disponibles</p>
                {viajesReales.length === 0 ? (
                  <div className="text-center py-10 italic text-slate-400 text-xs">No hay viajes publicados...</div>
                ) : (
                  viajesReales.filter(v => busqueda === "" || v.destino === busqueda).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex gap-3 text-left">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Car size={20}/></div>
                          <div>
                              <p className="font-black text-xs uppercase italic tracking-tight">{v.conductor}</p>
                              <p className="text-[9px] font-bold text-slate-400 italic mt-1">{v.vehiculo} • {v.destino}</p>
                          </div>
                        </div>
                        <p className="text-xl font-black italic text-blue-600">${v.precio}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {/* VISTA DE PERFIL */}
        {vista === 'perfil' && (
           <div className="text-center space-y-6 animate-in fade-in">
              <div className="w-24 h-24 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-blue-600 border-4 border-white shadow-xl"><User size={40}/></div>
              <div className="bg-white p-6 rounded-[30px] border shadow-sm text-left space-y-4">
                 <div className="flex justify-between items-center border-b pb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">Mi Cuenta</p>
                    <button onClick={() => editando ? setEditando(false) : setEditando(true)} className="text-blue-600 text-[10px] font-black uppercase italic">{editando ? "Cerrar" : "Editar Perfil"}</button>
                 </div>
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Nombre</p>
                    <p className="font-black italic text-sm">{userData.nombre}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-4">Teléfono</p>
                    <p className="font-black italic text-sm">{userData.telefono || "No registrado"}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-4">Viajes Realizados</p>
                    <p className="font-black italic text-sm text-blue-600">{userData.viajesRealizados || 0} viajes</p>
                 </div>
              </div>
              <button onClick={() => auth.signOut()} className="w-full py-4 text-red-500 font-black italic uppercase text-[10px] border border-red-50 rounded-2xl flex items-center justify-center gap-2">
                <LogOut size={14}/> Salir de la App
              </button>
           </div>
        )}
      </main>

      {/* MODAL DE DETALLES DEL VIAJE (CON ESTRELLAS) */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[40px] p-8 space-y-6 animate-in slide-in-from-bottom duration-300">
            
            <div className="flex justify-between items-start">
               <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black italic shadow-2xl shadow-blue-200 uppercase">
                    {viajeSeleccionado.conductor[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic tracking-widest">Conductor Pro</p>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{viajeSeleccionado.conductor}</h2>
                    
                    {/* ESTRELLAS DORADAS */}
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={12} 
                          fill={star <= (viajeSeleccionado.rating || 5) ? "#facc15" : "none"} 
                          className={star <= (viajeSeleccionado.rating || 5) ? "text-yellow-400" : "text-slate-200"}
                        />
                      ))}
                      <span className="text-[10px] font-black text-slate-400 ml-1">({viajeSeleccionado.rating || "5.0"})</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setViajeSeleccionado(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-200"><X/></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <Briefcase size={16} className="text-blue-600 mb-2"/>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Equipaje</p>
                  <p className="text-xs font-black italic">{viajeSeleccionado.aceptaMaleta ? `${viajeSeleccionado.kilosMaleta}kg max.` : "Sin maleta"}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <Users size={16} className="text-blue-600 mb-2"/>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Disponibilidad</p>
                  <p className="text-xs font-black italic">{viajeSeleccionado.puestos} Puestos</p>
               </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-left">
               <p className="text-[9px] font-bold text-blue-400 uppercase mb-1 italic">Condiciones del viaje:</p>
               <p className="text-xs font-medium italic text-slate-600">"{viajeSeleccionado.detallesExtra || "Sin comentarios adicionales por el conductor."}"</p>
            </div>

            <div className="flex gap-3 pt-4">
               <button onClick={() => setVista('chat')} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase italic text-slate-600 flex items-center justify-center gap-2">
                 <MessageCircle size={16}/> Chat
               </button>
               <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase italic text-white shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                 <CheckCircle size={16}/> Confirmar Reserva (${viajeSeleccionado.precio})
               </button>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR */}
      <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-full p-4 flex justify-around items-center z-40 border shadow-2xl">
        <button onClick={() => setVista('inicio')} className={`${vista === 'inicio' ? 'text-blue-600 scale-110' : 'text-slate-300'} transition-all`}><Search size={22}/></button>
        <button onClick={() => setVista('chat')} className={`${vista === 'chat' ? 'text-blue-600 scale-110' : 'text-slate-300'} transition-all`}><MessageCircle size={22}/></button>
        <button onClick={() => setVista('perfil')} className={`${vista === 'perfil' ? 'text-blue-600 scale-110' : 'text-slate-300'} transition-all`}><User size={22}/></button>
      </nav>
    </div>
  );
            }
             
