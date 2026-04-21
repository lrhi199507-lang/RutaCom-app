import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth, updatePassword } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  Calendar, ShieldCheck, RefreshCw,
  Car, Palette, Hash, Gauge, LogOut, FileCheck, Camera
} from 'lucide-react';

const auth = getAuth();

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
  const [usuariosAdmin, setUsuariosAdmin] = useState<any[]>([]);
  
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  
  const view = pestañaActiva || 'publico';
  const ADMIN_EMAIL = "lrhi199507@gmail.com";
  const esAdmin = auth.currentUser?.email ? auth.currentUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() : false;

  // --- LÓGICA DE TRAYECTORIA ---
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
      default: return "bg-blue-600";
    }
  };

  const calcularSiguienteNivel = () => {
    const total = totalTrayectoria;
    if (total < 10) return { meta: 10, faltan: 10 - total, nombre: "PLATA" };
    if (total < 20) return { meta: 20, faltan: 20 - total, nombre: "ORO" };
    if (total < 50) return { meta: 50, faltan: 50 - total, nombre: "LEYENDA" };
    return { meta: total, faltan: 0, nombre: "MÁXIMO" };
  };

  const rangoActual = obtenerRango();
  const proximoNivel = calcularSiguienteNivel();
  const porcentajeNivel = Math.min((totalTrayectoria / proximoNivel.meta) * 100, 100);

  // --- LÓGICA DE VERIFICACIÓN ---
  const puntosSeguridad = [
    !!userData.kycVerificado, !!userData.licenciaVerificada, !!userData.circulacionVerificada,
    !!userData.rcvVerificado, !!userData.selfieVerificada, !!userData.fotoFrontalVerificada,
    !!userData.fotoTraseraVerificada, !!userData.fotoLatIzqVerificada, !!userData.fotoLatDerVerificada
  ];
  const porcentajeConfianza = (puntosSeguridad.filter(Boolean).length / puntosSeguridad.length) * 100;

  // --- FUNCIONES DE ACCIÓN ---
  const cambiarContraseña = async () => {
    if (claves.nueva.length < 6) return alert("Mínimo 6 caracteres");
    setCargando(true);
    try {
      await updatePassword(auth.currentUser!, claves.nueva);
      alert("Contraseña actualizada");
      setModalClave(false);
    } catch (e) { alert("Error: Inicia sesión de nuevo para esta acción."); }
    finally { setCargando(false); }
  };

  const seleccionarImagen = async (source: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 25, width: 600, resultType: CameraResultType.DataUrl, source });
      if (image.dataUrl) setFotoTemporal(image.dataUrl);
    } catch (e) { console.log("Cancelado"); }
  };

  const subirFotoConfirmada = async () => {
    if (!fotoTemporal) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { fotoPerfil: fotoTemporal });
      setUserData({ ...userData, fotoPerfil: fotoTemporal });
      setPasoFoto(false); setFotoTemporal(null);
    } catch (e) { alert("Error al subir"); } finally { setCargando(false); }
  };

  const guardarCambios = async () => {
    if (!tipoEdicion) return;
    setCargando(true);
    try {
      const field = ['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id) 
        ? `vehiculo.${tipoEdicion.id}` : tipoEdicion.id;
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { [field]: nuevoValor });
      setUserData({ ...userData, [field]: nuevoValor });
      setModalVisible(false);
    } catch (e) { alert("Error al guardar"); } finally { setCargando(false); }
  };

  const capturarDocumento = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 35, width: 900, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
      if (image.dataUrl) setFotoDocTemporal(image.dataUrl);
    } catch (e) { console.log("Cancelado"); }
  };

  const subirDocumentoFinal = async () => {
    if (!fotoDocTemporal) return;
    setCargando(true);
    try {
      const maps: any = {
        cedula: 'kyc', licencia: 'licencia', circulacion: 'circulacion',
        rcv: 'rcv', selfie: 'selfie', fotoFrontal: 'fotoFrontal',
        fotoTrasera: 'fotoTrasera', fotoLatIzq: 'fotoLatIzq', fotoLatDer: 'fotoLatDer'
      };
      const prefix = maps[pasoDocumento.tipo];
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { 
        [`${prefix}Foto`]: fotoDocTemporal, [`${prefix}Verificado`]: false 
      });
      setUserData({ ...userData, [`${prefix}Foto`]: fotoDocTemporal, [`${prefix}Verificado`]: false });
      setFotoDocTemporal(null); setPasoDocumento({ tipo: 'cedula', activa: false });
    } catch (e) { alert("Error al subir"); } finally { setCargando(false); }
  };

  const cargarUsuariosAdmin = async () => {
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      setUsuariosAdmin(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const aprobarDocumento = async (userId: string, campo: string) => {
    try {
      await updateDoc(doc(db, "usuarios", userId), { [campo]: true });
      cargarUsuariosAdmin();
      alert("Aprobado ✅");
    } catch (e) { alert("Error"); }
  };

  const formatearCedula = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formatearFecha = (v: string) => {
    let r = v.replace(/\D/g, '').slice(0, 8);
    if (r.length >= 5) return `${r.slice(0, 2)}/${r.slice(2, 4)}/${r.slice(4)}`;
    if (r.length >= 3) return `${r.slice(0, 2)}/${r.slice(2)}`;
    return r;
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      {/* HEADER NAV */}
      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* VISTA PÚBLICA */}
        {view === 'publico' && (
          <div className="p-5 space-y-6">
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5">
                <div className={`${obtenerColorRango(rangoActual)} text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg`}>{rangoActual}</div>
              </div>
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-slate-200 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" alt="P" /> : <User size={50} className="text-slate-200" />}
                  </div>
                </div>
                <button onClick={() => setPasoFoto(true)} className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full border-4 border-white shadow-lg active:scale-90"><Edit2 size={14} /></button>
              </div>
              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">{userData.nombre || "Usuario"}</h2>
              <div className="flex justify-center gap-6 mt-4 border-t border-slate-50 pt-4">
                <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Conductor</p><p className="font-black text-blue-600 italic">{viajesCond} VJS</p></div>
                <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Pasajero</p><p className="font-black text-orange-500 italic">{viajesPas} VJS</p></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Próximo Nivel: {proximoNivel.nombre}</p>
                  <p className="text-sm font-black text-slate-800 italic uppercase">{proximoNivel.faltan > 0 ? `Te faltan ${proximoNivel.faltan} viajes` : "¡Leyenda!"}</p>
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black text-blue-600">{totalTrayectoria} / {proximoNivel.meta}</div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000" style={{ width: `${porcentajeNivel}%` }} />
              </div>
            </div>

            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-5">Confianza del Perfil: {porcentajeConfianza.toFixed(0)}%</p>
              <div className="w-full h-4 bg-slate-100 rounded-full p-1"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${porcentajeConfianza}%` }} /></div>
            </div>
          </div>
        )}

        {/* VISTA CUENTA */}
        {view === 'cuenta' && (
          <div className="p-5 space-y-8 pb-24">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Información Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Cédula" value={userData.cedulaNumero} onClick={() => { setTipoEdicion({id:'cedulaNumero', label:'Cédula', valor:userData.cedulaNumero}); setNuevoValor(userData.cedulaNumero); setModalVisible(true); }} />
                <MenuButton icon={Calendar} label="Nacimiento" value={userData.fechaNacimiento} onClick={() => { setTipoEdicion({id:'fechaNacimiento', label:'Fecha', valor:userData.fechaNacimiento}); setNuevoValor(userData.fechaNacimiento); setModalVisible(true); }} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono); setModalVisible(true); }} />
                <MenuButton icon={ShieldCheck} label="Seguridad" value="••••••••" onClick={() => setModalClave(true)} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Car} label="Marca" value={userData.vehiculo?.marca} onClick={() => { setTipoEdicion({id:'marca', label:'Marca', valor:userData.vehiculo?.marca}); setNuevoValor(userData.vehiculo?.marca); setModalVisible(true); }} />
                <MenuButton icon={Gauge} label="Modelo" value={userData.vehiculo?.modelo} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData.vehiculo?.modelo}); setNuevoValor(userData.vehiculo?.modelo); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color" value={userData.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData.vehiculo?.color}); setNuevoValor(userData.vehiculo?.color); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa" value={userData.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData.vehiculo?.placa}); setNuevoValor(userData.vehiculo?.placa); setModalVisible(true); }} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Documentación Legal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={FileText} label="Cédula (Foto)" status={userData.kycVerificado ? 'verificado' : (userData.kycFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'cedula', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Licencia" status={userData.licenciaVerificada ? 'verificado' : (userData.licenciaFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'licencia', activa:true})} />
                <MenuButton icon={User} label="Selfie" status={userData.selfieVerificada ? 'verificado' : (userData.selfieFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'selfie', activa:true})} />
              </div>
            </div>

            {esAdmin && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-[3px] ml-4 italic">Administración</p>
                <button onClick={() => { cargarUsuariosAdmin(); setPestañaActiva('admin'); }} className="w-full bg-slate-900 text-white p-5 rounded-[30px] flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-4"><ShieldCheck size={20} className="text-red-500" /><p className="font-black text-xs uppercase italic">Control Maestro</p></div>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 active:scale-95"><LogOut size={14} /> Cerrar Sesión</button>
          </div>
        )}

        {/* VISTA ADMIN */}
        {view === 'admin' && (
          <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white">
              <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl"><ChevronRight size={20} className="rotate-180" /></button>
              <h2 className="font-black italic uppercase text-sm tracking-tighter">Control Maestro</h2>
              <button onClick={cargarUsuariosAdmin} className="text-blue-400 bg-blue-400/10 p-2 rounded-xl"><RefreshCw size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
              <p className="text-[10px] font-black text-slate-500 uppercase ml-2 italic tracking-widest text-white">Pendientes por aprobar:</p>
              {usuariosAdmin.length === 0 ? <p className="text-center p-10 text-slate-500 italic">Sin datos</p> : 
                usuariosAdmin.filter(u => u.kycFoto && !u.kycVerificado).map(u => (
                  <div key={u.id} className="bg-slate-900 border border-white/5 p-4 rounded-[30px] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden"><img src={u.fotoPerfil || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="perfil" /></div>
                      <div className="text-white text-left"><p className="font-black text-xs uppercase italic">{u.nombre}</p><p className="text-slate-500 text-[9px]">{u.email}</p></div>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img src={u.kycFoto} className="w-full h-48 object-contain" alt="kyc" />
                      <button onClick={() => aprobarDocumento(u.id, 'kycVerificado')} className="absolute bottom-2 right-2 bg-green-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg">Aprobar ✅</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* MODALES GLOBALES */}
      {modalClave && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalClave(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom duration-300">
            <h4 className="text-[10px] font-black text-blue-600 uppercase mb-6 tracking-widest italic">Seguridad</h4>
            <input type="password" value={claves.nueva} onChange={(e) => setClaves({...claves, nueva: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg mb-8 outline-none border-2 border-slate-100" placeholder="Nueva Clave" />
            <button onClick={cambiarContraseña} className="w-full bg-slate-900 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg active:scale-95">Confirmar</button>
          </div>
        </div>
      )}

      {modalVisible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom duration-300">
            <h4 className="text-[10px] font-black text-blue-600 uppercase mb-6 tracking-widest italic">Editar {tipoEdicion?.label}</h4>
            <input value={nuevoValor} onChange={(e) => {
              let val = e.target.value;
              if (tipoEdicion?.id === 'cedulaNumero') val = formatearCedula(val);
              if (tipoEdicion?.id === 'fechaNacimiento') val = formatearFecha(val);
              setNuevoValor(val);
            }} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg mb-8 outline-none border-2 border-slate-100 uppercase" autoFocus />
            <button onClick={guardarCambios} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg active:scale-95">Guardar</button>
          </div>
        </div>
      )}

      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col p-6 items-center justify-center space-y-6">
          {!fotoDocTemporal ? (
            <>
              <p className="text-white text-sm font-black uppercase italic tracking-widest">Enfoca tu {pasoDocumento.tipo}</p>
              <div className="w-full aspect-[1.6/1] bg-slate-800 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center"><Camera size={50} className="text-slate-700" /></div>
              <button onClick={capturarDocumento} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">Tomar Foto</button>
              <button onClick={() => setPasoDocumento({...pasoDocumento, activa: false})} className="text-slate-500 font-black uppercase text-[10px]">Cerrar</button>
            </>
          ) : (
            <>
              <div className="w-full aspect-[1.6/1] rounded-3xl overflow-hidden border-4 border-blue-500"><img src={fotoDocTemporal} className="w-full h-full object-cover" alt="prev" /></div>
              <button onClick={subirDocumentoFinal} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">Enviar a Revisión</button>
              <button onClick={() => setFotoDocTemporal(null)} className="text-white font-black uppercase text-[10px]">Repetir</button>
            </>
          )}
        </div>
      )}

      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 items-center justify-center text-center">
          {!fotoTemporal ? (
            <>
              <div className="w-44 h-44 bg-orange-50 rounded-full border-8 border-orange-100 flex items-center justify-center mb-10"><User size={100} className="text-orange-200" /></div>
              <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">Tomar Foto Perfil</button>
              <button onClick={() => setPasoFoto(false)} className="text-slate-400 font-black uppercase text-[10px] mt-6">Cerrar</button>
            </>
          ) : (
            <>
              <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-blue-50 shadow-2xl mb-10"><img src={fotoTemporal} className="w-full h-full object-cover" alt="prev" /></div>
              <button onClick={subirFotoConfirmada} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs shadow-xl active:scale-95">Esta se ve bien</button>
              <button onClick={() => setFotoTemporal(null)} className="text-slate-400 font-black uppercase text-[10px] mt-6">Elegir otra</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// COMPONENTE AUXILIAR
const MenuButton = ({ icon: Icon, label, value, status, onClick }: any) => {
  let statusText = value || "Configurar";
  let statusColor = "text-blue-500"; 
  if (status === 'revision') { statusText = "EN REVISIÓN ⏳"; statusColor = "text-amber-500"; }
  else if (status === 'verificado') { statusText = "VERIFICADO ✅"; statusColor = "text-green-600"; }

  return (
    <button onClick={onClick} disabled={status === 'verificado' || status === 'revision'} className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors disabled:opacity-80">
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm"><Icon size={20} /></div>
        <div className="text-left"><p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5 tracking-tight">{label}</p><p className={`text-xs font-black uppercase tracking-tight ${statusColor}`}>{statusText}</p></div>
      </div>
      {status !== 'verificado' && status !== 'revision' && <ChevronRight size={18} className="text-slate-200" />}
    </button>
  );
};
