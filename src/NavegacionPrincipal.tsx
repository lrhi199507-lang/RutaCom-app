import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { AlertCircle, RefreshCcw } from 'lucide-react'; 
import { Wallet } from './components/views/Wallet'; 
import { App } from '@capacitor/app';

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
import { VistaChatPrivado } from './components/views/VistaChatPrivado';

// LAYOUT
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header'; 

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [chats, setChats] = useState([]); 
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSel, setViajeSel] = useState(null);
  const [viajeAEditar, setViajeAEditar] = useState(null); 
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
  const [pasoWizard, setPasoWizard] = useState(1);
  const [chatActivo, setChatActivo] = useState(null); 
  const [vistaOrigen, setVistaOrigen] = useState("inicio");
  const [verWallet, setVerWallet] = useState(false);
  
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
    "Bolívar": ["Guayana", "Ciudad Bolívar", "Upata", "Santa Elena de Uairén"],
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

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubU = onSnapshot(doc(db, "usuarios", user.uid), (s) => {
      setUserData(s.exists() ? { id: s.id, ...s.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });
    
    const unsubV = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (s) => {
      setViajes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubC = onSnapshot(query(collection(db, "Chats"), orderBy("timestamp", "desc")), (s) => {
      setChats(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubU(); unsubV(); unsubC(); };
  }, [user]);

  // 🔥 INTERCEPTOR CORREGIDO PARA ASISTIR LOS GESTOS NATIVOS NIDIFICADOS
  useEffect(() => {
    const backListener = App.addListener('backButton', () => {
      // 1. Si el perfil público está activo, frenamos esta navegación para que actúe su propio componente
      if (window.perfilPublicoAbierto) {
        return;
      }
      if (viajeSel) {
        setViajeSel(null);
        return;
      }
      if (vista !== 'inicio') {
        setVista('inicio');
        return;
      }
      App.exitApp();
    });

    return () => {
      backListener.remove();
    };
  }, [vista, viajeSel]);

  const iniciarChat = async (viaje) => {
    if (!userData?.id || !viaje?.id) return;
    
    try {
      const conductorId = viaje.uidConductor || viaje.idCreador;
      const soyConductor = conductorId === userData.id;

      if (soyConductor) {
         setVista("inbox");
         return;
      }

      const chatsRef = collection(db, "Chats");
      const q = query(
        chatsRef, 
        where("idViaje", "==", viaje.id),
        where("uidPasajero", "==", userData.id),
        where("uidConductor", "==", conductorId)
      );
      
      const querySnapshot = await getDocs(q);
      
      let chatDataCompleto = null;

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        chatDataCompleto = { id: docSnap.id, ...docSnap.data() };
      } else {
        const nuevosDatos = {
          idViaje: viaje.id,
          ruta: `${viaje.cO || viaje.origen?.split(',')[0] || "Ruta"} - ${viaje.cD || viaje.destino?.split(',')[0] || "Ruta"}`,
          uidConductor: conductorId, 
          nombreConductor: viaje.conductor || "Conductor",
          telefonoConductor: viaje.telefono || "",
          fotoConductor: viaje.fotoPerfil || "",
          uidPasajero: userData.id,
          nombrePasajero: userData.nombre || "Pasajero",
          fotoPasajero: userData.fotoPerfil || "",
          telefonoPasajero: userData.telefono || "",
          ultimoMensaje: "Chat iniciado",
          ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          mensajesSinLeer: 0,
          estadoViaje: viaje.estado || "disponible"
        };
        
        const nuevoChatRef = await addDoc(collection(db, "Chats"), nuevosDatos);
        chatDataCompleto = { id: nuevoChatRef.id, ...nuevosDatos };
      }

      setChatActivo(chatDataCompleto);
      setVista("chat_individual");
      
    } catch (error) {
      console.error("Error al iniciar chat:", error);
      alert("Hubo un error al intentar abrir el chat. Revisa la consola.");
    }
  };
  
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

  const manejarEditarViaje = (viaje) => {
    setViajeAEditar(viaje); 
    setViajeForm(viaje); 
    setVista("publicar");
    setPasoWizard(1);
  };

  const manejarEliminarViaje = async (viajeId) => {
    try {
      await deleteDoc(doc(db, "Viajes", viajeId));
    } catch (e) { console.error("Error al eliminar:", e); }
  };

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
          telefono: userData.telefono,
          fechaPublicacion: new Date().toISOString(),
          estado: "disponible",
          timestamp: Date.now()
        });
      }
      
      setViajeForm({
        origen: "", destino: "", precio: "", asientos: "4", horaSalida: "",
        preferencias: { ac: true, noFumar: true, mascotas: false, maxDosAtras: true }
      });

      if (!esperarToast) {
         setPasoWizard(1);
         setVista("inicio");
      }
    } catch (error) {
      console.error("Error en Firebase:", error);
      throw error; 
    }
  };

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b1120] text-white font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-500">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-center justify-center shadow-xl">
            <RefreshCcw size={28} className="text-blue-500 animate-spin" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mt-6 animate-pulse">
            Sincronizando perfil...
          </p>
        </div>
      </div>
    );
  }

  if (userData.cuentaSuspendida === true) {
    return (
      <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
        <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20">
          <AlertCircle size={60} className="text-red-500 animate-pulse" />
        </div>
        <h1 className="text-white font-black italic uppercase text-2xl tracking-tighter mb-4">
          Cuenta Suspendida
        </h1>
        <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest">
          Tu acceso a <span className="text-blue-500">Dame la cola</span> ha sido restringido.
        </p>
        <button 
          onClick={() => signOut(auth)}
          className="mt-12 text-slate-500 font-black uppercase text-[10px] border-b border-slate-800 pb-1 hover:text-white transition-colors"
        >
          Cerrar Sesión
        </button>
        <a 
          href="mailto: damelacola2026@gmail.com?subject=Apelación de Cuenta Suspendida"
          className="mt-6 text-blue-500 font-black uppercase text-[10px] tracking-widest hover:text-blue-400" >  Apelar Decisión (Soporte)  </a>
      </div>
    );
  }

  const listaViajes = viajes || [];
  const listaChats = chats || [];
  let totalAlertasViajes = 0;
  let tieneMensajesNuevos = false;

  if (userData?.id) {
    const alertasChofer = listaViajes.filter(v => 
      v.uidConductor === userData.id && 
      v.estado === 'disponible' && 
      v.reservasPendientes?.length > 0
    ).reduce((total, v) => total + v.reservasPendientes.length, 0);

    const alertasPasajero = listaViajes.filter(v => 
      v.estado !== 'finalizado' && 
      v.pasajeros?.some(p => p.id === userData.id && p.estado === 'confirmado' && p.abordado === false)
    ).length;

    totalAlertasViajes = alertasChofer + alertasPasajero;

    const misChats = listaChats.filter(c => c.uidConductor === userData.id || c.uidPasajero === userData.id);
    tieneMensajesNuevos = misChats.some(c => 
      c.mensajesSinLeer > 0 && c.remitenteUltimoMensaje !== userData.id
    );
  }

  if (verWallet) {
    return (
      <div className="w-full max-w-md mx-auto h-screen bg-[#0b1120] flex flex-col relative overflow-hidden z-[100]">
        <Wallet userData={userData} onRegresar={() => setVerWallet(false)} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      <Header 
        userData={userData} 
        modo={modo} 
        onAbrirWallet={() => setVerWallet(true)} 
      />

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {viajeSel ? (
          <VistaDetalleViaje 
            viaje={viajeSel} 
            onRegresar={() => setViajeSel(null)} 
            userData={userData} 
            onIniciarChat={iniciarChat} 
          />
        ) : (
          <>
            {vista === "inicio" && (
              <VistaInicio 
                viajes={viajes.filter(v => !v.estado || v.estado === 'disponible')} 
                setViajeSeleccionado={setViajeSel} 
                setVista={setVista} 
                userData={userData} 
                modo={modo} 
              />
            )}

            {vista === "mis_viajes" && (
              <VistaMisViajes 
                viajesChofer={listaViajes.filter(v => v.uidConductor === userData?.id)} 
                viajesPasajeroActivos={listaViajes.filter(v => v.pasajeros?.some(p => p.id === userData?.id || p.uid === userData?.id) && v.estado !== 'finalizado')} 
                viajesPasajeroHistorial={listaViajes.filter(v => v.pasajeros?.some(p => p.id === userData?.id || p.uid === userData?.id) && v.estado === 'finalizado')}
                userData={userData} 
                onRegresar={() => setVista("inicio")}
                onVerDetalles={(viaje) => setViajeSel(viaje)}
              />
            )}
          </>
        )}
        
        {vista === "inbox" && (
          <VistaInbox 
            chatsChofer={chats.filter(c => c.uidConductor === userData?.id)} 
            chatsPasajero={chats.filter(c => c.uidPasajero === userData?.id || c.pasajeros?.some(p => p.id === userData?.id))}
            userData={userData} 
            onAbrirChat={(chatSeleccionado) => {
              setChatActivo(chatSeleccionado);
              setVista("chat_individual");
            }}
          />
        )}   

        {/* CHAT PRIVADO */}
        {vista === "chat_individual" && chatActivo && (
          <VistaChatPrivado 
            chat={chatActivo} 
            userData={userData} 
            onRegresar={() => {
              setChatActivo(null);
              setVista("inbox");
            }} 
            onVerViaje={() => {
              const viajeAsociado = listaViajes.find(v => v.id === chatActivo.idViaje);
              if (viajeAsociado) {
                setChatActivo(null);
                setViajeSel(viajeAsociado);
                setVista("inicio"); 
              } else {
                alert("Este viaje ya no está disponible."); 
              }
            }}
          />
        )}
        
        {vista === "perfil" && (
          <VistaPerfil
            userData={userData} 
            setUserData={setUserData} 
            handleLogout={() => signOut(auth)} 
            pestañaActiva={pestañaPerfil} 
            setPestañaActiva={setPestañaPerfil}
            onAbrirChat={(chatSeleccionado) => {
              setChatActivo(chatSeleccionado);
              setVista("chat_individual");
            }}
          />
        )}
        
        {vista === "publicar" && (
          <WizardPublicar 
            userData={userData} pasoWizard={pasoWizard} setPasoWizard={setPasoWizard}
            viajeForm={viajeForm} setViajeForm={setViajeForm}
            UBICACIONES={UBICACIONES} setVista={setVista} setModo={setModo}
            publicarRuta={publicarRuta} editando={!!viajeAEditar}
          />
        )}
      </main>

      <Navbar 
        vista={vista} 
        modo={modo} 
        setVista={setVista} 
        setModo={setModo} 
        setPasoWizard={setPasoWizard} 
        tieneMensajesNuevos={tieneMensajesNuevos} 
        solicitudesPendientes={totalAlertasViajes} 
      />
    </div>
  );
}
