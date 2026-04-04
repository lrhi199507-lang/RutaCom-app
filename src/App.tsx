import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { 
  Search, MapPin, MessageCircle, ChevronLeft, Send, 
  Star, Car, Wallet, User, LogOut, Navigation, 
  Plus, X, ShieldAlert, ShieldCheck, Camera, 
  Trophy, ArrowRight, MessageSquare, AlertTriangle, Clock,
  Map as MapIcon, ShieldEllipsis, ChevronRight
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCXBs3-Z4-SC2UUAtZhjMgMZ74sD9rqq9Y",
  authDomain: "rutacom-4ea87.firebaseapp.com",
  projectId: "rutacom-4ea87",
  storageBucket: "rutacom-4ea87.firebasestorage.app",
  messagingSenderId: "1080063705561",
  appId: "1:1080063705561:web:13da1c6fe35eb0e40ad9c8",
  measurementId: "G-2TYQF2QBYD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

const EJEMPLOS_VIAJES = [
  { id: 'e1', destino: 'Caracas', precio: 10, conductor: 'Carlos Mendoza', vehiculo: 'Toyota Corolla', rating: 4.8 },
  { id: 'e2', destino: 'Valencia', precio: 12, conductor: 'Elena Rodríguez', vehiculo: 'Ford Fiesta', rating: 4.9 }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [vista, setVista] = useState('login_main'); 
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [viajeActivo, setViajeActivo] = useState(null);
  const [userData, setUserData] = useState({ 
    nombre: "Usuario", saldo: 50.0, rating: 5.0, viajesRealizados: 0, historial: [] 
  });
  const [mensajesSoporte, setMensajesSoporte] = useState([{ id: 1, text: "Hola, bienvenido al soporte real.", sender: "bot" }]);
  const [inputMsg, setInputMsg] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setVista('inicio'); }
      else { signInAnonymously(auth); }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) { setUserData(snap.data()); }
      else { setDoc(userDoc, userData); }
    });
    return () => unsub();
  }, [user]);

  const handleEnviarMsg = (tipo) => {
    if (!inputMsg.trim()) return;
    const nuevoMsg = { 
      id: Date.now(), 
      text: inputMsg, 
      sender: 'yo',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (tipo === 'soporte') {
      setMensajesSoporte(prev => [...prev, nuevoMsg]);
      setTimeout(() => {
        setMensajesSoporte(prev => [...prev, { 
          id: Date.now() + 1, 
          text: "Mensaje recibido. Un agente de RutaCom se conectará pronto.", 
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1500);
    }
    setInputMsg("");
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 flex flex-col">
      {/* HEADER */}
      {!['login_main'].includes(vista) && (
        <header className="p-6 pt-12 bg-white flex justify-between items-center border-b shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl">R</div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 italic">RutaCom Pro</p>
              <div className="flex items-center gap-1 text-yellow-500 font-black text-[10px] italic">
                 <Star size={10} fill="currentColor"/> {userData.rating.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
            <Wallet size={12} className="text-blue-400"/>
            <span className="text-[11px] font-black italic">${userData.saldo.toFixed(2)}</span>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        {vista === 'login_main' && (
          <div className="h-full flex flex-col justify-center items-center bg-slate-900 text-white p-10 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl font-black italic mb-6">R</div>
            <h1 className="text-3xl font-black italic mb-2 tracking-tighter">RutaCom</h1>
            <p className="text-slate-500 font-bold italic text-[10px] mb-12 tracking-[0.3em] uppercase">Conectando Destinos</p>
            <button onClick={() => setVista('inicio')} className="w-full bg-blue-600 py-5 rounded-2xl font-black italic uppercase text-xs shadow-lg active:scale-95 transition-all">Entrar a la App</button>
          </div>
        )}

        {vista === 'inicio' && (
          <div className="space-y-6">
             <div className="bg-white p-5 rounded-[25px] border shadow-sm flex items-center gap-4 active:bg-slate-50" onClick={() => setMostrarDestinos(!mostrarDestinos)}>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Search size={20}/></div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black uppercase text-slate-400 italic">Destino</p>
                  <p className="text-sm font-black uppercase">{busqueda || "Selecciona destino"}</p>
                </div>
             </div>
             {mostrarDestinos && (
               <div className="grid grid-cols-2 gap-2">
                 {ESTADOS.map(e => (
                   <button key={e} onClick={() => {setBusqueda(e); setMostrarDestinos(false);}} className="bg-white p-4 rounded-xl font-black text-[9px] uppercase border shadow-sm active:bg-blue-50">{e}</button>
                 ))}
               </div>
             )}
             <div className="space-y-4">
                {EJEMPLOS_VIAJES.filter(v => busqueda === "" || v.destino === busqueda).map(v => (
                   <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                      <div className="flex gap-3 text-left">
                         <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black italic text-slate-400">{v.conductor[0]}</div>
                         <div>
                            <p className="font-black text-xs uppercase italic tracking-tight">{v.conductor}</p>
                            <p className="text-[9px] font-bold text-slate-400 italic mt-1">{v.vehiculo}</p>
                         </div>
                      </div>
                      <p className="text-xl font-black italic text-blue-600">${v.precio}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

        {vista === 'chat' && (
          <div className="h-full flex flex-col">
             <div className="flex-1 space-y-4 overflow-y-auto mb-4 text-left">
                {mensajesSoporte.map(m => (
                  <div key={m.id} className={`max-w-[80%] ${m.sender === 'yo' ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                    <div className={`p-4 rounded-2xl shadow-sm ${m.sender === 'yo' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800'}`}>
                      <p className="font-bold text-[11px] italic leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
             </div>
             <div className="flex gap-2 p-2 bg-white border rounded-full shadow-lg">
                <input value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder="Escribe..." className="flex-1 px-4 text-[11px] font-bold outline-none bg-transparent"/>
                <button onClick={() => handleEnviarMsg('soporte')} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"><Send size={16}/></button>
             </div>
          </div>
        )}

        {vista === 'perfil' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-blue-600"><User size={40}/></div>
            <h2 className="text-xl font-black italic uppercase">Mi Perfil</h2>
            <div className="bg-white p-6 rounded-[30px] border shadow-sm text-left">
               <p className="text-[10px] font-black text-slate-400 uppercase italic mb-4">Información</p>
               <div className="flex justify-between py-2 border-b">
                 <span className="text-[10px] font-bold uppercase italic text-slate-500">Viajes</span>
                 <span className="text-xs font-black italic">{userData.viajesRealizados}</span>
               </div>
               <div className="flex justify-between py-2">
                 <span className="text-[10px] font-bold uppercase italic text-slate-500">Saldo</span>
                 <span className="text-xs font-black italic text-green-600">${userData.saldo.toFixed(2)}</span>
               </div>
            </div>
            <button onClick={() => setVista('login_main')} className="w-full py-4 text-red-500 font-black italic uppercase text-[10px] flex items-center justify-center gap-2 border border-red-50 rounded-2xl"><LogOut size={14}/> Cerrar Sesión</button>
          </div>
        )}
      </main>

      {/* NAV */}
      {!['login_main'].includes(vista) && (
        <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-full p-4 flex justify-around items-center z-40 border shadow-2xl">
          <button onClick={() => setVista('inicio')} className={`${vista === 'inicio' ? 'text-blue-600' : 'text-slate-300'}`}><Search size={22}/></button>
          <button onClick={() => setVista('chat')} className={`${vista === 'chat' ? 'text-blue-600' : 'text-slate-300'}`}><MessageCircle size={22}/></button>
          <button onClick={() => setVista('perfil')} className={`${vista === 'perfil' ? 'text-blue-600' : 'text-slate-300'}`}><User size={22}/></button>
        </nav>
      )}

      {viajeSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-end">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViajeSeleccionado(null)}></div>
           <div className="relative w-full bg-white rounded-t-[40px] p-8 text-center shadow-2xl">
              <h4 className="text-xl font-black italic uppercase mb-2">{viajeSeleccionado.conductor}</h4>
              <p className="text-[10px] font-black text-blue-500 uppercase italic mb-6">{viajeSeleccionado.vehiculo}</p>
              <button onClick={() => { setViajeSeleccionado(null); alert('Viaje Aceptado'); }} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black italic uppercase text-xs">Confirmar Viaje</button>
           </div>
        </div>
      )}
    </div>
  );
  }
