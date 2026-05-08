import React from "react";
import { 
  History, ArrowUpRight, ArrowDownLeft, 
  RefreshCcw, ShieldCheck, CreditCard
} from "lucide-react";

export const Wallet = ({ userData, onRegresar }) => {
  // TASA OFICIAL BCV (Mock - En producción debería venir de tu backend/Firebase)
  const tasaBCV = 496.83; 
  const saldoUSD = userData?.saldo || 15.50; // Saldo de prueba si no hay datos
  const saldoConvertido = (saldoUSD * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 });

  // MOCK DE MOVIMIENTOS RECIENTES
  const movimientos = [
    { id: 1, tipo: 'ingreso', titulo: 'Viaje finalizado (Caracas)', monto: 12.00, fecha: 'Hoy, 10:30 AM' },
    { id: 2, tipo: 'gasto', titulo: 'Pago de cola (Valencia)', monto: -4.50, fecha: 'Ayer, 2:15 PM' },
    { id: 3, tipo: 'retiro', titulo: 'Retiro a Pago Móvil', monto: -10.00, fecha: '05 May, 9:00 AM' },
  ];

  return (
    <div className="min-h-screen bg-[#0b1120] font-sans pb-24">
      
      {/* HEADER DE LA WALLET */}
      <div className="p-6 pt-10 flex justify-between items-center sticky top-0 bg-[#0b1120]/80 backdrop-blur-lg z-50">
        <div>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Mi Billetera</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fondos Seguros • Tasa BCV</p>
          </div>
        </div>
        <button onClick={onRegresar} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-inner text-slate-300 active:scale-95 transition-all">
          <History size={18} />
        </button>
      </div>

      <div className="px-5 space-y-8">
        
        {/* TARJETA DE SALDO PRINCIPAL (GLASSMORPHISM) */}
        <div className="relative overflow-hidden rounded-[35px] p-8 border border-white/10 bg-gradient-to-br from-blue-900/40 to-slate-900/80 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(37,99,235,0.2)] mt-2">
          {/* Círculos decorativos de fondo */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-blue-300/80 mb-2">Saldo Disponible</p>
            <div className="flex items-start justify-center gap-1">
              <span className="text-3xl font-black italic text-blue-400 mt-2">$</span>
              <span className="text-7xl font-black italic text-white tracking-tighter leading-none">{saldoUSD.toFixed(2)}</span>
            </div>
            
            {/* EQUIVALENTE OFICIAL EN BCV */}
            <div className="mt-6 flex items-center gap-2 bg-slate-950/50 px-5 py-2.5 rounded-full border border-slate-800/50">
              <RefreshCcw size={12} className="text-green-400" />
              <p className="text-[11px] font-bold text-slate-300 tracking-wide">
                ≈ Bs. {saldoConvertido} <span className="text-slate-500 uppercase text-[9px] ml-1">(TASA OFICIAL BCV)</span>
              </p>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN RÁPIDA */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-gradient-to-b from-emerald-500 to-emerald-700 p-5 rounded-[28px] shadow-lg shadow-emerald-900/20 flex flex-col items-center gap-3 active:scale-95 transition-all border border-emerald-400/30">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ArrowDownLeft size={24} className="text-white" />
            </div>
            <div className="text-center">
              <span className="block text-[11px] font-black uppercase tracking-widest text-white">Recargar</span>
              <span className="block text-[8px] font-bold text-emerald-100 uppercase mt-0.5">Ingresar dinero</span>
            </div>
          </button>

          <button className="bg-slate-900 p-5 rounded-[28px] flex flex-col items-center gap-3 active:scale-95 transition-all border border-slate-800 hover:border-slate-700">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
              <ArrowUpRight size={24} className="text-blue-400" />
            </div>
            <div className="text-center">
              <span className="block text-[11px] font-black uppercase tracking-widest text-slate-300">Retirar</span>
              <span className="block text-[8px] font-bold text-slate-500 uppercase mt-0.5">A cuenta bancaria</span>
            </div>
          </button>
        </div>

        {/* HISTORIAL RECIENTE */}
        <div className="pt-2">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Actividad Reciente</h3>
            <button className="text-[9px] font-bold uppercase text-blue-400 hover:text-blue-300 active:scale-95 transition-all">Ver todo</button>
          </div>

          <div className="space-y-3">
            {movimientos.map((mov) => (
              <div key={mov.id} className="bg-slate-900/50 p-4 rounded-[24px] border border-slate-800/80 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  mov.tipo === 'ingreso' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  mov.tipo === 'retiro' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {mov.tipo === 'ingreso' ? <ArrowDownLeft size={20} /> : 
                   mov.tipo === 'retiro' ? <CreditCard size={20} /> : <ArrowUpRight size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{mov.titulo}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{mov.fecha}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-sm font-black italic ${
                    mov.tipo === 'ingreso' ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {mov.monto > 0 ? '+' : ''}{mov.monto.toFixed(2)}$
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
