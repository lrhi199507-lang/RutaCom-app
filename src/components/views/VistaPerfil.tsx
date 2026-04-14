import React from 'react';

const VistaPerfil = ({ userData, pestañaActiva, setPestañaActiva, handleLogout, abrirModalFoto }) => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER DEL PERFIL */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl cursor-pointer overflow-hidden"
            onClick={abrirModalFoto}
          >
            {userData?.fotoPerfil ? (
              <img src={userData.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{userData?.nombre || 'Usuario'}</h2>
            <p className="text-slate-500 text-sm">@{userData?.username || 'sin_usuario'}</p>
          </div>
        </div>
      </div>

      {/* BOTONES DE NAVEGACIÓN INTERNA */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
        <button 
          onClick={() => setPestañaActiva('datos')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${pestañaActiva === 'datos' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          Mis Datos
        </button>
        <button 
          onClick={() => setPestañaActiva('stats')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${pestañaActiva === 'stats' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          Estadísticas
        </button>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="space-y-4">
        {pestañaActiva === 'datos' ? (
          <div className="bg-white p-4 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-500">Cédula: <span className="text-slate-800 font-medium">{userData?.cedula || 'No registrada'}</span></p>
            <p className="text-sm text-slate-500 mt-2">Vehículo: <span className="text-slate-800 font-medium">{userData?.vehiculo?.placa || 'No registrado'}</span></p>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
            <p className="text-2xl font-bold text-blue-600">{userData?.viajesRealizados || 0}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Viajes Completados</p>
          </div>
        )}

        {/* BOTÓN CERRAR SESIÓN */}
        <button
          onClick={handleLogout}
          className="w-full mt-8 flex items-center justify-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500/20 transition-colors"
        >
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export { VistaPerfil };