import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  Calendar, ShieldCheck, RefreshCw, AlertCircle,
  Car, Palette, Hash, Gauge, LogOut, FileCheck, Camera
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
  const [modalClave, setModalClave] = useState(false);
  const [claves, setClaves] = useState({ actual: "", nueva: "" });
  const [usuariosAdmin, setUsuariosAdmin] = useState<any[]>([]);
  const [subPestañaAdmin, setSubPestañaAdmin] = useState<'pendientes' | 'aprobados'>('pendientes');
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);
  const [modalInstruccionesSelfie, setModalInstruccionesSelfie] = useState(false);
  const [usuarioExpandidoAdmin, setUsuarioExpandidoAdmin] = useState<string | null>(null);

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse">CARGANDO...</div>;
  
  const view = pestañaActiva || 'publico';
  const ADMIN_EMAIL = "lrhi199507@gmail.com";
  const esAdmin = auth.currentUser?.email ? auth.currentUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() : false;

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

  const puntosSeguridad = [
    !!userData.kycVerificado, !!userData.licenciaVerificada, !!userData.circulacionVerificada,
    !!userData.rcvVerificado, !!userData.selfieVerificada, !!userData.fotoFrontalVerificada,
    !!userData.fotoTraseraVerificada, !!userData.fotoLatIzqVerificada, !!userData.fotoLatDerVerificada
  ];
  const porcentajeConfianza = (puntosSeguridad.filter(Boolean).length / puntosSeguridad.length) * 100;

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
    } catch (e) { alert("Error"); } finally { setCargando(false); }
  };

  const guardarCambios = async () => {
    if (!tipoEdicion) return;
    setCargando(true);
    try {
      const field = ['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id) 
        ? `vehiculo.${tipoEdicion.id}` : tipoEdicion.id;
      const valorFinal = ['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id) ? nuevoValor.toUpperCase() : nuevoValor;
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { [field]: valorFinal });
      
      if (field.startsWith('vehiculo.')) {
        const key = tipoEdicion.id;
        setUserData({ ...userData, vehiculo: { ...userData.vehiculo, [key]: valorFinal }});
      } else {
        setUserData({ ...userData, [field]: valorFinal });
      }
      setModalVisible(false);
    } catch (e) { alert("Error"); } finally { setCargando(false); }
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
      const fieldMap: any = {
        cedula: { f: 'kycFoto', v: 'kycVerificado' },
        licencia: { f: 'licenciaFoto', v: 'licenciaVerificada' },
        circulacion: { f: 'circulacionFoto', v: 'circulacionVerificada' },
        rcv: { f: 'rcvFoto', v: 'rcvVerificado' },
        selfie: { f: 'selfieFoto', v: 'selfieVerificada' },
        fotoFrontal: { f: 'fotoFrontal', v: 'fotoFrontalVerificada' },
        fotoTrasera: { f: 'fotoTrasera', v: 'fotoTraseraVerificada' },
        fotoLatIzq: { f: 'fotoLatIzq', v: 'fotoLatIzqVerificada' },
        fotoLatDer: { f: 'fotoLatDer', v: 'fotoLatDerVerificada' },
        antecedentes: { f: 'antecedentesFoto', v: 'antecedentesVerificados' }
      };
      const { f, v } = fieldMap[pasoDocumento.tipo];
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { 
        [f]: fotoDocTemporal, 
        [v]: false,
        estadoRevision: "revision" 
      });
      setUserData({ ...userData, [f]: fotoDocTemporal, [v]: false, estadoRevision: "revision" });
      setFotoDocTemporal(null); setPasoDocumento({ tipo: 'cedula', activa: false });
      alert("Enviado para revisión.");
    } catch (e) { alert("Error"); } finally { setCargando(false); }
  };

  const cargarUsuariosAdmin = async () => {
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      setUsuariosAdmin(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const aprobarUsuario = async (userId: string) => {
    if (!userId) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userId);
      await updateDoc(userRef, {
        kycVerificado: true,
        licenciaVerificada: true,
        circulacionVerificada: true,
        rcvVerificado: true,
        fotoFrontalVerificada: true,
        fotoTraseraVerificada: true,
        fotoLatIzqVerificada: true,
        fotoLatDerVerificada: true,
        selfieVerificada: true,
        estadoRevision: "verificado"
      });
      alert("¡Usuario Verificado!");
      await cargarUsuariosAdmin();
    } catch (e: any) { alert("Error"); } finally { setCargando(false); }
  };

  const rechazarDocumentos = async (userId: string) => {
    if (!window.confirm("¿Rechazar fotos?")) return;
    try {
      const userRef = doc(db, "usuarios", userId);
      await updateDoc(userRef, {
        kycVerificado: false, kycFoto: null,
        licenciaVerificada: false, licenciaFoto: null,
        circulacionVerificada: false, circulacionFoto: null,
        rcvVerificado: false, rcvFoto: null,
        selfieVerificada: false, selfieFoto: null,
        fotoFrontalVerificada: false, fotoFrontal: null,
        fotoTraseraVerificada: false, fotoTrasera: null,
        fotoLatIzqVerificada: false, fotoLatIzq: null,
        fotoLatDerVerificada: false, fotoLatDer: null,
        estadoRevision: "rechazado",
        mensajeAdmin: "Tus documentos fueron rechazados. Por favor, sube fotos legibles."
      });
      alert("Rechazado.");
      setUsuarioExpandidoAdmin(null);
      await cargarUsuariosAdmin();
    } catch (e) { alert("Error"); }
  };

  const toggleBloqueoUsuario = async (userId: string, actual: boolean) => {
    try {
      await updateDoc(doc(db, "usuarios", userId), { cuentaBloqueada: !actual });
      await cargarUsuariosAdmin();
    } catch (e) { alert("Error"); }
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
        {view === 'publico' && (
          <div className="p-5 space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5">
                <div className={`${obtenerColorRango(rangoActual)} text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse`}>{rangoActual}</div>
              </div>
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-slate-200 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" /> : <User size={50} className="text-slate-200" />}
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

            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo Nivel: {proximoNivel.nombre}</p>
                  <p className="text-sm font-black text-slate-800 italic uppercase">{proximoNivel.faltan > 0 ? `Te faltan ${proximoNivel.faltan} viajes` : "¡Leyenda!"}</p>
                </div>
                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{totalTrayectoria} / {proximoNivel.meta} VJS</div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000" style={{ width: `${porcentajeNivel}%` }} />
              </div>
            </div>
          </div>
        )}

        {view === 'cuenta' && (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            {userData.estadoRevision === 'rechazado' && (
              <div className="mx-2 bg-orange-50 border-2 border-orange-100 rounded-[30px] p-6 animate-in zoom-in">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500 p-2 rounded-xl text-white"><AlertCircle size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-orange-600 uppercase italic mb-1">Atención Requerida</p>
                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{userData.mensajeAdmin || "Revisa tus documentos."}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre); setModalVisible(true); }} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono); setModalVisible(true); }} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Fotos del Auto</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Camera} label="Frontal" status={userData.fotoFrontalVerificada ? 'verificado' : (userData.fotoFrontal ? 'revision' : (userData.estadoRevision === 'rechazado' ? 'rechazado' : 'pendiente'))} onClick={() => setPasoDocumento({tipo:'fotoFrontal', activa:true})} />
                <MenuButton icon={Camera} label="Trasera" status={userData.fotoTraseraVerificada ? 'verificado' : (userData.fotoTrasera ? 'revision' : (userData.estadoRevision === 'rechazado' ? 'rechazado' : 'pendiente'))} onClick={() => setPasoDocumento({tipo:'fotoTrasera', activa:true})} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Legal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={FileText} label="Cédula" status={userData.kycVerificado ? 'verificado' : (userData.kycFoto ? 'revision' : (userData.estadoRevision === 'rechazado' ? 'rechazado' : 'pendiente'))} onClick={() => setPasoDocumento({tipo:'cedula', activa:true})} />
                <MenuButton icon={User} label="Selfie con Documento" status={userData.selfieVerificada ? 'verificado' : (userData.selfieFoto ? 'revision' : (userData.estadoRevision === 'rechazado' ? 'rechazado' : 'pendiente'))} onClick={() => setPasoDocumento({tipo:'selfie', activa:true})} />
              </div>
            </div>

            {esAdmin && (
              <button onClick={() => { cargarUsuariosAdmin(); setPestañaActiva('admin'); }} className="w-full bg-slate-900 text-white p-5 rounded-[30px] flex items-center justify-between shadow-xl mt-6">
                <div className="flex items-center gap-4">
                  <ShieldCheck size={20} className="text-red-500" />
                  <p className="font-black text-xs uppercase italic">Control Maestro</p>
                </div>
                <ChevronRight size={20} />
              </button>
            )}

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2">
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        )}

        {view === 'admin' && (
          <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white">
              <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl">
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <h2 className="font-black italic uppercase text-sm">Control Maestro</h2>
              <button onClick={cargarUsuariosAdmin} className="text-blue-400 bg-blue-400/10 p-2 rounded-xl"><RefreshCw size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
              {cargando ? (
                <p className="text-center p-10 text-slate-500 italic animate-pulse text-xs font-black uppercase">Sincronizando...</p>
              ) : (
                usuariosAdmin
                .filter(u => subPestañaAdmin === 'pendientes' ? (u.estadoRevision === 'revision' || (u.kycFoto && !u.kycVerificado)) : u.kycVerificado)
                .map(u => {
                  const estaExpandido = usuarioExpandidoAdmin === u.id;
                  return (
                    <div key={u.id} className="bg-slate-900 border border-white/5 rounded-[25px] overflow-hidden">
                      <button onClick={() => setUsuarioExpandidoAdmin(estaExpandido ? null : u.id)} className="w-full flex items-center justify-between p-5 text-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-black text-xs">{u.nombre?.charAt(0).toUpperCase()}</div>
                          <div className="text-left">
                            <p className="font-black text-xs uppercase italic">{u.nombre}</p>
                            <p className="text-[9px] text-slate-500 font-bold">{u.correo || u.email}</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className={`text-slate-600 transition-transform ${estaExpandido ? 'rotate-90' : ''}`} />
                      </button>

                      {estaExpandido && (
                        <div className="p-6 pt-0 space-y-6 animate-in slide-in-from-top duration-200">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[7px] font-black text-slate-500 uppercase mb-2">Cédula</p>
                              <div onClick={() => u.kycFoto && setFotoZoom(u.kycFoto)} className="bg-slate-800 aspect-square rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                                {u.kycFoto ? <img src={u.kycFoto} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-700" />}
                              </div>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-slate-500 uppercase mb-2">Selfie + ID</p>
                              <div onClick={() => u.selfieFoto && setFotoZoom(u.selfieFoto)} className="bg-slate-800 aspect-square rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                                {u.selfieFoto ? <img src={u.selfieFoto} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-700" />}
                              </div>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-slate-500 uppercase mb-2">Vehículo</p>
                              <div onClick={() => u.fotoFrontal && setFotoZoom(u.fotoFrontal)} className="bg-slate-800 aspect-square rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                                {u.fotoFrontal ? <img src={u.fotoFrontal} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-700" />}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                             <button onClick={() => aprobarUsuario(u.id)} className="w-full bg-green-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase">Aprobar Verificación</button>
                             <div className="flex gap-2">
                                <button onClick={() => rechazarDocumentos(u.id)} className="flex-1 bg-slate-800 text-orange-500 p-4 rounded-2xl font-black text-[9px] uppercase border border-white/5">Rechazar</button>
                                <button onClick={() => toggleBloqueoUsuario(u.id, u.cuentaBloqueada)} className="flex-1 bg-red-600 text-white p-4 rounded-2xl font-black text-[9px] uppercase">{u.cuentaBloqueada ? 'Desbloquear' : 'Bloquear'}</button>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALES COMUNES */}
      {modalVisible && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalVisible(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 animate-in slide-in-from-bottom">
            <h4 className="text-[10px] font-black text-blue-600 uppercase mb-6 italic text-center tracking-widest">Editar {tipoEdicion?.label}</h4>
            <input value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg mb-8 outline-none border-2 border-slate-100 uppercase text-center" autoFocus />
            <button onClick={guardarCambios} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs shadow-lg">Guardar</button>
          </div>
        </div>
      )}

      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col p-6 items-center justify-center space-y-6">
          {!fotoDocTemporal ? (
            <>
              <p className="text-white text-sm font-black uppercase italic tracking-widest text-center">Capturar {pasoDocumento.tipo}</p>
              <div className="w-full aspect-video bg-slate-800 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center"><Camera size={40} className="text-slate-700" /></div>
              <button onClick={capturarDocumento} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs">Tomar Foto</button>
              <button onClick={() => setPasoDocumento({...pasoDocumento, activa: false})} className="text-slate-500 font-black uppercase text-[10px]">Cancelar</button>
            </>
          ) : (
            <>
              <div className="w-full aspect-video rounded-3xl overflow-hidden border-4 border-blue-50"><img src={fotoDocTemporal} className="w-full h-full object-cover" /></div>
              <button onClick={subirDocumentoFinal} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs">Enviar Documento</button>
              <button onClick={() => setFotoDocTemporal(null)} className="text-white font-black uppercase text-[10px]">Repetir</button>
            </>
          )}
        </div>
      )}

      {fotoZoom && (
        <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setFotoZoom(null)}>
          <img src={fotoZoom} className="max-w-full max-h-[80vh] object-contain rounded-3xl" />
        </div>
      )}

      {pasoFoto && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col p-8 items-center justify-center text-center">
          {!fotoTemporal ? (
            <>
              <div className="w-44 h-44 bg-orange-50 rounded-full flex items-center justify-center mb-10"><User size={80} className="text-orange-200" /></div>
              <button onClick={() => seleccionarImagen(CameraSource.Camera)} className="w-full bg-blue-600 text-white p-5 rounded-[25px] font-black uppercase text-xs">Tomar Foto Perfil</button>
              <button onClick={() => setPasoFoto(false)} className="text-slate-400 font-black uppercase text-[10px] mt-6">Cerrar</button>
            </>
          ) : (
            <>
              <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-blue-50 mb-10"><img src={fotoTemporal} className="w-full h-full object-cover" /></div>
              <button onClick={subirFotoConfirmada} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase text-xs">Confirmar</button>
              <button onClick={() => setFotoTemporal(null)} className="text-slate-400 font-black uppercase text-[10px] mt-6">Elegir otra</button>
            </>
          )}
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
  if (status === 'rechazado') { statusText = "REINTENTAR ⚠️"; statusColor = "text-orange-600"; }

  return (
    <button onClick={onClick} disabled={status === 'verificado' || status === 'revision'} className="w-full flex items-center justify-between p-5 border-b border-slate-50 last:border-0 active:bg-slate-50 disabled:opacity-80">
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm"><Icon size={20} /></div>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5">{label}</p>
          <p className={`text-xs font-black uppercase ${statusColor}`}>{statusText}</p>
        </div>
      </div>
      {status !== 'verificado' && status !== 'revision' && <ChevronRight size={18} className="text-slate-200" />}
    </button>
  );
};
