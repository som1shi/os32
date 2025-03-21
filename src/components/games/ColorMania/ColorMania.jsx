import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import useGameGrid from './hooks/useGameGrid';
import useGameState from './hooks/useGameState';

import GameBoard from './components/GameBoard';
import StartScreen from './components/StartScreen';
import GameOver from './components/GameOver';
import InfoModal from './components/InfoModal';
import Header from './components/Header';
import DisplayPanel from './components/DisplayPanel';

import './ColorMania.css';

const ColorMania = () => {
  const navigate = useNavigate();
  const { grid, setGrid, initializeGrid } = useGameGrid();
  const { 
    score, 
    setScore, 
    timeLeft, 
    setTimeLeft, 
    gameOver, 
    gameStarted, 
    showScoreSubmitted, 
    showInfo, 
    setShowInfo, 
    startGame: startGameState, 
    submitting, 
    submitError, 
    submitSuccess 
  } = useGameState();

  const handleNavigateHome = useCallback(() => navigate('/'), [navigate]);
  
  const handleNewGame = useCallback(() => {
    startGameState(initializeGrid);
  }, [startGameState, initializeGrid]);
  
  const handleShowInfo = useCallback(() => setShowInfo(true), [setShowInfo]);
  const handleCloseInfo = useCallback(() => setShowInfo(false), [setShowInfo]);

  return (
    <div className="colormania">
      <Header 
        onNavigateHome={handleNavigateHome}
        onNewGame={handleNewGame}
        onShowInfo={handleShowInfo}
      />
      
      <div className="cm-game-container">
        {!gameStarted ? (
          <StartScreen onStart={handleNewGame} />
        ) : (
          <div className="cm-game-play-area">
            <DisplayPanel timeLeft={timeLeft} score={score} />

            <GameBoard
              grid={grid}
              setGrid={setGrid}
              setScore={setScore}
              setTimeLeft={setTimeLeft}
              gameOver={gameOver}
              gameStarted={gameStarted}
            />

            {gameOver && (
              <GameOver
                score={score}
                onRestart={handleNewGame}
                submitting={submitting}
                submitSuccess={submitSuccess}
                submitError={submitError}
              />
            )}
            
            {showScoreSubmitted && !gameOver && (
              <div className="cm-score-submitted-notification">
                <p>Score submitted successfully!</p>
              </div>
            )}
          </div>
        )}
        
        {showInfo && (
          <InfoModal onClose={handleCloseInfo} />
        )}
      </div>
    </div>
  );
};

export default ColorMania; 