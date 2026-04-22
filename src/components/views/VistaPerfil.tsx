import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth } from 'firebase/auth';
import { 
  UserCog, ChevronRight, Phone, FileText, User, Edit2, 
  Calendar, ShieldCheck, RefreshCw, AlertCircle,
  Car, Palette, Hash, Gauge, LogOut, Camera, Star, MessageSquare,
  ChevronDown, LayoutGrid, CheckCircle2
} from 'lucide-react';

const auth = getAuth();

export const VistaPerfil = ({ userData, setUserData, handleLogout, pestañaActiva, setPestañaActiva }: any) => {
  // --- ESTADOS ORIGINALES RECUPERADOS ---
  const [modalVisible, setModalVisible] = useState(false);
  const [pasoFoto, setPasoFoto] = useState(false); 
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fotoDocTemporal, setFotoDocTemporal] = useState<string | null>(null);
  const [tipoEdicion, setTipoEdicion] = useState<{id: string, label: string, valor: string} | null>(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [pasoDocumento, setPasoDocumento] = useState<{tipo: string, activa: boolean, reglas?: string}>({tipo: 'cedula', activa: false});
  const [usuariosAdmin, setUsuariosAdmin] = useState<any[]>([]);
  const [subPestañaAdmin, setSubPestañaAdmin] = useState<'pendientes' | 'aprobados'>('pendientes');
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);
  const [modalInstruccionesSelfie, setModalInstruccionesSelfie] = useState(false);
  const [usuarioExpandidoAdmin, setUsuarioExpandidoAdmin] = useState<string | null>(null);
  const [verPerfilPublicoChofer, setVerPerfilPublicoChofer] = useState(false);

  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400 animate-pulse uppercase">Sincronizando Datos...</div>;
  
  const view = pestañaActiva || 'publico';
  const ADMIN_EMAIL = "lrhi199507@gmail.com";
  const esAdmin = auth.currentUser?.email ? auth.currentUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() : false;

  // --- LÓGICA DE RANGOS Y NIVELES (SIN SIMPLIFICAR) ---
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

  // --- LÓGICA DE SEGURIDAD (TODOS LOS PUNTOS) ---
  const puntosSeguridad = [
    !!userData.kycVerificado, !!userData.licenciaVerificada, !!userData.circulacionVerificada,
    !!userData.rcvVerificado, !!userData.selfieVerificada, !!userData.fotoFrontalVerificada,
    !!userData.fotoTraseraVerificada, !!userData.fotoLatIzqVerificada, !!userData.fotoLatDerVerificada
  ];
  const porcentajeConfianza = (puntosSeguridad.filter(Boolean).length / puntosSeguridad.length) * 100;

  // --- FUNCIONES DE CÁMARA ---
  const seleccionarImagen = async (source: CameraSource) => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 25, width: 600, resultType: CameraResultType.DataUrl, source });
      if (image.dataUrl) setFotoTemporal(image.dataUrl);
    } catch (e) { console.log("Cámara cerrada"); }
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
      const valorFinal = ['placa', 'modelo', 'color', 'marca'].includes(tipoEdicion.id) ? nuevoValor.toUpperCase() : nuevoValor;
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { [field]: valorFinal });
      
      if (field.startsWith('vehiculo.')) {
        const key = tipoEdicion.id;
        setUserData({ ...userData, vehiculo: { ...userData.vehiculo, [key]: valorFinal }});
      } else {
        setUserData({ ...userData, [field]: valorFinal });
      }
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
      const fieldMap: any = {
        cedula: { f: 'kycFoto', v: 'kycVerificado' },
        licencia: { f: 'licenciaFoto', v: 'licenciaVerificada' },
        circulacion: { f: 'circulacionFoto', v: 'circulacionVerificada' },
        rcv: { f: 'rcvFoto', v: 'rcvVerificado' },
        selfie: { f: 'selfieFoto', v: 'selfieVerificada' },
        fotoFrontal: { f: 'fotoFrontal', v: 'fotoFrontalVerificada' },
        fotoTrasera: { f: 'fotoTrasera', v: 'fotoTraseraVerificada' },
        fotoLatIzq: { f: 'fotoLatIzq', v: 'fotoLatIzqVerificada' },
        fotoLatDer: { f: 'fotoLatDer', v: 'fotoLatDerVerificada' }
      };
      const { f, v } = fieldMap[pasoDocumento.tipo];
      await updateDoc(doc(db, "usuarios", userData.uid || userData.id), { [f]: fotoDocTemporal, [v]: false });
      setUserData({ ...userData, [f]: fotoDocTemporal, [v]: false });
      setFotoDocTemporal(null); setPasoDocumento({ tipo: 'cedula', activa: false });
      alert("Enviado para revisión.");
    } catch (e) { alert("Error"); } finally { setCargando(false); }
  };

  const aprobarUsuario = async (userId: string) => {
    if (!userId) return;
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", userId);
      await updateDoc(userRef, {
        kycVerificado: true, licenciaVerificada: true, circulacionVerificada: true, rcvVerificado: true,
        fotoFrontalVerificada: true, fotoTraseraVerificada: true, fotoLatIzqVerificada: true,
        fotoLatDerVerificada: true, selfieVerificada: true, puntosSeguridad: 100
      });
      alert("¡Usuario Verificado con éxito!");
      await cargarUsuariosAdmin();
    } catch (e) { alert("Error de permisos"); } finally { setCargando(false); }
  };

  const cargarUsuariosAdmin = async () => {
    setCargando(true);
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      setUsuariosAdmin(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      {/* NAV SUPERIOR */}
      <div className="p-4 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button onClick={() => setPestañaActiva('publico')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'publico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Perfil</button>
          <button onClick={() => setPestañaActiva('cuenta')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mi Cuenta</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' && (
          <div className="p-5 space-y-6 animate-in fade-in duration-500">
            {/* CARD PERFIL CON BOTÓN EN NOMBRE */}
            <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 text-center relative">
              <div className="absolute top-5 right-5">
                <div className={`${obtenerColorRango(rangoActual)} text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse`}>{rangoActual}</div>
              </div>
              
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-500 to-slate-200 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {userData.fotoPerfil ? <img src={userData.fotoPerfil} className="w-full h-full object-cover" alt="P" /> : <User size={50} className="text-slate-200" />}
                  </div>
                </div>
                <button onClick={() => setPasoFoto(true)} className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full border-4 border-white shadow-lg"><Edit2 size={14} /></button>
              </div>

              {/* NOMBRE COMO BOTÓN PARA PERFIL PÚBLICO */}
              <button 
                onClick={() => setVerPerfilPublicoChofer(true)}
                className="flex items-center justify-center gap-2 mx-auto active:scale-95 transition-transform group"
              >
                <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                  {userData.nombre || "Usuario"}
                </h2>
                <div className="bg-slate-100 p-1.5 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ChevronRight size={16} />
                </div>
              </button>

              <div className="flex justify-center gap-6 mt-4 border-t border-slate-50 pt-4">
                <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Conductor</p><p className="font-black text-blue-600 italic leading-none">{viajesCond} VJS</p></div>
                <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Pasajero</p><p className="font-black text-orange-500 italic leading-none">{viajesPas} VJS</p></div>
              </div>
            </div>

            {/* SELLO VEHICULO */}
            {(userData.fotoFrontalVerificada && userData.fotoTraseraVerificada) && (
              <div className="flex items-center justify-center gap-2 bg-green-50 py-2 px-4 rounded-2xl border border-green-100 animate-bounce">
                <ShieldCheck size={16} className="text-green-600" />
                <span className="text-[10px] font-black text-green-700 uppercase italic">Vehículo Inspeccionado</span>
              </div>
            )}

            {/* NIVEL Y BARRA DE PROGRESO */}
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

            {/* SEGURIDAD NARANJA */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Seguridad del Perfil</p>
                  <p className="text-lg font-black text-slate-800 uppercase">Verificado al <span className="text-orange-500 italic">{porcentajeConfianza.toFixed(0)}%</span></p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl text-2xl font-black text-orange-500">{porcentajeConfianza.toFixed(0)}%</div>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 shadow-inner">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000" style={{ width: `${porcentajeConfianza}%` }} />
              </div>
            </div>
          </div>
        )}

                {view === 'cuenta' && (
          <div className="p-5 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            {/* SECCIÓN PERSONAL */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 italic">Personal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={UserCog} label="Nombre" value={userData.nombre} onClick={() => { setTipoEdicion({id:'nombre', label:'Nombre', valor:userData.nombre}); setNuevoValor(userData.nombre); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Cédula" value={userData.cedulaNumero} onClick={() => { setTipoEdicion({id:'cedulaNumero', label:'Cédula', valor:userData.cedulaNumero}); setNuevoValor(userData.cedulaNumero); setModalVisible(true); }} />
                <MenuButton icon={Phone} label="Teléfono" value={userData.telefono} onClick={() => { setTipoEdicion({id:'telefono', label:'Teléfono', valor:userData.telefono}); setNuevoValor(userData.telefono); setModalVisible(true); }} />
                <MenuButton icon={FileText} label="Documento ID" status={userData.kycVerificado ? 'verificado' : (userData.kycFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'cedula', activa:true})} />
              </div>
            </div>

            {/* SECCIÓN VEHÍCULO */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4 italic">Vehículo</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Car} label="Marca" value={userData.vehiculo?.marca} onClick={() => { setTipoEdicion({id:'marca', label:'Marca', valor:userData.vehiculo?.marca}); setNuevoValor(userData.vehiculo?.marca || ""); setModalVisible(true); }} />
                <MenuButton icon={Gauge} label="Modelo" value={userData.vehiculo?.modelo} onClick={() => { setTipoEdicion({id:'modelo', label:'Modelo', valor:userData.vehiculo?.modelo}); setNuevoValor(userData.vehiculo?.modelo || ""); setModalVisible(true); }} />
                <MenuButton icon={Palette} label="Color" value={userData.vehiculo?.color} onClick={() => { setTipoEdicion({id:'color', label:'Color', valor:userData.vehiculo?.color}); setNuevoValor(userData.vehiculo?.color || ""); setModalVisible(true); }} />
                <MenuButton icon={Hash} label="Placa" value={userData.vehiculo?.placa} onClick={() => { setTipoEdicion({id:'placa', label:'Placa', valor:userData.vehiculo?.placa}); setNuevoValor(userData.vehiculo?.placa || ""); setModalVisible(true); }} />
              </div>
            </div>

            {/* FOTOS DEL AUTO */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[3px] ml-4 italic">Fotos del Auto</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={Camera} label="Frontal" status={userData.fotoFrontalVerificada ? 'verificado' : (userData.fotoFrontal ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoFrontal', activa:true})} />
                <MenuButton icon={Camera} label="Trasera" status={userData.fotoTraseraVerificada ? 'verificado' : (userData.fotoTrasera ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'fotoTrasera', activa:true})} />
              </div>
            </div>

            {/* SECCIÓN LEGAL COMPLETA */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[3px] ml-4 italic">Legal</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 p-2">
                <MenuButton icon={ShieldCheck} label="Licencia" status={userData.licenciaVerificada ? 'verificado' : (userData.licenciaFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'licencia', activa:true})} />
                <MenuButton icon={FileText} label="Circulación" status={userData.circulacionVerificada ? 'verificado' : (userData.circulacionFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'circulacion', activa:true})} />
                <MenuButton icon={ShieldCheck} label="Seguro RCV" status={userData.rcvVerificado ? 'verificado' : (userData.rcvFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'rcv', activa:true})} />
                <MenuButton icon={User} label="Selfie con ID" status={userData.selfieVerificada ? 'verificado' : (userData.selfieFoto ? 'revision' : 'pendiente')} onClick={() => setPasoDocumento({tipo:'selfie', activa:true})} />
              </div>
            </div>

            {/* BOTÓN CONTROL MAESTRO (ADMIN) */}
            {esAdmin && (
              <button onClick={() => { cargarUsuariosAdmin(); setPestañaActiva('admin'); }} className="w-full bg-slate-900 text-white p-5 rounded-[30px] flex items-center justify-between shadow-xl mt-6 active:scale-95 transition-transform">
                <div className="flex items-center gap-4">
                  <ShieldCheck size={20} className="text-red-500" />
                  <p className="font-black text-xs uppercase italic">Control Maestro</p>
                </div>
                <ChevronRight size={20} />
              </button>
            )}

            <button onClick={handleLogout} className="w-full p-5 bg-red-50 text-red-500 rounded-[30px] font-black uppercase text-[10px] border border-red-100 flex items-center justify-center gap-2 mt-4">
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        )}

        {/* PANEL ADMINISTRATIVO DESPLEGABLE */}
        {view === 'admin' && (
          <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white">
              <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl">
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div className="text-center">
                <h2 className="font-black italic uppercase text-sm tracking-tighter">Control Maestro</h2>
              </div>
              <button onClick={cargarUsuariosAdmin} className="text-blue-400"><RefreshCw size={20} /></button>
            </div>

            <div className="flex bg-slate-900 p-1 border-b border-white/5">
              <button onClick={() => setSubPestañaAdmin('pendientes')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'pendientes' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-600'}`}>
                Pendientes ({usuariosAdmin.filter(u => (u.kycFoto && !u.kycVerificado)).length})
              </button>
              <button onClick={() => setSubPestañaAdmin('aprobados')} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === 'aprobados' ? 'text-green-500 border-b-2 border-green-500' : 'text-slate-600'}`}>
                Aprobados ({usuariosAdmin.filter(u => u.kycVerificado).length})
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
              {usuariosAdmin
                .filter(u => subPestañaAdmin === 'pendientes' ? !u.kycVerificado : u.kycVerificado)
                .map(u => (
                  <div key={u.id} className="bg-slate-900 border border-white/5 rounded-[25px] overflow-hidden">
                    <button onClick={() => setUsuarioExpandidoAdmin(usuarioExpandidoAdmin === u.id ? null : u.id)} className="w-full flex items-center justify-between p-5 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-black text-xs">{u.nombre?.charAt(0).toUpperCase()}</div>
                        <p className="font-black text-xs uppercase italic">{u.nombre}</p>
                      </div>
                      <ChevronRight size={18} className={`transition-transform ${usuarioExpandidoAdmin === u.id ? 'rotate-90' : ''}`} />
                    </button>
                    {usuarioExpandidoAdmin === u.id && (
                      <div className="p-6 pt-0 space-y-5 animate-in slide-in-from-top duration-200">
                        <div className="grid grid-cols-3 gap-2">
                          {[{img: u.kycFoto, label: 'ID'}, {img: u.selfieFoto, label: 'Selfie'}, {img: u.fotoFrontal, label: 'Auto'}].map((item, i) => (
                            <div key={i} onClick={() => item.img && setFotoZoom(item.img)} className="bg-slate-800 aspect-square rounded-xl overflow-hidden border border-white/5">
                              {item.img ? <img src={item.img} className="w-full h-full object-cover" /> : <Camera size={14} className="m-auto mt-6 text-slate-700" />}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => aprobarUsuario(u.id)} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-black text-[10px] uppercase">Aprobar</button>
                          <button className="flex-1 bg-amber-500/20 text-amber-500 p-3 rounded-xl font-black text-[10px] uppercase">Rechazar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL ZOOM DE FOTO */}
      {fotoZoom && (
        <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4" onClick={() => setFotoZoom(null)}>
          <img src={fotoZoom} className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}

      {/* MODAL DE CÁMARA */}
      {pasoDocumento.activa && (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col p-6 items-center justify-center">
          {!fotoDocTemporal ? (
            <button onClick={capturarDocumento} className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase">Capturar {pasoDocumento.tipo}</button>
          ) : (
            <button onClick={subirDocumentoFinal} className="w-full bg-green-600 text-white p-6 rounded-[25px] font-black uppercase">Subir Documento</button>
          )}
          <button onClick={() => setPasoDocumento({...pasoDocumento, activa:false})} className="mt-8 text-slate-500 font-black uppercase text-[10px]">Cancelar</button>
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
        <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center"><Icon size={20} /></div>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1.5">{label}</p>
          <p className={`text-xs font-black uppercase ${statusColor}`}>{statusText}</p>
        </div>
      </div>
      {status !== 'verificado' && <ChevronRight size={18} className="text-slate-200" />}
    </button>
  );
};
        
  
