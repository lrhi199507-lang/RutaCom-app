import React from 'react';
import { 
  ArrowLeft, MapPin, Car, User, ShieldCheck, 
  MessageCircle, Snowflake, CigaretteOff, 
  PawPrint, MessageSquare, Briefcase 
} from 'lucide-react';

export const VistaDetalleViaje = ({ viaje, onRegresar }) => {
  // Si por algún error no llega el viaje, evitamos pantalla blanca
  if (!viaje) return (
    <div className="h-screen flex items-center justify-center p-10 text-center">
      <button onClick={onRegresar} className="text-blue-600 font-black">VOLVER AL INICIO</button>
    </div>
  );

  // Lista de preferencias (puedes luego conectarlo a tu base de datos)
  const preferencias = [
    { icono: Snowflake, texto: "A/C" },
    { icono: CigaretteOff, texto: "NO FUMAR" },
    { icono: PawPrint, texto: "MASCOTAS" },
    { icono: MessageSquare, texto: "CONVERSACIÓN" },
    { icono: Briefcase, texto: "ESPACIO EQUIPAJE" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* BOTÓN VOLVER (Minimalista como la foto) */}
      <div className="p-4 pt-6">
        <button onClick={onRegresar} className="flex items-center gap-2 text-slate-400 active:scale-95 transition-all">
          <ArrowLeft size={18} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[2px]">Volver al Inicio</span>
        </button>
      </div>

      <div className="px-5 space-y-5">
        
        {/* TARJETA PRINCIPAL: COSTO Y RUTA */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo del Viaje</p>
              <div className="flex items-start gap-1">
                <span className="text-3xl font-black italic text-blue-600 mt-1">$</span>
                <span className="text-7xl font-black italic text-blue-600 leading-none">
                  {viaje.precio || "10"}
                </span>
              </div>
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase italic text-slate-500">Novato</span>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-2xl border-2 border-blue-100 flex items-center justify-center text-blue-600 bg-blue-50">
              <MapPin size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 flex items-center justify-between pr-4">
              <p className="text-lg font-black italic text-slate-900 uppercase tracking-tighter">
                {viaje.cO || "VALENCIA"}
              </p>
              <div className="h-[2px] w-8 bg-slate-100" />
              <p className="text-lg font-black italic text-slate-900 uppercase tracking-tighter">
                {viaje.cD || "CARACAS"}
              </p>
            </div>
          </div>
        </div>

        {/* INFO DEL VEHÍCULO */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-20 h-20 rounded-[25px] bg-blue-50/50 border border-blue-100 flex items-center justify-center text-blue-500">
            <Car size={35} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehículo del Viaje</p>
            <p className="text-xl font-black italic text-slate-800 leading-none uppercase">
              {viaje.vM || "TOYOTA"} {viaje.vMo || "HILUX"}
            </p>
            <div className="flex gap-2 mt-3">
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black border border-slate-200 uppercase">
                {viaje.vP || "1234"}
              </span>
              <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black border border-slate-200 flex items-center gap-1.5 uppercase">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                {viaje.vC || "NEGRO"}
              </div>
            </div>
          </div>
        </div>

        {/* INFO DEL CONDUCTOR */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-300">
            <User size={30} />
          </div>
          <div className="flex-1">
            <p className="text-xl font-black italic text-slate-800 leading-none uppercase underline decoration-blue-200 decoration-2 underline-offset-4">
              {viaje.cN || "LUIS HERNÁNDEZ"}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5">
              <ShieldCheck size={14} className="text-green-500" />
              <p className="text-[10px] font-black text-green-600 uppercase tracking-wider">Conductor Identificado</p>
            </div>
          </div>
        </div>

        {/* PASAJEROS */}
        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-[11px] font-black italic text-slate-400 uppercase tracking-widest">Pasajeros Confirmados (0/1)</p>
          </div>
          <p className="text-center text-slate-400 font-bold text-sm italic">Sé el primero en reservar un puesto.</p>
          <div className="border-2 border-dashed border-slate-100 rounded-[25px] p-5 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <User size={20} />
            </div>
            <p className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">Asiento Disponible</p>
          </div>
        </div>

        {/* PREFERENCIAS */}
        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 space-y-6">
          <p className="text-[11px] font-black italic text-slate-800 uppercase tracking-widest">Preferencias</p>
          <div className="grid grid-cols-2 gap-3">
            {preferencias.map((pref, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                <pref.icono size={16} className="text-blue-500" />
                <span className="text-[10px] font-black italic text-blue-800 uppercase leading-none">{pref.texto}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTONES FIJOS */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50 max-w-md mx-auto flex gap-3">
        <button className="flex-1 h-16 bg-slate-900 text-white rounded-[25px] font-black uppercase text-[11px] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
          <MessageCircle size={18} />
          Chat
        </button>
        <button className="flex-[2] h-16 bg-blue-600 text-white rounded-[25px] font-black uppercase text-[11px] shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
          Pedir Cola
        </button>
      </div>

    </div>
  );
};
