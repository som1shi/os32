import { useCallback } from 'react';
import { ANIMATION_DURATION } from '../constants';

/**
 * Hook for handling animations and UI effects
 * @returns {Object} Functions for creating animations
 */
const useAnimations = () => {
  /**
   * Create falling animation for tiles being removed
   * @param {Array} tiles Array of tile coordinates to animate
   */
  const createFallingAnimation = useCallback((tiles) => {
    tiles.forEach((tile, index) => {
      const cellElement = document.querySelector(`.cm-cell[data-row="${tile.row}"][data-col="${tile.col}"]`);
      if (!cellElement) return;
      
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
      }, ANIMATION_DURATION);
    });
  }, []);

  /**
   * Create score popup at the location of a successful match
   * @param {number} rowIndex Row index where the click occurred
   * @param {number} colIndex Column index where the click occurred
   * @param {number} pointsGained Points gained from the match
   */
  const createScorePopup = useCallback((rowIndex, colIndex, pointsGained) => {
    const boardElement = document.querySelector('.cm-game-board');
    if (!boardElement) return;
    
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
    }, ANIMATION_DURATION);
  }, []);

  return {
    createFallingAnimation,
    createScorePopup
  };
};

export default useAnimations; 