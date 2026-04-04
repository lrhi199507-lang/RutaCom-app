import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { doc, onSnapshot, updateDoc, collection, query, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { Search, Wallet, User, LogOut, Car, X, Briefcase, Users, Send, ArrowLeft, Edit2, Headset, PlusCircle } from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [modo, setModo] = useState('pasajero');
  const [editando, setEditando] = useState(false); // Nuevo: Controla visibilidad de "Guardar Cambios"
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  
  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);
  
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  const [userData, setUserData] = useState<any>({ nombre: "", saldo: 0, telefono: "" });
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });
  const [formViaje, setFormViaje] = useState({ destino: "", precio: "", modeloAuto: "", puestos: "4", detalles: "" });

  // 1. Carga de datos de usuario y sincronización de perfil
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        // Solo actualizamos el formulario si NO estamos editando para evitar sobrescribir lo que escribe el usuario
        if (!editando) setFormPerfil({ nombre: data.nombre || "", telefono: data.telefono || "" });
      }
    });
  }, [user, editando]);

  // 2. Escucha de viajes en tiempo real
  useEffect(() => {
    const q = query(collection(db, "Viajes"));
    return onSnapshot(q, (snap) => {
      setViajesReales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const publicarViaje = async () => {
    if (!formViaje.destino || !formViaje.precio || !formViaje.modeloAuto) {
      return alert("⚠️ Por favor completa todos los campos del vehículo y destino");
    }
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Chófer Profesional",
        destino: formViaje.destino,
        precio: Number(formViaje.precio),
        vehiculo: formViaje.modeloAuto,
        puestos: Number(formViaje.puestos),
        detallesExtras: formViaje.detalles,
        idCreador: user.uid,
        fecha: serverTimestamp()
      });
      alert("✅ ¡Ruta publicada con éxito!");
      setModo('pasajero');
      setFormViaje({ destino: "", precio: "", modeloAuto: "", puestos: "4", detalles: "" });
    } catch (e) { 
      console.error(e);
      alert("❌ Error de conexión con Firebase. Revisa los permisos."); 
    }
  };

  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio) return alert("⚠️ Saldo insuficiente en tu billetera");
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), {
        saldo: userData.saldo - viaje.precio
      });
      setViajeActivo(viaje);
      setViajeSeleccionado(null);
      setVista('chat_conductor');
    } catch (e) { alert("Error al procesar la reserva"); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      
      {/* HEADER DINÁMICO */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg italic">R</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">RutaCom {modo === 'pasajero' ? 'Pasajero' : 'Chófer'}</p>
                <p className="text-xs font-bold uppercase text-slate-800">{userData.nombre || "Usuario"}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400"/><span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === 'pasajero' ? 'chofer' : 'pasajero')} className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100 hover:bg-blue-100 transition-colors">
            Cambiar a Modo {modo === 'pasajero' ? 'Chófer' : 'Pasajero'}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* VISTA INICIO PASAJERO */}
        {vista === 'inicio' && modo === 'pasajero' && (
          <div className="p-6 space-y-4 pb-32">
            <button onClick={() => setMostrarDestinos(!mostrarDestinos)} className="w-full bg-white p-5 rounded-[25px] border flex items-center gap-4 shadow-sm hover:border-blue-300 transition-all">
              <Search className="text-blue-600" size={20}/>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase">¿A dónde vas?</p>
                <p className="text-sm font-black uppercase text-slate-700">{busqueda || "Seleccionar Ciudad"}</p>
              </div>
            </button>
            {mostrarDestinos && (
              <div className="bg-white border rounded-3xl shadow-xl overflow-hidden mb-4 animate-in fade-in slide-in-from-top-2">
                {ESTADOS.map(e => <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="w-full p-4 text-left font-bold border-b text-sm uppercase hover:bg-blue-50 text-slate-600">{e}</button>)}
              </div>
            )}
            {viajesReales.filter(v => !busqueda || v.destino === busqueda).map(v => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm active:scale-95 transition-all cursor-pointer hover:shadow-md">
                <div className="flex gap-3 text-left">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100"><Car size={22}/></div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase italic">• {v.destino}</p>
                    <p className="font-black uppercase text-sm text-slate-800">{v.conductor || "Chófer Profesional"}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculo || "Vehículo verificado"}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}

        {/* VISTA INICIO CHÓFER */}
        {vista === 'inicio' && modo === 'chofer' && (
          <div className="p-6 space-y-4 text-left pb-32">
            <h2 className="text-lg font-black uppercase italic flex items-center gap-2 text-slate-800"><PlusCircle size={20} className="text-green-600"/> Publicar Mi Ruta</h2>
            <div className="bg-white p-6 rounded-[35px] border space-y-4 shadow-sm">
              <input className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm focus:border-blue-400 outline-none" placeholder="Modelo del Auto (Ej: Toyota Corolla)" value={formViaje.modeloAuto} onChange={e => setFormViaje({...formViaje, modeloAuto: e.target.value})}/>
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none" value={formViaje.destino} onChange={e => setFormViaje({...formViaje, destino: e.target.value})}>
                  <option value="">Destino</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input type="number" className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none" placeholder="Precio $" value={formViaje.precio} onChange={e => setFormViaje({...formViaje, precio: e.target.value})}/>
              </div>
              <textarea className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm h-24 outline-none resize-none" placeholder="Detalles (Ej: Aire Full, Maletero amplio...)" value={formViaje.detalles} onChange={e => setFormViaje({...formViaje, detalles: e.target.value})}/>
              <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-[20px] font-black uppercase italic shadow-lg active:scale-95 transition-transform hover:bg-green-700">Publicar Ahora</button>
            </div>
          </div>
        )}

        {/* VISTA PERFIL (DINÁMICO) */}
        {vista === 'perfil' && (
          <div className="p-6 space-y-6 text-center pb-32">
            <div className="w-24 h-24 bg-blue-600 rounded-[35px] mx-auto flex items-center justify-center text-white shadow-xl relative border-4 border-white">
              <User size={40}/>
              <button onClick={() => setEditando(!editando)} className={`absolute -bottom-2 -right-2 p-2 rounded-xl text-white border-2 border-white transition-colors ${editando ? 'bg-green-500' : 'bg-slate-900'}`}>
                <Edit2 size={14}/>
              </button>
            </div>
            <div className="text-left space-y-4">
              <div className="bg-slate-900 p-6 rounded-[30px] shadow-xl border border-slate-800">
                <p className="text-blue-400 text-[10px] font-black uppercase italic">Billetera Digital</p>
                <p className="text-3xl font-black text-white italic">${Number(userData.saldo).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-[35px] border space-y-4 shadow-sm">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1">Nombre Completo</p>
                  <input disabled={!editando} className={`w-full p-4 rounded-2xl font-bold uppercase text-sm border transition-all ${editando ? 'bg-white border-blue-200' : 'bg-slate-50 border-transparent text-slate-500'}`} value={formPerfil.nombre} onChange={e => setFormPerfil({...formPerfil, nombre: e.target.value})}/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1">WhatsApp</p>
                  <input disabled={!editando} className={`w-full p-4 rounded-2xl font-bold text-sm border transition-all ${editando ? 'bg-white border-blue-200' : 'bg-slate-50 border-transparent text-slate-500'}`} value={formPerfil.telefono} onChange={e => setFormPerfil({...formPerfil, telefono: e.target.value})}/>
                </div>
                {editando && (
                  <button onClick={async () => { 
                    await updateDoc(doc(db, 'usuarios', user.uid), formPerfil); 
                    setEditando(false);
                    alert("✅ Perfil actualizado"); 
                  }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg animate-in fade-in zoom-in-95">Guardar Cambios</button>
                )}
              </div>
            </div>
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2 italic text-xs hover:bg-red-100 transition-colors"><LogOut size={16}/> Cerrar Sesión</button>
          </div>
        )}

        {/* VISTAS DE CHAT (CORREGIDAS) */}
        {(vista === 'chat_conductor' || vista === 'chat_soporte') && (
          <div className="absolute inset-0 z-50 flex flex-col bg-white">
            <div className={`p-6 pt-12 border-b flex items-center gap-4 shrink-0 ${vista === 'chat_soporte' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
              <button onClick={() => setVista('inicio')} className="p-2 bg-slate-100 rounded-full text-slate-900 hover:bg-slate-200 transition-colors"><ArrowLeft size={20}/></button>
              <div className="text-left">
                <p className="font-black uppercase text-sm italic">{vista === 'chat_soporte' ? 'Soporte RutaCom' : (viajeActivo?.conductor || 'Chófer')}</p>
                <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">• En línea ahora</p>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 text-left shadow-sm max-w-[85%]">
                <p className="text-xs font-bold italic text-slate-600">
                  {vista === 'chat_soporte' ? 'Hola Luis, ¿en qué podemos ayudarte hoy con tu viaje?' : `Hola ${userData.nombre}, estoy atento a tu reserva para ${viajeActivo?.destino}.`}
                </p>
              </div>
              {(vista === 'chat_conductor' ? mensajesConductor : mensajesSoporte).map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[80%] text-left shadow-sm ${m.yo ? 'bg-blue-600 text-white ml-auto rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                  <p className="text-xs font-bold italic">{m.texto}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2 bg-white pb-8">
              <input className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm outline-none font-bold placeholder:text-slate-400" placeholder="Escribe un mensaje..." 
                value={vista === 'chat_conductor' ? inputConductor : inputSoporte} 
                onChange={e => vista === 'chat_conductor' ? setInputConductor(e.target.value) : setInputSoporte(e.target.value)}
                onKeyPress={(e) => {
                  if(e.key === 'Enter') {
                    const text = vista === 'chat_conductor' ? inputConductor : inputSoporte;
                    if(!text) return;
                    if(vista === 'chat_conductor') { setMensajesConductor([...mensajesConductor, {texto: text, yo: true}]); setInputConductor(""); }
                    else { setMensajesSoporte([...mensajesSoporte, {texto: text, yo: true}]); setInputSoporte(""); }
                  }
                }}/>
              <button onClick={() => {
                const text = vista === 'chat_conductor' ? inputConductor : inputSoporte;
                if(!text) return;
                if(vista === 'chat_conductor') { setMensajesConductor([...mensajesConductor, {texto: text, yo: true}]); setInputConductor(""); }
                else { setMensajesSoporte([...mensajesSoporte, {texto: text, yo: true}]); setInputSoporte(""); }
              }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-transform"><Send size={20}/></button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DETALLES DEL VIAJE (DINÁMICO) */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 text-left">
                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black italic shadow-lg">{(viajeSeleccionado.conductor || "C")[0]}</div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase italic">Chófer Verificado</p>
                  <h2 className="text-xl font-black uppercase text-slate-800 italic">{viajeSeleccionado.conductor || "Nombre no disponible"}</h2>
                </div>
              </div>
              <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                <Briefcase className="text-blue-600 mb-2" size={18}/><p className="text-[8px] font-black text-slate-400 uppercase">Equipaje</p>
                <p className="text-xs font-black italic text-slate-700">Hasta 20kg máx.</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                <Users className="text-blue-600 mb-2" size={18}/><p className="text-[8px] font-black text-slate-400 uppercase">Disponibilidad</p>
                <p className="text-xs font-black italic text-slate-700">{viajeSeleccionado.puestos || 3} Puestos Libres</p>
              </div>
            </div>
            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 text-left">
              <p className="text-[9px] font-black text-blue-600 uppercase italic mb-1">Notas del Chófer:</p>
              <p className="text-xs font-bold italic text-slate-600 leading-relaxed">"{viajeSeleccionado.detallesExtras || "Viaje cómodo, aire acondicionado a full y música al gusto del cliente."}"</p>
            </div>
            <div className="flex gap-3 pb-4">
              <button onClick={() => { setViajeActivo(viajeSeleccionado); setViajeSeleccionado(null); setVista('chat_conductor'); }} className="flex-1 py-5 bg-slate-100 rounded-3xl font-black text-[11px] uppercase text-slate-500 italic hover:bg-slate-200 transition-colors">Consultar Chat</button>
              <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase shadow-xl italic hover:bg-blue-700 transition-colors">Reservar Por ${viajeSeleccionado.precio}</button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <nav className="absolute bottom-6 left-6 right-6 bg-slate-900 rounded-[35px] p-4 flex justify-around shadow-2xl z-40 border border-white/10">
          <button onClick={() => setVista('inicio')} className={`p-2 transition-all ${vista === 'inicio' ? 'text-blue-400 scale-125' : 'text-white/40 hover:text-white'}`}><Search size={24}/></button>
          <button onClick={() => setVista('chat_soporte')} className={`p-2 transition-all ${vista === 'chat_soporte' ? 'text-blue-400 scale-125' : 'text-white/40 hover:text-white'}`}><Headset size={24}/></button>
          <button onClick={() => setVista('perfil')} className={`p-2 transition-all ${vista === 'perfil' ? 'text-blue-400 scale-125' : 'text-white/40 hover:text-white'}`}><User size={24}/></button>
        </nav>
      )}
    </div>
  );
                }
                                                                                      
