import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const MapaView = ({ origen, destino, posicionChofer, pasajeros = [], estadoViaje, interactivo = false }) => {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markers = useRef({ chofer: null, pasajeros: [] });
  const directionsRenderer = useRef(null);

  useEffect(() => {
    if (!window.google || !mapRef.current || googleMap.current) return;

    const centroInicial = origen ? { lat: origen.lat, lng: origen.lon } : { lat: 10.1620, lng: -67.9567 };

    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: centroInicial,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: !interactivo,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });

    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: googleMap.current,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#2563eb", strokeWeight: 5 }
    });
  }, [interactivo]);

  useEffect(() => {
    if (!googleMap.current || !window.google) return;

    // 1. GESTIÓN DEL CHOFER
    if (markers.current.chofer) markers.current.chofer.setMap(null);
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
      if (!interactivo) googleMap.current.panTo(markers.current.chofer.getPosition());
    }

    // 2. GESTIÓN DE PASAJEROS (Solo en estado 'buscando')
    markers.current.pasajeros.forEach(m => m.setMap(null));
    markers.current.pasajeros = [];

    if (estadoViaje === 'buscando' && pasajeros.length > 0) {
      pasajeros.forEach(p => {
        if (p.lat && p.lng && !p.abordado) {
          const pMarker = new window.google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map: googleMap.current,
            label: { text: p.nombre[0], color: "white", fontWeight: "bold" },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#f59e0b",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "white",
            }
          });
          markers.current.pasajeros.push(pMarker);
        }
      });
    }

    // 3. GESTIÓN DE RUTA (Solo en estado 'en_curso')
    if (estadoViaje === 'en_curso' && origen && destino) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: origen.lat, lng: origen.lon },
        destination: { lat: destino.lat, lng: destino.lon },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') directionsRenderer.current.setDirections(result);
      });
    } else {
      directionsRenderer.current.setDirections({ routes: [] });
    }

  }, [posicionChofer, pasajeros, estadoViaje, origen, destino]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-inherit">
      <div ref={mapRef} className="absolute inset-0" style={{ borderRadius: 'inherit' }} />
    </div>
  );
};

export default MapaView;
