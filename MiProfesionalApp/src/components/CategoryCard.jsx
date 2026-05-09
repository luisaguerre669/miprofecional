import React from 'react';
import * as Icons from 'lucide-react';
import './CategoryCard.css';

export default function CategoryCard({ title, items, iconName, bgImage }) {
  const Icon = Icons[iconName] || Icons.HelpCircle;

  return (
    <div className="category-banner" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="category-overlay"></div>
      <div className="category-content">
        <div className="card-header">
          <div className="icon-wrapper">
            <Icon size={28} />
          </div>
          <h3 className="text-3d">{title}</h3>
        </div>
        <ul className="category-list">
          {items.slice(0, 3).map((item, idx) => (
            <li key={idx}>
              <Icons.ChevronRight size={16} /> {item}
            </li>
          ))}
          {items.length > 3 && <li><Icons.Plus size={16} /> y más...</li>}
        </ul>
        <button className="card-btn">Ver profesionales</button>
      </div>
    </div>
  );
}
