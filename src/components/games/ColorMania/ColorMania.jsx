import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useScoreSubmission from '../../../firebase/useScoreSubmission';
import './ColorMania.css';

const GAME_TIME = 120;
const PENALTY_TIME = 10;
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const GRID_WIDTH = 25;
const GRID_HEIGHT = 16;

const ColorMania = () => {
  const navigate = useNavigate();
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showScoreSubmitted, setShowScoreSubmitted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { submitGameScore, submitting, error: submitError, success: submitSuccess } = useScoreSubmission();
  
  const timePercentage = (timeLeft / GAME_TIME) * 100;

  const initializeGrid = useCallback(() => {
    const newGrid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    
    const tilesToPlace = [];
    COLORS.forEach(color => {
      for (let i = 0; i < 40; i++) {
        tilesToPlace.push(color);
      }
    });
    
    for (let i = tilesToPlace.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tilesToPlace[i], tilesToPlace[j]] = [tilesToPlace[j], tilesToPlace[i]];
    }
    
    let tileIndex = 0;
    while (tileIndex < tilesToPlace.length) {
      const row = Math.floor(Math.random() * GRID_HEIGHT);
      const col = Math.floor(Math.random() * GRID_WIDTH);
      
      if (newGrid[row][col] === null) {
        newGrid[row][col] = tilesToPlace[tileIndex];
        tileIndex++;
      }
    }
    
    return newGrid;
  }, []);

  const startGame = useCallback(() => {
    setGrid(initializeGrid());
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameOver(false);
    setGameStarted(true);
  }, [initializeGrid]);

  const submitScore = useCallback(async (finalScore) => {
    try {
      await submitGameScore('colormania', finalScore);
      setShowScoreSubmitted(true);
      setTimeout(() => {
        setShowScoreSubmitted(false);
      }, 3000);
    } catch (error) {}
  }, [submitGameScore]);

  const findFirstColoredTile = (startRow, startCol, rowDelta, colDelta) => {
    let row = startRow + rowDelta;
    let col = startCol + colDelta;
    
    while (
      row >= 0 && row < GRID_HEIGHT &&
      col >= 0 && col < GRID_WIDTH
    ) {
      if (grid[row][col] !== null) {
        return { row, col };
      }
      row += rowDelta;
      col += colDelta;
    }
    
    return null;
  };

  const findMatchingDirections = (row, col) => {
    const tilesInDirections = {
      up: findFirstColoredTile(row, col, -1, 0),
      down: findFirstColoredTile(row, col, 1, 0),
      left: findFirstColoredTile(row, col, 0, -1),
      right: findFirstColoredTile(row, col, 0, 1)
    };
    
    const coloredTiles = Object.values(tilesInDirections).filter(tile => tile !== null);
    
    if (coloredTiles.length === 0) {
      return { matchingTiles: [] };
    }
    
    const tilesByColor = {};
    coloredTiles.forEach(tile => {
      const color = grid[tile.row][tile.col];
      if (!tilesByColor[color]) {
        tilesByColor[color] = [];
      }
      tilesByColor[color].push(tile);
    });
    
    const colorProximities = {};
    for (const [color, tiles] of Object.entries(tilesByColor)) {
      if (tiles.length >= 2) {
        const totalDistance = tiles.reduce((sum, tile) => {
          const rowDist = Math.abs(tile.row - row);
          const colDist = Math.abs(tile.col - col);
          return sum + rowDist + colDist;
        }, 0);
        
        colorProximities[color] = {
          tiles,
          averageDistance: totalDistance / tiles.length
        };
      }
    }
    
    if (Object.keys(colorProximities).length === 0) {
      return { matchingTiles: [] };
    }
    
    let closestColor = Object.keys(colorProximities)[0];
    let smallestDistance = colorProximities[closestColor].averageDistance;
    
    for (const [color, data] of Object.entries(colorProximities)) {
      if (data.averageDistance < smallestDistance) {
        closestColor = color;
        smallestDistance = data.averageDistance;
      }
    }
    
    return {
      matchingColor: closestColor,
      matchingTiles: colorProximities[closestColor].tiles
    };
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (gameOver || !gameStarted || grid[rowIndex][colIndex] !== null) return;

    const matchingDirections = findMatchingDirections(rowIndex, colIndex);
    
    if (matchingDirections.matchingTiles.length < 2) {
      setTimeLeft(prev => Math.max(0, prev - PENALTY_TIME));
      return;
    }

    const newGrid = JSON.parse(JSON.stringify(grid));
    
    matchingDirections.matchingTiles.forEach(tile => {
      newGrid[tile.row][tile.col] = null;
    });
    
    const pointsGained = matchingDirections.matchingTiles.length;
    setScore(prev => prev + pointsGained);
    setGrid(newGrid);
    
    matchingDirections.matchingTiles.forEach((tile, index) => {
      const cellElement = document.querySelector(`.cm-cell[data-row="${tile.row}"][data-col="${tile.col}"]`);
      if (cellElement) {
        const cellRect = cellElement.getBoundingClientRect();
        const cellClone = cellElement.cloneNode(true);
        
        cellClone.style.position = 'fixed';
        cellClone.style.top = `${cellRect.top}px`;
        cellClone.style.left = `${cellRect.left}px`;
        cellClone.style.width = `${cellRect.width}px`;
        cellClone.style.height = `${cellRect.height}px`;
        cellClone.style.zIndex = '10';
        cellClone.style.pointerEvents = 'none';
        cellClone.style.margin = '0';
        
        const delayClass = `falling-delay-${(index % 4) + 1}`;
        cellClone.classList.add('falling', delayClass);
        
        document.body.appendChild(cellClone);
        
        setTimeout(() => {
          if (document.body.contains(cellClone)) {
            document.body.removeChild(cellClone);
          }
        }, 2500);
      }
    });
    
    const boardElement = document.querySelector('.cm-game-board');
    if (boardElement) {
      const boardRect = boardElement.getBoundingClientRect();
      const totalPopup = document.createElement('div');
      totalPopup.className = 'cm-score-popup';
      totalPopup.innerText = `+${pointsGained}`;
      totalPopup.style.position = 'fixed';
      totalPopup.style.top = `${boardRect.top + rowIndex * 30}px`;
      totalPopup.style.left = `${boardRect.left + colIndex * 30}px`;
      totalPopup.style.color = '#FFFFFF';
      totalPopup.style.fontSize = '32px';
      totalPopup.style.fontWeight = 'bold';
      totalPopup.style.zIndex = '250';
      totalPopup.style.textShadow = '0 0 6px #000';
      
      document.body.appendChild(totalPopup);
      
      setTimeout(() => {
        if (document.body.contains(totalPopup)) {
          document.body.removeChild(totalPopup);
        }
      }, 2500);
    }
  };

  const handleShare = () => {
    const gameUrl = "https://os32.vercel.app/game/colormania";
    const shareText = `I scored ${score} points in ColorMania! Can you beat my score?`;
    
    navigator.clipboard.writeText(`${shareText}\n\n${gameUrl}`).then(() => {
      alert('Score copied to clipboard! Share with your friends.');
    }).catch(() => {
      alert('Failed to copy to clipboard.');
    });
  };

  const renderTimeBarSegments = () => {
    let colorClass = "normal";
    if (timePercentage <= 30) {
      colorClass = "low";
    } else if (timePercentage <= 60) {
      colorClass = "medium";
    }
    
    const totalSegments = 40;
    const activeSegments = Math.ceil((timePercentage / 100) * totalSegments);
    
    const segments = [];
    for (let i = 0; i < activeSegments; i++) {
      segments.push(<div key={`segment-${i}`} className="cm-time-segment"></div>);
    }
    
    return (
      <div className="cm-time-bar" data-percentage={colorClass}>
        {segments}
      </div>
    );
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setGameOver(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
      submitScore(score);
    }
  }, [timeLeft, gameOver, score, submitScore]);

  return (
    <div className="colormania">
      <div className="cm-window-header">
        <div className="cm-window-title">
          <span>ColorMania</span>
        </div>
        <div className="cm-window-controls">
          <button 
            className="cm-window-button close"
            onClick={() => navigate('/')}
          ></button>
        </div>
      </div>
      
      <div className="cm-menu-bar">
        <div className="cm-menu-item">
          <span>File</span>
          <div className="cm-menu-dropdown">
            <div className="cm-menu-option" onClick={startGame}>New Game</div>
            <div className="cm-menu-option" onClick={() => navigate('/')}>Exit</div>
          </div>
        </div>
        <div className="cm-menu-item">
          <span>Help</span>
          <div className="cm-menu-dropdown">
            <div className="cm-menu-option" onClick={() => setShowInfo(true)}>How to Play</div>
          </div>
        </div>
      </div>

      <div className="cm-game-container">
        {!gameStarted ? (
          <div className="cm-start-screen">
            <h2>ColorMania</h2>


            <p>Click an empty tile to remove matching colored tiles.</p>
            <p>When you click on a blank tile, the game checks the first colored tile in each direction (up, down, left, right).</p>
            <p>If at least 2 tiles of the same color are found, they will be removed (become blank).</p>
            <p>You have 120 seconds to play. Each incorrect click (less than 2 matching tiles) reduces your time by 10 seconds.</p>
            <button onClick={startGame}>Start Game</button>
          </div>
        ) : (
          <div className="cm-game-play-area">
            <div className="cm-game-display">
              <div className="cm-display-panel">

                <div className="cm-time-section">
                  <div className="cm-time-header">
                    <div className="cm-time-label">TIME REMAINING:</div>
                    <div className="cm-score-section">
                  <div className="cm-score-label">SCORE:</div>
                  <div className="cm-score-value">{score}</div>
                </div>
                  </div>
                  <div className="cm-time-bar-container">
                    {renderTimeBarSegments()}
                  </div>
                </div>
              </div>
            </div>

            <div className="cm-game-board">
              {grid.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="cm-row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={`cm-cell ${cell || 'empty'}`}
                      data-row={rowIndex}
                      data-col={colIndex}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {gameOver && (
              <div className="cm-game-over-message">
                <h2>Game Over!</h2>
                <p>Your final score: {score}</p>
                {submitting && <p className="cm-score-status submitting">Submitting score...</p>}
                {submitSuccess && <p className="cm-score-status success">Score submitted successfully!</p>}
                {submitError && <p className="cm-score-status error">Error submitting score: {submitError}</p>}
                <div className="cm-game-over-buttons">
                  <button onClick={startGame}>Play Again</button>
                  <button className="cm-share-button" onClick={handleShare}>Share Result</button>
                </div>
              </div>
            )}
            
            {showScoreSubmitted && !gameOver && (
              <div className="cm-score-submitted-notification">
                <p>Score submitted successfully!</p>
              </div>
            )}
          </div>
        )}
        
        {showInfo && (
          <div className="cm-info-modal">
            <h3>How to Play ColorMania</h3>
            <div className="cm-info-content">
            <ul>
  <li>Click an empty tile to remove matching colored tiles.</li>
  <li>The game checks four directions (up, down, left, right) from the selected tile.</li>
  <li>If at least two matching tiles are found, they are removed.</li>
  <li>For example, if the tiles above and to the right are both red, clicking the blank tile will remove them.</li>
  <li>You have 120 seconds to remove as many tiles as possible.</li>
  <li>Incorrect clicks (fewer than two matching tiles) will subtract 10 seconds from your time.</li>
</ul>
            </div>
            <button onClick={() => setShowInfo(false)}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorMania; 