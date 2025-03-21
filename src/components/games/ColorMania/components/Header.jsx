import React from 'react';

const Header = ({ onNavigateHome, onNewGame, onShowInfo }) => {
  return (
    <>
      <div className="cm-window-header">
        <div className="cm-window-title">
          <span>ColorMania</span>
        </div>
        <div className="cm-window-controls">
          <button 
            className="cm-window-button close"
            onClick={onNavigateHome}
          ></button>
        </div>
      </div>
      
      <div className="cm-menu-bar">
        <div className="cm-menu-item">
          <span>File</span>
          <div className="cm-menu-dropdown">
            <div className="cm-menu-option" onClick={onNewGame}>New Game</div>
            <div className="cm-menu-option" onClick={onNavigateHome}>Exit</div>
          </div>
        </div>
        <div className="cm-menu-item">
          <span>Help</span>
          <div className="cm-menu-dropdown">
            <div className="cm-menu-option" onClick={onShowInfo}>How to Play</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header; 