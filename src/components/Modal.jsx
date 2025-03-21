import React, { useEffect, useRef, useCallback, memo } from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = 'auto', 
  height = 'auto',
  showCloseButton = true,
  className = ''
}) => {
  const modalRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  }, [onClose]);

  const handleEscKey = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleClickOutside, handleEscKey]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`modal-container ${className}`}
        style={{ width, height }}
      >
        <div className="modal-header">
          <div className="modal-title" id="modal-title">{title}</div>
          {showCloseButton && (
            <button 
              className="modal-close" 
              onClick={onClose}
              aria-label="Close modal"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default memo(Modal); 