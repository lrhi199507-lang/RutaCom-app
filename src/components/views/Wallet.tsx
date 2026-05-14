import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, collection, addDoc, increment, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { 
  History, ArrowUpRight, ArrowDownLeft, 
  RefreshCcw, ShieldCheck, CreditCard, X, Info, Banknote, Copy, Lock
} from "lucide-react";
import Toast from "../ui/Toast";

export const Wallet = ({ userData, onRegresar }) => {
  const [showModalRecarga, setShowModalRecarga] = useState(false);
  const [showModalRetiro, setShowModalRetiro] = useState(false);
  const [montoRecarga, setMontoRecarga] = useState("");
  const [referencia, setReferencia] = useState("");
  const [montoRetiro, setMontoRetiro] = useState("");
  
  // 🔥 LÓGICA NUEVA: Precargar datos guardados y forzar la cédula del usuario 🔥
  const [datosBancarios, setDatosBancarios] = useState({ 
    banco: userData?.datosBancarios?.banco || "", 
    telefono: userData?.datosBancarios?.telefono || "", 
    cedula: userData?.cedulaNumero || "" // Forzamos su cédula registrada
  });

  const [enviando, setEnviando] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  const [transacciones, setTransacciones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [filtroTx, setFiltroTx] = useState("todos"); 

  const [tasaBCV, setTasaBCV] = useState(0);
  const [datosPagoAdmin, setDatosPagoAdmin] = useState({ banco: "Cargando...", telefono: "Cargando...", cedula: "Cargando..." });

  useEffect(() => {
    const obtenerDatosFinanzas = async () => {
      try {
        const docRef = doc(db, "Configuracion", "Finanzas");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setTasaBCV(data.tasaBCV || 0);
          if (data.bancoAdmin) {
            setDatosPagoAdmin({
              banco: data.bancoAdmin.banco || "No definido",
              telefono: data.bancoAdmin.telefono || "No definido",
              cedula: data.bancoAdmin.cedula || "No definido"
            });
          }
        }
      } catch (error) { console.error("Error al obtener datos financieros:", error); }
    };
    obtenerDatosFinanzas();
  }, []);

  useEffect(() => {
    if (!userData?.id) return;
    const q = query(collection(db, "Transacciones"), where("uid", "==", userData.id), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const historial = [];
      snap.forEach(documento => historial.push({ id: documento.id, ...documento.data() }));
      setTransacciones(historial);
      setCargandoHistorial(false);
    }, (error) => {
      console.error("Error en Billetera:", error);
      setToastMsg(`Error de lectura: ${error.message}`);
      setShowToast(true);
      setCargandoHistorial(false); 
    });
    return () => unsub();
  }, [userData?.id]);

  const saldoTotal = userData?.saldo || 0;
  const saldoRetenido = userData?.saldoRetenido || 0;
  const saldoDisponible = saldoTotal - saldoRetenido;
  const saldoConvertido = (saldoDisponible * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 });

  const copiarDato = async (texto, campo) => {
    try {
      await navigator.clipboard.writeText(texto);
      setToastMsg(`${campo} copiado al portapapeles`);
      setShowToast(true);
    } catch (err) { console.error("Error al copiar", err); }
  };
  
  const manejarRecarga = async (e) => {
    e.preventDefault();
    if (!montoRecarga || !referencia) { setToastMsg("Completa todos los campos"); setShowToast(true); return; }
    setEnviando(true);
    try {
      await addDoc(collection(db, "PagosPendientes"), {
        uid: userData.id, nombre: userData.nombre, monto: Number(montoRecarga), referencia: referencia,
        tasaAplicada: tasaBCV, fecha: new Date().toISOString(), estado: "pendiente", tipo: "recarga"
      });
      setToastMsg("Solicitud enviada. Espera la validación."); setShowToast(true);
      setShowModalRecarga(false); setMontoRecarga(""); setReferencia("");
    } catch (error) {
      console.error(error); setToastMsg("Error al enviar solicitud"); setShowToast(true);
    } finally { setEnviando(false); }
  };

  const manejarRetiro = async (e) => {
    e.preventDefault();
    const monto = Number(montoRetiro);
    const MINIMO_RETIRO = 10; 

    if (monto < MINIMO_RETIRO) { setToastMsg(`El retiro mínimo es de $${MINIMO_RETIRO}`); setShowToast(true); return; }
    if (monto > saldoDisponible) { setToastMsg("Saldo insuficiente para retirar"); setShowToast(true); return; }
    if (!datosBancarios.banco || !datosBancarios.telefono || !datosBancarios.cedula) { setToastMsg("Completa tus datos de Pago Móvil"); setShowToast(true); return; }

    setEnviando(true);
    try {
      // 1. CONGELAMOS EL SALDO Y GUARDAMOS EL BANCO PARA LA PRÓXIMA VEZ 🔥
      await updateDoc(doc(db, "usuarios", userData.id), {
        saldoRetenido: increment(monto),
        datosBancarios: {
          banco: datosBancarios.banco,
          telefono: datosBancarios.telefono,
          cedula: datosBancarios.cedula
        }
      });

      // 2. CREAMOS LA SOLICITUD DE RETIRO
      await addDoc(collection(db, "PagosPendientes"), {
        uid: userData.id, nombre: userData.nombre, monto: monto, datosBancarios: datosBancarios,
        tasaAplicada: tasaBCV, fecha: new Date().toISOString(), estado: "pendiente", tipo: "retiro"
      });

      setToastMsg("Retiro en proceso. Datos guardados."); setShowToast(true);
      setShowModalRetiro(false); setMontoRetiro("");
    } catch (error) {
      console.error(error); setToastMsg("Error al procesar el retiro"); setShowToast(true);
    } finally { setEnviando(false); }
  };

  const transaccionesFiltradas = transacciones.filter(tx => {
    if (filtroTx === 'todos') return true;
    if (filtroTx === 'ingreso') return tx.tipo === 'ingreso' || tx.tipo === 'recarga';
    if (filtroTx === 'gasto') return tx.tipo === 'gasto' || tx.tipo === 'retiro';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b1120] font-sans pb-24 relative overflow-x-hidden">
      <Toast show={showToast} message={toastMsg} onClose={() => setShowToast(false)} />

      <div className="p-6 pt-10 flex justify-between items-center sticky top-0 bg-[#0b1120]/80 backdrop-blur-lg z-50">
        <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
            <ArrowDownLeft className="rotate-90" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black italic text-white uppercase tracking-tighter leading-none">Mi Billetera</h2>
          <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-1">BCV: {tasaBCV > 0 ? tasaBCV : 'Cargando...'}</p>
        </div>
      </div>

      <div className="px-5 space-y-8">
        <div className="relative overflow-hidden rounded-[35px] p-8 border border-white/10 bg-gradient-to-br from-blue-900/40 to-slate-900/80 backdrop-blur-xl shadow-lg mt-2">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-blue-300/80 mb-2">Saldo Disponible</p>
            <div className="flex items-start justify-center gap-1">
              <span className="text-3xl font-black italic text-blue-400 mt-2">$</span>
              <span className="text-7xl font-black italic text-white tracking-tighter leading-none">{saldoDisponible.toFixed(2)}</span>
            </div>
            
            {saldoRetenido > 0 && (
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                ${saldoRetenido.toFixed(2)} Retenidos (En proceso)
              </p>
            )}

            <div className="mt-6 flex items-center gap-2 bg-slate-950/50 px-5 py-2.5 rounded-full border border-slate-800/50">
              <RefreshCcw size={12} className="text-green-400" />
              <p className="text-[11px] font-bold text-slate-300 tracking-wide">≈ Bs. {saldoConvertido}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowModalRecarga(true)} className="bg-emerald-600 p-5 rounded-[28px] shadow-lg flex flex-col items-center gap-3 active:scale-95 transition-all border border-emerald-500">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><ArrowDownLeft size={24} className="text-white" /></div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Recargar</span>
          </button>
          <button onClick={() => setShowModalRetiro(true)} className="bg-slate-900 p-5 rounded-[28px] flex flex-col items-center gap-3 active:scale-95 transition-all border border-slate-800 hover:border-slate-700">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center"><ArrowUpRight size={24} className="text-blue-400" /></div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Retirar</span>
          </button>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 ml-1">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Movimientos</h3>
            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-full border border-slate-800">
              <button onClick={() => setFiltroTx('todos')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${filtroTx === 'todos' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-400'}`}>Todos</button>
              <button onClick={() => setFiltroTx('ingreso')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${filtroTx === 'ingreso' ? 'bg-emerald-500/20 text-emerald-400 shadow-md' : 'text-slate-500 hover:text-slate-400'}`}>Ingresos</button>
              <button onClick={() => setFiltroTx('gasto')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${filtroTx === 'gasto' ? 'bg-red-500/20 text-red-400 shadow-md' : 'text-slate-500 hover:text-slate-400'}`}>Gastos</button>
            </div>
          </div>
          
          {cargandoHistorial ? (
            <p className="text-center text-xs font-bold text-slate-500 py-10 animate-pulse">Cargando movimientos...</p>
          ) : transaccionesFiltradas.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/50 rounded-3xl border border-slate-800">
              <History size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">No hay movimientos aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transaccionesFiltradas.map((tx) => {
                const esIngreso = tx.tipo === 'ingreso' || tx.tipo === 'recarga';
                return (
                  <div key={tx.id} className="bg-slate-900/80 p-5 rounded-[25px] border border-slate-800 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${esIngreso ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {esIngreso ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-300 uppercase">{tx.descripcion}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 tracking-widest">{new Date(tx.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</p>
                      </div>
                    </div>
                    <p className={`text-base font-black italic ${esIngreso ? 'text-emerald-400' : 'text-red-400'}`}>
                      {esIngreso ? '+' : '-'}${Number(tx.monto).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModalRecarga && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[40px] p-8 border border-slate-800 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-white">Recargar Saldo</h3>
              <button onClick={() => setShowModalRecarga(false)} className="p-2 bg-slate-800 rounded-full text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4 mb-8 bg-blue-900/20 p-5 rounded-3xl border border-blue-500/20">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={14}/> Datos para Pago Móvil</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400">Banco:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-white uppercase">{datosPagoAdmin.banco}</span>
                    <button type="button" onClick={() => copiarDato(datosPagoAdmin.banco, "Banco")} className="text-blue-400 hover:text-blue-300 active:scale-90 p-1.5 bg-blue-500/10 rounded-lg transition-all"><Copy size={14} /></button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400">Teléfono:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-white">{datosPagoAdmin.telefono}</span>
                    <button type="button" onClick={() => copiarDato(datosPagoAdmin.telefono, "Teléfono")} className="text-blue-400 hover:text-blue-300 active:scale-90 p-1.5 bg-blue-500/10 rounded-lg transition-all"><Copy size={14} /></button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400">Cédula:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-white">{datosPagoAdmin.cedula}</span>
                    <button type="button" onClick={() => copiarDato(datosPagoAdmin.cedula, "Cédula")} className="text-blue-400 hover:text-blue-300 active:scale-90 p-1.5 bg-blue-500/10 rounded-lg transition-all"><Copy size={14} /></button>
                  </div>
                </div>
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
                <input type="number" value={montoRetiro} onChange={(e) => setMontoRetiro(e.target.value)} placeholder={`Max: $${saldoDisponible.toFixed(2)}`} className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-500 transition-all" />
                {montoRetiro && tasaBCV > 0 && (
                  <p className="text-[9px] font-black text-blue-400 uppercase mt-2 ml-1 italic">Recibirás ≈ Bs. {(Number(montoRetiro) * tasaBCV).toFixed(2)}</p>
                )}
              </div>

              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Banknote size={14}/> Datos de Pago Móvil</p>
                <input type="text" value={datosBancarios.banco} onChange={(e) => setDatosBancarios({...datosBancarios, banco: e.target.value})} placeholder="Banco (Ej: Mercantil)" className="w-full bg-transparent border-b border-slate-800 text-white p-2 text-xs font-bold outline-none focus:border-blue-500" />
                <input type="tel" value={datosBancarios.telefono} onChange={(e) => setDatosBancarios({...datosBancarios, telefono: e.target.value})} placeholder="Teléfono" className="w-full bg-transparent border-b border-slate-800 text-white p-2 text-xs font-bold outline-none focus:border-blue-500" />
                
                {/* 🔥 CANDADO: CÉDULA BLOQUEADA 🔥 */}
                <div className="relative">
                  <input 
                    type="text" 
                    value={datosBancarios.cedula} 
                    readOnly
                    className="w-full bg-slate-950 border-b border-slate-800 text-slate-500 p-2 text-xs font-bold outline-none cursor-not-allowed pr-8" 
                  />
                  <Lock size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600" />
                </div>
                <p className="text-[8px] font-black text-red-500/80 uppercase tracking-widest italic text-right mt-1">Titular Inamovible</p>

              </div>

              <button type="submit" disabled={enviando || Number(montoRetiro) > saldoDisponible || Number(montoRetiro) < 10 || !datosBancarios.cedula} className="w-full bg-slate-800 text-blue-400 border border-blue-500/30 rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 mt-4">
                {enviando ? "Procesando..." : "Solicitar Retiro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
