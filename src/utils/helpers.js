// src/utils/helpers.js

export const obtenerNivel = (viajes = 0) => {
    if (viajes >= 80) return { etiqueta: "Leyenda", clase: "bg-purple-100 text-purple-700" };
    if (viajes >= 30) return { etiqueta: "Diamante", clase: "bg-blue-100 text-blue-700" };
    if (viajes >= 10) return { etiqueta: "Oro", clase: "bg-amber-100 text-amber-700" };
    return { etiqueta: "Bronce", clase: "bg-slate-100 text-slate-600" };
};

export const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return "--h --m";
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60; 
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
};
// Añade esta a las que ya tenías
export const calcularEstatus = (viajesCompletados = 0, calificacion = 0) => {
  if (viajesCompletados >= 80 && calificacion >= 4.9) return "Diamante";
  if (viajesCompletados >= 30 && calificacion >= 4.7) return "Oro";
  if (viajesCompletados >= 10 && calificacion >= 4.5) return "Plata";
  return "Bronce";
};