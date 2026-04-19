import React from "react";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";

// NO IMPORTAMOS NADA MÁS. NI VISTAS, NI COMPONENTES.

export default function NavegacionPrincipal({ user }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-10">
      <h1 className="text-2xl font-black text-green-600 mb-4 text-center">
        ¡EL LOGIN FUNCIONA!
      </h1>
      <p className="text-slate-600 mb-8 text-center font-bold">
        Si ves esto, tu App.tsx y NavegacionPrincipal están perfectos. El error está escondido adentro de VistaInicio o en la Navbar.
      </p>
      <button 
        onClick={() => signOut(auth)} 
        className="bg-red-600 text-white font-black tracking-widest uppercase py-4 px-8 rounded-2xl shadow-lg"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}
