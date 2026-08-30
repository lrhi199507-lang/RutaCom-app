import React, { useState, useEffect } from "react";
import { db, storage, functions } from "../../firebaseConfig"; 
import { doc, getDoc, updateDoc, collection, addDoc, increment, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage"; 
import { getAuth } from "firebase/auth";
import { httpsCallable } from "firebase/functions"; 
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'; 
import { 
  History, ArrowUpRight, ArrowDownLeft, 
  RefreshCcw, X, Info, Banknote, Copy, Lock, ImageIcon, AlertTriangle, Clock 
} from "lucide-react";
import Toast from "../ui/Toast";

export const Wallet = ({ userData, onRegresar }) => {
  const [showModalRecarga, setShowModalRecarga] = useState(false);
  const [showModalRetiro, setShowModalRetiro] = useState(false);
  const [montoRecarga, setMontoRecarga] = useState("");
  const [referencia, setReferencia] = useState("");
  const [montoRetiro, setMontoRetiro] = useState("");
  
  const [fotoRecarga, setFotoRecarga] = useState(null);
  const [metodoRecarga, setMetodoRecarga] = useState("pago_movil"); 
  const [txSeleccionada, setTxSeleccionada] = useState(null);
  
  const [datosBancarios, setDatosBancarios] = useState({ 
    banco: userData?.datosBancarios?.banco || "", 
    telefono: userData?.datosBancarios?.telefono || "", 
    cedula: userData?.cedulaNumero || "" 
  });

  const [enviando, setEnviando] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  
  const [transacciones, setTransacciones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [filtroTx, setFiltroTx] = useState("todos"); 

  const [tasaBCV, setTasaBCV] = useState(0);
  const [datosPagoAdmin, setDatosPagoAdmin] = useState({ banco: "Cargando...", telefono: "Cargando...", cedula: "Cargando..." });
  const [datosBinanceAdmin, setDatosBinanceAdmin] = useState({ payId: "Cargando...", correo: "Cargando..." });

  useEffect(() => {
    const obtenerDatosFinanzas = async () => {
      try {
        const docRef = doc(db, "Configuracion", "Finanzas");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setTasaBCV(data.tasaBCV || 0);
          if (data.bancoAdmin) {
            setDatosPagoAdmin({ banco: data.bancoAdmin.banco || "No definido", telefono: data.bancoAdmin.telefono || "No definido", cedula: data.bancoAdmin.cedula || "No definido" });
          }
          if (data.binanceAdmin) {
            setDatosBinanceAdmin({ payId: data.binanceAdmin.payId || "No definido", correo: data.binanceAdmin.correo || "No definido" });
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
      setToastMsg(`Error de lectura: ${error.message}`);
      setToastType("error");
      setShowToast(true);
      setCargandoHistorial(false); 
    });
    return () => unsub();
  }, [userData?.id]);

  const saldoDisponible = Number(userData?.saldo || 0); 
  const saldoRetenido = Number(userData?.saldoRetenido || 0); 
  const saldoEnTransito = Number(userData?.saldoEnTransito || 0); 
  const saldoConvertido = (saldoDisponible * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 });

  const copiarDato = async (texto, campo) => {
    try {
      await navigator.clipboard.writeText(texto);
      setToastMsg(`${campo} copiado al portapapeles`);
      setToastType("success");
      setShowToast(true);
    } catch (err) { console.error("Error al copiar", err); }
  };
  
  const capturarComprobante = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({ quality: 50, width: 800, resultType: CameraResultType.DataUrl, source: CameraSource.Photos });
      if (image.dataUrl) setFotoRecarga(image.dataUrl);
    } catch (e) { console.log("Selección de imagen cancelada"); }
  };

  const manejarRecarga = async (e) => {
    e.preventDefault();
    
    if (!montoRecarga || !referencia || !fotoRecarga) { 
      setToastMsg("Debes completar todos los datos y subir el capture"); setToastType("error"); setShowToast(true); return; 
    }
    
    setEnviando(true);
    try {
      const nombreArchivo = `comprobantes/${userData.id}_${Date.now()}.jpg`;
      const storageRef = ref(storage, nombreArchivo);
      await uploadString(storageRef, fotoRecarga, 'data_url');
      const urlComprobante = await getDownloadURL(storageRef);

      await addDoc(collection(db, "PagosPendientes"), {
        uid: userData.id, nombre: userData.nombre, monto: Number(montoRecarga), referencia: referencia,
        comprobanteUrl: urlComprobante, tasaAplicada: tasaBCV, fecha: new Date().toISOString(), 
        estado: "pendiente", tipo: "recarga", metodoPago: metodoRecarga 
      });

      try {
        const botToken = "8943485402:AAFwOhXY6BQDy2p09PxSE4BsfxGZ9g1nqWQ";
        const chatId = "6402827355";
        
        const etiquetaRef = metodoRecarga === "binance" ? "Apodo Binance" : "Referencia";
        
        const mensaje = `🔔 *NUEVA RECARGA SOLICITADA* 🔔\n\n💰 *Monto:* $${montoRecarga}\n📝 *${etiquetaRef}:* ${referencia}\n💳 *Método:* ${metodoRecarga.replace("_", " ")}\n👤 *Usuario:* ${userData.nombre}\n🆔 *ID:* ${userData.id}`;
        
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: mensaje, parse_mode: 'Markdown' })
        });
      } catch (errorTelegram) {
        console.error("Error al enviar mensaje a Telegram:", errorTelegram);
      }

      setToastMsg("Solicitud enviada. Espera la validación."); setToastType("success"); setShowToast(true);
      setShowModalRecarga(false); setMontoRecarga(""); setReferencia(""); setFotoRecarga(null);
    } catch (error) {
      setToastMsg("Error al enviar solicitud. Revisa tu conexión."); setToastType("error"); setShowToast(true);
    } finally { setEnviando(false); }
  };

  const manejarRetiro = async (e) => {
    e.preventDefault();
    const monto = Number(montoRetiro);
    const MINIMO_RETIRO = 10; 

    if (monto < MINIMO_RETIRO) { setToastMsg(`El retiro mínimo es de $${MINIMO_RETIRO}`); setToastType("error"); setShowToast(true); return; }
    if (monto > saldoDisponible) { setToastMsg("Saldo insuficiente para retirar"); setToastType("error"); setShowToast(true); return; }
    if (!datosBancarios.banco || !datosBancarios.telefono || !datosBancarios.cedula) { setToastMsg("Completa tus datos de Pago Móvil"); setToastType("error"); setShowToast(true); return; }

    setEnviando(true);
    try {
      const auth = getAuth(); 
      const user = auth.currentUser;
      
      if (!user) {
         throw new Error("Usuario no autenticado localmente");
      }
      
      const token = await user.getIdToken();
      const payload = {
        data: {
          monto: monto,
          datosBancarios: datosBancarios
        }
      };

      const URL_DE_TU_CLOUD_RUN = "https://solicitar-retiro-seguro-1080063705561.us-central1.run.app";
      
      const response = await fetch(URL_DE_TU_CLOUD_RUN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
         throw new Error(responseData?.data?.error || "Error interno del servidor");
      }

      setToastMsg("Retiro en proceso. El dinero ha sido congelado."); 
      setToastType("success"); 
      setShowToast(true);
      setShowModalRetiro(false); 
      setMontoRetiro("");

    } catch (error) {
      console.error(error);
      setToastMsg(error.message || "Error al procesar el retiro"); 
      setToastType("error"); 
      setShowToast(true);
    } finally { 
      setEnviando(false); 
    }
  };

  const transaccionesFiltradas = transacciones.filter(tx => {
    if (filtroTx === 'todos') return true;
    if (filtroTx === 'ingreso') return tx.tipo === 'ingreso' || tx.tipo === 'recarga';
    if (filtroTx === 'gasto') return tx.tipo === 'gasto' || tx.tipo === 'retiro';
    return true;
  });

  const botonBloqueadoPorHora = false; 
  
  return (
    <div className="min-h-screen bg-white font-sans pb-24 relative overflow-x-hidden">
      <Toast show={showToast} message={toastMsg} type={toastType} onClose={() => setShowToast(false)} />

      <div className="p-6 pt-10 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-lg z-50 border-b border-slate-100">
        <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 hover:text-[#063971] active:scale-95 transition-all">
            <ArrowDownLeft className="rotate-90" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black italic text-[#1F2937] uppercase tracking-tighter leading-none">Mi Billetera</h2>
          <p className="text-[8px] font-bold text-[#10B981] uppercase tracking-widest mt-1">BCV: {tasaBCV > 0 ? tasaBCV : 'Cargando...'}</p>
        </div>
      </div>

      <div className="px-5 space-y-8 mt-4">
        <div className="relative overflow-hidden rounded-[35px] p-8 border border-slate-100 bg-gradient-to-br from-[#063971] to-[#031E3F] shadow-xl">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#10B981]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-blue-200 mb-2">Saldo Disponible</p>
            <div className="flex items-start justify-center gap-1">
              <span className="text-3xl font-black italic text-[#10B981] mt-2">$</span>
              <span className="text-7xl font-black italic text-white tracking-tighter leading-none">{saldoDisponible.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col gap-2 mt-4 items-center">
              {saldoRetenido > 0 && (
                <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-1.5 rounded-full border border-amber-500/30">
                  <Lock size={12} className="text-amber-400" />
                  <p className="text-[9px] font-black text-amber-300 uppercase tracking-widest">
                    ${saldoRetenido.toFixed(2)} Bloqueado (Retiro/Reserva)
                  </p>
                </div>
              )}
              
              {saldoEnTransito > 0 && (
                <div className="flex items-center gap-2 bg-[#10B981]/20 px-4 py-1.5 rounded-full border border-[#10B981]/40">
                  <Clock size={12} className="text-[#10B981]" />
                  <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">
                    + ${saldoEnTransito.toFixed(2)} Ganancias en Tránsito
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-sm">
              <RefreshCcw size={12} className="text-[#10B981]" />
              <p className="text-[11px] font-bold text-white tracking-wide">≈ Bs. {saldoConvertido}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowModalRecarga(true)} className="bg-[#10B981] p-5 rounded-[28px] shadow-lg shadow-[#10B981]/20 flex flex-col items-center gap-3 active:scale-95 transition-all border border-emerald-400 hover:bg-emerald-600">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><ArrowDownLeft size={24} className="text-white" /></div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Recargar</span>
          </button>
          <button onClick={() => setShowModalRetiro(true)} className="bg-[#1F2937] p-5 rounded-[28px] flex flex-col items-center gap-3 active:scale-95 transition-all border border-slate-700 hover:bg-slate-800 shadow-md">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center"><ArrowUpRight size={24} className="text-[#10B981]" /></div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">Retirar</span>
          </button>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 ml-1">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Movimientos</h3>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
              <button onClick={() => setFiltroTx('todos')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${filtroTx === 'todos' ? 'bg-[#063971] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
              <button onClick={() => setFiltroTx('ingreso')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${filtroTx === 'ingreso' ? 'bg-[#10B981]/20 text-[#10B981] shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Ingresos</button>
              <button onClick={() => setFiltroTx('gasto')} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${filtroTx === 'gasto' ? 'bg-red-500/20 text-red-500 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Gastos</button>
            </div>
          </div>
          
          {cargandoHistorial ? (
            <p className="text-center text-xs font-bold text-slate-400 py-10 animate-pulse">Cargando movimientos...</p>
          ) : transaccionesFiltradas.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
              <History size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">No hay movimientos aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transaccionesFiltradas.map((tx) => {
                const esIngreso = tx.tipo === 'ingreso' || tx.tipo === 'recarga' || tx.tipo === 'reembolso';
                const esRechazo = tx.tipo === 'rechazo'; 
                
                const descMinuscula = (tx.descripcion || "").toLowerCase();
                const esTransaccionDeSaldo = descMinuscula.includes("recarga") || descMinuscula.includes("retiro") || descMinuscula.includes("reembolso") || tx.tipo === "recarga" || tx.tipo === "egreso";

                const tieneRecibo = (tx.tipo === 'ingreso' && !esTransaccionDeSaldo) || esRechazo;

                return (
                  <div 
                    key={tx.id} 
                    onClick={() => { if (tieneRecibo) setTxSeleccionada(tx); }}
                    className={`bg-white p-5 rounded-[25px] border flex items-center justify-between shadow-sm ${esRechazo ? 'border-orange-200' : 'border-slate-100'} ${tieneRecibo ? 'cursor-pointer active:scale-95 transition-all hover:border-[#063971]/30' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${esIngreso ? 'bg-[#10B981]/10 text-[#10B981]' : esRechazo ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                        {esIngreso ? <ArrowDownLeft size={20} /> : esRechazo ? <X size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase ${esRechazo ? 'text-orange-600' : 'text-[#1F2937]'}`}>{tx.descripcion}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">{new Date(tx.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className={`text-base font-black italic ${esIngreso ? 'text-[#10B981]' : esRechazo ? 'text-slate-400 line-through' : 'text-red-500'}`}>
                        {esIngreso ? '+' : esRechazo ? '' : '-'}${Number(tx.monto).toFixed(2)}
                      </p>
                      {tieneRecibo && (
                        <div className={`p-2 rounded-full border shadow-sm ${esRechazo ? 'bg-orange-500/10 text-orange-500 border-orange-200' : 'bg-slate-50 text-[#063971] border-slate-200'}`}>
                          <Info size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModalRecarga && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#1F2937]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 border border-slate-100 animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh] no-scrollbar shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-[#1F2937]">Recargar Saldo</h3>
              <button onClick={() => setShowModalRecarga(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-[#1F2937] active:scale-90 transition-all"><X size={18} /></button>
            </div>

            <div className="flex gap-3 mb-6">
              <button type="button" onClick={() => setMetodoRecarga("pago_movil")} className={`flex-1 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-wider transition-all border-2 active:scale-95 ${metodoRecarga === "pago_movil" ? "bg-[#063971] text-white border-[#063971] shadow-lg shadow-[#063971]/30" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                🇻🇪 Pago Móvil
              </button>
              <button type="button" onClick={() => setMetodoRecarga("binance")} className={`flex-1 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-wider transition-all border-2 active:scale-95 ${metodoRecarga === "binance" ? "bg-amber-500 text-amber-950 border-amber-500 shadow-lg shadow-amber-900/30" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                 Binance Pay
              </button>
            </div>

            {metodoRecarga === "pago_movil" ? (
              <div className="space-y-4 mb-6 bg-[#063971]/5 p-5 rounded-3xl border border-[#063971]/20 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black text-[#063971] uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={14}/> Datos para Pago Móvil</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500">Banco:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#1F2937] uppercase">{datosPagoAdmin.banco}</span>
                      <button type="button" onClick={() => copiarDato(datosPagoAdmin.banco, "Banco")} className="text-[#063971] hover:text-blue-800 p-1.5 bg-[#063971]/10 rounded-lg transition-all active:scale-90"><Copy size={13} /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500">Teléfono:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#1F2937]">{datosPagoAdmin.telefono}</span>
                      <button type="button" onClick={() => copiarDato(datosPagoAdmin.telefono, "Teléfono")} className="text-[#063971] hover:text-blue-800 p-1.5 bg-[#063971]/10 rounded-lg transition-all active:scale-90"><Copy size={13} /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500">Cédula:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#1F2937]">{datosPagoAdmin.cedula}</span>
                      <button type="button" onClick={() => copiarDato(datosPagoAdmin.cedula, "Cédula")} className="text-[#063971] hover:text-blue-800 p-1.5 bg-[#063971]/10 rounded-lg transition-all active:scale-90"><Copy size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6 bg-amber-500/10 p-5 rounded-3xl border border-amber-500/30 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={14}/> Datos de Binance (USDT)</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600">Binance Pay ID:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#1F2937]">{datosBinanceAdmin.payId}</span>
                      <button type="button" onClick={() => copiarDato(datosBinanceAdmin.payId, "Pay ID")} className="text-amber-700 hover:text-amber-900 p-1.5 bg-amber-500/20 rounded-lg transition-all active:scale-90"><Copy size={13} /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600">Correo Cuenta:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#1F2937] truncate max-w-[140px] text-right">{datosBinanceAdmin.correo}</span>
                      <button type="button" onClick={() => copiarDato(datosBinanceAdmin.correo, "Correo")} className="text-amber-700 hover:text-amber-900 p-1.5 bg-amber-500/20 rounded-lg transition-all active:scale-90"><Copy size={13} /></button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 shadow-inner">
                  <Lock size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">⚠️ Reglas</p>
                    <p className="text-[9px] font-bold text-slate-600 leading-relaxed">
                      Por seguridad, los fondos deben provenir de <span className="text-[#1F2937] font-black bg-red-100 px-1 py-0.5 rounded">TU PROPIA CUENTA</span>.
                    </p>
                    <div className="bg-red-100/70 p-2.5 rounded-xl border border-red-200 mt-1">
                      <p className="text-[9.5px] font-black text-red-800 uppercase tracking-wide">📌 Obligatorio en la NOTA:</p>
                      <p className="text-[9px] font-bold text-red-700 mt-1">
                        Al enviar el pago en Binance Pay, debes colocar en el campo de "Nota" lo siguiente: <br/>
                        <span className="text-[#1F2937] font-black bg-white px-1 py-0.5 rounded mt-1 inline-block shadow-sm">"recarga dame la cola"</span>
                      </p>
                    </div>
                    <p className="text-[8.5px] font-black text-red-600 uppercase tracking-wider mt-1">
                      🚫 Captures recortados, borrosos o de terceros serán rechazados.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 p-3.5 rounded-2xl mb-6 flex items-start gap-3">
              <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[9px] font-bold text-orange-800 uppercase tracking-widest leading-relaxed">
                <span className="text-orange-600 font-black">REQUISITO:</span> Debes adjuntar la captura clara del comprobante. ¡Tómale capture antes de cerrar tu app del banco/Binance!
              </p>
            </div>

            <form onSubmit={manejarRecarga} className="space-y-4">
              <div onClick={capturarComprobante} className={`w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${fotoRecarga ? 'border-[#10B981] bg-[#10B981]/10' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                {fotoRecarga ? (
                  <img src={fotoRecarga} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <>
                    <ImageIcon size={30} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-500 uppercase">Subir Capture de Pantalla</p>
                  </>
                )}
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] mb-1.5 block ml-1">Monto a Recargar ($ USDT)</label>
                <input type="number" value={montoRecarga} onChange={(e) => setMontoRecarga(e.target.value)} placeholder="Ej: 15.00" className="w-full bg-slate-50 border border-slate-200 text-[#1F2937] rounded-2xl p-4 text-lg font-black outline-none focus:border-[#063971] transition-all" />
                {metodoRecarga === "pago_movil" && montoRecarga && tasaBCV > 0 && (
                  <p className="text-[10px] font-black text-[#10B981] uppercase mt-2 ml-1 italic animate-in fade-in">
                    Debes transferir: ≈ Bs. {(Number(montoRecarga) * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] mb-1.5 block ml-1">
                  {metodoRecarga === "pago_movil" ? "Número de Referencia" : "Tu Apodo (Nickname) en Binance"}
                </label>
                <input 
                  type="text" 
                  value={referencia} 
                  onChange={(e) => setReferencia(e.target.value)} 
                  placeholder={metodoRecarga === "pago_movil" ? "Ej: 1234 (Últimos dígitos)" : "Ej: JuanPerez99"} 
                  className="w-full bg-slate-50 border border-slate-200 text-[#1F2937] rounded-2xl p-4 text-sm font-black outline-none focus:border-[#063971] transition-all" 
                />
              </div>
              
              <button type="submit" disabled={enviando} className="w-full bg-[#063971] text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#063971]/30 active:scale-95 transition-all disabled:opacity-50 mt-2 hover:bg-blue-800">
                {enviando ? "Procesando Notificación..." : "Notificar Pago Realizado"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showModalRetiro && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#1F2937]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 border border-slate-100 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-[#1F2937]">Retirar Dinero</h3>
              <button onClick={() => setShowModalRetiro(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-[#1F2937]"><X size={18} /></button>
            </div>

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed">
              Retiro mínimo: $10. Introduce tus datos de Pago Móvil.
            </p>
          
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock size={18} className="text-amber-600" />
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Horario de Retiros</p>
              </div>
              <p className="text-[10px] font-bold text-amber-900 leading-relaxed">
                El sistema de retiros se habilita <span className="font-black text-[#1F2937]">TODOS LOS DÍAS de 7:00 PM a 11:00 PM</span>. 
                Fuera de este horario, la opción permanecerá bloqueada.
              </p>
            </div>
            
            <form onSubmit={manejarRetiro} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[2px] mb-1.5 block ml-1">Monto a Retirar ($)</label>
                <input type="number" value={montoRetiro} onChange={(e) => setMontoRetiro(e.target.value)} placeholder={`Max: $${saldoDisponible.toFixed(2)}`} className="w-full bg-slate-50 border border-slate-200 text-[#1F2937] rounded-2xl p-4 text-lg font-black outline-none focus:border-[#063971] transition-all" />
                {montoRetiro && tasaBCV > 0 && (
                  <p className="text-[9px] font-black text-[#063971] uppercase mt-2 ml-1 italic">Recibirás ≈ Bs. {(Number(montoRetiro) * tasaBCV).toFixed(2)}</p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Banknote size={14}/> Datos de Pago Móvil</p>
                <input type="text" value={datosBancarios.banco} onChange={(e) => setDatosBancarios({...datosBancarios, banco: e.target.value})} placeholder="Banco (Ej: Mercantil)" className="w-full bg-transparent border-b border-slate-200 text-[#1F2937] p-2 text-xs font-bold outline-none focus:border-[#063971]" />
                <input type="tel" value={datosBancarios.telefono} onChange={(e) => setDatosBancarios({...datosBancarios, telefono: e.target.value})} placeholder="Teléfono" className="w-full bg-transparent border-b border-slate-200 text-[#1F2937] p-2 text-xs font-bold outline-none focus:border-[#063971]" />
                
                <div className="relative">
                  <input type="text" value={datosBancarios.cedula} readOnly className="w-full bg-slate-100 border-b border-slate-200 text-slate-500 p-2 text-xs font-bold outline-none cursor-not-allowed pr-8" />
                  <Lock size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest italic text-right mt-1">Titular Inamovible</p>
              </div>

              <button type="submit" disabled={enviando || Number(montoRetiro) > saldoDisponible || Number(montoRetiro) < 10 || !datosBancarios.cedula || botonBloqueadoPorHora} className="w-full bg-[#063971] text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-[#063971]/30 active:scale-95 transition-all disabled:opacity-50 mt-4 hover:bg-blue-800">
               {enviando ? "Procesando..." : "Solicitar Retiro"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {txSeleccionada && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-[#1F2937]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 border border-slate-100 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black italic uppercase text-[#1F2937]">Detalle del Viaje</h3>
              <button onClick={() => setTxSeleccionada(null)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-[#1F2937] active:scale-90 transition-all"><X size={18} /></button>
            </div>
            
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 leading-relaxed">
              Desglose de la transacción <br/><span className="text-[#1F2937] font-black">{txSeleccionada.descripcion || "Viaje Realizado"}</span>
            </p>

           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 shadow-inner max-h-[40vh] overflow-y-auto no-scrollbar">
               
               {txSeleccionada.tipo === "rechazo" ? (
                 <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl text-center shadow-inner">
                    <AlertTriangle size={36} className="text-orange-500 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">Motivo del Administrador</p>
                    <p className="text-sm font-bold text-[#1F2937] leading-relaxed">{txSeleccionada.motivo || "Problemas con la validación de tu solicitud."}</p>
                 </div>
               ) : (
                 <>
                   {txSeleccionada.desglose && txSeleccionada.desglose.length > 0 ? (
                     <div className="space-y-4">
                       {txSeleccionada.desglose.map((pasajero, idx) => (
                         <div key={idx} className="border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-black text-[#1F2937] uppercase">{pasajero.nombre} {pasajero.puestos > 1 ? `(${pasajero.puestos} ptos)` : ''}</span>
                              <span className="text-[11px] font-black text-[#10B981]">+${Number(pasajero.gananciaNeta).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span>Pago: ${Number(pasajero.montoTotalPagado).toFixed(2)}</span>
                              <span className="text-red-500">Comisión: -${Number(pasajero.comision).toFixed(2)}</span>
                            </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <>
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                          <span>Pago global pasajeros:</span>
                          <span>${((Number(txSeleccionada.monto) || 0) / 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-red-500">
                          <span>Comisión app global (10%):</span>
                          <span>-${(((Number(txSeleccionada.monto) || 0) / 0.9) * 0.1).toFixed(2)}</span>
                        </div>
                     </>
                   )}
                   
                   <div className="h-px bg-slate-200 w-full my-3"></div>
                   
                   <div className="flex justify-between items-center text-base font-black text-[#10B981]">
                     <span>Total Acreditado:</span>
                     <span>${(Number(txSeleccionada.monto) || 0).toFixed(2)}</span>
                   </div>
                 </>
               )}
            </div>

            <button onClick={() => setTxSeleccionada(null)} className="w-full bg-[#063971] text-white rounded-2xl p-4 font-black uppercase text-xs tracking-widest mt-6 active:scale-95 transition-all shadow-lg shadow-[#063971]/30 hover:bg-blue-800">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
