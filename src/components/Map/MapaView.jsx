import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const MapaView = ({ origen, destino, posicionChofer, interactivo = false, onMarkerDragEnd }) => {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markers = useRef({});
  const directionsRenderer = useRef(null);

  useEffect(() => {
    if (!window.google || !mapRef.current || googleMap.current) return;

    const centroInicial = origen ? { lat: origen.lat, lng: origen.lon } : { lat: 10.1620, lng: -67.9567 };

    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: centroInicial,
      zoom: 16,
      disableDefaultUI: true, 
      zoomControl: !interactivo,
      gestureHandling: 'greedy',
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });

    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: googleMap.current,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#2563eb", strokeWeight: 5 }
    });
  }, [interactivo]);

  // VIGÍA DE REDIMENSIONAMIENTO (Evita el mapa en blanco)
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver(() => {
      if (googleMap.current && window.google) {
        window.google.maps.event.trigger(googleMap.current, 'resize');
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  // ACTUALIZACIÓN DE MARCADORES Y RUTA
  useEffect(() => {
    if (!googleMap.current || !window.google) return;

    // 1. Limpiar marcador de chofer viejo si existe
    if (markers.current.chofer) markers.current.chofer.setMap(null);

    // 2. Dibujar Chofer (El Carrito)
    if (posicionChofer) {
      markers.current.chofer = new window.google.maps.Marker({
        position: { lat: posicionChofer.lat, lng: posicionChofer.lon },
        map: googleMap.current,
        zIndex: 100,
        icon: {
          path: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new window.google.maps.Point(12, 12)
        }
      });
      // Si el viaje está en curso, el mapa sigue al chofer
      if (!interactivo) googleMap.current.panTo(markers.current.chofer.getPosition());
    }

    // 3. Trazar Ruta
    if (origen && destino && !interactivo) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: origen.lat, lng: origen.lon },
        destination: { lat: destino.lat, lng: destino.lon },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') directionsRenderer.current.setDirections(result);
      });
    }
  }, [origen, destino, posicionChofer, interactivo]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-inherit">
      <div ref={mapRef} className="absolute inset-0" style={{ borderRadius: 'inherit' }} />
      {interactivo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
          <div className="bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full mb-1 shadow-lg tracking-widest">Fijar Punto</div>
          <MapPin size={36} className="text-blue-600 drop-shadow-md" fill="currentColor" />
        </div>
      )}
    </div>
  );
};

export default MapaView;
