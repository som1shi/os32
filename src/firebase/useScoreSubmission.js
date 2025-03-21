import { useState, useCallback, useRef } from 'react';
import { submitScore } from './scoreService';
import { useAuth } from './AuthContext';

const COLLECTION_MAPPING = {
  'minesweeper': 'wordsweeper',
  'refiner-30': 'refiner-30',
  'refiner-60': 'refiner-60',
  'refiner-180': 'refiner-180',
  'refiner-300': 'refiner-300',
  'refiner-600': 'refiner-600',
  'refiner': 'refiner-30',
  'colormania': 'colormania'
};

const REFINER_DURATIONS = {
  30: 'refiner-30',
  60: 'refiner-60',
  180: 'refiner-180',
  300: 'refiner-300',
  600: 'refiner-600'
};

/**
 * Hook for managing game score submission
 * @returns {Object} Score submission state and functions
 */
const useScoreSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { currentUser } = useAuth();
  const lastSubmissionRef = useRef(null);
  
  const SUBMISSION_COOLDOWN = 1000;

  /**
   * Get the appropriate collection name for a game
   * @param {string} gameId - The ID of the game
   * @param {Object} gameDetails - Game details that might contain duration info
   * @returns {string} The collection name to use
   */
  const getCollectionName = useCallback((gameId, gameDetails = {}) => {
    if (COLLECTION_MAPPING[gameId]) {
      return COLLECTION_MAPPING[gameId];
    }
    
    if (gameId === 'refiner' || gameId.startsWith('refiner-')) {
      if (gameDetails && gameDetails.duration) {
        const duration = Number(gameDetails.duration);
        
        const durations = Object.keys(REFINER_DURATIONS)
          .map(Number)
          .sort((a, b) => a - b);
        
        for (const maxDuration of durations) {
          if (duration <= maxDuration) {
            return REFINER_DURATIONS[maxDuration];
          }
        }
        
        return REFINER_DURATIONS[durations[durations.length - 1]];
      }
      
      if (gameId.startsWith('refiner-')) {
        const durationMatch = gameId.match(/refiner-(\d+)/);
        if (durationMatch && durationMatch[1]) {
          const extractedDuration = parseInt(durationMatch[1], 10);
          if (REFINER_DURATIONS[extractedDuration]) {
            return REFINER_DURATIONS[extractedDuration];
          }
        }
      }
      
      return 'refiner-30';
    }
    
    return gameId;
  }, []);

  /**
   * Validate and normalize score value
   * @param {any} score - The score to validate
   * @returns {number|null} The normalized score or null if invalid
   */
  const validateScore = useCallback((score) => {
    let validScore;
    
    if (typeof score === 'number') {
      validScore = score;
    } else if (typeof score === 'string') {
      validScore = parseInt(score, 10);
    } else if (score && typeof score.valueOf === 'function') {
      validScore = Number(score.valueOf());
    } else {
      validScore = Number(score);
    }
    
    return isNaN(validScore) ? null : validScore;
  }, []);

  /**
   * Submit a score to the leaderboard
   * @param {string} gameId - The ID of the game
   * @param {number} score - The score to submit
   * @param {Object} gameDetails - Additional game details (optional)
   * @returns {Promise<string|null>} The ID of the submitted score or null if submission failed
   */
  const submitGameScore = useCallback(async (gameId, score, gameDetails = {}) => {
    setError(null);
    
    const validScore = validateScore(score);
    if (validScore === null) {
      setError('Invalid score value');
      return null;
    }
    
    if (!currentUser) {
      storeScoreLocally('anonymous', getCollectionName(gameId, gameDetails), validScore, gameDetails);
      setError('Score saved locally. Sign in to submit to leaderboard.');
      return null;
    }
    
    const now = Date.now();
    const submissionKey = `${gameId}_${validScore}_${currentUser.uid}`;
    
    if (lastSubmissionRef.current && 
        lastSubmissionRef.current.key === submissionKey && 
        now - lastSubmissionRef.current.timestamp < SUBMISSION_COOLDOWN) {
      return lastSubmissionRef.current.scoreId;
    }
    
    if (submitting) {
      return null;
    }
    
    try {
      setSubmitting(true);
      setSuccess(false);
      
      const collectionName = getCollectionName(gameId, gameDetails);
      
      const cleanGameDetails = Object.entries(gameDetails || {})
        .filter(([_, value]) => value !== undefined && value !== null)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
      
      if (cleanGameDetails.gameDuration && !cleanGameDetails.duration) {
        cleanGameDetails.duration = cleanGameDetails.gameDuration;
      }
      
      if ((gameId === 'refiner' || gameId.startsWith('refiner-')) && 
          typeof cleanGameDetails.duration === 'undefined') {
        if (gameId.startsWith('refiner-')) {
          const durationMatch = gameId.match(/refiner-(\d+)/);
          if (durationMatch && durationMatch[1]) {
            cleanGameDetails.duration = parseInt(durationMatch[1], 10);
          } else {
            cleanGameDetails.duration = 30;
          }
        } else {
          cleanGameDetails.duration = 30;
        }
      }
      
      const enhancedGameDetails = {
        ...cleanGameDetails,
        clientTimestamp: Date.now(),
        playerName: currentUser.displayName || 'Unknown Player'
      };
      
      const scoreId = await submitScore(
        currentUser.uid, 
        collectionName, 
        validScore, 
        enhancedGameDetails
      );
      
      lastSubmissionRef.current = {
        key: submissionKey,
        timestamp: Date.now(),
        scoreId
      };
      
      setSuccess(true);
      return scoreId;
    } catch (err) {
      console.error('Score submission error:', err);
      
      if (err.message === 'Device is offline' || 
          err.code === 'unavailable' || 
          err.code === 'failed-precondition') {
        storeScoreLocally(currentUser.uid, getCollectionName(gameId, gameDetails), validScore, gameDetails);
      } else {
        setError('Failed to submit score. Please try again.');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [currentUser, submitting, getCollectionName, validateScore]);

  /**
   * Store score in localStorage if Firebase submission fails
   */
  const storeScoreLocally = useCallback((userId, collectionName, score, gameDetails) => {
    try {
      const pendingScores = JSON.parse(localStorage.getItem('pendingScores') || '[]');
      
      if (pendingScores.length >= 50) {
        pendingScores.shift();
      }
      
      pendingScores.push({
        userId,
        collectionName,
        score,
        timestamp: Date.now(),
        clientTimestamp: Date.now(),
        ...gameDetails
      });
      
      localStorage.setItem('pendingScores', JSON.stringify(pendingScores));
      
      setError('Score saved locally. Will submit when connection is restored.');
    } catch (localErr) {
      console.error('Local storage error:', localErr);
      setError('Failed to submit score and could not save locally.');
    }
  }, []);

  /**
   * Reset submission state
   */
  const resetSubmissionState = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    submitGameScore,
    submitting,
    error,
    success,
    resetSubmissionState
  };
};

export default useScoreSubmission; 