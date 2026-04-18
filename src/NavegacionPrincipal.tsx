import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { UBICACIONES } from './constants/ubicaciones';

// Layout y UI
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';
import { SelectorModo } from './components/ui/SelectorModo';
import { KYCProgressBar } from './components/ui/KYCProgressBar';
import { PantallaExito } from './components/ui/PantallaExito';

// Vistas
import { VistaInicio } from './components/ui/VistaInicio'; // Ajustado a carpeta 'ui'
import { VistaMisViajes } from './components/ui/VistaMisViajes';
import { VistaInbox } from './components/ui/VistaInbox';
import { VistaPerfil } from './components/ui/VistaPerfil';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaChatPrivado } from './components/ui/VistaChatPrivado'; // Componente vital para evitar pantalla blanca

// Helpers y Modales
import { ModalInstruccionesFoto } from './components/ui/ModalInstruccionesFoto';
import { ModalResena } from './components/ui/ModalResena';
import { ModalOpiniones } from './components/ui/ModalOpiniones';
import { ModalChecklist } from './components/ui/ModalChecklist';
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';
import { calcularDuracion, obtenerNivel, calcularEstatus } from './utils/helpers';

import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, deleteDoc, increment
} from "firebase/firestore";

export function NavegacionPrincipal({ user }) {
  // --- ESTADOS PRINCIPALES ---
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  
  // Estados de Chat
  const [chatActivo, setChatActivo] = useState(null);
  const [historialChats, setHistorialChats] = useState([]);
  const [misViajesPublicados, setMisViajesPublicados] = useState([]);

  // Estados del Wizard
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeEditando, setViajeEditando] = useState(null);
  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", paradas: [], precio: "", asientos: 3, 
    horaSalida: "", horaLlegada: "", 
    preferencias: { ac: true, noFumar: true, mascotas: false, conversar: true, equipaje: true, maxDosAtras: false }
  });

  // Otros Estados
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [viajeActivo, setViajeActivo] = useState(null);
  const [perfilPublico, setPerfilPublico] = useState(null);
  const [modalResena, setModalResena] = useState({ visible: false, idSolicitud: null, evaluadoId: null, nombreEvaluado: "" });

  // --- LÓGICA DE FILTRADO ---
  const viajesFiltrados = useMemo(() => {
    return viajes; // Por ahora devolvemos todos, puedes añadir filtros luego
  }, [viajes]);

  // --- EFECTOS (Sincronización Firebase) ---
  useEffect(() => {
    if (!user) return;

    // 1. Datos del Usuario
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    // 2. Todos los Viajes Disponibles
    const unsubViajes = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Mis Viajes Publicados (Como Chofer)
    const qMisViajes = query(collection(db, "Viajes"), where("idCreador", "==", user.uid));
    const unsubMisViajes = onSnapshot(qMisViajes, (snap) => {
      setMisViajesPublicados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Mis Solicitudes (Como Pasajero)
    const unsubMisSoli = onSnapshot(query(collection(db, "Solicitudes"), where("idPasajero", "==", user.uid)), (snap) => {
      setMisSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 5. Historial de Chats
    const qChats = query(collection(db, "MensajesPrivados"), where("participantes", "array-contains", user.uid));
    const actualizarHistorial = (docs) => {
      const mapChats = new Map();
      docs.forEach(d => {
        const data = d.data();
        const idOtro = data.emisorId === user.uid ? data.receptorId : data.emisorId;
        if (!mapChats.has(data.chatId) || (data.fecha?.toMillis() > mapChats.get(data.chatId).fecha)) {
          mapChats.set(data.chatId, { 
            chatId: data.chatId, idViaje: data.idViaje, idOtro, 
            nombreOtro: data.emisorId === user.uid ? data.nombreReceptor : data.nombreEmisor,
            ultimoMensaje: data.texto, fecha: data.fecha?.toMillis() || Date.now() 
          });
        }
      });
      setHistorialChats(Array.from(mapChats.values()).sort((a, b) => b.fecha - a.fecha));
    };

    const unsubR = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid)), snap => actualizarHistorial(snap.docs));
    const unsubE = onSnapshot(query(collection(db, "MensajesPrivados"), where("emisorId", "==", user.uid)), snap => actualizarHistorial(snap.docs));

    return () => { unsubUser(); unsubViajes(); unsubMisViajes(); unsubMisSoli(); unsubR(); unsubE(); };
  }, [user]);

  // --- FUNCIONES DE ACCIÓN ---
  const abrirChat = (idViaje, idOtro, nombreOtro) => {
    if (!idOtro || !user?.uid) return;
    const chatId = [user.uid, idOtro].sort().join("_") + "_" + idViaje;
    setChatActivo({ id: chatId, nombre: nombreOtro, idOtro, idViaje });
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

      if (viajeEditando) {
        await updateDoc(doc(db, "Viajes", viajeEditando), dataViaje);
      } else {
        await addDoc(collection(db, "Viajes"), dataViaje);
      }
      setVista("inicio");
      setViajeEditando(null);
    } catch (e) { alert("Error al publicar"); }
  };

  const prepararEdicion = (viaje) => {
    setViajeEditando(viaje.id);
    setViajeForm({
      origen: `${viaje.cO}, ${viaje.eO}`,
      destino: `${viaje.cD}, ${viaje.eD}`,
      precio: viaje.precio.toString(),
      asientos: viaje.puestos,
      horaSalida: viaje.horaSalida,
      preferencias: viaje.preferencias
    });
    setPasoWizard(1);
    setVista("inicio");
    setModo("chofer");
  };

  const eliminarViaje = async (id) => {
    if (window.confirm("¿Eliminar ruta?")) await deleteDoc(doc(db, "Viajes", id));
  };

  const handleLogout = () => signOut(auth);

  if (!userData) return <div className="h-screen bg-slate-900 flex items-center justify-center text-blue-500 font-black animate-pulse text-xs uppercase italic">Cargando Dame la Cola...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      
      {/* 1. HEADER FIJO SOLO EN INICIO */}
      {vista === "inicio" && !viajeSeleccionado && (
        <div className="p-4 space-y-4 bg-white">
          <Header userData={userData} />
          <SelectorModo modo={modo} setModo={setModo} />
        </div>
      )}

      {/* 2. CONTENIDO SCROLLABLE */}
      <main className="flex-1 overflow-y-auto px-4 pb-32">
        
        {/* VISTA INICIO */}
        {vista === "inicio" && !viajeSeleccionado && (
          <>
            {modo === "pasajero" ? (
              <VistaInicio viajes={viajesFiltrados} setViajeSeleccionado={setViajeSeleccionado} setVista={setVista} />
            ) : (
              <WizardPublicar 
                pasoWizard={pasoWizard} setPasoWizard={setPasoWizard}
                viajeForm={viajeForm} setViajeForm={setViajeForm}
                UBICACIONES={UBICACIONES} setVista={setVista} 
                setModo={setModo} publicarRuta={publicarRutaWizard} 
                viajeEditando={viajeEditando}
              />
            )}
          </>
        )}

        {/* VISTA MIS VIAJES */}
        {vista === "mis_viajes" && (
          <VistaMisViajes 
            misPublicaciones={misViajesPublicados}
            viajesDondeVoy={misSolicitudes.filter(s => s.estado === "confirmado")}
            onEditar={prepararEdicion} onEliminar={eliminarViaje}
          />
        )}

        {/* VISTA MENSAJES */}
        {vista === "inbox" && (
          <VistaInbox historialChats={historialChats} misViajesPublicados={misViajesPublicados} abrirChat={abrirChat} />
        )}

        {/* VISTA CHAT PRIVADO (Evita pantalla blanca) */}
        {vista === "chat_privado" && chatActivo && (
          <VistaChatPrivado chat={chatActivo} onBack={() => setVista("inbox")} />
        )}

        {/* VISTA PERFIL */}
        {vista === "perfil" && (
          <VistaPerfil userData={userData} handleLogout={handleLogout} />
        )}

      </main>

      {/* 3. NAVBAR INFERIOR */}
      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} />

      {/* 4. MODALES GLOBALES */}
      <ModalPerfilPublico 
        perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} 
      />
    </div>
  );
}

export default NavegacionPrincipal;
