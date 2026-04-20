import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  Calendar, CheckCircle2, Mail, ShieldCheck,
  Car, Palette, Hash, Gauge, LogOut, FileCheck, Camera
} from 'lucide-react';

export const VistaPerfil = ({ userData, setUserData, handleLogout, pestañaActiva, setPestañaActiva }: any) => {
  // --- ESTADOS ---
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fotoDocTemporal, setFotoDocTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [pasoDocumento, setPasoDocumento] = useState<{tipo: string, activa: boolean, reglas?: string}>({tipo: 'cedula', activa: false});

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  const view = pestañaActiva || 'publico';

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

  const totalVerificados = [
    !!userData.kycVerificado, 
    !!userData.licenciaVerificada, 
    !!userData.selfieVerificada
  ].filter(Boolean).length;
  const porcentajeConfianza = (totalVerificados / 3) * 100;

  // --- FUNCIONES ---
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
      setUserData({ ...userData, fotoPerfil: fotoTemporal });
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
      if (['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id)) {
        updateData = { [`vehiculo.${tipoEdicion.id}`]: nuevoValor.toUpperCase() };
        const newVehiculo = { ...(userData.vehiculo || {}), [tipoEdicion.id]: nuevoValor.toUpperCase() };
        setUserData({ ...userData, vehiculo: newVehiculo });
      } else {
        updateData = { [tipoEdicion.id]: nuevoValor };
        setUserData({ ...userData, [tipoEdicion.id]: nuevoValor });
      }
      await updateDoc(userRef, updateData);
      setModalVisible(false); setRefresh(prev => prev + 1);
    } catch (e) { alert("Error"); } finally { setCargando(false); }
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
      if (pasoDocumento.tipo === 'cedula') { campoFoto = 'kycFoto'; campoEstado = 'kycVerificado'; } 
      else if (pasoDocumento.tipo === 'licencia') { campoFoto = 'licenciaFoto'; campoEstado = 'licenciaVerificada'; }
      else if (pasoDocumento.tipo === 'circulacion') { campoFoto = 'circulacionFoto'; campoEstado = 'circulacionVerificada'; } 
      else if (pasoDocumento.tipo === 'rcv') { campoFoto = 'rcvFoto'; campoEstado = 'rcvVerificado'; } 
      else if (pasoDocumento.tipo === 'selfie') { campoFoto = 'selfieFoto'; campoEstado = 'selfieVerificada'; }
      else if (pasoDocumento.tipo === 'antecedentes') { campoFoto = 'antecedentesFoto'; campoEstado = 'antecedentesVerificados'; } 
      else if (pasoDocumento.tipo === 'fotoFrontal') { campoFoto = 'fotoFrontal'; campoEstado = 'fotoFrontalVerificada'; } 
      else if (pasoDocumento.tipo === 'fotoTrasera') { campoFoto = 'fotoTrasera'; campoEstado = 'fotoTraseraVerificada'; } 
      else if (pasoDocumento.tipo === 'fotoLatIzq') { campoFoto = 'fotoLatIzq'; campoEstado = 'fotoLatIzqVerificada'; } 
      else if (pasoDocumento.tipo === 'fotoLatDer') { campoFoto = 'fotoLatDer'; campoEstado = 'fotoLatDerVerificada'; }

      await updateDoc(userRef, { [campoFoto]: fotoDocTemporal, [campoEstado]: false });
      setUserData({ ...userData, [campoFoto]: fotoDocTemporal, [campoEstado]: false });
      setFotoDocTemporal(null); setPasoDocumento({ tipo: 'cedula', activa: false });
      alert("Documento enviado. Entrará en fase de revisión.");
    } catch (e) { alert("Error"); } finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-6">
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5"><div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[7px] font-black uppercase">RANGO: {obtenerRango()}</div></div>
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-slate-200 p-1 shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} key={refresh} alt="P" className="w-full h-full object-cover" /> : <User size={50} className="text-slate-200 mt-4" />}
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

            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Confianza</p><p className="text-lg font-black text-slate-800 uppercase">{totalVerificados} de 3</p></div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl text-2xl font-black text-orange-500">{porcentajeConfianza.toFixed(0)}%</div>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 shadow-inner"><div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${porcentajeConfianza}%` }} /></div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Información Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={UserCog} label="Nombre Completo" value={userData?.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData?.nombre}); setNuevoValor(userData?.nombre || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Número de Cédula" value={userData?.cedulaNumero} onClick={() => { setTipoEdicion({id:'cedulaNumero', label:'Cédula', valor:userData?.cedulaNumero}); setNuevoValor(userData?.cedulaNumero || ""); setModalVisible(true); }} />
                <MenuButton icon={Calendar} label="Fecha de Nacimiento" value={userData?.fechaNacimiento} onClick={() => { setTipoEdicion({id:'fechaNacimiento', label:'Fecha', valor:userData?.fechaNacimiento}); setNuevoValor(userData?.fechaNacimiento || ""); setModalVisible(true); }} />
                <MenuButton icon={Phone} label="Teléfono" value={userData?.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData?.telefono}); setNuevoValor(userData?.telefono || ""); setModalVisible(true); }} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Especificaciones del Auto</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <MenuButton icon={Car} label="Marca" value={userData?.vehiculo?.marca} onClick={() => { setTipoEdicion({id:'marca', label:'Marca', valor:userData?.vehiculo?.marca}); setNuevoValor(userData?.vehiculo?.marca || ""); setModalVisible(true); }} />
                <MenuButton icon={Gauge} label="Modelo" value={userData?.vehiculo?.modelo} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData?.vehiculo?.modelo}); setNuevoValor(userData?.vehiculo?.modelo || ""); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color" value={userData?.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData?.vehiculo?.color}); setNuevoValor(userData?.vehiculo?.color || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa / Matrícula" value={userData?.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData?.vehiculo?.placa}); setNuevoValor(userData?.vehiculo?.placa || ""); setModalVisible(true); }} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[3px] ml-4 italic">Estado del Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2 grid grid-cols-1">
                <MenuButton icon={Camera} label="Foto Frontal" status={userData?.fotoFrontalVerificada ? 'verificado' : (userData?.fotoFrontal ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoFrontal', activa:true, reglas: "Enfoca la placa y luces delanteras"})} />
                <MenuButton icon={Camera} label="Foto Trasera" status={userData?.fotoTraseraVerificada ? 'verificado' : (userData?.fotoTrasera ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoTrasera', activa:true, reglas: "Enfoca la placa trasera y modelo"})} />
                <MenuButton icon={Camera} label="Lateral Izquierda" status={userData?.fotoLatIzqVerificada ? 'verificado' : (userData?.fotoLatIzq ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatIzq', activa:true, reglas: "Costado del conductor"})} />
                <MenuButton icon={Camera} label="Lateral Derecha" status={userData?.fotoLatDerVerificada ? 'verificado' : (userData?.fotoLatDer ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoLatDer', activa:true, reglas: "Costado del pasajero"})} />
              </div>
            </div>

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
            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all"><LogOut size={14} /> Cerrar Sesión</button>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom">
            <h4 className="text-[10px] font-black text-blue-600 uppercase mb-2">EDITAR {tipoEdicion?.label}</h4>
            <input value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg border-2 border-slate-100 outline-none mb-8 uppercase" autoFocus />
            <button onClick={guardarCambios} disabled={cargando} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs">{cargando ? '...' : 'ACTUALIZAR'}</button>
          </div>
        </div>
      )}

      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col p-6 overflow-hidden">
          {!fotoDocTemporal ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center"><p className="text-blue-500 font-black text-xs uppercase italic tracking-widest mb-2">Instrucciones</p><p className="text-white text-sm font-bold uppercase">{pasoDocumento.reglas || "Asegúrate de que el documento sea legible"}</p></div>
              <div className={`relative w-full shadow-2xl bg-slate-800 ${pasoDocumento.tipo === 'selfie' ? 'aspect-square rounded-full border-4 border-dashed border-blue-500/50' : 'aspect-[1.6/1] rounded-3xl border-2 border-white/20'}`}>
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white font-black text-[10px] uppercase">{`Enmarca tu ${pasoDocumento.tipo}`}</div>
              </div>
              <button onClick={capturarDocumento} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">Capturar</button>
              <button onClick={() => setPasoDocumento({tipo:'cedula', activa:false})} className="w-full text-slate-500 font-black uppercase text-[10px] mt-4">Cancelar</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95">
              <div className={`w-full overflow-hidden border-4 border-blue-50 shadow-2xl ${pasoDocumento.tipo === 'selfie' ? 'aspect-square rounded-full' : 'aspect-[1.6/1] rounded-3xl'}`}><img src={fotoDocTemporal} className="w-full h-full object-cover" alt="X" /></div>
              <button onClick={subirDocumentoFinal} disabled={cargando} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">ENVIAR A REVISIÓN</button>
              <button onClick={() => setFotoDocTemporal(null)} className="w-full bg-white/10 text-white p-5 rounded-[25px] font-black uppercase text-xs">REPETIR FOTO</button>
            </div>
          )}
        </div>
      )}

      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 text-center animate-in fade-in">
          {!fotoTemporal ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center border-8 border-orange-100 relative shadow-inner"><User size={100} className="text-orange-200" /></div>
              <h3 className="text-3xl font-black text-slate-800 uppercase italic">¡Cheese!</h3>
              <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl">Cámara</button>
              <button onClick={() => setPasoFoto(false)} className="w-full text-slate-400 font-black uppercase text-[10px]">Ahora no</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95">
              <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-blue-50 shadow-2xl"><img src={fotoTemporal} className="w-full h-full object-cover" alt="P" /></div>
              <button onClick={subirFotoConfirmada} disabled={cargando} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl">USAR ESTA</button>
              <button onClick={() => setFotoTemporal(null)} className="w-full bg-slate-100 text-slate-500 p-5 rounded-[25px] font-black uppercase text-xs">OTRA</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, value, status, onClick }: any) => {
  let statusText = value || "Configurar";
  let statusColor = "text-blue-500"; 
  if (status === 'revision') { statusText = "EN REVISIÓN ⏳"; statusColor = "text-amber-500"; }
  else if (status === 'verificado') { statusText = "VERIFICADO ✅"; statusColor = "text-green-600"; }

  return (
    <button onClick={onClick} disabled={status === 'verificado' || status === 'revision'} className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors text-left disabled:opacity-90">
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm"><Icon size={20} /></div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5">{label}</p>
          <p className={`text-xs font-black uppercase tracking-tight ${statusColor}`}>{statusText}</p>
        </div>
      </div>
      {status !== 'verificado' && status !== 'revision' && <ChevronRight size={18} className="text-slate-200" />}
    </button>
  );
};
