import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// IMPORTACIONES
import { Navbar } from "./components/layout/Navbar";
import { VistaInicio } from './components/views/VistaInicio';
// Importamos el Header desde la ubicación que me pasaste
import { Header } from './components/ui/Header'; 

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSel, setViajeSel] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    // Escuchar datos del usuario
    const unsubU = onSnapshot(doc(db, "usuarios", user.uid), (s) => {
      setUserData(s.exists() ? { id: s.id, ...s.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });
    // Escuchar viajes
    const unsubV = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (s) => {
      setViajes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubU(); unsubV(); };
  }, [user]);

  // Pantalla de carga mientras llega Firebase
  if (!userData) return <div className="h-screen flex items-center justify-center font-black text-blue-600 italic uppercase">Cargando Datos...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      
      {/* EL HEADER BLANCO AHORA ESTÁ AQUÍ (Ubicación fija arriba) */}
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {vista === "inicio" && (
          <VistaInicio 
            viajes={viajes} 
            setViajeSeleccionado={setViajeSel} 
            setVista={setVista} 
            userData={userData}
            modo={modo} 
          />
        )}
        
        {/* Vistas temporales */}
        {vista !== "inicio" && (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Vista {vista} en desarrollo</p>
            <button onClick={() => setVista("inicio")} className="mt-4 text-blue-600 font-black underline text-xs italic uppercase">VOLVER AL INICIO</button>
          </div>
        )}
      </main>

      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={() => {}} />
    </div>
  );
}
