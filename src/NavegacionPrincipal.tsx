import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { UBICACIONES } from './constants/ubicaciones';

// Importación de componentes (Asegúrate de que las carpetas sean estas)
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

import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// ESTO ES LO MÁS IMPORTANTE: export default
export default function NavegacionPrincipal({ user }) {
  
  // 1. Estados de Datos
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  
  // 2. Estados de Navegación (Aquí corregimos lo que faltaba)
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico"); // Necesaria para VistaPerfil
  const [perfilPublico, setPerfilPublico] = useState(null);      // EL CULPABLE: Ahora ya existe
  const [pasoWizard, setPasoWizard] = useState(1);

  // 3. Estado del Formulario
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // 4. Conexión con Firebase
  useEffect(() => {
    if (!user?.uid) return;

    // Escuchar datos del usuario
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      setUserData(snap.exists() ? { id: snap.id, ...snap.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });

    // Escuchar viajes
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  // 5. Funciones básicas
  const handleLogout = () => signOut(auth);
  const abrirChat = (vId, oId, nombre) => {
    setChatActivo({ id: vId, idViaje: vId, idOtro: oId, nombreOtro: nombre, idPropio: user.uid });
    setVista("chat_privado");
  };

  // Pantalla de carga (El icono "D")
  if (!userData) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center animate-bounce shadow-xl">
          <span className="text-white font-black text-3xl italic">D</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {vista === "inicio" && (
          <div className="pt-2">
            {viajeSeleccionado ? (
              <VistaDetalleViaje viaje={viajeSeleccionado} onRegresar={() => setViajeSeleccionado(null)} />
            ) : (
              modo === "pasajero" ? (
                <VistaInicio viajes={viajes} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} userData={userData} />
              ) : (
                <WizardPublicar pasoWizard={pasoWizard} setPasoWizard={setPasoWizard} viajeForm={viajeForm} setViajeForm={setViajeForm} UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo} />
              )
            )}
          </div>
        )}

        {vista === "mis_viajes" && <VistaMisViajes misPublicaciones={[]} viajesDondeVoy={[]} />}
        {vista === "inbox" && <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={abrirChat} />}
        {vista === "chat_privado" && chatActivo && <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} />}
        {vista === "perfil" && <VistaPerfil userData={userData} handleLogout={handleLogout} pestañaActiva={pestañaPerfil} setPestañaActiva={setPestañaPerfil} />}
        {vista === "wallet" && <Wallet userData={userData} />}
      </main>

      {/* El Navbar centralizado */}
      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={setPasoWizard} />
      
      {/* El modal que antes rompía todo ahora es seguro */}
      {perfilPublico && <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />}
    </div>
  );
}
