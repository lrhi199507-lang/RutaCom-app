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
import { VistaPerfilCompleto } from './components/views/VistaPerfilCompleto';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje'; 

// Helpers y Modales
import { ModalPerfilPublico } from './components/ui/ModalPerfilPublico';

import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, deleteDoc, getDoc
} from "firebase/firestore";

export function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [historialChats, setHistorialChats] = useState([]);
  const [misViajesPublicados, setMisViajesPublicados] = useState([]);
  const [pasoWizard, setPasoWizard] = useState(1);
  const [viajeEditando, setViajeEditando] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
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
import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { UBICACIONES } from './constants/ubicaciones';

// Layout y UI
import { Navbar } from "./components/layout/Navbar";

// Vistas - ASEGÚRATE QUE ESTA RUTA SEA LA CORRECTA (views o vistas)
import { VistaInicio } from './components/views/VistaInicio';
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { VistaPerfilCompleto } from './components/views/VistaPerfilCompleto';
import { VistaChatPrivado } from './components/views/VistaChatPrivado';
import { WizardPublicar } from './components/ui/WizardPublicar';
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje'; 

import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, where, deleteDoc, getDoc
} from "firebase/firestore";

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [chatActivo, setChatActivo] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");

  // Escuchar datos del usuario
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "Usuarios", user.uid), (doc) => {
      setUserData(doc.exists() ? { id: doc.id, ...doc.data() } : null);
    });
  }, [user]);

  // Escuchar viajes activos
  useEffect(() => {
    const q = query(collection(db, "Viajes"), orderBy("fechaCreacion", "desc"));
    return onSnapshot(q, (snapshot) => {
      setViajes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pb-20">
        {vista === "inicio" && (
          <VistaInicio 
            viajes={viajes} 
            setViajeSeleccionado={(v) => { setViajeSeleccionado(v); setVista("detalle_viaje"); }} 
            userData={userData} 
          />
        )}

        {vista === "detalle_viaje" && (
          <VistaDetalleViaje 
            viaje={viajeSeleccionado} 
            onRegresar={() => setVista("inicio")} 
          />
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
{/* SUSTITUYE TU BLOQUE DE PERFIL POR ESTE */}
{vista === "perfil" && userData ? (
  <VistaPerfil 
    userData={userData} 
    handleLogout={handleLogout} 
    // Usamos un valor por defecto si pestañaPerfil es undefined
    pestañaActiva={pestañaPerfil || "publico"} 
    setPestañaActiva={setPestañaPerfil || (() => {})} 
  />
) : vista === "perfil" && (
  <div className="p-10 text-center font-black text-red-500 uppercase italic">
    Error: Datos de usuario no encontrados
  </div>
)}
        

        {vista === "perfil_publico" && (
  <VistaPerfilCompleto 
    userData={perfilSeleccionado} 
    isOwnProfile={false} // Marcamos false porque es el perfil de otro
    onRegresar={() => setVista("detalle_viaje")} // Para volver atrás
  />
)}
        
        
      </main>

      <Navbar 
  vista={vista} 
  modo={modo} 
  setVista={setVista} 
  setModo={setModo} 
  setPasoWizard={setPasoWizard} // <--- AÑADE ESTA LÍNEA QUE FALTABA
/>
    </div>
  );
}

export default NavegacionPrincipal;
