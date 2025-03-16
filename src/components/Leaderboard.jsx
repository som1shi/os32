import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTopScores, getUserBestScore, subscribeToLeaderboard, addConnectionStateListener } from '../firebase/scoreService';
import { useAuth } from '../firebase/AuthContext';
import './Leaderboard.css';

const Leaderboard = ({ collectionName }) => {
  const [scores, setScores] = useState([]);
  const [userBestScore, setUserBestScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { currentUser } = useAuth();
  const unsubscribeRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const MAX_RETRIES = 3;

  const fetchUserBestScore = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const bestScore = await getUserBestScore(currentUser.uid, collectionName);
      setUserBestScore(bestScore);
    } catch (err) {}
  }, [currentUser, collectionName]);

  const setupLeaderboardSubscription = useCallback(() => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      unsubscribeRef.current = subscribeToLeaderboard(collectionName, 10, (newScores) => {
        setScores(newScores);
        setLoading(false);
        setInitialLoad(false);
        setError(null);
        setRetryCount(0);
      });
      
      return true;
    } catch (err) {
      return false;
    }
  }, [collectionName]);

  const fetchScoresWithRetry = useCallback(async () => {
    try {
      if (!loading) setLoading(true);
      
      const subscriptionSuccess = setupLeaderboardSubscription();
      
      if (!subscriptionSuccess) {
        const topScores = await getTopScores(collectionName);
        setScores(topScores);
        setLoading(false);
        setInitialLoad(false);
        setError(null);
        setRetryCount(0);
      }
      await fetchUserBestScore();
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);

        const delay = Math.pow(2, nextRetry) * 1000;
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        retryTimeoutRef.current = setTimeout(() => {
          fetchScoresWithRetry();
        }, delay);
      } else {
        setError('Failed to load leaderboard data. Please check your connection.');
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }, [collectionName, fetchUserBestScore, loading, retryCount, setupLeaderboardSubscription]);

  useEffect(() => {
    const removeConnectionListener = addConnectionStateListener((online) => {
      setIsOnline(online);
      
      if (online && error) {
        setRetryCount(0);
        fetchScoresWithRetry();
      }
    });
    
    fetchScoresWithRetry();
    
    return () => {
      removeConnectionListener();
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [collectionName, error, fetchScoresWithRetry]);

  useEffect(() => {
    fetchUserBestScore();
  }, [currentUser, fetchUserBestScore]);

  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className={`leaderboard-loading ${!initialLoad ? 'updating' : ''}`}>
          <div className="loading-spinner"></div>
          <p>{initialLoad ? 'Loading scores' : 'Updating scores'}{retryCount > 0 ? ` (Attempt ${retryCount}/${MAX_RETRIES})` : ''}...</p>
          {!isOnline && (
            <p className="offline-message">You appear to be offline. Scores will update when your connection is restored.</p>
          )}
        </div>
        
        {!initialLoad && scores.length > 0 && (
          <div className="top-scores faded">
            <h3>Top Scores (Updating...)</h3>
            <div className="scores-list">
              {scores.map((score, index) => (
                <div 
                  key={score.id} 
                  className={`score-card ${currentUser && score.userId === currentUser.uid ? 'highlight' : ''}`}
                >
                  <div className="score-rank">{index + 1}</div>
                  <div className="score-info">
                    <div className="score-user">
                      <img src={score.user.photoURL || '/default-avatar.png'} alt="User" className="user-avatar" />
                      <span>{score.user.displayName}</span>
                    </div>
                    <div className="lb-score-value">{score.score}</div>
                  </div>
                  <div className="score-date">{formatDate(score.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-error">
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => {
              setRetryCount(0);
              fetchScoresWithRetry();
            }}
          >
            <span className="retry-icon">↻</span> Retry
          </button>
          {!isOnline && (
            <p className="offline-message">You appear to be offline. Scores will update when your connection is restored.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      {!isOnline && (
        <div className="connection-status offline">
          <span>⚠️ Offline Mode</span>
          <button 
            className="retry-button small"
            onClick={() => {
              setRetryCount(0);
              fetchScoresWithRetry();
            }}
          >
            <span className="retry-icon">↻</span>
          </button>
        </div>
      )}
      
      {userBestScore && (
        <div className="user-best-score">
          <h3>Your Best Score</h3>
          <div className="score-card highlight">
            <div className="score-info">
              <div className="score-user">
                <img src={currentUser.photoURL || '/default-avatar.png'} alt="User" className="user-avatar" />
                <span>{currentUser.displayName || 'You'}</span>
              </div>
              <div className="lb-score-value">{userBestScore.score}</div>
            </div>
            <div className="score-date">{formatDate(userBestScore.timestamp)}</div>
          </div>
        </div>
      )}
      
      <div className="top-scores">
        <h3>Top Scores</h3>
        {scores.length === 0 ? (
          <div className="no-scores">No scores recorded yet. Be the first!</div>
        ) : (
          <div className="scores-list">
            {scores.map((score, index) => (
              <div 
                key={score.id} 
                className={`score-card ${currentUser && score.userId === currentUser.uid ? 'highlight' : ''}`}
              >
                <div className="score-rank">{index + 1}</div>
                <div className="score-info">
                  <div className="score-user">
                    <img src={score.user.photoURL || '/default-avatar.png'} alt="User" className="user-avatar" />
                    <span>{score.user.displayName}</span>
                  </div>
                  <div className="lb-score-value">{score.score}</div>
                </div>
                <div className="score-date">{formatDate(score.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Leaderboard); 