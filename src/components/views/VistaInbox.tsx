import React from 'react';
import { MessageCircle, ChevronRight, User, Search, Car, MapPin } from 'lucide-react';

// --- COMPONENTE: Tarjeta de Chat Unificada ---
const ChatCard = ({ chat, onClick }) => {
  const isUnread = chat.mensajesSinLeer > 0;
  const esChofer = chat.rol === 'chofer';

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-4 rounded-[25px] border transition-all active:scale-95 flex items-center gap-4 cursor-pointer
        ${isUnread ? 'border-blue-200 shadow-md bg-blue-50/20' : 'border-slate-100 shadow-sm'}`}
    >
      {/* Avatar con Indicador de No Leído */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
          {chat.fotoPerfil ? (
            <img src={chat.fotoPerfil} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-slate-400" />
          )}
        </div>
        {isUnread && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full animate-pulse" />
        )}
      </div>

      {/* Contenido Central */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm truncate pr-2 uppercase ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
            {chat.nombreContacto || 'Usuario'}
          </h4>
          <span className={`text-[9px] font-bold whitespace-nowrap mt-0.5 ${isUnread ? 'text-blue-600' : 'text-slate-400'}`}>
            {chat.ultimaHora || '00:00'}
          </span>
        </div>
        
        {/* Etiquetas Distintivas de Rol y Ruta */}
        <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
          {esChofer ? (
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
            <span className="text-[9px] font-bold uppercase truncate">{chat.ruta || 'Ruta pendiente'}</span>
          </div>
        </div>

        {/* Último Mensaje */}
        <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
          {chat.ultimoMensaje || 'Toca para abrir el chat...'}
        </p>
      </div>

      <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
    </div>
  );
};

// --- COMPONENTE PRINCIPAL INBOX ---
export const VistaInbox = ({ 
  chatsChofer = [], 
  chatsPasajero = [], 
  onAbrirChat 
}) => {
  // Aseguramos que no sean null y les inyectamos el rol para distinguirlos visualmente
  const safeChatsChofer = (chatsChofer || []).map(chat => ({ ...chat, rol: 'chofer' }));
  const safeChatsPasajero = (chatsPasajero || []).map(chat => ({ ...chat, rol: 'pasajero' }));

  // Unimos ambos arrays en una sola bandeja
  // Opcional: Si tus chats tienen un timestamp, puedes agregar .sort((a,b) => b.timestamp - a.timestamp) al final.
  const todosLosChats = [...safeChatsChofer, ...safeChatsPasajero];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* Header Fijo */}
      <div className="p-6 pt-10 bg-white">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tighter">Mensajes</h2>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[3px] mt-1">Bandeja de entrada unificada</p>
      </div>

      <div className="px-5 space-y-6 flex-1 overflow-y-auto pb-32 bg-white">
        
        {/* BARRA DE BÚSQUEDA */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar conversación o ruta..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-3.5 pl-10 pr-4 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        {/* LISTA DE CHATS */}
        <div className="space-y-3 pt-2">
          {todosLosChats.length === 0 ? (
            <div className='border border-slate-100 rounded-[30px] p-10 text-center bg-slate-50 mt-8'>
                <MessageCircle size={32} className="mx-auto text-slate-300 mb-3" />
                <p className='text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose'>No tienes mensajes activos</p>
            </div>
          ) : (
            todosLosChats.map((chat, index) => (
              <ChatCard 
                key={chat.id || index} 
                chat={chat} 
                onClick={() => onAbrirChat && onAbrirChat(chat)} 
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
};
