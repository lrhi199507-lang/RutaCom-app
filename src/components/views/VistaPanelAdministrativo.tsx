import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection, increment, getDoc, query, where, orderBy, addDoc, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  ChevronRight, RefreshCw, Headset, MessageCircle, History, Landmark, 
  TrendingUp, DollarSign, ArrowUpRight, ImageIcon, ShieldCheck, 
  Camera, Settings, AlertTriangle, User 
} from 'lucide-react';

const auth = getAuth();

// Función auxiliar para mostrar fechas legibles
const formatearFecha = (fechaCualquiera: any) => {
  if (!fechaCualquiera) return "Fecha desconocida";
  const fecha = new Date(typeof fechaCualquiera === 'number' ? fechaCualquiera : fechaCualquiera);
  return fecha.toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const VistaPanelAdministrativo = ({ setPestañaActiva, onAbrirChat }: any) => {
  const [cargando, setCargando] = useState(false);
  const [usuariosAdmin, setUsuariosAdmin] = useState<any[]>([]);
  const [reportesAdmin, setReportesAdmin] = useState<any[]>([]);
  const [pagosAdmin, setPagosAdmin] = useState<any[]>([]); 
  const [transaccionesAdmin, setTransaccionesAdmin] = useState<any[]>([]); 
  const [chatsSoporteAdmin, setChatsSoporteAdmin] = useState<any[]>([]); 
  const [subPestañaAdmin, setSubPestañaAdmin] = useState<'pendientes' | 'aprobados' | 'reportes' | 'pagos' | 'historial' | 'soporte' | 'perfil_ajeno'>('pendientes');
  const [usuarioExpandidoAdmin, setUsuarioExpandidoAdmin] = useState<string | null>(null);
  const [usuarioVisitadoAdmin, setUsuarioVisitadoAdmin] = useState<any | null>(null);
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);
  const [tasaActual, setTasaActual] = useState(0); 
  const [balanceApp, setBalanceApp] = useState(0);
  const [bancoAdmin, setBancoAdmin] = useState({ banco: "", telefono: "", cedula: "" });
  const [modalAdmin, setModalAdmin] = useState<{tipo: 'historial' | 'accion', data: any | null}>({tipo: 'historial', data: null});
  const [historialUsuario, setHistorialUsuario] = useState<any[]>([]);
  const [toastAdmin, setToastAdmin] = useState<string | null>(null);
  const [motivoSuspension, setMotivoSuspension] = useState("");

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const [snapUsers, snapReports, snapPagos, snapAdmin, snapSoporte] = await Promise.all([
        getDocs(query(collection(db, "usuarios"), limit(50))), 
        // Consulta indexada de Firebase (Evita gastar RAM del teléfono)
        getDocs(query(collection(db, "Reportes"), orderBy("fechaCreacion", "desc"), limit(30))),
        getDocs(query(collection(db, "PagosPendientes"), where("estado", "==", "pendiente"), limit(50))),
        getDocs(query(collection(db, "Transacciones"), where("uid", "==", "ADMIN_APP"), orderBy("fecha", "desc"), limit(20))),
        getDocs(query(collection(db, "Chats"), where("esSoporte", "==", true), limit(20)))
      ]);

      setUsuariosAdmin(snapUsers.docs.map(d => ({ id: d.id, ...d.data() })));
      setReportesAdmin(snapReports.docs.map(d => ({ id: d.id, ...d.data() })));
      setPagosAdmin(snapPagos.docs.map(d => ({ id: d.id, ...d.data() })));
      setTransaccionesAdmin(snapAdmin.docs.map(d => ({ id: d.id, ...d.data() })));
      setChatsSoporteAdmin(snapSoporte.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.ultimaHora || "").localeCompare(a.ultimaHora || "")));
        
      const docFinanzas = await getDoc(doc(db, "Configuracion", "Finanzas"));
      if (docFinanzas.exists()) {
        const data = docFinanzas.data();
        setTasaActual(data.tasaBCV || 0);
        setBalanceApp(data.gananciasTotales || 0);
        if (data.bancoAdmin) setBancoAdmin(data.bancoAdmin);
      }
    } catch (e) {
      console.error("Error crítico de carga:", e);
    } finally {
      setCargando(false);
    }
  };

  const verPerfil = async (uid: string) => {
    if (!uid || uid === 'undefined') {
      setToastAdmin("Error: ID no válido");
      return;
    }
    setCargando(true);
    try {
      const userRef = doc(db, "usuarios", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUsuarioVisitadoAdmin({ id: snap.id, ...snap.data() });
        setSubPestañaAdmin('perfil_ajeno');
      } else {
        setToastAdmin("Usuario no encontrado");
      }
    } catch (e) {
      console.error(e);
    } finally { setCargando(false); }
  };

    const verHistorial = async (uid: string) => {
    setCargando(true);
    try {
      // AQUÍ ESTÁ EL CAMBIO PRINCIPAL 👇
      const qReportes = query(
        collection(db, "Reportes"), 
        where("idDenunciado", "==", uid), 
        orderBy("fechaCreacion", "desc")
      );
      const snapReportes = await getDocs(qReportes);
      
      const qViajes = query(
        collection(db, "Viajes"), 
        where("uidConductor", "==", uid), 
        orderBy("fecha", "desc"),
        limit(5)
      );
      const snapViajes = await getDocs(qViajes);
      
      const historialCombinado = [
        ...snapReportes.docs.map(d => ({ tipo: 'REPORTE', ...d.data() })),
        ...snapViajes.docs.map(d => ({ tipo: 'VIAJE', ...d.data() }))
      ];

      historialCombinado.sort((a: any, b: any) => {
        const timeA = a.fechaCreacion || a.timestamp || a.fecha || 0;
        const timeB = b.fechaCreacion || b.timestamp || b.fecha || 0;
        return timeB - timeA;
      });

      setHistorialUsuario(historialCombinado);
      setModalAdmin({tipo: 'historial', data: uid});
    } catch (e) { 
      console.error(e); 
    } finally { setCargando(false); }
  };
  

  const confirmarSancion = async (uid: string, motivo: string) => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", uid), { cuentaSuspendida: true, mensajeAdmin: motivo });
      setModalAdmin({tipo: 'accion', data: null});
      setMotivoSuspension("");
      setToastAdmin("Usuario suspendido");
      await cargarDatosAdmin();
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const enviarAdvertencia = async (uid: string) => {
    if (!window.confirm("¿Enviar advertencia formal a este usuario?")) return;
    setCargando(true);
    try {
      await addDoc(collection(db, "Notificaciones"), {
        idDestino: uid,
        titulo: "⚠️ Atención a las Normas",
        mensaje: "Hemos recibido comentarios sobre tu comportamiento reciente en la plataforma. Te recordamos cumplir con las normas de convivencia para evitar la suspensión permanente de tu cuenta.",
        timestamp: Date.now(),
        leido: false,
        tipo: "alerta"
      });
      setToastAdmin("Advertencia enviada al usuario");
    } catch (e) {
      console.error(e);
      setToastAdmin("Error al enviar advertencia");
    } finally {
      setCargando(false);
    }
  };

  const actualizarTasaBCV = async () => {
    const nueva = prompt("Nueva tasa BCV:", tasaActual.toString());
    if (!nueva || isNaN(Number(nueva))) return; 
    try {
      await updateDoc(doc(db, "Configuracion", "Finanzas"), { tasaBCV: Number(nueva) });
      setTasaActual(Number(nueva));
    } catch (e) { console.error(e); }
  };
  
  const guardarDatosBancarios = async () => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "Configuracion", "Finanzas"), { bancoAdmin: bancoAdmin });
      setToastAdmin("Datos bancarios guardados");
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const aprobarPago = async (pago: any) => {
    if(!window.confirm(`¿Aprobar recarga de $${pago.monto}?`)) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", pago.uid), { saldo: increment(pago.monto) });
      await updateDoc(doc(db, "PagosPendientes", pago.id), { estado: "aprobado", fechaAprobacion: new Date().toISOString() });
      await addDoc(collection(db, "Transacciones"), { uid: pago.uid, tipo: "ingreso", monto: pago.monto, descripcion: "Recarga aprobada", fecha: new Date().toISOString() });
      setPagosAdmin(pagosAdmin.filter(p => p.id !== pago.id));
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };
  
  const marcarRetiroComoPagado = async (pago: any) => {
    if(!window.confirm(`¿Confirmas transferencia?`)) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "PagosPendientes", pago.id), { estado: "aprobado", fechaAprobacion: new Date().toISOString() });
      await updateDoc(doc(db, "usuarios", pago.uid), { saldo: increment(-pago.monto), saldoRetenido: increment(-pago.monto) });
      setPagosAdmin(pagosAdmin.filter(p => p.id !== pago.id));
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };
  
  const rechazarPago = async (pago: any) => {
    if(!window.confirm('¿Rechazar?')) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "PagosPendientes", pago.id), { estado: "rechazado" });
      if (pago.tipo === 'retiro') {
        await updateDoc(doc(db, "usuarios", pago.uid), { saldoRetenido: increment(-pago.monto) });
      }
      setPagosAdmin(pagosAdmin.filter(p => p.id !== pago.id));
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };

  const resolverReporte = async (reporteId: string) => {
    if (!window.confirm("¿Resolver reporte?")) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "Reportes", reporteId), { estado: "resuelto", auditoria: { realizadoPor: auth.currentUser?.email, timestamp: new Date().toISOString() } });
      await cargarDatosAdmin();
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const aprobarUsuario = async (userId: string) => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userId), { kycVerificado: true, licenciaVerificada: true, circulacionVerificada: true, rcvVerificado: true, fotoFrontalVerificada: true, fotoTraseraVerificada: true, fotoLatIzqVerificada: true, fotoLatDerVerificada: true, selfieVerificada: true, estadoRevision: "aprobado" });
      await cargarDatosAdmin();
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };
  
  const rechazarDocumentos = async (userId: string) => {
    if (!window.confirm("¿Rechazar fotos?")) return;
    try {
      await updateDoc(doc(db, "usuarios", userId), { kycVerificado: false, selfieVerificada: false, fotoFrontalVerificada: false, fotoTraseraVerificada: false, fotoLatIzqVerificada: false, fotoLatDerVerificada: false, licenciaVerificada: false, rcvVerificado: false, kycFoto: null, selfieFoto: null, fotoFrontal: null, fotoTrasera: null, fotoLatIzq: null, fotoLatDer: null, licenciaFoto: null, rcvFoto: null, estadoRevision: "rechazado" });
      await cargarDatosAdmin(); 
    } catch (e) { console.error(e); }
  };

  const suspenderUsuario = async (userId: string) => {
    setModalAdmin({tipo: 'accion', data: userId});
  };

  const reactivarUsuario = async (userId: string) => {
    if (!window.confirm("¿Reactivar cuenta?")) return;
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userId), { cuentaSuspendida: false });
      await cargarDatosAdmin();
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col animate-in fade-in duration-300">
      {toastAdmin && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl z-[200] text-xs font-bold shadow-lg">
          {toastAdmin}
        </div>
      )}

      <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white shrink-0">
        <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl"><ChevronRight size={20} className="rotate-180" /></button>
        <div className="text-center">
          <h2 className="font-black italic uppercase text-sm tracking-tighter">Control Maestro</h2>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Panel Administrativo</p>
        </div>
        <button onClick={cargarDatosAdmin} className="text-blue-400 bg-blue-400/10 p-2 rounded-xl"><RefreshCw size={20} className={cargando ? 'animate-spin' : ''}/></button>
      </div>

      <div className="flex bg-slate-900 p-1 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
        <button onClick={() => setSubPestañaAdmin('pendientes')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'pendientes' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-600'}`}>Pendientes</button>
        <button onClick={() => setSubPestañaAdmin('aprobados')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'aprobados' ? 'text-green-500 border-b-2 border-green-500' : 'text-slate-600'}`}>Usuarios</button>
        <button onClick={() => setSubPestañaAdmin('pagos')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'pagos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-600'}`}>Pagos ({pagosAdmin.length})</button>
        <button onClick={() => setSubPestañaAdmin('soporte')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'soporte' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-600'}`}>Soporte ({chatsSoporteAdmin.length})</button>
        <button onClick={() => setSubPestañaAdmin('historial')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'historial' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-600'}`}>Historial</button>
        <button onClick={() => setSubPestañaAdmin('reportes')} className={`flex-1 min-w-[80px] py-3 text-[9px] font-black uppercase transition-colors ${subPestañaAdmin === 'reportes' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-600'}`}>Reportes</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {cargando ? (
          <p className="text-center p-10 text-slate-500 italic animate-pulse text-xs uppercase font-black">Sincronizando...</p>
        ) : (
          <>
            {subPestañaAdmin === 'perfil_ajeno' && usuarioVisitadoAdmin ? (
              <div className="animate-in slide-in-from-right duration-300">
                <button onClick={() => setSubPestañaAdmin('reportes')} className="mb-4 text-slate-400 hover:text-white font-black text-[10px] uppercase flex items-center gap-2">
                  <ChevronRight className="rotate-180" size={16} /> Volver a Reportes
                </button>
                <div className="bg-[#0f172a] border border-white/5 rounded-[30px] p-6 text-white text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
                  <div className="w-24 h-24 mx-auto mb-4 relative z-10">
                    {usuarioVisitadoAdmin.fotoPerfil ? (
                      <img src={usuarioVisitadoAdmin.fotoPerfil} className="w-full h-full rounded-[25px] border border-slate-700 object-cover shadow-lg" alt="Perfil" />
                    ) : (
                      <div className="w-full h-full rounded-[25px] border border-slate-700 bg-slate-800 flex items-center justify-center shadow-lg"><User size={40} className="text-slate-500" /></div>
                    )}
                  </div>
                  <h2 className="relative z-10 text-xl font-black italic uppercase">{usuarioVisitadoAdmin.nombre}</h2>
                  <p className="relative z-10 text-[10px] text-slate-400 font-bold mb-6 tracking-widest">{usuarioVisitadoAdmin.telefono || "Sin teléfono"}</p>
                  <div className="relative z-10 grid grid-cols-2 gap-3">
                    <button onClick={() => verHistorial(usuarioVisitadoAdmin.id)} className="bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-[10px] uppercase">Ver Historial</button>
                    <button onClick={() => suspenderUsuario(usuarioVisitadoAdmin.id)} className="bg-red-950/40 border border-red-900/50 hover:bg-red-900 text-red-500 hover:text-red-100 py-4 rounded-2xl font-black text-[10px] uppercase">Suspender</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {subPestañaAdmin === 'soporte' && (
                  <div className="space-y-3 animate-in slide-in-from-bottom duration-400">
                    {chatsSoporteAdmin.length === 0 ? (
                      <div className="bg-slate-900/50 p-10 rounded-[30px] border border-white/5 text-center">
                          <Headset size={40} className="text-slate-800 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-slate-600 uppercase italic">No hay tickets de soporte</p>
                      </div>
                    ) : (
                      chatsSoporteAdmin.map((chat) => (
                        <div key={chat.id} onClick={() => onAbrirChat && onAbrirChat(chat)} className="bg-slate-900 border border-blue-500/20 p-5 rounded-[25px] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 shrink-0"><MessageCircle size={20} /></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-white text-sm uppercase truncate">{chat.nombrePasajero || 'Usuario Desconocido'}</h4>
                              <p className="text-[10px] text-blue-400 font-bold truncate mt-0.5">{chat.ultimoMensaje}</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-600" />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {subPestañaAdmin === 'historial' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom duration-400">
                    <div className="bg-gradient-to-br from-indigo-600 to-slate-900 p-6 rounded-[35px] border border-white/10 shadow-2xl relative overflow-hidden">
                        <Landmark className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1 relative z-10">Caja Fuerte App</p>
                        <h3 className="text-4xl font-black italic text-white leading-none relative z-10">${balanceApp.toFixed(2)}</h3>
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10 relative z-10">
                          <TrendingUp size={12} className="text-green-400" />
                          <span className="text-[9px] font-black text-white uppercase italic">10% de Comisión</span>
                        </div>
                    </div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mt-6">Ingresos App</h4>
                    {transaccionesAdmin.length === 0 ? (
                      <div className="bg-slate-900/50 p-10 rounded-[30px] border border-white/5 text-center">
                          <History size={40} className="text-slate-800 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-slate-600 uppercase italic">Sin comisiones aún</p>
                      </div>
                    ) : (
                      transaccionesAdmin.map((tx) => (
                        <div key={tx.id} className="bg-slate-900 border border-white/5 p-5 rounded-[28px] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400"><DollarSign size={18} /></div>
                              <div>
                                <p className="text-[11px] font-black text-slate-200 uppercase leading-none mb-1">{tx.descripcion}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">{formatearFecha(tx.fecha)}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black italic text-indigo-400">+${Number(tx.monto).toFixed(2)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {subPestañaAdmin === 'pagos' && (
                  <>
                    <div className="bg-slate-900 border border-white/5 p-5 rounded-[30px] flex justify-between items-center shadow-lg mb-6">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Tasa Oficial Actual</p>
                        <p className="text-xl font-black text-white italic">Bs. {tasaActual}</p>
                      </div>
                      <button onClick={actualizarTasaBCV} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Cambiar Tasa</button>
                    </div>
                    <div className="bg-slate-900 border border-white/5 p-6 rounded-[35px] space-y-4 mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-600/10 p-2 rounded-xl text-blue-400"><Settings size={18} /></div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Datos de Cobro (Wallet)</p>
                      </div>
                      <div className="space-y-3">
                        <input value={bancoAdmin.banco} onChange={(e) => setBancoAdmin({...bancoAdmin, banco: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white" placeholder="Banco" />
                        <input value={bancoAdmin.telefono} onChange={(e) => setBancoAdmin({...bancoAdmin, telefono: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white" placeholder="Teléfono" />
                        <input value={bancoAdmin.cedula} onChange={(e) => setBancoAdmin({...bancoAdmin, cedula: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white" placeholder="Cédula" />
                      </div>
                      <button disabled={cargando} onClick={guardarDatosBancarios} className="w-full bg-blue-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase">Guardar Datos</button>
                    </div>
                    {pagosAdmin.length === 0 ? (
                      <p className="text-center text-slate-700 font-black uppercase italic text-[10px] mt-20">No hay pagos pendientes</p>
                    ) : (
                      pagosAdmin.map(pago => {
                        const esRetiro = pago.tipo === 'retiro';
                        return (
                          <div key={pago.id} className="bg-slate-900 border border-white/5 rounded-[25px] p-5 space-y-4 text-white">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-black uppercase">{pago.nombre}</p>
                              <p className="text-xl font-black">${Number(pago.monto).toFixed(2)}</p>
                            </div>
                            {!esRetiro && pago.comprobanteUrl && (
                              <div onClick={() => setFotoZoom(pago.comprobanteUrl)} className="w-full h-24 bg-slate-800 rounded-xl overflow-hidden"><img src={pago.comprobanteUrl} className="w-full h-full object-cover" /></div>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => rechazarPago(pago)} className="flex-1 bg-red-500/10 text-red-500 p-3 rounded-xl font-black text-[10px] uppercase">Rechazar</button>
                              <button onClick={() => esRetiro ? marcarRetiroComoPagado(pago) : aprobarPago(pago)} className="flex-[2] bg-blue-600 text-white p-3 rounded-xl font-black text-[10px] uppercase">Aprobar</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
                
                {subPestañaAdmin === 'reportes' && (
                  <div className="space-y-4">
                    {reportesAdmin.length === 0 ? (
                      <div className="bg-slate-900/50 p-10 rounded-[30px] border border-white/5 text-center mt-6">
                        <ShieldCheck size={40} className="text-slate-800 mx-auto mb-3" />
                        <p className="text-[10px] font-black text-slate-600 uppercase italic">Zona segura. No hay reportes.</p>
                      </div>
                    ) : (
                      reportesAdmin.map(r => (
                        <div key={r.id} className="bg-[#0f172a] border border-red-500/20 rounded-[30px] p-5 relative overflow-hidden shadow-2xl">
                          <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-black text-white uppercase italic">{r.nombreDenunciado}</p>
                              <button onClick={() => verPerfil(r.idDenunciado)} className="text-[9px] font-bold text-blue-400 bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10">PERFIL</button>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
                                Denunciante: {r.nombreDenunciante} • {formatearFecha(r.fechaCreacion || r.timestamp || r.fecha)}
                              </p>
                              <p className="text-[11px] text-slate-300 italic pl-3 leading-tight">"{r.descripcion}"</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button onClick={() => verHistorial(r.idDenunciado)} className="bg-slate-800 p-3 rounded-2xl text-[9px] font-black uppercase text-slate-300">Historial</button>
                              <button onClick={() => enviarAdvertencia(r.idDenunciado)} className="bg-orange-900/20 border border-orange-500/20 text-orange-500 p-3 rounded-2xl text-[9px] font-black uppercase">Advertir</button>
                              <button onClick={() => resolverReporte(r.id)} disabled={r.estado === 'resuelto'} className="bg-green-900/20 border text-green-400 p-3 rounded-2xl text-[9px] font-black uppercase">RESOLVER</button>
                            </div>
                            <button onClick={() => suspenderUsuario(r.idDenunciado)} className="w-full py-3 rounded-2xl border border-red-900/50 text-red-500 text-[9px] font-black uppercase">Aplicar Sanción / Banear</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {(subPestañaAdmin === 'pendientes' || subPestañaAdmin === 'aprobados') && (
                  usuariosAdmin
                    .filter(u => {
                      const esPendiente = (u.kycFoto && !u.kycVerificado) || (u.fotoFrontal && !u.fotoFrontalVerificada);
                      return subPestañaAdmin === 'pendientes' ? esPendiente : !esPendiente;
                    })
                    .map(u => {
                      const estaExpandido = usuarioExpandidoAdmin === u.id;
                      const estaSuspendido = u.cuentaSuspendida === true;
                      return (
                        <div key={u.id} className={`bg-slate-900 border ${estaSuspendido ? 'border-red-900' : 'border-white/5'} rounded-[25px] overflow-hidden transition-colors`}>
                          <button onClick={() => setUsuarioExpandidoAdmin(estaExpandido ? null : u.id)} className="w-full flex items-center justify-between p-5 text-white relative">
                            {estaSuspendido && <div className="absolute top-0 right-0 bg-red-600 text-white text-[7px] font-black uppercase px-2 py-1 rounded-bl-xl">Suspendido</div>}
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 ${estaSuspendido ? 'bg-red-950/50 text-red-500' : 'bg-slate-800 text-white'} rounded-full flex items-center justify-center font-black text-xs`}>{u.nombre?.charAt(0).toUpperCase()}</div>
                              <div className="text-left">
                                <p className={`font-black text-xs uppercase italic ${estaSuspendido ? 'text-slate-500 line-through' : 'text-white'}`}>{u.nombre}</p>
                                <p className="text-[9px] text-slate-500 font-bold">{u.correo || u.email}</p>
                              </div>
                            </div>
                            <ChevronRight size={18} className={`text-slate-600 transition-transform ${estaExpandido ? 'rotate-90' : ''}`} />
                          </button>
                          {estaExpandido && (
                            <div className="p-6 pt-0 space-y-5 animate-in slide-in-from-top duration-200">
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { img: u.kycFoto, label: 'Cédula' }, 
                                  { img: u.selfieFoto, label: 'Selfie' }, 
                                  { img: u.licenciaFoto, label: 'Licencia' }, 
                                  { img: u.rcvFoto, label: 'RCV' }, 
                                  { img: u.fotoFrontal, label: 'Frente' },
                                  { img: u.fotoTrasera, label: 'Atrás' },
                                  { img: u.fotoLatIzq, label: 'Lat. Izq' },
                                  { img: u.fotoLatDer, label: 'Lat. Der' }
                                ].map((item, idx) => (
                                  <div key={idx} className="flex flex-col gap-1">
                                    <p className="text-[7px] font-black text-slate-500 uppercase text-center tracking-tighter">{item.label}</p>
                                    <div onClick={() => item.img && setFotoZoom(item.img)} className={`bg-slate-800 aspect-square rounded-xl overflow-hidden border border-white/5 flex items-center justify-center ${estaSuspendido ? 'opacity-50 grayscale' : ''}`}> 
                                      {item.img ? <img src={item.img} className="w-full h-full object-cover" /> : <Camera size={14} className="text-slate-700" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-col gap-2">
                                {estaSuspendido ? (
                                  <button disabled={cargando} onClick={() => reactivarUsuario(u.id)} className="w-full bg-slate-800 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[10px] uppercase border border-slate-700 active:scale-95 transition-all">Reactivar Cuenta</button>
                                ) : (
                                  <>
                                    {subPestañaAdmin === 'pendientes' && (
                                      <div className="flex gap-2">
                                        <button disabled={cargando} onClick={() => aprobarUsuario(u.id)} className="flex-1 bg-green-600 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[10px] uppercase">Aprobar</button>
                                        <button disabled={cargando} onClick={() => rechazarDocumentos(u.id)} className="flex-1 bg-amber-500/20 disabled:opacity-50 text-amber-500 p-3 rounded-xl font-black text-[10px] uppercase">Rechazar Fotos</button>
                                      </div>
                                    )}
                                    <button disabled={cargando} onClick={() => suspenderUsuario(u.id)} className="w-full bg-red-950/40 disabled:opacity-50 text-red-500 p-3 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all">Suspender Usuario</button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}     
                        </div>
                      );
                    })
                )}
              </>
            )}
          </>
        )}
      </div>

      {fotoZoom && (
        <div className="fixed inset-0 z-[500] bg-slate-950/95 flex items-center justify-center p-4" onClick={() => setFotoZoom(null)}>
          <img src={fotoZoom} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" />
        </div>
      )}

      {/* MODAL DE ACCIONES / HISTORIAL - z-[600] para estar arriba de todo */}
      {modalAdmin.data && (
        <div className="fixed inset-0 z-[600] bg-slate-950/90 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[35px] p-6 border border-white/10 shadow-2xl animate-in zoom-in-95">
            {modalAdmin.tipo === 'historial' ? (
              <div className="space-y-4">
                <h3 className="text-white font-black uppercase text-xs italic border-b border-white/5 pb-2 flex items-center gap-2">
                  <History size={16} className="text-blue-500" /> Diagnóstico de Usuario
                </h3>
                
                <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-2xl text-center shadow-inner">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Total de Reportes Recibidos</p>
                  <p className="text-4xl font-black italic text-red-500">{historialUsuario.filter(h => h.tipo === 'REPORTE').length}</p>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 mt-4">
                  {historialUsuario.filter(h => h.tipo === 'REPORTE').length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic text-center py-4">Usuario ejemplar. No tiene reportes previos.</p>
                  ) : (
                    historialUsuario.filter(h => h.tipo === 'REPORTE').map((h, i) => (
                      <div key={i} className="bg-slate-900 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{formatearFecha(h.fechaCreacion || h.timestamp || h.fecha)}</p>
                        <p className="text-[11px] text-white font-bold italic">"{h.descripcion || h.motivo}"</p>
                        <p className="text-[8px] text-slate-400 mt-2">Denunciante: {h.nombreDenunciante || "Anónimo"}</p>
                      </div>
                    ))
                  )}
                </div>
                
                <button onClick={() => setModalAdmin({tipo: 'historial', data: null})} className="w-full bg-slate-800 hover:bg-slate-700 transition-colors p-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest mt-2">
                  Cerrar Historial
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-red-950/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-900">
                  <AlertTriangle size={30} />
                </div>
                <h3 className="text-red-500 font-black uppercase text-lg italic text-center">Suspender Cuenta</h3>
                <p className="text-[10px] text-slate-400 text-center font-bold">¿Por qué estás suspendiendo a este usuario? Este mensaje le aparecerá cuando intente abrir la aplicación.</p>
                
                <textarea 
                  value={motivoSuspension}
                  onChange={(e) => setMotivoSuspension(e.target.value)}
                  placeholder="Ej: Múltiples reportes por conducir a exceso de velocidad..."
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs text-white font-medium outline-none focus:border-red-500 min-h-[100px] resize-none"
                />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={() => { setModalAdmin({tipo: 'accion', data: null}); setMotivoSuspension(""); }} className="bg-slate-800 p-4 rounded-2xl text-slate-400 hover:text-white font-black text-[10px] uppercase transition-colors">
                    Cancelar
                  </button>
                  <button 
                    disabled={cargando || !motivoSuspension.trim()} 
                    onClick={() => confirmarSancion(modalAdmin.data, motivoSuspension)} 
                    className="bg-red-600 disabled:opacity-50 p-4 rounded-2xl text-white font-black text-[10px] uppercase shadow-lg hover:bg-red-500 transition-all"
                  >
                    {cargando ? 'Cargando...' : 'Aplicar Ban'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
