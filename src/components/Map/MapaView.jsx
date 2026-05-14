import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation'; // 🔥 RECUERDA: Ten instalado @capacitor/geolocation

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

    // Escuchamos cuando el mapa se detiene para avisar la ubicación al Wizard
    if (interactivo) {
      googleMap.current.addListener('idle', () => {
        const centro = googleMap.current.getCenter();
        if (onMarkerDragEnd) {
          onMarkerDragEnd({ lat: centro.lat(), lon: centro.lng() });
        }
      });
    }
  }, [interactivo]);

  // 2. FUNCIÓN PARA DETECTAR UBICACIÓN ACTUAL GPS
  const obtenerUbicacionActual = async () => {
    setLocalizando(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });
      
      const miPos = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      if (googleMap.current) {
        googleMap.current.panTo(miPos); // Desliza el mapa suavemente
        googleMap.current.setZoom(18); // Zoom de precisión
      }
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      alert("Asegúrate de tener el GPS encendido y dar permisos a la app.");
    } finally {
      setLocalizando(false);
    }
  };

  // 3. ACTUALIZACIÓN DE MARCADORES (MODO NORMAL)
  useEffect(() => {
    if (!googleMap.current || !window.google || interactivo) return;

    if (markers.current.origen) markers.current.origen.setMap(null);
    if (markers.current.destino) markers.current.destino.setMap(null);

    if (origen) {
      markers.current.origen = new window.google.maps.Marker({
        position: { lat: origen.lat, lng: origen.lon },
        map: googleMap.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb", 
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "white",
        }
      });
    }

    if (destino) {
      markers.current.destino = new window.google.maps.Marker({
        position: { lat: destino.lat, lng: destino.lon },
        map: googleMap.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#22c55e", 
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "white",
        }
      });
    }

    if (origen && destino) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: origen.lat, lng: origen.lon },
        destination: { lat: destino.lat, lng: destino.lon },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') directionsRenderer.current.setDirections(result);
      });
    }
  }, [origen, destino, interactivo]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-inherit overflow-hidden">
      {/* EL MAPA */}
      <div ref={mapRef} className="absolute inset-0" style={{ borderRadius: 'inherit' }} />

      {/* PUNTERO FIJO CENTRAL */}
      {interactivo && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="flex flex-col items-center mb-[35px]">
            <div className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md mb-1 uppercase tracking-tighter shadow-xl">
              Fijar punto aquí
            </div>
            <MapPin size={35} className={origen ? "text-blue-600" : "text-green-600"} fill="currentColor" stroke="white" strokeWidth={2} />
            <div className="w-1.5 h-1.5 bg-black/30 rounded-full blur-[1px] mt-1" />
          </div>
        </div>
      )}

      {/* 🔥 BOTÓN FLOTANTE GPS (Solo en interactivo) 🔥 */}
      {interactivo && (
        <button 
          onClick={obtenerUbicacionActual}
          disabled={localizando}
          className={`absolute bottom-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 ${localizando ? 'bg-slate-100 text-slate-300' : 'bg-white text-blue-600'}`}
        >
          <Navigation size={22} className={localizando ? 'animate-pulse' : ''} fill={localizando ? 'none' : 'currentColor'} />
        </button>
      )}
    </div>
  );
};

export default MapaView;
