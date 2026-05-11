import React from "react";

function Urgencies() {
  const services = ["Cerrajería", "Ambulancia", "Remolque", "Enfermería"];
  return (
    <div className="urgencies">
      {services.map(s => (
        <div key={s} className="urgency-card">
          {s} <button>Llamar</button>
        </div>
      ))}
    </div>
  );
}

export default Urgencies;
