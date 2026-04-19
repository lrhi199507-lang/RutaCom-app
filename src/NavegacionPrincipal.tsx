import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// Componentes
import { Navbar } from "./components/layout/Navbar";
import { VistaInicio } from './components/views/VistaInicio';

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]); // Inicia como lista vacía para evitar errores de .filter
  const [vista, setVista] = useState("inicio");

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Datos del usuario
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData({ id: snap.id, ...snap.data() });
    });

    // 2. Viajes (con seguro para que siempre sea una lista)
    const qViajes = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    const unsubViajes = onSnapshot(qViajes, (snap) => {
      const listaViajes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setViajes(listaViajes || []); 
    });

    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  const handleLogout = () => signOut(auth);

  if (!userData) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-blue-600 font-black animate-pulse uppercase italic text-sm">
          Cargando Dame la Cola...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden shadow-2xl">
      <main className="flex-1 overflow-y-auto">
        {vista === "inicio" && (
          <VistaInicio 
            userData={userData}
            viajes={Array.isArray(viajes) ? viajes : []} 
            setViajeSeleccionado={() => {}} 
            setVista={setVista} 
          />
        )}
      </main>

      <Navbar vista={vista} setVista={setVista} />
    </div>
  );
}
