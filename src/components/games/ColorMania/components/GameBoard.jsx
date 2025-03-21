import React from 'react';
import { PENALTY_TIME } from '../constants';
import useMatchFinder from '../hooks/useMatchFinder';
import useAnimations from '../hooks/useAnimations';

const GameBoard = ({ 
  grid, 
  setGrid, 
  setScore, 
  setTimeLeft, 
  gameOver, 
  gameStarted 
}) => {
  const { findMatchingDirections } = useMatchFinder();
  const { createFallingAnimation, createScorePopup } = useAnimations();
  
  const handleCellClick = (rowIndex, colIndex) => {
    if (gameOver || !gameStarted || grid[rowIndex][colIndex] !== null) return;

    const matchingDirections = findMatchingDirections(grid, rowIndex, colIndex);
    
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
    
    createFallingAnimation(matchingDirections.matchingTiles);
    createScorePopup(rowIndex, colIndex, pointsGained);
  };

  return (
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
  );
};

export default GameBoard; 