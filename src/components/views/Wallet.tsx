import React from "react";
import { Wallet as WalletIcon, Lock, CreditCard, History, DollarSign } from "lucide-react";

export const Wallet = ({ userData }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black italic text-slate-800 uppercase tracking-tighter">Mi Wallet</h2>
      
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
        <p className="text-[10px] font-black uppercase opacity-80 mb-2 tracking-widest text-blue-100">Saldo Disponible</p>
        <p className="text-6xl font-black italic leading-none">${userData?.saldo?.toFixed(2) || "0.00"}</p>
        <div className="absolute top-10 right-10 opacity-20">
          <WalletIcon size={80} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <CreditCard size={24} />
          </div>
          <span className="text-[10px] font-black uppercase italic text-slate-500">Recargar</span>
        </button>
        <button className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <History size={24} />
          </div>
          <span className="text-[10px] font-black uppercase italic text-slate-500">Historial</span>
        </button>
      </div>
    </div>
  );
};
