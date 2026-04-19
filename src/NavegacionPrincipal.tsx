import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// UI y Layout
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';

// Vistas (Asegúrate que estas rutas existan en tus carpetas)
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
import { Wallet } from './components/views/Wallet';
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

// IMPORTANTE: Este "default" es lo que App.tsx necesita para no quedarse en blanco
export default function NavegacionPrincipal({ user }) {
  
  // 1. ESTADOS (Aquí es donde estaba el error, faltaban variables)
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico"); 
  const [perfilPublico, setPerfilPublico] = useState(null); // <--- ESTA FALTABA
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // 2. CONEXIÓN CON BASE DE DATOS
  useEffect(() => {
    if (!user?.uid) return;

    // Datos del usuario
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      setUserData(snap.exists() ? { id: snap.id, ...snap.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });

    // Cargar viajes disponibles
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  const handleLogout = () => signOut(auth);

  // 3. PANTALLA DE CARGA (Para que veas que la app está viva)
  if (!userData) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center animate-bounce shadow-xl">
          <span className="text-white font-black text-3xl italic">D</span>
        </div>
        <p className="mt-4 text-slate-400 font-bold animate-pulse uppercase text-[10px] tracking-widest">Cargando DameLaCola...</p>
      </div>
    );
  }

  // 4. RENDERIZADO DE VISTAS
  const renderContenido = () => {
    switch (vista) {
      case "inicio":
        if (viajeSeleccionado) {
          return <VistaDetalleViaje viaje={viajeSeleccionado} onRegresar={() => setViajeSeleccionado(null)} />;
        }
        return modo === "pasajero" ? (
          <VistaInicio viajes={viajes} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} userData={userData} />
        ) : (
          <WizardPublicar pasoWizard={pasoWizard} setPasoWizard={setPasoWizard} viajeForm={viajeForm} setViajeForm={setViajeForm} setVista={setVista} setModo={setModo} />
        );
      case "mis_viajes":
        return <VistaMisViajes misPublicaciones={[]} viajesDondeVoy={[]} />;
      case "inbox":
        return <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={() => {}} />;
      case "perfil":
        return <VistaPerfil userData={userData} handleLogout={handleLogout} pestañaActiva={pestañaPerfil} setPestañaActiva={setPestañaPerfil} />;
      case "wallet":
        return <Wallet userData={userData} />;
      case "chat_privado":
        return chatActivo ? <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} /> : setVista("inbox");
      default:
        return <VistaInicio viajes={viajes} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} userData={userData} />;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {renderContenido()}
      </main>

      <Navbar 
        vista={vista} 
        modo={modo} 
        setVista={setVista} 
        setModo={setModo} 
        setPasoWizard={setPasoWizard} 
      />

      {/* El modal que antes daba error por no estar definido */}
      {perfilPublico && (
        <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />
      )}
    </div>
  );
}
