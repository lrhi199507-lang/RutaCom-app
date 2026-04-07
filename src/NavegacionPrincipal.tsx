import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where, getDocs
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  CheckCircle, Navigation, Search, 
  Settings, Trash2, MessageCircle, CreditCard, Users, ChevronLeft, MapPin
} from "lucide-react";

const UBICACIONES = {
  "Amazonas": ["Puerto Ayacucho"], "Anzoátegui": ["Barcelona", "Puerto La Cruz"],
  "Apure": ["San Fernando"], "Aragua": ["Maracay", "Turmero", "La Victoria"],
  "Barinas": ["Barinas"], "Bolívar": ["Ciudad Guayana", "Ciudad Bolívar"],
  "Carabobo": ["Valencia", "Naguanagua", "Guacara", "San Diego"],
  "Cojedes": ["San Carlos", "Tinaquillo"], "Distrito Capital": ["Caracas"],
  "Falcón": ["Coro", "Punto Fijo"], "Lara": ["Barquisimeto", "Cabudare"],
  "Mérida": ["Mérida", "El Vigía"], "Miranda": ["Los Teques", "Chacao", "Baruta"],
  "Monagas": ["Maturín"], "Nueva Esparta": ["Porlamar"], "Portuguesa": ["Guanare"],
  "Táchira": ["San Cristóbal"], "Trujillo": ["Valera"], "Yaracuy": ["San Felipe"],
  "Zulia": ["Maracaibo", "San Francisco"]
};
const ESTADOS = Object.keys(UBICACIONES);

