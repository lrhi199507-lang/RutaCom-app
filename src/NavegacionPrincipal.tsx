import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { doc, onSnapshot, updateDoc, collection, query, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { Search, Wallet, User, LogOut, Car, X, Briefcase, Users, Send, ArrowLeft, Edit2, Headset, PlusCircle } from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [modo, setModo] = useState('pasajero');
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  const [userData, setUserData] = useState<any>({ nombre: "", saldo: 0, saldoRetenido: 0, telefono: "" });
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });
  const [formViaje, setFormViaje] = useState({ destino: "", precio: "", modeloAuto: "", puestos: "4", detalles: "" });

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setFormPerfil({ nombre: data.nombre || "", telefono: data.telefono || "" });
      }
    });
  }, [user]);

  useEffect(() => {
    return onSnapshot(query(collection(db, "Viajes")), (snap) => {
      setViajesReales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const publicarViaje = async () => {
    if (!formViaje.destino || !formViaje.precio) return alert("⚠️ Datos incompletos");
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Chófer",
        destino: formViaje.destino,
        precio: Number(formViaje.precio),
        vehiculo: formViaje.modeloAuto,
        puestos: Number(formViaje.puestos),
        detallesExtras: formViaje.detalles,
        idCreador: user.uid,
        fecha: serverTimestamp()
      });
      alert("✅ Ruta publicada");
      setModo('pasajero');
    } catch (e) { alert("❌ Error al publicar"); }
  };

  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio) return alert("⚠️ Saldo insuficiente");
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), {
        saldo: userData.saldo - viaje.precio,
        saldoRetenido: (userData.saldoRetenido || 0) + viaje.precio
      });
      setViajeActivo(viaje);
      setViajeSeleccionado(null);
      setVista('chat_conductor');
    } catch (e) { alert("Error al reservar"); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      
      {/* HEADER DINÁMICO */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg italic">R</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase italic">RutaCom {modo.toUpperCase()}</p>
                <p className="text-xs font-bold uppercase">{userData.nombre || "Usuario"}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
              <Wallet size={12} className="text-blue-400"/><span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === 'pasajero' ? 'chofer' : 'pasajero')} className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100">
            Cambiar a Modo {modo === 'pasajero' ? 'Chófer' : 'Pasajero'}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* VISTA INICIO PASAJERO */}
        {vista === 'inicio' && modo === 'pasajero' && (
          <div className="p-6 space-y-4 pb-32">
            <button onClick={() => setMostrarDestinos(!mostrarDestinos)} className="w-full bg-white p-5 rounded-[25px] border flex items-center gap-4 shadow-sm">
              <Search className="text-blue-600" size={20}/>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase">¿A dónde vas?</p>
                <p className="text-sm font-black uppercase">{busqueda || "Seleccionar Ciudad"}</p>
              </div>
            </button>
            {mostrarDestinos && (
              <div className="bg-white border rounded-3xl shadow-xl overflow-hidden mb-4">
                {ESTADOS.map(e => <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="w-full p-4 text-left font-bold border-b text-sm uppercase hover:bg-slate-50">{e}</button>)}
              </div>
            )}
            {viajesReales.filter(v => !busqueda || v.destino === busqueda).map(v => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm active:scale-95 transition-transform">
                <div className="flex gap-3 text-left">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 border"><Car size={20}/></div>
                  <div><p className="text-[10px] font-black text-blue-600 uppercase italic">• {v.destino}</p><p className="font-black uppercase text-sm">{v.conductor}</p></div>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}

        {/* VISTA INICIO CHÓFER */}
        {vista === 'inicio' && modo === 'chofer' && (
          <div className="p-6 space-y-4 text-left">
            <h2 className="text-lg font-black uppercase italic flex items-center gap-2"><PlusCircle size={20} className="text-green-600"/> Publicar Ruta</h2>
            <div className="bg-white p-6 rounded-[30px] border space-y-3 shadow-sm">
              <input className="w-full bg-slate-50 p-4 rounded-xl border font-bold text-sm" placeholder="Vehículo (Ej: Toyota)" value={formViaje.modeloAuto} onChange={e => setFormViaje({...formViaje, modeloAuto: e.target.value})}/>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-slate-50 p-4 rounded-xl border font-bold text-sm" value={formViaje.destino} onChange={e => setFormViaje({...formViaje, destino: e.target.value})}>
                  <option value="">Destino</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input type="number" className="bg-slate-50 p-4 rounded-xl border font-bold text-sm" placeholder="Precio $" value={formViaje.precio} onChange={e => setFormViaje({...formViaje, precio: e.target.value})}/>
              </div>
              <textarea className="w-full bg-slate-50 p-4 rounded-xl border font-bold text-sm h-24" placeholder="Detalles extras..." value={formViaje.detalles} onChange={e => setFormViaje({...formViaje, detalles: e.target.value})}/>
              <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-transform">Publicar Ahora</button>
            </div>
          </div>
        )}

        {/* VISTA PERFIL */}
        {vista === 'perfil' && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[35px] mx-auto flex items-center justify-center text-white shadow-xl relative border-4 border-white">
              <User size={40}/>
              <button className="absolute -bottom-2 -right-2 bg-slate-900 p-2 rounded-xl text-white border-2 border-white"><Edit2 size={14}/></button>
            </div>
            <div className="text-left space-y-4">
              <div className="bg-slate-900 p-6 rounded-[30px] shadow-xl">
                <p className="text-blue-400 text-[10px] font-black uppercase italic">Billetera Digital</p>
                <p className="text-3xl font-black text-white italic">${Number(userData.saldo).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-[30px] border space-y-4 shadow-sm">
                <div><p className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1">Nombre</p>
                <input className="w-full bg-slate-50 p-3 rounded-xl font-bold uppercase text-sm" value={formPerfil.nombre} onChange={e => setFormPerfil({...formPerfil, nombre: e.target.value})}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1">WhatsApp</p>
                <input className="w-full bg-slate-50 p-3 rounded-xl font-bold text-sm" value={formPerfil.telefono} onChange={e => setFormPerfil({...formPerfil, telefono: e.target.value})}/></div>
                <button onClick={async () => { await updateDoc(doc(db, 'usuarios', user.uid), formPerfil); alert("Cambiado"); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic text-xs">Guardar Cambios</button>
              </div>
            </div>
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2 italic text-xs"><LogOut size={16}/> Cerrar Sesión</button>
          </div>
        )}

        {/* CHATS (SOPORTE Y CONDUCTOR) */}
        {(vista === 'chat_conductor' || vista === 'chat_soporte') && (
          <div className="h-full flex flex-col bg-white">
            <div className={`p-6 pt-12 border-b flex items-center gap-4 ${vista === 'chat_soporte' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
              <button onClick={() => setVista('inicio')} className="p-2 bg-slate-100 rounded-full text-slate-900"><ArrowLeft size={20}/></button>
              <div className="text-left">
                <p className="font-black uppercase text-sm italic">{vista === 'chat_soporte' ? 'Atención al Cliente' : (viajeActivo?.conductor || 'Tu Chófer')}</p>
                <p className="text-[9px] text-green-500 font-black uppercase">• En línea ahora</p>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50">
              <div className="bg-white p-4 rounded-2xl border text-left shadow-sm max-w-[85%]">
                <p className="text-xs font-bold italic">Hola, ¿en qué podemos ayudarte?</p>
              </div>
              {(vista === 'chat_conductor' ? mensajesConductor : mensajesSoporte).map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[80%] text-left shadow-sm ${m.yo ? 'bg-blue-600 text-white ml-auto' : 'bg-white border'}`}>
                  <p className="text-xs font-bold italic">{m.texto}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2 bg-white">
              <input className="flex-1 bg-slate-100 p-4 rounded-xl text-sm outline-none font-bold" placeholder="Escribe aquí..." 
                value={vista === 'chat_conductor' ? inputConductor : inputSoporte} 
                onChange={e => vista === 'chat_conductor' ? setInputConductor(e.target.value) : setInputSoporte(e.target.value)}/>
              <button onClick={() => {
                const text = vista === 'chat_conductor' ? inputConductor : inputSoporte;
                if(!text) return;
                if(vista === 'chat_conductor') { setMensajesConductor([...mensajesConductor, {texto: text, yo: true}]); setInputConductor(""); }
                else { setMensajesSoporte([...mensajesSoporte, {texto: text, yo: true}]); setInputSoporte(""); }
              }} className="p-4 bg-blue-600 text-white rounded-xl shadow-lg"><Send size={20}/></button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE DETALLES DEL VIAJE */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[45px] p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 text-left">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black italic shadow-lg">{(viajeSeleccionado.conductor || "C")[0]}</div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase italic">Conductor Verificado</p>
                  <h2 className="text-xl font-black uppercase text-slate-800 italic">{viajeSeleccionado.conductor}</h2>
                </div>
              </div>
              <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full"><X/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border text-left">
                <Briefcase className="text-blue-600 mb-1" size={16}/><p className="text-[8px] font-black text-slate-400 uppercase">Equipaje</p>
                <p className="text-xs font-black italic">Hasta 20kg</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border text-left">
                <Users className="text-blue-600 mb-1" size={16}/><p className="text-[8px] font-black text-slate-400 uppercase">Puestos</p>
                <p className="text-xs font-black italic">{viajeSeleccionado.puestos || 3} Libres</p>
              </div>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-left">
              <p className="text-[9px] font-black text-blue-600 uppercase italic mb-1">Notas:</p>
              <p className="text-xs font-bold italic text-slate-600">"{viajeSeleccionado.detallesExtras || "Viaje cómodo con aire acondicionado."}"</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setViajeActivo(viajeSeleccionado); setViajeSeleccionado(null); setVista('chat_conductor'); }} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[11px] uppercase text-slate-500 italic">Chat</button>
              <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl italic">Reservar (${viajeSeleccionado.precio})</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR INFERIOR */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <nav className="absolute bottom-6 left-6 right-6 bg-slate-900 rounded-[35px] p-4 flex justify-around shadow-2xl z-40 border border-white/10">
          <button onClick={() => setVista('inicio')} className={`p-2 transition-transform ${vista === 'inicio' ? 'text-blue-400 scale-125' : 'text-white/50'}`}><Search size={24}/></button>
          <button onClick={() => setVista('chat_soporte')} className={`p-2 transition-transform ${vista === 'chat_soporte' ? 'text-blue-400 scale-125' : 'text-white/50'}`}><Headset size={24}/></button>
          <button onClick={() => setVista('perfil')} className={`p-2 transition-transform ${vista === 'perfil' ? 'text-blue-400 scale-125' : 'text-white/50'}`}><User size={24}/></button>
        </nav>
      )}
    </div>
  );
        }
