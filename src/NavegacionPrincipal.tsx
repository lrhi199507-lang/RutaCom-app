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
import { Wallet } from './components/views/Wallet'; // Agregada según tu archivo

// Helpers y Modales
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

import {
  doc, onSnapshot, collection, query, orderBy, where, deleteDoc
} from "firebase/firestore";

export default function NavegacionPrincipal({ user }) {
  // 1. ESTADOS PRINCIPALES
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

  // 2. ESTADO DEL FORMULARIO DE PUBLICACIÓN
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // 3. FILTRADO DE VIAJES (Para VistaInicio)
  const viajesFiltrados = useMemo(() => {
    return Array.isArray(viajes) ? viajes : [];
  }, [viajes]);

  // 4. ESCUCHA DE DATOS (FIREBASE)
  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData({ id: snap.id, ...snap.data() });
      } else {
        setUserData({ id: user.uid, nombre: "Usuario", saldo: 0 });
      }
    });

    const qViajes = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    const unsubViajes = onSnapshot(qViajes, (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Escuchar chats para el Inbox
    const qChats = query(collection(db, "Chats"), where("participantes", "array-contains", user.uid));
    const unsubChats = onSnapshot(qChats, (snap) => {
      setHistorialChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubViajes(); unsubChats(); };
  }, [user]);

  const handleLogout = () => signOut(auth);
  const abrirChat = (viajeId, otroId, nombre) => {
    setChatActivo({ idViaje: viajeId, idOtro: otroId, nombreOtro: nombre, idPropio: user.uid });
    setVista("chat_privado");
  };

  if (!userData) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center animate-bounce mb-4">
        <span className="text-white font-black text-3xl italic">D</span>
      </div>
      <p className="text-blue-600 font-black italic uppercase text-xs tracking-widest">Iniciando Dame la Cola...</p>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl font-sans">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto pb-24">
        {vista === "inicio" && (
          <div className="pt-2">
            {viajeSeleccionado ? (
              <VistaDetalleViaje 
                viaje={viajeSeleccionado} 
                onRegresar={() => setViajeSeleccionado(null)} 
              />
            ) : (
              modo === "pasajero" ? (
                <VistaInicio 
                  viajes={viajesFiltrados} 
                  setViajeSeleccionado={setViajeSeleccionado} 
                  setVista={setVista} 
                  userData={userData}
                />
              ) : (
                <WizardPublicar 
                  pasoWizard={pasoWizard} setPasoWizard={setPasoWizard}
                  viajeForm={viajeForm} setViajeForm={setViajeForm}
                  UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo}
                />
              )
            )}
          </div>
        )}

        {vista === "mis_viajes" && (
          <VistaMisViajes 
            misPublicaciones={misViajesPublicados}
            viajesDondeVoy={misSolicitudes.filter(s => s.estado === "confirmado")}
          />
        )}

        {vista === "inbox" && (
          <VistaInbox 
            historialChats={historialChats} 
            misViajesPublicados={misViajesPublicados} 
            abrirChat={abrirChat} 
          />
        )}

        {vista === "chat_privado" && chatActivo && (
          <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} />
        )}

        {vista === "perfil" && (
          <VistaPerfil 
            userData={userData} 
            handleLogout={handleLogout} 
            pestañaActiva={pestañaPerfil} 
            setPestañaActiva={setPestañaPerfil} 
          />
        )}

        {vista === "wallet" && (
          <Wallet userData={userData} />
        )}
      </main>

      <Navbar 
        vista={vista} 
        modo={modo} 
        setVista={setVista} 
        setModo={setModo} 
        setPasoWizard={setPasoWizard} 
      />
      
      {perfilPublico && (
        <ModalPerfilPublico 
          perfilPublico={perfilPublico} 
          setPerfilPublico={setPerfilPublico} 
        />
      )}
    </div>
  );
}
