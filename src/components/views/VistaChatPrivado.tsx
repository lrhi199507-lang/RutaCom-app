import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../firebaseConfig"; 
import { collection, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, addDoc, getDoc } from "firebase/firestore";
import { ChevronLeft, Send, User, ShieldCheck, Info, AlertTriangle, Lock, Map, Zap, CreditCard, Car, LifeBuoy, Copy, X } from 'lucide-react';

const IconoWhatsApp = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.38c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.333.158 11.892c0 2.097.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.714 1.447h.005c6.559 0 11.896-5.333 11.893-11.893a11.821 11.821 0 00-3.484-8.413z"/>
  </svg>
);

export const VistaChatPrivado = ({ chat, userData, onRegresar, onVerViaje }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const [viajeActual, setViajeActual] = useState(null); 
  const scrollRef = useRef(null);

  const [toast, setToast] = useState(null); 
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [descripcionReporte, setDescripcionReporte] = useState("");
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  const esAdmin = userData?.rol === 'admin';
  const isSoporte = chat.esSoporte;
  const chatIdReal = isSoporte ? (esAdmin ? chat.id : `soporte_${userData.id}`) : chat.id;

  const soyConductor = !isSoporte && chat.uidConductor === userData.id;
  const idOtroUsuario = soyConductor ? chat.uidPasajero : chat.uidConductor;
  
  const nombreContacto = isSoporte ? (esAdmin ? (chat.nombrePasajero || "Usuario") : "Soporte Oficial") : (soyConductor ? chat.nombrePasajero : chat.nombreConductor);
  const fotoContacto = isSoporte ? null : (soyConductor ? chat.fotoPasajero : chat.fotoConductor);

  const sugerenciasPasajero = ["¡Hola! ¿Aún tienes cupo disponible?", "¿Cuál es el punto exacto?", "Llevo equipaje, ¿hay problema?"];
  const sugerenciasChofer = ["¡Hola! Sí, aún tengo cupo.", "Estoy confirmando los pasajeros.", "El punto de encuentro es el de la app."];
  const sugerenciasNormales = isSoporte ? [] : (soyConductor ? sugerenciasChofer : sugerenciasPasajero);

  const arregloParticipantes = isSoporte ? [userData.id, "admin"] : [chat.uidPasajero, chat.uidConductor];

  useEffect(() => {
    if (isSoporte || !chat.idViaje) return;
    const unsubViaje = onSnapshot(doc(db, "Viajes", chat.idViaje), (docSnap) => {
      if (docSnap.exists()) setViajeActual(docSnap.data());
    });
    return () => unsubViaje();
  }, [chat.idViaje, isSoporte]);

  // INICIALIZACIÓN DEL CHAT
  useEffect(() => {
    if (!chatIdReal) return;
    
    let unsub = () => {};
    let isMounted = true;

    const inicializarChat = async () => {
      try {
        if (isSoporte && !esAdmin) {
          const chatRef = doc(db, "Chats", chatIdReal);
          const chatSnap = await getDoc(chatRef);

          if (!chatSnap.exists()) {
            const welcomeText = `¡Hola ${userData.nombre}! Soy el asistente inteligente de Dame la cola 🤖. Toca una de las opciones de abajo para ayudarte al instante, o pide hablar con un asesor humano.`;
            
            await setDoc(chatRef, {
              ultimoMensaje: welcomeText,
              ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              mensajesSinLeer: 0, // 🔥 CORRECCIÓN: 0 porque lo estás viendo en vivo
              remitenteUltimoMensaje: 'admin',
              timestamp: Date.now(),
              participantes: arregloParticipantes,
              esSoporte: true,
              uidPasajero: userData.id,
              nombrePasajero: userData.nombre,
              ruta: "Soporte Técnico"
            });

            const botMsgRef = doc(collection(db, `Chats/${chatIdReal}/Mensajes`));
            await setDoc(botMsgRef, {
              texto: welcomeText,
              uidRemitente: 'admin',
              timestamp: serverTimestamp(),
              participantes: arregloParticipantes
            });
          }
        }

        if (!isMounted) return;

        const q = query(collection(db, `Chats/${chatIdReal}/Mensajes`), orderBy("timestamp", "asc"));

        unsub = onSnapshot(q, (snap) => {
          const historialMensajes = snap.docs.map(d => ({ 
            id: d.id, 
            ...d.data({ serverTimestamps: "estimate" }) 
          }));
          setMensajes(historialMensajes);
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

      } catch (error) {
        console.error("Error al inicializar el chat:", error);
      }
    };

    inicializarChat();

    return () => {
      isMounted = false;
      unsub();
    };
  }, [chatIdReal]);

  // 🔥 NUEVO: ESCÁNER EN VIVO PARA LIMPIAR NOTIFICACIONES AL INSTANTE 🔥
  useEffect(() => {
    if (!chatIdReal || mensajes.length === 0) return;
    
    // Revisamos el último mensaje de la lista
    const ultimoMsg = mensajes[mensajes.length - 1];
    
    // Si el último mensaje NO es mío, significa que la otra persona (o el bot) me escribió
    // Como tengo la pantalla abierta, fuerzo el contador a 0 instantáneamente.
    if (ultimoMsg.uidRemitente !== userData.id) {
      setDoc(doc(db, "Chats", chatIdReal), { 
        mensajesSinLeer: 0,
        participantes: arregloParticipantes 
      }, { merge: true }).catch(err => console.log(err));
    }
  }, [mensajes, chatIdReal, userData.id]);

  const ejecutarComandoBot = async (tipo) => {
    let respuestaBot = "";
    let textoUsuario = "";

    switch(tipo) {
      case 'recarga':
        textoUsuario = "Dudas sobre Saldo/Recargas";
        respuestaBot = "💳 Para recargar: Ve a 'Mi Billetera', selecciona Pago Móvil o Binance Pay, realiza la transferencia y sube tu capture. \n\n💰 Para retirar: Ve a Billetera > Retirar y coloca tus datos.\n\n⚠️ NOTA IMPORTANTE:\n1. Retiro mínimo: $10.\n2. Los retiros se procesan todos los dias de 7:00 PM a 11:00 PM.";
        break;
      case 'publicar':
        textoUsuario = "¿Cómo publico un viaje?";
        respuestaBot = "🚙 Toca el botón central ➕ (Publicar) en la barra inferior de la app. Selecciona ruta, fecha, y precio. Recuerda: debes tener tu Vehículo y Cédula verificados en 'Mi Perfil'.";
        break;
      case 'verificar':
        textoUsuario = "Problemas con Verificación / KYC";
        respuestaBot = "✅ Para verificar tu identidad o auto, ve a 'Mi Perfil'. Sube fotos claras de tu Cédula o Vehículo. Las aprobamos en un plazo de 1 a 12 horas hábiles.";
        break;
      case 'reportar':
        textoUsuario = "¿Cómo reportar a un usuario?";
        respuestaBot = "🛑 Para reportar a alguien: Abre el chat privado con ese usuario y toca el ícono del triángulo de advertencia (⚠️) arriba a la derecha. Revisaremos el caso en menos de 24h.";
        break;
      case 'emergencia':
        textoUsuario = "🚨 Me quedé varado / Ayuda";
        respuestaBot = "⚠️ Líneas de Emergencia Sugeridas:\n\n📞 Nacionales: 911\n📞 Vialidad: 0800-VIALIDAD\n\n(Pronto directorio de Grúas y Mecánicos).";
        break;
      case 'humano':
        await enviar(null, "Hola, necesito hablar con un asesor humano para resolver un problema complejo.");
        
        const humanoRef = doc(collection(db, `Chats/${chatIdReal}/Mensajes`));
        await setDoc(humanoRef, {
          texto: "⏳ ¡Entendido! Un asesor humano ha sido notificado y leerá tu caso pronto. Mientras tanto, por favor escribe aquí abajo todos los detalles de tu problema para agilizar la atención.",
          uidRemitente: 'admin',
          timestamp: serverTimestamp(),
          participantes: arregloParticipantes
        });

        await setDoc(doc(db, "Chats", chatIdReal), {
            ultimoMensaje: "⏳ ¡Entendido! Un asesor humano ha sido notificado...",
            ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mensajesSinLeer: 0, // 🔥 CORRECCIÓN: 0 porque estás en la pantalla
            remitenteUltimoMensaje: 'admin',
            timestamp: Date.now(),
            participantes: arregloParticipantes,
            ...(isSoporte && !esAdmin ? { esSoporte: true, uidPasajero: userData.id, nombrePasajero: userData.nombre, ruta: "Soporte Técnico" } : {})
        }, { merge: true });
        
        return; 
    }

    try {
      const userMsgRef = doc(collection(db, `Chats/${chatIdReal}/Mensajes`));
      await setDoc(userMsgRef, {
        texto: textoUsuario,
        uidRemitente: userData.id,
        timestamp: serverTimestamp(), 
        participantes: arregloParticipantes
      });

      await setDoc(doc(db, "Chats", chatIdReal), {
        ultimoMensaje: textoUsuario,
        ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        remitenteUltimoMensaje: userData.id,
        timestamp: Date.now(),
        participantes: arregloParticipantes,
        ...(isSoporte && !esAdmin ? { esSoporte: true, uidPasajero: userData.id, nombrePasajero: userData.nombre, ruta: "Soporte Técnico" } : {})
      }, { merge: true });
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const botMsgRef = doc(collection(db, `Chats/${chatIdReal}/Mensajes`));
      await setDoc(botMsgRef, {
        texto: respuestaBot,
        uidRemitente: 'admin',
        timestamp: serverTimestamp(), 
        participantes: arregloParticipantes
      });

      await setDoc(doc(db, "Chats", chatIdReal), {
        ultimoMensaje: respuestaBot,
        ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mensajesSinLeer: 0, // 🔥 CORRECCIÓN: 0 porque estás en la pantalla
        remitenteUltimoMensaje: 'admin',
        timestamp: Date.now(),
        participantes: arregloParticipantes,
        ...(isSoporte && !esAdmin ? { esSoporte: true, uidPasajero: userData.id, nombrePasajero: userData.nombre, ruta: "Soporte Técnico" } : {})
      }, { merge: true });

    } catch (error) {
      console.error("Error guardando comandos del bot", error);
      alert("Error en el bot: " + error.message); 
    }
  };

  const enviar = async (e, textoSugerido = null) => {
    if (e) e.preventDefault();
    
    const texto = textoSugerido || nuevoMsg.trim();
    if (!texto) return;

    try {
      setNuevoMsg(""); 
      
      const nuevoMsgRef = doc(collection(db, `Chats/${chatIdReal}/Mensajes`));
      await setDoc(nuevoMsgRef, {
        texto: texto,
        uidRemitente: userData.id,
        timestamp: serverTimestamp(), 
        participantes: arregloParticipantes 
      });
      
      await setDoc(doc(db, "Chats", chatIdReal), {
        ultimoMensaje: texto,
        ultimaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mensajesSinLeer: 1, // 🔥 Aquí sí debe ser 1, porque la OTRA persona no está en el chat
        remitenteUltimoMensaje: userData.id,
        timestamp: Date.now(),
        participantes: arregloParticipantes,
        ...(isSoporte && !esAdmin ? {
            esSoporte: true,
            uidPasajero: userData.id,
            nombrePasajero: userData.nombre,
            ruta: "Soporte Técnico"
        } : {})
      }, { merge: true });

      let idDestinoNotif = null;
      if (!isSoporte) {
        idDestinoNotif = idOtroUsuario; 
      } else if (isSoporte && esAdmin) {
        idDestinoNotif = chat.uidPasajero; 
      }

      if (idDestinoNotif) {
        await addDoc(collection(db, "Notificaciones"), {
          idDestino: idDestinoNotif,
          idEmisor: userData.id,
          titulo: isSoporte ? "Soporte Dame la cola" : `Mensaje de ${userData.nombre}`,
          mensaje: texto,
          tipo: "chat",
          idReferencia: chatIdReal,
          leido: false,
          fecha: serverTimestamp()
        });
      }

    } catch (error) {
      console.error("Error al enviar:", error);
      alert("Error al enviar: " + error.message); 
    }
  };

  const abrirWhatsApp = () => {
    if (!pasajeroConfirmado) {
      setToast({ texto: "🔒 El número se habilita al confirmar", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const numeroDestino = soyConductor ? chat.telefonoPasajero : chat.telefonoConductor;
    if (!numeroDestino) {
      setToast({ texto: "El usuario no registró su número", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    let numeroLimpio = numeroDestino.replace(/\D/g, ''); 
    if (numeroLimpio.startsWith('0')) numeroLimpio = '58' + numeroLimpio.substring(1);
    else if (!numeroLimpio.startsWith('58')) numeroLimpio = '58' + numeroLimpio; 
    
    const mensaje = `¡Hola! Te escribo desde Dame la cola por el viaje: ${chat.ruta}.`;
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const manejarVerViaje = () => {
    if (!viajeActual || viajeActual.estado === 'finalizado' || viajeActual.estado === 'cancelado') {
      setToast({ texto: "El viaje ya no está disponible", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (onVerViaje) onVerViaje();
  };

  const manejarReporte = async () => {
    if (!motivoSeleccionado || !descripcionReporte.trim()) return;
    setEnviandoReporte(true);
    
    try {
      await addDoc(collection(db, "Reportes"), {
        idDenunciante: userData?.id || "Desconocido",
        nombreDenunciante: userData?.nombre || "Usuario",
        rolDenunciante: soyConductor ? 'conductor' : 'pasajero',
        idDenunciado: idOtroUsuario || "Desconocido",
        nombreDenunciado: nombreContacto || "Usuario",
        idViaje: chat.idViaje || "N/A",
        idChat: chatIdReal || "N/A",
        motivo: motivoSeleccionado,
        descripcion: descripcionReporte.trim(),
        estado: 'pendiente',
        accionesTomadas: '',
        fechaCreacion: serverTimestamp(),
      });
      
      setMostrarModalReporte(false); 
      setMotivoSeleccionado("");
      setDescripcionReporte("");
      
      setToast({ texto: "Reporte enviado. Revisaremos el caso.", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error(error);
      setToast({ texto: "Hubo un error al enviar el reporte.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { 
      setEnviandoReporte(false); 
    }
  };
  
  return (
    <div className="fixed inset-0 bg-white z-[120000] flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className={`p-4 border-b flex items-center gap-3 shadow-sm pt-8 ${isSoporte ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <button onClick={onRegresar} className={`p-2 -ml-2 rounded-full transition-colors ${isSoporte ? 'text-white hover:bg-slate-800' : 'text-blue-600 hover:bg-slate-100'}`}>
          <ChevronLeft size={28} />
        </button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden shrink-0 ${isSoporte ? 'bg-blue-600 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
          {fotoContacto ? <img src={fotoContacto} className="w-full h-full object-cover"/> : (isSoporte ? <Zap size={20} /> : <User size={20} />)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-black italic uppercase text-sm tracking-tighter truncate flex items-center gap-1 ${isSoporte ? 'text-white' : 'text-slate-800'}`}>
            {nombreContacto} {isSoporte ? <ShieldCheck size={14} className="text-blue-400" /> : <ShieldCheck size={14} className="text-green-500" />}
          </h3>
          <p className={`text-[10px] font-bold truncate uppercase tracking-widest ${isSoporte ? 'text-blue-300' : 'text-slate-400'}`}>
            {isSoporte ? (esAdmin ? 'Usuario pidiendo ayuda' : 'Asistente 24/7') : chat.ruta}
          </p>
        </div>

        {!isSoporte && (
          <div className="flex items-center gap-1 pr-1">
            {onVerViaje && (
              <button onClick={manejarVerViaje} className="px-3 py-1.5 mr-1 bg-blue-600 text-white shadow-md shadow-blue-600/30 rounded-full transition-all active:scale-95 flex items-center gap-1.5">
                <Map size={14} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-widest">Viaje</span>
              </button>
            )}
            <button onClick={abrirWhatsApp} type="button" className={`p-2 rounded-full transition-all active:scale-90 ${pasajeroConfirmado ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-50'}`}>
              {pasajeroConfirmado ? <IconoWhatsApp size={22} className="text-green-500" /> : <Lock size={20} className="text-slate-300" />}
            </button>
            <button onClick={() => setMostrarModalReporte(true)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90">
              <AlertTriangle size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* CUERPO DE MENSAJES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="flex justify-center mb-6 mt-2">
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
            <Info size={12} /> {isSoporte ? (esAdmin ? 'Respondiendo como Soporte' : 'Conexión Segura con Soporte') : 'Inicio del chat seguro'}
          </div>
        </div>

        {mensajes.map((m) => {
          const soyYo = m.uidRemitente === userData.id;
          const esBot = m.uidRemitente === 'admin';
          
          let horaStr = "Enviando...";
          if (m.timestamp) {
            const fecha = m.timestamp.toDate ? m.timestamp.toDate() : new Date(m.timestamp);
            horaStr = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          
          return (
            <div key={m.id} className={`flex w-full mb-2 ${soyYo ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex flex-col shadow-sm ${
                soyYo 
                ? 'bg-blue-600 text-white rounded-[20px] rounded-tr-none' 
                : esBot 
                  ? 'bg-slate-800 text-white border border-slate-700 rounded-[20px] rounded-tl-none'
                  : 'bg-white text-slate-700 border border-slate-200 rounded-[20px] rounded-tl-none'
              }`}>
                <span className="p-3 px-4 pb-1 text-sm font-bold whitespace-pre-wrap">{m.texto}</span>
                <span className={`px-4 pb-2 text-[9px] text-right font-black tracking-wider ${soyYo ? 'text-blue-300' : 'text-slate-400'}`}>
                  {horaStr}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* ZONA INFERIOR */}
      <div className="bg-white border-t border-slate-100 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        
        {isSoporte && !esAdmin ? (
          <div className="p-3 grid grid-cols-2 gap-2 bg-slate-50 border-b border-slate-100">
            <button onClick={() => ejecutarComandoBot('recarga')} className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-[15px] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider active:scale-95 shadow-sm hover:border-blue-300">
              <CreditCard size={14} className="text-blue-500" /> Saldos / Pagos
            </button>
            <button onClick={() => ejecutarComandoBot('publicar')} className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-[15px] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider active:scale-95 shadow-sm hover:border-emerald-400">
              <Car size={14} className="text-emerald-500" /> Publicar Viaje
            </button>
            <button onClick={() => ejecutarComandoBot('verificar')} className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-[15px] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider active:scale-95 shadow-sm hover:border-indigo-400">
              <ShieldCheck size={14} className="text-indigo-500" /> Verificaciones
            </button>
            <button onClick={() => ejecutarComandoBot('reportar')} className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-[15px] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider active:scale-95 shadow-sm hover:border-orange-400">
              <AlertTriangle size={14} className="text-orange-500" /> Reportar
            </button>
            <button onClick={() => ejecutarComandoBot('emergencia')} className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-[15px] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider active:scale-95 shadow-sm">
              <AlertTriangle size={14} /> Emergencia / Grúa
            </button>
            <button onClick={() => ejecutarComandoBot('humano')} className="bg-slate-900 text-white p-2.5 rounded-[15px] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider active:scale-95 shadow-md shadow-slate-900/20">
              <LifeBuoy size={14} className="text-blue-400" /> Asesor Humano
            </button>
          </div>
        ) : (
          mensajes.length < 4 && sugerenciasNormales.length > 0 && (
            <div className="flex overflow-x-auto gap-2 px-4 py-3 no-scrollbar border-b border-slate-50">
              {sugerenciasNormales.map((sug, idx) => (
                <button 
                  key={idx} type="button" onClick={() => enviar(null, sug)}
                  className="whitespace-nowrap bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>
          )
        )}

        <form onSubmit={enviar} className="p-4 flex gap-2 items-center">
          <input 
            type="text" 
            value={nuevoMsg}
            onChange={(e) => setNuevoMsg(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-slate-100 p-4 px-6 rounded-full text-xs font-bold outline-none border-none text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button 
            type="submit"
            className="bg-blue-600 w-12 h-12 flex items-center justify-center rounded-full text-white shadow-lg active:scale-90 transition-transform disabled:bg-slate-300"
            disabled={!nuevoMsg.trim()}
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>

      {/* TOAST FLOTANTE */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] w-max max-w-[95vw] animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-slate-900' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? <ShieldCheck size={18} className="text-green-400 shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
            <span className="truncate whitespace-nowrap">{toast.texto}</span>
          </div>
        </div>
      )}

      {/* MODAL DE REPORTE */}
      {mostrarModalReporte && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setMostrarModalReporte(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle size={24} strokeWidth={2.5} />
              <h3 className="font-black italic uppercase tracking-tighter">Reportar Usuario</h3>
            </div>
            
            <p className="text-xs font-medium text-slate-500 mb-4">
              ¿Por qué estás reportando a <span className="font-bold text-slate-800">{nombreContacto}</span>? Tu reporte nos ayuda a mantener la comunidad segura.
            </p>

            <select
              value={motivoSeleccionado}
              onChange={(e) => setMotivoSeleccionado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[15px] p-3 text-sm font-bold text-slate-700 outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all mb-3 appearance-none"
            >
              <option value="" disabled>Selecciona el motivo principal...</option>
              <option value="Falta de respeto o acoso">Falta de respeto o acoso</option>
              <option value="Conducción imprudente">Conducción imprudente</option>
              <option value="Vehículo o persona no coincide">Vehículo o persona no coincide</option>
              <option value="Problema con el pago">Problema con el pago</option>
              <option value="No se presentó al viaje">No se presentó al viaje</option>
              <option value="Otro">Otro motivo</option>
            </select>

            <textarea
              value={descripcionReporte}
              onChange={(e) => setDescripcionReporte(e.target.value)}
              placeholder="Explica brevemente los detalles de lo sucedido..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[15px] p-3 text-sm font-medium outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all resize-none h-24 mb-4"
            ></textarea>

            <button
              onClick={manejarReporte}
              disabled={!motivoSeleccionado || !descripcionReporte.trim() || enviandoReporte}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-black italic uppercase tracking-widest text-xs py-4 rounded-full shadow-lg transition-all active:scale-95"
            >
              {enviandoReporte ? "Enviando..." : "Enviar Reporte"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
