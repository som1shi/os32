import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Window.css';

const Window = ({ 
  title, 
  icon, 
  children, 
  isActive = true, 
  initialPosition = { x: 50, y: 50 }, 
  initialSize = { width: 800, height: 600 },
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  zIndex = 1
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [prevSize, setPrevSize] = useState(initialSize);
  const [prevPosition, setPrevPosition] = useState(initialPosition);
  
  const windowRef = useRef(null);
  const navigate = useNavigate();
  
  const handleMouseDown = useCallback((e) => {
    if (isMaximized) return;
    
    if (e.target.closest('.window-header') && !e.target.closest('.window-controls')) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.preventDefault();
    }
  }, [isMaximized]);
  
  const handleResizeMouseDown = useCallback((e, direction) => {
    if (isMaximized) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
    e.preventDefault();
  }, [isMaximized]);
  
  useEffect(() => {
    if (!isDragging && !isResizing) return;
    
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - size.height - 30));
        
        setPosition({
          x: newX,
          y: newY
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;
        
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;
        
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, Math.min(size.width + deltaX, window.innerWidth - position.x));
        }
        if (resizeDirection.includes('w')) {
          const maxDeltaX = size.width - 300;
          const boundedDeltaX = Math.max(-maxDeltaX, Math.min(deltaX, position.x));
          newWidth = Math.max(300, size.width - boundedDeltaX);
          newX = position.x + boundedDeltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, Math.min(size.height + deltaY, window.innerHeight - position.y - 30));
        }
        if (resizeDirection.includes('n')) {
          const maxDeltaY = size.height - 200;
          const boundedDeltaY = Math.max(-maxDeltaY, Math.min(deltaY, position.y));
          newHeight = Math.max(200, size.height - boundedDeltaY);
          newY = position.y + boundedDeltaY;
        }
        
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        setDragOffset({
          x: e.clientX,
          y: e.clientY
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position, size, resizeDirection]);
  
  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      setSize(prevSize);
      setPosition(prevPosition);
      if (onMaximize) onMaximize(false);
    } else {
      setPrevSize(size);
      setPrevPosition(position);
      
      setSize({ width: window.innerWidth, height: window.innerHeight - 30 });
      setPosition({ x: 0, y: 0 });
      if (onMaximize) onMaximize(true);
    }
  }, [isMaximized, onMaximize, prevPosition, prevSize, position, size]);
  
  const handleClose = useCallback((e) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  }, [navigate, onClose]);
  
  const handleMinimize = useCallback((e) => {
    e.stopPropagation();
    if (onMinimize) {
      onMinimize();
    }
  }, [onMinimize]);
  
  const windowStyle = {
    left: isMaximized ? 0 : position.x,
    top: isMaximized ? 0 : position.y,
    width: isMaximized ? '100%' : `${size.width}px`,
    height: isMaximized ? `calc(100% - 30px)` : `${size.height}px`,
    zIndex
  };
  
  return (
    <div 
      ref={windowRef}
      className={`window ${isActive ? 'active' : 'inactive'}`}
      style={windowStyle}
      onMouseDown={handleMouseDown}
    >
      <div className={`window-header ${isActive ? 'active' : 'inactive'}`}>
        <div className="window-title">
          <div className="window-icon">{icon}</div>
          <div className="window-title-text">{title}</div>
        </div>
        <div className="window-controls">
          <button className="window-button minimize" onClick={handleMinimize} type="button" aria-label="Minimize">
            <span>_</span>
          </button>
          <button className="window-button maximize" onClick={handleMaximize} type="button" aria-label="Maximize">
            <span>{isMaximized ? '❐' : '□'}</span>
          </button>
          <button className="window-button close" onClick={handleClose} type="button" aria-label="Close">
            <span>✕</span>
          </button>
        </div>
      </div>
      
      <div className="window-content">
        {children}
      </div>
      
      {!isMaximized && (
        <>
          <div 
            className="resize-handle n" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            aria-hidden="true"
          ></div>
          <div 
            className="resize-handle e" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            aria-hidden="true"
          ></div>
          <div 
            className="resize-handle s" 
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            aria-hidden="true"
          ></div>
          <div 
            className="resize-handle w" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            aria-hidden="true"
          ></div>
          <div 
            className="resize-handle ne" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            aria-hidden="true"
          ></div>
          <div 
            className="resize-handle se" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            aria-hidden="true"
          ></div>
          <div 
            className="resize-handle sw" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            aria-hidden="true"
          ></div>
          <div 
            className="resize-handle nw" 
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            aria-hidden="true"
          ></div>
        </>
      )}
    </div>
  );
};

export default memo(Window); 