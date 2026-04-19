import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// Layout y UI
import { Navbar } from "./components/layout/Navbar";

// Vistas - Verifica que la carpeta sea 'views' o 'vistas'
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");

  // Escuchar datos del usuario
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "Usuarios", user.uid), (docSnap) => {
      setUserData(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
    });
    return () => unsub();
  }, [user]);

  // Escuchar viajes activos
  useEffect(() => {
    const q = query(collection(db, "Viajes"), orderBy("fechaCreacion", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setViajes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleLogout = () => signOut(auth);

  // Sistema de navegación
  const renderVista = () => {
    switch(vista) {
      case "inicio":
        return (
          <VistaInicio 
            viajes={viajes} 
            setViajeSeleccionado={(v) => { setViajeSeleccionado(v); setVista("detalle_viaje"); }} 
            userData={userData} 
          />
        );
      case "detalle_viaje":
        return <VistaDetalleViaje viaje={viajeSeleccionado} onRegresar={() => setVista("inicio")} />;
      case "inbox":
        return <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={() => {}} />;
      case "perfil":
        return (
          <VistaPerfil 
            userData={userData} 
            handleLogout={handleLogout} 
            pestañaActiva={pestañaPerfil} 
            setPestañaActiva={setPestañaPerfil} 
          />
        );
      default:
        return <VistaInicio viajes={viajes} setViajeSeleccionado={setViajeSeleccionado} userData={userData} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-20">
        {renderVista()}
      </main>
      <Navbar vista={vista} setVista={setVista} />
    </div>
  );
}
