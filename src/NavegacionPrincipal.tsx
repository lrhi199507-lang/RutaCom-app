import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  doc, onSnapshot, updateDoc, collection, query, addDoc
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Wallet, User, LogOut, Car, X, Briefcase, Users, CheckCircle, Star, Send, ArrowLeft, Phone, Edit2, Save, Headset, PlusCircle
} from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [modo, setModo] = useState('pasajero'); // 'pasajero' o 'chofer'
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
  const [viajeConfirmado, setViajeConfirmado] = useState(false);

  const [userData, setUserData] = useState<any>({ nombre: "", saldo: 0, saldoRetenido: 0, telefono: "" });
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });

  // Estado para el formulario de publicación del Chófer
  const [formViaje, setFormViaje] = useState({
    conductorNombre: "",
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
        // Pre-rellenar el nombre del conductor con el nombre de usuario si existe
        setFormViaje(prev => ({ ...prev, conductorNombre: data.nombre || "" }));
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
    if (!formViaje.destino || !formViaje.precio || !formViaje.conductorNombre) {
      alert("Por favor, completa los campos obligatorios.");
      return;
    }
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: formViaje.conductorNombre,
        destino: formViaje.destino,
        precio: Number(formViaje.precio),
        vehiculo: `${formViaje.modeloAuto} (${formViaje.placa})`,
        puestos: formViaje.puestos,
        detallesExtras: formViaje.detalles,
        idCreador: user.uid,
        fecha: new Date().toISOString()
      });
      alert("¡Viaje publicado con éxito!");
      setModo('pasajero'); // Volver a vista de inicio tras publicar
      setFormViaje({ conductorNombre: userData.nombre, destino: "", precio: "", modeloAuto: "", placa: "", puestos: "4", detalles: "" });
    } catch (e) { alert("Error al publicar."); }
  };

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
      setViajeConfirmado(false);
      setViajeSeleccionado(null);
      setVista('chat_conductor');
    } catch (e) { alert("Error al reservar."); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER CON SWITCH DE MODO */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${modo === 'chofer' ? 'bg-green-600' : 'bg-blue-600'} rounded-xl flex items-center justify-center text-white font-black italic text-xl transition-colors`}>R</div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 italic">RutaCom {modo === 'chofer' ? 'Chófer' : 'Pro'}</p>
                <p className="text-xs font-bold uppercase">{userData.nombre || "Usuario"}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
              <Wallet size={12} className="text-blue-400"/><span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Botón Switcher */}
          <button 
            onClick={() => setModo(modo === 'pasajero' ? 'chofer' : 'pasajero')}
            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${modo === 'chofer' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
          >
            {modo === 'pasajero' ? "Cambiar a Modo Chófer" : "Volver a Modo Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {vista === 'inicio' && modo === 'pasajero' && (
          <div className="p-6 space-y-6 pb-32">
             {viajeActivo && (
               <div onClick={() => setVista('chat_conductor')} className="bg-blue-600 p-5 rounded-[30px] flex items-center justify-between text-white shadow-xl cursor-pointer border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl"><Car size={20}/></div>
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase opacity-70 italic">Viaje en curso</p>
                      <p className="text-xs font-black italic">Chat con {viajeActivo.conductor || "Conductor"}</p>
                    </div>
                  </div>
                  <ArrowLeft className="rotate-180" size={18}/>
               </div>
             )}

             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 cursor-pointer" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                <div className="flex-1 text-left"><p className="text-[9px] font-black uppercase text-slate-400">¿A dónde vas?</p><p className="text-sm font-black uppercase">{busqueda || "Seleccionar ciudad"}</p></div>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 italic text-left ml-2 tracking-widest">Rutas disponibles</p>
                {viajesReales.filter(v => busqueda === "" || (v.destino && v.destino.toLowerCase().includes(busqueda.toLowerCase()))).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-6 rounded-[35px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex gap-4 text-left">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 border"><Car size={24}/></div>
                          <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase italic leading-none mb-1">• {v.destino}</p>
                            <p className="font-black text-sm uppercase italic text-slate-800">{v.conductor || "Chófer"}</p>
                            <p className="text-[9px] font-bold text-slate-400 italic mt-1 uppercase">{v.vehiculo || "Vehículo verificado"}</p>
                          </div>
                        </div>
                        <div className="text-right"><p className="text-xl font-black italic text-blue-600">${v.precio}</p></div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* MODO CHÓFER: FORMULARIO DE PUBLICACIÓN */}
        {vista === 'inicio' && modo === 'chofer' && (
          <div className="p-6 space-y-4 pb-32 text-left">
             <div className="flex items-center gap-2 mb-2">
                <PlusCircle className="text-green-600" size={20}/>
                <h2 className="text-lg font-black uppercase italic">Publicar mi Ruta</h2>
             </div>
             
             <div className="bg-white p-6 rounded-[35px] border shadow-sm space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Tu Nombre de Chófer</label>
                  <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold mt-1 outline-none focus:ring-2 ring-green-500 transition-all" value={formViaje.conductorNombre} onChange={(e) => setFormViaje({...formViaje, conductorNombre: e.target.value})} placeholder="Ej: Luis Hernández"/>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Modelo Auto</label>
                    <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold mt-1 outline-none" value={formViaje.modeloAuto} onChange={(e) => setFormViaje({...formViaje, modeloAuto: e.target.value})} placeholder="Toyota Hilux"/>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Placa</label>
                    <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold mt-1 outline-none" value={formViaje.placa} onChange={(e) => setFormViaje({...formViaje, placa: e.target.value})} placeholder="AB123CD"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Destino</label>
                    <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold mt-1 outline-none" value={formViaje.destino} onChange={(e) => setFormViaje({...formViaje, destino: e.target.value})} placeholder="Ej: Caracas"/>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Precio ($)</label>
                    <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold mt-1 outline-none" value={formViaje.precio} onChange={(e) => setFormViaje({...formViaje, precio: e.target.value})} placeholder="10"/>
                  </div>
                </div>

                <button onClick={publicarViaje} className="w-full py-5 bg-green-600 text-white rounded-[25px] font-black uppercase italic shadow-lg active:scale-95 transition-all">
                  Publicar Viaje Ahora
                </button>
             </div>
          </div>
        )}

        {(vista === 'chat_conductor' || vista === 'chat_soporte') && (
          <div className="h-full flex flex-col bg-white">
            <div className="p-6 pt-12 border-b flex items-center gap-4">
              <button onClick={() => setVista('inicio')} className="p-2 bg-slate-50 rounded-full"><ArrowLeft size={20}/></button>
              <div className="w-11 h-11 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold italic shadow-lg">
                {vista === 'chat_soporte' ? <Headset size={22}/> : (viajeActivo?.conductor || "C")[0]}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-black uppercase italic leading-none">{vista === 'chat_soporte' ? "Soporte Técnico" : (viajeActivo?.conductor || "Conductor")}</p>
                <p className="text-[9px] text-green-500 font-black uppercase mt-1 animate-pulse">● En línea ahora</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 text-left">
              {vista === 'chat_conductor' && viajeActivo && (
                <div className="mb-4">
                   {!viajeConfirmado ? (
                     <button onClick={() => { setViajeConfirmado(true); alert("¡Viaje confirmado!"); }} className="w-full py-4 bg-green-500 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg italic border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all">Confirmar Inicio de Viaje</button>
                   ) : (
                     <div className="grid grid-cols-2 gap-3 animate-in zoom-in">
                        <button onClick={async () => { if(window.confirm("¿Cancelar viaje?")) { await updateDoc(doc(db, 'usuarios', user.uid), { saldo: (userData.saldo || 0) + Number(viajeActivo.precio), saldoRetenido: (userData.saldoRetenido || 0) - Number(viajeActivo.precio) }); setViajeActivo(null); setVista('inicio'); }} className="py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border italic">Cancelar</button>
                        <button onClick={async () => { await updateDoc(doc(db, 'usuarios', user.uid), { saldoRetenido: (userData.saldoRetenido || 0) - Number(viajeActivo.precio) }); setViajeActivo(null); setVista('inicio'); alert("¡Llegaste!"); }} className="py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg italic">¡Llegué al destino!</button>
                     </div>
                   )}
                </div>
              )}
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] border border-slate-100">
                <p className="text-xs font-bold italic text-slate-700 leading-relaxed">{vista === 'chat_soporte' ? "Hola, cuéntanos tu problema." : `Hola, soy ${viajeActivo?.conductor || 'tu conductor'}. Tengo tu reserva para ${viajeActivo?.destino}.`}</p>
              </div>
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

      {/* MODAL DE RESERVA (SÓLO MODO PASAJERO) */}
      {viajeSeleccionado && modo === 'pasajero' && !['chat_conductor', 'chat_soporte'].includes(vista) && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-start">
               <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black italic">{(viajeSeleccionado.conductor || "C")[0]}</div>
                  <div className="text-left">
                    <p className="text-[10px] 
