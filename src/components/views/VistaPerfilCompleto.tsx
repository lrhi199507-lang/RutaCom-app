import React, { useState } from 'react';
import { 
  User, ShieldCheck, FileText, Car, Camera, Zap, 
  Award, Edit, Settings, LogOut, ChevronRight, 
  CheckCircle2, XCircle, ArrowLeft, Wallet 
} from 'lucide-react';

export const VistaPerfilCompleto = ({ userData, isOwnProfile = false, onRegresar, handleLogout }) => {
  const [subVista, setSubVista] = useState('perfil');

  if (!userData) return (
    <div className="p-10 text-center font-black animate-pulse text-slate-400 uppercase italic">
      Cargando perfil...
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-full pb-28 animate-in fade-in duration-300">
      
      {/* BOTÓN REGRESAR (Solo aparece si estás viendo el perfil de otro) */}
      {!isOwnProfile && (
        <button 
          onClick={onRegresar} 
          className="p-4 flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al viaje
        </button>
      )}

      {/* SELECTOR DE SUB-VISTAS */}
      <div className="p-4 flex justify-center">
        <div className="bg-slate-100 border border-slate-200 p-1 rounded-full flex gap-1 w-full max-w-sm">
          <button 
            onClick={() => setSubVista('perfil')}
            className={`flex-1 px-6 py-2.5 rounded-full text-[11px] font-black uppercase italic transition-all ${
              subVista === 'perfil' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
            }`}
          >
            Mi Perfil
          </button>
          <button 
            onClick={() => setSubVista('cuenta')}
            className={`flex-1 px-6 py-2.5 rounded-full text-[11px] font-black uppercase italic transition-all ${
              subVista === 'cuenta' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'
            }`}
          >
            Cuenta
          </button>
        </div>
      </div>

      {subVista === 'perfil' ? (
        /* --- VISTA: MI PERFIL (LO QUE VI EN TUS FOTOS) --- */
        <div className="p-4 space-y-6">
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm text-center relative overflow-hidden">
            <div className="w-28 h-28 mx-auto bg-slate-100 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
              <User size={60} className="text-slate-300" />
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
                {userData.nombre || 'USUARIO'}, {userData.edad || '30'}
              </h1>
              <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase mt-2 inline-block">
                PRINCIPIANTE
              </span>
            </div>

            <p className="text-xs font-bold text-slate-600 italic mt-4 px-4">
              "{userData.bio || 'Soy millonario'}"
            </p>

            <div className="flex gap-2 justify-center pt-4 flex-wrap">
              <VerificacionBadge icon={FileText} label="Cédula" verified={userData.kycVerificado} />
              <VerificacionBadge icon={Car} label="Vehículo" verified={!!userData.vehiculo} />
              <VerificacionBadge icon={Camera} label="Foto Real" verified={userData.kycVerificado} />
            </div>
          </div>

          {/* NIVEL DE CONFIANZA */}
          <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck size={14} /> NIVEL DE CONFIANZA
                  </h3>
                  <p className="text-2xl font-black text-slate-800 uppercase italic tracking-tight mt-1">
                     3 DE 6 COMPLETADOS
                  </p>
               </div>
               <div className="text-2xl font-black text-blue-600 tracking-tighter">50%</div>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>
        </div>
      ) : (
        /* --- VISTA: CUENTA (FINANZAS Y AJUSTES) --- */
        <div className="p-4 space-y-6">
          
          {/* GESTIÓN FINANCIERA - BASADO EN TU FIREBASE */}
          <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
             <h3 className="text-[11px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2 px-1">
                <Wallet size={14} /> GESTIÓN FINANCIERA
             </h3>
             <div className="flex gap-3 mb-2">
                <div className="flex-1 bg-green-50 p-4 rounded-2xl border border-green-100">
                    <p className="text-[9px] font-black text-green-600 uppercase">Saldo</p>
                    <p className="text-xl font-black text-green-700">${userData.saldo || '0'}</p>
                </div>
                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Retenido</p>
                    <p className="text-xl font-black text-slate-600">${userData.saldoRetenido || '0'}</p>
                </div>
             </div>
             <CuentaNavItem icon={FileText} label="Métodos de Pago" />
          </div>

          <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
             <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 px-1">
                <Settings size={14} /> CONFIGURACIÓN
             </h3>
             <CuentaNavItem icon={Edit} label="Editar Información" />
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl font-black italic uppercase text-[10px] mt-4"
             >
                <LogOut size={16} /> Cerrar Sesión
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VerificacionBadge = ({ icon: Icon, label, verified }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase ${
    verified ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'
  }`}>
    <Icon size={10} />
    {label}
    {verified ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
  </div>
);

const CuentaNavItem = ({ icon: Icon, label }) => (
    <button className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
            <Icon size={16} />
        </div>
        <span className="flex-1 text-xs font-bold text-slate-800 text-left uppercase italic">{label}</span>
        <ChevronRight size={16} className="text-slate-400" />
    </button>
);
