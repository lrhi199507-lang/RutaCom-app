import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, orderBy, addDoc } from "firebase/firestore";
import { VistaMisViajes } from './components/views/VistaMisViajes';
import { VistaInbox } from './components/views/VistaInbox';
import { VistaPerfil } from './components/views/VistaPerfil';
import { WizardPublicar } from './components/ui/WizardPublicar'; 
import { VistaDetalleViaje } from './components/views/VistaDetalleViaje';
// IMPORTACIONES
import { Navbar } from "./components/layout/Navbar";
import { VistaInicio } from './components/views/VistaInicio';
// Importamos el Header desde la ubicación que me pasaste
import { Header } from './components/ui/Header'; 

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState(null);
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [viajeSel, setViajeSel] = useState(null);
  const [pestañaPerfil, setPestañaPerfil] = useState("publico");
    // --- ESTADOS PARA EL WIZARD DE PUBLICACIÓN ---
  const [pasoWizard, setPasoWizard] = useState(1);
const [viajeForm, setViajeForm] = useState({
  origen: "", 
  destino: "", 
  precio: "", 
  asientos: "4", 
  fechaSalida: "", // Nuevo
  horaSalida: "", 
  publicarRegreso: false, // Nuevo
  fechaRegreso: "", // Nuevo
  horaRegreso: "", // Nuevo
  preferencias: { ac: true, noFumar: true, mascotas: false, maxDosAtras: true }
});
  

  // Base de datos de ubicaciones para el autocompletado
  const UBICACIONES = {
    "Carabobo": ["Valencia", "Naguanagua", "San Diego", "Guacara", "Puerto Cabello"],
    "Distrito Capital": ["Caracas"],
    "Aragua": ["Maracay", "Turmero", "La Victoria"],
    "Lara": ["Barquisimeto", "Cabudare"],
    "Zulia": ["Maracaibo"]
  };

  // Función para enviar a Firebase (Colección "Viajes")
  const publicarRuta = async (datosFinales) => {
    try {
      const { addDoc, collection } = await import("firebase/firestore");
      
      await addDoc(collection(db, "Viajes"), {
        ...datosFinales,
        fecha: new Date().toISOString(),
        estado: "disponible"
      });

      // Limpiamos el formulario y regresamos al inicio
      setViajeForm({
        origen: "", destino: "", precio: "", asientos: "4", horaSalida: "",
        preferencias: { ac: true, noFumar: true, mascotas: false, maxDosAtras: true }
      });
      setPasoWizard(1);
      setVista("inicio");
      setModo("conductor");
      
    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Error al conectar con la base de datos");
    }
  };
  

  useEffect(() => {
    if (!user?.uid) return;
    // Escuchar datos del usuario
    const unsubU = onSnapshot(doc(db, "usuarios", user.uid), (s) => {
      setUserData(s.exists() ? { id: s.id, ...s.data() } : { id: user.uid, nombre: "Usuario", saldo: 0 });
    });
    // Escuchar viajes
    const unsubV = onSnapshot(query(collection(db, "Viajes"), orderBy("fecha", "desc")), (s) => {
      setViajes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubU(); unsubV(); };
  }, [user]);

  // Pantalla de carga mientras llega Firebase
  if (!userData) return <div className="h-screen flex items-center justify-center font-black text-blue-600 italic uppercase">Cargando Datos...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
      
      {/* EL HEADER BLANCO AHORA ESTÁ AQUÍ (Ubicación fija arriba) */}
      <Header userData={userData} modo={modo} />

      <main className="flex-1 overflow-y-auto bg-slate-50">
  {vista === "inicio" && (
    viajeSel ? (
      <VistaDetalleViaje viaje={viajeSel} onRegresar={() => setViajeSel(null)} />
    ) : (
      <VistaInicio 
        viajes={viajes} 
        setViajeSeleccionado={setViajeSel} 
        setVista={setVista} 
        userData={userData}
        modo={modo} 
      />
    )
  )}

  {vista === "mis_viajes" && <VistaMisViajes userData={userData} />}
  
  {vista === "inbox" && <VistaInbox userData={userData} />}
  
  {vista === "perfil" && (
  <VistaPerfil 
    userData={userData} 
    handleLogout={() => signOut(auth)} 
    pestañaActiva={pestañaPerfil}
    setPestañaActiva={setPestañaPerfil}
  />
)}
        
{vista === "publicar" && (
  <WizardPublicar 
    userData={userData} 
    pasoWizard={pasoWizard} 
    setPasoWizard={setPasoWizard}
    viajeForm={viajeForm} 
    setViajeForm={setViajeForm}
    UBICACIONES={UBICACIONES}
    setVista={setVista}
    setModo={setModo}
    publicarRuta={async (datosFinales) => {
      // 1. Verificamos en consola que los datos llegaron al padre
      console.log("Datos recibidos para publicar:", datosFinales);

      try {
        // 2. Intentamos guardar en Firebase
        await addDoc(collection(db, "Viajes"), {
          ...datosFinales,
          fecha: new Date().toISOString(),
          estado: "disponible",
          timestamp: Date.now()
        });

        // 3. Feedback visual: Esto es lo que faltaba para que "diga algo"
        alert("✅ ¡Ruta publicada con éxito en Dame la cola!");

        // 4. Limpiamos y regresamos
        setViajeForm({
          origen: "", destino: "", precio: "", asientos: "4", horaSalida: "",
          preferencias: { ac: true, noFumar: true, mascotas: false, maxDosAtras: true }
        });
        setPasoWizard(1);
        setVista("inicio");
        setModo("conductor");

      } catch (error) {
        console.error("Error en Firebase:", error);
        alert("❌ Error al publicar: " + error.message);
      }
    }}
  />
)}
</main>
 <Navbar 
  vista={vista} 
  modo={modo} 
  setVista={setVista} 
  setModo={setModo} 
  setPasoWizard={setPasoWizard} // <--- Ahora sí le pasamos la función real
/>
    </div>
  );
}
