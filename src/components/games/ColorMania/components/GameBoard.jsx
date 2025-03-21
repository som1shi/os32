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

  // Flatten the grid for rendering in CSS grid
  const flattenedCells = [];
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    for (let colIndex = 0; colIndex < grid[rowIndex].length; colIndex++) {
      flattenedCells.push({
        key: `cell-${rowIndex}-${colIndex}`,
        className: `cm-cell ${grid[rowIndex][colIndex] || 'empty'}`,
        rowIndex,
        colIndex,
        color: grid[rowIndex][colIndex]
      });
    }
  }

  return (
    <div className="cm-game-board">
      {flattenedCells.map(cell => (
        <div
          key={cell.key}
          className={cell.className}
          data-row={cell.rowIndex}
          data-col={cell.colIndex}
          onClick={() => handleCellClick(cell.rowIndex, cell.colIndex)}
        />
      ))}
    </div>
  );
};

export default GameBoard; 