import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// --- RUTAS CORREGIDAS A MINÚSCULAS ---
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';

import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
import { Wallet } from './components/views/Wallet';
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

// Archivo de constantes en minúscula
import { UBICACIONES } from './constants/ubicaciones'; 

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico"); 
  const [perfilPublico, setPerfilPublico] = useState(null); 
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  useEffect(() => {
    if (!user?.uid) return;
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      setUserData(snap.exists() ? { id: snap.id, ...snap.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  // Pantalla de carga para confirmar que el archivo cargó
  if (!userData) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <div style={{ width: '60px', height: '60px', backgroundColor: '#2563eb', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '30px', fontWeight: 'bold' }}>
          D
        </div>
        <p style={{ marginTop: '20px', color: '#64748b', fontWeight: 'bold' }}>CARGANDO...</p>
      </div>
    );
  }

  const renderContenido = () => {
    switch (vista) {
      case "inicio":
        if (viajeSeleccionado) return <VistaDetalleViaje viaje={viajeSeleccionado} onRegresar={() => setViajeSeleccionado(null)} />;
        return modo === "pasajero" ? (
          <VistaInicio viajes={viajes} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} userData={userData} />
        ) : (
          <WizardPublicar pasoWizard={pasoWizard} setPasoWizard={setPasoWizard} viajeForm={viajeForm} setViajeForm={setViajeForm} setVista={setVista} setModo={setModo} />
        );
      case "mis_viajes": return <VistaMisViajes misPublicaciones={[]} viajesDondeVoy={[]} />;
      case "inbox": return <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={() => {}} />;
      case "perfil": return <VistaPerfil userData={userData} handleLogout={() => signOut(auth)} pestañaActiva={pestañaPerfil} setPestañaActiva={setPestañaPerfil} />;
      case "wallet": return <Wallet userData={userData} />;
      case "chat_privado": return chatActivo ? <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} /> : null;
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      <Header userData={userData} modo={modo} />
      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {renderContenido()}
      </main>
      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={setPasoWizard} />
      {perfilPublico && <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />}
    </div>
  );
}
