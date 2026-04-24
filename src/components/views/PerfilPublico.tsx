import React from 'react';
import { 
  ChevronLeft, MessageCircle, Phone, ShieldCheck, 
  Star, Music, MessageSquare, User, Car // <--- SE AGREGÓ 'Car' AQUÍ
} from 'lucide-react';

const PerfilPublico = ({ conductor, onClose }: any) => {
  if (!conductor) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* CABECERA AZUL */}
      <div className="bg-blue-600 h-40 w-full relative flex-shrink-0">
        <button 
          onClick={onClose}
          className="absolute top-12 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* CONTENIDO SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto px-6 -mt-12 bg-white rounded-t-[40px] relative">
        {/* FOTO Y NOMBRE */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 bg-white rounded-[35px] border-4 border-white shadow-2xl overflow-hidden mb-4 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-slate-100 -z-10" />
            {conductor.fotoPerfil ? (
              <img 
                src={conductor.fotoPerfil} 
                className="w-full h-full object-cover" 
                alt="" 
              />
            ) : (
              <User size={40} className="text-slate-300" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            {conductor.nombre} 
            <span className="text-blue-500 text-xl">✅</span>
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">
            Conductor Verificado
          </p>
          <div className="mt-3 bg-green-50 px-4 py-1.5 rounded-full border border-green-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-green-700 italic tracking-wider">
              Respuesta Inmediata
            </span>
          </div>
        </div>

        {/* BIO (SOBRE MÍ) */}
        <div className="mt-8">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[3px] mb-3 italic ml-2">Sobre el conductor</p>
          <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100">
            <p className="text-slate-600 leading-relaxed font-medium italic">
              "{conductor.bio || "Este conductor aún no ha escrito su biografía."}"
            </p>
          </div>
        </div>

        {/* ESTILO DE VIAJE */}
        <div className="mt-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4 ml-2">Estilo de viaje</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-[25px] border flex items-center gap-3 ${conductor.hablador ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
              <MessageSquare size={18} className={conductor.hablador ? 'text-blue-600' : 'text-slate-400'} />
              <p className="text-[9px] font-black uppercase text-slate-700">{conductor.hablador ? 'Conversador' : 'Tranquilo'}</p>
            </div>
            <div className={`p-4 rounded-[25px] border flex items-center gap-3 ${conductor.musica ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
              <Music size={18} className={conductor.musica ? 'text-blue-600' : 'text-slate-400'} />
              <p className="text-[9px] font-black uppercase text-slate-700">{conductor.musica ? 'Música' : 'Sin música'}</p>
            </div>
          </div>
        </div>

        {/* OPINIONES */}
        <div className="mt-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4 ml-2">Opiniones y reseñas</p>
          <button className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[30px] flex items-center justify-between active:scale-95 transition-all group">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-2xl group-hover:bg-amber-200 transition-colors">
                <Star size={20} className="text-amber-600 fill-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Calificación</p>
                <p className="text-base font-black text-slate-700 italic">
                  4.9 <span className="text-slate-400 font-bold text-xs ml-1">(24 opiniones)</span>
                </p>
              </div>
            </div>
            <div className="text-blue-600">
                <ChevronLeft size={20} className="rotate-180" />
            </div>
          </button>
        </div>

        {/* INFO DE CONFIANZA LIMPIA */}
        <div className="mt-8 space-y-4 mb-32 border-t border-slate-50 pt-6">
          <div className="flex items-center gap-4 text-slate-500 px-2">
            <div className="bg-blue-50 p-2.5 rounded-2xl">
              <ShieldCheck size={20} className="text-blue-500" />
            </div>
            <p className="text-xs font-bold text-slate-600 tracking-tight">
              Identidad verificada con Cédula
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-slate-500 px-2">
            <div className="bg-slate-50 p-2.5 rounded-2xl">
              <Car size={20} className="text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-600 tracking-tight">
              <span className="font-black text-slate-800">15 viajes</span> completados con éxito
            </p>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN FIJOS */}
      <div className="p-6 bg-white border-t border-slate-100 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0,05)]">
        <button className="flex-1 bg-slate-100 text-slate-700 p-5 rounded-[25px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
          <MessageCircle size={16} className="text-blue-600" />
          Chat App
        </button>
        <button className="flex-1 bg-green-500 text-white p-5 rounded-[25px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-green-200">
          <Phone size={16} />
          WhatsApp
        </button>
      </div>
    </div>
  );
};

export default PerfilPublico;

