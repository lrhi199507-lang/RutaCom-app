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

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 uppercase tracking-widest">Cargando perfil...</div>;
  const view = pestañaActiva || 'publico';

  // --- FUNCIONES DE GUARDADO ---
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
      alert("¡Actualizado con éxito!");
    } catch (e) { alert("Error al guardar"); } finally { setCargando(false); }
  };

  const ejecutarCapturaFoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90, allowEditing: true, resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: "Foto de Perfil",
        promptLabelPhoto: "Elegir de mi galería", 
        promptLabelPicture: "Tomar una foto ahora"
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
      }
    } catch (e) { console.log("Cancelado"); } finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* NAVEGACIÓN ESTILO PROFESIONAL */}
      <div className="p-4 bg-white sticky top-0 z-50 border-b border-slate-100">
        <div className="flex max-w-md mx-auto border-b-2 border-slate-100">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-wider transition-all ${view === 'publico' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Información Personal</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-wider transition-all ${view === 'cuenta' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* FOTO CON LÁPIZ DE EDICIÓN DIRECTA */}
            <div className="relative w-36 h-36 mx-auto">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl bg-slate-200">
                {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" /> : <User size={70} className="text-slate-400 m-auto mt-8" />}
              </div>
              <button 
                onClick={() => setPasoFoto(true)}
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-3 rounded-full border-4 border-white shadow-lg active:scale-90 transition-transform"
              >
                <Edit2 size={20} />
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">{userData.nombre || "Usuario"}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <ShieldCheck size={16} className="text-blue-500" />
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Miembro Verificado</p>
              </div>
            </div>

            {/* SECCIÓN DE DATOS PERSONALES */}
            <div className="space-y-1 bg-white rounded-[35px] overflow-hidden shadow-sm border border-slate-100">
              <MenuRow icon={UserCog} label="Nombre Completo" value={userData.nombre} onClick={() => abrirEdicion('nombre', 'Tu Nombre', userData.nombre)} />
              <MenuRow icon={Mail} label="Correo Electrónico" value={userData.email} onClick={() => abrirEdicion('email', 'Correo', userData.email)} />
              <MenuRow icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => abrirEdicion('telefono', 'Teléfono', userData.telefono)} />
              <MenuRow icon={Calendar} label="Fecha de Nacimiento" value={userData.fechaNacimiento} onClick={() => abrirEdicion('fechaNacimiento', 'Nacimiento', userData.fechaNacimiento)} />
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-8">
             {/* SEGURIDAD KYC */}
             <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Seguridad y KYC</p>
                <div className="bg-white rounded-[35px] overflow-hidden border border-slate-100 shadow-sm">
                    <MenuRow icon={FileText} label="Cédula de Identidad" value={userData.kycVerificado ? "Verificada" : "Pendiente de subir"} />
                    <MenuRow icon={Lock} label="Cambiar Contraseña" onClick={() => abrirEdicion('password', 'Nueva Contraseña', '')} />
                </div>
             </div>

             {/* VEHÍCULO DETALLADO */}
             <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Mi Vehículo</p>
                <div className="bg-white rounded-[35px] overflow-hidden border border-slate-100 shadow-sm">
                    <MenuRow icon={Car} label="Marca" value={userData.vehiculo?.marca} onClick={() => abrirEdicion('marca', 'Marca del Carro', userData.vehiculo?.marca)} />
                    <MenuRow icon={Car} label="Modelo" value={userData.vehiculo?.modelo} onClick={() => abrirEdicion('modelo', 'Modelo del Carro', userData.vehiculo?.modelo)} />
                    <MenuRow icon={Palette} label="Color" value={userData.vehiculo?.color} onClick={() => abrirEdicion('color', 'Color del Carro', userData.vehiculo?.color)} />
                    <MenuRow icon={Hash} label="Placa" value={userData.vehiculo?.placa} onClick={() => abrirEdicion('placa', 'Placa del Carro', userData.vehiculo?.placa)} />
                </div>
             </div>

             <div className="pt-6">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100">
                    <LogOut size={16} /> Cerrar Sesión
                </button>
             </div>
          </div>
        )}
      </div>

      {/* PANTALLA DE INSTRUCCIONES DE FOTO (ESTILO BLABLACAR) */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col">
          <div className="p-6">
            <button onClick={() => setPasoFoto(false)} className="text-blue-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
               <ChevronRight size={20} className="rotate-180" /> Volver
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center border-8 border-blue-50 relative">
               <User size={100} className="text-slate-200" />
               <div className="absolute -top-2 -right-2 bg-green-500 p-3 rounded-full text-white shadow-lg">
                  <CheckCircle2 size={24} />
               </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight">No te pongas gafas de sol, mira de frente y asegúrate de que solo apareces tú.</h3>
            <p className="text-slate-400 text-sm font-medium">Una buena foto aumenta un 80% la probabilidad de conseguir pasajeros.</p>
          </div>
          <div className="p-8 space-y-4">
            <button onClick={ejecutarCapturaFoto} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl shadow-blue-200 active:scale-95 transition-all">Haz una foto</button>
            <button onClick={ejecutarCapturaFoto} className="w-full bg-slate-100 text-blue-600 p-5 rounded-[25px] font-black uppercase text-xs active:scale-95 transition-all">Elige una de tu galería</button>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full rounded-t-[40px] p-10 animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] mb-2">{tipoEdicion?.label}</h4>
            <input 
              type={tipoEdicion?.id === 'fechaNacimiento' ? "date" : "text"}
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none focus:border-blue-600 mb-8"
              autoFocus
            />
            <button onClick={guardarCambios} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg shadow-blue-100">
                {cargando ? 'Guardando...' : 'Confirmar Cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTE AUXILIAR FILA DE MENÚ
const MenuRow = ({ icon: Icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 active:bg-slate-100">
    <div className="flex items-center gap-5">
      <div className="text-slate-300 group-hover:text-blue-500"><Icon size={22} /></div>
      <div className="text-left">
        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{label}</p>
        <p className="text-[10px] font-bold text-blue-500 tracking-wider truncate max-w-[200px]">
          {value || "Configurar"}
        </p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-200" />
  </button>
);
      
