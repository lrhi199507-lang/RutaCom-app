import React from 'react';
import { 
  ChevronLeft, MessageCircle, Phone, ShieldCheck, 
  Star, Music, MessageSquare, User, Car 
} from 'lucide-react';

const PerfilPublico = ({ conductor, onClose }: any) => {
  if (!conductor) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* 1. ENCABEZADO BLANCO (Identidad visual de la App) */}
      <div className="bg-white px-6 pt-12 pb-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Icono "D" azul */}
          <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-black italic text-xl">D</span>
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Modo Pasajero</p>
            <p className="text-sm font-black text-slate-800 leading-none">{conductor.nombre}</p>
          </div>
        </div>

        {/* BOTÓN VOLVER (Recuperado y estilizado) */}
        <button 
          onClick={onClose}
          className="flex items-center gap-2 group active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200">
             <ChevronLeft size={18} className="text-slate-600" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Volver</span>
        </button>
      </div>

      {/* 2. CUERPO CON FONDO OSCURITO (slate-50) */}
      <div className="flex-1 overflow-y-auto bg-slate-50/80 px-6 pt-8">
        
        {/* TARJETA PRINCIPAL (Blanca para que resalte sobre el fondo) */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center mb-8">
          <div className="w-28 h-28 bg-white rounded-[35px] border-4 border-slate-50 shadow-xl overflow-hidden mb-4 flex items-center justify-center">
            {conductor.fotoPerfil ? (
              <img src={conductor.fotoPerfil} className="w-full h-full object-cover" alt="" />
            ) : (
              <User size={40} className="text-slate-200" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 italic">
            {conductor.nombre} 
            <span className="text-blue-600 text-xl">✅</span>
          </h2>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[2px] mt-1 italic">
            Conductor Verificado
          </p>
          <div className="mt-4 bg-green-50 px-4 py-1.5 rounded-full border border-green-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase text-green-700 italic tracking-wider">
              Respuesta Inmediata
            </span>
          </div>
        </div>

        {/* BIOGRAFÍA (Tarjeta Blanca) */}
        <div className="mb-8">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-[3px] ml-4 mb-2 italic">Sobre el conductor</p>
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
            <p className="text-slate-600 leading-relaxed font-bold italic text-[11px]">
              "{conductor.bio || "Este conductor aún no ha escrito su biografía."}"
            </p>
          </div>
        </div>

        {/* ESTILO DE VIAJE (Tarjetas Blancas) */}
        <div className="mb-8">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] ml-4 mb-3 italic">Estilo de viaje</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-5 rounded-[30px] bg-white border-2 flex flex-col items-center gap-2 transition-all ${conductor.hablador ? 'border-blue-500' : 'border-transparent opacity-50'}`}>
              <MessageSquare size={20} className={conductor.hablador ? 'text-blue-600' : 'text-slate-300'} />
              <p className="text-[9px] font-black uppercase text-slate-800">{conductor.hablador ? 'Conversador' : 'Tranquilo'}</p>
            </div>
            <div className={`p-5 rounded-[30px] bg-white border-2 flex flex-col items-center gap-2 transition-all ${conductor.musica ? 'border-blue-500' : 'border-transparent opacity-50'}`}>
              <Music size={20} className={conductor.musica ? 'text-blue-600' : 'text-slate-300'} />
              <p className="text-[9px] font-black uppercase text-slate-800">{conductor.musica ? 'Música' : 'Sin música'}</p>
            </div>
          </div>
        </div>

        {/* OPINIONES (Tarjeta Blanca) */}
        <div className="mb-32">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] ml-4 mb-3 italic">Opiniones y reseñas</p>
          <button className="w-full bg-white border border-slate-100 p-5 rounded-[35px] flex items-center justify-between shadow-sm active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-2xl">
                <Star size={20} className="text-amber-600 fill-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Calificación</p>
                <p className="text-base font-black text-slate-800 italic">
                  4.9 <span className="text-slate-400 font-bold text-xs ml-1">(24 opiniones)</span>
                </p>
              </div>
            </div>
            <ChevronLeft size={20} className="rotate-180 text-blue-600" />
          </button>
        </div>
      </div>

      {/* 3. ACCIONES FIJAS (Fondo blanco puro) */}
      <div className="p-6 bg-white border-t border-slate-100 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <button className="flex-1 bg-slate-100 text-slate-700 h-14 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95">
          <MessageCircle size={18} className="text-blue-600" /> Chat App
        </button>
        <button className="flex-1 bg-green-500 text-white h-14 rounded-[22px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95">
          <Phone size={18} /> WhatsApp
        </button>
      </div>
    </div>
  );
};

export default PerfilPublico;
