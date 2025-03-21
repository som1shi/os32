import React, { useState, useEffect } from 'react';
import { PENALTY_TIME, GRID_WIDTH, GRID_HEIGHT } from '../constants';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [flattenedCells, setFlattenedCells] = useState([]);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const cells = [];
    
    if (isMobile) {
      for (let colIndex = 0; colIndex < GRID_WIDTH; colIndex++) {
        for (let rowIndex = 0; rowIndex < GRID_HEIGHT; rowIndex++) {
          cells.push({
            key: `cell-${rowIndex}-${colIndex}`,
            className: `cm-cell ${grid[rowIndex][colIndex] || 'empty'}`,
            rowIndex,
            colIndex,
            color: grid[rowIndex][colIndex],
            gridRow: colIndex + 1,
            gridColumn: GRID_HEIGHT - rowIndex
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
            gridRow: rowIndex + 1,
            gridColumn: colIndex + 1
          });
        }
      }
    }
    
    setFlattenedCells(cells);
  }, [grid, isMobile]);
  
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
      {flattenedCells.map(cell => (
        <div
          key={cell.key}
          className={cell.className}
          data-row={cell.rowIndex}
          data-col={cell.colIndex}
          onClick={() => handleCellClick(cell.rowIndex, cell.colIndex)}
          style={isMobile ? { 
            gridRow: cell.gridRow, 
            gridColumn: cell.gridColumn
          } : undefined}
        />
      ))}
    </div>
  );
};

export default GameBoard; 