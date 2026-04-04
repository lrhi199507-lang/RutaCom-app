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
  
  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);

  const [editando, setEditando] = useState(false);
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);

  const [userData, setUserData] = useState<any>({ nombre: "", saldo: 0, saldoRetenido: 0, telefono: "" });
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
    // RESTAURADO: Se mantiene "Viajes" con V mayúscula
    const q = query(collection(db, "Viajes")); 
    const unsubViajes = onSnapshot(q, (snapshot) => {
      setViajesReales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubViajes();
  }, []);

  const enviarASoporte = () => {
    if (!inputSoporte.trim()) return;
    setMensajesSoporte([...mensajesSoporte, { texto: inputSoporte, fecha: new Date().toLocaleTimeString(), yo: true }]);
    setInputSoporte("");
  };

  const enviarAConductor = () => {
    if (!inputConductor.trim()) return;
    setMensajesConductor([...mensajesConductor, { texto: inputConductor, fecha: new Date().toLocaleTimeString(), yo: true }]);
    setInputConductor("");
  };

  const manejarReserva = async (viaje: any) => {
    if (!viaje || !viaje.id) return;
    const precioViaje = Number(viaje.precio) || 0;
    if (userData.saldo < precioViaje) {
      alert("⚠️ Saldo insuficiente.");
      return;
    }

    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      await updateDoc(userDoc, {
        saldo: userData.saldo - precioViaje,
        saldoRetenido: (userData.saldoRetenido || 0) + precioViaje
      });

      setViajeActivo(viaje);
      setViajeSeleccionado(null);
      setVista('chat_conductor');
      alert("✅ Reserva exitosa. Pago retenido.");
    } catch (e) { alert("Error al reservar."); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <header className="p-6 pt-12 bg-white flex justify-between items-center border-b shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl">R</div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-slate-400 italic">RutaCom Pro</p>
              <p className="text-xs font-bold uppercase">{userData.nombre || "Usuario"}</p>
            </div>
          </div>
          <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
            <Wallet size={12} className="text-blue-400"/><span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {vista === 'inicio' && (
          <div className="p-6 space-y-6 pb-32">
             {viajeActivo && (
               <div onClick={() => setVista('chat_conductor')} className="bg-blue-600 p-5 rounded-[30px] flex items-center justify-between text-white shadow-xl cursor-pointer border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl"><Car size={20}/></div>
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase opacity-70 italic">Viaje en curso</p>
                      <p className="text-xs font-black italic">Chat con {viajeActivo.conductor || viajeActivo.Conductor || viajeActivo.nombre || "Conductor"}</p>
                    </div>
                  </div>
                  <ArrowLeft className="rotate-180" size={18}/>
               </div>
             )}

             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 cursor-pointer" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                <div className="flex-1 text-left"><p className="text-[9px] font-black uppercase text-slate-400">¿A dónde vas?</p><p className="text-sm font-black uppercase">{busqueda || "Seleccionar ciudad"}</p></div>
             </div>

             {mostrarDestinos && (
               <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">{ESTADOS.map(e => (
                 <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="bg-white p-3 rounded-xl font-black text-[9px] uppercase border">{e}</button>
               ))}</div>
             )}

             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 italic text-left ml-2 tracking-widest">Rutas disponibles</p>
                {viajesReales.filter(v => busqueda === "" || (v.destino && v.destino.toLowerCase() === busqueda.toLowerCase())).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-6 rounded-[35px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex gap-4 text-left">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 border"><Car size={24}/></div>
                          <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase italic leading-none mb-1">• {v.destino || "Ruta"}</p>
                            <p className="font-black text-sm uppercase italic text-slate-800">{v.conductor || v.Conductor || v.nombre || "Chofer Profesional"}</p>
                            <p className="text-[9px] font-bold text-slate-400 italic mt-1 uppercase">{v.vehiculo || "Vehículo verificado"}</p>
                          </div>
                        </div>
                        <div className="text-right"><p className="text-xl font-black italic text-blue-600">${v.precio}</p></div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {(vista === 'chat_conductor' || vista === 'chat_soporte') && (
          <div className="h-full flex flex-col bg-white">
            <div className="p-6 pt-12 border-b flex items-center gap-4">
              <button onClick={() => setVista('inicio')} className="p-2 bg-slate-50 rounded-full"><ArrowLeft size={20}/></button>
              <div className="w-11 h-11 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold italic shadow-lg">
                {vista === 'chat_soporte' ? <Headset size={22}/> : (viajeActivo?.conductor || viajeActivo?.Conductor || viajeActivo?.nombre || "C")[0]}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-black uppercase italic leading-none">{vista === 'chat_soporte' ? "Soporte Técnico" : (viajeActivo?.conductor || viajeActivo?.Conductor || viajeActivo?.nombre || "Conductor")}</p>
                <p className="text-[9px] text-green-500 font-black uppercase mt-1 animate-pulse">● En línea ahora</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 text-left">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] border border-slate-100">
                <p className="text-xs font-bold italic text-slate-700 leading-relaxed">
                  {vista === 'chat_soporte' ? "Hola, cuéntanos tu problema." : `Hola, soy ${viajeActivo?.conductor || viajeActivo?.Conductor || viajeActivo?.nombre || 'tu conductor'}. Tengo tu reserva para ${viajeActivo?.destino}.`}
                </p>
              </div>

              {vista === 'chat_conductor' && viajeActivo && (
                <div className="grid grid-cols-2 gap-3 mb-4 animate-in fade-in zoom-in">
                  <button 
                    onClick={async () => {
                      if(window.confirm("¿Cancelar viaje? El dinero volverá a tu saldo.")) {
                        try {
                          const userDoc = doc(db, 'usuarios', user.uid);
                          const monto = Number(viajeActivo.precio);
                          await updateDoc(userDoc, {
                            saldo: (userData.saldo || 0) + monto,
                            saldoRetenido: (userData.saldoRetenido || 0) - monto
                          });
                          setViajeActivo(null); setVista('inicio');
                          alert("Viaje cancelado correctamente.");
                        } catch(e) { alert("Error al cancelar."); }
                      }
                    }}
                    className="py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border italic"
                  >Cancelar Viaje</button>
                  <button 
                    onClick={async () => {
                      if(window.confirm("¿Confirmas encuentro? Se liberará el pago.")) {
                        try {
                          const userDoc = doc(db, 'usuarios', user.uid);
                          await updateDoc(userDoc, { saldoRetenido: (userData.saldoRetenido || 0) - Number(viajeActivo.precio) });
                          setViajeActivo(null); setVista('inicio');
                          alert("¡Buen viaje! Pago liberado.");
                        } catch(e) { alert("Error."); }
                      }
                    }}
                    className="py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg italic"
                  >¡Ya llegué!</button>
                </div>
              )}
              
              {(vista === 'chat_soporte' ? mensajesSoporte : mensajesConductor).map((c, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[85%] shadow-md ${c.yo ? 'bg-blue-600 text-white ml-auto rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border'}`}>
                  <p className="text-xs font-black italic">{c.texto}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-3 items-center bg-white">
              <input type="text" value={vista === 'chat_soporte' ? inputSoporte : inputConductor} onChange={(e) => vista === 'chat_soporte' ? setInputSoporte(e.target.value) : setInputConductor(e.target.value)} placeholder="Escribe aquí..." className="flex-1 bg-slate-100 p-4 rounded-2xl text-xs outline-none font-bold italic"/>
              <button onClick={vista === 'chat_soporte' ? enviarASoporte : enviarAConductor} className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Send size={24}/></button>
            </div>
          </div>
        )}

        {vista === 'perfil' && (
           <div className="p-6 text-center space-y-6 pb-32">
              <div className="w-32 h-32 bg-blue-600 rounded-[40px] mx-auto flex items-center justify-center text-white border-8 border-white shadow-2xl rotate-3 relative">
                <User size={60}/>
                <button onClick={() => setEditando(!editando)} className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2.5 rounded-xl border-4 border-white shadow-lg"><Edit2 size={16}/></button>
              </div>

              <div className="bg-slate-900 p-6 rounded-[35px] text-left shadow-xl flex justify-between items-center relative overflow-hidden">
                 <div className="z-10">
                    <p className="text-[10px] font-black text-blue-400 uppercase italic">Tu Billetera</p>
                    <h3 className="text-2xl font-black text-white italic">${Number(userData.saldo).toFixed(2)}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Retenido: ${Number(userData.saldoRetenido || 0).toFixed(2)}</p>
                 </div>
                 <Wallet className="text-white/10 absolute -right-4 -bottom-4" size={100} />
              </div>

              <div className="bg-white p-8 rounded-[40px] border shadow-sm text-left">
                 <div className="space-y-6">
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Nombre</p>
                       {editando ? <input className="w-full bg-slate-50 p-3 rounded-xl border font-bold" value={formPerfil.nombre} onChange={(e) => setFormPerfil({...formPerfil, nombre: e.target.value})}/> : <p className="font-black italic text-sm text-slate-800">{userData.nombre || "Usuario"}</p>}
                    </div>
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Teléfono</p>
                       {editando ? <input className="w-full bg-slate-50 p-3 rounded-xl border font-bold" value={formPerfil.telefono} onChange={(e) => setFormPerfil({...formPerfil, telefono: e.target.value})}/> : <p className="font-black italic text-sm text-slate-800">{userData.telefono || "Sin registrar"}</p>}
                    </div>
                 </div>
                 {editando && <button onClick={async () => { await updateDoc(doc(db, 'usuarios', user.uid), formPerfil); setEditando(false); }} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-[10px]">Guardar Cambios</button>}
              </div>
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-50 text-red-500 font-black italic uppercase text-[11px] rounded-3xl border border-red-100 flex items-center justify-center gap-3"><LogOut size={16}/> Cerrar Sesión</button>
           </div>
        )}
      </main>

      {/* MODAL DE RESERVA CORREGIDO: Recupera equipaje y puestos */}
      {viajeSeleccionado && !['chat_conductor', 'chat_soporte'].includes(vista) && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-start">
               <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black italic">{(viajeSeleccionado.conductor || viajeSeleccionado.Conductor || viajeSeleccionado.nombre || "C")[0]}</div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic">Conductor Verificado</p>
                    <h2 className="text-2xl font-black italic uppercase text-slate-800 leading-none">{viajeSeleccionado.conductor || viajeSeleccionado.Conductor || viajeSeleccionado.nombre || "Chofer"}</h2>
                  </div>
               </div>
               <button onClick={() => setViajeSeleccionado(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X/></button>
            </div>

            {/* DETALLES DEL VIAJE REINSTAURADOS (Sin tocar) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border text-left">
                    <Briefcase size={16} className="text-blue-600 mb-1"/>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Equipaje</p>
                    <p className="text-xs font-black italic">{viajeSeleccionado.equipaje || "20kg máx."}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border text-left">
                    <Users size={16} className="text-blue-600 mb-1"/>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Puestos</p>
                    <p className="text-xs font-black italic">{viajeSeleccionado.puestos || "Disponibles"}</p>
                </div>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 text-left">
               <p className="text-[9px] font-black text-blue-500 uppercase mb-1">Notas del conductor:</p>
               <p className="text-xs font-bold italic text-slate-600">"{viajeSeleccionado.detallesExtras || "No se aceptan mascotas"}"</p>
            </div>

            <div className="flex gap-3">
               <button onClick={() => {setViajeActivo(viajeSeleccionado); setViajeSeleccionado(null); setVista('chat_conductor');}} className="flex-1 py-5 bg-slate-100 rounded-[22px] font-black text-[10px] uppercase italic text-slate-600">Chat</button>
               <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-5 bg-blue-600 rounded-[22px] font-black text-[10px] uppercase italic text-white shadow-2xl">Confirmar Reserva (${viajeSeleccionado.precio})</button>
            </div>
          </div>
        </div>
      )}

      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <nav className="absolute bottom-6 left-6 right-6 bg-slate-900/95 backdrop-blur-xl rounded-[35px] p-4 flex justify-around items-center z-40 border border-white/10 shadow-2xl">
          <button onClick={() => setVista('inicio')} className={`p-2 transition-all ${vista === 'inicio' ? 'text-blue-400 scale-125' : 'text-slate-50'}`}><Search size={26}/></button>
          <button onClick={() => setVista('chat_soporte')} className={`p-2 transition-all ${vista === 'chat_soporte' ? 'text-blue-400 scale-125' : 'text-slate-50'}`}><Headset size={26}/></button>
          <button onClick={() => setVista('perfil')} className={`p-2 transition-all ${vista === 'perfil' ? 'text-blue-400 scale-125' : 'text-slate-50'}`}><User size={26}/></button>
        </nav>
      )}
    </div>
  );
      }
              
