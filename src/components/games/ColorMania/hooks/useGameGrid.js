import { useState, useCallback } from 'react';
import { COLORS, GRID_HEIGHT, GRID_WIDTH } from '../constants';

/**
 * Hook for managing the game grid
 * @returns {Object} Grid management functions and state
 */
const useGameGrid = () => {
  const [grid, setGrid] = useState([]);

  /**
   * Initialize a new game grid with colored and empty tiles
   */
  const initializeGrid = useCallback(() => {
    const newGrid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    
    const totalCells = GRID_WIDTH * GRID_HEIGHT;
    const coloredCellsTarget = 200; 
    const emptyProbability = 1 - (coloredCellsTarget / totalCells);
    
    const positions = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        if (Math.random() > emptyProbability) {
          positions.push({ row, col });
        }
      }
    }
    
    const colorCounts = {};
    COLORS.forEach(color => {
      colorCounts[color] = 0;
    });
    
    for (const pos of positions) {
      const adjacentColors = new Set();
      
      const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      for (const [dRow, dCol] of directions) {
        const adjRow = pos.row + dRow;
        const adjCol = pos.col + dCol;
        
        if (
          adjRow >= 0 && adjRow < GRID_HEIGHT &&
          adjCol >= 0 && adjCol < GRID_WIDTH &&
          newGrid[adjRow][adjCol] !== null
        ) {
          adjacentColors.add(newGrid[adjRow][adjCol]);
        }
      }
      
      let eligibleColors = COLORS.filter(color => !adjacentColors.has(color));
      
      if (eligibleColors.length === 0 || eligibleColors.length === COLORS.length) {
        eligibleColors = [...COLORS].sort((a, b) => colorCounts[a] - colorCounts[b]);
      }
      
      const randomFactor = Math.random();
      let selectedColor;
      
      if (randomFactor < 0.7) {
        selectedColor = eligibleColors[0];
      } else if (randomFactor < 0.9 && eligibleColors.length > 1) {
        selectedColor = eligibleColors[1];
      } else if (eligibleColors.length > 2) {
        selectedColor = eligibleColors[2 + Math.floor(Math.random() * (eligibleColors.length - 2))];
      } else {
        selectedColor = eligibleColors[0];
      }
      
      newGrid[pos.row][pos.col] = selectedColor;
      colorCounts[selectedColor]++;
    }
    
    setGrid(newGrid);
    return newGrid;
  }, []);

  /**
   * Updates the grid when tiles are removed
   * @param {Array} tilesToRemove Array of tile coordinates to remove
   */
  const removeTiles = useCallback((tilesToRemove) => {
    setGrid(prevGrid => {
      const newGrid = JSON.parse(JSON.stringify(prevGrid));
      
      tilesToRemove.forEach(tile => {
        newGrid[tile.row][tile.col] = null;
      });
      
      return newGrid;
    });
  }, []);

  return {
    grid,
    setGrid,
    initializeGrid,
    removeTiles
  };
};

export default useGameGrid; 