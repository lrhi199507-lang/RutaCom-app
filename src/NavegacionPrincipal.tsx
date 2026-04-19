import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { UBICACIONES } from './constants/ubicaciones';

// Layout y UI
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';

// Vistas - Carpeta 'views' confirmada
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaPerfilCompleto } from './components/views/VistaPerfilCompleto';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';

// Helpers y Modales
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, deleteDoc, getDoc
} from "firebase/firestore";

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [historialChats, setHistorialChats] = useState([]);
  const [misViajesPublicados, setMisViajesPublicados] = useState([]);
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeEditando, setViajeEditando] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
  const [misSolicitudes, setMisSolicitudes] = useState([]);

  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // --- ESCUCHA DE DATOS (FIREBASE) ---
  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData({ id: snap.id, ...snap.data() });
    });

    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMisViajes = onSnapshot(query(collection(db, "Viajes"), where("idCreador", "==", user.uid)), (snap) => {
      setMisViajesPublicados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), (snap) => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubUser(); unsubViajes(); unsubMisViajes(); unsubMisSoli(); 
    };
  }, [user]);

  const handleLogout = () => signOut(auth);

  if (!userData) return <div className="h-screen bg-white flex items-center justify-center text-blue-600 font-black animate-pulse text-xs uppercase italic">Cargando Dame la Cola...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      <div className="p-4 border-b bg-white z-40 shadow-sm">
        <Header userData={userData} modo={modo} />
      </div> 

      <main className="flex-1 overflow-y-auto pb-24">
        {vista === "inicio" && (
          modo === "pasajero" ? (
            <VistaInicio 
              userData={userData}
              viajes={Array.isArray(viajes) ? viajes : []} 
              setViajeSeleccionado={(v) => { setViajeSeleccionado(v); setVista("detalle_viaje"); }} 
              setVista={setVista} 
            />
          ) : (
            <WizardPublicar 
              userData={userData}
              pasoWizard={pasoWizard} setPasoWizard={setPasoWizard}
              viajeForm={viajeForm} setViajeForm={setViajeForm}
              UBICACIONES={UBICACIONES} setVista={setVista} 
              setModo={setModo} 
            />
          )
        )}

        {vista === "detalle_viaje" && viajeSeleccionado && (
          <VistaDetalleViaje 
            viaje={viajeSeleccionado} 
            onRegresar={() => setVista("inicio")} 
          />
        )}

        {vista === "mis_viajes" && (
          <VistaMisViajes 
            misPublicaciones={misViajesPublicados}
            viajesDondeVoy={misSolicitudes.filter(s => s.estado === "confirmado")}
          />
        )}

        {vista === "inbox" && (
          <VistaInbox historialChats={historialChats} misViajesPublicados={misViajesPublicados} abrirChat={() => {}} />
        )}

        {vista === "perfil" && (
          <VistaPerfil 
            userData={userData} 
            handleLogout={handleLogout} 
            pestañaActiva={pestañaPerfil} 
            setPestañaActiva={setPestañaPerfil} 
          />
        )}
      </main>

      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={setPasoWizard} />
    </div>
  );
}
