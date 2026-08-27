import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendEmailVerification } from 'firebase/auth';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth, signOut } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  ShieldCheck, AlertCircle, AlertTriangle, Car, Palette, 
  Hash, Gauge, LogOut, Camera, Image as ImageIcon,
  BookOpen, Users, Clock, X 
} from 'lucide-react';
import { calcularRangoGlobal } from '../../utils/rangoUsuario';
import { getFunctions, httpsCallable } from 'firebase/functions';

const auth = getAuth();

// --- MODAL DE REGLAS ---
const ModalComoFunciona = ({ isOpen, onClose }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 pb-10 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">¿Cómo funciona?</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-5 rounded-[25px] flex gap-4">
            <div className="mt-1"><Users className="text-blue-600" size={24} /></div>
            <div>
              <h3 className="font-black uppercase text-[11px] text-blue-800 tracking-widest mb-1">No somos un taxi privado</h3>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">Dame la Cola conecta a personas que van hacia la misma ciudad. El chofer puede recoger a otros pasajeros en el camino para llenar los asientos vacíos.</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-[25px] flex gap-4">
            <div className="mt-1"><ShieldCheck className="text-emerald-600" size={24} /></div>
            <div>
              <h3 className="font-black uppercase text-[11px] text-emerald-800 tracking-widest mb-1">Costos compartidos</h3>
              <p className="text-xs text-emerald-700 font-medium leading-relaxed">El precio no es el de un viaje privado. Pagas solo por tu asiento para ayudar al conductor a cubrir los gastos de la ruta (gasolina, peajes, etc).</p>
            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-[25px] flex gap-4">
            <div className="mt-1"><Clock className="text-amber-600" size={24} /></div>
            <div>
              <h3 className="font-black uppercase text-[11px] text-amber-800 tracking-widest mb-1">Puntualidad y Respeto</h3>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">Al ser un viaje compartido, el tiempo de todos vale. Llega a la hora acordada al punto de encuentro para no retrasar a los demás pasajeros.</p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-slate-900 text-white rounded-full p-4 font-black uppercase text-xs mt-6 active:scale-95 transition-all">
          ¡Entendido!
        </button>
      </div>
    </div>
  );
};

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
  const [toast, setToast] = useState<{texto: string, tipo: 'exito'|'error'} | null>(null);
  const [modalClave, setModalClave] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  
  const [showReglas, setShowReglas] = useState(false);

  useEffect(() => {
    let listenerHandle: any = null;
    const configurarListener = async () => {
      listenerHandle = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive && auth.currentUser) {
          try {
            await auth.currentUser.reload();
            setUserData((prev: any) => prev ? { ...prev } : prev);
          } catch (error) {
            console.error("Error recargando auth:", error);
          }
        }
      });
    };
    configurarListener();
    return () => {
      if (listenerHandle) listenerHandle.remove();
    };
  }, []);
  
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  
  const view = pestañaActiva || 'publico';
  
  const viajesCond = userData.viajesRealizados || 0;
  const viajesPas = userData.viajesComoPasajero || 0;
  const totalTrayectoria = viajesCond + viajesPas;
  
  const rangoDatos = calcularRangoGlobal(totalTrayectoria);
  const faltan = rangoDatos.meta - totalTrayectoria;
  const porcentajeNivel = Math.min((totalTrayectoria / rangoDatos.meta) * 100, 100);
  
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
      setToast({ texto: "Foto de perfil actualizada", tipo: "exito" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) { 
      console.error(e); 
      setToast({ texto: "Error al subir foto", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };
  
  const togglePreferencia = async (campo: string, nuevoEstado: boolean) => {
    try {
      const uid = auth.currentUser?.uid || userData.id;
      await updateDoc(doc(db, "usuarios", uid), { [campo]: nuevoEstado });
      setUserData({ ...userData, [campo]: nuevoEstado });
    } catch (e) { console.log(e); }
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
      setToast({ texto: "Error al guardar los cambios.", tipo: "error" });
    } finally { 
      setCargando(false); 
    }
  };
  
  const capturarDocumento = async (origen: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 60, width: 1000, resultType: CameraResultType.DataUrl, source: origen, saveToGallery: false });
      if (image.dataUrl) setFotoDocTemporal(image.dataUrl);
    } catch (e) { console.log(e); }
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
        await addDoc(collection(db, "Notificaciones"), {
          idDestino: "ADMIN_TELEGRAM",
          titulo: "DOCUMENTOS PENDIENTES 🚨",
          mensaje: `El usuario ${userData.nombre || 'Desconocido'} subió su ${pasoDocumento.tipo.toUpperCase()}.`,
          timestamp: Date.now()
        });
      } catch (err) { console.error(err); }

      setToast({ texto: "Documento enviado para revisión", tipo: "exito" });
      setFotoDocTemporal(null); 
      setPasoDocumento({ ...pasoDocumento, activa: false });
    } catch (e) {
      setToast({ texto: "Error al subir documento.", tipo: "error" });
    } finally { setCargando(false); }
  };

  const cambiarPasswordSeguro = async () => {
    const user = auth.currentUser;
    if (!user || !user.email || !passActual || !passNueva) return;
    setCargando(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passActual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passNueva);
      setToast({ texto: "¡Contraseña actualizada!", tipo: "exito" });
      setModalClave(false);
      setPassActual('');
      setPassNueva('');
    } catch (error) {
      setToast({ texto: "La contraseña actual es incorrecta.", tipo: "error" });
    } finally { setCargando(false); }
  };
  
