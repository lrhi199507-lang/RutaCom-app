import React, { useEffect, useRef } from 'react';

const MapaView = ({ origen, destino, interactivo = false, onMarkerDragEnd }) => {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markers = useRef([]);
  const directionsRenderer = useRef(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Inicializar el mapa
    const centroVzla = { lat: 10.1620, lng: -67.9567 }; // Valencia
    googleMap.current = new window.google.maps.Map(mapRef.current, {
      center: centroVzla,
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ]
    });

    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: googleMap.current,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#2563eb", // Azul pro
        strokeWeight: 5
      }
    });
  }, []);

  useEffect(() => {
    if (!googleMap.current || !window.google) return;

    // Limpiar marcadores previos
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // Marcador de Origen
    if (origen) {
      const markerO = new window.google.maps.Marker({
        position: { lat: origen.lat, lng: origen.lon },
        map: googleMap.current,
        draggable: interactivo,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        }
      });

      if (interactivo && onMarkerDragEnd) {
        markerO.addListener('dragend', () => {
          const pos = markerO.getPosition();
          onMarkerDragEnd({ lat: pos.lat(), lon: pos.lng() });
        });
      }
      markers.current.push(markerO);
      bounds.extend(markerO.getPosition());
    }

    // Marcador de Destino
    if (destino) {
      const markerD = new window.google.maps.Marker({
        position: { lat: destino.lat, lng: destino.lon },
        map: googleMap.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        }
      });
      markers.current.push(markerD);
      bounds.extend(markerD.getPosition());
    }

    // Trazar ruta si existen ambos
    if (origen && destino) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: origen.lat, lng: origen.lon },
        destination: { lat: destino.lat, lng: destino.lon },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
        }
      });
    } else if (origen || destino) {
      googleMap.current.fitBounds(bounds);
      if (!destino || !origen) googleMap.current.setZoom(15);
    }

  }, [origen, destino]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[200px] bg-slate-100" 
      style={{ borderRadius: 'inherit' }}
    />
  );
};

export default MapaView;
