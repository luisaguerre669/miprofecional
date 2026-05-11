import React from "react";

function CategoryBanners() {
  const categories = [
    "Construcción", "Hogar", "Educación", "Salud",
    "Mascotas", "Servicios", "Justicia", "Belleza"
  ];

  return (
    <div className="categories">
      {categories.map(cat => (
        <div key={cat} className="category-banner">{cat}</div>
      ))}
    </div>
  );
}

export default CategoryBanners;
