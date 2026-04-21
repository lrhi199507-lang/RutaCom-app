import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  Calendar, CheckCircle2, Mail, ShieldCheck,
  Car, Palette, Hash, Gauge, LogOut, FileCheck, Camera
} from 'lucide-react';

export const VistaPerfil = ({ userData, setUserData, handleLogout, pestañaActiva, setPestañaActiva }: any) => {
  // --- ESTADOS DEL SISTEMA ---
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fotoDocTemporal, setFotoDocTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [pasoDocumento, setPasoDocumento] = useState<{tipo: string, activa: boolean, reglas?: string}>({tipo: 'cedula', activa: false});
  const [modalClave, setModalClave] = useState(false);
  const [claves, setClaves] = useState({ actual: "", nueva: "" });
  
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  const view = pestañaActiva || 'publico';

  // --- LÓGICA DE RANGOS (Basado en Experiencia de Viajes) ---
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
    default: return "bg-blue-600"; // NOVATO
  }
};

const rangoActual = obtenerRango();

  // Lógica para el siguiente nivel
const calcularSiguienteNivel = () => {
  const total = totalTrayectoria;
  if (total < 10) return { meta: 10, faltan: 10 - total, nombre: "PLATA" };
  if (total < 20) return { meta: 20, faltan: 20 - total, nombre: "ORO" };
  if (total < 50) return { meta: 50, faltan: 50 - total, nombre: "LEYENDA" };
  return { meta: total, faltan: 0, nombre: "MÁXIMO" };
};

