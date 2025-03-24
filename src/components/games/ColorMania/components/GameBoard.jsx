import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { PENALTY_TIME, GRID_WIDTH, GRID_HEIGHT } from '../constants';
import useMatchFinder from '../hooks/useMatchFinder';
import useAnimations from '../hooks/useAnimations';

const Cell = memo(({ cell, onClick }) => {
  return (
    <div
      key={cell.key}
      className={cell.className}
      data-row={cell.rowIndex}
      data-col={cell.colIndex}
      onClick={onClick}
      style={cell.style}
    />
  );
});

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleCellClick = useCallback((rowIndex, colIndex) => {
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
  }, [gameOver, gameStarted, grid, findMatchingDirections, setTimeLeft, setScore, setGrid, createFallingAnimation, createScorePopup]);
  
  const flattenedCells = useMemo(() => {
    const cells = [];
    
    if (isMobile && !isLandscape) {
      for (let colIndex = 0; colIndex < GRID_WIDTH; colIndex++) {
        for (let rowIndex = 0; rowIndex < GRID_HEIGHT; rowIndex++) {
          cells.push({
            key: `cell-${rowIndex}-${colIndex}`,
            className: `cm-cell ${grid[rowIndex][colIndex] || 'empty'}`,
            rowIndex,
            colIndex,
            color: grid[rowIndex][colIndex],
            style: { 
              gridRow: colIndex + 1, 
              gridColumn: GRID_HEIGHT - rowIndex
            }
          });
        }
      }
    } else {
      for (let rowIndex = 0; rowIndex < GRID_HEIGHT; rowIndex++) {
        for (let colIndex = 0; colIndex < GRID_WIDTH; colIndex++) {
          cells.push({
            key: `cell-${rowIndex}-${colIndex}`,
            className: `cm-cell ${grid[rowIndex][colIndex] || 'empty'}`,
            rowIndex,
            colIndex,
            color: grid[rowIndex][colIndex],
            style: {
              gridRow: rowIndex + 1, 
              gridColumn: colIndex + 1
            }
          });
        }
      }
    }
    
    return cells;
  }, [grid, isMobile, isLandscape]);
  
  return (
    <div className={`cm-game-board ${isMobile ? isLandscape ? 'landscape' : 'portrait' : ''}`}>
      {flattenedCells.map(cell => (
        <Cell
          key={cell.key}
          cell={cell}
          onClick={() => handleCellClick(cell.rowIndex, cell.colIndex)}
        />
      ))}
    </div>
  );
};

export default memo(GameBoard); 