import React from 'react';
import { 
  LogOut, ShieldCheck, CheckCircle2, Circle, 
  CreditCard, DollarSign, UserCog, HelpCircle, ChevronRight,
  Camera, Phone, Mail, FileText, Car, Pencil
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  if (!userData) return <div className="p-20 text-center font-black italic text-slate-400">CARGANDO PERFIL...</div>;

  const view = pestañaActiva || 'publico';

  // Configuración de Misiones de Confianza
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
      
      {/* 1. SELECTOR DE PESTAÑAS (Único encabezado de control) */}
      <div className="p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md mx-auto">
          <button 
            onClick={() => setPestañaActiva('publico')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
              view === 'publico' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'
            }`}
          >
            Mi Perfil
          </button>
          <button 
            onClick={() => setPestañaActiva('cuenta')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
              view === 'cuenta' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'
            }`}
          >
            Cuenta
          </button>
        </div>
      </div>

      {/* 2. CONTENIDO SCROLLABLE */}
      <div className="flex-1 overflow-y-auto pb-24">
        {view === 'publico' ? (
          <div className="p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* CARD PRINCIPAL DE IDENTIDAD */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center relative overflow-hidden">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-200">
                  <User size={48} />
                </div>
                <div className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-sm border border-slate-50">
                  <div className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[7px] font-black border border-blue-100 uppercase">
                    Novato
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-black italic text-slate-800 uppercase tracking-tight">
                {userData.nombre || "Luis Hernández"}, 30
              </h2>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-[2px] mt-1 bg-blue-50 inline-block px-4 py-1 rounded-full">
                Principiante
              </p>

              <div className="h-[1px] bg-slate-50 w-full my-6" />
              <p className="text-[11px] font-medium italic text-slate-400">"Soy millonario"</p>

              {/* BADGES DE VERIFICACIÓN RÁPIDA */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-xl border border-green-100">
                  <FileText size={12} />
                  <span className="text-[8px] font-black uppercase">Cédula</span>
                  <CheckCircle2 size={10} />
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-xl border border-green-100">
                  <Car size={12} />
                  <span className="text-[8px] font-black uppercase">Vehículo</span>
                  <CheckCircle2 size={10} />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Camera size={12} />
                  <span className="text-[8px] font-black uppercase text-slate-400">Foto Real</span>
                  <span className="text-[8px]">✕</span>
                </div>
              </div>
            </div>

            {/* NIVEL DE CONFIANZA */}
            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={14} className="text-blue-600" />
                    <p className="text-[9px] font-black text-blue-900 uppercase">Nivel de Confianza</p>
                  </div>
                  <p className="text-lg font-black italic text-slate-800 uppercase">3 de 6 completados</p>
                </div>
                <p className="text-3xl font-black italic text-blue-600 leading-none">50%</p>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-1/2" />
              </div>
            </div>

            {/* LISTA DE MISIONES */}
            <div className="bg-white p-2 rounded-[35px] shadow-sm border border-slate-100 overflow-hidden">
              {misiones.map((mision, index) => (
                <div key={mision.id} className={`flex items-center gap-4 p-4 ${index !== misiones.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${mision.status === 'COMPLETADO' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                    <mision.icono size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black italic text-slate-800 uppercase leading-none">{mision.label}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase flex items-center gap-1.5 ${
                    mision.status === 'COMPLETADO' 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {mision.status}
                    {mision.status === 'COMPLETADO' ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* GESTIÓN FINANCIERA */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[2px] ml-4">Gestión Financiera</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><CreditCard size={20}/></div>
                    <span className="text-xs font-black italic text-slate-700 uppercase">Métodos de Pago</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><DollarSign size={20}/></div>
                    <span className="text-xs font-black italic text-slate-700 uppercase">Preferencias de Cobro</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              </div>
            </div>

            {/* CONFIGURACIÓN */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-4">Configuración de Cuenta</p>
              <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><UserCog size={20}/></div>
                    <span className="text-xs font-black italic text-slate-700 uppercase">Editar Información</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center"><HelpCircle size={20}/></div>
                    <span className="text-xs font-black italic text-slate-700 uppercase">Centro de Ayuda</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              </div>
            </div>

            {/* CERRAR SESIÓN */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[28px] font-black uppercase text-[10px] border border-red-100 active:scale-95 transition-all shadow-sm shadow-red-100"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>

          </div>
        )}
      </div>
    </div>
  );
};
