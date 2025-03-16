import React, { useState, useRef, useEffect } from 'react';
import './StickyNote.css';

const StickyNote = ({ 
  title, 
  children, 
  initialPosition = { x: 100, y: 100 }, 
  color = '#ffff88',
  onClose,
  initiallyHidden = false
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(initiallyHidden);
  const noteRef = useRef(null);
  const currentTitle = useRef(title);

  useEffect(() => {
    currentTitle.current = title;
  }, [title]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.sticky-note-header')) {
      setIsDragging(true);
      const rect = noteRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const noteWidth = noteRef.current.offsetWidth;
      const noteHeight = noteRef.current.offsetHeight;
      const maxX = window.innerWidth - noteWidth;
      const maxY = window.innerHeight - noteHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (noteRef.current) {
      const noteWidth = noteRef.current.offsetWidth;
      const noteHeight = noteRef.current.offsetHeight;
      const maxX = window.innerWidth - noteWidth;
      const maxY = window.innerHeight - noteHeight;
      
      setPosition({
        x: Math.max(0, Math.min(initialPosition.x, maxX)),
        y: Math.max(0, Math.min(initialPosition.y, maxY))
      });
    }
  }, [initialPosition]);

  if (isHidden) {
    return null;
  }

  return (
    <div 
      ref={noteRef}
      className="sticky-note"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        backgroundColor: color
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="sticky-note-header">
        <div className="sticky-note-title">{title}</div>
        <div className="sticky-note-controls">
          <button className="sticky-note-minimize" onClick={() => setIsHidden(true)}>_</button>
          <button className="sticky-note-close" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="sticky-note-content">
        {children}
      </div>
    </div>
  );
};

export default StickyNote; 