import React from 'react';
import { ShieldCheck, CreditCard, Car, User, CheckCircle } from 'lucide-react';

export const ModalChecklist = ({ 
  mostrarChecklist, 
  setMostrarChecklist, 
  viajeActivo, 
  checkSeguridad, 
  setCheckSeguridad, 
  pasajeroConfirmaEncuentro 
}) => {
  if (!mostrarChecklist) return null;

  const items = [
    { id: 'placaOk', label: `Placa coincide: ${viajeActivo?.vehiculoInfo?.placa}`, icon: <CreditCard size={14}/> },
    { id: 'modeloOk', label: `Vehículo: ${viajeActivo?.vehiculoInfo?.marca} ${viajeActivo?.vehiculoInfo?.modelo}`, icon: <Car size={14}/> },
    { id: 'conductorOk', label: "El chofer es el de la foto", icon: <User size={14}/> }
  ];

  const todoMarcado = checkSeguridad.placaOk && checkSeguridad.modeloOk && checkSeguridad.conductorOk;

  return (
    <div className="absolute inset-0 bg-slate-900/95 z-[250] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in duration-300">
      <div className="bg-white rounded-[40px] p-8 w-full shadow-2xl space-y-6">
        <div className="text-center">
          <ShieldCheck size={48} className="text-blue-600 mx-auto mb-2 drop-shadow-lg"/>
          <h3 className="font-black italic uppercase text-xl text-slate-800 leading-tight">Protocolo de Confianza</h3>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <button 
              key={item.id}
              onClick={() => setCheckSeguridad({...checkSeguridad, [item.id]: !checkSeguridad[item.id]})}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-300 ${checkSeguridad[item.id] ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
            >
              <div className="flex items-center gap-3">
                <span className={checkSeguridad[item.id] ? 'text-blue-600' : 'text-slate-300'}>{item.icon}</span>
                <span className="text-[11px] font-black uppercase italic">{item.label}</span>
              </div>
              {checkSeguridad[item.id] ? <CheckCircle size={20} className="fill-blue-600 text-white" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"/>}
            </button>
          ))}
        </div>

        <button 
          disabled={!todoMarcado}
          onClick={() => { setMostrarChecklist(false); pasajeroConfirmaEncuentro(); }}
          className={`w-full py-5 rounded-[25px] font-black uppercase italic text-xs shadow-lg transition-all ${todoMarcado ? 'bg-blue-600 text-white opacity-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
        >
          Confirmar y Ver PIN
        </button>
      </div>
    </div>
  );
};