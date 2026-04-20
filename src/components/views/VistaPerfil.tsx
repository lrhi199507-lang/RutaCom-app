import React, { useState } from 'react';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  UserCog, ChevronRight, Phone, FileText, Car, User, Edit2, 
  Lock, Calendar, Palette, Hash, CheckCircle2
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refresh, setRefresh] = useState(0);

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400">CARGANDO...</div>;
  const view = pestañaActiva || 'publico';

  // --- LÓGICA DE PROGRESO ---
  const totalVerificados = [userData.email, userData.kycVerificado, userData.licenciaVerificada].filter(Boolean).length;
  const porcentaje = (totalVerificados / 3) * 100;

  // --- GUARDAR DATOS ---
  const guardarCambios = async () => {
    if (!tipoEdicion || !userData.uid) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userData.uid);
      let dataParaActualizar = {};

      // Detectar si es campo de vehículo o general
      if (['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id)) {
        dataParaActualizar = { [`vehiculo.${tipoEdicion.id}`]: nuevoValor.toUpperCase() };
        if(!userData.vehiculo) userData.vehiculo = {};
        userData.vehiculo[tipoEdicion.id] = nuevoValor.toUpperCase();
      } else {
        dataParaActualizar = { [tipoEdicion.id]: nuevoValor };
        userData[tipoEdicion.id] = nuevoValor;
      }

      await updateDoc(userRef, dataParaActualizar);
      setModalVisible(false);
      setRefresh(prev => prev + 1);
      alert("¡Guardado correctamente!");
    } catch (e) {
      console.error("Error al guardar:", e);
      alert("Error de conexión con la base de datos.");
    } finally {
      setCargando(false);
    }
  };

  // --- CAPTURAR FOTO (DIRECTO) ---
  const capturarImagen = async (fuente: 'CAMERA' | 'PHOTOS') => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 60, // Bajamos un poco la calidad para que suba más rápido
        allowEditing: false, // ELIMINADO EL EDITOR MOLESTO
        resultType: CameraResultType.Uri,
        source: fuente === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.webPath) {
        setCargando(true);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const storageRef = ref(storage, `perfiles/${userData.uid}`);
        
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        
        await updateDoc(doc(db, "usuarios", userData.uid), { fotoPerfil: url });
        userData.fotoPerfil = url;
        
        setPasoFoto(false);
        setRefresh(prev => prev + 1);
        alert("Foto actualizada");
      }
    } catch (e) {
      console.log("Acción cancelada");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* TABS SUPERIORES */}
      <div className="p-4 bg-white sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-full max-w-md mx-auto">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {view === 'publico' ? (
          <div className="p-5 space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm text-center relative">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-orange-200 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? <img src={`${userData.fotoPerfil}?t=${refresh}`} className="w-full h-full object-cover" /> : <User size={50} className="text-slate-200" />}
                  </div>
                </div>
                <button onClick={() => setPasoFoto(true)} className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-md"><Edit2 size={12} /></button>
              </div>
              <h2 className="text-xl font-black italic text-slate-800 uppercase">{userData.nombre || "Usuario"}</h2>
            </div>

            <div className="bg-white p-6 rounded-[30px] border border-slate-100">
               <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confianza</p>
                  <p className="text-xl font-black italic text-orange-500">{porcentaje.toFixed(0)}%</p>
               </div>
               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-700" style={{ width: `${porcentaje}%` }} />
               </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            <div className="bg-white rounded-[30px] border border-slate-100 overflow-hidden p-2">
              <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre || ""); setModalVisible(true); }} />
              <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono || ""); setModalVisible(true); }} />
            </div>

            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-4">Seguridad</p>
            <div className="bg-white rounded-[30px] border border-slate-100 overflow-hidden p-2">
              <MenuButton icon={FileText} label="Cédula" value={userData.kycVerificado ? "Verificada ✅" : "Pendiente"} />
              <MenuButton icon={FileText} label="Licencia" value={userData.licenciaVerificada ? "Verificada ✅" : "Pendiente"} />
            </div>

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[25px] font-black uppercase text-[10px]">Cerrar Sesión</button>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN MEJORADO */}
      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Editar {tipoEdicion?.label}</h4>
            <input 
              type="text"
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-lg border-2 border-slate-100 focus:border-blue-600 outline-none mb-6"
            />
            <button 
              onClick={guardarCambios}
              disabled={cargando}
              className="w-full bg-blue-600 text-white p-5 rounded-full font-black uppercase text-xs shadow-lg active:scale-95"
            >
              {cargando ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA FOTO - BOTONES DIRECTOS */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 text-center">
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="w-40 h-40 bg-orange-50 rounded-full flex items-center justify-center border-8 border-orange-100">
               <User size={100} className="text-orange-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase italic">¡Sácate una buena foto!</h3>
            <p className="text-slate-400 font-medium">Sin lentes, mira de frente y con buena luz.</p>
          </div>
          <div className="space-y-4">
            <button onClick={() => capturarImagen('CAMERA')} className="w-full bg-blue-600 text-white p-5 rounded-full font-black uppercase text-xs shadow-xl active:scale-95">Tomar Foto Ahora</button>
            <button onClick={() => capturarImagen('PHOTOS')} className="w-full bg-white text-blue-600 border-2 border-blue-600 p-5 rounded-full font-black uppercase text-xs">Elegir de la Galería</button>
            <button onClick={() => setPasoFoto(false)} className="w-full text-slate-400 font-black uppercase text-[10px] pt-4">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 active:bg-slate-50">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center"><Icon size={18} /></div>
      <div className="text-left">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-[11px] font-bold text-slate-700">{value || "Configurar ahora"}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-200" />
  </button>
);
