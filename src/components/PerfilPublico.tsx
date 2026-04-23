// COMPONENTE: VISTA DE PERFIL PÚBLICO (Se pega al final del archivo)
const PerfilPublico = ({ conductor, onClose }: any) => {
  if (!conductor) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* CABECERA AZUL */}
      <div className="bg-blue-600 h-32 w-full relative flex-shrink-0">
        <button 
          onClick={onClose}
          className="absolute top-10 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10"
        >
          <ChevronRight className="rotate-180" size={24} />
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto px-6 -mt-10 bg-white rounded-t-[40px] relative">
        <div className="flex flex-col items-center pt-2">
          <div className="w-24 h-24 bg-slate-200 rounded-[30px] border-4 border-white shadow-xl overflow-hidden mb-3">
            <img src={conductor.fotoPerfil || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            {conductor.nombre} <span className="text-blue-500">✅</span>
          </h2>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest italic">Conductor Verificado</p>
        </div>

        {/* BIO */}
        <div className="mt-8">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[2px] mb-2 italic ml-1">Sobre el conductor</p>
          <div className="bg-slate-50 p-5 rounded-[25px] border border-slate-100">
            <p className="text-slate-600 leading-snug font-medium italic text-sm">
              "{conductor.bio || "¡Hola! Estoy listo para el viaje."}"
            </p>
          </div>
        </div>

        {/* PERSONALIDAD */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-[22px] border flex items-center gap-3 ${conductor.hablador ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
            <span className="text-lg">{conductor.hablador ? '💬' : '🔇'}</span>
            <p className="text-[9px] font-black uppercase text-slate-700">{conductor.hablador ? 'Hablador' : 'Tranquilo'}</p>
          </div>
          <div className={`p-4 rounded-[22px] border flex items-center gap-3 ${conductor.musica ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
            <span className="text-lg">{conductor.musica ? '🎵' : '🔇'}</span>
            <p className="text-[9px] font-black uppercase text-slate-700">{conductor.musica ? 'Con Música' : 'Sin Música'}</p>
          </div>
        </div>

        {/* INFO EXTRA */}
        <div className="mt-8 space-y-3 pb-32 border-t border-slate-50 pt-5">
          <div className="flex items-center gap-3 text-slate-500">
            <ShieldCheck size={18} className="text-blue-500" />
            <p className="text-[11px] font-bold">Identidad verificada con Cédula</p>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Star size={18} className="text-amber-500" />
            <p className="text-[11px] font-bold">4.9 • 15 viajes completados</p>
          </div>
        </div>
      </div>

      {/* BOTONES FIJOS */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 flex gap-2">
        <button className="flex-1 bg-slate-100 text-slate-700 p-4 rounded-[20px] font-black uppercase text-[10px] flex items-center justify-center gap-2">
          <MessageCircle size={16} className="text-blue-600" /> Chat App
        </button>
        <button className="flex-1 bg-green-500 text-white p-4 rounded-[20px] font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg">
          <Phone size={16} /> WhatsApp
        </button>
      </div>
    </div>
  );
};
