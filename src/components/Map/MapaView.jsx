import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Locate, Target } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';

const MapaView = ({ 
  origen, 
  destino, 
  posicionChofer, 
  pasajeros = [], 
  estadoViaje, 
  interactivo = false,
  onMarkerDragEnd 
}) => {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markers = useRef({ chofer: null, pasajeros: [], origen: null, destino: null });
  const directionsRenderer = useRef(null);
  const [localizando, setLocalizando] = useState(false);
  const [seguimientoManual, setSeguimientoManual] = useState(true);

  // 1. INICIALIZAR MAPA
  useEffect(() => {
    if (!window.google || !mapRef.current || googleMap.current) return;

    const centroInicial = origen ? { lat: origen.lat, lng: origen.lon } : { lat: 10.1620, lng: -67.9567 };

    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: centroInicial,
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: false,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });

    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: googleMap.current,
      suppressMarkers: true, 
      polylineOptions: { strokeColor: "#000000", strokeWeight: 5 }
    });
   
    // Escucha cuando el usuario toma control del mapa con los dedos
    googleMap.current.addListener('dragstart', () => setSeguimientoManual(false));
    
    if (interactivo) {
      googleMap.current.addListener('idle', () => {
        const centro = googleMap.current.getCenter();
        if (onMarkerDragEnd) {
          onMarkerDragEnd({ lat: centro.lat(), lon: centro.lng() });
        }
      });
    }
  }, [interactivo]);

  // 2. FUNCIÓN DE CENTRADO MANUAL
  const obtenerUbicacionActual = async () => {
    setLocalizando(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const miPos = { lat: coordinates.coords.latitude, lng: coordinates.coords.longitude };
      if (googleMap.current) {
        googleMap.current.panTo(miPos); 
        googleMap.current.setZoom(18);
        setSeguimientoManual(true);
      }
    } catch (error) {
      console.error("Error GPS:", error);
      alert("Enciende tu GPS.");
    } finally {
      setLocalizando(false);
    }
  };

  // 3. MARCADORES DE ORIGEN Y DESTINO
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo) return;
    if (markers.current.origen) markers.current.origen.setMap(null);
    if (markers.current.destino) markers.current.destino.setMap(null);

    if (origen) {
      markers.current.origen = new window.google.maps.Marker({
        position: { lat: origen.lat, lng: origen.lon },
        map: googleMap.current,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563eb", fillOpacity: 1, strokeWeight: 3, strokeColor: "white" }
      });
    }

    if (destino) {
      markers.current.destino = new window.google.maps.Marker({
        position: { lat: destino.lat, lng: destino.lon },
        map: googleMap.current,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#22c55e", fillOpacity: 1, strokeWeight: 3, strokeColor: "white" }
      });
    }
  }, [origen, destino, interactivo]);

  // 4. ANIMACIÓN DEL CHOFER
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo || !posicionChofer) return;

    if (!markers.current.chofer) {
      markers.current.chofer = new window.google.maps.Marker({
        position: { lat: posicionChofer.lat, lng: posicionChofer.lon },
        map: googleMap.current,
        icon: { 
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, 
          scale: 6, fillColor: "#0f172a", fillOpacity: 1, strokeWeight: 2, strokeColor: "white",
          rotation: posicionChofer.heading || 0 
        }
      });
    } else {
      markers.current.chofer.setPosition({ lat: posicionChofer.lat, lng: posicionChofer.lon });
      if (posicionChofer.heading) {
        const icon = markers.current.chofer.getIcon();
        icon.rotation = posicionChofer.heading;
        markers.current.chofer.setIcon(icon);
      }
    }
    
    // Solo centrar si el usuario NO ha movido el mapa manualmente
    if (seguimientoManual) {
      googleMap.current.panTo({ lat: posicionChofer.lat, lng: posicionChofer.lon });
    }
  }, [posicionChofer, interactivo, seguimientoManual]);

  // 5. MARCADORES DE PASAJEROS
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo || !pasajeros.length) return;
    markers.current.pasajeros.forEach(marker => marker.setMap(null));
    markers.current.pasajeros = [];

    const colores = ["#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];
    pasajeros.forEach((pasajero, index) => {
      if (pasajero && pasajero.lat && pasajero.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: pasajero.lat, lng: pasajero.lng },
          map: googleMap.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: colores[index % colores.length],
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
          },
          label: { text: pasajero.nombre?.charAt(0).toUpperCase() || "P", color: "white", fontSize: "12px", fontWeight: "bold" }
        });
        markers.current.pasajeros.push(marker);
      }
    });
  }, [pasajeros, interactivo]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-inherit overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" style={{ borderRadius: 'inherit' }} />

      {/* BOTÓN FLOTANTE: Aparece solo si el chofer perdió el seguimiento */}
      {!seguimientoManual && !interactivo && (
        <button 
          onClick={() => setSeguimientoManual(true)}
          className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-2xl shadow-xl z-20 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Target size={16} /> <span className="text-[9px] font-black uppercase">Recentrar</span>
        </button>
      )}

      {interactivo && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="flex flex-col items-center mb-[35px]">
            <div className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md mb-1 uppercase tracking-tighter shadow-xl">Fijar punto aquí</div>
            <MapPin size={35} className={origen ? "text-blue-600" : "text-green-600"} fill="currentColor" stroke="white" strokeWidth={2} />
          </div>
        </div>
      )}

      {interactivo && (
        <button 
          onClick={obtenerUbicacionActual}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center bg-white text-blue-600 shadow-2xl active:scale-90"
        >
          <Locate size={22} />
        </button>
      )}
    </div>
  );
};

export default MapaView;
