import { useState, useEffect, useCallback } from 'react';
import { GAME_TIME } from '../constants';
import useScoreSubmission from '../../../../firebase/useScoreSubmission';

/**
 * Hook for managing overall game state
 * @returns {Object} Game state and functions
 */
const useGameState = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showScoreSubmitted, setShowScoreSubmitted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const { 
    submitGameScore, 
    submitting, 
    error: submitError, 
    success: submitSuccess 
  } = useScoreSubmission();

  /**
   * Start a new game
   * @param {Function} initializeGridFn Function to initialize the grid
   */
  const startGame = useCallback((initializeGridFn) => {
    initializeGridFn();
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  /**
   * Submit the player's score to the leaderboard
   * @param {number} finalScore The final score to submit
   */
  const submitScore = useCallback(async (finalScore) => {
    try {
      await submitGameScore('colormania', finalScore);
      setShowScoreSubmitted(true);
      setTimeout(() => {
        setShowScoreSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }, [submitGameScore]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setGameOver(true);
          submitScore(score);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, score, submitScore]);

  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
      submitScore(score);
    }
  }, [timeLeft, gameOver, score, submitScore]);

  return {
    score,
    setScore,
    timeLeft,
    setTimeLeft,
    gameOver,
    setGameOver,
    gameStarted,
    setGameStarted,
    showScoreSubmitted,
    setShowScoreSubmitted,
    showInfo,
    setShowInfo,
    startGame,
    submitScore,
    submitting,
    submitError,
    submitSuccess
  };
};

export default useGameState; 