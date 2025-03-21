import { useState } from 'react';
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

/**
 * Hook for managing game score submission
 * @returns {Object} Score submission state and functions
 */
const useScoreSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { currentUser } = useAuth();
  const [lastSubmission, setLastSubmission] = useState(null);
  const SUBMISSION_COOLDOWN = 3000;

  /**
   * Get the appropriate collection name for a game
   * @param {string} gameId - The ID of the game
   * @param {Object} gameDetails - Game details that might contain duration info
   * @returns {string} The collection name to use
   */
  const getCollectionName = (gameId, gameDetails = {}) => {
    if (gameId === 'refiner' || gameId.startsWith('refiner-')) {
      if (COLLECTION_MAPPING[gameId]) {
        return COLLECTION_MAPPING[gameId];
      }
      
      if (gameDetails && gameDetails.duration) {
        const duration = Number(gameDetails.duration);
        
        if (duration <= 30) {
          return 'refiner-30';
        }
        if (duration <= 60) {
          return 'refiner-60';
        }
        if (duration <= 180) {
          return 'refiner-180';
        }
        if (duration <= 300) {
          return 'refiner-300';
        }
        if (duration <= 600) {
          return 'refiner-600';
        }
      }
      
      return 'refiner-30';
    }
    
    return COLLECTION_MAPPING[gameId] || gameId;
  };

  /**
   * Submit a score to the leaderboard
   * @param {string} gameId - The ID of the game
   * @param {number} score - The score to submit
   * @param {Object} gameDetails - Additional game details (optional)
   * @returns {Promise<string|null>} The ID of the submitted score or null if submission failed
   */
  const submitGameScore = async (gameId, score, gameDetails = {}) => {
    setError(null);
    
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
    
    if (isNaN(validScore)) {
      setError('Invalid score value');
      return null;
    }
    
    if (!currentUser) {
      setError('You must be logged in to submit scores');
      return null;
    }
    
    const now = Date.now();
    const submissionKey = `${gameId}_${validScore}_${currentUser.uid}`;
    
    if (lastSubmission && 
        lastSubmission.key === submissionKey && 
        now - lastSubmission.timestamp < SUBMISSION_COOLDOWN) {
      return lastSubmission.scoreId;
    }
    
    if (submitting) {
      return null;
    }
    
    try {
      setSubmitting(true);
      setSuccess(false);
      
      const collectionName = getCollectionName(gameId, gameDetails);
      
      const cleanGameDetails = { ...gameDetails };
      
      if (cleanGameDetails.gameDuration && !cleanGameDetails.duration) {
        cleanGameDetails.duration = cleanGameDetails.gameDuration;
      }
      
      if ((gameId === 'refiner' || gameId.startsWith('refiner-')) && 
          typeof cleanGameDetails.duration === 'undefined' &&
          typeof cleanGameDetails.gameDuration === 'undefined') {
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
      
      Object.keys(cleanGameDetails).forEach(key => {
        if (cleanGameDetails[key] === undefined || cleanGameDetails[key] === null) {
          delete cleanGameDetails[key];
        }
      });
      
      const enhancedGameDetails = {
        ...cleanGameDetails,
        playerName: currentUser.displayName || 'Unknown Player'
      };
      
      const scoreId = await submitScore(
        currentUser.uid, 
        collectionName, 
        validScore, 
        enhancedGameDetails
      );
      
      setLastSubmission({
        key: submissionKey,
        timestamp: Date.now(),
        scoreId
      });
      
      setSuccess(true);
      return scoreId;
    } catch (err) {
      if (err.message === 'Device is offline') {
        storeScoreLocally(currentUser.uid, getCollectionName(gameId, gameDetails), validScore, gameDetails);
      } else {
        setError('Failed to submit score. Please try again.');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Store score in localStorage if Firebase submission fails
   */
  const storeScoreLocally = (userId, collectionName, score, gameDetails) => {
    try {
      const pendingScores = JSON.parse(localStorage.getItem('pendingScores') || '[]');
      
      pendingScores.push({
        userId,
        collectionName,
        score,
        timestamp: new Date().toISOString(),
        ...gameDetails
      });
      
      localStorage.setItem('pendingScores', JSON.stringify(pendingScores));
      
      setError('Score saved locally. Will try to submit when connection is restored.');
    } catch (localErr) {
      setError('Failed to submit score and could not save locally.');
    }
  };

  return {
    submitGameScore,
    submitting,
    error,
    success,
    resetSubmissionState: () => {
      setError(null);
      setSuccess(false);
    }
  };
};

export default useScoreSubmission; 