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

    // 🔥 LA SOLUCIÓN: Le decimos a Firebase que SOLO escuche nuestros chats. 
    // Lo ordenamos en memoria (sort) para no tener que crear Índices Complejos en la base de datos.
    const unsubC = onSnapshot(
      query(collection(db, "Chats"), where("participantes", "array-contains", user.uid)), 
      (s) => {
        const chatsData = s.docs.map(d => ({ id: d.id, ...d.data() }));
        chatsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Ordena del más nuevo al más viejo
        setChats(chatsData);
      },
      (error) => {
        console.error("Error silencioso evitado en chats:", error);
      }
    );

    return () => { unsubU(); unsubV(); unsubC(); };
  }, [user]);

      // 🔥 EL CEREBRO MAESTRO DE NAVEGACIÓN 🔥
  useEffect(() => {
    const configurarBotonAtras = async () => {
      // 1. MATAMOS cualquier listener fantasma acumulado
      await App.removeAllListeners();

      // 2. Creamos EL ÚNICO controlador de toda la app
      await App.addListener('backButton', () => {

        // Prioridad 1: Perfil Público abierto
        if (window.perfilPublicoAbierto) {
          window.dispatchEvent(new Event('cerrarPerfilGlobal'));
          return;
        }

        // Prioridad 2: Chat Privado
        if (vista === "chat_individual") {
          setChatActivo(null);
          setVista("inbox");
          return;
        }

        // Prioridad 3: Publicar Viaje (Retrocede pasos)
        if (vista === "publicar") {
          if (pasoWizard > 1) {
            setPasoWizard(prev => prev - 1);
          } else {
            setVista("inicio");
          }
          return;
        }

        // Prioridad 4: Detalle de Viaje abierto
        if (viajeSel) {
          setViajeSel(null);
          return;
        }

        // Prioridad 5: Cualquier otra pestaña vuelve a inicio
        if (vista !== 'inicio') {
          setVista('inicio');
          return;
        }

        // Prioridad 6: Salir de la app
        App.exitApp();
      });
    };

    configurarBotonAtras();

  }, [vista, viajeSel, pasoWizard, chatActivo]); 
  // ↑ Es VITAL que estas variables estén en el corchete

   const iniciarChat = async (datos) => {
    if (!userData?.id || !datos?.id) return;
    
    try {
      // 🔥 EL PARCHE MAESTRO: Si la orden ya trae el chat armado desde VistaDetalleViaje, ábrelo de una!
      if (datos.participantes && typeof datos.mensajesSinLeer !== 'undefined') {
        setChatActivo(datos);
        setVista("chat_individual");
        setViajeSel(null); // Cierra la pantalla del viaje para no causar conflictos
        return;
      }

      // --- Lógica original para el pasajero ---
      const conductorId = datos.uidConductor || datos.idCreador;
      const soyConductor = conductorId === userData.id;

      // Si es conductor y la orden no trajo el chat armado, lo mandamos al inbox por seguridad
      if (soyConductor) {
         setVista("inbox");
         return;
      }

      const chatsRef = collection(db, "Chats");
      const q = query(
        chatsRef, 
        where("idViaje", "==", datos.id),
        where("participantes", "array-contains", userData.id) 
      );
      
      const querySnapshot = await getDocs(q);
      
      let chatDataCompleto = null;

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        chatDataCompleto = { id: docSnap.id, ...docSnap.data() };
      } else {
        const nuevosDatos = {
          idViaje: datos.id,
          ruta: `${datos.cO || datos.origen?.split(',')[0] || "Ruta"} - ${datos.cD || datos.destino?.split(',')[0] || "Ruta"}`,
          uidConductor: conductorId, 
          nombreConductor: datos.conductor || "Conductor",
          telefonoConductor: datos.telefono || "",
          fotoConductor: datos.fotoPerfil || "",
          uidPasajero: userData.id,
          nombrePasajero: userData.nombre || "Pasajero",
          fotoPasajero: userData.fotoPerfil || "",
          telefonoPasajero: userData.telefono || "",
          ultimoMensaje: "Chat iniciado",
          ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          mensajesSinLeer: 0,
          estadoViaje: datos.estado || "disponible",
          participantes: [conductorId, userData.id]
        };
        
        const nuevoChatRef = await addDoc(collection(db, "Chats"), nuevosDatos);
        chatDataCompleto = { id: nuevoChatRef.id, ...nuevosDatos };
      }

      setChatActivo(chatDataCompleto);
      setVista("chat_individual");
      setViajeSel(null); // 🔥 Aseguramos cerrar la vista del viaje aquí también
      
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
          href="mailto: soportedamelacola@gmail.com?subject=Apelación de Cuenta Suspendida"
          className="mt-6 text-blue-500 font-black uppercase text-[10px] tracking-widest hover:text-blue-400" >  Apelar Decisión (Soporte)  </a>
      </div>
    );
  }

    // 🔥 PANTALLA DE CASTIGO: SUSPENSIÓN TEMPORAL POR CANCELACIONES
  if (userData.suspendidoTemporalmenteHasta && Date.now() < userData.suspendidoTemporalmenteHasta) {
    const fechaLiberacion = new Date(userData.suspendidoTemporalmenteHasta).toLocaleString('es-ES', { 
      weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });

    return (
      <div className="w-full max-w-md mx-auto h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
        <div className="bg-orange-500/10 p-6 rounded-full mb-6 border border-orange-500/20">
          <AlertCircle size={60} className="text-orange-500 animate-pulse" />
        </div>
        <h1 className="text-white font-black italic uppercase text-2xl tracking-tighter mb-4">
          Suspensión Temporal
        </h1>
        <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest mb-6">
          Has alcanzado el límite máximo de cancelaciones. Para proteger a la comunidad, tu cuenta está en pausa.
        </p>
        <div className="bg-orange-950/30 border border-orange-900/50 px-5 py-3 rounded-2xl w-full">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Tu cuenta se liberará el:</p>
          <p className="text-sm font-black text-orange-200 capitalize">{fechaLiberacion}</p>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="mt-12 text-slate-500 font-black uppercase text-[10px] border-b border-slate-800 pb-1 hover:text-white transition-colors"
        >
          Cerrar Sesión
        </button>
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
