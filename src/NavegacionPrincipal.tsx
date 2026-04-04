import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  doc, onSnapshot, updateDoc, collection, query, addDoc, serverTimestamp 
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Wallet, User, LogOut, Car, X, Briefcase, Users, CheckCircle, Star, Send, ArrowLeft, Phone, Edit2, Save, Headset, PlusCircle
} from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [modo, setModo] = useState('pasajero');
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

  const [formViaje, setFormViaje] = useState({
    destino: "",
    precio: "",
    modeloAuto: "",
    placa: "",
    puestos: "4",
    detalles: ""
  });

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

  const publicarViaje = async () => {
    if (!formViaje.destino || !formViaje.precio || !formViaje.modeloAuto) {
      alert("⚠️ Completa los campos obligatorios");
      return;
    }
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Chófer",
        destino: formViaje.destino,
        precio: Number(formViaje.precio),
        vehiculo: formViaje.modeloAuto,
        placa: formViaje.placa,
        puestos: Number(formViaje.puestos),
        detallesExtras: formViaje.detalles,
        idCreador: user.uid,
        fecha: serverTimestamp()
      });
      alert("✅ Ruta publicada correctamente");
      setModo('pasajero');
    } catch (e) { 
      alert("❌ Error al publicar. Inténtalo de nuevo."); 
    }
  };

  const manejarReserva = async (viaje: any) => {
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
    } catch (e) { 
      alert("Error al reservar."); 
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${modo === 'chofer' ? 'bg-green-600' : 'bg-blue-600'} rounded-xl flex items-center justify-center text-white font-black italic text-xl shadow-lg`}>R</div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 italic">RutaCom {modo === 'chofer' ? 'CHÓFER' : 'PRO'}</p>
                <p className="text-xs font-bold uppercase">{userData.nombre || "Usuario"}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
              <Wallet size={12} className="text-blue-400"/><span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === 'pasajero' ? 'chofer' : 'pasajero')} className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${modo === 'chofer' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
            {modo === 'pasajero' ? "Cambiar a Modo Chófer" : "Volver a Modo Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* INICIO PASAJERO */}
        {vista === 'inicio' && modo === 'pasajero' && (
          <div className="p-6 space-y-6 pb-32">
             <div className="relative">
                <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 cursor-pointer" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                    <div className="flex-1 text-left">
                      <p className="text-[9px] font-black uppercase text-slate-400">¿A dónde vas?</p>
                      <p className="text-sm font-black uppercase">{busqueda || "SELECCIONAR CIUDAD"}</p>
                    </div>
                </div>
                {mostrarDestinos && (
                  <div className="absolute top-full left-0 right-0 bg-white border mt-2 rounded-3xl shadow-2xl z-50 overflow-hidden">
                    {ESTADOS.map(estado => (
                      <button key={estado} className="w-full p-4 text-left text-sm font-bold border-b last:border-0 hover:bg-blue-50 uppercase" 
                        onClick={() => { setBusqueda(estado); setMostrarDestinos(false); }}>
                        {estado}
                      </button>
                    ))}
                  </div>
                )}
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 italic text-left ml-2">Rutas disponibles</p>
                {viajesReales.filter(v => !busqueda || v.destino === busqueda).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-6 rounded-[35px] border shadow-sm flex justify-between items-center active:scale-95 transition-all cursor-pointer">
                        <div className="flex gap-4 text-left">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 border"><Car size={24}/></div>
                          <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase italic mb-1">• {v.destino}</p>
                            <p className="font-black text-sm uppercase italic text-slate-800">{v.conductor}</p>
                            <p className="text-[9px] font-bold text-slate-400 italic mt-1 uppercase">{v.vehiculo || "VERIFICADO"}</p>
                          </div>
                        </div>
                        <div className="text-right"><p className="text-xl font-black italic text-blue-600">${v.precio}</p></div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* INICIO CHÓFER */}
        {vista === 'inicio' && modo === 'chofer' && (
          <div className="p-6 space-y-4 pb-32 text-left">
             <div className="flex items-center gap-2 mb-2">
                <PlusCircle className="text-green-600" size={20}/>
                <h2 className="text-lg font-black uppercase italic">Publicar mi Ruta</h2>
             </div>
             <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4">
                <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border focus:border-green-500" value={formViaje.modeloAuto} onChange={(e) => setFormViaje({...formViaje, modeloAuto: e.target.value})} placeholder="Ej: Toyota Hilux"/>
                <div className="grid grid-cols-2 gap-3">
                  <select className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border" value={formViaje.destino} onChange={(e) => setFormViaje({...formViaje, destino: e.target.value})}>
                    <option value="">Destino</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border" value={formViaje.precio} onChange={(e) => setFormViaje({...formViaje, precio: e.target.value})} placeholder="Precio $"/>
                </div>
                <textarea className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none h-24 border" value={formViaje.detalles} onChange={(e) => setFormViaje({...formViaje, detalles: e.target.value})} placeholder="Extras: Aire full, no mascotas..."/>
                <button onClick={publicarViaje} className="w-full py-5 bg-green-600 text-white rounded-[25px] font-black uppercase italic shadow-lg active:scale-95 transition-all">Publicar Ruta Ahora</button>
             </div>
          </div>
        )}

        {/* CHAT CONDUCTOR */}
        {vista === 'chat_conductor' && (
          <div className="h-full flex flex-col bg-white">
            <div className="p-6 pt-12 border-b flex items-center gap-4">
              <button onClick={() => setVista('inicio')} className="p-2 bg-slate-50 rounded-full"><ArrowLeft size={20}/></button>
              <div className="text-left flex-1">
                <p className="text-sm font-black uppercase italic">{viajeActivo?.conductor || "CONDUCTOR"}</p>
                <p className="text-[9px] text-green-500 font-black uppercase mt-1">● En línea ahora</p>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] border text-left">
                <p className="text-xs font-bold italic text-slate-700">Hola, soy tu conductor. Tengo tu reserva para {viajeActivo?.destino}.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setVista('inicio')} className="py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase border border-red-100">CANCELAR VIAJE</button>
                <button onClick={() => alert("Informando al chófer...")} className="py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md">¡YA LLEGUÉ!</button>
              </div>
              {mensajesConductor.map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-left ${m.yo ? 'bg-blue-600 text-white ml-auto rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                  <p className="text-xs font-black italic">{m.texto}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-3 bg-white">
              <input type="text" value={inputConductor} onChange={(e) => setInputConductor(e.target.value)} placeholder="Escribe aquí..." className="flex-1 bg-slate-100 p-4 rounded-2xl text-xs font-bold outline-none"/>
              <button onClick={() => { if(inputConductor) { setMensajesConductor([...mensajesConductor, {texto: inputConductor, yo: true}]); setInputConductor(""); } }} className="w-14 h-14 bg-blue-600 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={20}/></button>
            </div>
          </div>
        )}

        {/* SOPORTE */}
        {vista === 'chat_soporte' && (
          <div className="h-full flex flex-col bg-white">
            <div className="p-6 pt-12 border-b flex items-center gap-4 bg-slate-900 text-white">
              <button onClick={() => setVista('inicio')} className="p-2 bg-white/10 rounded-full"><ArrowLeft size={20}/></button>
              <div className="text-left">
                <p className="text-sm font-black uppercase italic">ATENCIÓN AL CLIENTE</p>
                <p className="text-[9px] text-blue-400 font-black uppercase italic">Respuesta inmediata</p>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none border text-left max-w-[85%]">
                 <p className="text-xs font-black italic text-slate-700">Hola, ¿en qué podemos ayudarte hoy?</p>
              </div>
              {mensajesSoporte.map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-left ${m.yo ? 'bg-slate-900 text-white ml-auto rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                  <p className="text-xs font-black italic">{m.texto}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-3 bg-white">
              <input type="text" value={inputSoporte} onChange={(e) => setInputSoporte(e.target.value)} placeholder="Tu mensaje..." className="flex-1 bg-slate-100 p-4 rounded-2xl text-xs font-bold outline-none"/>
              <button onClick={() => { if(inputSoporte) { setMensajesSoporte([...mensajesSoporte, {texto: inputSoporte, yo: true}]); setInputSoporte(""); } }} className="w-14 h-14 bg-slate-900 rounded-2xl text-white flex items-center justify-center shadow-lg"><Send size={20}/></button>
            </div>
          </div>
        )}

        {/* PERFIL */}
        {vista === 'perfil' && (
           <div className="p-6 space-y-6 pb-32">
              <div className="w-32 h-32 bg-blue-600 rounded-[40px] mx-auto flex items-center justify-center text-white border-8 border-white shadow-2xl relative">
                <User size={60}/>
                <button onClick={() => setEditando(!editando)} className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2.5 rounded-xl border-4 border-white"><Edit2 size={16}/></button>
              </div>
              <div className="bg-slate-900 p-6 rounded-[35px] text-left shadow-xl">
                    <p className="text-[10px] font-black text-blue-400 uppercase italic">Tu Billetera</p>
                    <h3 className="text-2xl font-black text-white italic">${Number(userData.saldo).toFixed(2)}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Retenido: ${Number(userData.saldoRetenido || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-8 rounded-[40px] border shadow-sm text-left space-y-4">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-2">Nombre Completo</p>
                    <input disabled={!editando} className="w-full bg-slate-50 p-4 rounded-xl font-black text-sm uppercase" value={formPerfil.nombre} onChange={(e) => setFormPerfil({...formPerfil, nombre: e.target.value})}/>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-2">Teléfono de contacto</p>
                    <input disabled={!editando} className="w-full bg-slate-50 p-4 rounded-xl font-black text-sm" value={formPerfil.telefono} onChange={(e) => setFormPerfil({...formPerfil, telefono: e.target.value})}/>
                 </div>
                 {editando && <button onClick={async () => { await updateDoc(doc(db, 'usuarios', user.uid), formPerfil); setEditando(false); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase italic shadow-lg">Guardar Cambios</button>}
              </div>
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-50 text-red-500 font-black italic uppercase text-[11px] rounded-3xl border border-red-100 flex items-center justify-center gap-3"><LogOut size={16}/> Cerrar Sesión</button>
           </div>
        )}
      </main>

      {/* MODAL DETALLES */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6">
            <div className="flex justify-between items-start">
               <div className="flex gap-4 text-left">
                  <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black italic">{(viajeSeleccionado.conductor || "C")[0]}</div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase">CONDUCTOR VERIFICADO</p>
                    <h2 className="text-2xl font-black italic uppercase text-slate-800">{viajeSeleccionado.conductor}</h2>
                  </div>
               </div>
               <button onClick={() => setViajeSeleccionado(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border text-left">
                    <Briefcase size={16} className="text-blue-600 mb-1"/>
                    <p className="text-[8px] font-black text-slate-400 uppercase">EQUIPAJE</p>
                    <p className="text-xs font-black italic">{viajeSeleccionado.kilosMaleta || "20kg máx."}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border text-left">
                    <Users size={16} className="text-blue-600 mb-1"/>
                    <p className="text-[8px] font-black text-slate-400 uppercase">PUESTOS</p>
                    <p className="text-xs font-black italic">{viajeSeleccionado.puestos || 3} Libres</p>
                </div>
            </div>
            <div className="bg-blue-50/50 p-5 rounded-3xl text-left border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase mb-1 italic">NOTAS DEL CONDUCTOR:</p>
               <p className="text-xs font-bold italic text-slate-600">"{viajeSeleccionado.detallesExtras || "No se aceptan mascotas"}"</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => { setViajeActivo(viajeSeleccionado); setViajeSeleccionado(null); setVista('chat_conductor'); }} className="flex-1 py-5 bg-slate-100 rounded-[22px] font-black text-[10px] uppercase text-slate-600">CHAT</button>
               <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-5 bg-blue-600 rounded-[22px] font-black text-[10px] uppercase text-white shadow-2xl">CONFIRMAR RESERVA (${viajeSeleccionado.precio})</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR INFERIOR */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <nav className="absolute bottom-6 left-6 right-6 bg-slate-900 rounded-[35px] p-4 flex justify-around items-center z-40 shadow-2xl">
          <button onClick={() => setVista('inicio')} className={`p-2 transition-all ${vista === 'inicio' ? 'text-bl
