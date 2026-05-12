import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, collection, addDoc, increment, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { 
  History, ArrowUpRight, ArrowDownLeft, 
  RefreshCcw, ShieldCheck, CreditCard, X, Info, Banknote
} from "lucide-react";
import Toast from "../ui/Toast";

export const Wallet = ({ userData, onRegresar }) => {
  // ESTADOS DE MODALES Y FORMULARIOS
  const [showModalRecarga, setShowModalRecarga] = useState(false);
  const [showModalRetiro, setShowModalRetiro] = useState(false);
  const [montoRecarga, setMontoRecarga] = useState("");
  const [referencia, setReferencia] = useState("");
  const [montoRetiro, setMontoRetiro] = useState("");
  const [datosBancarios, setDatosBancarios] = useState({ banco: "", telefono: "", cedula: "" });

  // ESTADOS DE CONTROL
  const [enviando, setEnviando] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  // ESTADOS DEL HISTORIAL
  const [transacciones, setTransacciones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

    // EFECTO PARA TRAER EL HISTORIAL EN TIEMPO REAL
  useEffect(() => {
    if (!userData?.id) return;

    const q = query(
      collection(db, "Transacciones"),
      where("uid", "==", userData.id),
      orderBy("fecha", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const historial = [];
      snap.forEach(documento => historial.push({ id: documento.id, ...documento.data() }));
      setTransacciones(historial);
      setCargandoHistorial(false);
    }, (error) => {
      // 🔥 AHORA SÍ VEREMOS EL ERROR EN PANTALLA
      console.error("Error en Billetera:", error);
      setToastMsg(`Error de lectura: ${error.message}`);
      setShowToast(true);
      setCargandoHistorial(false); 
    });

    return () => unsub();
  }, [userData?.id]);

  // ESTADO DE TASA DINÁMICA
  const [tasaBCV, setTasaBCV] = useState(0);

  // EFECTO PARA CARGAR LA TASA DESDE FIREBASE AL ABRIR
  useEffect(() => {
    const obtenerTasa = async () => {
      try {
        const docRef = doc(db, "Configuracion", "Finanzas");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setTasaBCV(snap.data().tasaBCV || 0);
        }
      } catch (error) {
        console.error("Error al obtener tasa:", error);
      }
    };
    obtenerTasa();
  }, []);

  const saldoUSD = userData?.saldo || 0;
  const saldoConvertido = (saldoUSD * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 });

  // DATOS DE PAGO DEL ADMIN (Para que te recarguen)
  const datosPagoAdmin = {
    banco: "Banco de Venezuela",
    telefono: "04121234567",
    cedula: "V-12345678"
  };

  const manejarRecarga = async (e) => {
    e.preventDefault();
    if (!montoRecarga || !referencia) {
      setToastMsg("Completa todos los campos");
      setShowToast(true);
      return;
    }

    setEnviando(true);
    try {
      await addDoc(collection(db, "PagosPendientes"), {
        uid: userData.id,
        nombre: userData.nombre,
        monto: Number(montoRecarga),
        referencia: referencia,
        tasaAplicada: tasaBCV,
        fecha: new Date().toISOString(),
        estado: "pendiente",
        tipo: "recarga"
      });

      setToastMsg("Solicitud enviada. Espera la validación.");
      setShowToast(true);
      setShowModalRecarga(false);
      setMontoRecarga("");
      setReferencia("");
    } catch (error) {
      console.error(error);
      setToastMsg("Error al enviar solicitud");
      setShowToast(true);
    } finally {
      setEnviando(false);
    }
  };

  const manejarRetiro = async (e) => {
    e.preventDefault();
    const monto = Number(montoRetiro);
    const MINIMO_RETIRO = 10; 

    if (monto < MINIMO_RETIRO) {
      setToastMsg(`El retiro mínimo es de $${MINIMO_RETIRO}`);
      setShowToast(true);
      return;
    }

    if (monto > saldoUSD) {
      setToastMsg("Saldo insuficiente para retirar");
      setShowToast(true);
      return;
    }

    if (!datosBancarios.banco || !datosBancarios.telefono || !datosBancarios.cedula) {
      setToastMsg("Completa tus datos de Pago Móvil");
      setShowToast(true);
      return;
    }

    setEnviando(true);
    try {
      // 1. DESCONTAR EL SALDO INMEDIATAMENTE PARA EVITAR DOBLE GASTO
      await updateDoc(doc(db, "usuarios", userData.id), {
        saldo: increment(-monto)
      });

      // 2. CREAR LA SOLICITUD DE RETIRO
      await addDoc(collection(db, "PagosPendientes"), {
        uid: userData.id,
        nombre: userData.nombre,
        monto: monto,
        datosBancarios: datosBancarios,
        tasaAplicada: tasaBCV,
        fecha: new Date().toISOString(),
        estado: "pendiente",
        tipo: "retiro"
      });

      setToastMsg("Retiro en proceso. El saldo ha sido retenido.");
      setShowToast(true);
      setShowModalRetiro(false);
      setMontoRetiro("");
      setDatosBancarios({ banco: "", telefono: "", cedula: "" });
    } catch (error) {
      console.error(error);
      setToastMsg("Error al procesar el retiro");
      setShowToast(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] font-sans pb-24 relative overflow-hidden">
      <Toast show={showToast} message={toastMsg} onClose={() => setShowToast(false)} />

      {/* HEADER */}
      <div className="p-6 pt-10 flex justify-between items-center sticky top-0 bg-[#0b1120]/80 backdrop-blur-lg z-50">
        <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowDownLeft className="rotate-90" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black italic text-white uppercase tracking-tighter leading-none">Mi Billetera</h2>
          <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
            BCV: {tasaBCV > 0 ? tasaBCV : 'Cargando...'}
          </p>
        </div>
      </div>

      <div className="px-5 space-y-8">
        {/* TARJETA DE SALDO */}
        <div className="relative overflow-hidden rounded-[35px] p-8 border border-white/10 bg-gradient-to-br from-blue-900/40 to-slate-900/80 backdrop-blur-xl shadow-lg mt-2">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-blue-300/80 mb-2">Saldo Neto</p>
            <div className="flex items-start justify-center gap-1">
              <span className="text-3xl font-black italic text-blue-400 mt-2">$</span>
              <span className="text-7xl font-black italic text-white tracking-tighter leading-none">{saldoUSD.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex items-center gap-2 bg-slate-950/50 px-5 py-2.5 rounded-full border border-slate-800/50">
              <RefreshCcw size={12} className="text-green-400" />
              <p className="text-[11px] font-bold text-slate-300 tracking-wide">≈ Bs. {saldoConvertido}</p>
            </div>
          </div>
        </div>

        {/* BOTONES PRINCIPALES */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowModalRecarga(true)} className="bg-emerald-600 p-5 rounded-[28px] shadow-lg flex flex-col items-center gap-3 active:scale-95 transition-all border border-emerald-500">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ArrowDownLeft size={24} className="text-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Recargar</span>
          </button>

          <button onClick={() => setShowModalRetiro(true)} className="bg-slate-900 p-5 rounded-[28px] flex flex-col items-center gap-3 active:scale-95 transition-all border border-slate-800 hover:border-slate-700">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
              <ArrowUpRight size={24} className="text-blue-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Retirar</span>
          </button>
        </div>

        {/* HISTORIAL DINÁMICO DE TRANSACCIONES */}
        <div className="pt-2">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 ml-1">Movimientos Recientes</h3>
          
          {cargandoHistorial ? (
            <p className="text-center text-xs font-bold text-slate-500 py-10 animate-pulse">Cargando movimientos...</p>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/50 rounded-3xl border border-slate-800">
              <History size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">No hay movimientos recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transacciones.map((tx) => {
                const esIngreso = tx.tipo === 'ingreso' || tx.tipo === 'recarga';
                return (
                  <div key={tx.id} className="bg-slate-900/80 p-5 rounded-[25px] border border-slate-800 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${esIngreso ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {esIngreso ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-300 uppercase">{tx.descripcion}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 tracking-widest">
                          {new Date(tx.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    </div>
                    <p className={`text-base font-black italic ${esIngreso ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {esIngreso ? '+' : '-'}${Number(tx.monto).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div> {/* <-- ESTE ERA EL DIV QUE FALTABA Y ROMPÍA TODO */}

      {/* MODAL DE RECARGA */}
      {showModalRecarga && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[40px] p-8 border border-slate-800 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-white">Recargar Saldo</h3>
              <button onClick={() => setShowModalRecarga(false)} className="p-2 bg-slate-800 rounded-full text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4 mb-8 bg-blue-900/20 p-5 rounded-3xl border border-blue-500/20">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={14}/> Datos para Pago Móvil</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-400">Banco:</span><span className="text-xs font-black text-white uppercase">{datosPagoAdmin.banco}</span></div>
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-400">Teléfono:</span><span className="text-xs font-black text-white">{datosPagoAdmin.telefono}</span></div>
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-400">Cédula:</span><span className="text-xs font-black text-white">{datosPagoAdmin.cedula}</span></div>
              </div>
            </div>

            <form onSubmit={manejarRecarga} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] mb-1.5 block ml-1">Monto a Recargar ($)</label>
                <input type="number" value={montoRecarga} onChange={(e) => setMontoRecarga(e.target.value)} placeholder="Ej: 10.00" className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] mb-1.5 block ml-1">Nro de Referencia (Últimos 4-6)</label>
                <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="0000" className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-500 transition-all" />
              </div>
              <button type="submit" disabled={enviando} className="w-full bg-blue-600 text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-900/50 active:scale-95 transition-all disabled:opacity-50">
                {enviando ? "Notificando..." : "Notificar Pago"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RETIRO */}
      {showModalRetiro && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[40px] p-8 border border-slate-800 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-white">Retirar Dinero</h3>
              <button onClick={() => setShowModalRetiro(false)} className="p-2 bg-slate-800 rounded-full text-white"><X size={18} /></button>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">
              Retiro mínimo: $10. Introduce tus datos de Pago Móvil.
            </p>

            <form onSubmit={manejarRetiro} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] mb-1.5 block ml-1">Monto a Retirar ($)</label>
                <input type="number" value={montoRetiro} onChange={(e) => setMontoRetiro(e.target.value)} placeholder={`Max: $${saldoUSD.toFixed(2)}`} className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-500 transition-all" />
                {montoRetiro && tasaBCV > 0 && (
                  <p className="text-[9px] font-black text-blue-400 uppercase mt-2 ml-1 italic">Recibirás ≈ Bs. {(Number(montoRetiro) * tasaBCV).toFixed(2)}</p>
                )}
              </div>

              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Banknote size={14}/> Datos de Pago Móvil</p>
                <input type="text" value={datosBancarios.banco} onChange={(e) => setDatosBancarios({...datosBancarios, banco: e.target.value})} placeholder="Banco (Ej: Mercantil)" className="w-full bg-transparent border-b border-slate-800 text-white p-2 text-xs font-bold outline-none focus:border-blue-500" />
                <input type="tel" value={datosBancarios.telefono} onChange={(e) => setDatosBancarios({...datosBancarios, telefono: e.target.value})} placeholder="Teléfono" className="w-full bg-transparent border-b border-slate-800 text-white p-2 text-xs font-bold outline-none focus:border-blue-500" />
                <input type="text" value={datosBancarios.cedula} onChange={(e) => setDatosBancarios({...datosBancarios, cedula: e.target.value})} placeholder="Cédula (Ej: V-12345678)" className="w-full bg-transparent border-b border-slate-800 text-white p-2 text-xs font-bold outline-none focus:border-blue-500" />
              </div>

              <button type="submit" disabled={enviando || Number(montoRetiro) > saldoUSD || Number(montoRetiro) < 10} className="w-full bg-slate-800 text-blue-400 border border-blue-500/30 rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 mt-4">
                {enviando ? "Procesando..." : "Solicitar Retiro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
