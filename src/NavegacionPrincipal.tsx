import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// Componentes - Verifica que la carpeta sea 'views'
import { Navbar } from "./components/layout/Navbar";
import { VistaInicio } from './components/views/VistaInicio';

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]); 
  const [vista, setVista] = useState("inicio");

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Datos del usuario (con nombre de colección corregido según tu código)
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData({ id: snap.id, ...snap.data() });
      } else {
        // Si no existe el doc, ponemos un nombre genérico para que no falle
        setUserData({ id: user.uid, nombre: "Usuario" });
      }
    });

    // 2. Viajes (Asegurando que SIEMPRE sea una lista)
    const qViajes = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    const unsubViajes = onSnapshot(qViajes, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setViajes(Array.isArray(lista) ? lista : []); 
    }, (error) => {
      console.error("Error en Firebase:", error);
      setViajes([]); // Si hay error de permisos, lista vacía
    });

    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  const handleLogout = () => signOut(auth);

  // Si aún no hay datos del usuario, nos quedamos en la pantalla de carga
  if (!userData) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-blue-600 font-black animate-pulse italic">CARGANDO PERFIL...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      <main className="flex-1 overflow-y-auto">
        {vista === "inicio" && (
          <VistaInicio 
            userData={userData}
            viajes={viajes || []} 
            setViajeSeleccionado={() => {}} 
            setVista={setVista} 
          />
        )}
        
        {/* Vista temporal por si la principal falla */}
        {vista !== "inicio" && (
          <div className="p-10 text-center">
            <button onClick={() => setVista("inicio")} className="text-blue-600 font-bold underline">
              Volver al inicio
            </button>
          </div>
        )}
      </main>

      <Navbar vista={vista} setVista={setVista} />
    </div>
  );
}
