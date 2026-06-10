import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDocs, collection, increment, getDoc, query, where, orderBy, addDoc, limit } from 'firebase/firestore';
import { 
  ChevronRight, RefreshCw, Headset, MessageCircle, History, Landmark, 
  TrendingUp, DollarSign, ArrowUpRight, ImageIcon, ShieldCheck, 
  Camera, Settings, AlertTriangle, UserCog, Car 
} from 'lucide-react';

export const VistaPanelAdministrativo = ({ auth, userData, setPestañaActiva, onAbrirChat, setToast }) => {
  const [cargando, setCargando] = useState(false);
  const [usuariosAdmin, setUsuariosAdmin] = useState([]);
  const [reportesAdmin, setReportesAdmin] = useState([]);
  const [pagosAdmin, setPagosAdmin] = useState([]);
  const [transaccionesAdmin, setTransaccionesAdmin] = useState([]);
  const [chatsSoporteAdmin, setChatsSoporteAdmin] = useState([]);
  const [subPestañaAdmin, setSubPestañaAdmin] = useState('pendientes');
  const [usuarioExpandidoAdmin, setUsuarioExpandidoAdmin] = useState(null);
  const [fotoZoom, setFotoZoom] = useState(null);
  const [tasaActual, setTasaActual] = useState(0);
  const [balanceApp, setBalanceApp] = useState(0);
  const [bancoAdmin, setBancoAdmin] = useState({ banco: "", telefono: "", cedula: "" });
  const [modalAdmin, setModalAdmin] = useState({ tipo: 'historial', data: null });
  const [historialUsuario, setHistorialUsuario] = useState([]);

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const [snapUsers, snapReports, snapPagos, snapAdmin, snapSoporte] = await Promise.all([
        getDocs(query(collection(db, "usuarios"), limit(50))), 
        getDocs(query(collection(db, "Reportes"), limit(30))),
        getDocs(query(collection(db, "PagosPendientes"), where("estado", "==", "pendiente"), limit(50))),
        getDocs(query(collection(db, "Transacciones"), where("uid", "==", "ADMIN_APP"), orderBy("fecha", "desc"), limit(20))),
        getDocs(query(collection(db, "Chats"), where("esSoporte", "==", true), limit(20)))
      ]);

      setUsuariosAdmin(snapUsers.docs.map(d => ({ id: d.id, ...d.data() })));
      setReportesAdmin(snapReports.docs.map(d => ({ id: d.id, ...d.data() })));
      setPagosAdmin(snapPagos.docs.map(d => ({ id: d.id, ...d.data() })));
      setTransaccionesAdmin(snapAdmin.docs.map(d => ({ id: d.id, ...d.data() })));
      setChatsSoporteAdmin(snapSoporte.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.ultimaHora || "").localeCompare(a.ultimaHora || "")));
        
      const docFinanzas = await getDoc(doc(db, "Configuracion", "Finanzas"));
      if (docFinanzas.exists()) {
        const data = docFinanzas.data();
        setTasaActual(data.tasaBCV || 0);
        setBalanceApp(data.gananciasTotales || 0);
        if (data.bancoAdmin) setBancoAdmin(data.bancoAdmin);
      }
    } catch (e) { console.error("Error admin:", e); } finally { setCargando(false); }
  };

  const verPerfil = async (uid) => {
    if (!uid || uid === 'undefined') return;
  };

  const verHistorial = async (uid) => {
    setCargando(true);
    try {
      const qReportes = query(collection(db, "Reportes"), where("idReportado", "==", uid));
      const snapReportes = await getDocs(qReportes);
      const qViajes = query(collection(db, "Viajes"), where("uidConductor", "==", uid), orderBy("fecha", "desc"));
      const snapViajes = await getDocs(qViajes);
      setHistorialUsuario([...snapReportes.docs.map(d => ({ tipo: 'REPORTE', ...d.data() })), ...snapViajes.docs.slice(0, 5).map(d => ({ tipo: 'VIAJE', ...d.data() }))]);
      setModalAdmin({tipo: 'historial', data: uid});
    } finally { setCargando(false); }
  };

  const aprobarUsuario = async (userId) => {
    setCargando(true);
    try {
      await updateDoc(doc(db, "usuarios", userId), { estadoRevision: "aprobado", kycVerificado: true, licenciaVerificada: true, circulacionVerificada: true, rcvVerificado: true, selfieVerificada: true });
      await cargarDatosAdmin();
      setToast({ texto: "Usuario verificado", tipo: "exito" });
    } finally { setCargando(false); }
  };

  const rechazarDocumentos = async (userId) => {
    if (!window.confirm("¿Rechazar?")) return;
    await updateDoc(doc(db, "usuarios", userId), { estadoRevision: "rechazado", kycVerificado: false });
    await cargarDatosAdmin();
  };

  const suspenderUsuario = async (userId) => {
    if (!window.confirm("¿Suspender?")) return;
    await updateDoc(doc(db, "usuarios", userId), { cuentaSuspendida: true });
    await cargarDatosAdmin();
  };

  const reactivarUsuario = async (userId) => {
    await updateDoc(doc(db, "usuarios", userId), { cuentaSuspendida: false });
    await cargarDatosAdmin();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col">
      <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between text-white">
        <button onClick={() => setPestañaActiva('cuenta')} className="bg-white/5 p-2 rounded-xl"><ChevronRight size={20} className="rotate-180" /></button>
        <h2 className="font-black italic uppercase text-sm">Control Maestro</h2>
        <button onClick={cargarDatosAdmin} className="text-blue-400 bg-blue-400/10 p-2 rounded-xl"><RefreshCw size={20} className={cargando ? 'animate-spin' : ''}/></button>
      </div>
      
      <div className="flex bg-slate-900 p-1 border-b border-white/5 overflow-x-auto">
        {['pendientes', 'aprobados', 'pagos', 'soporte', 'historial', 'reportes'].map(tab => (
          <button key={tab} onClick={() => setSubPestañaAdmin(tab)} className={`flex-1 py-3 text-[9px] font-black uppercase ${subPestañaAdmin === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-600'}`}>{tab}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {/* Aquí iría el resto de tu UI de administración que ya tenías */}
        {cargando && <p className="text-center text-slate-500">Cargando...</p>}
      </div>
    </div>
  );
};
