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

    const unsubR = onSnapshot(query(collection(db, "MensajesPrivados"), where("receptorId", "==", user.uid)), snap => actualizarHistorial(snap.docs));
    const unsubE = onSnapshot(query(collection(db, "MensajesPrivados"), where("emisorId", "==", user.uid)), snap => actualizarHistorial(snap.docs));

    return () => { 
      unsubUser(); unsubViajes(); unsubMisViajes(); unsubMisSoli(); unsubR(); unsubE(); 
    };
  }, [user]);

  // --- EFECTO 2: LIMPIEZA DE NAVEGACIÓN ---


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
const abrirPerfilPublico = async (idConductor) => {
  if (!idConductor) {
    // Este lo dejamos solo por seguridad técnica, no debería salir nunca
    console.error("Error: El viaje no tiene un ID de conductor asignado.");
    return;
  }

  // ELIMINADO: alert("Buscando en Firebase al conductor...");

  try {
    const docRef = doc(db, "usuarios", idConductor);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // ELIMINADO: alert("¡Usuario encontrado! Abriendo perfil...");
      setPerfilSeleccionado(docSnap.data());
      setVista("perfil_publico");
    } else {
      // Cambiamos alert por console.error para que no moleste al usuario
      console.error("Error: No existe un usuario con ese ID en la colección 'usuarios'.");
    }
  } catch (error) {
    // Solo mostramos el error de permisos si realmente falla algo grave
    alert("Error de Firebase: " + error.message);
  }
};
  
  
  
  const handleLogout = () => signOut(auth);

  if (!userData) return <div className="h-screen bg-white flex items-center justify-center text-blue-600 font-black animate-pulse text-xs uppercase italic">Cargando Dame la Cola...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x shadow-2xl">
      <div className="p-4 border-b bg-white z-40 shadow-sm">
        <Header userData={userData} modo={modo} />
      </div> 

      <main className="flex-1 overflow-y-auto px-4 pb-24">
  {vista === "inicio" && (
    <div className="pt-4">
      {/* CORRECCIÓN: Quitamos el renderizado de detalle de aquí adentro 
          para que use la lógica de abajo que sí tiene el botón de perfil */}
      {modo === "pasajero" ? (
        <VistaInicio 
          viajes={viajesFiltrados || []} 
          setViajeSeleccionado={(v) => {
            setViajeSeleccionado(v);
            setVista("detalle_viaje"); // <--- IMPORTANTE: Cambiamos la vista aquí
          }} 
          setVista={setVista} 
        />
      ) : (
        <WizardPublicar 
          pasoWizard={pasoWizard} setPasoWizard={setPasoWizard}
          viajeForm={viajeForm} setViajeForm={setViajeForm}
          UBICACIONES={UBICACIONES} setVista={setVista} 
          setModo={setModo} publicarRuta={publicarRutaWizard} 
          viajeEditando={viajeEditando}
        />
      )}
    </div>
  )}

  {/* ESTA ES LA VISTA QUE REALMENTE FUNCIONA CON EL PERFIL */}
  {vista === "detalle_viaje" && viajeSeleccionado && (
    <VistaDetalleViaje 
      viaje={viajeSeleccionado} 
      onRegresar={() => setVista("inicio")} 
      onVerPerfil={(id) => abrirPerfilPublico(id)} 
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
{vista === "perfil" && (
  <VistaPerfil 
    userData={userData} 
    handleLogout={handleLogout} 
    pestañaActiva={pestañaPerfil} 
    setPestañaActiva={setPestañaPerfil} 
  />
)}
        

        {vista === "perfil_publico" && (
  <VistaPerfilCompleto 
    userData={perfilSeleccionado} 
    isOwnProfile={false} // Marcamos false porque es el perfil de otro
    onRegresar={() => setVista("detalle_viaje")} // Para volver atrás
  />
)}
        
        
      </main>

      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} />
      <ModalPerfilPublico perfilPublico={perfilPublico} setPerfilPublico={setPerfilPublico} />
    </div>
  );
}

export default NavegacionPrincipal;
