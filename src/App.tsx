import React, { useState, useEffect } from 'react';
// Importamos Firebase desde tu archivo de configuración
import { auth } from './firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  // REVISAR SI HAY SESIÓN ACTIVA
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  const manejarAutenticacion = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    if (!email || !password) {
      alert("Por favor rellena todos los campos");
      return;
    }
    
    setCargando(true);
    try {
      if (esRegistro) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("¡Cuenta creada correctamente!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      let mensaje = "Ocurrió un error";
      if (error.code === 'auth/weak-password') mensaje = "La clave es muy corta (mínimo 6 caracteres)";
      if (error.code === 'auth/email-already-in-use') mensaje = "El correo ya está registrado";
      if (error.code === 'auth/invalid-credential') mensaje = "Correo o clave incorrectos";
      alert(mensaje);
    }
    setCargando(false);
  };

  // VISTA SI YA ESTÁ LOGUEADO
  if (usuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white">
        <h2 className="text-2xl font-bold mb-4">Bienvenido, {usuario.email}</h2>
        <button 
          onClick={() => signOut(auth)}
          className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl font-bold transition-colors"
        >
          CERRAR SESIÓN
        </button>
      </div>
    );
  }

  // PANTALLA DE INICIO (VISTA WEB COMPATIBLE CON VITE)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-8 text-center">
      
      {/* LOGO SIMULADO */}
      <div className="bg-blue-600 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-lg">
        <span className="text-white text-6xl font-bold italic">R</span>
      </div>
      
      <h1 className="text-white text-5xl font-bold italic mb-2">RutaCom</h1>
      <p className="text-gray-400 tracking-[6px] text-xs mb-10 uppercase">Conectando Destinos</p>

      {/* FORMULARIO */}
      <form onSubmit={manejarAutenticacion} className="w-full max-w-sm flex flex-col gap-4 mb-6">
        <input 
          type="email"
          placeholder="Correo electrónico"
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password"
          placeholder="Contraseña"
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* BOTÓN PRINCIPAL */}
        <button 
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 p-5 rounded-2xl text-white font-bold tracking-widest shadow-lg transition-all disabled:opacity-50"
        >
          {cargando ? "CARGANDO..." : (esRegistro ? "CREAR CUENTA" : "ENTRAR A LA APP")}
        </button>
      </form>

      {/* CAMBIAR ENTRE LOGIN Y REGISTRO */}
      <button 
        onClick={() => setEsRegistro(!esRegistro)}
        className="text-gray-400 text-sm hover:text-white transition-colors underline decoration-dotted underline-offset-4"
      >
        {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </button>
    </div>
  );
}