export default function NavegacionPrincipal({ user }: { user: any }) {
  const [vista, setVista] = useState("inicio");
  const [modo, setModo] = useState<"pasajero" | "chofer">("pasajero");
  const [userData, setUserData] = useState<any>(null);
  const [viajes, setViajes] = useState<any[]>([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<any[]>([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null);
  const [chatActivo, setChatActivo] = useState<any>(null); // Para el chat privado entre usuarios
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  
  const [solicitudEnviada, setSolicitudEnviada] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Formulario de publicación (4 SELECTORES)
  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
  
  // Filtros de búsqueda (4 SELECTORES)
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });
  const [chatSoporte, setChatSoporte] = useState<{texto: string, mio: boolean}[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setPerfilForm({
          marca: data.vehiculo?.marca || "", modelo: data.vehiculo?.modelo || "",
          placa: data.vehiculo?.placa || "", cedula: data.cedula || ""
        });
      }
    });

    const qViajes = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    const unsubViajes = onSnapshot(qViajes, (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Escuchar solicitudes si soy chofer
    const qSoli = query(collection(db, "Solicitudes"), where("idChofer", "==", user.uid), where("estado", "==", "pendiente"));
    const unsubSoli = onSnapshot(qSoli, (snap) => {
      setSolicitudesRecibidas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubViajes(); unsubSoli(); };
  }, [user]);

  // Chat Privado en Tiempo Real
  useEffect(() => {
    if (!chatActivo) return;
    const qM = query(collection(db, "Mensajes"), where("idChat", "==", chatActivo.id), orderBy("fecha", "asc"));
    const unsubMsg = onSnapshot(qM, (snap) => {
      setMensajesChat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubMsg();
  }, [chatActivo]);

  const enviarMensajePrivado = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    await addDoc(collection(db, "Mensajes"), {
      idChat: chatActivo.id,
      texto: nuevoMensaje,
      senderId: user.uid,
      fecha: serverTimestamp()
    });
    setNuevoMensaje("");
  };

  const publicarRuta = async () => {
    if (userData?.kycVerificado !== true) return alert("🚫 Debes completar tu verificación (KYC) primero.");
    if (!form.cO || !form.cD || !form.precio) return alert("Por favor, completa los 4 selectores de ubicación.");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form, precio: Number(form.precio), puestos: Number(form.puestos),
        conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp(), verificado: true
      });
      alert("🚀 ¡Viaje publicado exitosamente!");
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
    } catch (e) { alert("Error al conectar con la base de datos."); }
  };

  const enviarSolicitud = async () => {
    try {
      const docRef = await addDoc(collection(db, "Solicitudes"), {
        idViaje: viajeSeleccionado.id,
        idPasajero: user.uid,
        nombrePasajero: userData.nombre,
        idChofer: viajeSeleccionado.idCreador,
        estado: "pendiente",
        fechaSolicitud: serverTimestamp()
      });
      setSolicitudEnviada(docRef.id);
      alert("✅ Solicitud enviada al chofer.");
    } catch (e) { alert("Error al procesar la solicitud."); }
  };

  const abrirChatDesdeViaje = async (viaje: any) => {
    // Buscamos si ya existe un chat o creamos una referencia dinámica
    setChatActivo({ id: viaje.id + user.uid, titulo: viaje.conductor });
    setVista("chat_privado");
  };

  const viajesFiltrados = viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD));

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      {/* HEADER DINÁMICO */}
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6 shadow-lg shadow-blue-200">D</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Modo {modo}</p>
            <p className="text-sm font-black text-slate-800 italic">{userData?.nombre}</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2 font-black italic text-xs shadow-lg">
          <Wallet size={14} className="text-blue-400" /> ${userData?.saldo?.toFixed(2) || "0.00"}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {vista === "chat_privado" ? (
          <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-300">
             <button onClick={() => {setVista("inicio"); setChatActivo(null);}} className="mb-4 flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic">
               <ChevronLeft size={16}/> Volver
            </button>
            <div className="flex-1 bg-white rounded-[30px] border shadow-xl flex flex-col overflow-hidden">
              <div className="bg-slate-900 p-4 text-white font-black italic text-center text-[10px] uppercase tracking-widest">Chat con {chatActivo?.titulo}</div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                {mensajesChat.map((m) => (
                  <div key={m.id} className={`p-3 rounded-2xl max-w-[80%] text-xs font-bold ${m.senderId === user.uid ? 'bg-blue-600 text-white self-end ml-auto' : 'bg-white border text-slate-700'}`}>
                    {m.texto}
                  </div>
                ))}
              </div>
              <div className="p-3 bg-white border-t flex gap-2">
                <input value={nuevoMensaje} onChange={e=>setNuevoMensaje(e.target.value)} className="flex-1 bg-slate-100 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Escribe aquí..." />
                <button onClick={enviarMensajePrivado} className="bg-blue-600 w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg"><Send size={16}/></button>
              </div>
            </div>
          </div>
        ) : viajeSeleccionado ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic">
               <ChevronLeft size={16}/> Volver a la lista
            </button>
            <div className="bg-white rounded-[40px] border shadow-2xl overflow-hidden">
               <div className="bg-blue-600 p-8 text-white">
                  <div className="flex justify-between items-start mb-4">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-80 italic">Detalles de la Cola</p>
                     <p className="text-3xl font-black italic leading-none">${viajeSeleccionado.precio}</p>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3"><MapPin size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.cO} <span className="opacity-50 mx-2">→</span> {viajeSeleccionado.cD}</p></div>
                     <div className="flex items-center gap-3"><Users size={18} className="text-blue-200"/><p className="font-black uppercase text-sm italic">{viajeSeleccionado.puestos} Asientos Disponibles</p></div>
                  </div>
               </div>
               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-blue-500"><User size={24} className="text-blue-600"/></div>
                     <div><p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Chófer Verificado</p><p className="font-black text-slate-800 uppercase italic">{viajeSeleccionado.conductor}</p></div>
                  </div>
                  <div className="flex flex-col gap-3">
                     <button onClick={() => abrirChatDesdeViaje(viajeSeleccionado)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2 shadow-lg">
                        <MessageCircle size={18}/> Chat
                     </button>
                     {solicitudEnviada ? (
                        <button className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg">Cancelar Petición</button>
                     ) : (
                        <button onClick={enviarSolicitud} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-blue-200">Pedir Cola Ahora</button>
                     )}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          vista === "inicio" && (
            <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                CAMBIAR A MODO {modo === "pasajero" ? "CHÓFER" : "PASAJERO"}
              </button>

              {modo === "chofer" ? (
                <div className="space-y-6">
                  {/* FORMULARIO PUBLICAR (4 SELECTORES) */}
                  <div className="bg-white p-6 rounded-[35px] border shadow-xl space-y-3">
                    <h3 className="text-xs font-black uppercase text-blue-600 italic flex items-center gap-2"><Navigation size={16}/> Publicar Nueva Ruta</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={form.eO} onChange={(e)=>setForm({...form, eO: e.target.value, cO: ""})}><option value="">Edo. Origen</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!form.eO} value={form.cO} onChange={(e)=>setForm({...form, cO: e.target.value})}><option value="">Ciudad Origen</option>{form.eO && UBICACIONES[form.eO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" value={form.eD} onChange={(e)=>setForm({...form, eD: e.target.value, cD: ""})}><option value="">Edo. Destino</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[10px] font-bold outline-none" disabled={!form.eD} value={form.cD} onChange={(e)=>setForm({...form, cD: e.target.value})}><option value="">Ciudad Destino</option>{form.eD && UBICACIONES[form.eD].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Puestos" className="bg-slate-50 p-4 rounded-xl border text-xs font-bold outline-none" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} />
                      <input type="number" placeholder="Precio $" className="bg-slate-50 p-4 rounded-xl border text-xs font-black text-blue-600 outline-none" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                    </div>
                    <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg">Publicar Ahora</button>
                  </div>

                  {/* SOLICITUDES PARA EL CHOFER */}
                  {solicitudesRecibidas.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-blue-600 italic">🔔 Solicitudes Pendientes</p>
                      {solicitudesRecibidas.map(s => (
                        <div key={s.id} className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase italic">{s.nombrePasajero} quiere ir contigo</p>
                          <button onClick={() => setChatActivo({id: s.idViaje + s.idPasajero, titulo: s.nombrePasajero})} className="p-2 bg-blue-600 text-white rounded-lg"><MessageCircle size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* BUSCADOR (4 SELECTORES) */}
                  <div className="bg-white p-5 rounded-[30px] shadow-sm border space-y-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Search size={14}/> Buscar mi Cola</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fEO} onChange={(e)=>{setFEO(e.target.value); setFCO("");}}><option value="">DE: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fEO} value={fCO} onChange={(e)=>setFCO(e.target.value)}><option value="">DE: CIUDAD</option>{fEO && UBICACIONES[fEO].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" value={fED} onChange={(e)=>{setFED(e.target.value); setFCD("");}}><option value="">A: ESTADO</option>{ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}</select>
                      <select className="bg-slate-50 p-3 rounded-xl border text-[9px] font-black" disabled={!fED} value={fCD} onChange={(e)=>setFCD(e.target.value)}><option value="">A: CIUDAD</option>{fED && UBICACIONES[fED].map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                  </div>
                  {viajesFiltrados.map(v => (
                    <div key={v.id} className="bg-white p-5 rounded-[35px] border flex flex-col shadow-md space-y-3">
                      <div className="flex justify-between items-start">
                        <div><p className="text-[9px] font-black text-slate-400 uppercase italic mb-1">{v.conductor}</p><p className="font-black uppercase text-xs text-slate-800 italic">{v.cO} → {v.cD}</p></div>
                        <p className="text-xl font-black text-blue-600 italic">${v.precio}</p>
                      </div>
                      <button onClick={() => setViajeSeleccionado(v)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase italic text-[9px] tracking-widest">Ver Detalle</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => {setVista("inicio"); setViajeSeleccionado(null);}} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Viajes</span></button>
        <button onClick={() => setVista("soporte")} className={`flex flex-col items-center gap-1 ${vista === "soporte" ? "text-blue-600" : "text-slate-300"}`}><MessageCircle size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Soporte</span></button>
        <button onClick={() => setVista("perfil")} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Perfil</span></button>
      </nav>
    </div>
  );
}
