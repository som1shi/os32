import React, { memo, useCallback, useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = memo(({ x, y, onClose, options }) => {
  const menuRef = useRef(null);
  const firstItemRef = useRef(null);

  const handleItemClick = useCallback((option) => {
    if (option.onClick) {
      option.onClick();
    }
    onClose();
  }, [onClose]);

  const handleKeyboardNavigation = useCallback((e) => {
    if (!menuRef.current) return;

    const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'));
    const currentIndex = items.indexOf(document.activeElement);

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          items[currentIndex + 1].focus();
        } else {
          items[0].focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          items[currentIndex - 1].focus();
        } else {
          items[items.length - 1].focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        items[0].focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1].focus();
        break;
      default:
        break;
    }
  }, [onClose]);

  useEffect(() => {
    if (firstItemRef.current) {
      firstItemRef.current.focus();
    }
    
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${viewportWidth - rect.width}px`;
      }
      
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${viewportHeight - rect.height}px`;
      }
    }
  }, []);

  return (
    <>
      <div 
        className="context-menu-overlay" 
        onClick={onClose}
        role="presentation"
      />
      <div 
        ref={menuRef}
        className="context-menu" 
        style={{ left: x, top: y }}
        role="menu"
        aria-label="Context menu"
        onKeyDown={handleKeyboardNavigation}
      >
        {options.map((option, index) => (
          <React.Fragment key={index}>
            {option.separator ? (
              <div 
                className="context-menu-separator" 
                role="separator"
                aria-hidden="true"
              />
            ) : (
              <div 
                className="context-menu-item"
                onClick={() => handleItemClick(option)}
                role="menuitem"
                tabIndex={0}
                ref={index === 0 ? firstItemRef : null}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(option);
                  }
                }}
                aria-label={option.label}
              >
                <span className="context-menu-icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="context-menu-text">
                  {option.label}
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu; 