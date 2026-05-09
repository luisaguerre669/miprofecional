import React, { useState, useEffect } from 'react';
import './Banner.css';

const ads = [
  { id: 1, text: "Construimos tus ideas con profesionales certificados", bg: "url('/pro_ad_1.png')" },
  { id: 2, text: "Especialistas de la salud a tu disposición", bg: "url('/pro_ad_2.png')" },
  { id: 3, text: "Expertos técnicos resolviendo tus problemas", bg: "url('/pro_ad_3.png')" },
  { id: 4, text: "Tu entrenamiento en las mejores manos", bg: "url('/pro_ad_4.png')" },
  { id: 5, text: "Descargá la app y acumulá puntos en cada servicio", bg: "linear-gradient(135deg, var(--color-warning), #FFC15E)" }
];

export default function Banner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Rotación exacta cada 5 segundos según requerimiento
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="banner-carousel">
      {ads.map((ad, index) => (
        <div 
          key={ad.id} 
          className={`banner-slide ${index === current ? 'active' : ''}`}
          style={{ background: ad.bg, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="banner-overlay"></div>
          <h3 className="text-3d" style={{ zIndex: 2, position: 'relative' }}>{ad.text}</h3>
        </div>
      ))}
      <div className="banner-dots">
        {ads.map((_, index) => (
          <span 
            key={index} 
            className={`dot ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}
