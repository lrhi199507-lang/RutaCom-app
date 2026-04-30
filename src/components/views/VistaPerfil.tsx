import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  ShieldCheck, RefreshCw, AlertCircle,
  Car, Palette, Hash, Gauge, LogOut, Camera, X
} from 'lucide-react';

const auth = getAuth();

export const VistaPerfil = ({ userData, setUserData, handleLogout, pestañaActiva, setPestañaActiva }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fotoDocTemporal, setFotoDocTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [pasoDocumento, setPasoDocumento] = useState<{tipo: string, activa: boolean, reglas?: string}>({tipo: 'cedula', activa: false});
  const [usuariosAdmin, setUsuariosAdmin] = useState<any[]>([]);
  const [reportesAdmin, setReportesAdmin] = useState<any[]>([]);
  const [subPestañaAdmin, setSubPestañaAdmin] = useState<'pendientes' | 'aprobados' | 'reportes'>('pendientes');
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);
  const [usuarioExpandidoAdmin, setUsuarioExpandidoAdmin] = useState<string | null>(null);

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  
  const view = pestañaActiva || 'publico';
  const ADMIN_EMAIL = "lrhi199507@gmail.com";
  const esAdmin = auth.currentUser?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // --- LOGICA ADMIN ---
  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const snapUsers = await getDocs(collection(db, "usuarios"));
      setUsuariosAdmin(snapUsers.docs.map(d => ({ id: d.id, ...d.data() })));
      const snapReports = await getDocs(collection(db, "Reportes"));
      setReportesAdmin(snapReports.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const resolverReporte = async (reporteId: string) => {
    if(!window.confirm("¿Marcar como revisado?")) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, "Reportes", reporteId));
      setReportesAdmin(reportesAdmin.filter(r => r.id !== reporteId));
    } catch (e) { alert("Error"); }
  };

  const aprobarUsuario = async (userId: string) => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userId), {
        kycVerificado: true, licenciaVerificada: true, circulacionVerificada: true,
        rcvVerificado: true, fotoFrontalVerificada: true, fotoTraseraVerificada: true,
        fotoLatIzqVerificada: true, fotoLatDerVerificada: true, selfieVerificada: true
      });
      await cargarDatosAdmin();
    } catch (e) { alert("Error"); } finally { setCargando(false); }
  };

  const rechazarDocumentos = async (userId: string) => {
    if (!window.confirm("¿Rechazar fotos?")) return;
    try {
      await updateDoc(doc(db, "usuarios", userId), {
        kycVerificado: false, kycFoto: null, selfieVerificada: false, selfieFoto: null,
        estadoRevision: "rechazado", mensajeAdmin: "Documentos no legibles."
      });
      await cargarDatosAdmin();
    } catch (e) { alert("Error"); }
  };

  // --- LOGICA USUARIO ---
  const viajesCond = userData.viajesRealizados || 0;
  const viajesPas = userData.viajesComoPasajero || 0;
  const totalTrayectoria = viajesCond + viajesPas;
  const rangoActual = totalTrayectoria >= 50 ? "LEYENDA" : totalTrayectoria >= 20 ? "ORO" : totalTrayectoria >= 10 ? "PLATA" : "NOVATO";

  const togglePreferencia = async (campo: string, nuevoEstado: boolean) => {
    try {
      await updateDoc(doc(db, "usuarios", auth.currentUser?.uid || userData.id), { [campo]: nuevoEstado });
      setUserData({ ...userData, [campo]: nuevoEstado });
    } catch (e) { console.log(e); }
  };

  const guardarCambios = async () => {
    if (!tipoEdicion) return;
    setModalVisible(false); setCargando(true);
    try {
      const esVehiculo = ['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id);
      const field = esVehiculo ? `vehiculo.${tipoEdicion.id}` : tipoEdicion.id;
      const valorFinal = esVehiculo ? nuevoValor.toUpperCase() : nuevoValor;
      await updateDoc(doc(db, "usuarios", auth.currentUser?.uid || userData.id), { [field]: valorFinal });
      setUserData({ ...userData, [esVehiculo ? 'vehiculo' : tipoEdicion.id]: esVehiculo ? { ...userData.vehiculo, [tipoEdicion.id]: valorFinal } : valorFinal });
    } catch (e) { console.log(e); } finally { setCargando(false); }
  };

  const capturarDocumento = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 40, width: 800, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
      if (image.dataUrl) setFotoDocTemporal(image.dataUrl);
    } catch (e) { console.log("Cancelado"); }
  };

  const subirDocumentoFinal = async () => {
    if (!fotoDocTemporal) return;
    setCargando(true);
    try {
      const fieldMap: any = {
        cedula: { f: 'kycFoto', v: 'kycVerificado' },
        selfie: { f: 'selfieFoto', v: 'selfieVerificada' },
        licencia: { f: 'licenciaFoto', v: 'licenciaVerificada' },
        rcv: { f: 'rcvFoto', v: 'rcvVerificado' },
        fotoFrontal: { f: 'fotoFrontal', v: 'fotoFrontalVerificada' },
        fotoTrasera: { f: 'fotoTrasera', v: 'fotoTraseraVerificada' },
        fotoLatIzq: { f: 'fotoLatIzq', v: 'fotoLatIzqVerificada' },
        fotoLatDer: { f: 'fotoLatDer', v: 'fotoLatDerVerificada' }
      };
      const { f, v } = fieldMap[pasoDocumento.tipo];
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { [f]: fotoDocTemporal, [v]: false, estadoRevision: "pendiente" });
      setUserData({ ...userData, [f]: fotoDocTemporal, [v]: false });
      setFotoDocTemporal(null); setPasoDocumento({ ...pasoDocumento, activa: false });
    } catch (e) { console.log(e); } finally { setCargando(false); }
  };

  const handleLogoutLocal = () => handleLogout();

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' && (
          <div className="p-5 space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5">
                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">{rangoActual}</div>
              </div>
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-slate-200 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" /> : <User size={50} className="text-slate-200" />}
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">{userData.nombre || "Usuario"}</h2>
            </div>
          </div>
        )}

        {view === 'cuenta' && (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
              <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre); setModalVisible(true); }} />
              <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono); setModalVisible(true); }} />
            </div>
            {esAdmin && (
              <button onClick={() => { cargarDatosAdmin(); setPestañaActiva('admin'); }} className="w-full bg-slate-900 text-white p-5 rounded-[30px] flex items-center justify-between shadow-xl mt-6">
                <div className="flex items-center gap-4"><ShieldCheck size={20} className="text-red-500" /><p className="font-black text-xs uppercase italic">Control Maestro</p></div>
                <ChevronRight size={20} />
              </button>
            )}
            <button onClick={handleLogoutLocal} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] flex items-center justify-center gap-2 mt-4"><LogOut size={14} /> Cerrar Sesión</button>
          </div>
        )}

        {view === 'admin' && (
          <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white">
              <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl"><ChevronRight size={20} className="rotate-180" /></button>
              <h2 className="font-black italic uppercase text-sm tracking-tighter">Control Maestro</h2>
              <button onClick={cargarDatosAdmin} className="text-blue-400 bg-blue-400/10 p-2 rounded-xl"><RefreshCw size={20} /></button>
            </div>
            <div className="flex bg-slate-900 p-1 border-b border-white/5">
              <button onClick={() => setSubPestañaAdmin('pendientes')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'pendientes' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-600'}`}>Pendientes ({usuariosAdmin.filter(u => (u.kycFoto && !u.kycVerificado) || (u.fotoFrontal && !u.fotoFrontalVerificada)).length})</button>
              <button onClick={() => setSubPestañaAdmin('reportes')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'reportes' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-600'}`}>Reportes ({reportesAdmin.length})</button>
              <button onClick={() => setSubPestañaAdmin('aprobados')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'aprobados' ? 'text-green-500 border-b-2 border-green-500' : 'text-slate-600'}`}>Aprobados</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
              {cargando ? <p className="text-center p-10 text-slate-500 italic animate-pulse text-xs uppercase font-black">Sincronizando...</p> : 
               subPestañaAdmin === 'reportes' ? reportesAdmin.map(r => (
                <div key={r.id} className="bg-slate-900 border border-red-500/20 rounded-[25px] p-5 space-y-3 text-white">
                  <div className="flex justify-between">
                    <p className="text-[10px] font-black uppercase italic">Denunciado: {r.nombreReportado}</p>
                    <button onClick={() => resolverReporte(r.id)}><ShieldCheck size={16} /></button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">"{r.motivo}"</p>
                </div>
               )) : usuariosAdmin.filter(u => subPestañaAdmin === 'pendientes' ? ((u.kycFoto && !u.kycVerificado) || (u.fotoFrontal && !u.fotoFrontalVerificada)) : u.kycVerificado).map(u => (
                <div key={u.id} className="bg-slate-900 border border-white/5 rounded-[25px] p-5 text-white">
                   <p className="font-black text-xs uppercase italic">{u.nombre}</p>
                   <div className="flex gap-2 mt-4">
                     <button onClick={() => aprobarUsuario(u.id)} className="bg-green-600 p-2 rounded-xl text-[10px] font-black uppercase flex-1">Aprobar</button>
                     <button onClick={() => rechazarDocumentos(u.id)} className="bg-red-500 p-2 rounded-xl text-[10px] font-black uppercase flex-1">Rechazar</button>
                   </div>
                </div>
               ))}
            </div>
          </div>
        )}
      </div> {/* AQUI CERRAMOS EL CONTENEDOR DE VISTAS QUE FALTABA */}

      {/* MODALES FUERA DEL CONTENEDOR DE SCROLL */}
      {modalVisible && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10">
            <input value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg mb-8 outline-none border-2 border-slate-100 uppercase text-center" autoFocus />
            <button onClick={guardarCambios} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, value, status, onClick }: any) => {
  let statusText = value || "Configurar";
  let statusColor = "text-blue-500";
  if (status === 'revision') { statusText = "REVISIÓN ⏳"; statusColor = "text-amber-500"; }
  if (status === 'verificado') { statusText = "LISTO ✅"; statusColor = "text-green-600"; }
  return (
    <button onClick={onClick} disabled={status === 'verificado' || status === 'revision'} className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 overflow-hidden">
      <div className="flex items-center gap-5 flex-1 min-w-0 text-left">
        <Icon size={20} className="text-slate-400 shrink-0" />
        <div className="truncate">
          <p className="text-[10px] font-black text-slate-400 uppercase italic mb-1">{label}</p>
          <p className={`text-xs font-black uppercase ${statusColor} truncate`}>{statusText}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-200 shrink-0" />
    </button>
  );
};
