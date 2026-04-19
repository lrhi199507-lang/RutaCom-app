import React, { useState } from 'react';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  LogOut, ShieldCheck, CheckCircle2, UserCog, ChevronRight,
  Camera, Phone, Mail, FileText, Car, User, Trophy, Flame,
  UserCheck, Calendar, ShieldAlert
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  // 1. ESTADOS
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);

  // 2. VERIFICACIÓN DE DATOS
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400">CARGANDO PERFIL...</div>;

  const view = pestañaActiva || 'publico';

  // 3. FUNCIONES DE ACCIÓN
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
    
    let valorAGuardar = nuevoValor;

    if (tipoEdicion.id === 'vehiculo') {
      valorAGuardar = nuevoValor.toUpperCase();
      await updateDoc(userRef, { "vehiculo.placa": valorAGuardar });
      // Actualizamos el objeto local
      if (userData.vehiculo) {
        userData.vehiculo.placa = valorAGuardar;
      } else {
        userData.vehiculo = { placa: valorAGuardar };
      }
    } else {
      await updateDoc(userRef, { [tipoEdicion.id]: valorAGuardar });
      // *** IMPORTANTE: Actualizamos el objeto local ***
      userData[tipoEdicion.id] = valorAGuardar; 
    }

    setModalVisible(false);
    alert("Datos actualizados correctamente."); 
    // Esto obligará a la app a refrescar la vista si estás usando el estado correctamente
  } catch (error) {
    console.error(error);
    alert("Error al conectar con la base de datos.");
  } finally {
    setCargando(false);
  }
};

  const cambiarFotoPerfil = async () => {
  // AVISO ANTES DE LA CÁMARA
  const confirmacion = window.confirm(
    "Para una mejor verificación:\n\n" +
    "• Busca un lugar con buena claridad.\n" +
    "• Quítate gorra y lentes.\n" +
    "• Asegúrate de que tu rostro se vea bien.\n\n" +
    "¿Listo para tomar la foto?"
  );

  if (!confirmacion) return;

  try {
    const image = await CapacitorCamera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      // Traducción de las opciones del menú
      promptLabelHeader: "Elegir foto de perfil",
      promptLabelPhoto: "Desde mi galería",
      promptLabelPicture: "Tomar una foto"
    });

    if (image.webPath) {
      setCargando(true);
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const storageRef = ref(storage, `perfiles/${userData.uid}`);
      
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      
      const userRef = doc(db, "usuarios", userData.uid);
      await updateDoc(userRef, { fotoPerfil: url });
      
      // *** ESTO ES LO QUE HACE QUE SE VEA AL INSTANTE ***
      userData.fotoPerfil = url; 
      alert("¡Foto actualizada con éxito!");
    }
  } catch (error) {
    console.log("Acción cancelada");
  } finally {
    setCargando(false);
  }
};
  

  // 4. LÓGICA DE NIVELES
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

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <div className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5 bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest">Rango: {rango}</div>
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-slate-200 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" /> : <User size={50} className="text-slate-200" />}
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">{userData.nombre || "Usuario"}, <span className="text-blue-600">{userData.edad || "30"}</span></h2>
            </div>

            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-3">Estado de Confianza</p>
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 border border-slate-50 shadow-inner">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${porcentajeConfianza}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-7 pb-24">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Perfil Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <button onClick={cambiarFotoPerfil} className="w-full flex items-center justify-between p-4 border-b border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                      {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" /> : <Camera size={18} className="text-slate-300"/>}
                    </div>
                    <div className="text-left">
                      <span className="text-[11px] font-black italic text-slate-700 uppercase block leading-none">Foto de Perfil</span>
                      <span className="text-[9px] font-bold text-blue-500 mt-1 block">Cambiar imagen</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
                <MenuButtonCuenta icon={UserCog} label="Nombre Completo" value={userData.nombre} onClick={() => abrirEdicion('nombre', 'Nombre Completo', userData.nombre)} />
                <MenuButtonCuenta icon={Mail} label="Correo Electrónico" value={userData.email} onClick={() => abrirEdicion('email', 'Correo Electrónico', userData.email)} />
                <MenuButtonCuenta icon={Phone} label="Teléfono" value={userData.telefono || "No asignado"} onClick={() => abrirEdicion('telefono', 'Número de Teléfono', userData.telefono || "")} />
                <MenuButtonCuenta icon={Calendar} label="Nacimiento" value={userData.fechaNacimiento || "00/00/0000"} onClick={() => abrirEdicion('fechaNacimiento', 'Fecha de Nacimiento', userData.fechaNacimiento || "")} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4">Mi Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButtonCuenta icon={Car} label="Placa" value={userData.vehiculo?.placa || "Registrar"} onClick={() => abrirEdicion('vehiculo', 'Placa del Vehículo', userData.vehiculo?.placa || "")} />
              </div>
            </div>

            <div className="pt-4">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100">
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-lg rounded-t-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h3 className="text-xl font-black italic text-slate-800 uppercase mb-6">{tipoEdicion?.label}</h3>
            <input 
  type={tipoEdicion?.id === 'fechaNacimiento' ? "date" : "text"}
  value={nuevoValor}
  onChange={(e) => setNuevoValor(e.target.value)}
  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none mb-8"
  autoFocus
/>
            <div className="flex gap-4">
              <button onClick={() => setModalVisible(false)} className="flex-1 p-5 rounded-2xl text-[10px] font-black uppercase text-slate-400 bg-slate-100">Cancelar</button>
              <button onClick={guardarCambios} disabled={cargando} className="flex-1 p-5 rounded-2xl text-[10px] font-black uppercase text-white bg-blue-600">
                {cargando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuButtonCuenta = ({ icon: Icon, label, value, onClick }: any) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 flex items-center justify-center"><Icon size={18}/></div>
            <div className="text-left">
                <span className="text-[10px] font-black italic text-slate-700 uppercase block">{label}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 block truncate max-w-[180px]">{value || "No registrado"}</span>
            </div>
        </div>
        <ChevronRight size={16} className="text-slate-300" />
    </button>
);

const ItemDocumento = ({ icon: Icon, label, desc, estado }: any) => (
    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${estado ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-500'}`}><Icon size={22}/></div>
        <div className="flex-1 text-left">
            <p className="text-[11px] font-black italic text-slate-800 uppercase leading-tight">{label}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{desc}</p>
        </div>
        <button className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase ${estado ? 'bg-green-500 text-white' : 'bg-white text-orange-500 border border-orange-100'}`}>
            {estado ? 'LISTO' : 'SUBIR'}
        </button>
    </div>
);
