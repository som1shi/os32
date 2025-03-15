import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Window from './Window';
import './GameWrapper.css';

import Minesweeper from '../games/Minesweeper/Minesweeper';
import QuantumChess from '../games/QuantumChess/QuantumChess';
import RotateConnectFour from '../games/RotateConnectFour/RotateConnectFour';
import Refiner from '../games/Refiner/Refiner';
import WikiConnect from '../games/WikiConnect/WikiConnect';

const GameWrapper = ({ games }) => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [isMaximized, setIsMaximized] = useState(false);
  
  const gameComponents = {
    'minesweeper': Minesweeper,
    'quantumchess': QuantumChess,
    'rotateconnectfour': RotateConnectFour,
    'refiner': Refiner,
    'wikiconnect': WikiConnect
  };
  
  const currentGame = games.find(game => game.id === gameId);
  const GameComponent = gameComponents[gameId];
  
  const handleClose = () => {
    navigate('/');
  };
  
  const handleMaximize = (maximized) => {
    setIsMaximized(maximized);
  };
  
  useEffect(() => {
    if (!currentGame || !GameComponent) {
      navigate('/');
    }
  }, [currentGame, GameComponent, navigate]);
  
  if (!currentGame || !GameComponent) {
    return null;
  }
  
  return (
    <div className="game-wrapper">
      <Window
        title={currentGame.title}
        icon={currentGame.icon}
        isActive={true}
        initialPosition={{ x: 50, y: 50 }}
        initialSize={{ width: 800, height: 600 }}
        isMaximized={isMaximized}
        onClose={handleClose}
        onMaximize={handleMaximize}
      >
        <GameComponent />
      </Window>
      
      <div className="back-button" onClick={handleClose}>
        <div className="back-icon">⬅️</div>
        <div className="back-text">Back to Desktop</div>
      </div>
    </div>
  );
};

export default GameWrapper; 