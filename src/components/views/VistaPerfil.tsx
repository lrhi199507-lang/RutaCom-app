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
  // --- ESTADOS ---
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fotoDocTemporal, setFotoDocTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [pasoDocumento, setPasoDocumento] = useState<{tipo: 'cedula' | 'licencia' | 'selfie' | 'antecedentes', activa: boolean}>({tipo: 'cedula', activa: false});
  

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  const view = pestañaActiva || 'publico';

  // --- LÓGICA DE TRAYECTORIA DUAL Y RANGOS ---
  const viajesCond = userData.viajesRealizados || 0;
  const viajesPas = userData.viajesComoPasajero || 0;
  const totalTrayectoria = viajesCond + viajesPas;
  
  const obtenerRango = () => {
    if (totalTrayectoria >= 50) return "LEYENDA";
    if (totalTrayectoria >= 20) return "ORO";
    if (totalTrayectoria >= 10) return "PLATA";
    return "NOVATO";
  };

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
        quality: 20,
        width: 500,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, 
        source: source
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
      if(userData) userData.fotoPerfil = fotoTemporal;
      setFotoTemporal(null);
      setPasoFoto(false);
      setRefresh(prev => prev + 1);
      alert("¡Foto guardada exitosamente!");
    } catch (e: any) { 
        alert("Error al guardar: " + e.message); 
    } finally { setCargando(false); }
  };

  const guardarCambios = async () => {
    const userId = userData?.uid || userData?.id;
    if (!tipoEdicion || !userId || cargando) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userId);
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
      alert("Error de conexión con Firestore");
    } finally { setCargando(false); }
  };

  // --- ESCÁNER DE DOCUMENTOS (KYC) ---
  const capturarDocumento = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 30, // Baja calidad para Firestore (Límite 1MB)
        width: 800,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera 
      });
      if (image.dataUrl) setFotoDocTemporal(image.dataUrl);
    } catch (e) { console.log("Escaneo cancelado"); }
  };
