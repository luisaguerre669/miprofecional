import React from 'react';
import './SkeletonLoader.css';

/**
 * Skeleton Loader - Placeholder animado para carga de contenido
 * Mejora la percepción de velocidad en la app
 */

export const SkeletonText = ({ lines = 1, width = '100%' }) => {
  return (
    <div className="skeleton-text-container">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: typeof width === 'number' ? `${width}%` : width }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-card-content">
        <SkeletonText lines={2} />
        <div className="skeleton skeleton-button" />
      </div>
    </div>
  );
};

export const SkeletonAvatar = ({ size = 'medium' }) => {
  const sizeClass = `skeleton-avatar-${size}`;
  return <div className={`skeleton skeleton-avatar ${sizeClass}`} />;
};

export const SkeletonList = ({ count = 3 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <SkeletonAvatar size="small" />
          <div className="skeleton-list-content">
            <SkeletonText lines={2} width={80} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonProfessionalCard = () => {
  return (
    <div className="skeleton-professional-card">
      <div className="skeleton-professional-header">
        <SkeletonAvatar size="large" />
        <div className="skeleton-professional-info">
          <SkeletonText lines={1} width={60} />
          <div className="skeleton skeleton-rating" />
        </div>
      </div>
      <SkeletonText lines={2} width={90} />
      <div className="skeleton-professional-footer">
        <div className="skeleton skeleton-badge" />
        <div className="skeleton skeleton-price" />
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 6, columns = 2 }) => {
  return (
    <div className="skeleton-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default {
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonList,
  SkeletonProfessionalCard,
  SkeletonGrid
};
