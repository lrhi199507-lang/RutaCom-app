import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
// Importamos la app principal que acabas de crear arriba
import NavegacionPrincipal from './NavegacionPrincipal';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  const manejarAutenticacion = async (e: any) => {
    e.preventDefault();
    setCargando(true);
    try {
      if (esRegistro) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
    setCargando(false);
  };

  // SI HAY USUARIO, MUESTRA LA APP QUE RESCATAMOS
  if (usuario) {
    return <NavegacionPrincipal user={usuario} />;
  }

  // SI NO, MUESTRA LA PANTALLA AZUL
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-8 text-center text-white">
      <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
        <span className="text-5xl font-bold italic">R</span>
      </div>
      <h1 className="text-4xl font-bold italic mb-2">RutaCom</h1>
      <p className="text-gray-400 tracking-[4px] text-[10px] mb-10 uppercase">Conectando Destinos</p>

      <form onSubmit={manejarAutenticacion} className="w-full max-w-xs space-y-4">
        <input 
          type="email" placeholder="Correo" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Contraseña" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="w-full bg-blue-600 p-5 rounded-2xl font-bold tracking-widest uppercase">
          {cargando ? "Cargando..." : (esRegistro ? "Crear Cuenta" : "Entrar a la App")}
        </button>
      </form>

      <button onClick={() => setEsRegistro(!esRegistro)} className="mt-6 text-gray-400 text-sm underline">
        {esRegistro ? "¿Ya tienes cuenta? Entra" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
}
