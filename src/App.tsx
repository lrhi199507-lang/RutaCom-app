import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore'; // ✅ Importamos addDoc y collection
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation'; 
import { Check, ShieldCheck, Leaf, MapPin, Car, ChevronRight, Eye, EyeOff } from 'lucide-react'; 

import NavegacionPrincipal from './NavegacionPrincipal';

export default function App() {
  // ESTADOS DE AUTENTICACIÓN Y FLUJO
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false); 
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState<{texto: string, tipo: 'exito'|'error'} | null>(null);
  
  
  const [usuario, setUsuario] = useState<any>(undefined); 
  
  // ESTADOS DEL ONBOARDING
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [slideActual, setSlideActual] = useState(0);

  // VALIDACIONES DE CONTRASEÑA EN TIEMPO REAL
  const tieneSeis = password.length >= 6;
  const tieneMayus = /[A-Z]/.test(password);
  const tieneNum = /[0-9]/.test(password);
  const passwordValida = tieneSeis && tieneMayus && tieneNum;

  const [mensajeCarga, setMensajeCarga] = useState("Conectando...");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user); 
    });
    return () => unsubscribe();
  }, []);

const manejarOlvidoClave = async () => {
  if (!email.trim() || !email.includes('@')) {
    setToast({ texto: "Escribe un correo válido para ayudarte.", tipo: "error" });
    setTimeout(() => setToast(null), 4000);
    return;
  }

  setCargando(true);
  try {
    await addDoc(collection(db, "Notificaciones"), {
      idDestino: "CORREO_OLVIDO",
      email: email.toLowerCase().trim(),
      nombre: "Viajero",
      timestamp: Date.now()
    });

    // ✅ Aquí cambiamos el alert gris por tu Toast elegante
    setToast({ 
      texto: "¡Enviado! Revisa tu bandeja de entrada para restablecer tu clave.", 
      tipo: "exito" 
    });
    setTimeout(() => setToast(null), 5000);
  } catch (error: any) {
    setToast({ texto: "Hubo un problema al procesar la solicitud.", tipo: "error" });
    setTimeout(() => setToast(null), 4000);
  } finally {
    setCargando(false);
  }
};

  useEffect(() => {
    if (usuario !== undefined) return;
    
    const mensajes = [
      "Calentando motores...", 
      "Buscando rutas...", 
      "Preparando la calle...",
      "Casi listos..."
    ];
    let i = 0;
    const intervalo = setInterval(() => {
      setMensajeCarga(mensajes[i]);
      i = (i + 1) % mensajes.length;
    }, 1500);

    return () => clearInterval(intervalo);
  }, [usuario]);

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
  
    const manejarAutenticacion = async (e: any) => {
    e.preventDefault();
    
    if (esRegistro && (!nombre.trim() || !passwordValida)) {
      alert("Por favor, ingresa tu nombre completo para continuar.");
      return;
    }
    
    setCargando(true);
    try {
      if (esRegistro) {
        const res = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
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

        // 🔥 DISPARADOR A TELEGRAM: NUEVO USUARIO 🔥
        try {
          await addDoc(collection(db, "Notificaciones"), {
            idDestino: "ADMIN_TELEGRAM",
            titulo: "NUEVO REGISTRO 👤",
            mensaje: `Se registró un nuevo usuario en la app:\nNombre: ${nombre.trim()}\nCorreo: ${email.toLowerCase().trim()}`,
            timestamp: Date.now()
          });
        } catch (errorTelegram) {
          console.error("Error al avisar a Telegram:", errorTelegram);
        }
                // ✉️ DISPARADOR: SOLICITAR CORREO DE VERIFICACIÓN PREMIUM ✉️
        try {
          await addDoc(collection(db, "Notificaciones"), {
            idDestino: "CORREO_VERIFICACION",
            email: email.toLowerCase().trim(),
            nombre: nombre.trim(),
            timestamp: Date.now()
          });
        } catch (errorCorreo) {
          console.error("Error al solicitar correo de verificación:", errorCorreo);
        }

        setMostrarOnboarding(true);

      } else {
        await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        alert("Este correo ya está registrado. Te pasaremos al inicio de sesión.");
        setEsRegistro(false); 
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        alert("Correo o contraseña incorrectos.");
      } else {
        alert("Error: " + error.message);
      }
    } finally {
      setCargando(false);
    }
  };

  const slides = [
    {
      icono: <Car size={80} className="text-blue-500 mb-6" />,
      titulo: `¡Hola, ${nombre.split(' ')[0] || 'Viajero'}!`,
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

  // 🔥 PANTALLA DE CARGA (SPLASH SCREEN) 🔥
  if (usuario === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b1120] text-white font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>

        <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-700">
          <div className="bg-blue-600 w-28 h-28 rounded-[35px] flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] transform -skew-x-6 border-b-[6px] border-blue-800 animate-bounce">
            <span className="text-6xl font-black italic text-white drop-shadow-md">D</span>
          </div>
          
          <h1 className="text-3xl font-black italic mt-8 tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            DameLaCola
          </h1>

          <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-blue-600 to-emerald-400 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mt-4 animate-pulse">
            {mensajeCarga}
          </p>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}} />
      </div>
    );
  }

  if (usuario && mostrarOnboarding) {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen bg-[#0f172a] p-8 text-center text-white font-sans animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto">
          <div key={slideActual} className="animate-in slide-in-from-right fade-in duration-500 flex flex-col items-center">
            <div className="bg-slate-900 p-8 rounded-full shadow-2xl border border-white/5 mb-8">
              {slides[slideActual].icono}
            </div>
            <h2 className="text-3xl font-black italic mb-4 tracking-tighter">{slides[slideActual].titulo}</h2>
            <p className="text-slate-400 font-medium leading-relaxed">{slides[slideActual].texto}</p>
          </div>
        </div>

        <div className="w-full max-w-sm pb-10">
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slideActual ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`} />
            ))}
          </div>
         <button onClick={async () => {
              if (slideActual < slides.length - 1) {
                setSlideActual(slideActual + 1);
              } else {
                try {
                  await Geolocation.requestPermissions();
                  const permPush = await PushNotifications.requestPermissions();
                  if (permPush.receive === 'granted') {
                    await PushNotifications.register();
                  }
                } catch (e) {
                  console.log("Error solicitando permisos:", e);
                }
                
                setMostrarOnboarding(false);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all p-5 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg flex items-center justify-center gap-2"
          >
            {slideActual === slides.length - 1 ? "Permitir todo y Comenzar" : "Siguiente"} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (usuario && !mostrarOnboarding) {
    return <NavegacionPrincipal user={usuario} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-8 text-center text-white font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/50 transform -skew-x-6 border-b-4 border-blue-800 mt-8">
        <span className="text-5xl font-black italic">D</span>
      </div>
      
      <h1 className="text-4xl font-black italic mb-2 tracking-tighter">DameLaCola</h1>
      
      {!esRegistro && <p className="text-blue-400 font-bold tracking-[3px] text-[10px] mb-8 uppercase italic">LA FORMA MÁS SEGURA DE PEDIR LA COLA</p>}
      {esRegistro && <p className="text-slate-400 text-xs mb-8">Crea tu cuenta en segundos</p>}

      <form onSubmit={manejarAutenticacion} className="w-full max-w-xs space-y-4 animate-in fade-in duration-300">
        
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          disabled={cargando}
          required
        />

        {esRegistro && (
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all animate-in slide-in-from-top-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)} 
            disabled={cargando}
            required
          />
        )}

        <div className="relative animate-in slide-in-from-top-2">
          <input 
            type={verPassword ? "text" : "password"} 
            placeholder="Contraseña" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm text-white transition-all pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            disabled={cargando}
            required
          />
          
          <button
            type="button"
            onClick={() => setVerPassword(!verPassword)}
            className="absolute right-4 top-[18px] text-slate-400 hover:text-white transition-colors"
          >
            {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

          {esRegistro && (
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
        
        <button 
          disabled={cargando || (esRegistro && !passwordValida)}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all p-5 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg disabled:opacity-50 mt-4"
        >
          {cargando ? "PROCESANDO..." : (esRegistro ? "Crear Cuenta" : "Entrar a la App")}
        </button>
      </form>

      {/* 🔥 BOTÓN DE OLVIDÉ MI CONTRASEÑA 🔥 */}
      {!esRegistro && (
        <button 
          onClick={manejarOlvidoClave}
          className="mt-6 text-[10px] font-black uppercase tracking-[2px] text-slate-500 hover:text-blue-400 transition-colors italic"
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}

      <button 
        onClick={() => {
          setEsRegistro(!esRegistro);
          setPassword(''); 
        }} 
        className="mt-4 text-slate-400 text-xs font-bold underline hover:text-white transition-colors"
      >
        {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
      </button>
    </div>
  );
}
