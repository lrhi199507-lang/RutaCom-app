import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

// Rutas corregidas (minúsculas)
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
import { UBICACIONES } from './constants/ubicaciones';

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSel, setViajeSel] = useState(null);
  const [pasoW, setPasoW] = useState(1);
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3,
    preferencias: { ac: true, noFumar: true, mascotas: false }
  });

  useEffect(() => {
    if (!user?.uid) return;
    const unsubU = onSnapshot(doc(db, "usuarios", user.uid), (s) => {
      setUserData(s.exists() ? { id: s.id, ...s.data() } : { id: user.uid, nombre: "Usuario" });
    });
    const unsubV = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (s) => {
      setViajes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubU(); unsubV(); };
  }, [user]);

  if (!userData) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">CARGANDO...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      <Header userData={userData} modo={modo} />
      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {vista === "inicio" && (
          viajeSel ? (
            <VistaDetalleViaje viaje={viajeSel} onRegresar={() => setViajeSel(null)} />
          ) : (
            modo === "pasajero" ? (
              <VistaInicio viajes={viajes} setViajeSeleccionado={setViajeSel} setVista={setVista} userData={userData} />
            ) : (
              <WizardPublicar pasoWizard={pasoW} setPasoWizard={setPasoW} viajeForm={viajeForm} setViajeForm={setViajeForm} UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo} />
            )
          )
        )}
        {vista === "mis_viajes" && <VistaMisViajes misPublicaciones={[]} viajesDondeVoy={[]} />}
        {vista === "inbox" && <VistaInbox historialChats={[]} misViajesPublicados={[]} abrirChat={() => {}} />}
        {vista === "perfil" && <VistaPerfil userData={userData} handleLogout={() => signOut(auth)} />}
      </main>
      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={setPasoW} />
    </div>
  );
} 
} 
