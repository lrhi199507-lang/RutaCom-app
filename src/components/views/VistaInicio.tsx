import React from 'react';
import { CardViajeOptimizada } from './CardViajeOptimizada';

export const VistaInicio = ({ viajes, setViajeSeleccionado, setVista }) => {
  return (
    <div className="space-y-4 pb-24">
      {viajes.length > 0 ? (
        viajes.map((viaje) => (
          <CardViajeOptimizada
            key={viaje.id}
            viaje={viaje}
            onClickDetalle={() => {
              setViajeSeleccionado(viaje);
              setVista("detalle");
            }}
            onClickPedir={() => {
              setViajeSeleccionado(viaje);
              setVista("detalle");
            }}
          />
        ))
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold italic uppercase text-xs">No hay viajes disponibles hoy</p>
        </div>
      )}
    </div>
  );
};

