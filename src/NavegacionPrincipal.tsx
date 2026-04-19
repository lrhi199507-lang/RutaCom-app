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

// Helpers y Modales
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, deleteDoc
} from "firebase/firestore";

export function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [historialChats, setHistorialChats] = useState([]);
  const [misViajesPublicados, setMisViajesPublicados] = useState([]);
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeEditando, setViajeEditando] = useState(null);
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [perfilPublico, setPerfilPublico] = useState(null);

  const viajesFiltrados = useMemo(() => viajes, [viajes]);

  // --- EFECTO 1: DATOS Y CHATS ---
  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qMisViajes = query(collection(db, "Viajes"), where("idCreador", "==", user.uid));
    const unsubMisViajes = onSnapshot(qMisViajes, (snap) => {
      setMisViajesPublicados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), (snap) => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const actualizarHistorial = (docs) => {
      const mapChats = new Map();
      docs.forEach(d => {
        const data = d.data();
        const idOtro = data.emisorId === user.uid ? data.receptorId : data.emisorId;
        const chatId = data.chatId;
        if (!mapChats.has(chatId) || (data.fecha?.toMillis() > mapChats.get(chatId).fecha)) {
          mapChats.set(chatId, { 
            chatId, idViaje: data.idViaje, idOtro, 
            nombreOtro: data.emisorId === user.uid ? data.nombreReceptor : data.nombreEmisor,
            ultimoMensaje: data.texto, fecha: data.fecha?.toMillis() || Date.now() 
          });
        }
      });
      setHistorialChats(Array.from(mapChats.values()).sort((a, b) => b.fecha - a.fecha));
    };

    const unsubR = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid)), snap => actualizarHistorial(snap.docs));
    const unsubE = onSnapshot(query(collection(db, "MensajesPrivados"), where("emisorId", "==", user.uid)), snap => actualizarHistorial(snap.docs));

    return () => { 
      unsubUser(); unsubViajes(); unsubMisViajes(); unsubMisSoli(); unsubR(); unsubE(); 
    };
  }, [user]);

  // --- EFECTO 2: LIMPIEZA DE NAVEGACIÓN ---
  useEffect(() => {
    if (vista !== "inicio") {
      setViajeSeleccionado(null);
    }
  }, [vista]);

  const abrirChat = (idViaje, idOtro, nombreOtro) => {
    if (!idOtro || !user?.uid) return;
    const chatId = [user.uid, idOtro].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro, idViaje, idPropio: user.uid });
    setVista("chat_privado");
  };
  
  const publicarRutaWizard = async () => {
    try {
      const oParts = viajeForm.origen.split(",");
      const dParts = viajeForm.destino.split(",");
      const dataViaje = {
        idCreador: user.uid,
        conductor: userData.nombre,
        cO: oParts[0]?.trim(), eO: oParts[1]?.trim() || "",
        cD: dParts[0]?.trim(), eD: dParts[1]?.trim() || "",
        precio: Number(viajeForm.precio),
        puestos: Number(viajeForm.asientos),
        horaSalida: viajeForm.horaSalida,
        preferencias: viajeForm.preferencias,
        fecha: serverTimestamp()
      };
      if (viajeEditando) { await updateDoc(doc(db, "Viajes", viajeEditando), dataViaje); } 
      else { await addDoc(collection(db, "Viajes"), dataViaje); }
      setVista("inicio");
      setViajeEditando(null);
    } catch (e) { alert("Error al publicar"); }
  };

  const prepararEdicion = (viaje) => {
    setViajeEditando(viaje.id);
    setViajeForm({
      origen: `${viaje.cO}, ${viaje.eO}`, destino: `${viaje.cD}, ${viaje.eD}`,
      precio: viaje.precio.toString(), asientos: viaje.puestos,
      horaSalida: viaje.horaSalida, preferencias: viaje.preferencias
    });
    setPasoWizard(1);
    setVista("inicio");
    setModo("chofer");
  };

  const handleLogout = () => signOut(auth);

  if (!userData) return <div className="h-screen bg-white flex items-center justify-center text-blue-600 font-black animate-pulse text-xs uppercase italic">Cargando Dame la Cola...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      <div className="p-4 border-b bg-white z-40 shadow-sm">
        <Header userData={userData} modo={modo} />
      </div> 

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        {/* 1. VISTA DE INICIO / BUSCADOR / DETALLES */}
{vista === "inicio" && (
  <div className="pt-4">
    {/* Verificamos que viajeSeleccionado exista Y tenga datos */}
    {viajeSeleccionado && Object.keys(viajeSeleccionado).length > 0 ? (
      <VistaDetalleViaje 
        viaje={viajeSeleccionado} 
        onRegresar={() => setViajeSeleccionado(null)} 
      />
    ) : (
      <>
        {modo === "pasajero" ? (
          <VistaInicio 
            viajes={viajesFiltrados || []} 
            setViajeSeleccionado={setViajeSeleccionado} // <--- Revisa que pases esta prop
            setVista={setVista} 
          />
        ) : (
          <WizardPublicar ... />
        )}
      </>
    )}
  </div>
)}
        
        {vista === "mis_viajes" && (
          <VistaMisViajes 
            misPublicaciones={misViajesPublicados}
            viajesDondeVoy={misSolicitudes.filter(s => s.estado === "confirmado")}
            onEditar={prepararEdicion} onEliminar={(id) => deleteDoc(doc(db, "Viajes", id))}
          />
        )}

        {vista === "inbox" && (
          <VistaInbox historialChats={historialChats} misViajesPublicados={misViajesPublicados} abrirChat={abrirChat} />
        )}

        {vista === "chat_privado" && chatActivo && (
          <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} />
        )}

        {vista === "perfil" && (
          <VistaPerfil userData={userData} handleLogout={handleLogout} />
        )}
      </main>

      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} />
      <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />
    </div>
  );
}

export default NavegacionPrincipal;
