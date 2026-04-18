import React from 'react';
import { 
  ArrowLeft, Car, ShieldCheck, User, Wind, 
  CigaretteOff, Dog, MessageCircle, MessageSquare, Info 
} from 'lucide-react';

export const VistaDetalleViaje = ({ viaje, onRegresar }) => {
  if (!viaje) return null;

  return (
    <div className="bg-slate-50 min-h-full pb-10 animate-in slide-in-from-right duration-300">
      
      {/* BOTÓN REGRESAR */}
      <button 
        onClick={onRegresar} 
        className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={16} /> Regresar
      </button>

      <div className="space-y-4">
        
        {/* TARJETA DE PRECIO Y RUTA */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-6 right-8">
            <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
              <Info size={10} /> Novato
            </span>
          </div>
          
          <h1 className="text-6xl font-black text-blue-600 mb-6 tracking-tighter">
            ${viaje.precio || "10"}
          </h1>
          
          <div className="flex items-center gap-3 text-slate-800 font-black italic uppercase text-sm">
            <div className="w-5 h-5 border-2 border-blue-600 rounded-full flex items-center justify-center p-0.5">
               <div className="w-full h-full bg-blue-600 rounded-full"></div>
            </div>
            {viaje.cO || "VALENCIA"} 
            <span className="text-slate-300 mx-1">→</span> 
            {viaje.cD || "CARACAS"}
          </div>
        </div>

        {/* VEHÍCULO DEL VIAJE */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
            <Car size={32} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehículo del viaje</p>
            <h3 className="font-black italic text-slate-800 uppercase text-lg leading-tight">
              {viaje.vehiculo || "TOYOTA HILUX"}
            </h3>
            <div className="flex gap-2 mt-1.5">
              <span className="bg-slate-50 border border-slate-100 px-3 py-0.5 rounded-lg text-[10px] font-black text-slate-500">
                {viaje.placa || "1234"}
              </span>
              <span className="bg-slate-50 border border-slate-100 px-3 py-0.5 rounded-lg text-[10px] font-black text-slate-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div> {viaje.color || "NEGRO"}
              </span>
            </div>
          </div>
        </div>

        {/* CONDUCTOR */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-md">
            <User size={24} className="text-slate-300" />
          </div>
          <div>
            <h4 className="font-black italic text-slate-800 uppercase text-sm underline decoration-blue-500/20 underline-offset-4">
              {viaje.conductor || "LUIS HERNÁNDEZ"}
            </h4>
            <p className="text-[9px] font-bold text-green-500 flex items-center gap-1 mt-0.5">
              <ShieldCheck size={12} fill="currentColor" className="text-white" /> 
              CONDUCTOR IDENTIFICADO
            </p>
          </div>
        </div>

        {/* PASAJEROS CONFIRMADOS */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100 space-y-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User size={12} /> Pasajeros Confirmados (0/{viaje.puestos || "1"})
          </p>
          <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-[24px]">
            <p className="text-slate-400 font-bold italic text-xs uppercase mb-4">Sé el primero en reservar un puesto</p>
            <div className="flex items-center gap-3 bg-slate-50 w-fit mx-auto px-5 py-3 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                <User size={16} className="text-slate-200" />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase italic">Asiento Disponible</span>
            </div>
          </div>
        </div>

        {/* PREFERENCIAS */}
        <div className="bg-white p-5 rounded-[30px] border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Preferencias</p>
          <div className="grid grid-cols-2 gap-3">
            <PrefItem icon={<Wind size={16}/>} label="A/C" active={viaje.preferencias?.ac} />
            <PrefItem icon={<CigaretteOff size={16}/>} label="No Fumar" active={viaje.preferencias?.noFumar} />
            <PrefItem icon={<Dog size={16}/>} label="Mascotas" active={viaje.preferencias?.mascotas} />
            <PrefItem icon={<MessageSquare size={16}/>} label="Conversación" active={viaje.preferencias?.conversar} />
            <PrefItem icon={<Car size={16}/>} label="Equipaje" active={viaje.preferencias?.equipaje} />
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-3 pt-2">
          <button className="flex-1 bg-slate-950 text-white p-5 rounded-[24px] font-black italic uppercase flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
            <MessageCircle size={20} className="text-blue-400" /> Chat
          </button>
          <button className="flex-[1.5] bg-blue-600 text-white p-5 rounded-[24px] font-black italic uppercase shadow-xl shadow-blue-500/30 active:scale-95 transition-all">
            Pedir Cola
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente pequeño para las preferencias
const PrefItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
    active 
      ? "bg-blue-50/50 border-blue-100 text-blue-600" 
      : "bg-slate-50 border-slate-100 text-slate-300"
  }`}>
    {React.cloneElement(icon, { size: 16, className: active ? "text-blue-500" : "text-slate-300" })}
    <span className="text-[10px] font-black uppercase italic">{label}</span>
  </div>
);
