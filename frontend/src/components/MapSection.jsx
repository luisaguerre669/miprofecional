import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapSection() {
  const clientPos = [-34.591, -58.443];
  const professionalPos = [-34.592, -58.444];

  return (
    <MapContainer center={clientPos} zoom={15} style={{ height: "300px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={clientPos}><Popup>Cliente</Popup></Marker>
      <Marker position={professionalPos}><Popup>Profesional</Popup></Marker>
    </MapContainer>
  );
}

export default MapSection;
