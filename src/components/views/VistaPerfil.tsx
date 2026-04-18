import React from 'react';
import { VistaPerfilCompleto } from './VistaPerfilCompleto';
import { Settings, User, LogOut, ShieldCheck } from 'lucide-react';

const VistaPerfil = ({ userData, pestañaActiva, setPestañaActiva, handleLogout }) => {
  
  // 1. BLINDAJE: Si no hay pestaña activa por defecto, forzamos 'publico'
  const pestañaReal = pestañaActiva || 'publico';

  // 2. LÓGICA MÓDULO 13: Barra de progreso segura
  const pasos = userData?.pasosCompletados || 0;
  const porcentaje = Math.round((pasos / 6) * 100);

  return (
    <div className="bg-slate-50 min-h-screen animate-in fade-in duration-500">
      
      {/* NAVEGACIÓN DE PESTAÑAS (Módulo 16) */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-[20px]">
          <button 
            onClick={() => setPestañaActiva('publico')}
            className={`flex-1 py-3 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              pestañaReal === 'publico' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'
            }`}
          >
            <User size={14} /> Mi Perfil
          </button>
          <button 
            onClick={() => setPestañaActiva('cuenta')}
            className={`flex-1 py-3 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              pestañaReal === 'cuenta' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'
            }`}
          >
            <Settings size={14} /> Cuenta
          </button>
        </div>
      </div>

      <div className="pb-24">
        {pestañaReal === 'publico' ? (
          /* CONTENIDO PÚBLICO */
          <div className="animate-in slide-in-from-left duration-300">
            {/* Barra de Seguridad (Módulo 13) */}
            <div className="px-4 pt-4">
               <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm mb-2">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Seguridad del Perfil
                  </h3>
                  <span className="text-xl font-black text-blue-600 italic">{porcentaje}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-3 flex items-center gap-1 uppercase">
                  <ShieldCheck size={12} className="text-blue-500" /> {pasos} de 6 pasos completados
                </p>
              </div>
            </div>

            {/* Inyectamos la vista completa. 
                Si se queda en blanco, es porque userData viene vacío de Firebase. */}
            {userData ? (
              <VistaPerfilCompleto userData={userData} isOwnProfile={true} />
            ) : (
              <div className="p-10 text-center text-slate-400 font-black italic uppercase text-xs animate-pulse">
                Cargando datos de Luis...
              </div>
            )}
          </div>
        ) : (
          /* VISTA CUENTA (Módulo 16) */
          <div className="p-4 space-y-4 animate-in slide-in-from-right duration-300">
            <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase italic">Información de Cuenta</h3>
              
              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Cédula</p>
                  <p className="text-sm font-bold text-slate-800">{userData?.cedula || 'No registrada'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Usuario</p>
                  <p className="text-sm font-bold text-slate-800">@{userData?.username || 'sin_usuario'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[25px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all border border-red-100"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { VistaPerfil };
