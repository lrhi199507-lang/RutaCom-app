import React, { useState } from 'react';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  LogOut, ShieldCheck, CheckCircle2, UserCog, ChevronRight,
  Camera, Phone, Mail, FileText, Car, User, Edit2, 
  Lock, CreditCard, ShieldAlert, Calendar, Palette, Hash
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refresh, setRefresh] = useState(0); // Para forzar el refresco visual

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 uppercase tracking-widest">Cargando perfil...</div>;
  const view = pestañaActiva || 'publico';

  // --- LÓGICA DE NIVELES Y PROGRESO ---
  const totalViajes = userData.viajesRealizados || 0;
  const rango = totalViajes >= 10 ? "Plata" : "Novato";
  
  const puntosControl = [
    { id: 'email', verificado: !!userData.email },
    { id: 'cedula', verificado: !!userData.kycVerificado },
    { id: 'licencia', verificado: !!userData.licenciaVerificada },
    { id: 'matricula', verificado: !!userData.matriculaVerificada },
  ];
  const totalVerificados = puntosControl.filter(p => p.verificado).length;
  const porcentajeConfianza = (totalVerificados / puntosControl.length) * 100;

  // --- FUNCIONES DE ACCIÓN ---
  const abrirEdicion = (id: string, label: string, valor: string) => {
    setTipoEdicion({ id, label, valor });
    setNuevoValor(valor || "");
    setModalVisible(true);
  };

  const guardarCambios = async () => {
    if (!tipoEdicion || !userData.uid) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userData.uid);
      const camposVehiculo = ['placa', 'modelo', 'color', 'marca'];
      
      if (camposVehiculo.includes(tipoEdicion.id)) {
        const campo = `vehiculo.${tipoEdicion.id}`;
        const valorFinal = nuevoValor.toUpperCase();
        await updateDoc(userRef, { [campo]: valorFinal });
        if(!userData.vehiculo) userData.vehiculo = {};
        userData.vehiculo[tipoEdicion.id] = valorFinal;
      } else {
        await updateDoc(userRef, { [tipoEdicion.id]: nuevoValor });
        userData[tipoEdicion.id] = nuevoValor; 
      }
      setModalVisible(false);
      setRefresh(prev => prev + 1); // Forzamos actualización visual
    } catch (e) { alert("Error al guardar"); } finally { setCargando(false); }
  };

  const ejecutarCapturaFoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90, allowEditing: true, resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: "Foto de Perfil",
        promptLabelPhoto: "Galería", 
        promptLabelPicture: "Cámara"
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
        setRefresh(prev => prev + 1); // Forzamos actualización visual
      }
    } catch (e) { console.log("Cancelado"); } finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* CABECERA CON ESTILO NARANJA Y RANGO */}
            <div className="bg-white p-8 rounded-[45px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 text-center relative overflow-hidden group">
              <div className="absolute top-5 right-5">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">
                  Rango: {rango}
                </div>
              </div>

              {/* FOTO CON ANILLO GRADIENTE Y LÁPIZ */}
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 via-orange-300 to-slate-200 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
                    {userData.fotoPerfil ? (
                        <img src={`${userData.fotoPerfil}?t=${refresh}`} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                        <User size={50} className="text-slate-200 mt-4" />
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setPasoFoto(true)}
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full border-4 border-white shadow-lg active:scale-90 transition-transform"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
                {userData.nombre || "Usuario"}, <span className="text-blue-600">{userData.edad || "30"}</span>
              </h2>
              <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent w-full my-6" />
              <p className="text-xs font-medium italic text-slate-500 leading-relaxed px-2">
                "{userData.bio || "Pide tu cola seguro con DameLaCola"}"
              </p>
            </div>

            {/* BARRA DE PROGRESO NARANJA */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Estado de Confianza</p>
                  <p className="text-lg font-black italic text-slate-800 uppercase leading-none">
                    {totalVerificados} de {puntosControl.length} Verificados
                  </p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                  <p className="text-2xl font-black italic text-orange-500 leading-none">
                    {porcentajeConfianza.toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 border border-slate-50 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-1000"
                  style={{ width: `${porcentajeConfianza}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-7 pb-24 animate-in slide-in-from-right-4 duration-500">
            {/* OPCIONES DE CUENTA ESTILO MEJORADO */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Perfil Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => abrirEdicion('nombre', 'Nombre', userData.nombre)} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => abrirEdicion('telefono', 'Teléfono', userData.telefono)} />
                <MenuButton icon={Calendar} label="Nacimiento" value={userData.fechaNacimiento} onClick={() => abrirEdicion('fechaNacimiento', 'Nacimiento', userData.fechaNacimiento)} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4">Seguridad</p>
              <div className="bg-white rounded-[35px] border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={FileText} label="Documento Identidad" value={userData.kycVerificado ? "Verificado" : "Pendiente"} />
                <MenuButton icon={Lock} label="Contraseña" onClick={() => abrirEdicion('password', 'Nueva Contraseña', '')} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Mi Vehículo</p>
              <div className="bg-white rounded-[35px] border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={Car} label="Marca" value={userData.vehiculo?.marca} onClick={() => abrirEdicion('marca', 'Marca', userData.vehiculo?.marca)} />
                <MenuButton icon={Palette} label="Color" value={userData.vehiculo?.color} onClick={() => abrirEdicion('color', 'Color', userData.vehiculo?.color)} />
                <MenuButton icon={Hash} label="Placa" value={userData.vehiculo?.placa} onClick={() => abrirEdicion('placa', 'Placa', userData.vehiculo?.placa)} />
              </div>
            </div>

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 active:scale-95 transition-all">
               Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* PANTALLA INSTRUCCIONES FOTO (ESTILO BLABLACAR RECUPERADO) */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col">
          <div className="p-6">
            <button onClick={() => setPasoFoto(false)} className="text-blue-600 font-black uppercase text-[10px] flex items-center gap-2">
               <ChevronRight size={20} className="rotate-180" /> Cancelar
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center border-8 border-orange-50 relative">
               <User size={100} className="text-slate-200" />
               <div className="absolute -top-2 -right-2 bg-green-500 p-3 rounded-full text-white shadow-lg">
                  <CheckCircle2 size={24} />
               </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight">No te pongas gafas de sol, mira de frente y que solo aparezcas tú.</h3>
          </div>
          <div className="p-8 space-y-4">
            <button onClick={ejecutarCapturaFoto} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Haz una foto ahora</button>
            <button onClick={ejecutarCapturaFoto} className="w-full bg-slate-100 text-blue-600 p-5 rounded-[25px] font-black uppercase text-xs active:scale-95 transition-all">Elige de la galería</button>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN CON TRUCO DE REFRESH */}
      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full rounded-t-[40px] p-10 animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] mb-2">Editar {tipoEdicion?.label}</h4>
            <input 
              type={tipoEdicion?.id === 'fechaNacimiento' ? "date" : "text"}
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none focus:border-blue-600 mb-8"
              autoFocus
            />
            <button onClick={guardarCambios} disabled={cargando} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg">
                {cargando ? 'Guardando...' : 'Confirmar Cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTE AUXILIAR
const MenuButton = ({ icon: Icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 active:scale-[0.98]">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center"><Icon size={18} /></div>
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-700 uppercase italic leading-none mb-1">{label}</p>
        <p className="text-[9px] font-bold text-slate-400 tracking-wider truncate max-w-[180px]">{value || "Configurar"}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-200" />
  </button>
);
