import React from 'react';
import { 
  LogOut, ShieldCheck, CheckCircle2, Circle, 
  CreditCard, DollarSign, UserCog, HelpCircle, ChevronRight,
  Camera, Phone, Mail, FileText, Car, Pencil, User, Trophy, Flame
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400">CARGANDO PERFIL...</div>;

  const view = pestañaActiva || 'publico';

  const misiones = [
    { id: 'foto', label: 'FOTO DE PERFIL', status: 'PENDIENTE', icono: Camera },
    { id: 'tel', label: 'TELÉFONO VERIFICADO', status: 'PENDIENTE', icono: Phone },
    { id: 'mail', label: 'CORREO VERIFICADO', status: 'PENDIENTE', icono: Mail },
    { id: 'cedula', label: 'CÉDULA DE IDENTIDAD', status: 'COMPLETADO', icono: FileText },
    { id: 'auto', label: 'DATOS DEL VEHÍCULO', status: 'COMPLETADO', icono: Car },
    { id: 'bio', label: 'MINI-BIOGRAFÍA', status: 'COMPLETADO', icono: Pencil },
  ];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* NAVEGACIÓN SUPERIOR ESTILIZADA */}
      <div className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] max-w-md mx-auto shadow-inner">
          <button 
            onClick={() => setPestañaActiva('publico')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${
              view === 'publico' ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Mi Perfil
          </button>
          <button 
            onClick={() => setPestañaActiva('cuenta')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${
              view === 'cuenta' ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Cuenta
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {view === 'publico' ? (
          <div className="p-5 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* CARD DE IDENTIDAD PREMIUM */}
            <div className="bg-white p-8 rounded-[45px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0,05)] border border-slate-100 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy size={120} />
              </div>
              
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="w-full h-full rounded-[35px] bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-xl rotate-3 group-hover:rotate-6 transition-transform">
                  <div className="w-full h-full rounded-[30px] bg-white flex items-center justify-center overflow-hidden">
                    <User size={50} className="text-slate-200 mt-4" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-orange-500 p-2 rounded-2xl border-4 border-white shadow-lg animate-bounce">
                  <ShieldCheck size={16} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
                {userData.nombre || "Luis Hernández"}, <span className="text-blue-600">30</span>
              </h2>
              
              <div className="flex justify-center gap-2 mt-3">
                <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase border border-orange-200 flex items-center gap-1.5">
                  <Flame size={10} fill="currentColor" /> Novato
                </span>
                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase border border-blue-100">
                  Principiante
                </span>
              </div>

              <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent w-full my-6" />
              <p className="text-xs font-medium italic text-slate-500 leading-relaxed px-2">
                "{userData.bio || "Soy millonario"}"
              </p>
            </div>

            {/* BARRA DE CONFIANZA DINÁMICA (Efecto Naranja/Oro) */}
            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex justify-between items-center mb-5 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Nivel de Confianza</p>
                  </div>
                  <p className="text-xl font-black italic text-slate-800 uppercase leading-none">3 de 6 completados</p>
                </div>
                <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                  <p className="text-2xl font-black italic text-orange-500 leading-none">50%</p>
                </div>
              </div>
              
              <div className="w-full h-4 bg-slate-100 rounded-full p-1 border border-slate-50">
                <div className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)] w-1/2 relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-[slide_1s_linear_infinite]" />
                </div>
              </div>
            </div>

            {/* MISIONES CON ESTILO DE TARJETA */}
            <div className="bg-white p-3 rounded-[40px] shadow-sm border border-slate-100 space-y-2">
              {misiones.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-3xl transition-all cursor-pointer group">
                  <div className={`w-12 h-12 rounded-[22px] flex items-center justify-center transition-transform group-active:scale-90 ${
                    m.status === 'COMPLETADO' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-slate-100 text-slate-300'
                  }`}>
                    <m.icono size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black italic text-slate-800 uppercase leading-tight">{m.label}</p>
                    <p className={`text-[8px] font-bold uppercase mt-0.5 ${m.status === 'COMPLETADO' ? 'text-blue-500' : 'text-slate-300'}`}>
                      {m.status === 'COMPLETADO' ? 'Verificado' : 'Pendiente de carga'}
                    </p>
                  </div>
                  {m.status === 'COMPLETADO' ? (
                    <div className="w-6 h-6 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : (
                    <ChevronRight size={16} className="text-slate-200" />
                  )}
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="p-5 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             {/* SECCIÓN CUENTA (Mantiene el mismo estilo limpio de tus capturas) */}
             <div className="space-y-4">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[3px] ml-4">Gestión Financiera</p>
               <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden p-2">
                  <MenuButton icon={CreditCard} label="Métodos de Pago" color="blue" />
                  <MenuButton icon={DollarSign} label="Preferencias de Cobro" color="green" />
               </div>

               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-4 pt-4">Configuración</p>
               <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden p-2">
                  <MenuButton icon={UserCog} label="Editar Perfil" color="orange" />
                  <MenuButton icon={HelpCircle} label="Soporte Técnico" color="purple" />
               </div>
             </div>

             <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-6 bg-red-50 text-red-500 rounded-[35px] font-black uppercase text-xs border border-red-100 active:scale-95 transition-all shadow-sm"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente pequeño para los botones de menú
const MenuButton = ({ icon: Icon, label, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 rounded-[30px] transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon size={22}/>
        </div>
        <span className="text-sm font-black italic text-slate-700 uppercase">{label}</span>
      </div>
      <ChevronRight size={18} className="text-slate-200" />
    </button>
  );
};
