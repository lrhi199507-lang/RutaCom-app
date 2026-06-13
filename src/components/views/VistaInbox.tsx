import React from 'react';
import { MessageCircle, ChevronRight, User, Search, Car, MapPin, ShieldCheck } from 'lucide-react';

const ChatCard = ({ chat, currentUserId, onClick }) => {
  const isUnread = chat.mensajesSinLeer > 0 && chat.remitenteUltimoMensaje !== currentUserId;
  const soyConductor = chat.uidConductor === currentUserId;
  const nombreContacto = soyConductor ? chat.nombrePasajero : chat.nombreConductor;
  const fotoContacto = soyConductor ? chat.fotoPasajero : chat.fotoConductor;

  // 🔥 FORMATEADOR DE HORA PROFESIONAL PARA EVITAR EL TEXTO LARGO
  let horaFormateada = chat.ultimaHora || '00:00';
  if (chat.timestamp && typeof chat.timestamp === 'number') {
    const fecha = new Date(chat.timestamp);
    // Si el chat es de hoy, muestra la hora. Si es de otro día, muestra la fecha.
    if (fecha.toDateString() === new Date().toDateString()) {
      horaFormateada = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      horaFormateada = fecha.toLocaleDateString([], { day: '2-digit', month: 'short' });
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-4 rounded-[25px] border transition-all active:scale-95 flex items-center gap-4 cursor-pointer
        ${isUnread ? 'border-blue-200 shadow-md bg-blue-50/20' : 'border-slate-100 shadow-sm'}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
          {fotoContacto ? (
            <img src={fotoContacto} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-slate-400" />
          )}
        </div>
        {isUnread && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full animate-pulse" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm truncate pr-2 uppercase ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
            {nombreContacto || 'Usuario Dame la cola'}
          </h4>
          <span className={`text-[9px] font-bold whitespace-nowrap mt-0.5 ${isUnread ? 'text-blue-600' : 'text-slate-400'}`}>
            {horaFormateada}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
          {soyConductor ? (
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
              <Car size={10} className="text-emerald-600" />
              <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider">Tú conduces</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
              <User size={10} className="text-blue-600" />
              <span className="text-[8px] font-black text-blue-700 uppercase tracking-wider">Eres pasajero</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-slate-400 truncate">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="text-[9px] font-bold uppercase truncate">{chat.ruta || 'Ruta'}</span>
          </div>
        </div>

        <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
          {chat.ultimoMensaje || 'Toca para abrir el chat...'}
        </p>
      </div>

      <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
    </div>
  );
};

export const VistaInbox = ({ 
  chatsChofer = [], 
  chatsPasajero = [], 
  userData, 
  onAbrirChat 
}) => {
  
  if (!userData?.id) return (
    <div className="h-screen flex flex-col items-center justify-center font-black text-blue-600 italic uppercase bg-white">
      <MessageCircle size={40} className='mb-2 animate-pulse'/>
      <p>Cargando Mensajes...</p>
    </div>
  );

  const safeChatsChofer = chatsChofer || [];
  const safeChatsPasajero = chatsPasajero || [];
  
  // 🔥 LÓGICA DE ORDENADO MATEMÁTICO: Del más reciente (arriba) al más antiguo (abajo)
  const todosLosChats = [...safeChatsChofer, ...safeChatsPasajero].sort((a, b) => {
    // Intentamos extraer el valor matemático (timestamp) de cada chat
    const tiempoA = a.timestamp || 0;
    const tiempoB = b.timestamp || 0;
    
    // Si ambos tienen timestamp, la resta los ordena perfectamente
    if (tiempoA && tiempoB) {
      return tiempoB - tiempoA;
    }
    
    // Fallback: Si por error de la base de datos alguno no tiene timestamp, lo mandamos al final
    return 0;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="p-6 pt-10 bg-white">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tighter">Mensajes</h2>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[3px] mt-1">Bandeja de entrada unificada</p>
      </div>

      <div className="px-5 space-y-6 flex-1 overflow-y-auto pb-32 bg-white">
        
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar conversación o ruta..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-3.5 pl-10 pr-4 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        <div className="space-y-3 pt-2">
          
          <div 
            onClick={() => onAbrirChat && onAbrirChat({
              id: `soporte_${userData.id}`,
              esSoporte: true, 
              usuarioSoporteId: userData.id,
              usuarioSoporteNombre: userData.nombre,
              nombreContacto: "Soporte Dame la cola",
              ultimoMensaje: "¿En qué podemos ayudarte hoy?",
              ruta: "Atención 24/7",
              mensajesSinLeer: 0
            })}
            className="bg-slate-900 p-4 rounded-[25px] border border-slate-800 shadow-lg transition-all active:scale-95 flex items-center gap-4 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-slate-700 shadow-sm flex items-center justify-center text-white">
                <MessageCircle size={24} fill="currentColor" className="text-blue-100" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="flex-1 min-w-0 z-10">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm truncate pr-2 font-black text-white uppercase italic tracking-wide">
                  Soporte Oficial
                </h4>
              </div>
              <div className="flex items-center gap-1 mb-1.5">
                <ShieldCheck size={12} className="text-blue-400" />
                <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">En línea</span>
              </div>
              <p className="text-xs truncate font-medium text-slate-400">
                ¿Tienes un problema con tu viaje?
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-600 flex-shrink-0 z-10" />
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Tus Conversaciones</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {todosLosChats.length === 0 ? (
            <div className='border border-slate-100 rounded-[30px] p-10 text-center bg-slate-50 mt-4'>
                <MessageCircle size={32} className="mx-auto text-slate-300 mb-3" />
                <p className='text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose'>No tienes mensajes activos</p>
            </div>
          ) : (
            todosLosChats.map((chat, index) => (
              <ChatCard 
                key={chat.id || index} 
                chat={chat} 
                currentUserId={userData.id} 
                onClick={() => onAbrirChat && onAbrirChat(chat)} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