const subirDocumentoFinal = async () => {
    const userId = userData?.uid || userData?.id;
    if (!fotoDocTemporal || !userId) return;
    setCargando(true);

    try {
      const userRef = doc(db, "usuarios", userId);
      let campoFoto = "";
      let campoEstado = "";

      if (pasoDocumento.tipo === 'cedula') {
        campoFoto = 'kycFoto';
        campoEstado = 'kycVerificado';
      } else if (pasoDocumento.tipo === 'licencia') {
        campoFoto = 'licenciaFoto';
        campoEstado = 'licenciaVerificada';
      } else if (pasoDocumento.tipo === 'selfie') {
        campoFoto = 'selfieFoto';
        campoEstado = 'selfieVerificada';
      } else if (pasoDocumento.tipo === 'antecedentes') {
        campoFoto = 'antecedentesFoto'; // Guardamos la captura del PDF o foto
        campoEstado = 'antecedentesVerificados'; 
      }

      await updateDoc(userRef, { 
        [campoFoto]: fotoDocTemporal,
        [campoEstado]: true 
      });

      if(userData) userData[campoEstado] = true;

      setFotoDocTemporal(null);
      setPasoDocumento({tipo: 'cedula', activa: false});
      
      alert(`¡Documento de ${pasoDocumento.tipo} guardado!`);
    } catch (e) { 
      alert("Error al subir"); 
    } finally { 
      setCargando(false); 
    }
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
            {/* CARD DE PERFIL PROFESIONAL CON TRAYECTORIA DUAL */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-5 right-5">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">RANGO: {obtenerRango()}</div>
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

              <div className="flex justify-center gap-6 mt-4 border-t border-slate-50 pt-4">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Conductor</p>
                    <p className="font-black text-blue-600 italic leading-none">{viajesCond} <span className="text-[10px]">VJS</span></p>
                  </div>
                  <div className="w-px h-6 bg-slate-100 self-center" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Pasajero</p>
                    <p className="font-black text-orange-500 italic leading-none">{viajesPas} <span className="text-[10px]">VJS</span></p>
                  </div>
              </div>
            </div>

            {/* ESTADO DE CONFIANZA */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Confianza del Usuario</p>
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

            {/* SECCIÓN VEHÍCULO (FUNCIONAL) */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Mi Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={Car} label="Marca" value={userData.vehiculo?.marca} onClick={() => { setTipoEdicion({id:'marca', label:'Marca', valor:userData.vehiculo?.marca}); setNuevoValor(userData.vehiculo?.marca || ""); setModalVisible(true); }} />
                <MenuButton icon={Gauge} label="Modelo" value={userData.vehiculo?.modelo} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData.vehiculo?.modelo}); setNuevoValor(userData.vehiculo?.modelo || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa / Matrícula" value={userData.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData.vehiculo?.placa}); setNuevoValor(userData.vehiculo?.placa || ""); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color" value={userData.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData.vehiculo?.color}); setNuevoValor(userData.vehiculo?.color || ""); setModalVisible(true); }} />
              </div>
            </div>

            {/* SECCIÓN SEGURIDAD Y KYC */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Documentos de Identidad</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={FileText} label="Cédula de Identidad" value={userData.kycVerificado ? "VERIFICADO ✅" : "PENDIENTE"} onClick={() => !userData.kycVerificado && setPasoDocumento({tipo:'cedula', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Licencia de Conducir" value={userData.licenciaVerificada ? "VERIFICADO ✅" : "PENDIENTE"} onClick={() => !userData.licenciaVerificada && setPasoDocumento({tipo:'licencia', activa:true})} />
                <MenuButton icon={KeyRound} label="Contraseña" value="••••••••" onClick={() => alert("Función en desarrollo")} />
                <MenuButton icon={User} label="Selfie de Identidad" value={userData.selfieVerificada ? "VERIFICADO ✅" : "PENDIENTE"} onClick={() => !userData.selfieVerificada && setPasoDocumento({tipo:'selfie', activa:true})} /> 
                {/* Botón de Antecedentes Opcional */}
<MenuButton icon={FileCheck}  label="Antecedentes Penales (Opcional)"  value={userData.antecedentesVerificados ? "NIVEL PRO 🏆" : "SUBIR PARA SUBIR NIVEL"}  onClick={() => !userData.antecedentesVerificados && setPasoDocumento({tipo:'antecedentes', activa:true})} />
    </div>
      </div>

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2">
                <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* MODAL EDICIÓN DINÁMICO */}
      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] mb-2 italic">EDITAR {tipoEdicion?.label}</h4>
            <input 
              type={tipoEdicion?.id === 'fechaNacimiento' ? 'date' : 'text'}
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none focus:border-blue-600 mb-8 uppercase"
              autoFocus
            />
            <button onClick={guardarCambios} disabled={cargando} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs">
                {cargando ? 'PROCESANDO...' : 'ACTUALIZAR DATOS'}
            </button>
          </div>
        </div>
      )}

                  {/* SECCIÓN SEGURIDAD (CON SELFIE Y ANTECEDENTES DORADOS) */}
      <div className="space-y-3 px-5 mt-8">
        <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Seguridad y Verificación</p>
        <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
          
          <MenuButton 
            icon={FileText} 
            label="Cédula de Identidad" 
            value={userData.kycVerificado ? "VERIFICADO ✅" : "PENDIENTE"} 
            onClick={() => !userData.kycVerificado && setPasoDocumento({tipo:'cedula', activa:true})} 
          />

          <MenuButton 
            icon={ShieldCheck} 
            label="Licencia de Conducir" 
            value={userData.licenciaVerificada ? "VERIFICADO ✅" : "PENDIENTE"} 
            onClick={() => !userData.licenciaVerificada && setPasoDocumento({tipo:'licencia', activa:true})} 
          />

          <MenuButton 
            icon={User} 
            label="Selfie de Identidad" 
            value={userData.selfieVerificada ? "ROSTRO VERIFICADO ✅" : "PENDIENTE"} 
            onClick={() => !userData.selfieVerificada && setPasoDocumento({tipo:'selfie', activa:true})} 
          />

          {/* Botón de Antecedentes con Estilo Dorado Pro */}
          <button 
            onClick={() => !userData.antecedentesVerificados && setPasoDocumento({tipo:'antecedentes', activa:true})}
            className="w-full flex items-center justify-between p-5 border-t border-slate-50 bg-orange-50/30 active:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-5">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                <FileCheck size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-orange-400 uppercase italic leading-none mb-1.5">Record Criminal (Opcional)</p>
                <p className="text-xs font-black uppercase tracking-tight text-orange-600">
                  {userData.antecedentesVerificados ? "CONDUCTOR PRO 🏆" : "SUBIR PARA DESTACAR"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-orange-200" />
          </button>
        </div>
      </div>

      <div className="p-5 pb-20">
        <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>

      {/* MODAL ESCÁNER DINÁMICO (SITÚALO AQUÍ PARA CERRAR LA LÓGICA) */}
      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col p-6 overflow-hidden">
          {!fotoDocTemporal ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className={`relative w-full shadow-2xl bg-slate-800 overflow-hidden transition-all duration-500 ${pasoDocumento.tipo === 'selfie' ? 'aspect-square max-w-[300px] rounded-full border-4 border-dashed border-blue-500/50' : 'aspect-[1.6/1] rounded-3xl border-2 border-white/20'}`}>
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <p className="text-white font-black text-[10px] uppercase tracking-widest bg-blue-600/90 px-5 py-2 rounded-full">
                    {pasoDocumento.tipo === 'selfie' ? 'Ubica tu rostro aquí' : `Enmarca tu ${pasoDocumento.tipo}`}
                  </p>
                </div>
              </div>
              <button onClick={capturarDocumento} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">Capturar</button>
              <button onClick={() => setPasoDocumento({tipo:'cedula', activa:false})} className="w-full text-slate-500 font-black uppercase text-[10px] mt-2">Cancelar</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95">
              <div className={`w-full overflow-hidden border-4 border-blue-500 shadow-2xl ${pasoDocumento.tipo === 'selfie' ? 'aspect-square max-w-[300px] rounded-full' : 'aspect-[1.6/1] rounded-3xl'}`}>
                <img src={fotoDocTemporal} className="w-full h-full object-cover" alt="Captura" />
              </div>
              <button onClick={subirDocumentoFinal} disabled={cargando} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">
                {cargando ? 'PROCESANDO...' : 'SÍ, ENVIAR'}
              </button>
              <button onClick={() => setFotoDocTemporal(null)} className="w-full bg-white/10 text-white p-5 rounded-[25px] font-black uppercase text-xs">REPETIR</button>
            </div>
          )}
        </div>
      )}

      {/* FLUJO DE FOTO DE PERFIL */}
      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 text-center animate-in fade-in">
          {!fotoTemporal ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-sm mx-auto">
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center border-8 border-orange-100 relative shadow-inner">
                <User size={100} className="text-orange-200" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 uppercase italic">¡Dile Cheese!</h3>
              <div className="w-full space-y-4 pt-10">
                <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl">Abrir Cámara</button>
                <button onClick={() => setPasoFoto(false)} className="w-full text-slate-400 font-black uppercase text-[10px] pt-4">Ahora no</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95">
              <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-blue-50 shadow-2xl">
                <img src={fotoTemporal} className="w-full h-full object-cover" alt="Previsualización" />
              </div>
              <button onClick={subirFotoConfirmada} disabled={cargando} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">
                {cargando ? 'GUARDANDO...' : 'SÍ, USAR ESTA FOTO'}
              </button>
              <button onClick={() => setFotoTemporal(null)} className="w-full bg-slate-100 text-slate-500 p-5 rounded-[25px] font-black uppercase text-xs">TOMAR OTRA</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, value, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors text-left">
    <div className="flex items-center gap-5">
      <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5">{label}</p>
        <p className="text-xs font-black uppercase tracking-tight text-slate-800">{value || "Configurar"}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-200" />
  </button>
);
    
