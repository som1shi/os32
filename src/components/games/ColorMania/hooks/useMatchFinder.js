import { useCallback } from 'react';
import { GRID_HEIGHT, GRID_WIDTH } from '../constants';

/**
 * Hook for finding matching tiles in the game grid
 * @returns {Object} Functions for finding matches
 */
const useMatchFinder = () => {
  /**
   * Find the first colored tile in a direction
   * @param {Array} grid The current game grid
   * @param {number} startRow Starting row index
   * @param {number} startCol Starting column index
   * @param {number} rowDelta Row direction (-1, 0, or 1)
   * @param {number} colDelta Column direction (-1, 0, or 1)
   * @returns {Object|null} Coordinates of the first colored tile, or null if none found
   */
  const findFirstColoredTile = useCallback((grid, startRow, startCol, rowDelta, colDelta) => {
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
  }, []);

  /**
   * Find matching tiles in four directions
   * @param {Array} grid The current game grid
   * @param {number} row Row index of clicked cell
   * @param {number} col Column index of clicked cell
   * @returns {Object} Object containing matching color and tiles
   */
  const findMatchingDirections = useCallback((grid, row, col) => {
    const tilesInDirections = {
      up: findFirstColoredTile(grid, row, col, -1, 0),
      down: findFirstColoredTile(grid, row, col, 1, 0),
      left: findFirstColoredTile(grid, row, col, 0, -1),
      right: findFirstColoredTile(grid, row, col, 0, 1)
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
  }, [findFirstColoredTile]);

  return {
    findMatchingDirections
  };
};

export default useMatchFinder; 