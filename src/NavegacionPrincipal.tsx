import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";

// Intentamos cargar solo lo básico primero
import { Navbar } from "./components/layout/Navbar";
import { Header } from './components/ui/Header';

export default function NavegacionPrincipal({ user }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");

  // Datos ficticios para que el Header no explote si no hay Firebase aún
  const userData = { nombre: "Usuario", saldo: 0 };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Si el error está aquí, la pantalla volverá a blanco */}
      <Header userData={userData} modo={modo} />
      
      <main className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-6">
          <h2 className="font-black text-blue-600">ESTRUCTURA CARGADA</h2>
          <p className="text-xs text-slate-500">Si ves el Header arriba y el Navbar abajo, vamos por buen camino.</p>
          <button onClick={() => signOut(auth)} className="mt-4 text-red-500 font-bold text-xs uppercase underline">Cerrar Sesión</button>
        </div>
      </main>

      {/* Si el error está aquí, la pantalla volverá a blanco */}
      <Navbar vista={vista} modo={modo} setVista={setVista} setModo={setModo} setPasoWizard={() => {}} />
    </div>
  );
}