const verificarCuentaCorreo = async () => {
    if (!auth.currentUser) return;
    setCargando(true);
    try {
      const functions = getFunctions();
      const solicitarCorreo = httpsCallable(functions, 'enviarCorreoV2');
      
      await solicitarCorreo({
        idDestino: "CORREO_VERIFICACION",
        email: auth.currentUser.email?.toLowerCase().trim(),
        nombre: userData.nombre || "Viajero", 
        timestamp: Date.now()
      });

      setToast({ texto: "¡Nuevo enlace enviado! Revisa tu bandeja.", tipo: "exito" });
      setTimeout(() => setToast(null), 4000); 
      
    } catch (error) { 
      console.error("Error al pedir reenvío del correo:", error);
      setToast({ texto: "Error al solicitar el envío.", tipo: "error" });
      setTimeout(() => setToast(null), 4000); 
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstadoVerificacion = async () => {
    if (!auth.currentUser) return;
    setCargando(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setToast({ texto: "¡Correo verificado!", tipo: "exito" });
        setTimeout(() => setToast(null), 4000);
        setUserData({...userData}); 
      } else {
        setToast({ texto: "Aún no verificado", tipo: "error" });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setCargando(false); 
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] w-[90vw] max-w-sm animate-in slide-in-from-top fade-in duration-300">
          <div className={`px-5 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white ${toast.tipo === 'exito' ? 'bg-slate-900' : 'bg-red-500'}`}>
            {toast.tipo === 'exito' ? <ShieldCheck size={24} className="text-green-400 shrink-0" /> : <AlertTriangle size={24} className="shrink-0" />}
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
              <div className="bg-blue-600 rounded-[30px] p-5 shadow-lg border-b-4 border-blue-800">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl text-white"><AlertCircle size={20} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase italic tracking-widest mb-1">Correo sin verificar</p>
                      <p className="text-[11px] font-bold text-blue-100">Revisa tu email para activar tu cuenta.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={verificarCuentaCorreo} className="flex-1 bg-white/10 text-white border border-white/20 py-2.5 rounded-2xl text-[9px] font-black uppercase">Reenviar Link</button>
                    <button onClick={actualizarEstadoVerificacion} className="flex-1 bg-white text-blue-600 py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm">¡Ya lo hice! ✨</button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5">
             <div className={`${rangoDatos.bgCard} text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse`}> {rangoDatos.titulo}
            </div>
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
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1"> Próximo Nivel: {faltan > 0 ? rangoDatos.meta : 'MÁXIMO'} VJS </p> <p className="text-sm font-black text-slate-800 italic uppercase">
                  {faltan > 0 ? `Te faltan ${faltan} viajes` : "¡Eres Leyenda!"}
                  </p>
                 </div>
                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full"> {totalTrayectoria} / {rangoDatos.meta} VJS </div>
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
            
            <button 
              onClick={() => setShowReglas(true)} 
              className="w-full flex items-center justify-between p-5 bg-blue-50 border border-blue-100 rounded-[30px] active:scale-95 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <BookOpen size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-black uppercase text-[12px] text-blue-900 tracking-widest mb-0.5">Guía de la App</h3>
                  <p className="text-[10px] text-blue-700 font-bold">¿Cómo funciona Dame la Cola?</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-blue-300" />
            </button>

            {userData.estadoRevision === 'rechazado' && !userData.kycFoto && (
              <div className="mx-2 bg-orange-50 border-2 border-orange-100 rounded-[30px] p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500 p-2 rounded-xl text-white"><AlertCircle size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-orange-600 uppercase italic tracking-widest mb-1">Documentos Adicionales</p>
                    <p className="text-[11px] font-bold text-slate-700">{userData.mensajeAdmin || "Por favor sube las fotos nuevamente."}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Información Básica</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Cédula (Número)" value={userData.cedulaNumero} onClick={() => { if (userData.kycVerificado) { setToast({ texto: "Por seguridad, no puedes cambiar la cédula vinculada.", tipo: "error" }); } else { setTipoEdicion({id:'cedulaNumero', label:'Cédula', valor:userData.cedulaNumero}); setNuevoValor(userData.cedulaNumero); setModalVisible(true); } }} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono); setModalVisible(true); }} />
                <MenuButton icon={UserCog} label="Sobre mí (Bio)" value={userData?.bio || "Escribe algo sobre ti..."} onClick={() => { setTipoEdicion({id: 'bio', label: 'Biografía', valor: userData?.bio}); setNuevoValor(userData?.bio || ""); setModalVisible(true); }} />
                <MenuButton icon={User} label="Correo Electrónico" value={userData.correo || auth.currentUser?.email} onClick={() => { setToast({ texto: "El correo no puede modificarse de forma directa.", tipo: "error" }); }} />
                <MenuButton icon={ShieldCheck} label="Seguridad" value="Cambiar Contraseña" onClick={() => setModalClave(true)} />   
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
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[3px] ml-4 italic">Fotos del Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Camera} label="Frontal" status={userData.fotoFrontalVerificada ? 'verificado' : (userData.fotoFrontal ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoFrontal', activa:true})} />
                <MenuButton icon={Camera} label="Trasera" status={userData.fotoTraseraVerificada ? 'verificado' : (userData.fotoTrasera ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoTrasera', activa:true})} />
                <MenuButton icon={Camera} label="Lat. Izquierdo" status={userData.fotoLatIzqVerificada ? 'verificado' : (userData.fotoLatIzq ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatIzq', activa:true})} />
                <MenuButton icon={Camera} label="Lat. Derecho" status={userData.fotoLatDerVerificada ? 'verificado' : (userData.fotoLatDer ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatDer', activa:true})} />
              </div>
            </div>

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 mt-4"><LogOut size={14} /> Cerrar Sesión</button>
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
                   Verifica bien los números. Una vez validada, <span className="font-black">no se podrá editar.</span>
                 </p>
               </div>
            )}
            {tipoEdicion?.id === 'bio' ? (
              <textarea value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-6 rounded-3xl font-medium text-sm mb-8 outline-none border-2 border-slate-100 min-h-[150px] resize-none text-slate-600" placeholder="Ej: Hola..." autoFocus />
            ) : (
              <input value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg mb-8 outline-none border-2 border-slate-100 uppercase text-center" autoFocus />
            )}
            <button disabled={cargando} onClick={() => guardarCambios()} className="w-full bg-blue-600 text-white p-5 rounded-[25px] disabled:opacity-50 font-black uppercase text-xs shadow-lg">Guardar Cambios</button>
          </div>
        </div>
      )}

      {confirmacionCedula && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => !cargando && setConfirmacionCedula(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-100"><AlertTriangle size={30} /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase italic mb-2">Confirmación de Cédula</h3>
            <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">¿Estás seguro de que tu documento es <span className="text-slate-800 font-black text-sm">{nuevoValor}</span>?</p>
            <div className="flex gap-3">
              <button disabled={cargando} onClick={() => setConfirmacionCedula(false)} className="flex-1 bg-slate-100 text-slate-500 font-black uppercase text-[10px] py-4 rounded-2xl">Corregir</button>
              <button disabled={cargando} onClick={() => guardarCambios(true)} className="flex-[1.5] bg-orange-500 text-white font-black uppercase text-[10px] py-4 rounded-2xl shadow-lg">Sí, Confirmar</button>
            </div>
          </div>
        </div>
      )}
      
      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex flex-col p-6 items-center justify-center space-y-6 animate-in fade-in duration-200">
          {!fotoDocTemporal ? (
            <div className="bg-slate-950 p-8 rounded-[40px] border border-white/5 w-full max-w-sm text-center shadow-2xl">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-900/50"><Camera size={35} className="text-blue-400" /></div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Subir documento</p>
              <h3 className="text-xl font-black italic text-white uppercase mb-8">Adjuntar Imagen</h3>
              <div className="space-y-3">
                <button onClick={() => capturarDocumento(CameraSource.Camera)} className="w-full bg-blue-600 text-white rounded-2xl py-4 flex items-center justify-center gap-3"><Camera size={18} /><span className="font-black text-[11px] uppercase tracking-widest">Abrir Cámara</span></button>
                <button onClick={() => capturarDocumento(CameraSource.Photos)} className="w-full bg-slate-800 text-blue-400 border border-blue-500/30 rounded-2xl py-4 flex items-center justify-center gap-3"><ImageIcon size={18} /><span className="font-black text-[11px] uppercase tracking-widest">Abrir Galería</span></button>
              </div>
              <button onClick={() => setPasoDocumento({...pasoDocumento, activa: false})} className="text-slate-600 font-black uppercase text-[10px] mt-8 tracking-widest">Cancelar</button>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-4 text-center">
              <div className="w-full aspect-video rounded-3xl overflow-hidden border-4 border-blue-500 shadow-2xl"><img src={fotoDocTemporal} className="w-full h-full object-cover" /></div>
              <button disabled={cargando} onClick={subirDocumentoFinal} className="w-full disabled:opacity-50 bg-blue-600 text-white py-5 rounded-[25px] font-black uppercase text-xs shadow-xl">{cargando ? "SUBIENDO..." : "Enviar Documento"}</button>
              <button disabled={cargando} onClick={() => setFotoDocTemporal(null)} className="w-full text-slate-400 font-black uppercase text-[10px] py-3">Elegir otra imagen</button>
            </div>
          )}
        </div>
      )}
      
      {modalClave && (
        <div className="fixed inset-0 bg-[#0b1120]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-blue-600/20 p-4 rounded-2xl mb-4"><ShieldCheck className="text-blue-500" size={32} /></div>
              <h2 className="text-xl font-black italic text-white mb-2">Seguridad</h2>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-6 text-center">Cambiar Contraseña</p>
              <div className="w-full space-y-4">
                <input type="password" placeholder="Contraseña Actual" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-sm font-bold text-white" value={passActual} onChange={(e) => setPassActual(e.target.value)} />
                <input type="password" placeholder="Nueva Contraseña" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-sm font-bold text-white" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                <button onClick={() => { setModalClave(false); setPassActual(''); setPassNueva(''); }} className="p-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
                <button onClick={cambiarPasswordSeguro} className="p-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] shadow-lg">Actualizar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 items-center justify-center text-center">
          {!fotoTemporal ? (
            <>
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center mb-10"><User size={80} className="text-orange-200" /></div>
              <div className="w-full space-y-3">
                <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-lg"><Camera size={18} /> Tomar Foto Ahora</button>
                <button onClick={() => seleccionarImagen(CameraSource.Photos)} className="w-full bg-slate-900 text-white p-5 rounded-[25px] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-lg"><FileText size={18} className="text-blue-400" /> Elegir de la Galería</button>
              </div>
              <button onClick={() => setPasoFoto(false)} className="text-slate-400 font-black uppercase text-[10px] mt-8 tracking-widest">Tal vez luego</button>
            </>
          ) : (
            <>
              <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-blue-50 mb-10"><img src={fotoTemporal} className="w-full h-full object-cover" /></div>
              <button disabled={cargando} onClick={subirFotoConfirmada} className="w-full bg-blue-600 disabled:opacity-50 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">{cargando ? "SUBIENDO..." : "Confirmar Foto"}</button>
              <button disabled={cargando} onClick={() => setFotoTemporal(null)} className="text-slate-400 font-black uppercase text-[10px] mt-6 tracking-widest">Elegir otra</button>
            </>
          )}
        </div>
      )}

      {/* RENDER DEL MODAL DE REGLAS */}
      <ModalComoFunciona isOpen={showReglas} onClose={() => setShowReglas(false)} />

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
