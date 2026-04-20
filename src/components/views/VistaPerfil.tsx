import React, { useState } from 'react';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  UserCog, ChevronRight, Phone, FileText, Car, User, Edit2, 
  Lock, Calendar, Palette, Hash, CheckCircle2, Mail, ShieldCheck
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null); // Para la confirmación
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refresh, setRefresh] = useState(0);

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400">CARGANDO...</div>;
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

  // --- FUNCIONES DE GUARDADO ---
  const guardarCambios = async () => {
    if (!tipoEdicion || !userData.uid) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userData.uid);
      let updateData = {};
      
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
      alert("Error al conectar con la base de datos");
    } finally { setCargando(false); }
  };

  // --- FLUJO DE FOTO CON CONFIRMACIÓN ---
  const seleccionarImagen = async (source: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source
      });
      if (image.webPath) {
        setFotoTemporal(image.webPath); // Guardamos la foto para mostrarla antes de subir
      }
    } catch (e) { console.log("Cancelado"); }
  };

  const subirFotoConfirmada = async () => {
    if (!fotoTemporal || !userData.uid) return;
    setCargando(true);
    try {
      const response = await fetch(fotoTemporal);
      const blob = await response.blob();
      const storageRef = ref(storage, `perfiles/${userData.uid}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, "usuarios", userData.uid), { fotoPerfil: url });
      userData.fotoPerfil = url;
      
      setFotoTemporal(null);
      setPasoFoto(false);
      setRefresh(prev => prev + 1);
    } catch (e) { alert("Error al subir imagen"); } 
    finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* NAVEGACIÓN TABS */}
      <div className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-6">
            {/* CABECERA CON RANGO RESTAURADA */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-5 right-5">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">RANGO: {rango}</div>
              </div>

              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 via-orange-300 to-slate-200 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
                    {userData.fotoPerfil ? (
                        <img src={`${userData.fotoPerfil}?t=${refresh}`} key={refresh} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                        <User size={50} className="text-slate-200 mt-4" />
                    )}
                  </div>
                </div>
                <button onClick={() => setPasoFoto(true)} className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full border-4 border-white shadow-lg active:scale-90"><Edit2 size={14} /></button>
              </div>

              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
                {userData.nombre || "Usuario"}, <span className="text-blue-600">{userData.edad || "30"}</span>
              </h2>
            </div>

            {/* BARRA DE PROGRESO CALIDAD */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Estado de Confianza</p>
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
          <div className="p-5 space-y-7">
            {/* INFORMACIÓN PERSONAL RESTAURADA */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Información Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={UserCog} label="Nombre Completo" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre || ""); setModalVisible(true); }} />
                <MenuButton icon={Mail} label="Correo Electrónico" value={userData.email} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono || ""); setModalVisible(true); }} />
                <MenuButton icon={Calendar} label="Fecha de Nacimiento" value={userData.fechaNacimiento} onClick={() => { setTipoEdicion({id:'fechaNacimiento', label:'Nacimiento', valor:userData.fechaNacimiento}); setNuevoValor(userData.fechaNacimiento || ""); setModalVisible(true); }} />
              </div>
            </div>

            {/* SEGURIDAD RESTAURADA */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4">Seguridad y Documentos</p>
              <div className="bg-white rounded-[35px] border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={FileText} label="Cédula de Identidad" value={userData.kycVerificado ? "VERIFICADO ✅" : "PENDIENTE"} />
                <MenuButton icon={ShieldCheck} label="Licencia de Conducir" value={userData.licenciaVerificada ? "VERIFICADO ✅" : "PENDIENTE"} />
                <MenuButton icon={Lock} label="Contraseña" onClick={() => { setTipoEdicion({id:'password', label:'Contraseña', valor:''}); setNuevoValor(""); setModalVisible(true); }} />
              </div>
            </div>

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100">Cerrar Sesión</button>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom shadow-2xl">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] mb-2">EDITAR {tipoEdicion?.label}</h4>
            <input 
              type={tipoEdicion?.id === 'fechaNacimiento' ? 'date' : 'text'}
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none focus:border-blue-600 mb-8"
              autoFocus
            />
            <button onClick={guardarCambios} disabled={cargando} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg">
                {cargando ? 'GUARDANDO...' : 'CONFIRMAR CAMBIOS'}
            </button>
          </div>
        </div>
      )}

      {/* FLUJO DE FOTO CON PASO DE CONFIRMACIÓN */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 text-center animate-in fade-in">
          {!fotoTemporal ? (
            // PASO 1: Elegir origen
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="w-40 h-40 bg-orange-50 rounded-full flex items-center justify-center border-8 border-orange-100 relative">
                 <User size={100} className="text-orange-200" />
                 <div className="absolute -top-2 -right-2 bg-green-500 p-3 rounded-full text-white shadow-lg"><CheckCircle2 size={24} /></div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 leading-tight italic uppercase tracking-tighter">¡Sácate una buena foto!</h3>
              <p className="text-slate-400 font-medium italic">Sin gorra, sin lentes y con buena luz.</p>
              <div className="w-full space-y-4 pt-10">
                <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl">Abrir Cámara</button>
                <button onClick={() => seleccionarImagen(CameraSource.Photos)} className="w-full bg-slate-100 text-slate-600 p-5 rounded-[25px] font-black uppercase text-xs">Elegir de Galería</button>
                <button onClick={() => setPasoFoto(false)} className="w-full text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
              </div>
            </div>
          ) : (
            // PASO 2: Confirmar la foto elegida
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
               <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-blue-50 shadow-2xl">
                  <img src={fotoTemporal} className="w-full h-full object-cover" />
               </div>
               <h3 className="text-xl font-black text-slate-800 uppercase italic">¿Se ve bien?</h3>
               <div className="w-full space-y-4">
                 <button onClick={subirFotoConfirmada} disabled={cargando} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl">
                    {cargando ? 'SUBIENDO...' : 'SÍ, USAR ESTA FOTO'}
                 </button>
                 <button onClick={() => setFotoTemporal(null)} className="w-full bg-slate-100 text-slate-600 p-5 rounded-[25px] font-black uppercase text-xs">TOMAR OTRA</button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 active:scale-[0.98]">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center"><Icon size={18} /></div>
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-700 uppercase italic leading-none mb-1">{label}</p>
        <p className="text-[9px] font-bold text-blue-500 tracking-wider truncate max-w-[180px]">{value || "CONFIGURAR"}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-200" />
  </button>
);
