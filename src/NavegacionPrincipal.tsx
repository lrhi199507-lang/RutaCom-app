import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, onSnapshot, setDoc, updateDoc, collection, query 
} from 'firebase/firestore'; 
import { 
  Search, MessageCircle, Star, Wallet, User, LogOut, Send, Save, Car
} from 'lucide-react';

const ESTADOS = ["Caracas", "Valencia", "Barquisimeto", "Maracay", "Puerto La Cruz", "Mérida"];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState('inicio'); 
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  
  // Estado para los viajes REALES de la base de datos
  const [viajesReales, setViajesReales] = useState<any[]>([]);
  
  const [userData, setUserData] = useState({ 
    nombre: "", 
    telefono: "",
    saldo: 50.0, 
    rating: 5.0, 
    viajesRealizados: 0 
  });

  const [editando, setEditando] = useState(false);

  // 1. ESCUCHAR DATOS DEL USUARIO
  useEffect(() => {
    if (!user) return;
    const userDoc = doc(db, 'usuarios', user.uid);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data() as any);
      } else {
        setDoc(userDoc, {
          nombre: "Nuevo Usuario",
          telefono: "",
          saldo: 50.0,
          rating: 5.0,
          correo: user.email
        });
      }
    });
    return () => unsub();
  }, [user]);

  // 2. ESCUCHAR VIAJES EN TIEMPO REAL
  useEffect(() => {
    // Apuntamos a la colección que acabas de crear
    const q = query(collection(db, "Viajes")); 
    const unsubViajes = onSnapshot(q, (snapshot) => {
      const listaViajes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setViajesReales(listaViajes);
    });
    return () => unsubViajes();
  }, []);

  const guardarPerfil = async () => {
    try {
      const userDoc = doc(db, 'usuarios', user.uid);
      await updateDoc(userDoc, {
        nombre: userData.nombre,
        telefono: userData.telefono
      });
      setEditando(false);
      alert("¡Perfil actualizado!");
    } catch (error) {
      alert("Error al guardar: " + error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="p-6 pt-12 bg-white flex justify-between items-center border-b shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl">R</div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-400 italic">RutaCom Pro</p>
            <p className="text-xs font-bold uppercase">{userData.nombre || "Cargando..."}</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
          <Wallet size={12} className="text-blue-400"/>
          <span className="text-[11px] font-black italic">${userData.saldo.toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32">
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
                <p className="text-[10px] font-black text-slate-400 uppercase italic px-2">Viajes Disponibles</p>
                
                {/* AHORA USAMOS viajesReales EN LUGAR DE EJEMPLOS */}
                {viajesReales.length === 0 ? (
                  <div className="text-center p-10 text-slate-400 text-xs italic font-bold">No hay viajes publicados hoy...</div>
                ) : (
                  viajesReales.filter(v => busqueda === "" || v.destino === busqueda).map(v => (
                    <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border shadow-sm flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex gap-3 text-left">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Car size={20}/>
                          </div>
                          <div>
                              <p className="font-black text-xs uppercase italic tracking-tight">{v.conductor}</p>
                              <p className="text-[9px] font-bold text-slate-400 italic mt-1">{v.vehiculo} • {v.destino}</p>
                          </div>
                        </div>
                        <p className="text-xl font-black italic text-blue-600">${v.precio}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {/* ... (Resto de las vistas: chat y perfil se mantienen igual) ... */}
        {vista === 'perfil' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-blue-600"><User size={40}/></div>
            <div className="bg-white p-6 rounded-[30px] border shadow-sm text-left">
               <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">Mis Datos</p>
                  <button onClick={() => editando ? guardarPerfil() : setEditando(true)} className="text-blue-600 text-[10px] font-black uppercase italic flex items-center gap-1">
                    {editando ? "Guardar" : "Editar"}
                  </button>
               </div>
               <div className="space-y-4">
                 <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Nombre</label>
                    {editando ? <input className="w-full p-2 bg-slate-50 rounded-lg text-xs font-bold" value={userData.nombre} onChange={e => setUserData({...userData, nombre: e.target.value})}/> : <p className="font-black italic text-sm">{userData.nombre}</p>}
                 </div>
                 <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Teléfono</label>
                    {editando ? <input className="w-full p-2 bg-slate-50 rounded-lg text-xs font-bold" value={userData.telefono} onChange={e => setUserData({...userData, telefono: e.target.value})}/> : <p className="font-black italic text-sm">{userData.telefono || "Sin registrar"}</p>}
                 </div>
               </div>
            </div>
            <button onClick={() => signOut(auth)} className="w-full py-4 text-red-500 font-black italic uppercase text-[10px] border border-red-50 rounded-2xl mt-4 flex items-center justify-center gap-2">
              <LogOut size={14}/> Cerrar Sesión
            </button>
          </div>
        )}
      </main>

      <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-full p-4 flex justify-around items-center z-40 border shadow-2xl">
        <button onClick={() => setVista('inicio')} className={`${vista === 'inicio' ? 'text-blue-600' : 'text-slate-300'}`}><Search size={22}/></button>
        <button onClick={() => setVista('chat')} className={`${vista === 'chat' ? 'text-blue-600' : 'text-slate-300'}`}><MessageCircle size={22}/></button>
        <button onClick={() => setVista('perfil')} className={`${vista === 'perfil' ? 'text-blue-600' : 'text-slate-300'}`}><User size={22}/></button>
      </nav>
    </div>
  );
}
