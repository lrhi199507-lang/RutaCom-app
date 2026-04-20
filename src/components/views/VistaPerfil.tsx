import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  Lock, Calendar, CheckCircle2, Mail, ShieldCheck,
  Car, Palette, Hash, Gauge, KeyRound, LogOut
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refresh, setRefresh] = useState(0);

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  const view = pestañaActiva || 'publico';

  // --- LÓGICA DE RANGO Y CONFIANZA ---
  const totalViajes = userData.viajesRealizados || 0;
  const rango = totalViajes >= 10 ? "PLATA" : "NOVATO";
  const puntosControl = [
    { id: 'email', verificado: !!userData.email },
    { id: 'cedula', verificado: !!userData.kycVerificado },
    { id: 'licencia', verificado: !!userData.licenciaVerificada },
  ];
  const totalVerificados = puntosControl.filter(p => p.verificado).length;
  const porcentajeConfianza = (totalVerificados / 3) * 100;

  // --- FUNCIONES DE CÁMARA Y GUARDADO ---
  const seleccionarImagen = async (source: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 50, 
        allowEditing: false,
        resultType: CameraResultType.DataUrl, 
        source: source
      });
      if (image.dataUrl) {
        setFotoTemporal(image.dataUrl); 
      }
    } catch (e) { console.log("Cancelado"); }
  };
  // --- FUNCIÓN DE GUARDADO CORREGIDA ---
    const subirFotoConfirmada = async () => {
    // Intentamos obtener el ID de tres formas para asegurar el tiro
    const userId = userData?.uid || userData?.id || (userData as any)?.userId;

    if (!fotoTemporal) {
      alert("No hay ninguna foto seleccionada");
      return;
    }

    if (!userId) {
      console.error("DEBUG - Datos de usuario recibidos:", userData);
      alert("Error: No se detecta tu sesión activa. Por favor, reingresa a la app.");
      return;
    }

    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userId);
      
      // Actualizamos Firestore cumpliendo tu regla de 'dueño edita'
      await updateDoc(userRef, { 
        fotoPerfil: fotoTemporal 
      });
      
      // Actualización visual inmediata
      userData.fotoPerfil = fotoTemporal;
      
      setFotoTemporal(null);
      setPasoFoto(false);
      setRefresh(prev => prev + 1);
      
      alert("¡Perfil actualizado!");
    } catch (e) { 
      console.error("Error de Firebase:", e);
      alert("Error al guardar: Verifica tu conexión o permisos."); 
    } finally { 
      setCargando(false); 
    }
  };
  
  
  const guardarCambios = async () => {
    if (!tipoEdicion || !userData.uid || cargando) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userData.uid);
      let updateData = {};
      
      // Lógica para campos anidados de vehículo
      if (['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id)) {
        updateData = { [`vehiculo.${tipoEdicion.id}`]: nuevoValor.toUpperCase() };
        if(!userData.vehiculo) userData.vehiculo = {};
        userData.vehiculo[tipoEdicion.id] = nuevoValor.toUpperCase();
      } else {
        updateData = { [tipoEdicion.id]: nuevoValor };
        userData[tipoEdicion.id] = nuevoValor;
      }

      await updateDoc(userRef, updateData);
      setModalVisible(false);
      setRefresh(prev => prev + 1);
    } catch (e) {
      alert("Error de conexión con Firestore");
    } finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-6 animate-in fade-in duration-500">
            {/* CARD DE PERFIL PROFESIONAL */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-5 right-5">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">RANGO: {rango}</div>
              </div>

              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 via-orange-300 to-slate-200 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? (
                        <img src={userData.fotoPerfil} key={refresh} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                        <User size={50} className="text-slate-200 mt-4" />
                    )}
                  </div>
                </div>
                <button onClick={() => setPasoFoto(true)} className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full border-4 border-white shadow-lg active:scale-90 transition-transform"><Edit2 size={14} /></button>
              </div>

              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
                {userData.nombre || "Usuario"}, <span className="text-blue-600">{userData.edad || "30"}</span>
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Dando la cola desde 2024</p>
            </div>

            {/* ESTADO DE CONFIANZA */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Confianza del Conductor</p>
                  <p className="text-lg font-black italic text-slate-800 uppercase leading-none">{totalVerificados} de 3 Verificados</p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                  <p className="text-2xl font-black italic text-orange-500 leading-none">{porcentajeConfianza.toFixed(0)}%</p>
                </div>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 border border-slate-50 shadow-inner">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-1000" style={{ width: `${porcentajeConfianza}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500">
            {/* SECCIÓN PERSONAL */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Información Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={UserCog} label="Nombre Completo" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre || ""); setModalVisible(true); }} />
                <MenuButton icon={Mail} label="Email" value={userData.email} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono || ""); setModalVisible(true); }} />
                <MenuButton icon={Calendar} label="Nacimiento" value={userData.fechaNacimiento} onClick={() => { setTipoEdicion({id:'fechaNacimiento', label:'Fecha', valor:userData.fechaNacimiento}); setNuevoValor(userData.fechaNacimiento || ""); setModalVisible(true); }} />
              </div>
            </div>

            {/* SECCIÓN VEHÍCULO (COMPLETA) */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Mi Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={Car} label="Marca / Modelo" value={userData.vehiculo?.modelo ? `${userData.vehiculo.marca} ${userData.vehiculo.modelo}` : "Configurar"} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData.vehiculo?.modelo}); setNuevoValor(userData.vehiculo?.modelo || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa / Matrícula" value={userData.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData.vehiculo?.placa}); setNuevoValor(userData.vehiculo?.placa || ""); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color Exterior" value={userData.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData.vehiculo?.color}); setNuevoValor(userData.vehiculo?.color || ""); setModalVisible(true); }} />
              </div>
            </div>

            {/* SECCIÓN SEGURIDAD */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Seguridad y KYC</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={FileText} label="Documento Identidad" value={userData.kycVerificado ? "VERIFICADO ✅" : "PENDIENTE"} />
                <MenuButton icon={ShieldCheck} label="Licencia Conducir" value={userData.licenciaVerificada ? "VERIFICADO ✅" : "PENDIENTE"} />
                <MenuButton icon={KeyRound} label="Contraseña" value="••••••••" onClick={() => alert("Función de cambio de clave en desarrollo")} />
              </div>
            </div>

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* MODAL EDICIÓN DINÁMICO */}
      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom shadow-2xl">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] mb-2 italic">EDITAR {tipoEdicion?.label}</h4>
            <input 
              type={tipoEdicion?.id === 'fechaNacimiento' ? 'date' : 'text'}
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              placeholder={`Ingresa ${tipoEdicion?.label}`}
              className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none focus:border-blue-600 mb-8 uppercase"
              autoFocus
            />
            <button onClick={guardarCambios} disabled={cargando} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg active:bg-blue-700 transition-colors">
                {cargando ? 'PROCESANDO...' : 'ACTUALIZAR DATOS'}
            </button>
          </div>
        </div>
      )}

      {/* FLUJO DE FOTO CON REGLAS */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 text-center animate-in fade-in">
          {!fotoTemporal ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-sm mx-auto">
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center border-8 border-orange-100 relative shadow-inner">
                 <User size={100} className="text-orange-200" />
                 <div className="absolute -top-2 -right-2 bg-green-500 p-3 rounded-full text-white shadow-lg animate-bounce"><CheckCircle2 size={24} /></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">¡Dile Cheese!</h3>
                <p className="text-slate-400 font-bold italic leading-tight uppercase text-[10px] tracking-widest">Reglas: Sin lentes • Buena luz • Rostro visible</p>
              </div>
              <div className="w-full space-y-4 pt-10">
                <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95 transition-transform">Abrir Cámara</button>
                <button onClick={() => seleccionarImagen(CameraSource.Photos)} className="w-full bg-slate-100 text-slate-600 p-5 rounded-[25px] font-black uppercase text-xs">Desde Galería</button>
                <button onClick={() => setPasoFoto(false)} className="w-full text-slate-400 font-black uppercase text-[10px] pt-4">Ahora no</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95">
               <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-blue-50 shadow-2xl">
                  <img src={fotoTemporal} className="w-full h-full object-cover" alt="Previsualización" />
               </div>
               <h3 className="text-2xl font-black text-slate-800 uppercase italic">¿Quedaste bien?</h3>
               <div className="w-full space-y-4 max-w-xs">
                 <button onClick={subirFotoConfirmada} disabled={cargando} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                    {cargando ? 'GUARDANDO...' : 'SÍ, USAR ESTA FOTO'}
                 </button>
                 <button onClick={() => setFotoTemporal(null)} className="w-full bg-slate-100 text-slate-500 p-5 rounded-[25px] font-black uppercase text-xs">TOMAR OTRA</button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors">
    <div className="flex items-center gap-5">
      <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm"><Icon size={20} /></div>
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5">{label}</p>
        <p className={`text-xs font-black uppercase tracking-tight ${value && value !== "Configurar" ? 'text-slate-800' : 'text-blue-500'}`}>
          {value || "Configurar"}
        </p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-200" />
  </button>
);
