import React from 'react';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, options }) => {
  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div 
        className="context-menu" 
        style={{ 
          left: x, 
          top: y 
        }}
      >
        {options.map((option, index) => (
          <React.Fragment key={index}>
            {option.separator ? (
              <div className="context-menu-separator" />
            ) : (
              <div 
                className="context-menu-item"
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
              >
                <span className="context-menu-icon">{option.icon}</span>
                <span className="context-menu-text">{option.label}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default ContextMenu; 