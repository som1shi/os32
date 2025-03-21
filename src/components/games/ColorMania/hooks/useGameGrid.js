import { useState, useCallback } from 'react';
import { COLORS, GRID_HEIGHT, GRID_WIDTH } from '../constants';

/**
 * Hook for managing the game grid
 * @returns {Object} Grid management functions and state
 */
const useGameGrid = () => {
  const [grid, setGrid] = useState([]);

  /**
   * Check if a position would create an easy match if a certain color is placed
   * @param {Array} grid Current grid
   * @param {Object} pos Position {row, col} to check
   * @param {String} color Color to check
   * @returns {Boolean} True if it would create an easy match
   */
  const wouldCreateEasyMatch = useCallback((grid, pos, color) => {
    const directions = [
      [-1, 0], [0, 1], [1, 0], [0, -1]
    ];
    
    const colorsByDirection = {};
    
    for (const [dRow, dCol] of directions) {
      let row = pos.row + dRow;
      let col = pos.col + dCol;
      
      if (row < 0 || row >= GRID_HEIGHT || col < 0 || col >= GRID_WIDTH) {
        continue;
      }
      
      const cellColor = grid[row][col];
      if (cellColor !== null) {
        if (!colorsByDirection[cellColor]) {
          colorsByDirection[cellColor] = [];
        }
        colorsByDirection[cellColor].push({direction: [dRow, dCol], row, col});
      }
    }
    
    if (colorsByDirection[color] && colorsByDirection[color].length >= 2) {
      return true;
    }
    
    let easyMatchCount = 0;
    for (const [existingColor, occurrences] of Object.entries(colorsByDirection)) {
      if (occurrences.length >= 2) {
        easyMatchCount++;
      }
    }
    
    if (easyMatchCount > 0) {
      return true;
    }
    
    let pairCount = 0;
    for (const occurrences of Object.values(colorsByDirection)) {
      if (occurrences.length >= 2) {
        pairCount++;
      }
    }
    if (pairCount >= 2) {
      return true;
    }
    
    return false;
  }, []);

  /**
   * Initialize a new game grid with colored and empty tiles
   */
  const initializeGrid = useCallback(() => {
    const TARGET_PER_COLOR = Math.floor(200 / COLORS.length);
    const newGrid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(null));
    
    const allPositions = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        allPositions.push({ row, col });
      }
    }
    
    for (let i = allPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
    }
    
    const colorCounts = {};
    COLORS.forEach(color => {
      colorCounts[color] = 0;
    });
    
    let positionIndex = 0;
    let totalPlaced = 0;
    const targetTotalTiles = TARGET_PER_COLOR * COLORS.length;
    
    while (positionIndex < allPositions.length && 
           (totalPlaced < targetTotalTiles && 
            Object.values(colorCounts).some(count => count < TARGET_PER_COLOR))) {
      
      const pos = allPositions[positionIndex++];
      
      if (newGrid[pos.row][pos.col] !== null) {
        continue;
      }
      
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
      
      const underutilizedColors = COLORS.filter(color => 
        colorCounts[color] < TARGET_PER_COLOR &&
        !adjacentColors.has(color) &&
        !wouldCreateEasyMatch(newGrid, pos, color)
      );
      
      if (underutilizedColors.length > 0) {
        underutilizedColors.sort((a, b) => colorCounts[a] - colorCounts[b]);
        
        const selectedColor = underutilizedColors[0];
        newGrid[pos.row][pos.col] = selectedColor;
        colorCounts[selectedColor]++;
        totalPlaced++;
        continue;
      }
      
    }
    
    const totalColored = Object.values(colorCounts).reduce((sum, count) => sum + count, 0);
    const minColorCount = Math.min(...Object.values(colorCounts));
    const minRequiredPerColor = Math.max(10, Math.floor(TARGET_PER_COLOR * 0.7));
    
    if (totalColored < targetTotalTiles * 0.9 || minColorCount < minRequiredPerColor) {
      return initializeGrid();
    }
    
    setGrid(newGrid);
    return newGrid;
  }, [wouldCreateEasyMatch]);

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