const proximoNivel = calcularSiguienteNivel();
const porcentajeNivel = Math.min((totalTrayectoria / proximoNivel.meta) * 100, 100);
  
  // --- LÓGICA DE SEGURIDAD (El Progreso de Verificación) ---
  const puntosSeguridad = [
    !!userData.kycVerificado,         // 1. Cédula
    !!userData.licenciaVerificada,    // 2. Licencia
    !!userData.circulacionVerificada, // 3. Circulación
    !!userData.rcvVerificado,         // 4. Seguro RCV
    !!userData.selfieVerificada,      // 5. Selfie
    !!userData.fotoFrontalVerificada, // 6. Foto Carro Frontal
    !!userData.fotoTraseraVerificada, // 7. Foto Carro Trasera
    !!userData.fotoLatIzqVerificada,  // 8. Foto Carro Lateral Izq
    !!userData.fotoLatDerVerificada   // 9. Foto Carro Lateral Der
  ];

  const totalRequeridos = puntosSeguridad.length; 
  const totalCompletados = puntosSeguridad.filter(Boolean).length;
  const porcentajeConfianza = (totalCompletados / totalRequeridos) * 100;

  const cambiarContraseña = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user && claves.nueva.length >= 6) {
    setCargando(true);
    try {
      // Nota: Si da error de "sensitive-operation", hay que reautenticar.
      // Por ahora probamos el cambio directo:
      await updatePassword(user, claves.nueva);
      alert("Contraseña actualizada con éxito");
      setModalClave(false);
      setClaves({ actual: "", nueva: "" });
    } catch (e: any) {
      alert("Error: Para cambiar la clave debes haber iniciado sesión recientemente.");
    } finally {
      setCargando(false);
    }
  } else {
    alert("La nueva contraseña debe tener al menos 6 caracteres.");
  }
};
  // --- FUNCIONES DE CÁMARA Y DATOS ---
  const seleccionarImagen = async (source: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 25, width: 600, resultType: CameraResultType.DataUrl, source: source
      });
      if (image.dataUrl) setFotoTemporal(image.dataUrl); 
    } catch (e) { console.log("Cancelado"); }
  };

  const subirFotoConfirmada = async () => {
    const userId = userData?.uid || userData?.id;
    if (!fotoTemporal || !userId) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userId);
      await updateDoc(userRef, { fotoPerfil: fotoTemporal });
      if (setUserData) setUserData({ ...userData, fotoPerfil: fotoTemporal });
      setFotoTemporal(null); setPasoFoto(false); setRefresh(prev => prev + 1);
    } catch (e) { alert("Error al subir foto"); } finally { setCargando(false); }
  };

  const guardarCambios = async () => {
    const userId = userData?.uid || userData?.id;
    if (!tipoEdicion || !userId || cargando) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userId);
      let updateData = {};
      const camposVehiculo = ['placa', 'modelo', 'color', 'marca'];
      
      if (camposVehiculo.includes(tipoEdicion.id)) {
        updateData = { [`vehiculo.${tipoEdicion.id}`]: nuevoValor.toUpperCase() };
        if (setUserData) {
          const newVehiculo = { ...(userData.vehiculo || {}), [tipoEdicion.id]: nuevoValor.toUpperCase() };
          setUserData({ ...userData, vehiculo: newVehiculo });
        }
      } else {
        updateData = { [tipoEdicion.id]: nuevoValor };
        if (setUserData) setUserData({ ...userData, [tipoEdicion.id]: nuevoValor });
      }
      await updateDoc(userRef, updateData);
      setModalVisible(false); setRefresh(prev => prev + 1);
    } catch (e) { alert("Error al guardar"); } finally { setCargando(false); }
  };

  const formatearCedula = (valor: string) => {
  // Solo deja números
  const soloNumeros = valor.replace(/\D/g, '');
  // Agrega puntos cada 3 dígitos
  return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

  const formatearFecha = (valor: string) => {
  let v = valor.replace(/\D/g, '').slice(0, 8); // Solo 8 números
  if (v.length >= 5) {
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  } else if (v.length >= 3) {
    return `${v.slice(0, 2)}/${v.slice(2)}`;
  }
  return v;
};
  

  const capturarDocumento = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 35, width: 900, resultType: CameraResultType.DataUrl, source: CameraSource.Camera 
      });
      if (image.dataUrl) setFotoDocTemporal(image.dataUrl);
    } catch (e) { console.log("Cancelado"); }
  };

  const subirDocumentoFinal = async () => {
    const userId = userData?.uid || userData?.id;
    if (!fotoDocTemporal || !userId) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userId);
      let campoFoto = ""; let campoEstado = "";
      
      // Mapeo dinámico de campos
      switch(pasoDocumento.tipo) {
        case 'cedula': campoFoto = 'kycFoto'; campoEstado = 'kycVerificado'; break;
        case 'licencia': campoFoto = 'licenciaFoto'; campoEstado = 'licenciaVerificada'; break;
        case 'circulacion': campoFoto = 'circulacionFoto'; campoEstado = 'circulacionVerificada'; break;
        case 'rcv': campoFoto = 'rcvFoto'; campoEstado = 'rcvVerificado'; break;
        case 'selfie': campoFoto = 'selfieFoto'; campoEstado = 'selfieVerificada'; break;
        case 'antecedentes': campoFoto = 'antecedentesFoto'; campoEstado = 'antecedentesVerificados'; break;
        case 'fotoFrontal': campoFoto = 'fotoFrontal'; campoEstado = 'fotoFrontalVerificada'; break;
        case 'fotoTrasera': campoFoto = 'fotoTrasera'; campoEstado = 'fotoTraseraVerificada'; break;
        case 'fotoLatIzq': campoFoto = 'fotoLatIzq'; campoEstado = 'fotoLatIzqVerificada'; break;
        case 'fotoLatDer': campoFoto = 'fotoLatDer'; campoEstado = 'fotoLatDerVerificada'; break;
      }

      await updateDoc(userRef, { [campoFoto]: fotoDocTemporal, [campoEstado]: false });
      if (setUserData) setUserData({ ...userData, [campoFoto]: fotoDocTemporal, [campoEstado]: false });
      setFotoDocTemporal(null); setPasoDocumento({ tipo: 'cedula', activa: false });
      alert("Enviado. Pronto revisaremos tus datos.");
    } catch (e) { alert("Error al subir"); } finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-6">
            {/* CARD PRINCIPAL */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5">
              <div className={`${obtenerColorRango(rangoActual)} text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse`}> {rangoActual}
              </div>
              </div>
              
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-slate-200 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} key={refresh} alt="P" className="w-full h-full object-cover" /> : <User size={50} className="text-slate-200 mt-4" />}
                  </div>
                </div>
                <button onClick={() => setPasoFoto(true)} className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full border-4 border-white shadow-lg active:scale-90 transition-transform"><Edit2 size={14} /></button>
              </div>

              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">{userData.nombre || "Usuario"}</h2>
              
              <div className="flex justify-center gap-6 mt-4 border-t border-slate-50 pt-4">
                  <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Conductor</p><p className="font-black text-blue-600 italic leading-none">{viajesCond} VJS</p></div>
                  <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Pasajero</p><p className="font-black text-orange-500 italic leading-none">{viajesPas} VJS</p></div>
              </div>
            </div>

            {/* SELLO DE VERIFICACIÓN DE VEHÍCULO (Solo si está todo aprobado) */}
{(userData.fotoFrontalVerificada && userData.fotoTraseraVerificada && 
  userData.fotoLatIzqVerificada && userData.fotoLatDerVerificada) && (
  <div className="mt-4 flex items-center justify-center gap-2 bg-green-50 py-2 px-4 rounded-2xl border border-green-100 animate-bounce">
    <ShieldCheck size={16} className="text-green-600" />
    <span className="text-[10px] font-black text-green-700 uppercase italic">Vehículo Inspeccionado por Dame la cola</span>
  </div>
)}
            

            {/* SECCIÓN DE NIVEL Y TRAYECTORIA */}
