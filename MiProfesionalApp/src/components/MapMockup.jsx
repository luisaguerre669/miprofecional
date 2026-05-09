import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import './MapMockup.css';

export default function MapMockup() {
  return (
    <div className="map-mockup-container">
      <div className="map-overlay">
        <div className="map-card">
          <div className="map-header">
            <div className="pulse-indicator"></div>
            <h4>Buscando cerca...</h4>
          </div>
          <div className="map-route">
            <div className="route-point">
              <MapPin className="point-icon user" />
              <span>Tú</span>
            </div>
            <div className="route-point">
              <Navigation className="point-icon pro" />
              <span>Plomero</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
