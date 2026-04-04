import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  doc, onSnapshot, updateDoc, collection, query, arrayUnion 
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Wallet, User, LogOut, Car, X, Briefcase, Users, CheckCircle, Star
} from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [userData, setUserData] = useState({ 
    nombre: "", saldo: 0, viajesRealizados: 0 
  });

  // 1. ESCUCHAR DATOS DEL USUARIO
  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) setUserData(snap.data() as any);
    });
    return () => unsub();
  }, [user]);

  // 2. ESCUCHAR VIAJES (Colección "Viajes")
  useEffect(() => {
    const q = query(collection(db, "Viajes")); 
    const unsubViajes = onSnapshot(q, (snapshot) => {
      setViajesReales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubViajes();
  }, []);

  // 3. LÓGICA DE RESERVA
  const manejarReserva = async (viaje: any) => {
    const costo = Number(viaje.precio) || 0;
    if (userData.saldo < costo) {
      alert("⚠️ Saldo insuficiente.");
      return;
    }

    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      await updateDoc(userDoc, {
        saldo: userData.saldo - costo,
        viajesRealizados: (userData.viajesRealizados || 0) + 1,
        historial: arrayUnion({
          idViaje: viaje.id,
          destino: viaje.destino || "Destino",
          fecha: new Date().toISOString()
        })
      });
      alert(`✅ Reserva confirmada para ${viaje.destino}`);
      setViajeSeleccionado(null);
    } catch (error) {
      alert("Error: " + error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="p-6 pt-12 bg-white flex justify-between items-center border-b shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl shadow-lg">R</div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-400 italic">RutaCom Pro</p>
            <p className="text-xs font-bold uppercase">{userData.nombre || "Usuario"}</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
          <Wallet size={12} className="text-blue-400"/>
          <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        {vista === 'inicio' && (
          <div className="space-y-6">
             {/* BUSCADOR */}
             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 cursor-pointer" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black uppercase text-slate-400">¿A dónde vas?</p>
                  <p className="text-sm font-black uppercase">{busqueda || "Seleccionar ciudad"}</p>
                </div>
             </div>

             {mostrarDestinos && (
               <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in">
                 {ESTADOS.map(e => (
                   <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="bg-white p-3 rounded-xl font-black text-[9px] uppercase border active:bg-blue-600 active:text-white">{e}</button>
                 ))}
               </div>
             )}

             {/* LISTA DE VIAJES */}
             <div className="space-y-4">
                {viajesReales.filter(v => busqueda === "" || (v.destino && v.destino.toLowerCase() === busqueda.toLowerCase())).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex gap-3 text-left">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Car size={20}/></div>
                          <div>
                              <p className="font-black text-xs uppercase italic">{v.conductor || "Conductor"}</p>
                              <p className="text-[9px] font-bold text-slate-400 italic mt-1">{v.vehiculo || "Vehículo"}</p>
                          </div>
                        </div>
                        <p className="text-xl font-black italic text-blue-600">${v.precio || 0}</p>
                    </div>
                ))}
             </div>
          </div>
        )}

        {vista === 'perfil' && (
           <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-blue-600 border-4 border-white shadow-xl"><User size={40}/></div>
              <div className="bg-white p-6 rounded-[30px] border shadow-sm text-left">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-4 italic">Mi Cuenta</p>
                 <div className="space-y-4">
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Nombre de Usuario</p>
                       <p className="font-black italic text-sm uppercase">{userData.nombre}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Viajes Completados</p>
                       <p className="font-black italic text-sm text-blue-600">{userData.viajesRealizados || 0} Viajes</p>
                    </div>
                 </div>
              </div>
              <button onClick={() => auth.signOut()} className="w-full py-4 text-red-500 font-black italic uppercase text-[10px] border border-red-50 rounded-2xl flex items-center justify-center gap-2">
                <LogOut size={14}/> Cerrar Sesión
              </button>
           </div>
        )}
      </main>

      {/* MODAL DE DETALLES (BLINDADO CONTRA ERRORES) */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[40px] p-8 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-start">
               <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black italic shadow-2xl uppercase">
                    {viajeSeleccionado.conductor ? viajeSeleccionado.conductor[0] : "C"}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic tracking-widest">Conductor Verificado</p>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{viajeSeleccionado.conductor || "Chofer"}</h2>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} fill={star <= (viajeSeleccionado.rating || 5) ? "#facc15" : "none"} className={star <= (viajeSeleccionado.rating || 5) ? "text-yellow-400" : "text-slate-200"}/>
                      ))}
                      <span className="text-[10px] font-black text-slate-400 ml-1">({viajeSeleccionado.rating || "5.0"})</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setViajeSeleccionado(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><X/></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <Briefcase size={16} className="text-blue-600 mb-2"/>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Equipaje</p>
                  <p className="text-xs font-black italic">{viajeSeleccionado.aceptaMaleta ? `${viajeSeleccionado.kilosMaleta || 0}kg máx.` : "No permitido"}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <Users size={16} className="text-blue-600 mb-2"/>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Disponibilidad</p>
                  <p className="text-xs font-black italic">{viajeSeleccionado.puestos || 0} Puestos</p>
               </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-left">
               <p className="text-[9px] font-bold text-blue-400 uppercase mb-1 italic">Nota del conductor:</p>
               {/* AQUÍ CORREGÍ EL NOMBRE DEL CAMPO PARA QUE LEA "detallesExtras" O "detallesExtra" */}
               <p className="text-xs font-medium italic text-slate-600">"{viajeSeleccionado.detallesExtras || viajeSeleccionado.detallesExtra || "Buen viaje asegurado."}"</p>
            </div>

            <div className="flex gap-3 pt-4">
               <button onClick={() => setVista('chat')} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase italic text-slate-600 flex items-center justify-center gap-2"><MessageCircle size={16}/> Chat</button>
               <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase italic text-white shadow-xl flex items-center justify-center gap-2"><CheckCircle size={16}/> Reservar (${viajeSeleccionado.precio || 0})</button>
            </div>
          </div>
        </div>
      )}

      {/* NAV INFERIOR */}
      <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-full p-4 flex justify-around items-center z-40 border shadow-2xl">
        <button onClick={() => setVista('inicio')} className={`${vista === 'inicio' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}><Search size={22}/></button>
        <button onClick={() => setVista('chat')} className={`${vista === 'chat' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}><MessageCircle size={22}/></button>
        <button onClick={() => setVista('perfil')} className={`${vista === 'perfil' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}><User size={22}/></button>
      </nav>
    </div>
  );
}