<div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-4">
  <div className="flex justify-between items-end">
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo Nivel: {proximoNivel.nombre}</p>
      <p className="text-sm font-black text-slate-800 italic uppercase">
        {proximoNivel.faltan > 0 
          ? `Te faltan ${proximoNivel.faltan} viajes` 
          : "¡Eres una Leyenda!"}
      </p>
    </div>
    <div className="text-right">
      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
        {totalTrayectoria} / {proximoNivel.meta} VJS
      </span>
    </div>
  </div>

  {/* Barra de Progreso de Nivel */}
  <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
    <div 
      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000"
      style={{ width: `${porcentajeNivel}%` }}
    />
  </div>

  <div className="flex justify-between">
    <p className="text-[7px] font-black text-slate-300 uppercase">Nivel Actual</p>
    <p className="text-[7px] font-black text-slate-300 uppercase">Meta {proximoNivel.nombre}</p>
  </div>
</div>
  
            {/* SECCIÓN DE PROGRESO DE SEGURIDAD */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Seguridad del Perfil</p>
                  <p className="text-lg font-black text-slate-800 uppercase">
                    {totalCompletados} de {totalRequeridos} <span className="text-blue-600 italic">Verificados</span>
                  </p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl text-2xl font-black text-orange-500">
                  {porcentajeConfianza.toFixed(0)}%
                </div>
              </div>
              
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${porcentajeConfianza}%` }} 
                />
              </div>
              
              <p className="text-[7px] font-bold text-slate-400 mt-4 uppercase italic leading-relaxed">
                * Tu documentación está en proceso de validación por el equipo de "Dame la cola".
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            
            {/* GRUPO: PERSONAL */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Información Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={UserCog} label="Nombre Completo" value={userData?.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData?.nombre}); setNuevoValor(userData?.nombre || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Número de Cédula" value={userData?.cedulaNumero} onClick={() => { setTipoEdicion({id:'cedulaNumero', label:'Cédula', valor:userData?.cedulaNumero}); setNuevoValor(userData?.cedulaNumero || ""); setModalVisible(true); }} />
                <MenuButton icon={Calendar} label="Fecha de Nacimiento" value={userData?.fechaNacimiento} onClick={() => { setTipoEdicion({id:'fechaNacimiento', label:'Fecha', valor:userData?.fechaNacimiento}); setNuevoValor(userData?.fechaNacimiento || ""); setModalVisible(true); }} />
                <MenuButton icon={Phone} label="Teléfono" value={userData?.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData?.telefono}); setNuevoValor(userData?.telefono || ""); setModalVisible(true); }} />
              </div>
            </div>
"Seguridad" */}
<div className="space-y-3">
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Seguridad</p>
  <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
    <MenuButton 
      icon={ShieldCheck} 
      label="Contraseña de Acceso" 
      value="••••••••" 
      onClick={() => setModalClave(true)} 
    />
  </div>
</div>

            {/* GRUPO: VEHÍCULO */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Especificaciones del Auto</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={Car} label="Marca" value={userData?.vehiculo?.marca} onClick={() => { setTipoEdicion({id:'marca', label:'Marca', valor:userData?.vehiculo?.marca}); setNuevoValor(userData?.vehiculo?.marca || ""); setModalVisible(true); }} />
                <MenuButton icon={Gauge} label="Modelo" value={userData?.vehiculo?.modelo} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData?.vehiculo?.modelo}); setNuevoValor(userData?.vehiculo?.modelo || ""); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color" value={userData?.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData?.vehiculo?.color}); setNuevoValor(userData?.vehiculo?.color || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa / Matrícula" value={userData?.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData?.vehiculo?.placa}); setNuevoValor(userData?.vehiculo?.placa || ""); setModalVisible(true); }} />
              </div>
            </div>

            {/* GRUPO: ESTADO DEL CARRO */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[3px] ml-4 italic">Estado del Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2 grid grid-cols-1">
                <MenuButton icon={Camera} label="Foto Frontal" status={userData?.fotoFrontalVerificada ? 'verificado' : (userData?.fotoFrontal ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoFrontal', activa:true, reglas: "Enfoca bien la placa y los faros"})} />
                <MenuButton icon={Camera} label="Foto Trasera" status={userData?.fotoTraseraVerificada ? 'verificado' : (userData?.fotoTrasera ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoTrasera', activa:true, reglas: "Debe verse la placa trasera"})} />
                <MenuButton icon={Camera} label="Lateral Izquierda" status={userData?.fotoLatIzqVerificada ? 'verificado' : (userData?.fotoLatIzq ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatIzq', activa:true, reglas: "Costado del conductor"})} />
                <MenuButton icon={Camera} label="Lateral Derecha" status={userData?.fotoLatDerVerificada ? 'verificado' : (userData?.fotoLatDer ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatDer', activa:true, reglas: "Costado del acompañante"})} />
              </div>
            </div>

            {/* GRUPO: LEGAL */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Documentación Legal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={FileText} label="Foto de Cédula" status={userData?.kycVerificado ? 'verificado' : (userData?.kycFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'cedula', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Licencia de Conducir" status={userData?.licenciaVerificada ? 'verificado' : (userData?.licenciaFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'licencia', activa:true})} />
                <MenuButton icon={FileText} label="Carnet de Circulación" status={userData?.circulacionVerificada ? 'verificado' : (userData?.circulacionFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'circulacion', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Seguro R.C.V" status={userData?.rcvVerificado ? 'verificado' : (userData?.rcvFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'rcv', activa:true})} />
                <MenuButton icon={User} label="Selfie de Identidad" status={userData?.selfieVerificada ? 'verificado' : (userData?.selfieFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'selfie', activa:true})} />
                
                <button 
                  disabled={userData?.antecedentesVerificados || !!userData?.antecedentesFoto}
                  onClick={() => setPasoDocumento({tipo:'antecedentes', activa:true})}
                  className="w-full flex items-center justify-between p-5 border-t border-slate-50 bg-orange-50/30 active:bg-orange-100 transition-colors disabled:opacity-70"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm"><FileCheck size={20} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-orange-400 uppercase italic mb-1">Record Criminal (Opcional)</p>
                      <p className="text-xs font-black uppercase text-orange-600">{userData?.antecedentesVerificados ? "CONDUCTOR PRO 🏆" : (userData?.antecedentesFoto ? "EN REVISIÓN ⏳" : "SUBIR PARA DESTACAR")}</p>
                    </div>
                  </div>
                  {!userData?.antecedentesFoto && !userData?.antecedentesVerificados && <ChevronRight size={18} className="text-orange-200" />}
                </button>
              </div>
            </div>
            
            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all mb-10"><LogOut size={14} /> Cerrar Sesión</button>
          </div>
        )}
      </div>

      {modalClave && (
  <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalClave(false)} />
    <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom duration-300">
      <h4 className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-[2px]">ACTUALIZAR SEGURIDAD</h4>
      <p className="text-[9px] font-bold text-slate-400 mb-6 uppercase">Escribe tu nueva clave maestra</p>
      
      <input 
        type="password"
        placeholder="Nueva contraseña"
        value={claves.nueva}
        onChange={(e) => setClaves({...claves, nueva: e.target.value})}
        className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none mb-8 focus:border-blue-500 transition-colors"
      />
      
      <button 
        onClick={cambiarContraseña}
        disabled={cargando}
        className="w-full bg-slate-900 text-white p-5 rounded-[25px] font-black uppercase text-xs active:scale-95 transition-all shadow-lg"
      >
        {cargando ? 'Procesando...' : 'CAMBIAR CONTRASEÑA'}
      </button>
    </div>
  </div>
)}
      
      {/* MODAL DE EDICIÓN DE TEXTO INTELIGENTE */}
{modalVisible && (
  <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
    <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom duration-300">
      <h4 className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-[2px]">
        EDITAR {tipoEdicion?.label}
      </h4>
      
      <input 
        value={nuevoValor} 
        onChange={(e) => {
          let val = e.target.value;
          if (tipoEdicion?.id === 'cedulaNumero') {
            setNuevoValor(formatearCedula(val));
          } else if (tipoEdicion?.id === 'fechaNacimiento') {
            setNuevoValor(formatearFecha(val));
          } else {
            setNuevoValor(val);
          }
        }} 
        // Marcador de fondo (Referente)
        placeholder={
          tipoEdicion?.id === 'fechaNacimiento' ? "DD/MM/AAAA" : 
          tipoEdicion?.id === 'cedulaNumero' ? "Ej: 23.426.582" : ""
        }
        className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none mb-8 uppercase focus:border-blue-500 transition-colors placeholder:text-slate-300" 
        autoFocus 
        keyboardType={
          (tipoEdicion?.id === 'cedulaNumero' || tipoEdicion?.id === 'fechaNacimiento') 
          ? "numeric" : "default"
        }
      />
      
      <button 
        onClick={guardarCambios} 
        disabled={cargando} 
        className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs active:scale-95 transition-all shadow-lg"
      >
        {cargando ? 'Guardando...' : 'CONFIRMAR CAMBIO'}
      </button>
    </div>
  </div>
)}
      

      {/* MODAL DE CAPTURA DE DOCUMENTOS */}
      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col p-6 overflow-hidden">
          {!fotoDocTemporal ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center"><p className="text-blue-500 font-black text-[10px] uppercase italic tracking-widest mb-2">Asistente de seguridad</p><p className="text-white text-sm font-bold uppercase">{pasoDocumento.reglas || "Asegúrate de que el documento sea legible"}</p></div>
              <div className={`relative w-full shadow-2xl bg-slate-800 ${pasoDocumento.tipo === 'selfie' ? 'aspect-square rounded-full border-4 border-dashed border-blue-500/50' : 'aspect-[1.6/1] rounded-3xl border-2 border-white/20'}`}>
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/30 font-black text-[10px] uppercase italic tracking-tighter">Posiciona el documento aquí</div>
              </div>
              <button onClick={capturarDocumento} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">Capturar Foto</button>
              <button onClick={() => setPasoDocumento({tipo:'cedula', activa:false})} className="w-full text-slate-500 font-black uppercase text-[10px] mt-4">Cancelar</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-300">
              <div className={`w-full overflow-hidden border-4 border-blue-50 shadow-2xl ${pasoDocumento.tipo === 'selfie' ? 'aspect-square rounded-full' : 'aspect-[1.6/1] rounded-3xl'}`}><img src={fotoDocTemporal} className="w-full h-full object-cover" alt="Preview" /></div>
              <div className="w-full space-y-3">
                <button onClick={subirDocumentoFinal} disabled={cargando} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">{cargando ? 'Subiendo...' : 'ENVIAR A REVISIÓN'}</button>
                <button onClick={() => setFotoDocTemporal(null)} className="w-full bg-white/10 text-white p-5 rounded-[25px] font-black uppercase text-xs active:bg-white/20">REPETIR FOTO</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE FOTO DE PERFIL */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 text-center animate-in fade-in duration-300">
          {!fotoTemporal ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center border-8 border-orange-100 relative shadow-inner"><User size={100} className="text-orange-200" /></div>
              <h3 className="text-3xl font-black text-slate-800 uppercase italic">¡Sonríe!</h3>
              <div className="w-full space-y-3">
                <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">Tomar Foto</button>
                <button onClick={() => seleccionarImagen(CameraSource.Photos)} className="w-full bg-slate-100 text-slate-600 p-5 rounded-[25px] font-black uppercase text-xs">Galería</button>
              </div>
              <button onClick={() => setPasoFoto(false)} className="w-full text-slate-400 font-black uppercase text-[10px]">Cerrar</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-300">
              <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-blue-50 shadow-2xl"><img src={fotoTemporal} className="w-full h-full object-cover" alt="Preview" /></div>
              <div className="w-full space-y-3">
                <button onClick={subirFotoConfirmada} disabled={cargando} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">ESTA ME GUSTA</button>
                <button onClick={() => setFotoTemporal(null)} className="w-full bg-slate-100 text-slate-500 p-5 rounded-[25px] font-black uppercase text-xs">CAMBIAR</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// COMPONENTE DE BOTÓN DE MENÚ (REUTILIZABLE)
const MenuButton = ({ icon: Icon, label, value, status, onClick }: any) => {
  let statusText = value || "Configurar";
  let statusColor = "text-blue-500"; 
  if (status === 'revision') { statusText = "EN REVISIÓN ⏳"; statusColor = "text-amber-500"; }
  else if (status === 'verificado') { statusText = "VERIFICADO ✅"; statusColor = "text-green-600"; }

  return (
    <button 
      onClick={onClick} 
      disabled={status === 'verificado' || status === 'revision'} 
      className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors text-left disabled:opacity-90"
    >
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5 tracking-tight">{label}</p>
          <p className={`text-xs font-black uppercase tracking-tight ${statusColor}`}>{statusText}</p>
        </div>
      </div>
      {status !== 'verificado' && status !== 'revision' && <ChevronRight size={18} className="text-slate-200" />}
    </button>
  );
};
