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
  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
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
    const unsub = onSnapshot(doc(db, 'usuarios', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setFormPerfil({ nombre: data.nombre || "", telefono: data.telefono || "" });
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsubViajes = onSnapshot(query(collection(db, "Viajes")), (snap) => {
      setViajesReales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubViajes();
  }, []);

  const publicarViaje = async () => {
    if (!formViaje.destino || !formViaje.precio) return alert("⚠️ Datos incompletos");
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre, destino: formViaje.destino,
        precio: Number(formViaje.precio), vehiculo: formViaje.modeloAuto,
        puestos: Number(formViaje.puestos), detallesExtras: formViaje.detalles,
        idCreador: user.uid, fecha: serverTimestamp()
      });
      alert("✅ Publicado");
      setModo('pasajero');
    } catch (e) { alert("❌ Error"); }
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
    } catch (e) { alert("Error"); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">R</div>
              <div className="text-left">
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
        {vista === 'inicio' && modo === 'pasajero' && (
          <div className="p-6 space-y-4 pb-32">
            <button onClick={() => setMostrarDestinos(!mostrarDestinos)} className="w-full bg-white p-5 rounded-[25px] border flex items-center gap-4">
              <Search className="text-blue-600" size={20}/>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase">Destino</p>
                <p className="text-sm font-black uppercase">{busqueda || "Seleccionar ciudad"}</p>
              </div>
            </button>
            {mostrarDestinos && (
              <div className="bg-white border rounded-3xl shadow-xl overflow-hidden">
                {ESTADOS.map(e => <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="w-full p-4 text-left font-bold border-b text-sm uppercase">{e}</button>)}
              </div>
            )}
            {viajesReales.filter(v => !busqueda || v.destino === busqueda).map(v => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm">
                <div className="flex gap-3 text-left">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><Car size={20}/></div>
                  <div><p className="text-[10px] font-black text-blue-600 uppercase italic">{v.destino}</p><p className="font-black uppercase text-sm">{v.conductor}</p></div>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}

        {vista === 'inicio' && modo === 'chofer' && (
          <div className="p-6 space-y-4 text-left">
            <h2 className="text-lg font-black uppercase italic flex items-center gap-2"><PlusCircle size={20} className="text-green-600"/>Publicar Ruta</h2>
            <div className="bg-white p-6 rounded-[30px] border space-y-3">
              <input className="w-full bg-slate-50 p-4 rounded-xl border font-bold" placeholder="Vehículo" value={formViaje.modeloAuto} onChange={e => setFormViaje({...formViaje, modeloAuto: e.target.value})}/>
              <select className="w-full bg-slate-50 p-4 rounded-xl border font-bold" value={formViaje.destino} onChange={e => setFormViaje({...formViaje, destino: e.target.value})}>
                <option value="">Selecciona Destino</option>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <input type="number" className="w-full bg-slate-50 p-4 rounded-xl border font-bold" placeholder="Precio $" value={formViaje.precio} onChange={e => setFormViaje({...formViaje, precio: e.target.value})}/>
              <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Ahora</button>
            </div>
          </div>
        )}

        {vista === 'chat_conductor' && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b flex items-center gap-4 bg-white">
              <button onClick={() => setVista('inicio')} className="p-2 bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
              <p className="font-black uppercase">{viajeActivo?.conductor}</p>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50">
              {mensajesConductor.map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[80%] text-left ${m.yo ? 'bg-blue-600 text-white ml-auto' : 'bg-white border'}`}>
                  <p className="text-xs font-bold">{m.texto}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2 bg-white">
              <input className="flex-1 bg-slate-100 p-4 rounded-xl text-sm outline-none" value={inputConductor} onChange={e => setInputConductor(e.target.value)} placeholder="Mensaje..."/>
              <button onClick={() => {if(inputConductor) {setMensajesConductor([...mensajesConductor, {texto: inputConductor, yo: true}]); setInputConductor("");}}} className="p-4 bg-blue-600 text-white rounded-xl"><Send size={20}/></button>
            </div>
          </div>
        )}

        {vista === 'perfil' && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl"><User size={40}/></div>
            <div className="bg-slate-900 p-6 rounded-3xl text-left">
              <p className="text-blue-400 text-[10px] font-black uppercase">Saldo Disponible</p>
              <p className="text-2xl font-black text-white italic">${Number(userData.saldo).toFixed(2)}</p>
            </div>
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2"><LogOut size={16}/> Salir</button>
          </div>
        )}
      </main>

      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[40px] p-8 space-y-6">
            <div className="flex justify-between">
              <p className="font-black text-xl uppercase italic">{viajeSeleccionado.conductor}</p>
              <button onClick={() => setViajeSeleccionado(null)}><X/></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border text-left"><Briefcase className="text-blue-600 mb-1" size={16}/><p className="text-xs font-black">HASTA 20KG</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border text-left"><Users className="text-blue-600 mb-1" size={16}/><p className="text-xs font-black">{viajeSeleccionado.puestos} LIBRES</p></div>
            </div>
            <button onClick={() => manejarReserva(viajeSeleccionado)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-xl">Reservar por ${viajeSeleccionado.precio}</button>
          </div>
        </div>
      )}

      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <nav className="absolute bottom-6 left-6 right-6 bg-slate-900 rounded-[30px] p-4 flex justify-around shadow-2xl z-40">
          <button onClick={() => setVista('inicio')} className={`p-2 ${vista === 'inicio' ? 'text-blue-400' : 'text-white/50'}`}><Search size={24}/></button>
          <button onClick={() => setVista('chat_soporte')} className={`p-2 ${vista === 'chat_soporte' ? 'text-blue-400' : 'text-white/50'}`}><Headset size={24}/></button>
          <button onClick={() => setVista('perfil')} className={`p-2 ${vista === 'perfil' ? 'text-blue-400' : 'text-white/50'}`}><User size={24}/></button>
        </nav>
      )}
    </div>
  );
}

