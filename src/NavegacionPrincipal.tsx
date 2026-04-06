import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import {
  doc, onSnapshot, collection, query, addDoc, 
  serverTimestamp, orderBy, updateDoc, deleteDoc, where
} from "firebase/firestore";
import {
  Wallet, User, LogOut, Car, X, Send, ShieldCheck, 
  Camera, CheckCircle, Navigation, Search, 
  Star, Settings, Trash2, MessageCircle, CreditCard, Users, Info, ChevronLeft, MapPin
} from "lucide-react";

const UBICACIONES: Record<string, string[]> = {
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
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any>(null); // Nuevo: Para ver el detalle
  const [configOpen, setConfigOpen] = useState(false);

  const [form, setForm] = useState({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
  const [fEO, setFEO] = useState(""); const [fCO, setFCO] = useState("");
  const [fED, setFED] = useState(""); const [fCD, setFCD] = useState("");

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ marca: "", modelo: "", placa: "", cedula: "" });

  const [mensajeSoporte, setMensajeSoporte] = useState("");
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
    const q = query(collection(db, "Viajes"), orderBy("fecha", "desc"));
    const unsubViajes = onSnapshot(q, (snap) => {
      setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUser(); unsubViajes(); };
  }, [user]);

  const publicarRuta = async () => {
    if (userData?.kycVerificado !== true) return alert("🚫 Debes estar verificado.");
    if (!form.cO || !form.cD || !form.precio) return alert("Llena los campos.");
    try {
      await addDoc(collection(db, "Viajes"), {
        ...form, precio: Number(form.precio), puestos: Number(form.puestos),
        conductor: userData.nombre, idCreador: user.uid, fecha: serverTimestamp(), verificado: true
      });
      alert("🚀 Viaje publicado!");
      setForm({ eO: "", cO: "", eD: "", cD: "", precio: "", puestos: "4", extras: "" });
    } catch (e) { alert("Error al publicar."); }
  };

  // NUEVA FUNCIÓN PARA PEDIR COLA
  const enviarSolicitud = async () => {
    if (!viajeSeleccionado) return;
    try {
      await addDoc(collection(db, "Solicitudes"), {
        idViaje: viajeSeleccionado.id,
        idPasajero: user.uid,
        nombrePasajero: userData.nombre,
        idChofer: viajeSeleccionado.idCreador,
        estado: "pendiente",
        fechaSolicitud: serverTimestamp()
      });
      alert("✅ Solicitud enviada al chófer. Espera su respuesta.");
      setViajeSeleccionado(null); // Volver a la lista
    } catch (e) { alert("Error al enviar solicitud."); }
  };

  const guardarDatosPerfil = async () => {
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { 
        vehiculo: { marca: perfilForm.marca, modelo: perfilForm.modelo, placa: perfilForm.placa.toUpperCase() },
        cedula: perfilForm.cedula
      });
      alert("✅ Perfil actualizado.");
      setEditandoPerfil(false);
    } catch (e) { alert("Error."); }
  };

  const enviarMensajeSoporte = () => {
    if (!mensajeSoporte.trim()) return;
    setChatSoporte([...chatSoporte, { texto: mensajeSoporte, mio: true }]);
    setMensajeSoporte("");
    setTimeout(() => setChatSoporte(p => [...p, { texto: "Recibido. Un asesor te contactará.", mio: false }]), 1000);
  };

  const viajesFiltrados = viajes.filter(v => (fCO === "" || v.cO === fCO) && (fCD === "" || v.cD === fCD));
  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic uppercase">Cargando...</div>;

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      <header className="p-6 pt-12 bg-white border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-xl transform -skew-x-6 shadow-lg shadow-blue-200">D</div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Modo {modo}</p><p className="text-sm font-black text-slate-800 italic">{userData.nombre}</p></div>
        </div>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl flex items-center gap-2 font-black italic text-xs shadow-lg">
          <Wallet size={14} className="text-blue-400" /> ${userData.saldo?.toFixed(2)}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32">
        {/* PANTALLA DETALLE DEL VIAJE (PASAJERO) */}
        {viajeSeleccionado ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <button onClick={() => setViajeSeleccionado(null)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] italic">
               <ChevronLeft size={16}/> Volver a la lista
            </button>

            <div className="bg-white rounded-[40px] border shadow-2xl overflow-hidden">
               <div className="bg-blue-600 p-8 text-white">
                  <div className="flex justify-between items-start mb-4">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-80 italic">Detalles del Viaje</p>
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
                     <div><p className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Conductor Verificado</p><p className="font-black text-slate-800 uppercase italic">{viajeSeleccionado.conductor}</p></div>
                  </div>

                  {viajeSeleccionado.extras && (
                    <div className="bg-slate-50 p-5 rounded-3xl border border-dashed border-slate-200">
                       <p className="text-[9px] font-black text-blue-600 uppercase mb-2 italic flex items-center gap-1"><Info size={12}/> Notas del Chófer:</p>
                       <p className="text-xs font-bold text-slate-600 italic">"{viajeSeleccionado.extras}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-4">
                     <button onClick={() => setViajeSeleccionado(null)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase italic text-xs active:scale-95 transition-all">Cancelar</button>
                     <button onClick={enviarSolicitud} className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all">Pedir Cola</button>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          /* VISTA NORMAL (INICIO) */
          vista === "inicio" && (
            <div className="space-y-6">
              <button onClick={() => setModo(modo === "pasajero" ? "chofer" : "pasajero")} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase border-2 border-blue-600 text-blue-600 bg-white shadow-sm active:scale-95 transition-all">
                MODO: {modo === "pasajero" ? "PASAJERO" : "CHÓFER"} (CAMBIAR)
              </button>

              {modo === "chofer" ? (
                <div className="space-y-6">
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
                      <input type="number" placeholder="Asientos" className="bg-slate-50 p-4 rounded-xl border text-xs font-bold outline-none" value={form.puestos} onChange={(e)=>setForm({...form, puestos: e.target.value})} />
                      <input type="number" placeholder="Precio $" className="bg-slate-50 p-4 rounded-xl border text-xs font-black text-blue-600 outline-none" value={form.precio} onChange={(e)=>setForm({...form, precio: e.target.value})} />
                    </div>
                    <input type="text" placeholder="Extras (Aire, Música, etc...)" className="w-full bg-slate-50 p-4 rounded-xl border text-xs font-bold outline-none" value={form.extras} onChange={(e)=>setForm({...form, extras: e.target.value})} />
                    <button onClick={publicarRuta} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all">Publicar Ahora</button>
                  </div>
                  {/* RUTAS DEL CHÓFER */}
                  {viajes.filter(v => v.idCreador === user.uid).map(v => (
                    <div key={v.id} className="bg-white p-4 rounded-3xl border flex justify-between items-center shadow-sm">
                      <div><p className="text-[10px] font-black uppercase text-slate-800 italic">{v.cO} → {v.cD}</p><p className="text-[10px] text-blue-600 font-bold italic">${v.precio} • {v.puestos} puestos</p></div>
                      <button onClick={async ()=>{ if(confirm("¿Eliminar?")) await deleteDoc(doc(db,"Viajes",v.id)) }} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              ) : (
                /* LISTA DE VIAJES PARA PASAJERO */
                <div className="space-y-4">
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
                        <div className="flex-1"><div className="flex items-center gap-1 mb-1">{v.verificado && <ShieldCheck size={12} className="text-blue-500" />}<p className="text-[9px] font-black text-slate-400 uppercase italic leading-none">{v.conductor}</p></div><p className="font-black uppercase text-xs text-slate-800 italic">{v.cO} → {v.cD}</p></div>
                        <p className="text-xl font-black text-blue-600 italic leading-none">${v.precio}</p>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase italic"><Users size={12} className="text-blue-600" /> {v.puestos} Asientos</div>
                        <button onClick={() => setViajeSeleccionado(v)} className="text-[9px] bg-slate-900 text-white px-6 py-2.5 rounded-full font-black uppercase italic shadow-lg active:scale-95 transition-all">Solicitar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* PERFIL Y SOPORTE (IGUAL QUE ANTES) */}
        {vista === "perfil" && (
           <div className="space-y-4">
              <div className="bg-white p-6 rounded-[35px] shadow-sm border flex flex-col items-center relative">
                 <button onClick={()=>setConfigOpen(!configOpen)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-blue-600 border border-blue-100"><Settings size={20}/></button>
                 <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl relative">
                   <User size={48} className="text-slate-400" />
                   {userData.kycVerificado && <div className="absolute bottom-1 right-1 bg-blue-600 p-1.5 rounded-full border-2 border-white"><CheckCircle size={14} className="text-white"/></div>}
                 </div>
                 <h2 className="font-black italic text-xl text-slate-800 uppercase tracking-tighter">{userData.nombre}</h2>
                 <div className="flex items-center gap-2 mt-2 bg-slate-50 px-4 py-1.5 rounded-full border">
                    <CreditCard size={14} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-600 uppercase italic tracking-tighter">CI: {userData.cedula || "NO REGISTRADA"}</p>
                 </div>
              </div>

              {modo === "chofer" && (
                <div className="bg-white p-6 rounded-[35px] shadow-sm border space-y-4">
                   <h3 className="text-xs font-black uppercase italic text-slate-800 flex items-center gap-2"><Car size={16} className="text-blue-600"/> Vehículo</h3>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border"><p className="text-[8px] font-black text-slate-400 uppercase mb-1 italic">Marca/Modelo</p><p className="text-xs font-black uppercase italic text-slate-800">{userData.vehiculo?.marca || "-"} {userData.vehiculo?.modelo || ""}</p></div>
                      <div className="bg-slate-50 p-4 rounded-2xl border"><p className="text-[8px] font-black text-slate-400 uppercase mb-1 italic">Placa</p><p className="text-xs font-black uppercase italic text-blue-600">{userData.vehiculo?.placa || "---"}</p></div>
                   </div>
                </div>
              )}

              {configOpen && (
                <div className="bg-white p-6 rounded-[35px] border-2 border-blue-600 space-y-4 shadow-2xl">
                   <div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase italic text-blue-600">Ajustes</h3><button onClick={()=>setConfigOpen(false)}><X size={18}/></button></div>
                   <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                      <button onClick={()=>setEditandoPerfil(!editandoPerfil)} className="w-full text-[9px] bg-white border py-2.5 rounded-full font-black uppercase italic shadow-sm">{editandoPerfil ? "Cancelar" : "Editar Datos"}</button>
                      {editandoPerfil && (
                        <div className="space-y-3 mt-4">
                          <input type="text" placeholder="Cédula" value={perfilForm.cedula} onChange={e=>setPerfilForm({...perfilForm, cedula: e.target.value})} className="w-full p-4 bg-white rounded-xl border text-[10px] font-bold outline-none" />
                          <input type="text" placeholder="Marca" value={perfilForm.marca} onChange={e=>setPerfilForm({...perfilForm, marca: e.target.value})} className="w-full p-4 bg-white rounded-xl border text-[10px] font-bold outline-none" />
                          <input type="text" placeholder="Modelo" value={perfilForm.modelo} onChange={e=>setPerfilForm({...perfilForm, modelo: e.target.value})} className="w-full p-4 bg-white rounded-xl border text-[10px] font-bold outline-none" />
                          <input type="text" placeholder="Placa" value={perfilForm.placa} onChange={e=>setPerfilForm({...perfilForm, placa: e.target.value})} className="w-full p-4 bg-white rounded-xl border text-[10px] font-bold uppercase outline-none" />
                          <button onClick={guardarDatosPerfil} className="w-full p-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-lg">Guardar Cambios</button>
                        </div>
                      )}
                   </div>
                </div>
              )}
              <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 italic tracking-widest"><LogOut size={16} /> Cerrar Sesión</button>
           </div>
        )}

        {vista === "soporte" && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[40px] border shadow-lg overflow-hidden">
             <div className="bg-blue-600 p-4 text-white text-center font-black italic text-xs uppercase flex items-center justify-center gap-2 tracking-widest"><MessageCircle size={16} /> Soporte Técnico</div>
             <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
                {chatSoporte.map((m, i) => (
                  <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-[11px] font-bold shadow-sm ${m.mio ? 'bg-blue-600 text-white self-end' : 'bg-white border text-slate-700 self-start'}`}>{m.texto}</div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-2"><input type="text" value={mensajeSoporte} onChange={(e)=>setMensajeSoporte(e.target.value)} className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-bold outline-none border" placeholder="Describe tu problema..." /><button onClick={enviarMensajeSoporte} className="bg-blue-600 w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lg active:scale-95"><Send size={18}/></button></div>
          </div>
        )}
      </main>

      <nav className="p-6 bg-white border-t flex justify-around items-center pb-10 fixed bottom-0 w-full max-w-md shadow-2xl z-50">
        <button onClick={() => {setVista("inicio"); setViajeSeleccionado(null);}} className={`flex flex-col items-center gap-1 ${vista === "inicio" ? "text-blue-600" : "text-slate-300"}`}><Car size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Viajes</span></button>
        <button onClick={() => {setVista("soporte"); setViajeSeleccionado(null);}} className={`flex flex-col items-center gap-1 ${vista === "soporte" ? "text-blue-600" : "text-slate-300"}`}><MessageCircle size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Soporte</span></button>
        <button onClick={() => {setVista("perfil"); setViajeSeleccionado(null);}} className={`flex flex-col items-center gap-1 ${vista === "perfil" ? "text-blue-600" : "text-slate-300"}`}><User size={26} /><span className="text-[9px] font-black uppercase italic tracking-tighter">Perfil</span></button>
      </nav>
    </div>
  );
}
