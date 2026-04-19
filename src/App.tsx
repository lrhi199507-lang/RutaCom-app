import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';

// ESTO ES LO CORRECTO: Importamos el archivo externo
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

  // Si hay usuario, mostramos la navegación que está en el otro archivo
  if (usuario) {
    return <NavegacionPrincipal user={usuario} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-8 text-center text-white font-sans">
      <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/50 transform -skew-x-6 border-b-4 border-blue-800">
        <span className="text-5xl font-black italic">D</span>
      </div>
      <h1 className="text-4xl font-black italic mb-2 tracking-tighter">DameLaCola</h1>
      <p className="text-blue-400 font-bold tracking-[3px] text-[10px] mb-10 uppercase italic">LA FORMA MÁS SEGURA DE PEDIR LA COLA</p>

      <form onSubmit={manejarAutenticacion} className="w-full max-w-xs space-y-4">
        <input 
          type="email" placeholder="Correo" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Contraseña" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="w-full bg-blue-600 hover:bg-blue-500 transition-colors p-5 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg">
          {cargando ? "Cargando..." : (esRegistro ? "Crear Cuenta" : "Entrar a la App")}
        </button>
      </form>

      <button onClick={() => setEsRegistro(!esRegistro)} className="mt-6 text-slate-400 text-xs font-bold underline hover:text-white transition-colors">
        {esRegistro ? "¿Ya tienes cuenta? Entra" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
}
