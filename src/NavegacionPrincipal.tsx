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

// CRÍTICO: Debe ser "export default" para que App.tsx no explote
export default function NavegacionPrincipal({ user }) {
  // 1. ESTADOS DE DATOS
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [historialChats, setHistorialChats] = useState([]);
  const [misViajesPublicados, setMisViajesPublicados] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  
  // 2. ESTADOS DE NAVEGACIÓN
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
  const [perfilPublico, setPerfilPublico] = useState(null);
  const [pasoWizard, setPasoWizard] = useState(1);

  // 3. ESTADO DEL FORMULARIO
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // 4. ESCUCHA DE FIREBASE
  useEffect(() => {
    if (!user?.uid) return;

    // Escuchar datos del usuario
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      setUserData(snap.exists() ? { id: snap.id, ...snap.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });

    // Escuchar viajes globales
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setViajes([]));

    // Escuchar mis publicaciones
    const unsubMisV = onSnapshot(query(collection(db, "Viajes"), where("idCreador", "==", user.uid)), (snap) => {
      setMisViajesPublicados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubViajes(); unsubMisV(); };
  }, [user]);

  // 5. FUNCIONES DE APOYO
  const handleLogout = () => signOut(auth);
  const abrirChat = (vId, oId, nombre) => {
    setChatActivo({ id: vId, idViaje: vId, idOtro: oId, nombreOtro: nombre, idPropio: user.uid });
    setVista("chat_privado");
  };
  const eliminarViaje = async (id) => {
    try { await deleteDoc(doc(db, "Viajes", id)); } catch (e) { console.error(e); }
  };

  const viajesFiltrados = useMemo(() => Array.isArray(viajes) ? viajes : [], [viajes]);

  // PANTALLA DE CARGA (Aquí es donde el icono "D" salta)
  if (!userData) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center animate-bounce shadow-xl">
          <span className="text-white font-black text-3xl italic">D</span>
        </div>
      </div>
    );
  }

  // RENDER PRINCIPAL (Si llegamos aquí, la pantalla blanca desaparece)
  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {vista === "inicio" && (
          <div className="pt-2">
            {viajeSeleccionado ? (
              <VistaDetalleViaje viaje={viajeSeleccionado} onRegresar={() => setViajeSeleccionado(null)} />
            ) : (
              modo === "pasajero" ? (
                <VistaInicio viajes={viajesFiltrados} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} userData={userData} />
              ) : (
                <WizardPublicar pasoWizard={pasoWizard} setPasoWizard={setPasoWizard} viajeForm={viajeForm} setViajeForm={setViajeForm} UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo} />
              )
            )}
          </div>
        )}

        {vista === "mis_viajes" && (
          <VistaMisViajes 
            misPublicaciones={misViajesPublicados} 
            viajesDondeVoy={misSolicitudes} 
            alEliminar={eliminarViaje} 
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

        {vista === "wallet" && <Wallet userData={userData} />}
      </main>

      {/* Navbar con todas las props que tus archivos necesitan */}
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
