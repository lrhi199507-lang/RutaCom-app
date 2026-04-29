import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { 
  doc, onSnapshot, collection, query, orderBy, 
  addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment, where, getDocs 
} from "firebase/firestore";

// VISTAS
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { WizardPublicar } from './components/ui/WizardPublicar'; 
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
import { VistaInicio } from './components/views/VistaInicio';
import { VistaChatPrivado } from './components/views/VistaChatPrivado'; // Verifica que la ruta coincida con tu carpeta


// LAYOUT
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header'; 

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [chats, setChats] = useState([]); // Estado temporal vacío para evitar crasheos
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSel, setViajeSel] = useState(null);
  const [viajeAEditar, setViajeAEditar] = useState(null); 
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
  const [pasoWizard, setPasoWizard] = useState(1);
  const [chatActivo, setChatActivo] = useState(null);
  
  
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
    
    // 1. Escuchar Usuario
    const unsubU = onSnapshot(doc(db, "usuarios", user.uid), (s) => {
      setUserData(s.exists() ? { id: s.id, ...s.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });
    
    // 2. Escuchar Viajes
    const unsubV = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (s) => {
      setViajes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. NUEVO: Escuchar Chats en tiempo real
    const unsubC = onSnapshot(query(collection(db, "Chats"), orderBy("timestamp", "desc")), (s) => {
      setChats(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Limpiar los 3 listeners al desmontar
    return () => { unsubU(); unsubV(); unsubC(); };
  }, [user]);
  

  // --- LÓGICA DE CHAT UNIFICADA ---
  const iniciarChat = async (viaje) => {
    if (!userData?.id || !viaje?.id) return;
    console.log("Función iniciarChat ejecutándose para viaje:", viaje.id);
    
    try {
      // 1. Verificar si el usuario actual es el conductor o el pasajero
      const soyConductor = viaje.uidConductor === userData.id;

      // Si el conductor presiona el botón general de la ruta, lo ideal es llevarlo al Inbox.
      if (soyConductor) {
         setVista("inbox");
         return;
      }

      // 2. Buscar si YA existe un chat entre este pasajero y este conductor para este viaje específico
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
        console.log("Chat existente encontrado con ID:", chatId);
      } else {
        // 3. El chat no existe, lo creamos con los datos completos
        console.log("Creando nuevo chat en Firebase...");
        const nuevoChatRef = await addDoc(collection(db, "Chats"), {
          idViaje: viaje.id,
          ruta: `${viaje.cO || viaje.origen?.split(',')[0]} - ${viaje.cD || viaje.destino?.split(',')[0]}`,
          uidConductor: viaje.uidConductor,
          nombreConductor: viaje.conductor,
          fotoConductor: viaje.fotoPerfil || "",
          uidPasajero: userData.id,
          nombrePasajero: userData.nombre,
          fotoPasajero: userData.fotoPerfil || "",
          ultimoMensaje: "Chat iniciado",
          ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          mensajesSinLeer: 0,
          estadoViaje: viaje.estado || "disponible" // Guardamos el estado para la lógica de WhatsApp luego
        });
        chatId = nuevoChatRef.id;
        console.log("Nuevo chat creado con ID:", chatId);
      }

      // 4. Navegar a la vista de Inbox temporalmente
      setVista("inbox"); 
      console.log("Redirigiendo a Inbox. ChatID:", chatId);
      
    } catch (error) {
      console.error("Error al iniciar chat:", error);
      alert("Hubo un error al intentar abrir el chat. Revisa la consola.");
    }
  };

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

  const manejarActualizarViajeDirecto = async (datosEditados) => {
    try {
      const viajeRef = doc(db, "Viajes", datosEditados.id);
      
      // ACTUALIZACIÓN ESTRICTA: Solo tocamos lo que se edita en el modal.
      const actualizaciones = {
          precio: Number(datosEditados.precio),
          asientos: Number(datosEditados.asientos),
          últimaEdición: new Date().toISOString()
      };

      // Controlamos la redundancia de tu BD dependiendo del tipo de ruta
      if (datosEditados.tipoRuta === 'vuelta_de_ruta') {
          actualizaciones.fechaSalida = datosEditados.fechaForm;
          actualizaciones.horaSalida = datosEditados.horaForm;
      } else {
          actualizaciones.fecha = datosEditados.fechaForm;
          actualizaciones.hora = datosEditados.horaForm;
          actualizaciones.fechaSalida = datosEditados.fechaForm; // Sincronizamos por seguridad
          actualizaciones.horaSalida = datosEditados.horaForm;   // Sincronizamos por seguridad
      }

      await updateDoc(viajeRef, actualizaciones);
    } catch (e) {
      console.error("Error al actualizar:", e);
      throw e;
    }
  };

  const manejarEditarViaje = (viaje) => {
    setViajeAEditar(viaje); 
    setViajeForm(viaje); // Llenamos el form con los datos actuales
    setVista("publicar");
    setPasoWizard(1);
  };

  const manejarEliminarViaje = async (viajeId) => {
    try {
      await deleteDoc(doc(db, "Viajes", viajeId));
    } catch (e) { console.error("Error al eliminar:", e); }
  };

  // Función Publicar (Modificada para soportar edición)
  const publicarRuta = async (datosFinales, esperarToast = false) => {
    try {
      if (viajeAEditar) {
        const viajeRef = doc(db, "Viajes", viajeAEditar.id);
        await updateDoc(viajeRef, { ...datosFinales, últimaEdición: new Date().toISOString() });
        setViajeAEditar(null);
      } else {
        await addDoc(collection(db, "Viajes"), {
          ...datosFinales,
          uidConductor: userData.id, // Usamos el nombre de campo de tu DB
          conductor: userData.nombre,
          fechaPublicacion: new Date().toISOString(),
          estado: "disponible",
          timestamp: Date.now()
        });
      }
      
      // Reset
      setViajeForm({
        origen: "", destino: "", precio: "", asientos: "4", horaSalida: "",
        preferencias: { ac: true, noFumar: true, mascotas: false, maxDosAtras: true }
      });
      
      // Si estamos esperando el Toast en el wizard, NO navegamos automáticamente
      if (!esperarToast) {
         setPasoWizard(1);
         setVista("inicio");
      }
    } catch (error) {
      console.error("Error en Firebase:", error);
      throw error; // Propagar el error para que el wizard lo atrape
    }
  };

  if (!userData) return <div className="h-screen flex items-center justify-center font-black text-blue-600 italic uppercase">Cargando...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {vista === "inicio" && (
          viajeSel ? (
            <VistaDetalleViaje 
              viaje={viajeSel} 
              onRegresar={() => setViajeSel(null)} 
              userData={userData} 
              onIniciarChat={iniciarChat} // ✅ Pasamos la función a detalles
            />
          ) : (
            <VistaInicio 
              viajes={viajes} setViajeSeleccionado={setViajeSel} 
              setVista={setVista} userData={userData} modo={modo} 
            />
          )
        )}

        {vista === "mis_viajes" && (
          <VistaMisViajes 
            // 1. FILTRO CHOFER: Usamos userData.id (no userData.uid)
            viajesChofer={viajes.filter(v => v.uidConductor === userData?.id)} 
            
            // 2. FILTRO PASAJERO: Usamos el array "pasajeros" según tu lógica de BD
            viajesPasajeroActivos={viajes.filter(v => 
              v.pasajeros?.some(p => p.id === userData?.id || p.uid === userData?.id) && v.estado !== 'finalizado'
            )} 
            
            viajesPasajeroHistorial={viajes.filter(v => 
              v.pasajeros?.some(p => p.id === userData?.id || p.uid === userData?.id) && v.estado === 'finalizado'
            )}

            userData={userData} 
            onActualizarViajeFBD={manejarActualizarViajeDirecto}
            onEliminarViajeFBD={manejarEliminarViaje}
            onIniciarChat={iniciarChat} // ✅ También lo pasamos aquí por si acaso
            onRegresar={() => setVista("inicio")}
          />
        )}

        {vista === "inbox" && (
          <VistaInbox 
            chatsChofer={chats.filter(c => c.uidConductor === userData?.id)} 
            chatsPasajero={chats.filter(c => c.uidPasajero === userData?.id || c.pasajeros?.some(p => p.id === userData?.id))}
            userData={userData} 
            onAbrirChat={(chatSeleccionado) => {
              // ESTO CONECTA EL CLIC CON LA PANTALLA DEL CHAT
              setChatActivo(chatSeleccionado);
              setVista("chat_individual");
            }}
          />
        )}   

                {vista === "chat_individual" && chatActivo && (
          <VistaChatPrivado 
            chat={chatActivo} 
            userData={userData} 
            onRegresar={() => {
              setChatActivo(null);
              setVista("inbox");
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
              
