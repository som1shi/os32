import React, { memo, useCallback } from 'react';
import './ContextMenu.css';

const ContextMenu = memo(({ x, y, onClose, options }) => {
  const handleItemClick = useCallback((option) => {
    option.onClick();
    onClose();
  }, [onClose]);

  return (
    <>
      <div 
        className="context-menu-overlay" 
        onClick={onClose}
        role="presentation"
      />
      <div 
        className="context-menu" 
        style={{ left: x, top: y }}
        role="menu"
        aria-label="Context menu"
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(option);
                  }
                }}
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