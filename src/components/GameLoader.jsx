import { useState, useEffect } from 'react';

import Minesweeper from './games/Minesweeper/Minesweeper';
import QuantumChess from './games/QuantumChess/QuantumChess';
import RotateConnectFour from './games/RotateConnectFour/RotateConnectFour';
import Refiner from './games/Refiner/Refiner';
import WikiConnect from './games/WikiConnect/WikiConnect';

const GameLoader = ({ gameId }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setError(null);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [gameId]);
  
  const renderLoading = () => (
    <div className="game-loading">
      <div className="loading-spinner"></div>
      <p>Loading game...</p>
    </div>
  );

  const renderGame = () => {
    try {
      switch(gameId) {
        case 'minesweeper':
          return <Minesweeper />;
        case 'quantumchess':
          return <QuantumChess />;
        case 'rotateconnectfour':
          return <RotateConnectFour />;
        case 'wikiconnect':
          return <WikiConnect />;
        case 'refiner':
          return <Refiner />;
        default:
          throw new Error(`Unknown game: ${gameId}`);
      }
    } catch (err) {
      setError(`Error loading game: ${err.message}`);
      return null;
    }
  };

  if (error) {
    return (
      <div className="game-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      {loading ? renderLoading() : renderGame()}
    </div>
  );
};

export default GameLoader; 