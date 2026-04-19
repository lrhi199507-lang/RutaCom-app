import React from 'react';
import { 
  LogOut, ShieldCheck, CheckCircle2, Circle, 
  CreditCard, DollarSign, UserCog, HelpCircle, ChevronRight,
  Camera, Phone, Mail, FileText, Car, Pencil, User
} from 'lucide-react';

export const VistaPerfil = ({ userData, handleLogout, pestañaActiva, setPestañaActiva }) => {
  // Verificación de seguridad
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
      {/* SELECTOR DE PESTAÑAS */}
      <div className="p-4 bg-white border-b border-slate-100">
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

      <div className="flex-1 overflow-y-auto pb-24">
        {view === 'publico' ? (
          <div className="p-5 space-y-4">
            {/* TARJETA DE IDENTIDAD */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-200">
                  <User size={40} />
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full border-2 border-white shadow-sm">
                  <ShieldCheck size={12} className="text-white" />
                </div>
              </div>
              <h2 className="text-xl font-black italic text-slate-800 uppercase tracking-tight">
                {userData.nombre || "Usuario"}, {userData.edad || "30"}
              </h2>
              <div className="mt-2 bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[8px] font-black border border-blue-100 uppercase inline-block italic">
                Principiante
              </div>
              <div className="h-[1px] bg-slate-50 w-full my-6" />
              <p className="text-[11px] font-medium italic text-slate-400 px-4">
                "{userData.bio || "Soy millonario"}"
              </p>
            </div>

            {/* NIVEL DE CONFIANZA */}
            <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-3">
                <p className="text-[9px] font-black text-blue-900 uppercase">Nivel de Confianza</p>
                <p className="text-2xl font-black italic text-blue-600 leading-none">50%</p>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-1/2" />
              </div>
            </div>

            {/* MISIONES */}
            <div className="bg-white p-2 rounded-[35px] shadow-sm border border-slate-100 overflow-hidden">
              {misiones.map((m, i) => (
                <div key={m.id} className={`flex items-center gap-4 p-4 ${i !== misiones.length -1 ? 'border-b border-slate-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.status === 'COMPLETADO' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                    <m.icono size={18} />
                  </div>
                  <span className="flex-1 text-[9px] font-black italic text-slate-800 uppercase">{m.label}</span>
                  <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${m.status === 'COMPLETADO' ? 'text-blue-600' : 'text-slate-300'}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* OPCIONES DE CUENTA */}
            <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden p-2">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><CreditCard size={20}/></div>
                    <span className="text-xs font-black italic text-slate-700 uppercase leading-none">Pagos</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><DollarSign size={20}/></div>
                    <span className="text-xs font-black italic text-slate-700 uppercase leading-none">Cobros</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-500 rounded-[28px] font-black uppercase text-[10px] border border-red-100 active:scale-95 transition-all shadow-sm"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
