import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

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

  // 1. INICIALIZAR MAPA
  useEffect(() => {
    if (!window.google || !mapRef.current || googleMap.current) return;

    const centroInicial = origen ? { lat: origen.lat, lng: origen.lon } : { lat: 10.1620, lng: -67.9567 };

    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: centroInicial,
      zoom: 17, // Un poco más de zoom para precisión al mover
      disableDefaultUI: true,
      zoomControl: false,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });

    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: googleMap.current,
      suppressMarkers: true, 
      polylineOptions: { strokeColor: "#000000", strokeWeight: 5 }
    });

    // 🔥 LOGICA DE PUNTERO FIJO: Escuchamos cuando el mapa deja de moverse
    if (interactivo) {
      googleMap.current.addListener('idle', () => {
        const centro = googleMap.current.getCenter();
        if (onMarkerDragEnd) {
          onMarkerDragEnd({ lat: centro.lat(), lon: centro.lng() });
        }
      });
    }
  }, [interactivo]);

  // 2. ACTUALIZACIÓN DE MARCADORES (MODO NORMAL)
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

      {/* 🔥 EL PUNTERO FIJO (Solo se ve en modo interactivo) */}
      {interactivo && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="flex flex-col items-center mb-[35px]"> {/* Ajuste para que la punta del pin sea el centro */}
            <div className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md mb-1 uppercase tracking-tighter shadow-xl">
              Soltar aquí
            </div>
            <MapPin size={35} className={origen ? "text-blue-600" : "text-green-600"} fill="currentColor" stroke="white" strokeWidth={2} />
            <div className="w-1 h-1 bg-black/20 rounded-full blur-[1px] mt-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaView;
