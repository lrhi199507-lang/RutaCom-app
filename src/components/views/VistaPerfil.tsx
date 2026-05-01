import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  ShieldCheck, RefreshCw, AlertCircle, AlertTriangle,
  Car, Palette, Hash, Gauge, LogOut, Camera, X
} from 'lucide-react';

const auth = getAuth();

export const VistaPerfil = ({ userData, setUserData, handleLogout, pestañaActiva, setPestañaActiva }: any) => {
  // ESTADOS
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fotoDocTemporal, setFotoDocTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [pasoDocumento, setPasoDocumento] = useState<{tipo: string, activa: boolean, reglas?: string}>({tipo: 'cedula', activa: false});
  const [usuariosAdmin, setUsuariosAdmin] = useState<any[]>([]);
  const [reportesAdmin, setReportesAdmin] = useState<any[]>([]);
  const [subPestañaAdmin, setSubPestañaAdmin] = useState<'pendientes' | 'aprobados' | 'reportes'>('pendientes');
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);
  const [modalInstruccionesSelfie, setModalInstruccionesSelfie] = useState(false);
  const [usuarioExpandidoAdmin, setUsuarioExpandidoAdmin] = useState<string | null>(null);
  const [bio, setBio] = useState(userData?.bio || "");
  const [hablador, setHablador] = useState(userData?.hablador || false);
  const [musica, setMusica] = useState(userData?.musica || false);
  
  // ESTADO PARA EL TOAST
  const [toast, setToast] = useState<{texto: string, tipo: 'exito'|'error'} | null>(null);

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  
  const view = pestañaActiva || 'publico';
  const ADMIN_EMAIL = "lrhi199507@gmail.com";
  const esAdmin = auth.currentUser?.email ? auth.currentUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() : false;

  // --- LÓGICA DE RANGOS ---
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
    
    try {
      const userId = auth.currentUser?.uid || userData.id;
      await updateDoc(doc(db, "usuarios", userId), { fotoPerfil: fotoTemporal });
      setUserData({ ...userData, fotoPerfil: fotoTemporal });
      setPasoFoto(false); 
      setFotoTemporal(null);
    } catch (e) { 
      setToast({ texto: "Retraso de red. Se subirá en segundo plano.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      setUserData({ ...userData, fotoPerfil: fotoTemporal });
      setPasoFoto(false); 
      setFotoTemporal(null);
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
  
  const guardarCambios = async () => {
    if (!tipoEdicion || !nuevoValor) return;
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
    } catch (e) { console.log("Error:", e); } finally { setCargando(false); }
  };
  
  const capturarDocumento = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 40, width: 800, resultType: CameraResultType.DataUrl, source: CameraSource.Camera, saveToGallery: false });
      if (image.dataUrl) setFotoDocTemporal(image.dataUrl);
    } catch (e) { console.log("Cancelado"); }
  };
  
  const subirDocumentoFinal = async () => {
    if (!fotoDocTemporal) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userData.uid || userData.id);
      const fieldMap: any = {
        cedula: { f: 'kycFoto', v: 'kycVerificado' }, selfie: { f: 'selfieFoto', v: 'selfieVerificada' },
        licencia: { f: 'licenciaFoto', v: 'licenciaVerificada' }, rcv: { f: 'rcvFoto', v: 'rcvVerificado' },
        fotoFrontal: { f: 'fotoFrontal', v: 'fotoFrontalVerificada' }, fotoTrasera: { f: 'fotoTrasera', v: 'fotoTraseraVerificada' },
        fotoLatIzq: { f: 'fotoLatIzq', v: 'fotoLatIzqVerificada' }, fotoLatDer: { f: 'fotoLatDer', v: 'fotoLatDerVerificada' }
      };
      const { f, v } = fieldMap[pasoDocumento.tipo];
      await updateDoc(userRef, { [f]: fotoDocTemporal, [v]: false, estadoRevision: "pendiente" });
      setUserData({ ...userData, [f]: fotoDocTemporal, [v]: false });
      setFotoDocTemporal(null); setPasoDocumento({ ...pasoDocumento, activa: false });
    } catch (e: any) {
      setToast({ texto: "Retraso de red. Se subirá en segundo plano.", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
      setFotoDocTemporal(null); setPasoDocumento({ ...pasoDocumento, activa: false });
    } finally { setCargando(false); }
  };
  
  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const snapUsers = await getDocs(collection(db, "usuarios"));
      setUsuariosAdmin(snapUsers.docs.map(d => ({ id: d.id, ...d.data() })));
      const snapReports = await getDocs(collection(db, "Reportes"));
      setReportesAdmin(snapReports.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const resolverReporte = async (reporteId: string) => {
    if(!window.confirm("¿Marcar este reporte como revisado? Se eliminará de la lista.")) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, "Reportes", reporteId));
      setReportesAdmin(reportesAdmin.filter(r => r.id !== reporteId));
    } catch (e) { 
      setToast({ texto: "Error al eliminar reporte", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const aprobarUsuario = async (userId: string) => {
    if (!userId) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userId), {
        kycVerificado: true, licenciaVerificada: true, circulacionVerificada: true,
        rcvVerificado: true, fotoFrontalVerificada: true, fotoTraseraVerificada: true,
        fotoLatIzqVerificada: true, fotoLatDerVerificada: true, selfieVerificada: true
      });
      setToast({ texto: "¡Usuario Verificado!", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
      await cargarDatosAdmin();
    } catch (e) { 
      setToast({ texto: "Error de permisos", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally { setCargando(false); }
  };

  const rechazarDocumentos = async (userId: string) => {
    if (!window.confirm("¿Rechazar fotos? El usuario deberá subirlas de nuevo y desaparecerá de esta lista.")) return;
    try {
      await updateDoc(doc(db, "usuarios", userId), {
        kycVerificado: false, selfieVerificada: false, fotoFrontalVerificada: false,
        fotoTraseraVerificada: false, fotoLatIzqVerificada: false, fotoLatDerVerificada: false,
        kycFoto: null, selfieFoto: null, fotoFrontal: null, fotoTrasera: null, fotoLatIzq: null, fotoLatDer: null,
        estadoRevision: "rechazado", mensajeAdmin: "Tus documentos fueron rechazados por falta de claridad. Por favor, asegúrate de que sean legibles y vuelve a intentarlo."
      });
      setToast({ texto: "Documentos eliminados", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
      await cargarDatosAdmin(); 
    } catch (e) { 
      setToast({ texto: "Error al rechazar", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const suspenderUsuario = async (userId: string) => {
    if (!window.confirm("¿SUSPENDER esta cuenta? No podrá usar la app.")) return;
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

  const enviarResetContraseña = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      setToast({ texto: `Correo enviado a ${email}`, tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) { 
      setToast({ texto: "Error al enviar el correo", tipo: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const verificarCuentaCorreo = async () => {
    if (auth.currentUser) {
      try {
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(auth.currentUser);
        setToast({ texto: "Correo de verificación enviado", tipo: "exito" });
        setTimeout(() => setToast(null), 3000);
      } catch (error) { 
        setToast({ texto: "Error al enviar verificación", tipo: "error" });
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
      {/* TOAST FLOTANTE LÍNEAL Y ESTÉTICO */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] w-max max-w-[95vw] animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-slate-900' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? (
              <ShieldCheck size={18} className="text-green-400 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="shrink-0" />
            )}
            <span className="truncate whitespace-nowrap">{toast.texto}</span>
          </div>
        </div>
      )}

      {/* NAV SUPERIOR */}
      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* VISTA PÚBLICA (PERFIL) */}
        {view === 'publico' && (
          <div className="p-5 space-y-6 animate-in fade-in duration-500">
            {/* AVISO DE VERIFICACIÓN INTELIGENTE */}
            {auth.currentUser && !auth.currentUser.emailVerified && (
              <div className="bg-blue-600 rounded-[30px] p-5 shadow-lg border-b-4 border-blue-800 animate-in zoom-in">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl text-white">
                      <AlertCircle size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none mb-1">
                        Correo sin verificar
                      </p>
                      <p className="text-[11px] font-bold text-blue-100">
                        Revisa tu email para activar tu cuenta.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={verificarCuentaCorreo} className="flex-1 bg-white/10 text-white border border-white/20 py-2.5 rounded-2xl text-[9px] font-black uppercase">
                      Reenviar Link
                    </button>
                    <button onClick={actualizarEstadoVerificacion} className="flex-1 bg-white text-blue-600 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm active:scale-95 transition-all">
                      ¡Ya lo hice! ✨
                    </button>
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

        {/* VISTA DE CUENTA */}
        {view === 'cuenta' && (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            {/* DATOS BÁSICOS */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Información Básica</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Cédula (Número)" value={userData.cedulaNumero} onClick={() => { setTipoEdicion({id:'cedulaNumero', label:'Cédula', valor:userData.cedulaNumero}); setNuevoValor(userData.cedulaNumero); setModalVisible(true); }} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono); setModalVisible(true); }} />
                <MenuButton icon={UserCog} label="Sobre mí (Bio)" value={userData?.bio || "Escribe algo sobre ti..."} onClick={() => { setTipoEdicion({id: 'bio', label: 'Biografía', valor: userData?.bio}); setNuevoValor(userData?.bio || ""); setModalVisible(true); }} />
                <MenuButton icon={User} label="Correo Electrónico" value={userData.correo || auth.currentUser?.email} onClick={() => alert("El correo no se puede cambiar por ahora por seguridad.")} />
                <MenuButton icon={ShieldCheck} label="Seguridad" value="Cambiar Contraseña" onClick={enviarResetContraseña} />
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

            {/* SEGURIDAD PERSONAL */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Seguridad Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={FileText} label="Foto de Cédula" status={userData.kycVerificado ? 'verificado' : (userData.kycFoto ? 'revision' : (userData.estadoRevision === 'rechazado' ? 'rechazado' : 'pendiente'))} onClick={() => setPasoDocumento({tipo:'cedula', activa:true})} />
                <MenuButton icon={User} label="Selfie con Documento" status={userData.selfieVerificada ? 'verificado' : (userData.selfieFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'selfie', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Licencia de Conducir" status={userData.licenciaVerificada ? 'verificado' : (userData.licenciaFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'licencia', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Seguro RCV" status={userData.rcvVerificado ? 'verificado' : (userData.rcvFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'rcv', activa:true})} />
              </div>
            </div>

            {/* VEHÍCULO DETALLES */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Datos del Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Car} label="Marca" value={userData.vehiculo?.marca} onClick={() => { setTipoEdicion({id:'marca', label:'Marca', valor:userData.vehiculo?.marca}); setNuevoValor(userData.vehiculo?.marca || ""); setModalVisible(true); }} />
                <MenuButton icon={Gauge} label="Modelo" value={userData.vehiculo?.modelo} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData.vehiculo?.modelo}); setNuevoValor(userData.vehiculo?.modelo || ""); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color" value={userData.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData.vehiculo?.color}); setNuevoValor(userData.vehiculo?.color || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa" value={userData.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData.vehiculo?.placa}); setNuevoValor(userData.vehiculo?.placa || ""); setModalVisible(true); }} />
              </div>
            </div>

            {/* FOTOS DEL AUTO */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[3px] ml-4 italic">Fotos del Auto</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Camera} label="Frontal" status={userData.fotoFrontalVerificada ? 'verificado' : (userData.fotoFrontal ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoFrontal', activa:true})} />
                <MenuButton icon={Camera} label="Trasera" status={userData.fotoTraseraVerificada ? 'verificado' : (userData.fotoTrasera ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoTrasera', activa:true})} />
                <MenuButton icon={Camera} label="Lat. Izquierdo" status={userData.fotoLatIzqVerificada ? 'verificado' : (userData.fotoLatIzq ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatIzq', activa:true})} />
                <MenuButton icon={Camera} label="Lat. Derecho" status={userData.fotoLatDerVerificada ? 'verificado' : (userData.fotoLatDer ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatDer', activa:true})} />
              </div>
            </div>

            {/* MENSAJE DE RECHAZO */}
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

        {/* PANEL ADMINISTRATIVO (CON REPORTES) */}
        {view === 'admin' && (
          <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white">
              <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl">
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div className="text-center">
                <h2 className="font-black italic uppercase text-sm tracking-tighter">Control Maestro</h2>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Panel Administrativo</p>
              </div>
              <button onClick={cargarDatosAdmin} className="text-blue-400 bg-blue-400/10 p-2 rounded-xl">
                <RefreshCw size={20} />
              </button>
            </div>

            {/* SELECTOR DE SUB-PESTAÑAS (3 OPCIONES) */}
            <div className="flex bg-slate-900 p-1 border-b border-white/5">
              <button onClick={() => setSubPestañaAdmin('pendientes')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'pendientes' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-600'}`}>
                Pendientes ({usuariosAdmin.filter(u => (u.kycFoto && !u.kycVerificado) || (u.fotoFrontal && !u.fotoFrontalVerificada)).length})
              </button>
              <button onClick={() => setSubPestañaAdmin('reportes')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'reportes' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-600'}`}>
                Reportes ({reportesAdmin.length})
              </button>
              <button onClick={() => setSubPestañaAdmin('aprobados')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'aprobados' ? 'text-green-500 border-b-2 border-green-500' : 'text-slate-600'}`}>
                Aprobados ({usuariosAdmin.filter(u => u.kycVerificado).length})
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
              {cargando ? (
                <p className="text-center p-10 text-slate-500 italic animate-pulse text-xs uppercase font-black">Sincronizando...</p>
              ) : subPestañaAdmin === 'reportes' ? (
                /* VISTA DE REPORTES */
                reportesAdmin.length === 0 ? (
                  <p className="text-center text-slate-700 font-black uppercase italic text-[10px] mt-20">No hay reportes activos</p>
                ) : (
                  reportesAdmin.map(r => (
                    <div key={r.id} className="bg-slate-900 border border-red-500/20 rounded-[25px] p-5 space-y-3 text-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                            <AlertCircle size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase italic tracking-tighter">
                              Denunciado: {r.nombreReportado}
                            </p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase">Por: {r.nombreReportador}</p>
                          </div>
                        </div>
                        <button onClick={() => resolverReporte(r.id)} className="bg-slate-800 p-2 rounded-lg text-slate-400">
                          <ShieldCheck size={16} />
                        </button>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">"{r.motivo}"</p>
                      </div>
                    </div>
                  ))
                )
              ) : (

                /* VISTA DE USUARIOS PENDIENTES/APROBADOS */
                usuariosAdmin
                  .filter(u => subPestañaAdmin === 'pendientes' ? ((u.kycFoto && !u.kycVerificado) || (u.fotoFrontal && !u.fotoFrontalVerificada)) : u.kycVerificado)
                  .map(u => {
                    const estaExpandido = usuarioExpandidoAdmin === u.id;
                    const estaSuspendido = u.cuentaSuspendida === true;
                    
                    return (
                      <div key={u.id} className={`bg-slate-900 border ${estaSuspendido ? 'border-red-900' : 'border-white/5'} rounded-[25px] overflow-hidden transition-colors`}>
                        <button onClick={() => setUsuarioExpandidoAdmin(estaExpandido ? null : u.id)} className="w-full flex items-center justify-between p-5 text-white relative">
                          
                          {/* Etiqueta visual si está suspendido */}
                          {estaSuspendido && (
                            <div className="absolute top-0 right-0 bg-red-600 text-white text-[7px] font-black uppercase px-2 py-1 rounded-bl-xl">Suspendido</div>
                          )}

                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 ${estaSuspendido ? 'bg-red-950/50 text-red-500' : 'bg-slate-800 text-white'} rounded-full flex items-center justify-center font-black text-xs`}>
                              {u.nombre?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className={`font-black text-xs uppercase italic ${estaSuspendido ? 'text-slate-500 line-through' : 'text-white'}`}>{u.nombre}</p>
                              <p className="text-[9px] text-slate-500 font-bold">{u.correo || u.email}</p>
                            </div>
                          </div>
                          <ChevronRight size={18} className={`text-slate-600 transition-transform ${estaExpandido ? 'rotate-90' : ''}`} />
                        </button>
                        
                        {estaExpandido && (
                          <div className="p-6 pt-0 space-y-5 animate-in slide-in-from-top duration-200">
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { img: u.kycFoto, label: 'Cédula' }, 
                                { img: u.selfieFoto, label: 'Selfie' }, 
                                { img: u.fotoFrontal, label: 'Auto' }
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
                                // Si está suspendido, solo mostramos Reactivar
                                <button onClick={() => reactivarUsuario(u.id)} className="w-full bg-slate-800 text-white p-3 rounded-xl font-black text-[10px] uppercase border border-slate-700 active:scale-95 transition-all">
                                  Reactivar Cuenta
                                </button>
                              ) : (
                                // Si NO está suspendido, mostramos las opciones normales
                                <>
                                  {subPestañaAdmin === 'pendientes' && (
                                    <div className="flex gap-2">
                                      <button onClick={() => aprobarUsuario(u.id)} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-black text-[10px] uppercase">Aprobar</button>
                                      <button onClick={() => rechazarDocumentos(u.id)} className="flex-1 bg-amber-500/20 text-amber-500 p-3 rounded-xl font-black text-[10px] uppercase">Rechazar Fotos</button>
                                    </div>
                                  )}
                                  <button onClick={() => suspenderUsuario(u.id)} className="w-full bg-red-950/40 text-red-500 p-3 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all">
                                    Suspender Usuario
                                  </button>
                                </>
                              )}
                            </div>
                            
                          </div>
                        )}     
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* MODALES DE EDICIÓN Y CÁMARA */}
      {modalVisible && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom">
            <h4 className="text-[10px] font-black text-blue-600 uppercase mb-6 italic tracking-widest text-center">
              Editar {tipoEdicion?.label}
            </h4>
            {tipoEdicion?.id === 'bio' ? (
              <textarea value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-6 rounded-3xl font-medium text-sm mb-8 outline-none border-2 border-slate-100 min-h-[150px] resize-none text-slate-600 leading-relaxed" placeholder="Ej: Hola, soy Luis..." autoFocus />
            ) : (
              <input value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg mb-8 outline-none border-2 border-slate-100 uppercase text-center" autoFocus />
            )}
            <button onClick={guardarCambios} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg active:scale-95 transition-transform">Guardar Cambios</button>
          </div>
        </div>
      )}
      
      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col p-6 items-center justify-center space-y-6">
          {!fotoDocTemporal ? (
            <>
              <p className="text-white text-sm font-black uppercase italic tracking-widest text-center">Capturar {pasoDocumento.tipo}</p>
              <div className="w-full aspect-video bg-slate-800 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center"><Camera size={40} className="text-slate-700" /></div>
              <button onClick={capturarDocumento} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs">Tomar Foto</button>
              <button onClick={() => setPasoDocumento({...pasoDocumento, activa: false})} className="text-slate-500 font-black uppercase text-[10px]">Cancelar</button>
            </>
          ) : (
            <>
              <div className="w-full aspect-video rounded-3xl overflow-hidden border-4 border-blue-500"><img src={fotoDocTemporal} className="w-full h-full object-cover" /></div>
              <button onClick={subirDocumentoFinal} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs">Enviar Documento</button>
              <button onClick={() => setFotoDocTemporal(null)} className="text-white font-black uppercase text-[10px]">Repetir</button>
            </>
          )}
        </div>
      )}

      {fotoZoom && (
        <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setFotoZoom(null)}>
          <img src={fotoZoom} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" />
        </div>
      )}

      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 items-center justify-center text-center">
          {!fotoTemporal ? (
            <>
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center mb-10"><User size={80} className="text-orange-200" /></div>
              <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs">Tomar Foto Perfil</button>
              <button onClick={() => setPasoFoto(false)} className="text-slate-400 font-black uppercase text-[10px] mt-6">Cerrar</button>
            </>
          ) : (
            <>
              <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-blue-50 mb-10"><img src={fotoTemporal} className="w-full h-full object-cover" /></div>
              <button onClick={subirFotoConfirmada} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs">Confirmar Foto</button>
              <button onClick={() => setFotoTemporal(null)} className="text-slate-400 font-black uppercase text-[10px] mt-6">Elegir otra</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// COMPONENTE DE BOTÓN (REUTILIZABLE)
const MenuButton = ({ icon: Icon, label, value, status, onClick }: any) => {
  let statusText = value || "Configurar";
  let statusColor = "text-blue-500";
  if (status === 'revision') { statusText = "REVISIÓN ⏳"; statusColor = "text-amber-500"; }
  if (status === 'verificado') { statusText = "LISTO ✅"; statusColor = "text-green-600"; }
  if (status === 'rechazado') { statusText = "REINTENTAR ⚠️"; statusColor = "text-orange-600"; }

  return (
    <button 
      onClick={onClick} 
      disabled={status === 'verificado' || status === 'revision'} 
      className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 disabled:opacity-80 overflow-hidden"
    >
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm flex-shrink-0">
          <Icon size={20} />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5 truncate">
            {label}
          </p>
          <p className={`text-xs font-black uppercase ${statusColor} truncate`}>
            {statusText}
          </p>
        </div>
      </div>
      {status !== 'verificado' && status !== 'revision' && (
        <ChevronRight size={18} className="text-slate-200 ml-3 flex-shrink-0" />
      )}
    </button>
  );
};
