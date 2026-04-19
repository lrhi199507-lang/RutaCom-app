import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { UBICACIONES } from './constants/ubicaciones';

// Layout y UI
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';

// Vistas
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
import { Wallet } from './components/views/Wallet';

// Helpers y Modales
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

import {
  doc, onSnapshot, collection, query, orderBy, where, deleteDoc
} from "firebase/firestore";

export default function NavegacionPrincipal({ user }) {
  // --- ESTADOS ---
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [historialChats, setHistorialChats] = useState([]);
  const [misViajesPublicados, setMisViajesPublicados] = useState([]);
  const [pasoWizard, setPasoWizard] = useState(1);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [perfilPublico, setPerfilPublico] = useState(null);

  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // --- ESCUCHA DE FIREBASE ---
  useEffect(() => {
    if (!user) return;

    // Datos del usuario
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData({ id: snap.id, ...snap.data() });
      } else {
        setUserData({ id: user.uid, nombre: "Usuario Nuevo", saldo: 0 });
      }
    });

    // Viajes globales
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setViajes([]));

    // Mis viajes publicados (Chofer)
    const unsubMisV = onSnapshot(query(collection(db, "Viajes"), where("idCreador", "==", user.uid)), (snap) => {
      setMisViajesPublicados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubViajes(); unsubMisV(); };
  }, [user]);

  // --- FUNCIONES ---
  const handleLogout = () => signOut(auth);
  
  const abrirChat = (vId, oId, nombre) => {
    setChatActivo({ id: vId, idViaje: vId, idOtro: oId, nombreOtro: nombre, idPropio: user.uid });
    setVista("chat_privado");
  };

  const viajesFiltrados = useMemo(() => Array.isArray(viajes) ? viajes : [], [viajes]);

  // --- RENDER ---
  if (!userData) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center animate-bounce shadow-xl">
        <span className="text-white font-black text-3xl italic">D</span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {vista === "inicio" && (
          viajeSeleccionado ? (
            <VistaDetalleViaje viaje={viajeSeleccionado} onRegresar={() => setViajeSeleccionado(null)} />
          ) : modo === "pasajero" ? (
            <VistaInicio viajes={viajesFiltrados} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} userData={userData} />
          ) : (
            <WizardPublicar pasoWizard={pasoWizard} setPasoWizard={setPasoWizard} viajeForm={viajeForm} setViajeForm={setViajeForm} UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo} />
          )
        )}

        {vista === "mis_viajes" && (
          <VistaMisViajes misPublicaciones={misViajesPublicados} viajesDondeVoy={[]} />
        )}

        {vista === "inbox" && (
          <VistaInbox historialChats={historialChats} misViajesPublicados={misViajesPublicados} abrirChat={abrirChat} />
        )}

        {vista === "chat_privado" && chatActivo && (
          <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} />
        )}

        {vista === "perfil" && (
          <VistaPerfil userData={userData} handleLogout={handleLogout} pestañaActiva={pestañaPerfil} setPestañaActiva={setPestañaPerfil} />
        )}

        {vista === "wallet" && <Wallet userData={userData} />}
      </main>

      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={setPasoWizard} />
      
      {perfilPublico && <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />}
    </div>
  );
}
