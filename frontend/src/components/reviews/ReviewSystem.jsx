import React, { useState } from 'react';
import './ReviewSystem.css';

const ReviewSystem = ({ professionalId, professionalName }) => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: 'Carlos Rodríguez',
      rating: 5,
      comment: 'Excelente servicio, muy profesional y puntual. Lo recomiendo totalmente.',
      date: '2026-05-10',
      verified: true,
      avatar: 'CR'
    },
    {
      id: 2,
      author: 'Ana Martínez',
      rating: 4,
      comment: 'Muy buen trabajo, aunque se demoró un poco más de lo esperado.',
      date: '2026-05-08',
      verified: true,
      avatar: 'AM'
    },
    {
      id: 3,
      author: 'Pedro López',
      rating: 5,
      comment: 'Superó mis expectativas. Precio justo y calidad excelente.',
      date: '2026-05-05',
      verified: false,
      avatar: 'PL'
    }
  ]);

  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const review = {
      id: reviews.length + 1,
      author: 'Usuario Anónimo',
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0],
      verified: false,
      avatar: 'UA'
    };
    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comment: '' });
    setShowForm(false);
  };

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  return (
    <div className="review-system">
      <div className="review-summary">
        <div className="rating-big">
          <span className="rating-number">{averageRating.toFixed(1)}</span>
          <span className="rating-stars">{renderStars(Math.round(averageRating))}</span>
          <span className="rating-count">{reviews.length} reseñas</span>
        </div>

        <div className="trust-badge">
          <span className="badge-icon">🛡️</span>
          <span>Profesional Verificado</span>
        </div>

        <button className="write-review-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Escribir reseña'}
        </button>
      </div>

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <h4>Califica tu experiencia</h4>
          
          <div className="star-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={newReview.rating >= star ? 'active' : ''}
                onClick={() => setNewReview({ ...newReview, rating: star })}
              >
                ⭐
              </button>
            ))}
          </div>

          <textarea
            placeholder="Cuéntanos sobre tu experiencia..."
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            required
          />

          <button type="submit" className="submit-review">Publicar reseña</button>
        </form>
      )}

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="reviewer-avatar">{review.avatar}</div>
              
              <div className="reviewer-info">
                <span className="reviewer-name">{review.author}</span>
                <span className="review-date">{review.date}</span>
              </div>

              {review.verified && (
                <span className="verified-badge">✓ Verificado</span>
              )}
            </div>

            <div className="review-rating">{renderStars(review.rating)}</div>
            <p className="review-comment">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSystem;
