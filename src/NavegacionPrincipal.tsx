import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  doc, onSnapshot, updateDoc, collection, query, arrayUnion 
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Wallet, User, LogOut, Car, X, Briefcase, Users, CheckCircle, Star, Send, ArrowLeft, Phone, Edit2, Save, Headset
} from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [chats, setChats] = useState<any[]>([]); // Para simular mensajes enviados
  const [editando, setEditando] = useState(false);
  
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null); // "Burbuja" de navegación

  const [userData, setUserData] = useState<any>({ 
    nombre: "", saldo: 0, viajesRealizados: 0, telefono: "" 
  });

  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });

  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setFormPerfil({ nombre: data.nombre || "", telefono: data.telefono || "" });
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "Viajes")); 
    const unsubViajes = onSnapshot(q, (snapshot) => {
      setViajesReales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubViajes();
  }, []);

  const enviarMensaje = () => {
    if (!mensaje.trim()) return;
    setChats([...chats, { texto: mensaje, fecha: new Date().toLocaleTimeString(), yo: true }]);
    setMensaje("");
  };

  const guardarPerfil = async () => {
    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      await updateDoc(userDoc, {
        nombre: formPerfil.nombre,
        telefono: formPerfil.telefono
      });
      setEditando(false);
      alert("✅ Perfil actualizado correctamente.");
    } catch (e) { alert("Error al guardar"); }
  };

  const manejarReserva = async (viaje: any) => {
    const costo = Number(viaje.precio) || 0;
    if (userData.saldo < costo) { alert("⚠️ Saldo insuficiente."); return; }

    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      const datosViaje = {
        idViaje: viaje.id,
        destino: viaje.destino || "Sin Destino",
        conductor: viaje.conductor || "Chofer",
        monto: costo,
        estado: "en_espera",
        fecha: new Date().toISOString()
      };

      await updateDoc(userDoc, {
        saldo: userData.saldo - costo,
        historial: arrayUnion(datosViaje)
      });

      setViajeActivo(viaje); // Activamos la burbuja/tarjeta de navegación
      alert(`✅ Reserva realizada. Puedes contactar al conductor ahora.`);
      setViajeSeleccionado(null);
      setVista('chat_conductor');
    } catch (error: any) { alert("Error: " + error.message); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER DINÁMICO */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
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

      <main className="flex-1 overflow-y-auto">
        {vista === 'inicio' && (
          <div className="p-6 space-y-6 pb-24">
             {/* BURBUJA DE VIAJE ACTIVO */}
             {viajeActivo && (
               <div onClick={() => setVista('chat_conductor')} className="bg-blue-600 p-4 rounded-3xl flex items-center justify-between text-white shadow-xl shadow-blue-200 animate-pulse cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Car size={20}/>
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase opacity-70">Viaje en curso</p>
                      <p className="text-xs font-bold italic">Chat con {viajeActivo.conductor}</p>
                    </div>
                  </div>
                  <ArrowLeft className="rotate-180" size={16}/>
               </div>
             )}

             {/* BUSCADOR */}
             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 cursor-pointer" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                <div className="flex-1 text-left"><p className="text-[9px] font-black uppercase text-slate-400">¿A dónde vas?</p><p className="text-sm font-black uppercase">{busqueda || "Seleccionar ciudad"}</p></div>
             </div>

             {mostrarDestinos && (
               <div className="grid grid-cols-2 gap-2">{ESTADOS.map(e => (
                 <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="bg-white p-3 rounded-xl font-black text-[9px] uppercase border active:bg-blue-600 active:text-white transition-colors">{e}</button>
               ))}</div>
             )}

             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 italic text-left">Rutas disponibles</p>
                {viajesReales.filter(v => busqueda === "" || (v.destino && v.destino.toLowerCase() === busqueda.toLowerCase())).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex gap-3 text-left">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><Car size={20}/></div>
                          <div><p className="font-black text-xs uppercase italic">{v.conductor}</p><p className="text-[9px] font-bold text-slate-400 italic mt-1">{v.vehiculo}</p></div>
                        </div>
                        <p className="text-xl font-black italic text-blue-600">${v.precio}</p>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* CHAT CON CONDUCTOR / SOPORTE */}
        {(vista === 'chat_conductor' || vista === 'chat_soporte') && (
          <div className="h-full flex flex-col bg-white">
            <div className="p-6 pt-12 border-b flex items-center gap-4">
              <button onClick={() => setVista('inicio')} className="p-2"><ArrowLeft size={20}/></button>
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold italic">
                {vista === 'chat_soporte' ? <Headset size={20}/> : (viajeActivo?.conductor?.[0] || "C")}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-black uppercase italic leading-none">{vista === 'chat_soporte' ? "Atención al Cliente" : (viajeActivo?.conductor || "Conductor")}</p>
                <p className="text-[9px] text-green-500 font-black uppercase mt-1">● Activo</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] text-left border border-slate-100">
                <p className="text-xs font-medium italic text-slate-700">
                  {vista === 'chat_soporte' ? "Hola, ¿en qué podemos ayudarte hoy?" : `Hola, soy ${viajeActivo?.conductor}. He recibido tu reserva para ${viajeActivo?.destino}.`}
                </p>
              </div>
              {chats.map((c, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${c.yo ? 'bg-blue-600 text-white ml-auto rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border'} text-left`}>
                  <p className="text-xs font-bold italic">{c.texto}</p>
                  <p className={`text-[8px] mt-1 uppercase ${c.yo ? 'text-blue-200' : 'text-slate-300'}`}>{c.fecha}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-2 items-center bg-white">
              <input type="text" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribir..." className="flex-1 bg-slate-100 p-4 rounded-2xl text-xs outline-none font-bold italic"/>
              <button onClick={enviarMensaje} className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90"><Send size={20}/></button>
            </div>
          </div>
        )}

        {/* PERFIL CON EDICIÓN */}
        {vista === 'perfil' && (
           <div className="p-6 text-center space-y-6 pb-32">
              <div className="w-32 h-32 bg-blue-600 rounded-[40px] mx-auto flex items-center justify-center text-white border-8 border-white shadow-2xl rotate-3 relative">
                <User size={60}/>
                <button onClick={() => setEditando(!editando)} className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl border-4 border-white"><Edit2 size={16}/></button>
              </div>

              <div className="bg-white p-8 rounded-[40px] border shadow-sm text-left">
                 <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Información Personal</p>
                    {editando && <button onClick={guardarPerfil} className="flex items-center gap-1 text-blue-600 text-[10px] font-black uppercase"><Save size={14}/> Guardar</button>}
                 </div>
                 <div className="space-y-6">
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Nombre</p>
                       {editando ? (
                         <input className="w-full bg-slate-50 p-2 rounded-lg font-black text-sm italic outline-blue-600 border" value={formPerfil.nombre} onChange={(e) => setFormPerfil({...formPerfil, nombre: e.target.value})}/>
                       ) : ( <p className="font-black italic text-sm uppercase text-slate-800">{userData.nombre || "Propietario"}</p> )}
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Teléfono</p>
                       {editando ? (
                         <input className="w-full bg-slate-50 p-2 rounded-lg font-black text-sm italic outline-blue-600 border" value={formPerfil.telefono} onChange={(e) => setFormPerfil({...formPerfil, telefono: e.target.value})}/>
                       ) : ( <p className="font-black italic text-sm text-slate-800">{userData.telefono || "Sin registrar"}</p> )}
                    </div>
                 </div>
              </div>

              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-50 text-red-500 font-black italic uppercase text-[11px] rounded-3xl flex items-center justify-center gap-3 active:bg-red-500 active:text-white transition-all shadow-sm"><LogOut size={16}/> Cerrar Sesión Segura</button>
           </div>
        )}
      </main>

      {/* MODAL DE DETALLES */}
      {viajeSeleccionado && !['chat_conductor', 'chat_soporte'].includes(vista) && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-start">
               <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black italic shadow-2xl">{viajeSeleccionado.conductor?.[0] || "C"}</div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic">Conductor Verificado</p>
                    <h2 className="text-2xl font-black italic uppercase text-slate-800 leading-none">{viajeSeleccionado.conductor}</h2>
                  </div>
               </div>
               <button onClick={() => setViajeSeleccionado(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><X/></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                  <Briefcase size={16} className="text-blue-600 mb-3"/><p className="text-[9px] font-black text-slate-400 uppercase">Equipaje</p><p className="text-xs font-black italic">{viajeSeleccionado.aceptaMaleta ? `${viajeSeleccionado.kilosMaleta}kg máx.` : "No permitido"}</p>
               </div>
               <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                  <Users size={16} className="text-blue-600 mb-3"/><p className="text-[9px] font-black text-slate-400 uppercase">Puestos</p><p className="text-xs font-black italic">{viajeSeleccionado.puestos} Libres</p>
               </div>
            </div>

            <div className="flex gap-3 pt-4">
               <button onClick={() => {setViajeActivo(viajeSeleccionado); setViajeSeleccionado(null); setVista('chat_conductor');}} className="flex-1 py-5 bg-slate-100 rounded-[22px] font-black text-[10px] uppercase italic text-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-95"><MessageCircle size={18}/> Chat</button>
               <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-5 bg-blue-600 rounded-[22px] font-black text-[10px] uppercase italic text-white shadow-2xl shadow-blue-200 flex items-center justify-center gap-2 transition-transform active:scale-95"><CheckCircle size={18}/> Reservar (${viajeSeleccionado.precio})</button>
            </div>
          </div>
        </div>
      )}

      {/* NAV INFERIOR PROFESIONAL */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <nav className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl rounded-[30px] p-4 flex justify-around items-center z-40 border border-white/10 shadow-2xl shadow-blue-900/20">
          <button onClick={() => setVista('inicio')} className={`p-2 transition-all ${vista === 'inicio' ? 'text-blue-400 scale-125' : 'text-slate-500'}`}><Search size={24}/></button>
          <button onClick={() => setVista('chat_soporte')} className={`p-2 transition-all ${vista === 'chat_soporte' ? 'text-blue-400 scale-125' : 'text-slate-500'}`}><Headset size={24}/></button>
          <button onClick={() => setVista('perfil')} className={`p-2 transition-all ${vista === 'perfil' ? 'text-blue-400 scale-125' : 'text-slate-500'}`}><User size={24}/></button>
        </nav>
      )}
    </div>
  );
  }
                  
