import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTopScores, getUserBestScore, subscribeToLeaderboard, addConnectionStateListener } from '../firebase/scoreService';
import { useAuth } from '../firebase/AuthContext';
import './Leaderboard.css';

const GAMES = [
  { id: 'colormania', name: 'Color Mania' },
  { id: 'refiner', name: 'Refiner' },
  { id: 'wordsweeper', name: 'Word Sweeper' },
];

const REFINER_TIMES = [
  { id: '30', name: '30 Seconds' },
  { id: '60', name: '1 Minute' },
  { id: '180', name: '3 Minutes' },
  { id: '300', name: '5 Minutes' },
  { id: '600', name: '10 Minutes' }
];

const Leaderboard = ({ initialGame, initialTime, limitCount = 5 }) => {
  const [selectedGame, setSelectedGame] = useState(initialGame || 'wordsweeper');
  const [selectedTime, setSelectedTime] = useState(initialTime || '30');
  const [scores, setScores] = useState([]);
  const [userBestScore, setUserBestScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const { currentUser } = useAuth();
  const unsubscribeRef = useRef(null);
  const initialLoadCompleted = useRef(false);
  
  const getCollectionName = useCallback(() => {
    if (selectedGame === 'refiner') {
      return `refiner-${selectedTime}`;
    }
    return selectedGame;
  }, [selectedGame, selectedTime]);

  const fetchUserBestScore = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const bestScore = await getUserBestScore(currentUser.uid, getCollectionName());
      setUserBestScore(bestScore);
    } catch (err) {
      console.error('Error fetching user best score:', err);
    }
  }, [currentUser, getCollectionName]);

  const handleGameChange = useCallback((e) => {
    setSelectedGame(e.target.value);
    setLoading(true);
  }, []);

  const handleTimeChange = useCallback((e) => {
    setSelectedTime(e.target.value);
    setLoading(true);
  }, []);

  const fetchScores = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      
      const collectionName = getCollectionName();
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      if (!initialLoadCompleted.current || forceRefresh) {
        try {
          const topScores = await getTopScores(collectionName, limitCount, forceRefresh);
          setScores(topScores);
          initialLoadCompleted.current = true;
          setLoading(false);
          setRefreshing(false);
          setError(null);
        } catch (err) {
          console.error('Initial fetch failed:', err);
        }
      }
      
      unsubscribeRef.current = subscribeToLeaderboard(collectionName, limitCount, (newScores) => {
        setScores(newScores);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        initialLoadCompleted.current = true;
      });
      
      await fetchUserBestScore();
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load leaderboard data. Please check your connection.');
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUserBestScore, getCollectionName, limitCount, refreshing]);

  const handleRefresh = useCallback(() => {
    fetchScores(true);
  }, [fetchScores]);

  useEffect(() => {
    const removeConnectionListener = addConnectionStateListener((online) => {
      setIsOnline(online);
      
      if (online && error) {
        fetchScores();
      }
    });
    
    return () => {
      removeConnectionListener();
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [error, fetchScores]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores, selectedGame, selectedTime]);

  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const handleAvatarError = useCallback((e) => {
    e.target.onerror = null; 
    e.target.src = '/default-avatar.png';
  }, []);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-controls winxp-select">
        <div className="select-container">
          <label htmlFor="game-select">Game:</label>
          <select 
            id="game-select" 
            value={selectedGame} 
            onChange={handleGameChange}
            disabled={loading || refreshing}
            className="winxp-dropdown"
          >
            {GAMES.map(game => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>
        </div>
        
        {selectedGame === 'refiner' && (
          <div className="select-container">
            <label htmlFor="time-select">Time:</label>
            <select 
              id="time-select" 
              value={selectedTime} 
              onChange={handleTimeChange}
              disabled={loading || refreshing}
              className="winxp-dropdown"
            >
              {REFINER_TIMES.map(time => (
                <option key={time.id} value={time.id}>{time.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <button 
          className="refresh-button winxp-button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
        >
          <span className="retry-icon">↻</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {(loading || refreshing) && (
        <div className="leaderboard-loading">
          <div className="loading-spinner"></div>
          <p>{loading ? 'Loading scores...' : 'Refreshing scores...'}</p>
        </div>
      )}
      
      {error && !loading && (
        <div className="leaderboard-error">
          <p>{error}</p>
          <button 
            className="retry-button winxp-button"
            onClick={() => fetchScores(true)}
          >
            <span className="retry-icon">↻</span> Retry
          </button>
        </div>
      )}
      
      {!isOnline && !loading && (
        <div className="connection-status offline">
          <span>⚠️ Offline Mode</span>
          <button 
            className="retry-button small winxp-button"
            onClick={() => fetchScores(true)}
          >
            <span className="retry-icon">↻</span>
          </button>
        </div>
      )}
      
      {!loading && !error && userBestScore && (
        <div className="user-best-score">
          <h3>Your Best Score</h3>
          <div className="score-card highlight">
            <div className="score-info">
              <div className="score-user">
                <img 
                  src={currentUser.photoURL || '/default-avatar.png'} 
                  alt="User" 
                  className="user-avatar"
                  onError={handleAvatarError} 
                />
                <span>{currentUser.displayName || 'You'}</span>
              </div>
              <div className="lb-score-value">{userBestScore.score}</div>
            </div>
            <div className="score-date">{formatDate(userBestScore.timestamp)}</div>
          </div>
        </div>
      )}
      
      {!loading && !error && (
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
                      <img 
                        src={score.user.photoURL || '/default-avatar.png'} 
                        alt="User" 
                        className="user-avatar"
                        onError={handleAvatarError}
                        loading="lazy"
                      />
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
      )}
    </div>
  );
};

export default React.memo(Leaderboard); 