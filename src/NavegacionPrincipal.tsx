import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  doc, onSnapshot, updateDoc, collection, query, addDoc
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Wallet, User, LogOut, Car, X, Briefcase, Users, Send, ArrowLeft, Headset, PlusCircle, Edit2
} from 'lucide-react';

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [modo, setModo] = useState('pasajero'); 
  const [busqueda, setBusqueda] = useState("");
  
  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);

  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);

  const [userData, setUserData] = useState<any>({ nombre: "", saldo: 0, saldoRetenido: 0, telefono: "" });

  const [formViaje, setFormViaje] = useState({
    conductorNombre: "", destino: "", precio: "", modeloAuto: "", placa: "", puestos: "4", detalles: ""
  });

  // Escuchar datos del usuario en tiempo real
  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }
    });
    return () => unsub();
  }, [user]);

  // Escuchar viajes disponibles de Firestore
  useEffect(() => {
    const q = query(collection(db, "Viajes")); 
    const unsubViajes = onSnapshot(q, (snapshot) => {
      setViajesReales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubViajes();
  }, []);

  const publicarViaje = async () => {
    if (!formViaje.destino || !formViaje.precio) return alert("Completa los campos");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...formViaje,
        idCreador: user.uid,
        fecha: new Date().toISOString()
      });
      setModo('pasajero');
    } catch (e) { alert("Error al publicar"); }
  };

  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio) return alert("Saldo insuficiente");
    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      await updateDoc(userDoc, {
        saldo: userData.saldo - viaje.precio,
        saldoRetenido: (userData.saldoRetenido || 0) + viaje.precio
      });
      setViajeActivo(viaje);
      setViajeSeleccionado(null);
      setVista('chat_conductor');
    } catch (e) { alert("Error en reserva"); }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      
      {/* Cabecera */}
      {!['chat_conductor', 'chat_soporte'].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl">R</div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">RutaCom Pro</p>
                <p className="text-xs font-bold uppercase">{userData.nombre || "Usuario"}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2">
              <Wallet size={12} className="text-blue-400"/><span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === 'pasajero' ? 'chofer' : 'pasajero')} className="w-full py-2 rounded-xl text-[10px] font-black uppercase border bg-blue-50 text-blue-600">
            {modo === 'pasajero' ? "Modo Chófer" : "Modo Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {vista === 'inicio' && modo === 'pasajero' && (
          <div className="p-6 space-y-6 pb-32">
             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4">
                <Search size={20} className="text-blue-600"/>
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400">¿A DÓNDE VAS?</p>
                  <p className="text-sm font-black uppercase">Seleccionar Ciudad</p>
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase italic text-left">Rutas disponibles</p>
                {viajesReales.map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-6 rounded-[35px] border shadow-sm flex justify-between items-center">
                        <div className="flex gap-4 text-left">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 border"><Car size={24}/></div>
                          <div>
                            <p className="text-[9px] font-black text-blue-600 uppercase italic leading-none mb-1">• {v.destino}</p>
                            <p className="font-black text-sm uppercase italic text-slate-800">{v.conductor || "Chofer"}</p>
                            <p className="text-[9px] font-bold text-slate-400 italic mt-1 uppercase">Vehículo Verificado</p>
                          </div>
                        </div>
                        <div className="text-right"><p className="text-xl font-black italic text-blue-600">${v.precio}</p></div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* Chat con Conductor */}
        {vista === 'chat_conductor' && (
          <div className="h-full flex flex-col bg-white">
            <div className="p-6 pt-12 border-b flex items-center gap-4">
              <button onClick={() => setVista('inicio')} className="p-2 bg-slate-50 rounded-full"><ArrowLeft size={20}/></button>
              <div className="text-left">
                <p className="text-sm font-black uppercase italic leading-none">Conductor</p>
                <p className="text-[9px] text-green-500 font-black uppercase mt-1">● En línea ahora</p>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4 bg-slate-50/50 text-left">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm max-w-[85%]">
                <p className="text-xs font-bold italic text-slate-700">Hola, soy tu conductor. Tengo tu reserva para {viajeActivo?.destino}.</p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border">Cancelar Viaje</button>
                <button className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">¡Ya llegué!</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Reserva */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6">
            <div className="flex justify-between items-start">
               <div className="flex gap-4 text-left">
                  <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black italic">C</div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase">Conductor Verificado</p>
                    <h2 className="text-2xl font-black italic uppercase text-slate-800">{viajeSeleccionado.conductor || "Chofer"}</h2>
                  </div>
               </div>
               <button onClick={() => setViajeSeleccionado(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X/></button>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-2xl text-left">
               <p className="text-[10px] font-black text-blue-600 uppercase mb-1 italic">Notas del conductor:</p>
               <p className="text-xs font-bold italic text-slate-600">"{viajeSeleccionado.detallesExtras || "Sin notas adicionales"}"</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => { setViajeActivo(viajeSeleccionado); setViajeSeleccionado(null); setVista('chat_conductor'); }} className="flex-1 py-5 bg-slate-100 rounded-[22px] font-black text-[10px] uppercase text-slate-600">Chat</button>
               <button onClick={() => manejarReserva(viajeSeleccionado)} className="flex-[2] py-5 bg-blue-600 rounded-[22px] font-black text-[10px] uppercase text-white shadow-2xl">Confirmar Reserva (${viajeSeleccionado.precio})</button>
            </div>
          </div>
        </div>
      )}

      {/* Navegación Inferior */}
      <nav className="absolute bottom-6 left-6 right-6 bg-slate-900/95 backdrop-blur-xl rounded-[35px] p-4 flex justify-around items-center z-40 border border-white/10 shadow-2xl">
          <button onClick={() => setVista('inicio')} className={`p-2 ${vista === 'inicio' ? 'text-blue-400' : 'text-slate-50'}`}><Search size={26}/></button>
          <button onClick={() => setVista('chat_soporte')} className="p-2 text-slate-50"><Headset size={26}/></button>
          <button onClick={() => setVista('perfil')} className={`p-2 ${vista === 'perfil' ? 'text-blue-400' : 'text-slate-50'}`}><User size={26}/></button>
      </nav>
    </div>
  );
}
