import { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';

const Minesweeper = lazy(() => import('./games/Minesweeper/Minesweeper'));
const QuantumChess = lazy(() => import('./games/QuantumChess/QuantumChess'));
const RotateConnectFour = lazy(() => import('./games/RotateConnectFour/RotateConnectFour'));
const Refiner = lazy(() => import('./games/Refiner/Refiner'));
const WikiConnect = lazy(() => import('./games/WikiConnect/WikiConnect'));

const GameLoader = ({ gameId }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setError(null);
    setLoading(true);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [gameId]);
  
  const renderLoading = useCallback(() => (
    <div className="game-loading" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true"></div>
      <p>Loading game...</p>
    </div>
  ), []);

  const renderGame = useCallback(() => {
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
      console.error('Game loading error:', err);
      setError(`Error loading game: ${err.message}`);
      return null;
    }
  }, [gameId]);

  if (error) {
    return (
      <div className="game-error" role="alert">
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          type="button"
          className="retry-button"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      {loading ? renderLoading() : (
        <Suspense fallback={renderLoading()}>
          {renderGame()}
        </Suspense>
      )}
    </div>
  );
};

export default memo(GameLoader); 