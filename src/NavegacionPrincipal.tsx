import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { 
  doc, onSnapshot, collection, query, orderBy, 
  addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment, getDocs, where
} from "firebase/firestore";

// VISTAS
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { WizardPublicar } from './components/ui/WizardPublicar'; 
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
import { VistaInicio } from './components/views/VistaInicio';

// LAYOUT
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header'; 

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  
  // SOLUCIÓN AL ERROR 1: Agregamos el estado de 'chats' temporalmente vacío
  const [chats, setChats] = useState([]); 
  
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSel, setViajeSel] = useState(null);
  const [viajeAEditar, setViajeAEditar] = useState(null); 
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
  const [pasoWizard, setPasoWizard] = useState(1);

  const [viajeForm, setViajeForm] = useState({
    origen: "", destino: "", precio: "", asientos: "4", 
    fechaSalida: "", horaSalida: "", publicarRegreso: false,
    fechaRegreso: "", horaRegreso: "",
    preferencias: { ac: true, noFumar: true, mascotas: false, maxDosAtras: true }
  });

  const UBICACIONES = {
  "Amazonas": ["Puerto Ayacucho", "Puerto Páez"], 
  "Anzoátegui": ["Barcelona", "Puerto La Cruz", "El Tigre", "Anaco"],
  "Apure": ["San Fernando", "Guasdualito"], 
  "Aragua": ["Maracay", "Turmero", "La Victoria", "Cagua"],
  "Barinas": ["Barinas", "Socopó"], 
  "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar", "Upata", "Santa Elena de Uairén"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego", "Puerto Cabello", "Mariara", "Los Guayos"],
  "Cojedes": ["San Carlos", "Tinaquillo"], 
  "Delta Amacuro": ["Tucupita"],
  "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo", "Tucacas", "Chichiriviche"], 
  "Guárico": ["San Juan de los Morros", "Calabozo", "Valle de la Pascua"],
  "Lara": ["Barquisimeto", "Cabudare", "Carora", "El Tocuyo"],
  "La Guaira": ["La Guaira", "Maiquetía", "Catia La Mar"],
  "Mérida": ["Mérida", "El Vigía", "Tovar"], 
  "Miranda": ["Los Teques", "Chacao", "Baruta", "Guatire", "Guarenas", "Charallave", "Higuerote"], 
  "Monagas": ["Maturín", "Punta de Mata"], 
  "Nueva Esparta": ["Porlamar", "Pampatar", "Juan Griego"], 
  "Portuguesa": ["Guanare", "Acarigua", "Araure"],
  "Sucre": ["Cumaná", "Carúpano"],
  "Táchira": ["San Cristóbal", "La Grita", "San Antonio del Táchira"], 
  "Trujillo": ["Trujillo", "Valera", "Boconó"], 
  "Yaracuy": ["San Felipe", "Yaritagua", "Chivacoa"],
  "Zulia": ["Maracaibo", "San Francisco", "Cabimas", "Ciudad Ojeda"]
};

  // --- LÓGICA DE FIREBASE (ESCUCHA ACTIVA) ---
  useEffect(() => {
    if (!user?.uid) return;
    const unsubU = onSnapshot(doc(db, "usuarios", user.uid), (s) => {
      setUserData(s.exists() ? { id: s.id, ...s.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });
    
    const unsubV = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (s) => {
      setViajes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // AVISO: Aquí faltaría agregar el listener para los chats cuando crees la colección en Firebase
    // Ejemplo: const unsubC = onSnapshot(collection(db, "Chats"), ...);

    return () => { unsubU(); unsubV(); };
  }, [user]);

  // --- ACCIONES PARA VISTA MIS VIAJES ---

  const manejarAceptarPasajero = async (viajeId, pasajero) => {
    try {
      const viajeRef = doc(db, "Viajes", viajeId);
      await updateDoc(viajeRef, {
        reservasPendientes: arrayRemove(pasajero),
        pasajeros: arrayUnion({ ...pasajero, estado: 'confirmado' }),
        asientos: increment(-1) 
      });
    } catch (e) { console.error("Error al aceptar:", e); }
  };

  const manejarRechazarPasajero = async (viajeId, pasajero) => {
    try {
      const viajeRef = doc(db, "Viajes", viajeId);
      await updateDoc(viajeRef, {
        reservasPendientes: arrayRemove(pasajero)
      });
    } catch (e) { console.error("Error al rechazar:", e); }
  }; 
  // SOLUCIÓN AL ERROR 2: La llave de cierre estaba perdida

  const manejarActualizarViajeDirecto = async (datosEditados) => {
    try {
      const viajeRef = doc(db, "Viajes", datosEditados.id);
      
      const actualizaciones = {
          precio: Number(datosEditados.precio),
          asientos: Number(datosEditados.asientos),
          últimaEdición: new Date().toISOString()
      };

      if (datosEditados.tipoRuta === 'vuelta_de_ruta') {
          actualizaciones.fechaSalida = datosEditados.fechaForm;
          actualizaciones.horaSalida = datosEditados.horaForm;
      } else {
          actualizaciones.fecha = datosEditados.fechaForm;
          actualizaciones.hora = datosEditados.horaForm;
          actualizaciones.fechaSalida = datosEditados.fechaForm; 
          actualizaciones.horaSalida = datosEditados.horaForm;   
      }

      await updateDoc(viajeRef, actualizaciones);
    } catch (e) {
      console.error("Error al actualizar:", e);
      throw e;
    }
  };

    // --- LÓGICA DE CHAT ---
  const iniciarChat = async (viaje) => {
    if (!userData?.id || !viaje?.id) return;
    
    try {
      // 1. Verificar si el usuario actual es el conductor o el pasajero
      const soyConductor = viaje.uidConductor === userData.id;
      const idOtroUsuario = soyConductor 
        ? null // Si el conductor le da al botón, necesitamos saber a qué pasajero le habla (se manejará desde la lista de pasajeros)
        : viaje.uidConductor;
        
      const nombreOtroUsuario = soyConductor ? "Pasajero" : viaje.conductor;

      // Si el conductor presiona el botón general de la ruta, lo ideal es llevarlo al Inbox, 
      // porque un viaje puede tener muchos pasajeros y no sabemos a quién quiere hablarle.
      if (soyConductor) {
         setVista("inbox");
         return;
      }

      // 2. Buscar si YA existe un chat entre este pasajero y este conductor para este viaje específico
      // Nota: Necesitarás importar 'where' y 'getDocs' de firebase/firestore al inicio de tu archivo
      const { getDocs, where } = require("firebase/firestore"); // Importar si no lo tienes arriba
      
      const chatsRef = collection(db, "Chats");
      const q = query(
        chatsRef, 
        where("idViaje", "==", viaje.id),
        where("uidPasajero", "==", userData.id),
        where("uidConductor", "==", viaje.uidConductor)
      );
      
      const querySnapshot = await getDocs(q);
      
      let chatId = null;

      if (!querySnapshot.empty) {
        // El chat ya existe, obtenemos su ID
        chatId = querySnapshot.docs[0].id;
      } else {
        // 3. El chat no existe, lo creamos
        const nuevoChatRef = await addDoc(collection(db, "Chats"), {
          idViaje: viaje.id,
          ruta: `${viaje.cO || viaje.origen} - ${viaje.cD || viaje.destino}`,
          uidConductor: viaje.uidConductor,
          nombreConductor: viaje.conductor,
          fotoConductor: viaje.fotoPerfil || "",
          uidPasajero: userData.id,
          nombrePasajero: userData.nombre,
          fotoPasajero: userData.fotoPerfil || "",
          ultimoMensaje: "Chat iniciado",
          ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          mensajesSinLeer: 0
        });
        chatId = nuevoChatRef.id;
      }

      // 4. Navegar a la vista de mensajes individuales (asumiendo que crearás una 'VistaMensajes')
      // Por ahora, lo mandaremos al Inbox y puedes ver si se creó en Firebase
      console.log("Chat listo con ID:", chatId);
      setVista("inbox"); // Temporalmente lo mandamos al inbox hasta que tengas la vista individual
      
    } catch (error) {
      console.error("Error al iniciar chat:", error);
      alert("Hubo un error al intentar abrir el chat.");
    }
  };
  
  
  const manejarEditarViaje = (viaje) => {
    setViajeAEditar(viaje); 
    setViajeForm(viaje);
    setVista("publicar");
    setPasoWizard(1);
  };

  const manejarEliminarViaje = async (viajeId) => {
    try {
      await deleteDoc(doc(db, "Viajes", viajeId));
    } catch (e) { 
      console.error("Error al eliminar:", e); 
    }
  };

  // En NavegacionPrincipal.jsx
  const publicarRuta = async (datosFinales, esperarToast = false) => {
    try {
      if (viajeAEditar) {
        const viajeRef = doc(db, "Viajes", viajeAEditar.id);
        await updateDoc(viajeRef, { ...datosFinales, últimaEdición: new Date().toISOString() });
        setViajeAEditar(null);
      } else {
        await addDoc(collection(db, "Viajes"), {
          ...datosFinales,
          uidConductor: userData.id, 
          conductor: userData.nombre,
          fechaPublicacion: new Date().toISOString(),
          estado: "disponible",
          timestamp: Date.now()
        });
      }
      
      setViajeForm({
        origen: "", destino: "", precio: "", asientos: "4", horaSalida: "",
        preferencias: { ac: true, noFumar: true, mascotas: false, maxDosAtras: true }
      });
      
      // Si estamos esperando el Toast, NO navegamos aquí. El Wizard se encarga.
      if (!esperarToast) {
         setPasoWizard(1);
         setVista("inicio");
      }
    } catch (error) {
      console.error("Error en Firebase:", error);
      throw error; // Propagar el error para que el Wizard lo atrape
    }
  };

  if (!userData) return <div className="h-screen flex items-center justify-center font-black text-blue-600 italic uppercase">Cargando...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {vista === "inicio" && (
          viajeSel ? (
            <VistaDetalleViaje viaje={viajeSel} onRegresar={() => setViajeSel(null)} />
          ) : (
            <VistaInicio 
              viajes={viajes} setViajeSeleccionado={setViajeSel} 
              setVista={setVista} userData={userData} modo={modo} 
            />
          )
        )}

        {vista === "mis_viajes" && (
          <VistaMisViajes 
            viajesChofer={viajes.filter(v => v.uidConductor === userData?.id)} 
            viajesPasajeroActivos={viajes.filter(v => 
              v.pasajeros?.some(p => p.id === userData?.id || p.uid === userData?.id) && v.estado !== 'finalizado'
            )} 
            viajesPasajeroHistorial={viajes.filter(v => 
              v.pasajeros?.some(p => p.id === userData?.id || p.uid === userData?.id) && v.estado === 'finalizado'
            )}
            userData={userData} 
            onActualizarViajeFBD={manejarActualizarViajeDirecto}
            onEliminarViajeFBD={manejarEliminarViaje}
            onIniciarChat={iniciarChat} // <--- NUEVA LÍNEA
            onRegresar={() => setVista("inicio")}
          />
        )}
    
        {vista === "inbox" && (
          <VistaInbox 
            chatsChofer={chats.filter(c => c.uidConductor === userData?.id)} 
            chatsPasajero={chats.filter(c => c.uidPasajero === userData?.id || c.pasajeros?.some(p => p.id === userData?.id))}
            onAbrirChat={(chatSeleccionado) => {
              console.log("Abriendo chat:", chatSeleccionado);
            }}
          />
        )}
        
        {vista === "perfil" && (
          <VistaPerfil 
            userData={userData} handleLogout={() => signOut(auth)} 
            pestañaActiva={pestañaPerfil} setPestañaActiva={setPestañaPerfil}
          />
        )}
        
        {vista === "publicar" && (
          <WizardPublicar 
            userData={userData} pasoWizard={pasoWizard} setPasoWizard={setPasoWizard}
            viajeForm={viajeForm} setViajeForm={setViajeForm}
            UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo}
            publicarRuta={publicarRuta}
            editando={!!viajeAEditar}
          />
        )}
      </main>

      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={setPasoWizard} />
    </div>
  );
                                                                                                 }
