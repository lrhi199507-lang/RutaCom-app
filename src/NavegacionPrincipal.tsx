import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { UBICACIONES } from './constants/ubicaciones';

// Layout y UI
import { Navbar } from "./components/layout/Navbar";

// Vistas
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaPerfilCompleto } from './components/views/VistaPerfilCompleto';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje'; 

import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, deleteDoc, getDoc
} from "firebase/firestore";

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");

  // Escuchar datos del usuario
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "Usuarios", user.uid), (doc) => {
      setUserData(doc.exists() ? { id: doc.id, ...doc.data() } : null);
    });
    return () => unsub();
  }, [user]);

  // Escuchar viajes activos
  useEffect(() => {
    const q = query(collection(db, "Viajes"), orderBy("fechaCreacion", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setViajes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-20">
        {vista === "inicio" && (
          <VistaInicio 
            viajes={viajes} 
            setViajeSeleccionado={(v) => { setViajeSeleccionado(v); setVista("detalle_viaje"); }} 
            userData={userData} 
          />
        )}

        {vista === "detalle_viaje" && (
          <VistaDetalleViaje 
            viaje={viajeSeleccionado} 
            onRegresar={() => setVista("inicio")} 
          />
        )}

        {vista === "inbox" && (
          <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={() => {}} />
        )}

        {vista === "perfil" && userData && (
          <VistaPerfil 
            userData={userData} 
            handleLogout={handleLogout} 
            pestañaActiva={pestañaPerfil} 
            setPestañaActiva={setPestañaPerfil} 
          />
        )}
      </main>

      {/* Navbar fijo abajo */}
      <Navbar vista={vista} setVista={setVista} />
    </div>
  );
} // <--- ESTA ES LA LLAVE QUE FALTABA
