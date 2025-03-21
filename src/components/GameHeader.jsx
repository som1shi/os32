import React, { useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';

const GameHeader = ({ title }) => {
  const navigate = useNavigate();
  
  const handleBackClick = useCallback(() => {
    navigate('/');
  }, [navigate]);
  
  return (
    <header className="game-header">
      <h1>{title}</h1>
      <button 
        className="back-button"
        onClick={handleBackClick}
        type="button"
        aria-label="Back to Games"
      >
        Back to Games
      </button>
    </header>
  );
};

export default memo(GameHeader); 