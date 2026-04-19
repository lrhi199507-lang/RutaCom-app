import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

import { Navbar } from "./components/layout/Navbar";

import { VistaInicio } from './components/views/VistaInicio';

export default function NavegacionPrincipal({ user }) {
  const [userData, setUserData] = useState({ nombre: "Usuario", saldo: 0 });
  const [viajes, setViajes] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");

  // Escuchamos los viajes reales de Firebase
  useEffect(() => {
    try {
      const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setViajes(lista);
      });
      return () => unsub();
    } catch (err) {
      console.log("Error en Firestore:", err);
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden border-x">
    
      
      <main className="flex-1 overflow-y-auto pb-24 bg-slate-50">
        {vista === "inicio" ? (
          <VistaInicio 
            viajes={viajes} 
            setViajeSeleccionado={() => {}} 
            setVista={setVista} 
            userData={userData} 
          />
        ) : (
          <div className="p-10 text-center">
            <p className="text-slate-400">Pronto cargaremos la vista: {vista}</p>
            <button onClick={() => setVista("inicio")} className="text-blue-500 underline mt-2">Volver</button>
          </div>
        )}
      </main>

      <Navbar 
        vista={vista} 
        modo={modo} 
        setVista={setVista} 
        setModo={setModo} 
        setPasoWizard={() => {}} 
      />
    </div>
  );
}
