
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
// 🔥 IMPORTAMOS LAS NUEVAS QUERIES DE FIRESTORE
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import { PushNotifications } from '@capacitor/push-notifications';
// 🔥 IMPORTAMOS ICONOS PARA EL ONBOARDING Y CHECKLIST
import { Check, ArrowRight, ShieldCheck, Leaf, MapPin, Car, ChevronRight } from 'lucide-react';

import NavegacionPrincipal from './NavegacionPrincipal';

export default function App() {
  // ESTADOS DE AUTENTICACIÓN Y FLUJO
  const [paso, setPaso] = useState<'email' | 'login' | 'registro'>('email');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  
  // ESTADOS DEL ONBOARDING
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [slideActual, setSlideActual] = useState(0);

  // VALIDACIONES DE CONTRASEÑA EN TIEMPO REAL
  const tieneSeis = password.length >= 6;
  const tieneMayus = /[A-Z]/.test(password);
  const tieneNum = /[0-9]/.test(password);
  const passwordValida = tieneSeis && tieneMayus && tieneNum;

  // 1. EFECTO DE AUTENTICACIÓN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 GUARDIÁN DE NOTIFICACIONES PUSH 🔥
  useEffect(() => {
    if (!usuario) return;

    const inicializarPush = async () => {
      try {
        await PushNotifications.removeAllListeners();
        await PushNotifications.addListener('registration', async (token) => {
          try {
            await updateDoc(doc(db, "usuarios", usuario.uid), {
              fcmTokenNativo: token.value,
              ultimaActualizacionToken: new Date().toISOString()
            });
          } catch (e) { console.error("Error guardando token:", e); }
        });

        await PushNotifications.addListener('registrationError', (err) => console.error(err));
        
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') permStatus = await PushNotifications.requestPermissions();
        if (permStatus.receive === 'granted') await PushNotifications.register();
      } catch (error) { console.error("Error Push:", error); }
    };

    inicializarPush();
    return () => { PushNotifications.removeAllListeners(); };
  }, [usuario]);
  
  // 🔥 PASO 1: DETECCIÓN INTELIGENTE DEL CORREO (VERSIÓN SEGURA) 🔥
  const verificarCorreo = async (e: any) => {
    e.preventDefault();
    if (!email) return;
    setCargando(true);
    try {
      // Le preguntamos a Firebase Auth si el correo ya está registrado
      const metodos = await fetchSignInMethodsForEmail(auth, email.toLowerCase().trim());
      
      if (metodos.length === 0) {
        setPaso('registro'); // Correo nuevo -> Vamos a crear cuenta
      } else {
        setPaso('login');    // Correo existe -> Vamos a pedir contraseña
      }
    } catch (error: any) {
      alert("Error verificando conexión: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  // 🔥 PASO 2: INICIAR SESIÓN O REGISTRAR 🔥
  const manejarAutenticacion = async (e: any) => {
    e.preventDefault();
    if (paso === 'registro' && !passwordValida) return;
    
    setCargando(true);
    try {
      if (paso === 'registro') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const uid = res.user.uid;

        await setDoc(doc(db, "usuarios", uid), {
          uid: uid,
          nombre: nombre.trim(),
          email: email.toLowerCase().trim(),
          viajesRealizados: 0,
          kycVerificado: false,
          licenciaVerificada: false,
          placaVerificada: false,
          rating: 5,
          saldo: 0,
          saldoRetenido: 0,
          telefono: "",
          fechaRegistro: new Date().toISOString(),
          cuentaSuspendida: false,
          vehiculo: { marca: "", modelo: "", placa: "", color: "" }
        });

        // DISPARAMOS EL ONBOARDING PARA USUARIOS NUEVOS
        setMostrarOnboarding(true);

      } else if (paso === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') alert("Contraseña incorrecta");
      else alert("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  // DIAPOSITIVAS DEL ONBOARDING
  const slides = [
    {
      icono: <Car size={80} className="text-blue-500 mb-6" />,
      titulo: `¡Hola, ${nombre.split(' ')[0]}!`,
      texto: "Bienvenido a DameLaCola, la comunidad donde conectamos a personas para compartir viajes de forma inteligente y segura."
    },
    {
      icono: <ShieldCheck size={80} className="text-emerald-500 mb-6" />,
      titulo: "Seguridad Primero",
      texto: "Nuestra prioridad es tu tranquilidad. Verificamos la identidad de cada usuario, licencia y vehículo para que cada cola sea 100% segura."
    },
    {
      icono: <Leaf size={80} className="text-green-500 mb-6" />,
      titulo: "Menos Emisiones, Más Vida",
      texto: "Al compartir el carro y llenar asientos vacíos, estás ayudando directamente a reducir toneladas de CO2 en nuestra ciudad. ¡Viaja verde!"
    },
    {
      icono: <MapPin size={80} className="text-orange-500 mb-6" />,
      titulo: "¡Todo listo para arrancar!",
      texto: "En el siguiente paso, te pediremos acceso a tu GPS para poder conectar tu ubicación con las mejores rutas en tiempo real."
    }
  ];

  // ==============================================
  // RENDER 1: EL ONBOARDING (Si acaba de registrarse)
  // ==============================================
  if (usuario && mostrarOnboarding) {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen bg-[#0f172a] p-8 text-center text-white font-sans animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto">
          {/* Animación suave entre slides */}
          <div key={slideActual} className="animate-in slide-in-from-right fade-in duration-500 flex flex-col items-center">
            <div className="bg-slate-900 p-8 rounded-full shadow-2xl border border-white/5 mb-8">
              {slides[slideActual].icono}
            </div>
            <h2 className="text-3xl font-black italic mb-4 tracking-tighter">{slides[slideActual].titulo}</h2>
            <p className="text-slate-400 font-medium leading-relaxed">{slides[slideActual].texto}</p>
          </div>
        </div>

        {/* Controles del Onboarding */}
        <div className="w-full max-w-sm pb-10">
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slideActual ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`} />
            ))}
          </div>
          <button 
            onClick={() => {
              if (slideActual < slides.length - 1) setSlideActual(slideActual + 1);
              else setMostrarOnboarding(false); // Fin del onboarding, entra a la app
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all p-5 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg flex items-center justify-center gap-2"
          >
            {slideActual === slides.length - 1 ? "Comenzar el Viaje" : "Siguiente"} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ==============================================
  // RENDER 2: LA APP PRINCIPAL (Si ya está logueado)
  // ==============================================
  if (usuario && !mostrarOnboarding) {
    return <NavegacionPrincipal user={usuario} />;
  }

  // ==============================================
  // RENDER 3: LOGIN / REGISTRO
  // ==============================================
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-8 text-center text-white font-sans relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* LOGO DINÁMICO Y BOTÓN ATRÁS */}
      <div className="w-full max-w-xs flex justify-between items-center mb-8">
        {paso !== 'email' ? (
          <button onClick={() => setPaso('email')} className="text-slate-400 hover:text-white p-2">
            <ArrowRight className="rotate-180" size={24} />
          </button>
        ) : <div className="w-10"></div>}
      </div>

      <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/50 transform -skew-x-6 border-b-4 border-blue-800">
        <span className="text-5xl font-black italic">D</span>
      </div>
      
      <h1 className="text-4xl font-black italic mb-2 tracking-tighter">DameLaCola</h1>
      
      {paso === 'email' && (
        <p className="text-blue-400 font-bold tracking-[3px] text-[10px] mb-10 uppercase italic">
          LA FORMA MÁS SEGURA DE PEDIR LA COLA
        </p>
      )}

      {paso === 'login' && <p className="text-slate-400 text-xs mb-8">¡Qué bueno verte de nuevo!</p>}
      {paso === 'registro' && <p className="text-slate-400 text-xs mb-8">Crea tu cuenta en segundos</p>}

      <form onSubmit={paso === 'email' ? verificarCorreo : manejarAutenticacion} className="w-full max-w-xs space-y-4 animate-in fade-in duration-300">
        
        {/* EMAIL (Siempre visible, bloqueado en pasos 2 y 3) */}
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          className={`w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm transition-all ${paso !== 'email' ? 'text-slate-500 bg-black/20' : 'text-white'}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          disabled={paso !== 'email' || cargando}
          required
        />

        {/* CAMPOS DE REGISTRO */}
        {paso === 'registro' && (
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all animate-in slide-in-from-bottom-4"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)} 
            disabled={cargando}
            required
          />
        )}

        {/* CAMPO DE CONTRASEÑA (Login y Registro) */}
        {paso !== 'email' && (
          <div className="animate-in slide-in-from-bottom-4">
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              disabled={cargando}
              required
            />

            {/* 🔥 CHECKLIST DE SEGURIDAD (Solo en registro) 🔥 */}
            {paso === 'registro' && (
              <div className="text-left mt-3 space-y-2 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors ${tieneSeis ? 'text-green-400' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tieneSeis ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                    {tieneSeis && <Check size={10} />}
                  </div>
                  Mínimo 6 caracteres
                </p>
                <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors ${tieneMayus ? 'text-green-400' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tieneMayus ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                    {tieneMayus && <Check size={10} />}
                  </div>
                  Al menos una Mayúscula
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${tieneNum ? 'text-green-400' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tieneNum ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                    {tieneNum && <Check size={10} />}
                  </div>
                  Al menos un Número
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* BOTÓN MAESTRO */}
        <button 
          disabled={cargando || (paso === 'registro' && !passwordValida)}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all p-5 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg disabled:opacity-50 mt-4"
        >
          {cargando ? "PROCESANDO..." : (paso === 'email' ? "Continuar" : (paso === 'registro' ? "Crear Cuenta" : "Entrar a la App"))}
        </button>
      </form>
    </div>
  );
}
