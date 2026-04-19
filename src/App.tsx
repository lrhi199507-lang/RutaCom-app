import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; // Asegúrate de exportar 'db' desde tu config
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Importamos la navegación principal
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
        // 1. Crear usuario en Firebase Authentication
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const uid = res.user.uid;

        // 2. CREACIÓN AUTOMÁTICA DEL PERFIL EN FIRESTORE
        // Esto garantiza que el nivel y la confianza funcionen desde el día 1
        await setDoc(doc(db, "usuarios", uid), {
          nombre: email.split('@')[0], // Nombre temporal basado en el correo
          email: email,
          viajesRealizados: 0,        // Inicia como 'Novato'
          kycVerificado: false,       // Estado de confianza: Cédula
          licenciaVerificada: false,  // Estado de confianza: Licencia
          placaVerificada: false,     // Estado de confianza: Vehículo
          rating: 5,
          saldo: 0,
          saldoRetenido: 0,
          telefono: "",
          vehiculo: {
            marca: "",
            modelo: "",
            placa: "",
            color: ""
          }
        });
      } else {
        // Inicio de sesión normal
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
    setCargando(false);
  };

  // Si hay usuario logueado, entramos a la App
  if (usuario) {
    return <NavegacionPrincipal user={usuario} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-8 text-center text-white font-sans">
      {/* LOGO DINÁMICO */}
      <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/50 transform -skew-x-6 border-b-4 border-blue-800">
        <span className="text-5xl font-black italic">D</span>
      </div>
      
      <h1 className="text-4xl font-black italic mb-2 tracking-tighter">DameLaCola</h1>
      <p className="text-blue-400 font-bold tracking-[3px] text-[10px] mb-10 uppercase italic">
        LA FORMA MÁS SEGURA DE PEDIR LA COLA
      </p>

      <form onSubmit={manejarAutenticacion} className="w-full max-w-xs space-y-4">
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all"
          onChange={(e) => setEmail(e.target.value)} 
          required
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all"
          onChange={(e) => setPassword(e.target.value)} 
          required
        />
        
        <button 
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all p-5 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg disabled:opacity-50"
        >
          {cargando ? "PROCESANDO..." : (esRegistro ? "Crear Cuenta" : "Entrar a la App")}
        </button>
      </form>

      <button 
        onClick={() => setEsRegistro(!esRegistro)} 
        className="mt-6 text-slate-400 text-xs font-bold underline hover:text-white transition-colors"
      >
        {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
      </button>
    </div>
  );
}
