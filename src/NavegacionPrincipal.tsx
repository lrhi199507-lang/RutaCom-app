import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  doc, onSnapshot, updateDoc, collection, query, arrayUnion 
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Wallet, User, LogOut, Car, X, Briefcase, Users, CheckCircle, Star, Send, ArrowLeft, Phone
} from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [userData, setUserData] = useState<any>({ 
    nombre: "", saldo: 0, viajesRealizados: 0, telefono: "" 
  });

  // Escuchar datos del usuario en tiempo real
  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });
    return () => unsub();
  }, [user]);

  // Escuchar viajes disponibles
  useEffect(() => {
    const q = query(collection(db, "Viajes")); 
    const unsubViajes = onSnapshot(q, (snapshot) => {
      setViajesReales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubViajes();
  }, []);

  const manejarReserva = async (viaje: any) => {
    const costo = Number(viaje.precio) || 0;
    
    if (userData.saldo < costo) {
      alert("⚠️ Saldo insuficiente.");
      return;
    }

    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      
      // FIX: Aseguramos que no haya valores 'undefined' para evitar el error de arrayUnion
      const datosViaje = {
        idViaje: viaje.id || "ID_DESCONOCIDO",
        destino: viaje.destino || "Sin Destino",
        conductor: viaje.conductor || "Chofer",
        monto: costo,
        estado: "espera_confirmacion",
        fecha: new Date().toISOString()
      };

      await updateDoc(userDoc, {
        saldo: userData.saldo - costo,
        historial: arrayUnion(datosViaje)
      });

      alert(`✅ ¡Reserva exitosa! Se han retenido $${costo}.`);
      setViajeSeleccionado(null);
    } catch (error: any) {
      console.error("Error en reserva:", error);
      alert("Error técnico: " + error.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER (Se oculta en el chat activo) */}
      {vista !== 'chat_activo' && (
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
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {vista === 'inicio' && (
          <div className="p-6 space-y-6">
             {/* BUSCADOR */}
             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 cursor-pointer" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black uppercase text-slate-400">¿A dónde vas?</p>
                  <p className="text-sm font-black uppercase">{busqueda || "Seleccionar ciudad"}</p>
                </div>
             </div>

             {mostrarDestinos && (
               <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in duration-200">
                 {ESTADOS.map(e => (
                   <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="bg-white p-3 rounded-xl font-black text-[9px] uppercase border active:bg-blue-600 active:text-white transition-colors">{e}</button>
                 ))}
               </div>
             )}

             {/* LISTA DE VIAJES DISPONIBLES */}
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 italic text-left ml-2">Rutas disponibles</p>
                {viajesReales.filter(v => busqueda === "" || (v.destino && v.destino.toLowerCase() === busqueda.toLowerCase())).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex gap-3 text-left">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><Car size={20}/></div>
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

        {/* PANTALLA DE CHAT ACTIVO */}
        {vista === 'chat_activo' && (
          <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
            <div className="p-6 pt-12 border-b flex items-center gap-4">
              <button onClick={() => setVista('inicio')} className="p-2"><ArrowLeft size={20}/></button>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold italic text-lg shadow-lg">
                {viajeSeleccionado?.conductor?.[0] || "C"}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-black uppercase italic leading-none">{viajeSeleccionado?.conductor || "Conductor"}</p>
                <p className="text-[9px] text-green-500 font-black uppercase mt-1">● En línea</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] text-left border border-slate-100">
                <p className="text-xs font-medium italic text-slate-700">Hola, ¿en qué parte de {viajeSeleccionado?.destino || "la ciudad"} te encuentras para recogerte?</p>
                <p className="text-[8px] text-slate-300 mt-2 font-bold uppercase text-right">10:45 AM</p>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2 items-center bg-white">
              <input 
                type="text" 
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribir mensaje..." 
                className="flex-1 bg-slate-100 p-4 rounded-2xl text-xs outline-none font-bold italic"
              />
              <button className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 active:scale-90 transition-transform">
                <Send size={20}/>
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA DE PERFIL RECONSTRUIDA */}
        {vista === 'perfil' && (
           <div className="p-6 text-center space-y-6 animate-in fade-in duration-500">
              <div className="relative w-32 h-32 mx-auto">
                <div className="w-32 h-32 bg-blue-600 rounded-[40px] mx-auto flex items-center justify-center text-white border-8 border-white shadow-2xl rotate-3">
                  <User size={60}/>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white shadow-lg"></div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border shadow-sm text-left relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12"></div>
                 <p className="text-[10px] font-black text-slate-300 uppercase mb-6 italic tracking-widest relative">Información de Perfil</p>
                 <div className="space-y-6 relative">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><User size={18}/></div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Nombre Completo</p>
                          <p className="font-black italic text-sm uppercase text-slate-800">{userData.nombre || "No definido"}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><Phone size={18}/></div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Teléfono Móvil</p>
                          <p className="font-black italic text-sm text-slate-800">{userData.telefono || "Sin registrar"}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><CheckCircle size={18}/></div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Estado de la cuenta</p>
                          <p className="font-black italic text-[10px] text-green-500 uppercase">Activo y Verificado</p>
                       </div>
                    </div>
                 </div>
              </div>

              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-50 text-red-500 font-black italic uppercase text-[11px] rounded-3xl flex items-center justify-center gap-3 border border-red-100 active:bg-red-500 active:text-white transition-all shadow-sm">
                <LogOut size={16}/> Cerrar Sesión Segura
              </button>
           </div>
        )}
      </main>

      {/* MODAL DE DETALLES DEL VIAJE */}
      {viajeSeleccionado && vista !== 'chat_activo' && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2"></div>
            <div className="flex justify-between items-start">
               <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black italic shadow-2xl">
                    {viajeSeleccionado.conductor ? viajeSeleccionado.conductor[0] : "C"}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic tracking-widest">Conductor Pro</p>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-slate-800">{viajeSeleccionado.conductor || "Chofer"}</h2>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} fill={star <= (viajeSeleccionado.rating || 5) ? "#facc15" : "none"} className={star <= (viajeSeleccionado.rating || 5) ? "text-yellow-400" : "text-slate-200"}/>
                      ))}
                      <span className="text-[10px] font-black text-slate-400 ml-1">({viajeSeleccionado.rating || "5.0"})</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setViajeSeleccionado(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"><X/></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                  <Briefcase size={16} className="text-blue-600 mb-3"/>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Equipaje</p>
                  <p className="text-xs font-black italic text-slate-700">{viajeSeleccionado.aceptaMaleta ? `${viajeSeleccionado.kilosMaleta || 0}kg máx.` : "No permitido"}</p>
               </div>
               <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                  <Users size={16} className="text-blue-600 mb-3"/>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Puestos</p>
                  <p className="text-xs font-black italic text-slate-700">{viajeSeleccionado.puestos || 0} Disponibles</p>
               </div>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 text-left">
               <p className="text-[9px] font-black text-blue-500 uppercase mb-2 italic tracking-tighter">Condiciones del viaje:</p>
               <p className="text-xs font-bold italic text-slate-600 leading-relaxed">"{viajeSeleccionado.detallesExtras || "Vehículo en óptimas condiciones, puntualidad garantizada."}"</p>
            </div>

            <div className="flex gap-3 pt-4">
               <button 
                 onClick={() => setVista('chat_activo')} 
                 className="flex-1 py-5 bg-slate-100 rounded-[22px] font-black text-[10px] uppercase italic text-slate-600 flex items-center justify-center gap-2 active:scale-95 transition-transform"
               >
                 <MessageCircle size={18}/> Chat
               </button>
               <button 
                 onClick={() => manejarReserva(viajeSeleccionado)} 
                 className="flex-[2] py-5 bg-blue-600 rounded-[22px] font-black text-[10px] uppercase italic text-white shadow-2xl shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
               >
                 <CheckCircle size={18}/> Reservar (${viajeSeleccionado.precio || 0})
               </button>
            </div>
          </div>
        </div>
      )}

      {/* NAV INFERIOR (Oculto en chat activo) */}
      {vista !== 'chat_activo' && (
        <nav className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl rounded-[30px] p-4 flex justify-around items-center z-40 border border-white/10 shadow-2xl shadow-blue-900/20">
          <button onClick={() => setVista('inicio')} className={`p-2 transition-all ${vista === 'inicio' ? 'text-blue-400 scale-125' : 'text-slate-500'}`}><Search size={24}/></button>
          <button onClick={() => setVista('chat_activo')} className={`p-2 transition-all ${vista === 'chat_activo' ? 'text-blue-400 scale-125' : 'text-slate-500'}`}><MessageCircle size={24}/></button>
          <button onClick={() => setVista('perfil')} className={`p-2 transition-all ${vista === 'perfil' ? 'text-blue-400 scale-125' : 'text-slate-500'}`}><User size={24}/></button>
        </nav>
      )}
    </div>
  );
}
