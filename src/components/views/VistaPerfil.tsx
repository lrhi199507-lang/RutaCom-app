import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection, increment, getDoc, query, where, orderBy, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  ShieldCheck, RefreshCw, AlertCircle, AlertTriangle,
  Car, Palette, Hash, Gauge, LogOut, Camera, X, DollarSign, ArrowUpRight, 
  TrendingUp, History, Landmark, Settings, Headset, MessageCircle, Image as ImageIcon, Upload // 🔥 Agregamos Upload
} from 'lucide-react';

const auth = getAuth();

export const VistaPerfil = ({ userData, setUserData, handleLogout, pestañaActiva, setPestañaActiva, onAbrirChat }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const [confirmacionCedula, setConfirmacionCedula] = useState(false); 
  
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fotoDocTemporal, setFotoDocTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [pasoDocumento, setPasoDocumento] = useState<{tipo: string, activa: boolean, reglas?: string}>({tipo: 'cedula', activa: false});
  
  const [usuariosAdmin, setUsuariosAdmin] = useState<any[]>([]);
  const [reportesAdmin, setReportesAdmin] = useState<any[]>([]);
  const [pagosAdmin, setPagosAdmin] = useState<any[]>([]); 
  const [transaccionesAdmin, setTransaccionesAdmin] = useState<any[]>([]); 
  const [chatsSoporteAdmin, setChatsSoporteAdmin] = useState<any[]>([]); 
  
  const [subPestañaAdmin, setSubPestañaAdmin] = useState<'pendientes' | 'aprobados' | 'reportes' | 'pagos' | 'historial' | 'soporte'>('pendientes');
  const [usuarioExpandidoAdmin, setUsuarioExpandidoAdmin] = useState<string | null>(null);
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);
  
  const [tasaActual, setTasaActual] = useState(0); 
  const [balanceApp, setBalanceApp] = useState(0);
  const [bancoAdmin, setBancoAdmin] = useState({ banco: "", telefono: "", cedula: "" });
  
  const [toast, setToast] = useState<{texto: string, tipo: 'exito'|'error'} | null>(null);

  useEffect(() => {
    let listenerHandle: any = null;

    const configurarListener = async () => {
      listenerHandle = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive && auth.currentUser) {
          try {
            await auth.currentUser.reload();
            setUserData((prev) => prev ? { ...prev } : prev);
          } catch (error) {
            console.error("Error recargando auth:", error);
          }
        }
      });
    };

    configurarListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);
  
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  
  const view = pestañaActiva || 'publico';
  const ADMIN_EMAIL = "damelacola2026@gmail.com";
  const esAdmin = auth.currentUser?.email ? auth.currentUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() : false;

  const viajesCond = userData.viajesRealizados || 0;
  const viajesPas = userData.viajesComoPasajero || 0;
  const totalTrayectoria = viajesCond + viajesPas;
  
  const obtenerRango = () => {
    if (totalTrayectoria >= 50) return "LEYENDA";
    if (totalTrayectoria >= 20) return "ORO";
    if (totalTrayectoria >= 10) return "PLATA";
    return "NOVATO";
  };

  const obtenerColorRango = (rango: string) => {
    switch(rango) {
      case "PLATA": return "bg-slate-400";
      case "ORO": return "bg-yellow-500";
      case "LEYENDA": return "bg-slate-900";
      default: return "bg-blue-600";
    }
  };

  const calcularSiguienteNivel = () => {
    const total = totalTrayectoria;
    if (total < 10) return { meta: 10, faltan: 10 - total, nombre: "PLATA" };
    if (total < 20) return { meta: 20, faltan: 20 - total, nombre: "ORO" };
    if (total < 50) return { meta: 50, faltan: 50 - total, nombre: "LEYENDA" };
    return { meta: total, faltan: 0, nombre: "MÁXIMO" };
  };

  const rangoActual = obtenerRango();
  const proximoNivel = calcularSiguienteNivel();
  const porcentajeNivel = Math.min((totalTrayectoria / proximoNivel.meta) * 100, 100);

  const puntosSeguridad = [
    !!userData.kycVerificado, !!userData.licenciaVerificada, !!userData.circulacionVerificada,
    !!userData.rcvVerificado, !!userData.selfieVerificada, !!userData.fotoFrontalVerificada,
    !!userData.fotoTraseraVerificada, !!userData.fotoLatIzqVerificada, !!userData.fotoLatDerVerificada
  ];
  const porcentajeConfianza = (puntosSeguridad.filter(Boolean).length / puntosSeguridad.length) * 100;

  const seleccionarImagen = async (source: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 25, width: 600, resultType: CameraResultType.DataUrl, source });
      if (image.dataUrl) setFotoTemporal(image.dataUrl);
    } catch (e) { console.log("Cancelado"); }
  };

  const subirFotoConfirmada = async () => {
    if (!fotoTemporal) return;
    setCargando(true);
    const userId = auth.currentUser?.uid || userData.id;

    try {
      const nombreArchivo = `perfiles/${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, nombreArchivo);

      await uploadString(storageRef, fotoTemporal, 'data_url');
      const urlDescarga = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "usuarios", userId), { fotoPerfil: urlDescarga });
      
      const qViajes = query(collection(db, "Viajes"), where("uidConductor", "==", userId));
      const snapViajes = await getDocs(qViajes);
      const promesasViajes = snapViajes.docs.map(docViaje => 
        updateDoc(doc(db, "Viajes", docViaje.id), { fotoPerfil: urlDescarga })
      );
      await Promise.all(promesasViajes);

      setUserData({ ...userData, fotoPerfil: urlDescarga });

      setPasoFoto(false); 
      setFotoTemporal(null);
      setToast({ texto: "Foto de perfil actualizada en tus viajes", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { 
      console.error("Error subiendo foto:", e); 
      setToast({ texto: "Error al subir foto", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setCargando(false);
    }
  };
  
  const togglePreferencia = async (campo: string, nuevoEstado: boolean) => {
    try {
      const uid = auth.currentUser?.uid || userData.id;
      await updateDoc(doc(db, "usuarios", uid), { [campo]: nuevoEstado });
      setUserData({ ...userData, [campo]: nuevoEstado });
    } catch (e) { console.log("Error al guardar preferencia:", e); }
  };
  
  const guardarCambios = async (forzar = false) => {
    if (!tipoEdicion || !nuevoValor) return;

    if (tipoEdicion.id === 'cedulaNumero' && forzar !== true) {
      setConfirmacionCedula(true);
      return;
    }

    setConfirmacionCedula(false);
    setModalVisible(false); 
    setCargando(true);
    try {
      const uid = auth.currentUser?.uid || userData.id;
      const esVehiculo = ['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id);
      const field = esVehiculo ? `vehiculo.${tipoEdicion.id}` : tipoEdicion.id;
      const valorFinal = esVehiculo ? nuevoValor.toUpperCase() : nuevoValor;
      
      await updateDoc(doc(db, "usuarios", uid), { [field]: valorFinal });
      
      if (esVehiculo) {
        setUserData({ ...userData, vehiculo: { ...userData.vehiculo, [tipoEdicion.id]: valorFinal } });
      } else {
        setUserData({ ...userData, [tipoEdicion.id]: valorFinal });
      }
    } catch (e) { 
      console.log("Error:", e); 
      setToast({ texto: "Error al guardar los cambios.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { 
      setCargando(false); 
    }
  };
  
    // 🔥 LÓGICA DE CAPTURA BLINDADA Y DIRECTA 🔥
  const capturarDocumento = async (origen: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({ 
        quality: 60, 
        width: 1000, 
        resultType: CameraResultType.DataUrl, 
        source: origen, // Ahora recibe explícitamente Cámara o Fotos
        saveToGallery: false 
      });
      if (image.dataUrl) setFotoDocTemporal(image.dataUrl);
    } catch (e) { console.log("Captura cancelada"); }
  };
  
  const subirDocumentoFinal = async () => {
    if (!fotoDocTemporal) return;
    setCargando(true);
    const userId = userData.uid || userData.id;

    try {
      const userRef = doc(db, "usuarios", userId);
      const fieldMap: any = {
        cedula: { f: 'kycFoto', v: 'kycVerificado' }, selfie: { f: 'selfieFoto', v: 'selfieVerificada' },
        licencia: { f: 'licenciaFoto', v: 'licenciaVerificada' }, rcv: { f: 'rcvFoto', v: 'rcvVerificado' },
        fotoFrontal: { f: 'fotoFrontal', v: 'fotoFrontalVerificada' }, fotoTrasera: { f: 'fotoTrasera', v: 'fotoTraseraVerificada' },
        fotoLatIzq: { f: 'fotoLatIzq', v: 'fotoLatIzqVerificada' }, fotoLatDer: { f: 'fotoLatDer', v: 'fotoLatDerVerificada' }
      };
      const { f, v } = fieldMap[pasoDocumento.tipo];

      const nombreArchivo = `documentos/${userId}/${f}_${Date.now()}.jpg`;
      const storageRef = ref(storage, nombreArchivo);

      await uploadString(storageRef, fotoDocTemporal, 'data_url');
      const urlDescarga = await getDownloadURL(storageRef);

      await updateDoc(userRef, { [f]: urlDescarga, [v]: false, estadoRevision: "pendiente" });
      setUserData({ ...userData, [f]: urlDescarga, [v]: false, estadoRevision: "pendiente" });

      try {
        const tipoDocTexto = pasoDocumento.tipo.toUpperCase();
        await addDoc(collection(db, "Notificaciones"), {
          idDestino: "ADMIN_TELEGRAM",
          titulo: "DOCUMENTOS PENDIENTES 🚨",
          mensaje: `El usuario ${userData.nombre || 'Desconocido'} acaba de subir su ${tipoDocTexto}.\n\nEntra al panel de control para aprobar o rechazar la foto.`,
          timestamp: Date.now()
        });
      } catch (errorTelegram) {
        console.error("Error al avisar a Telegram:", errorTelegram);
      }

      setToast({ texto: "Documento enviado para revisión", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
      setFotoDocTemporal(null); 
      setPasoDocumento({ ...pasoDocumento, activa: false });
    } catch (e: any) {
      console.error("Error subiendo documento:", e);
      setToast({ texto: "Error al subir documento.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      setFotoDocTemporal(null); 
      setPasoDocumento({ ...pasoDocumento, activa: false });
    } finally { setCargando(false); }
  };
  
  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const snapUsers = await getDocs(collection(db, "usuarios"));
      setUsuariosAdmin(snapUsers.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const snapReports = await getDocs(collection(db, "Reportes"));
      setReportesAdmin(snapReports.docs.map(d => ({ id: d.id, ...d.data() })));

      const snapPagos = await getDocs(collection(db, "PagosPendientes"));
      setPagosAdmin(snapPagos.docs.map(d => ({ id: d.id, ...d.data() })).filter((p: any) => p.estado === 'pendiente'));

      const qAdmin = query(collection(db, "Transacciones"), where("uid", "==", "ADMIN_APP"), orderBy("fecha", "desc"));
      const snapAdmin = await getDocs(qAdmin);
      setTransaccionesAdmin(snapAdmin.docs.map(d => ({ id: d.id, ...d.data() })));

      const qSoporte = query(collection(db, "Chats"), where("esSoporte", "==", true));
      const snapSoporte = await getDocs(qSoporte);
      setChatsSoporteAdmin(
        snapSoporte.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.ultimaHora || "").localeCompare(a.ultimaHora || ""))
      );

      const docFinanzas = await getDoc(doc(db, "Configuracion", "Finanzas"));
      if (docFinanzas.exists()) {
        const data = docFinanzas.data();
        setTasaActual(data.tasaBCV || 0);
        setBalanceApp(data.gananciasTotales || 0);
        if (data.bancoAdmin) setBancoAdmin(data.bancoAdmin);
      }
    } catch (e) { 
      console.error("Error cargando admin:", e); 
    } finally { 
      setCargando(false); 
    }
  };

  const actualizarTasaBCV = async () => {
    const nueva = prompt("Ingresa la nueva tasa BCV (Usa punto para los decimales):", tasaActual.toString());
    if (!nueva || isNaN(Number(nueva))) return; 
    
    try {
      await updateDoc(doc(db, "Configuracion", "Finanzas"), { tasaBCV: Number(nueva) });
      setTasaActual(Number(nueva));
      setToast({ texto: "Tasa BCV actualizada", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { 
      setToast({ texto: "Error al actualizar tasa", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };
  
  const guardarDatosBancarios = async () => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "Configuracion", "Finanzas"), { bancoAdmin: bancoAdmin });
      setToast({ texto: "Datos de cobro guardados", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ texto: "Error al guardar", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };

  const aprobarPago = async (pago: any) => {
  if(!window.confirm(`¿Aprobar recarga de $${pago.monto} para ${pago.nombre}?`)) return;
  setCargando(true);
  try {
    await updateDoc(doc(db, "usuarios", pago.uid), { saldo: increment(pago.monto) });
    await updateDoc(doc(db, "PagosPendientes", pago.id), { estado: "aprobado", fechaAprobacion: new Date().toISOString() });
    
    await addDoc(collection(db, "Transacciones"), {
      uid: pago.uid, tipo: "ingreso", monto: pago.monto,
      descripcion: "Recarga de saldo aprobada", fecha: new Date().toISOString()
    });

    await addDoc(collection(db, "Notificaciones"), {
      idDestino: pago.uid,
      titulo: "💰 Recarga Exitosa",
      mensaje: `Tu recarga de $${pago.monto} ha sido aprobada y acreditada en tu billetera.`,
      timestamp: Date.now(),
      leido: false,
      tipo: "billetera"
    });

    setPagosAdmin(pagosAdmin.filter(p => p.id !== pago.id));
    setToast({ texto: `¡$${pago.monto} acreditados y notificados!`, tipo: "exito" });
    setTimeout(() => setToast(null), 3000);
  } catch (error) {
    setToast({ texto: "Error al aprobar", tipo: "error" });
    setTimeout(() => setToast(null), 3000);
  } finally { setCargando(false); }
};
  
  const marcarRetiroComoPagado = async (pago: any) => {
  if(!window.confirm(`¿Confirmas que ya transferiste a ${pago.nombre}?`)) return;
  setCargando(true);
  try {
    await updateDoc(doc(db, "PagosPendientes", pago.id), { estado: "aprobado", fechaAprobacion: new Date().toISOString() });
    await updateDoc(doc(db, "usuarios", pago.uid), { saldo: increment(-pago.monto), saldoRetenido: increment(-pago.monto) });

    await addDoc(collection(db, "Transacciones"), {
      uid: pago.uid, tipo: "gasto", monto: pago.monto,
      descripcion: "Retiro de dinero procesado", fecha: new Date().toISOString()
    });

    await addDoc(collection(db, "Notificaciones"), {
      idDestino: pago.uid,
      titulo: "💸 Retiro Completado",
      mensaje: `Tu retiro de $${pago.monto} ha sido procesado. Verifica tu cuenta bancaria.`,
      timestamp: Date.now(),
      leido: false,
      tipo: "billetera"
    });

    setPagosAdmin(pagosAdmin.filter(p => p.id !== pago.id));
    setToast({ texto: "Retiro pagado y usuario notificado", tipo: "exito" });
    setTimeout(() => setToast(null), 3000);
  } catch (error) {
    setToast({ texto: "Error al procesar", tipo: "error" });
    setTimeout(() => setToast(null), 3000);
  } finally { setCargando(false); }
};
  
  const rechazarPago = async (pago: any) => {
  if(!window.confirm(pago.tipo === 'retiro' ? '¿Rechazar retiro y devolver fondos a su Wallet?' : '¿Rechazar recarga?')) return;
  setCargando(true);
  try {
    await updateDoc(doc(db, "PagosPendientes", pago.id), { estado: "rechazado" });
    
    let tituloNotif = "";
    let mensajeNotif = "";

    if (pago.tipo === 'retiro') {
      await updateDoc(doc(db, "usuarios", pago.uid), { saldoRetenido: increment(-pago.monto) });
      await addDoc(collection(db, "Transacciones"), {
        uid: pago.uid, tipo: "ingreso", monto: pago.monto,
        descripcion: "Devolución por retiro rechazado", fecha: new Date().toISOString()
      });
      tituloNotif = "❌ Retiro Rechazado";
      mensajeNotif = `Tu solicitud de retiro por $${pago.monto} fue rechazada. Los fondos han regresado a tu billetera. Verifica tus datos de pago móvil.`;
    } else {
      tituloNotif = "❌ Recarga Rechazada";
      mensajeNotif = `No pudimos validar tu recarga de $${pago.monto}. Por favor, verifica el número de referencia y que el capture sea legible.`;
    }

    await addDoc(collection(db, "Notificaciones"), {
      idDestino: pago.uid,
      titulo: tituloNotif,
      mensaje: mensajeNotif,
      timestamp: Date.now(),
      leido: false,
      tipo: "alerta"
    });

    setPagosAdmin(pagosAdmin.filter(p => p.id !== pago.id));
    setToast({ texto: "Movimiento rechazado y notificado", tipo: "exito" });
    setTimeout(() => setToast(null), 3000);
  } catch (error) {
    setToast({ texto: "Error al rechazar", tipo: "error" });
    setTimeout(() => setToast(null), 3000);
  } finally { setCargando(false); }
};

  const resolverReporte = async (reporteId: string) => {
    if(!window.confirm("¿Marcar este reporte como revisado?")) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, "Reportes", reporteId));
      setReportesAdmin(reportesAdmin.filter(r => r.id !== reporteId));
    } catch (e) { 
      setToast({ texto: "Error al eliminar", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const aprobarUsuario = async (userId: string) => {
  setCargando(true);
  try {
    await updateDoc(doc(db, "usuarios", userId), {
      kycVerificado: true, licenciaVerificada: true, circulacionVerificada: true,
      rcvVerificado: true, fotoFrontalVerificada: true, fotoTraseraVerificada: true,
      fotoLatIzqVerificada: true, fotoLatDerVerificada: true, selfieVerificada: true,
      estadoRevision: "aprobado",
      mensajeAdmin: ""
    });

    await addDoc(collection(db, "Notificaciones"), {
      idDestino: userId, 
      titulo: "✅ ¡Cuenta Verificada!",
      mensaje: "Tus documentos han sido aprobados. Ya puedes empezar a generar ingresos con Dame la cola.",
      timestamp: Date.now(),
      leido: false,
      tipo: "sistema"
    });

    setToast({ texto: "¡Usuario Verificado y Notificado!", tipo: "exito" });
    setTimeout(() => setToast(null), 3000);
    await cargarDatosAdmin();
  } catch (e) { 
    setToast({ texto: "Error de permisos", tipo: "error" });
    setTimeout(() => setToast(null), 3000);
  } finally { setCargando(false); }
};
  
  const rechazarDocumentos = async (userId: string) => {
  if (!window.confirm("¿Rechazar fotos?")) return;
  try {
    await updateDoc(doc(db, "usuarios", userId), {
      kycVerificado: false, selfieVerificada: false, fotoFrontalVerificada: false,
      fotoTraseraVerificada: false, fotoLatIzqVerificada: false, fotoLatDerVerificada: false,
      licenciaVerificada: false, rcvVerificado: false,
      kycFoto: null, selfieFoto: null, fotoFrontal: null, fotoTrasera: null, fotoLatIzq: null, fotoLatDer: null,
      licenciaFoto: null, rcvFoto: null,
      estadoRevision: "rechazado", 
      mensajeAdmin: "Tus documentos fueron rechazados. Por favor, súbelos nuevamente con mayor claridad."
    });

    await addDoc(collection(db, "Notificaciones"), {
      idDestino: userId,
      titulo: "⚠️ Documentos Rechazados",
      mensaje: "Algunas de tus fotos no cumplen los requisitos. Revisa tu perfil y vuelve a subirlas para activar tu cuenta.",
      timestamp: Date.now(),
      leido: false,
      tipo: "alerta"
    });

    setToast({ texto: "Documentos eliminados y usuario notificado", tipo: "exito" });
    setTimeout(() => setToast(null), 3000);
    await cargarDatosAdmin(); 
  } catch (e) { 
    setToast({ texto: "Error al rechazar", tipo: "error" });
    setTimeout(() => setToast(null), 3000);
  }
};

  const suspenderUsuario = async (userId: string) => {
    if (!window.confirm("¿SUSPENDER esta cuenta?")) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userId), { cuentaSuspendida: true });
      await cargarDatosAdmin(); 
    } catch (e) { 
      setToast({ texto: "Error al suspender", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };

  const reactivarUsuario = async (userId: string) => {
    if (!window.confirm("¿Reactivar esta cuenta?")) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userId), { cuentaSuspendida: false });
      await cargarDatosAdmin();
    } catch (e) { 
      setToast({ texto: "Error al reactivar", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };

    const [modalClave, setModalClave] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');

  const cambiarPasswordSeguro = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    if (!passActual || !passNueva) {
      setToast({ texto: "Completa ambos campos", tipo: "error" });
      return;
    }

    setCargando(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passActual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passNueva);
      setToast({ texto: "¡Contraseña actualizada con éxito!", tipo: "exito" });
      setModalClave(false);
      setPassActual('');
      setPassNueva('');
    } catch (error: any) {
      console.error(error);
      setToast({ texto: "La contraseña actual es incorrecta.", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };
  
    const verificarCuentaCorreo = async () => {
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, "Notificaciones"), {
          idDestino: "CORREO_VERIFICACION",
          email: auth.currentUser.email?.toLowerCase().trim(),
          nombre: userData.nombre || "Viajero", 
          timestamp: Date.now()
        });

        setToast({ texto: "Correo Premium enviado con éxito", tipo: "exito" });
        setTimeout(() => setToast(null), 3000);
      } catch (error) { 
        console.error("Error al disparar correo premium:", error);
        setToast({ texto: "Error al solicitar el envío", tipo: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const actualizarEstadoVerificacion = async () => {
    if (!auth.currentUser) return;
    setCargando(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setToast({ texto: "¡Correo verificado!", tipo: "exito" });
        setTimeout(() => setToast(null), 3000);
        setUserData({...userData}); 
      } else {
        setToast({ texto: "Aún no verificado", tipo: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] w-[90vw] max-w-sm animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-5 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-slate-900' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? (
              <ShieldCheck size={24} className="text-green-400 shrink-0" />
            ) : (
              <AlertTriangle size={24} className="shrink-0" />
            )}
            <span className="leading-relaxed">{toast.texto}</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        
        {view === 'publico' && (
          <div className="p-5 space-y-6 animate-in fade-in duration-500">
            {auth.currentUser && !auth.currentUser.emailVerified && (
              <div className="bg-blue-600 rounded-[30px] p-5 shadow-lg border-b-4 border-blue-800 animate-in zoom-in">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl text-white"><AlertCircle size={20} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none mb-1">Correo sin verificar</p>
                      <p className="text-[11px] font-bold text-blue-100">Revisa tu email para activar tu cuenta.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={verificarCuentaCorreo} className="flex-1 bg-white/10 text-white border border-white/20 py-2.5 rounded-2xl text-[9px] font-black uppercase">Reenviar Link</button>
                    <button onClick={actualizarEstadoVerificacion} className="flex-1 bg-white text-blue-600 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm active:scale-95 transition-all">¡Ya lo hice! ✨</button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5">
                <div className={`${obtenerColorRango(rangoActual)} text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse`}>{rangoActual}</div>
              </div>
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-slate-200 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" alt="P" /> : <User size={50} className="text-slate-200" />}
                  </div>
                </div>
                <button onClick={() => setPasoFoto(true)} className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full border-4 border-white shadow-lg"><Edit2 size={14} /></button>
              </div>
              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">{userData.nombre || "Usuario"}</h2>
              <div className="flex justify-center gap-6 mt-4 border-t border-slate-50 pt-4">
                <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Conductor</p><p className="font-black text-blue-600 italic leading-none">{viajesCond} VJS</p></div>
                <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Pasajero</p><p className="font-black text-orange-500 italic leading-none">{viajesPas} VJS</p></div>
              </div>
            </div>

            {(userData.fotoFrontalVerificada && userData.fotoTraseraVerificada) && (
              <div className="flex items-center justify-center gap-2 bg-green-50 py-2 px-4 rounded-2xl border border-green-100 animate-bounce">
                <ShieldCheck size={16} className="text-green-600" />
                <span className="text-[10px] font-black text-green-700 uppercase italic">Vehículo Inspeccionado</span>
              </div>
            )}

            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo Nivel: {proximoNivel.nombre}</p>
                  <p className="text-sm font-black text-slate-800 italic uppercase">{proximoNivel.faltan > 0 ? `Te faltan ${proximoNivel.faltan} viajes` : "¡Leyenda!"}</p>
                </div>
                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{totalTrayectoria} / {proximoNivel.meta} VJS</div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000" style={{ width: `${porcentajeNivel}%` }} />
              </div>
            </div>

            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Seguridad del Perfil</p>
                  <p className="text-lg font-black text-slate-800 uppercase">Verificado al <span className="text-orange-500 italic">{porcentajeConfianza.toFixed(0)}%</span></p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl text-2xl font-black text-orange-500">{porcentajeConfianza.toFixed(0)}%</div>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 shadow-inner">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000" style={{ width: `${porcentajeConfianza}%` }} />
              </div>
            </div>
          </div>
        )}

        {view === 'cuenta' && (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Información Básica</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre); setModalVisible(true); }} />
                <MenuButton 
                  icon={Hash} 
                  label="Cédula (Número)" 
                  value={userData.cedulaNumero} 
                  onClick={() => { 
                    if (userData.kycVerificado) {
                      setToast({ texto: "Por seguridad, no puedes cambiar la cédula de una cuenta verificada.", tipo: "error" });
                      setTimeout(() => setToast(null), 4000);
                    } else {
                      setTipoEdicion({id:'cedulaNumero', label:'Cédula', valor:userData.cedulaNumero}); 
                      setNuevoValor(userData.cedulaNumero); 
                      setModalVisible(true); 
                    }
                  }} 
                />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono); setModalVisible(true); }} />
                <MenuButton icon={UserCog} label="Sobre mí (Bio)" value={userData?.bio || "Escribe algo sobre ti..."} onClick={() => { setTipoEdicion({id: 'bio', label: 'Biografía', valor: userData?.bio}); setNuevoValor(userData?.bio || ""); setModalVisible(true); }} />
                <MenuButton  icon={User} label="Correo Electrónico" value={userData.correo || auth.currentUser?.email} onClick={() => {setToast({  texto: "Por tu seguridad, el correo no puede modificarse directamente. Contacta a soporte para validarlo.",  tipo: "error" 
                });
            setTimeout(() => setToast(null), 5000);
              }} 
             />
            <MenuButton  icon={ShieldCheck} label="Seguridad" value="Cambiar Contraseña"  onClick={() => setModalClave(true)} />    
              </div>
            </div>

            <div className="bg-white p-5 rounded-[30px] shadow-sm mt-4 border border-slate-100">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Personalidad al conducir</p>
              <div className="flex flex-row gap-3">
                <div onClick={() => togglePreferencia('hablador', !(userData?.hablador || false))} className={`flex-1 py-3 rounded-2xl border flex flex-col items-center cursor-pointer transition-colors ${(userData?.hablador || false) ? 'bg-blue-500 border-blue-500' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-lg mb-1">{(userData?.hablador || false) ? '💬' : '🔇'}</span>
                  <p className={`text-[10px] font-black uppercase ${(userData?.hablador || false) ? 'text-white' : 'text-slate-400'}`}>{(userData?.hablador || false) ? 'Conversador' : 'Poco hablar'}</p>
                </div>
                <div onClick={() => togglePreferencia('musica', !(userData?.musica || false))} className={`flex-1 py-3 rounded-2xl border flex flex-col items-center cursor-pointer transition-colors ${(userData?.musica || false) ? 'bg-blue-500 border-blue-500' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-lg mb-1">{(userData?.musica || false) ? '🎵' : '🔇'}</span>
                  <p className={`text-[10px] font-black uppercase ${(userData?.musica || false) ? 'text-white' : 'text-slate-400'}`}>{(userData?.musica || false) ? 'Con Música' : 'Sin Música'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Seguridad Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={FileText} label="Foto de Cédula" status={userData.kycVerificado ? 'verificado' : (userData.kycFoto ? 'revision' : (userData.estadoRevision === 'rechazado' ? 'rechazado' : 'pendiente'))} onClick={() => setPasoDocumento({tipo:'cedula', activa:true})} />
                <MenuButton icon={User} label="Selfie con Documento" status={userData.selfieVerificada ? 'verificado' : (userData.selfieFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'selfie', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Licencia de Conducir" status={userData.licenciaVerificada ? 'verificado' : (userData.licenciaFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'licencia', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Seguro RCV" status={userData.rcvVerificado ? 'verificado' : (userData.rcvFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'rcv', activa:true})} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Datos del Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Car} label="Marca" value={userData.vehiculo?.marca} onClick={() => { setTipoEdicion({id:'marca', label:'Marca', valor:userData.vehiculo?.marca}); setNuevoValor(userData.vehiculo?.marca || ""); setModalVisible(true); }} />
                <MenuButton icon={Gauge} label="Modelo" value={userData.vehiculo?.modelo} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData.vehiculo?.modelo}); setNuevoValor(userData.vehiculo?.modelo || ""); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color" value={userData.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData.vehiculo?.color}); setNuevoValor(userData.vehiculo?.color || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa" value={userData.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData.vehiculo?.placa}); setNuevoValor(userData.vehiculo?.placa || ""); setModalVisible(true); }} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[3px] ml-4 italic">Fotos del Auto</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Camera} label="Frontal" status={userData.fotoFrontalVerificada ? 'verificado' : (userData.fotoFrontal ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoFrontal', activa:true})} />
                <MenuButton icon={Camera} label="Trasera" status={userData.fotoTraseraVerificada ? 'verificado' : (userData.fotoTrasera ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoTrasera', activa:true})} />
                <MenuButton icon={Camera} label="Lat. Izquierdo" status={userData.fotoLatIzqVerificada ? 'verificado' : (userData.fotoLatIzq ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatIzq', activa:true})} />
                <MenuButton icon={Camera} label="Lat. Derecho" status={userData.fotoLatDerVerificada ? 'verificado' : (userData.fotoLatDer ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatDer', activa:true})} />
              </div>
            </div>

            {userData.estadoRevision === 'rechazado' && !userData.kycFoto && (
              <div className="mx-2 bg-orange-50 border-2 border-orange-100 rounded-[30px] p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500 p-2 rounded-xl text-white"><AlertCircle size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-orange-600 uppercase italic tracking-widest mb-1">Documentos Rechazados</p>
                    <p className="text-[11px] font-bold text-slate-700">{userData.mensajeAdmin || "Por favor sube las fotos nuevamente."}</p>
                  </div>
                </div>
              </div>
            )}

            {esAdmin && (
              <button onClick={() => { cargarDatosAdmin(); setPestañaActiva('admin'); }} className="w-full bg-slate-900 text-white p-5 rounded-[30px] flex items-center justify-between shadow-xl mt-6">
                <div className="flex items-center gap-4"><ShieldCheck size={20} className="text-red-500" /><p className="font-black text-xs uppercase italic">Control Maestro</p></div>
                <ChevronRight size={20} />
              </button>
            )}

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 mt-4"><LogOut size={14} /> Cerrar Sesión</button>
          </div>
        )}

        {view === 'admin' && (
          <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white">
              <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl"><ChevronRight size={20} className="rotate-180" /></button>
              <div className="text-center">
                <h2 className="font-black italic uppercase text-sm tracking-tighter">Control Maestro</h2>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Panel Administrativo</p>
              </div>
              <button onClick={cargarDatosAdmin} className="text-blue-400 bg-blue-400/10 p-2 rounded-xl"><RefreshCw size={20} className={cargando ? 'animate-spin' : ''}/></button>
            </div>

                        <div className="flex bg-slate-900 p-1 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
              <button onClick={() => setSubPestañaAdmin('pendientes')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'pendientes' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-600'}`}>Pendientes</button>
              <button onClick={() => setSubPestañaAdmin('aprobados')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'aprobados' ? 'text-green-500 border-b-2 border-green-500' : 'text-slate-600'}`}>Usuarios</button>
              <button onClick={() => setSubPestañaAdmin('pagos')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'pagos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-600'}`}>Pagos ({pagosAdmin.length})</button>
              <button onClick={() => setSubPestañaAdmin('soporte')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'soporte' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-600'}`}>Soporte ({chatsSoporteAdmin.length})</button>
              <button onClick={() => setSubPestañaAdmin('historial')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'historial' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-600'}`}>Historial</button>
              <button onClick={() => setSubPestañaAdmin('reportes')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'reportes' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-600'}`}>Reportes</button>
            </div>
            
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
              {cargando ? (
                <p className="text-center p-10 text-slate-500 italic animate-pulse text-xs uppercase font-black">Sincronizando...</p>
              ) : (
                <>
                  {subPestañaAdmin === 'soporte' && (
                    <div className="space-y-3 animate-in slide-in-from-bottom duration-400">
                      {chatsSoporteAdmin.length === 0 ? (
                        <div className="bg-slate-900/50 p-10 rounded-[30px] border border-white/5 text-center">
                            <Headset size={40} className="text-slate-800 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-600 uppercase italic">No hay tickets de soporte</p>
                        </div>
                      ) : (
                        chatsSoporteAdmin.map((chat) => (
                          <div 
                            key={chat.id} 
                            onClick={() => onAbrirChat && onAbrirChat(chat)} 
                            className="bg-slate-900 border border-blue-500/20 p-5 rounded-[25px] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors"
                          >
                              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 shrink-0">
                                <MessageCircle size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-black text-white text-sm uppercase truncate">{chat.nombrePasajero || 'Usuario Desconocido'}</h4>
                                <p className="text-[10px] text-blue-400 font-bold truncate mt-0.5">{chat.ultimoMensaje}</p>
                              </div>
                              <ChevronRight size={18} className="text-slate-600" />
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {subPestañaAdmin === 'historial' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom duration-400">
                      <div className="bg-gradient-to-br from-indigo-600 to-slate-900 p-6 rounded-[35px] border border-white/10 shadow-2xl relative overflow-hidden">
                          <Landmark className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                          <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1 relative z-10">Caja Fuerte App</p>
                          <h3 className="text-4xl font-black italic text-white leading-none relative z-10">${balanceApp.toFixed(2)}</h3>
                          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10 relative z-10">
                            <TrendingUp size={12} className="text-green-400" />
                            <span className="text-[9px] font-black text-white uppercase italic">10% de Comisión</span>
                          </div>
                      </div>

                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mt-6">Ingresos App</h4>

                      {transaccionesAdmin.length === 0 ? (
                        <div className="bg-slate-900/50 p-10 rounded-[30px] border border-white/5 text-center">
                            <History size={40} className="text-slate-800 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-600 uppercase italic">Sin comisiones aún</p>
                        </div>
                      ) : (
                        transaccionesAdmin.map((tx) => (
                          <div key={tx.id} className="bg-slate-900 border border-white/5 p-5 rounded-[28px] flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                                  <DollarSign size={18} />
                                </div>
                                <div>
                                  <p className="text-[11px] font-black text-slate-200 uppercase leading-none mb-1">{tx.descripcion}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase">
                                    {new Date(tx.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-black italic text-indigo-400">+${Number(tx.monto).toFixed(2)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {subPestañaAdmin === 'pagos' && (
                    <>
                      <div className="bg-slate-900 border border-white/5 p-5 rounded-[30px] flex justify-between items-center shadow-lg mb-6">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Tasa Oficial Actual</p>
                          <p className="text-xl font-black text-white italic">Bs. {tasaActual}</p>
                        </div>
                        <button onClick={actualizarTasaBCV} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic active:scale-95 transition-all shadow-lg shadow-blue-900/50">
                          Cambiar Tasa
                        </button>
                      </div>
                      
                      <div className="bg-slate-900 border border-white/5 p-6 rounded-[35px] space-y-4 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-600/10 p-2 rounded-xl text-blue-400"><Settings size={18} /></div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Datos de Cobro (Wallet)</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Banco</label>
                            <input value={bancoAdmin.banco} onChange={(e) => setBancoAdmin({...bancoAdmin, banco: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-blue-500" placeholder="Ej: Banco de Venezuela" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Teléfono</label>
                            <input value={bancoAdmin.telefono} onChange={(e) => setBancoAdmin({...bancoAdmin, telefono: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-blue-500" placeholder="Ej: 04121234567" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Cédula</label>
                            <input value={bancoAdmin.cedula} onChange={(e) => setBancoAdmin({...bancoAdmin, cedula: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-blue-500" placeholder="Ej: V-12345678" />
                          </div>
                        </div>
                        <button disabled={cargando} onClick={guardarDatosBancarios} className="w-full bg-blue-600 disabled:opacity-50 text-white p-3 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all mt-2">Guardar Datos de Cobro</button>
                      </div>
                      

                      {pagosAdmin.length === 0 ? (
                        <p className="text-center text-slate-700 font-black uppercase italic text-[10px] mt-20">No hay pagos pendientes</p>
                      ) : (
                        pagosAdmin.map(pago => {
                          const esRetiro = pago.tipo === 'retiro';
                          const montoFijo = Number(pago.monto || 0); 
                          
                          return (
                            <div key={pago.id} className={`bg-slate-900 border ${esRetiro ? 'border-amber-500/20' : 'border-blue-500/20'} rounded-[25px] p-5 space-y-4 text-white`}>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 ${esRetiro ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'} rounded-full flex items-center justify-center`}>
                                    {esRetiro ? <ArrowUpRight size={20}/> : <DollarSign size={20}/>}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-black uppercase italic">{pago.nombre || "Usuario"}</p>
                                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md ${esRetiro ? 'bg-amber-500 text-amber-950' : 'bg-blue-500 text-white'}`}>
                                        {esRetiro ? 'SOLICITUD RETIRO' : 'RECARGA SALDO'}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                                      {esRetiro ? 'Saldo retenido en App' : `Ref: ${pago.referencia || "N/A"}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xl font-black italic leading-none ${esRetiro ? 'text-amber-400' : 'text-blue-400'}`}>
                                    ${montoFijo.toFixed(2)}
                                  </p>
                                  <p className="text-[8px] text-slate-500 font-black mt-1 uppercase italic">
                                    BCV: {pago.tasaAplicada || "N/A"}
                                  </p>
                                </div>
                              </div>

                              {!esRetiro && pago.comprobanteUrl && (
                                <div className="mt-3 p-3 bg-slate-950/50 rounded-2xl border border-white/5">
                                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <ImageIcon size={10} /> Capture Adjunto
                                  </p>
                                  <div 
                                    onClick={() => setFotoZoom(pago.comprobanteUrl)}
                                    className="w-full h-24 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden relative cursor-zoom-in group"
                                  >
                                    <img src={pago.comprobanteUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/60 px-2 py-1 rounded-lg">Ver Completo</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {esRetiro && (
                                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-1 mt-2">
                                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2">Datos para transferirle:</p>
                                  <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">Banco:</span><span className="text-white uppercase">{pago.datosBancarios?.banco}</span></div>
                                  <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">Teléfono:</span><span className="text-white">{pago.datosBancarios?.telefono}</span></div>
                                  <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">Cédula:</span><span className="text-white">{pago.datosBancarios?.cedula}</span></div>
                                </div>
                              )}
                              
                              <div className="flex gap-2 pt-2 border-t border-white/5 mt-3">
                                <button disabled={cargando} onClick={() => rechazarPago(pago)} className="flex-1 bg-red-500/10 disabled:opacity-50 text-red-500 p-3 rounded-xl font-black text-[10px] uppercase hover:bg-red-500/20 transition-colors">
                                  {esRetiro ? 'Rechazar y Devolver' : 'Rechazar'}
                                </button>
                                <button disabled={cargando} onClick={() => esRetiro ? marcarRetiroComoPagado(pago) : aprobarPago(pago)} className={`flex-[2] p-3 disabled:opacity-50 rounded-xl font-black text-[10px] uppercase shadow-lg transition-colors ${esRetiro ? 'bg-amber-500 text-amber-950 hover:bg-amber-400' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                                  {esRetiro ? 'Ya transferí (OK)' : 'Aprobar y Acreditar'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {subPestañaAdmin === 'reportes' && (
                    reportesAdmin.length === 0 ? (
                      <p className="text-center text-slate-700 font-black uppercase italic text-[10px] mt-20">No hay reportes activos</p>
                    ) : (
                      reportesAdmin.map(r => (
                        <div key={r.id} className="bg-slate-900 border border-red-500/20 rounded-[25px] p-5 space-y-3 text-white">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center text-red-500"><AlertCircle size={16} /></div>
                              <div>
                                <p className="text-[10px] font-black text-white uppercase italic tracking-tighter">Denunciado: {r.nombreReportado}</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Por: {r.nombreReportador}</p>
                              </div>
                            </div>
                            <button onClick={() => resolverReporte(r.id)} className="bg-slate-800 p-2 rounded-lg text-slate-400"><ShieldCheck size={16} /></button>
                          </div>
                          <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">"{r.motivo}"</p>
                          </div>
                        </div>
                      ))
                    )
                  )}

          {(subPestañaAdmin === 'pendientes' || subPestañaAdmin === 'aprobados') && (
                    usuariosAdmin
                      .filter(u => {
                        const esPendiente = (u.kycFoto && !u.kycVerificado) || (u.fotoFrontal && !u.fotoFrontalVerificada);
                        return subPestañaAdmin === 'pendientes' ? esPendiente : !esPendiente;
                      })
                      .map(u => {
                        const estaExpandido = usuarioExpandidoAdmin === u.id;
                        const estaSuspendido = u.cuentaSuspendida === true;
                        return (
                          <div key={u.id} className={`bg-slate-900 border ${estaSuspendido ? 'border-red-900' : 'border-white/5'} rounded-[25px] overflow-hidden transition-colors`}>
                            <button onClick={() => setUsuarioExpandidoAdmin(estaExpandido ? null : u.id)} className="w-full flex items-center justify-between p-5 text-white relative">
                              {estaSuspendido && <div className="absolute top-0 right-0 bg-red-600 text-white text-[7px] font-black uppercase px-2 py-1 rounded-bl-xl">Suspendido</div>}
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${estaSuspendido ? 'bg-red-950/50 text-red-500' : 'bg-slate-800 text-white'} rounded-full flex items-center justify-center font-black text-xs`}>{u.nombre?.charAt(0).toUpperCase()}</div>
                                <div className="text-left">
                                  <p className={`font-black text-xs uppercase italic ${estaSuspendido ? 'text-slate-500 line-through' : 'text-white'}`}>{u.nombre}</p>
                                  <p className="text-[9px] text-slate-500 font-bold">{u.correo || u.email}</p>
                                </div>
                              </div>
                              <ChevronRight size={18} className={`text-slate-600 transition-transform ${estaExpandido ? 'rotate-90' : ''}`} />
                            </button>
                            {estaExpandido && (
                              <div className="p-6 pt-0 space-y-5 animate-in slide-in-from-top duration-200">
                                <div className="grid grid-cols-4 gap-2">
  {[
    { img: u.kycFoto, label: 'Cédula' }, 
    { img: u.selfieFoto, label: 'Selfie' }, 
    { img: u.licenciaFoto, label: 'Licencia' }, 
    { img: u.rcvFoto, label: 'RCV' }, 
    { img: u.fotoFrontal, label: 'Frente' },
    { img: u.fotoTrasera, label: 'Atrás' },
    { img: u.fotoLatIzq, label: 'Lat. Izq' },
    { img: u.fotoLatDer, label: 'Lat. Der' }
  ].map((item, idx) => (
    <div key={idx} className="flex flex-col gap-1">
      <p className="text-[7px] font-black text-slate-500 uppercase text-center tracking-tighter">{item.label}</p>
      <div onClick={() => item.img && setFotoZoom(item.img)} className={`bg-slate-800 aspect-square rounded-xl overflow-hidden border border-white/5 flex items-center justify-center ${estaSuspendido ? 'opacity-50 grayscale' : ''}`}> 
        {item.img ? <img src={item.img} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-700" />}
      </div>
    </div>
  ))}
</div>
                                <div className="flex flex-col gap-2">
                                  {estaSuspendido ? (
                                    <button disabled={cargando} onClick={() => reactivarUsuario(u.id)} className="w-full bg-slate-800 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[10px] uppercase border border-slate-700 active:scale-95 transition-all">Reactivar Cuenta</button>
                                  ) : (
                                    <>
                                      {subPestañaAdmin === 'pendientes' && (
                                        <div className="flex gap-2">
                                          <button disabled={cargando} onClick={() => aprobarUsuario(u.id)} className="flex-1 bg-green-600 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[10px] uppercase">Aprobar</button>
                                          <button disabled={cargando} onClick={() => rechazarDocumentos(u.id)} className="flex-1 bg-amber-500/20 disabled:opacity-50 text-amber-500 p-3 rounded-xl font-black text-[10px] uppercase">Rechazar Fotos</button>
                                        </div>
                                      )}
                                      <button disabled={cargando} onClick={() => suspenderUsuario(u.id)} className="w-full bg-red-950/40 disabled:opacity-50 text-red-500 p-3 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all">Suspender Usuario</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}     
                          </div>
                        );
                      })
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom">
            <h4 className="text-[10px] font-black text-blue-600 uppercase mb-6 italic tracking-widest text-center">Editar {tipoEdicion?.label}</h4>
            
            {tipoEdicion?.id === 'cedulaNumero' && (
               <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl mb-5 flex gap-3 items-start">
                 <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                 <p className="text-[9px] font-bold text-orange-700 uppercase tracking-wider leading-relaxed">
                   Verifica bien los números. Por razones de seguridad, una vez verificada, <span className="font-black">no podrás cambiarla.</span>
                 </p>
               </div>
            )}
            
            {tipoEdicion?.id === 'bio' ? (
              <textarea value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-6 rounded-3xl font-medium text-sm mb-8 outline-none border-2 border-slate-100 min-h-[150px] resize-none text-slate-600 leading-relaxed" placeholder="Ej: Hola, soy Luis..." autoFocus />
            ) : (
              <input value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg mb-8 outline-none border-2 border-slate-100 uppercase text-center" autoFocus />
            )}
            <button disabled={cargando} onClick={() => guardarCambios()} className="w-full bg-blue-600 text-white p-5 rounded-[25px] disabled:opacity-50 font-black uppercase text-xs shadow-lg active:scale-95 transition-transform">Guardar Cambios</button>
          </div>
        </div>
      )}

      {confirmacionCedula && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => !cargando && setConfirmacionCedula(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 text-center animate-in zoom-in-95 shadow-2xl">
            
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-100">
              <AlertTriangle size={30} />
            </div>
            
            <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight mb-2">
              Confirmación de Cédula
            </h3>
            
            <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
              ¿Estás <span className="text-orange-500 font-black">100% seguro</span> de que tu cédula es <span className="text-slate-800 font-black text-sm">{nuevoValor}</span>?
              <br/><br/>
              Verifica que no tenga errores, ya que por razones de seguridad, una vez verificada, no podrás modificarla más adelante.
            </p>
            
            <div className="flex gap-3">
              <button 
                disabled={cargando}
                onClick={() => setConfirmacionCedula(false)} 
                className="flex-1 bg-slate-100 text-slate-500 font-black uppercase text-[10px] py-4 rounded-2xl active:scale-95 transition-all"
              >
                Corregir
              </button>
              <button 
                disabled={cargando}
                onClick={() => guardarCambios(true)} 
                className="flex-[1.5] bg-orange-500 text-white font-black uppercase text-[10px] py-4 rounded-2xl shadow-lg shadow-orange-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {cargando ? 'Guardando...' : 'Sí, Confirmar'}
              </button>
            </div>

          </div>
        </div>
      )}
      
          {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex flex-col p-6 items-center justify-center space-y-6 animate-in fade-in duration-200">
          {!fotoDocTemporal ? (
            <>
              <div className="bg-slate-950 p-8 rounded-[40px] border border-white/5 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
                <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-900/50">
                  <Camera size={35} className="text-blue-400" />
                </div>
                
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">Subir documento</p>
                <h3 className="text-xl font-black italic text-white uppercase tracking-tight mb-8">
                  {pasoDocumento.tipo === 'cedula' ? 'Foto de tu Cédula' : 
                   pasoDocumento.tipo === 'selfie' ? 'Selfie con Documento' : 
                   pasoDocumento.tipo === 'licencia' ? 'Licencia de Conducir' : 
                   pasoDocumento.tipo === 'rcv' ? 'Seguro RCV' : 'Foto de tu Vehículo'}
                </h3>
                
                {/* 🔥 BOTONES PERSONALIZADOS 100% ESTÉTICOS 🔥 */}
                <div className="space-y-3">
                  <button 
                    onClick={() => capturarDocumento(CameraSource.Camera)} 
                    className="w-full bg-blue-600 text-white rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-lg shadow-blue-900/30"
                  >
                    <Camera size={18} />
                    <span className="font-black text-[11px] uppercase tracking-widest">Abrir Cámara</span>
                  </button>

                  <button 
                    onClick={() => capturarDocumento(CameraSource.Photos)} 
                    className="w-full bg-slate-800 text-blue-400 border border-blue-500/30 rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-[0.97] transition-all hover:bg-slate-700"
                  >
                    <ImageIcon size={18} />
                    <span className="font-black text-[11px] uppercase tracking-widest">Abrir Galería</span>
                  </button>
                </div>
                
                <button 
                  onClick={() => setPasoDocumento({...pasoDocumento, activa: false})} 
                  className="text-slate-600 font-black uppercase text-[10px] mt-8 tracking-widest hover:text-slate-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-full aspect-video rounded-3xl overflow-hidden border-4 border-blue-500 shadow-2xl animate-in zoom-in-95">
                <img src={fotoDocTemporal} className="w-full h-full object-cover" />
              </div>
              <div className="w-full max-w-sm space-y-3">
                <button disabled={cargando} onClick={subirDocumentoFinal} className="w-full disabled:opacity-50 bg-blue-600 text-white py-5 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                  {cargando ? "SUBIENDO..." : "Enviar Documento"}
                </button>
                <button disabled={cargando} onClick={() => setFotoDocTemporal(null)} className="w-full text-slate-400 disabled:opacity-50 font-black uppercase text-[10px] py-3 tracking-widest hover:text-white transition-colors">
                  Elegir otra imagen
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {fotoZoom && (
        <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setFotoZoom(null)}>
          <img src={fotoZoom} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" />
        </div>
      )}

      {modalClave && (
  <div className="fixed inset-0 bg-[#0b1120]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
    <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-blue-600/20 p-4 rounded-2xl mb-4">
          <ShieldCheck className="text-blue-500" size={32} />
        </div>
        
        <h2 className="text-xl font-black italic text-white mb-2">Seguridad</h2>
        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-6 text-center">Cambiar Contraseña</p>

        <div className="w-full space-y-4">
          <input 
            type="password" 
            placeholder="Contraseña Actual" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-white transition-all"
            value={passActual}
            onChange={(e) => setPassActual(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Nueva Contraseña" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-white transition-all"
            value={passNueva}
            onChange={(e) => setPassNueva(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 w-full mt-8">
          <button 
            onClick={() => { setModalClave(false); setPassActual(''); setPassNueva(''); }}
            className="p-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={cambiarPasswordSeguro}
            className="p-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* MODAL DE FOTO DE PERFIL RESTAURADO A SU VERSIÓN ORIGINAL (DOS BOTONES) */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 items-center justify-center text-center">
          {!fotoTemporal ? (
            <>
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center mb-10">
                <User size={80} className="text-orange-200" />
              </div>
              <div className="w-full space-y-3">
                <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                  <Camera size={18} /> Tomar Foto Ahora
                </button>
                <button onClick={() => seleccionarImagen(CameraSource.Photos)} className="w-full bg-slate-900 text-white p-5 rounded-[25px] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                  <FileText size={18} className="text-blue-400" /> Elegir de la Galería
                </button>
              </div>
              <button onClick={() => setPasoFoto(false)} className="text-slate-400 font-black uppercase text-[10px] mt-8 tracking-widest">
                Tal vez luego
              </button>
            </>
          ) : (
            <>
              <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-blue-50 mb-10">
                <img src={fotoTemporal} className="w-full h-full object-cover" alt="Previsualización" />
              </div>
              <button disabled={cargando} onClick={subirFotoConfirmada} className="w-full bg-blue-600 disabled:opacity-50 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">
                {cargando ? "SUBIENDO..." : "Confirmar Foto"}
              </button>
              <button disabled={cargando} onClick={() => setFotoTemporal(null)} className="text-slate-400 disabled:opacity-50 font-black uppercase text-[10px] mt-6 tracking-widest">
                Elegir otra
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, value, status, onClick }: any) => {
  let statusText = value || "Configurar";
  let statusColor = "text-blue-500";
  if (status === 'revision') { statusText = "REVISIÓN ⏳"; statusColor = "text-amber-500"; }
  if (status === 'verificado') { statusText = "LISTO ✅"; statusColor = "text-green-600"; }
  if (status === 'rechazado') { statusText = "REINTENTAR ⚠️"; statusColor = "text-orange-600"; }

  return (
    <button onClick={onClick} disabled={status === 'verificado' || status === 'revision'} className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 disabled:opacity-80 overflow-hidden">
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm flex-shrink-0"><Icon size={20} /></div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5 truncate">{label}</p>
          <p className={`text-xs font-black uppercase ${statusColor} truncate`}>{statusText}</p>
        </div>
      </div>
      {status !== 'verificado' && status !== 'revision' && <ChevronRight size={18} className="text-slate-200 ml-3 flex-shrink-0" />}
    </button>
  );
};
