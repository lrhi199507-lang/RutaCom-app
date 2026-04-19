import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// Importaciones de Layout
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';

// Importaciones de Vistas (Asegúrate que los nombres de los archivos coincidan)
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
import { Wallet } from './components/views/Wallet';
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

// IMPORTANTE: El "default" es lo que hace que App.tsx reconozca este archivo
export default function NavegacionPrincipal({ user }) {
  
  // 1. ESTADOS BÁSICOS (Si alguno de estos falta, la pantalla se pone blanca)
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico"); 
  const [perfilPublico, setPerfilPublico] = useState(null); // <--- Esto era lo que faltaba
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // 2. ESCUCHA DE FIREBASE
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

  // 3. PANTALLA DE CARGA (Para saber que la app está trabajando)
  if (!userData) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <div style={{ padding: '20px', backgroundColor: '#2563eb', borderRadius: '15px', color: 'white', fontWeight: 'bold' }}>
          D
        </div>
        <p style={{ marginLeft: '10px', color: '#64748b' }}>Cargando DameLaCola...</p>
      </div>
    );
  }

  // 4. LÓGICA DE RENDERIZADO
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
              <WizardPublicar pasoWizard={pasoWizard} setPasoWizard={setPasoWizard} viajeForm={viajeForm} setViajeForm={setViajeForm} setVista={setVista} setModo={setModo} />
            )
          )
        )}

        {vista === "mis_viajes" && <VistaMisViajes misPublicaciones={[]} viajesDondeVoy={[]} />}
        {vista === "inbox" && <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={() => {}} />}
        {vista === "perfil" && <VistaPerfil userData={userData} handleLogout={() => signOut(auth)} pestañaActiva={pestañaPerfil} setPestañaActiva={setPestañaPerfil} />}
        {vista === "wallet" && <Wallet userData={userData} />}
      </main>

      <Navbar 
        vista={vista} 
        modo={modo} 
        setVista={setVista} 
        setModo={setModo} 
        setPasoWizard={setPasoWizard} 
      />
      
      {perfilPublico && (
        <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />
      )}
    </div>
  );
}
