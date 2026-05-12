import React, { useState } from 'react';
import { analytics } from '../services/analytics';
import './FeedbackWidget.css';

/**
 * FeedbackWidget - Sistema de feedback y reporte de bugs in-app
 * Permite a usuarios beta reportar problemas y sugerencias
 */

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        type: feedbackType,
        message: message.trim(),
        rating: feedbackType === 'bug' ? null : rating,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        platform: navigator.platform
      };
      
      // Enviar a analytics
      analytics.track('feedback_submitted', {
        feedback_type: feedbackType,
        has_rating: rating > 0,
        message_length: message.length
      });
      
      // Enviar a backend
      const apiUrl = import.meta.env.VITE_API_URL;
      await fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(feedbackData)
      });
      
      setSubmitted(true);
      
      // Reset después de 3 segundos
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setRating(0);
        setFeedbackType('suggestion');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      analytics.track('feedback_error', { error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        className="feedback-widget-button"
        onClick={() => setIsOpen(true)}
        aria-label="Enviar feedback"
      >
        💬
      </button>
    );
  }

  return (
    <div className="feedback-widget-overlay" onClick={() => setIsOpen(false)}>
      <div className="feedback-widget-modal" onClick={e => e.stopPropagation()}>
        <button 
          className="feedback-widget-close"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>

        {submitted ? (
          <div className="feedback-widget-success">
            <div className="feedback-success-icon">✓</div>
            <h3>¡Gracias por tu feedback!</h3>
            <p>Tu opinión nos ayuda a mejorar MiProfesional.</p>
          </div>
        ) : (
          <>
            <h3>¿Qué nos quieres contar?</h3>
            
            <div className="feedback-type-selector">
              <button
                type="button"
                className={`feedback-type-btn ${feedbackType === 'suggestion' ? 'active' : ''}`}
                onClick={() => setFeedbackType('suggestion')}
              >
                💡 Sugerencia
              </button>
              <button
                type="button"
                className={`feedback-type-btn ${feedbackType === 'bug' ? 'active' : ''}`}
                onClick={() => setFeedbackType('bug')}
              >
                🐛 Bug
              </button>
              <button
                type="button"
                className={`feedback-type-btn ${feedbackType === 'complaint' ? 'active' : ''}`}
                onClick={() => setFeedbackType('complaint')}
              >
                😞 Queja
              </button>
            </div>

            {feedbackType !== 'bug' && (
              <div className="feedback-rating">
                <p>¿Cómo calificas tu experiencia?</p>
                <div className="feedback-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`feedback-star ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <textarea
                className="feedback-textarea"
                placeholder={
                  feedbackType === 'bug' 
                    ? 'Describe el problema que encontraste...'
                    : feedbackType === 'suggestion'
                    ? 'Cuéntanos tu idea para mejorar...'
                    : 'Cuéntanos qué salió mal...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />

              <button
                type="submit"
                className="feedback-submit-btn"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar feedback'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackWidget;
