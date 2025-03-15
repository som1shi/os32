import React, { useState, useRef, useEffect } from 'react';
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
  
  const handleMouseDown = (e) => {
    if (isMaximized) return;
    
    if (e.target.closest('.window-header') && !e.target.closest('.window-controls')) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  const handleResizeMouseDown = (e, direction) => {
    if (isMaximized) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;
        
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;
        
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, size.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(300, size.width - deltaX);
          newX = position.x + deltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, size.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(200, size.height - deltaY);
          newY = position.y + deltaY;
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
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position, size, resizeDirection, isMaximized]);
  
  const handleMaximize = () => {
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
  };
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };
  
  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
  };
  
  const windowStyle = {
    left: isMaximized ? 0 : position.x,
    top: isMaximized ? 0 : position.y,
    width: isMaximized ? '100%' : size.width,
    height: isMaximized ? `calc(100% - 30px)` : size.height,
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
          <button className="window-button minimize" onClick={handleMinimize}>
            <span>_</span>
          </button>
          <button className="window-button maximize" onClick={handleMaximize}>
            <span>{isMaximized ? '❐' : '□'}</span>
          </button>
          <button className="window-button close" onClick={handleClose}>
            <span>✕</span>
          </button>
        </div>
      </div>
      
      <div className="window-content">
        {children}
      </div>
      
      {!isMaximized && (
        <>
          <div className="resize-handle n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')}></div>
          <div className="resize-handle e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')}></div>
          <div className="resize-handle s" onMouseDown={(e) => handleResizeMouseDown(e, 's')}></div>
          <div className="resize-handle w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')}></div>
          <div className="resize-handle ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}></div>
          <div className="resize-handle se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')}></div>
          <div className="resize-handle sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}></div>
          <div className="resize-handle nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}></div>
        </>
      )}
    </div>
  );
};

export default Window; 