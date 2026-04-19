import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// RUTAS EN MINÚSCULAS (Como están en tus carpetas)
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
import { UBICACIONES } from './constants/ubicaciones'; 

// AGREGAMOS "DEFAULT" - Esto es lo que soluciona la pantalla blanca
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

  const handleLogout = () => signOut(auth);

  if (!userData) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center animate-bounce">
          <span className="text-white font-black text-3xl italic">D</span>
        </div>
        <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase">Cargando DameLaCola...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {vista === "inicio" && (
          viajeSeleccionado ? (
            <VistaDetalleViaje viaje={viajeSeleccionado} onRegresar={() => setViajeSeleccionado(null)} />
          ) : (
            modo === "pasajero" ? (
              <VistaInicio viajes={viajes} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} userData={userData} />
            ) : (
              <WizardPublicar pasoWizard={pasoWizard} setPasoWizard={setPasoWizard} viajeForm={viajeForm} setViajeForm={setViajeForm} UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo} />
            )
          )
        )}

        {vista === "mis_viajes" && <VistaMisViajes misPublicaciones={[]} viajesDondeVoy={[]} />}
        {vista === "inbox" && <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={() => {}} />}
        {vista === "perfil" && <VistaPerfil userData={userData} handleLogout={handleLogout} pestañaActiva={pestañaPerfil} setPestañaActiva={setPestañaPerfil} />}
        {vista === "wallet" && <Wallet userData={userData} />}
        {vista === "chat_privado" && chatActivo && <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} />}
      </main>

      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={setPasoWizard} />
      
      {perfilPublico && <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />}
    </div>
  );
}
