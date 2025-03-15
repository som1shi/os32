import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameHeader = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <div className="game-header">
      <h1>{title}</h1>
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        Back to Games
      </button>
    </div>
  );
};

export default GameHeader; 