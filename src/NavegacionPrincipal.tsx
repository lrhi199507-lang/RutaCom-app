import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Search,
  Wallet,
  User,
  LogOut,
  Car,
  X,
  Briefcase,
  Users,
  Send,
  ArrowLeft,
  Edit2,
  Headset,
  PlusCircle,
  Bell
} from "lucide-react";

const ESTADOS = [
  "Caracas",
  "Valencia",
  "Barquisimeto",
  "Maracay",
  "Puerto La Cruz",
  "Mérida",
];

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState("pasajero");
  const [editando, setEditando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDestinos, setMostrarDestinos] = useState(false);

  const [inputSoporte, setInputSoporte] = useState("");
  const [inputConductor, setInputConductor] = useState("");
  const [mensajesSoporte, setMensajesSoporte] = useState<any[]>([]);
  const [mensajesConductor, setMensajesConductor] = useState<any[]>([]);

  const [viajesReales, setViajesReales] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [viajeActivo, setViajeActivo] = useState<any>(null);
  const [userData, setUserData] = useState<any>({
    nombre: "",
    saldo: 0,
    telefono: "",
  });
  const [formPerfil, setFormPerfil] = useState({ nombre: "", telefono: "" });
  const [formViaje, setFormViaje] = useState({
    destino: "",
    precio: "",
    modeloAuto: "",
    puestos: "4",
    detalles: "",
  });
  const [estadoViaje, setEstadoViaje] = useState("buscando");

  // 1. Sincronización de datos de usuario
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (!editando)
          setFormPerfil({
            nombre: data.nombre || "",
            telefono: data.telefono || "",
          });
      }
    });
  }, [user, editando]);

  // 2. Escucha de viajes disponibles
  useEffect(() => {
    const q = query(collection(db, "Viajes"));
    return onSnapshot(q, (snap) => {
      setViajesReales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // 3. Sincronización del viaje activo (Para Chófer y Pasajero)
  useEffect(() => {
    if (!viajeActivo?.id) return;
    return onSnapshot(doc(db, "Viajes", viajeActivo.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEstadoViaje(data.estado || "buscando");
      }
    });
  }, [viajeActivo]);

  // 4. Detección automática para el Chófer (Banner de Notificación)
  useEffect(() => {
    if (modo !== "chofer" || !user) return;
    const q = query(collection(db, "Viajes"), where("idCreador", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const misViajes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const activo = misViajes.find(v => v.estado === 'buscando' || v.estado === 'confirmado');
      if (activo) setViajeActivo(activo);
    });
  }, [modo, user]);

  const publicarViaje = async () => {
    if (!formViaje.destino || !formViaje.precio || !formViaje.modeloAuto) {
      return alert("⚠️ Por favor completa todos los campos");
    }
    try {
      await addDoc(collection(db, "Viajes"), {
        conductor: userData.nombre || "Chófer Profesional",
        destino: formViaje.destino,
        precio: Number(formViaje.precio),
        vehiculo: formViaje.modeloAuto,
        puestos: Number(formViaje.puestos),
        detallesExtras: formViaje.detalles,
        idCreador: user.uid,
        fecha: serverTimestamp(),
        estado: 'buscando'
      });
      alert("✅ ¡Ruta publicada con éxito! Espera a que un pasajero se una.");
    } catch (e) {
      alert("❌ Error de conexión");
    }
  };

  const manejarReserva = async (viaje: any) => {
    if (userData.saldo < viaje.precio)
      return alert("⚠️ Saldo insuficiente");
    try {
      await updateDoc(doc(db, "usuarios", user.uid), {
        saldo: userData.saldo - viaje.precio,
      });
      setViajeActivo(viaje);
      setViajeSeleccionado(null);
      setVista("chat_conductor");
    } catch (e) {
      alert("Error al procesar la reserva");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      {!["chat_conductor", "chat_soporte"].includes(vista) && (
        <header className="p-6 pt-12 bg-white border-b shrink-0 z-20 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg italic">R</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">RutaCom {modo}</p>
                <p className="text-xs font-bold uppercase text-slate-800">{userData.nombre || "Usuario"}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700">
              <Wallet size={12} className="text-blue-400" />
              <span className="text-[11px] font-black">${Number(userData.saldo).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100 shadow-sm transition-all active:scale-95">
            Cambiar a Modo {modo === "pasajero" ? "Chófer" : "Pasajero"}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto">
        {vista === "inicio" && modo === "pasajero" && (
          <div className="p-6 space-y-4 pb-32">
            <button onClick={() => setMostrarDestinos(!mostrarDestinos)} className="w-full bg-white p-5 rounded-[25px] border flex items-center gap-4 shadow-sm">
              <Search className="text-blue-600" size={20} />
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase text-left">¿A dónde vas?</p>
                <p className="text-sm font-black uppercase text-slate-700">{busqueda || "Seleccionar Ciudad"}</p>
              </div>
            </button>
            {mostrarDestinos && (
              <div className="bg-white border rounded-3xl shadow-xl overflow-hidden mb-4 animate-in fade-in zoom-in duration-200">
                {ESTADOS.map((e) => (
                  <button key={e} onClick={() => { setBusqueda(e); setMostrarDestinos(false); }} className="w-full p-4 text-left font-bold border-b text-sm uppercase hover:bg-blue-50 text-slate-600">{e}</button>
                ))}
              </div>
            )}
            {viajesReales.filter((v) => (!busqueda || v.destino === busqueda) && v.estado !== 'finalizado').map((v) => (
              <div key={v.id} onClick={() => setViajeSeleccionado(v)} className="bg-white p-5 rounded-[30px] border flex justify-between items-center shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex gap-3 text-left">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100"><Car size={22} /></div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase italic">• {v.destino}</p>
                    <p className="font-black uppercase text-sm text-slate-800">{v.conductor}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{v.vehiculo}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-blue-600 italic">${v.precio}</p>
              </div>
            ))}
          </div>
        )}

        {vista === "inicio" && modo === "chofer" && (
          <div className="p-6 space-y-4 text-left pb-32">
            {/* BANNER DE NOTIFICACIÓN PARA EL CHÓFER */}
            {viajeActivo && viajeActivo.estado !== 'finalizado' && (
              <div className="bg-blue-600 p-5 rounded-[25px] text-white shadow-xl mb-4 flex justify-between items-center animate-pulse">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-blue-200" />
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-80">Pasajero en espera</p>
                    <p className="text-sm font-black uppercase italic">Ruta: {viajeActivo.destino}</p>
                  </div>
                </div>
                <button onClick={() => setVista("chat_conductor")} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-md active:scale-95">Ver Chat</button>
              </div>
            )}

            <h2 className="text-lg font-black uppercase italic flex items-center gap-2 text-slate-800">
              <PlusCircle size={20} className="text-green-600" /> Publicar Mi Ruta
            </h2>
            <div className="bg-white p-6 rounded-[35px] border space-y-4 shadow-sm">
              <input className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none" placeholder="Modelo del Auto" value={formViaje.modeloAuto} onChange={(e) => setFormViaje({ ...formViaje, modeloAuto: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none" value={formViaje.destino} onChange={(e) => setFormViaje({ ...formViaje, destino: e.target.value })}>
                  <option value="">Destino</option>
                  {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
                </select>
                <input type="number" className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm outline-none" placeholder="Precio $" value={formViaje.precio} onChange={(e) => setFormViaje({ ...formViaje, precio: e.target.value })} />
              </div>
              <textarea className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm h-24 outline-none resize-none" placeholder="Detalles extra (maletas, mascotas...)" value={formViaje.detalles} onChange={(e) => setFormViaje({ ...formViaje, detalles: e.target.value })} />
              <button onClick={publicarViaje} className="w-full py-4 bg-green-600 text-white rounded-[20px] font-black uppercase italic shadow-lg active:scale-95 transition-transform">Publicar Ahora</button>
            </div>
          </div>
        )}

        {vista === "perfil" && (
          <div className="p-6 space-y-6 text-center pb-32">
            <div className="w-24 h-24 bg-blue-600 rounded-[35px] mx-auto flex items-center justify-center text-white shadow-xl relative border-4 border-white">
              <User size={40} />
              <button onClick={() => setEditando(!editando)} className={`absolute -bottom-2 -right-2 p-2 rounded-xl text-white border-2 border-white shadow-md ${editando ? "bg-green-500" : "bg-slate-900"}`}><Edit2 size={14} /></button>
            </div>
            <div className="text-left space-y-4">
              <div className="bg-slate-900 p-6 rounded-[30px] shadow-xl border border-slate-800">
                <p className="text-blue-400 text-[10px] font-black uppercase italic">Billetera Digital</p>
                <p className="text-3xl font-black text-white italic">${Number(userData.saldo).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-[35px] border space-y-4 shadow-sm">
                <input disabled={!editando} className="w-full p-4 rounded-2xl font-bold uppercase text-sm border bg-slate-50 disabled:opacity-70" value={formPerfil.nombre} onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })} />
                <input disabled={!editando} className="w-full p-4 rounded-2xl font-bold text-sm border bg-slate-50 disabled:opacity-70" value={formPerfil.telefono} onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })} />
                {editando && <button onClick={async () => { await updateDoc(doc(db, "usuarios", user.uid), formPerfil); setEditando(false); alert("✅ Perfil actualizado"); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Guardar Cambios</button>}
              </div>
            </div>
            <button onClick={() => auth.signOut()} className="w-full py-4 bg-red-50 text-red-500 font-black uppercase rounded-2xl border border-red-100 flex items-center justify-center gap-2 italic text-xs active:bg-red-100"><LogOut size={16} /> Cerrar Sesión</button>
          </div>
        )}

        {(vista === "chat_conductor" || vista === "chat_soporte") && (
          <div className="absolute inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-right duration-300">
            <div className={`p-6 pt-12 border-b flex items-center gap-4 shrink-0 ${vista === "chat_soporte" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
              <button onClick={() => setVista("inicio")} className="p-2 bg-slate-100 rounded-full text-slate-900 active:scale-90"><ArrowLeft size={20} /></button>
              <div className="text-left">
                <p className="font-black uppercase text-sm italic">{vista === "chat_soporte" ? "Soporte RutaCom" : viajeActivo?.conductor}</p>
                <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">• En línea ahora</p>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50">
              {(vista === "chat_conductor" ? mensajesConductor : mensajesSoporte).map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[80%] text-left shadow-sm ${m.yo ? "bg-blue-600 text-white ml-auto rounded-tr-none" : "bg-white border rounded-tl-none"}`}>
                  <p className="text-xs font-bold italic">{m.texto}</p>
                </div>
              ))}
            </div>

            {/* PANEL DE CONTROL SINCRONIZADO CON FIREBASE */}
            {vista === "chat_conductor" && viajeActivo && (
                <div className="px-4 py-3 bg-white border-t flex flex-col gap-2">
                  {estadoViaje === 'buscando' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          await updateDoc(doc(db, "Viajes", viajeActivo.id), { estado: 'confirmado' });
                        }} 
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg active:scale-95 transition-transform">
                        Confirmar Viaje
                      </button>
                      <button onClick={() => { setVista('inicio'); setViajeActivo(null); }} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase italic text-[10px]">
                        Cancelar
                      </button>
                    </div>
                  )}
                  {estadoViaje === 'confirmado' && (
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, "Viajes", viajeActivo.id), { estado: 'finalizado' });
                        alert("¡Viaje Finalizado! Gracias por usar RutaCom.");
                        setVista('inicio');
                        setViajeActivo(null);
                      }} 
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg animate-bounce">
                      Ya llegué (Finalizar)
                    </button>
                  )}
                </div>
            )}

            <div className="p-4 border-t flex gap-2 bg-white pb-8">
              <input className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm outline-none font-bold" placeholder="Escribe un mensaje..." value={vista === "chat_conductor" ? inputConductor : inputSoporte} onChange={(e) => vista === "chat_conductor" ? setInputConductor(e.target.value) : setInputSoporte(e.target.value)} />
              <button onClick={() => {
                const text = vista === "chat_conductor" ? inputConductor : inputSoporte;
                if (!text) return;
                if (vista === "chat_conductor") { setMensajesConductor([...mensajesConductor, { texto: text, yo: true }]); setInputConductor(""); }
                else { setMensajesSoporte([...mensajesSoporte, { texto: text, yo: true }]); setInputSoporte(""); }
              }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90"><Send size={20} /></button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE RESERVA PARA PASAJERO */}
      {viajeSeleccionado && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white rounded-t-[50px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 text-left">
                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black italic shadow-lg">R</div>
                <div>
                  <p className="text-blue-600 font-black uppercase italic text-xs">• {viajeSeleccionado.destino}</p>
                  <p className="text-xl font-black uppercase text-slate-800">{viajeSeleccionado.conductor}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viajeSeleccionado.vehiculo}</p>
                </div>
              </div>
              <button onClick={() => setViajeSeleccionado(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Precio Fijo</p>
                <p className="text-xl font-black text-blue-600 italic">${viajeSeleccionado.precio}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[25px] border border-slate-100 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Puestos</p>
                <p className="text-xl font-black text-slate-800 italic">{viajeSeleccionado.puestos} Libres</p>
              </div>
            </div>
            <button onClick={() => manejarReserva(viajeSeleccionado)} className="w-full py-5 bg-blue-600 text-white rounded-[25px] font-black uppercase italic shadow-xl active:scale-95 transition-transform text-sm tracking-widest">Reservar Cupo Ahora</button>
          </div>
        </div>
      )}

      <nav className="p-6 bg-white border-t flex justify-around items-center shrink-0 z-20 pb-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button onClick={() => setVista("inicio")} className={`flex flex-col items-center gap-1 transition-colors ${vista === "inicio" ? "text-blue-600" : "text-slate-400"}`}>
          <Car size={24} /><span className="text-[9px] font-black uppercase tracking-tighter">Rutas</span>
        </button>
        <button onClick={() => setVista("chat_soporte")} className={`flex flex-col items-center gap-1 transition-colors ${vista === "chat_soporte" ? "text-blue-600
