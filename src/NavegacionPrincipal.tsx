import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";

export default function NavegacionPrincipal({ user }) {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f0f2f5',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#1e40af', fontWeight: 'bold' }}>¡CONEXIÓN EXITOSA!</h1>
      <p>Hola, {user?.email}</p>
      <p style={{ fontSize: '14px', color: '#64748b' }}>
        Si ves esto, el archivo NavegacionPrincipal está cargando bien. 
        El problema está en uno de los componentes de las carpetas.
      </p>
      <button 
        onClick={() => signOut(auth)}
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#ef4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        Cerrar Sesión para reintentar
      </button>
    </div>
  );
}
