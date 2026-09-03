import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore'; 
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation'; 
import { App as CapacitorApp } from '@capacitor/app';
import { Check, ShieldCheck, Leaf, MapPin, Car, ChevronRight, Eye, EyeOff, RefreshCcw, AlertTriangle } from 'lucide-react'; 
import { getFunctions, httpsCallable } from 'firebase/functions';
import NavegacionPrincipal from './NavegacionPrincipal';

export default function App() {
  // ESTADOS DE AUTENTICACIÓN Y FLUJO
  const functions = getFunctions();
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false); 
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState<{texto: string, tipo: 'exito'|'error'} | null>(null);
  
  // ESTADOS DE BLOQUEO POR VERSIÓN
  const [verificandoVersion, setVerificandoVersion] = useState(true);
  const [requiereActualizar, setRequiereActualizar] = useState(false);
  const [urlTienda, setUrlTienda] = useState('https://play.google.com/store/apps/details?id=com.damelacola.app');
  
  const [usuario, setUsuario] = useState<any>(undefined); 
  
  // ESTADOS DEL ONBOARDING
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [slideActual, setSlideActual] = useState(0);

  const [mensajeCarga, setMensajeCarga] = useState("Conectando..."); 

  // ==========================================
  // VARIABLES DE SEGURIDAD PARA CONTRASEÑA
  // ==========================================
  const tieneSeis = password.length >= 6;
  const tieneMayus = /[A-Z]/.test(password);
  const tieneNum = /[0-9]/.test(password);
  const passwordValida = tieneSeis && tieneMayus && tieneNum;

  // 🔥 CONSULTAR FIREBASE AL ABRIR LA APP 🔥
  useEffect(() => {
    const verificarVersion = async () => {
      try {
        const docRef = doc(db, "Configuracion", "app");
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          const versionMinima = Number(data.version_minima || 0);
          
          if (data.url_playstore) {
            setUrlTienda(data.url_playstore);
          }
          
          const info = await CapacitorApp.getInfo();
          const versionInstalada = Number(info.build || 0); 
          
          console.log(`Versión Mínima Requerida: ${versionMinima} | Versión Instalada: ${versionInstalada}`);

          if (versionInstalada < versionMinima) {
            setRequiereActualizar(true);
          }
        }
      } catch (error) {
        console.error("Error al verificar versión:", error);
      } finally {
        setVerificandoVersion(false);
      }
    };
    verificarVersion();
  }, []);

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
      const solicitarCorreo = httpsCallable(functions, 'enviarCorreoV2');
      await solicitarCorreo({
        idDestino: "CORREO_OLVIDO",
        email: email.toLowerCase().trim(),
        nombre: "Viajero",
        timestamp: Date.now()
      });

      setToast({ 
        texto: "¡Enviado! Revisa tu bandeja de entrada para restablecer tu clave.", 
        tipo: "exito" 
      });
      setTimeout(() => setToast(null), 5000);
    } catch (error: any) {
      console.error("❌ ERROR REAL EN FRONTEND:", error);
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
      alert("Por favor, ingresa tu nombre completo y una contraseña válida para continuar.");
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

        try {
          await addDoc(collection(db, "Notificaciones"), {
            idDestino: "ADMIN_TELEGRAM",
            titulo: "NUEVO REGISTRO 👤",
            mensaje: `👤 Usuario: ${nombre.trim()}\n📧 Correo: ${email.toLowerCase().trim()}`,
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            timestamp: Date.now()
          });
        } catch (errorTelegram) {
          console.error("Error al avisar a Telegram:", errorTelegram);
        }

        try {
          const solicitarCorreo = httpsCallable(functions, 'enviarCorreoV2');
          await solicitarCorreo({
            idDestino: "CORREO_VERIFICACION", 
            email: email.toLowerCase().trim(),
            nombre: nombre.trim(),
            timestamp: Date.now()
          });
        } catch (errorCorreo) {
          console.error("Error al pedir el correo a la función V2:", errorCorreo);
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

  // 🔥 NUEVOS COLORES PARA LAS IMÁGENES DE INTRODUCCIÓN (ONBOARDING) 🔥
  const slides = [
    {
      icono: <Car size={80} className="text-[#063971] mb-6" />,
      titulo: `¡Hola, ${nombre.split(' ')[0] || 'Viajero'}!`,
      texto: "Bienvenido a dame la cola, la comunidad donde conectamos a personas para compartir viajes de forma inteligente y segura."
    },
    {
      icono: <ShieldCheck size={80} className="text-[#10B981] mb-6" />,
      titulo: "Seguridad Primero",
      texto: "Nuestra prioridad es tu tranquilidad. Verificamos la identidad de cada usuario, licencia y vehículo para que cada cola sea 100% segura."
    },
    {
      icono: <Leaf size={80} className="text-emerald-500 mb-6" />,
      titulo: "Menos Emisiones, Más Vida",
      texto: "Al compartir el carro y llenar asientos vacíos, estás ayudando directamente a reducir toneladas de CO2 en nuestra ciudad. ¡Viaja verde!"
    },
    {
      icono: <MapPin size={80} className="text-[#063971] mb-6" />,
      titulo: "¡Todo listo para arrancar!",
      texto: "En el siguiente paso, te pediremos acceso a tu GPS para poder conectar tu ubicación con las mejores rutas en tiempo real."
    }
  ];

  // MURO DE CONTENCIÓN: SI LA APP ES VIEJA
  if (requiereActualizar) {
    return (
      <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="bg-[#063971]/5 w-24 h-24 rounded-full flex items-center justify-center mb-6 border border-[#063971]/10">
          <RefreshCcw size={40} className="text-[#063971] animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-3xl font-black italic text-[#1F2937] uppercase tracking-tighter leading-none mb-4">
          Actualización<br />Obligatoria
        </h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] max-w-xs mb-10 leading-relaxed border border-slate-100 bg-slate-50 p-4 rounded-2xl">
          Hemos mejorado la seguridad del sistema y el flujo de los viajes. Para seguir pidiendo o dando colas, debes instalar la última versión.
        </p>
        <button 
          onClick={() => window.open(urlTienda, '_system')}
          className="w-full max-w-xs bg-[#063971] hover:bg-blue-800 text-white rounded-2xl p-5 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#063971]/30 active:scale-95 transition-all"
        >
          Ir a Play Store
        </button>
      </div>
    );
  }

  // PANTALLA DE CARGA (SPLASH SCREEN)
  if (usuario === undefined || verificandoVersion) {
    return (
      <div className="flex flex-col justify-between items-center min-h-screen bg-white font-sans relative overflow-hidden pt-32 pb-12">
        
        {/* TEXTO SUPERIOR */}
        <div className="flex flex-col items-center">
          <h1 className="text-[34px] font-black leading-[1.1] text-center tracking-tight text-[#063971] mb-12">
            Tu cola,<br/>con confianza.
          </h1>

          {/* BARRA DE CARGA Y TEXTO */}
          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden relative mb-4">
            <div className="absolute top-0 left-0 h-full w-1/2 bg-[#063971] rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>

          <p className="text-[12px] font-black lowercase tracking-widest text-[#063971]">
            {mensajeCarga}
          </p>
        </div>

        {/* LOGO INFERIOR (AQUÍ VA TU IMAGEN PNG) */}
        <div className="mt-auto">
           {/* 👇 PON TU IMAGEN EN LA CARPETA 'public' Y CAMBIA EL SRC AQUÍ 👇 */}
           <img 
             src="/logo.png" /* <- Cambia 'logo.png' por el nombre real de tu archivo */
             alt="Dame la Cola"
             className="h-16 object-contain"
             onError={(e) => {
               // Si no encuentra la imagen por error de ruta, mostrará un diseño de emergencia
               e.currentTarget.style.display = 'none';
               document.getElementById('logo-fallback').style.display = 'flex';
             }}
           />
           
           {/* Fallback de emergencia por si la ruta de la imagen falla */}
           <div id="logo-fallback" className="hidden items-center gap-2">
              <div className="w-12 h-12 rounded-[14px] bg-[#063971] flex items-center justify-center">
                 <span className="font-black text-white text-2xl italic">d</span>
              </div>
              <span className="text-3xl font-black italic text-[#063971] tracking-tighter">dame la cola</span>
           </div>
        </div>

        {/* Animación de la barra */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}} />
      </div>
    );
  }
  
  // PANTALLA DE ONBOARDING (INTRODUCCIÓN)
  if (usuario && mostrarOnboarding) {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen bg-slate-50 p-8 text-center text-[#1F2937] font-sans animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto">
          <div key={slideActual} className="animate-in slide-in-from-right fade-in duration-500 flex flex-col items-center">
            <div className="bg-white p-8 rounded-full shadow-xl border border-slate-100 mb-8">
              {slides[slideActual].icono}
            </div>
            <h2 className="text-3xl font-black italic mb-4 tracking-tighter">{slides[slideActual].titulo}</h2>
            <p className="text-slate-500 font-medium leading-relaxed">{slides[slideActual].texto}</p>
          </div>
        </div>

        <div className="w-full max-w-sm pb-10">
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slideActual ? 'w-8 bg-[#063971]' : 'w-2 bg-slate-200'}`} />
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
            className="w-full bg-[#063971] hover:bg-blue-800 active:scale-95 transition-all p-5 rounded-2xl font-black tracking-widest uppercase text-sm text-white shadow-lg shadow-[#063971]/30 flex items-center justify-center gap-2"
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

  // PANTALLA DE LOGIN / REGISTRO
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-8 text-center text-[#1F2937] font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#063971]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-[#063971] w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-[#063971]/30 transform -skew-x-6 border-b-4 border-[#031E3F] mt-8">
        <span className="text-5xl font-black italic text-white">D</span>
      </div>
      
      <h1 className="text-4xl font-black italic mb-2 tracking-tighter">DameLaCola</h1>
      
      {!esRegistro && <p className="text-[#063971] font-bold tracking-[3px] text-[10px] mb-8 uppercase italic">LA FORMA MÁS SEGURA DE PEDIR LA COLA</p>}
      {esRegistro && <p className="text-slate-500 text-xs mb-8 font-bold">Crea tu cuenta en segundos</p>}

      <form onSubmit={manejarAutenticacion} className="w-full max-w-xs space-y-4 animate-in fade-in duration-300">
        
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#063971]/50 font-bold text-sm text-[#1F2937] placeholder:text-slate-400 transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          disabled={cargando}
          required
        />

        {esRegistro && (
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#063971]/50 font-bold text-sm text-[#1F2937] placeholder:text-slate-400 transition-all animate-in slide-in-from-top-2"
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
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#063971]/50 font-bold text-sm text-[#1F2937] placeholder:text-slate-400 transition-all pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            disabled={cargando}
            required
          />
          
          <button
            type="button"
            onClick={() => setVerPassword(!verPassword)}
            className="absolute right-4 top-[18px] text-slate-400 hover:text-[#063971] transition-colors"
          >
            {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

          {esRegistro && (
            <div className="text-left mt-3 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors ${tieneSeis ? 'text-[#10B981]' : 'text-slate-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tieneSeis ? 'bg-[#10B981]/20' : 'bg-slate-200'}`}>
                  {tieneSeis && <Check size={10} className="text-[#10B981]" />}
                </div>
                Mínimo 6 caracteres
              </p>
              <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors ${tieneMayus ? 'text-[#10B981]' : 'text-slate-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tieneMayus ? 'bg-[#10B981]/20' : 'bg-slate-200'}`}>
                  {tieneMayus && <Check size={10} className="text-[#10B981]" />}
                </div>
                Al menos una Mayúscula
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${tieneNum ? 'text-[#10B981]' : 'text-slate-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tieneNum ? 'bg-[#10B981]/20' : 'bg-slate-200'}`}>
                  {tieneNum && <Check size={10} className="text-[#10B981]" />}
                </div>
                Al menos un Número
              </p>
            </div>
          )}
        </div>
        
        <button 
          disabled={cargando || (esRegistro && !passwordValida)}
          className="w-full bg-[#063971] hover:bg-blue-800 active:scale-95 transition-all p-5 rounded-2xl font-black tracking-widest uppercase text-sm text-white shadow-lg shadow-[#063971]/30 disabled:opacity-50 mt-4"
        >
          {cargando ? "PROCESANDO..." : (esRegistro ? "Crear Cuenta" : "Entrar a la App")}
        </button>
      </form>

      {/* BOTÓN DE OLVIDÉ MI CONTRASEÑA */}
      {!esRegistro && (
        <button 
          onClick={manejarOlvidoClave}
          className="mt-6 text-[10px] font-black uppercase tracking-[2px] text-slate-500 hover:text-[#063971] transition-colors italic"
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}

      <button 
        onClick={() => {
          setEsRegistro(!esRegistro);
          setPassword(''); 
        }} 
        className="mt-4 text-slate-400 text-xs font-bold underline hover:text-[#063971] transition-colors"
      >
        {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
      </button>

      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-6 py-4 rounded-[25px] shadow-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-[#1F2937]' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? (
              <ShieldCheck size={20} className="text-[#10B981] shrink-0" />
            ) : (
              <AlertTriangle size={20} className="shrink-0" />
            )}
            <span className="leading-relaxed">{toast.texto}</span>
          </div>
        </div>
      )}
    </div>
  );
}
