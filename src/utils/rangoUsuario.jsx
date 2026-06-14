import React from 'react';
import { User, Medal, Trophy, MapPin, Award } from 'lucide-react';

export const calcularRangoGlobal = (totalViajes) => {
  const viajes = Number(totalViajes) || 0;

  // Usa esta lógica oficial para TODA LA APP
  if (viajes < 10) {
    return { 
      titulo: 'NOVATO', 
      bgCard: 'bg-blue-600',      // Para el perfil privado
      bgBadge: 'bg-slate-100',    // Para el perfil público
      colorText: 'text-slate-500', 
      icon: <User size={14} />,
      meta: 10
    };
  }
  if (viajes < 20) {
    return { 
      titulo: 'PLATA', 
      bgCard: 'bg-slate-400', 
      bgBadge: 'bg-slate-100', 
      colorText: 'text-slate-600', 
      icon: <Award size={14} />,
      meta: 20
    };
  }
  if (viajes < 50) {
    return { 
      titulo: 'ORO', 
      bgCard: 'bg-yellow-500', 
      bgBadge: 'bg-amber-100', 
      colorText: 'text-amber-600', 
      icon: <Medal size={14} />,
      meta: 50
    };
  }
  
  return { 
    titulo: 'LEYENDA', 
    bgCard: 'bg-slate-900', 
    bgBadge: 'bg-purple-100', 
    colorText: 'text-purple-600', 
    icon: <Trophy size={14} />,
    meta: viajes // Ya no hay meta superior
  };
};
