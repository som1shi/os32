import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTopScores, getUserBestScore, subscribeToLeaderboard, addConnectionStateListener } from '../firebase/scoreService';
import { useAuth } from '../firebase/AuthContext';
import './Leaderboard.css';

const GAMES = [
  { id: 'refiner', name: 'Refiner' },
  { id: 'colormania', name: 'Color Mania' },
  { id: 'wordsweeper', name: 'Word Sweeper' }
];

const REFINER_TIMES = [
  { id: '30', name: '30 Seconds' },
  { id: '60', name: '1 Minute' },
  { id: '180', name: '3 Minutes' },
  { id: '300', name: '5 Minutes' },
  { id: '600', name: '10 Minutes' }
];

const Leaderboard = ({ initialGame, initialTime, limitCount = 5 }) => {
  const [selectedGame, setSelectedGame] = useState(initialGame || 'refiner');
  const [selectedTime, setSelectedTime] = useState(initialTime || '60');
  const [scores, setScores] = useState([]);
  const [userBestScore, setUserBestScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const { currentUser } = useAuth();
  const unsubscribeRef = useRef(null);
  const initialLoadCompleted = useRef(false);
  const isMountedRef = useRef(true);
  
  const getCollectionName = useCallback(() => {
    if (selectedGame === 'refiner') {
      return `refiner-${selectedTime}`;
    }
    return selectedGame;
  }, [selectedGame, selectedTime]);

  const fetchUserBestScore = useCallback(async () => {
    if (!currentUser || !isMountedRef.current) return;
    
    try {
      const bestScore = await getUserBestScore(currentUser.uid, getCollectionName());
      if (isMountedRef.current) {
        setUserBestScore(bestScore);
      }
    } catch (err) {
      console.error('Error fetching user best score:', err);
    }
  }, [currentUser, getCollectionName]);

  const handleGameChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedGame(value);
    setLoading(true);
    setUserBestScore(null);
    initialLoadCompleted.current = false;
  }, []);

  const handleTimeChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedTime(value);
    setLoading(true);
    setUserBestScore(null);
    initialLoadCompleted.current = false;
  }, []);

  const fetchScores = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;
    
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
          const topScores = await getTopScores(collectionName, limitCount, true);
          if (isMountedRef.current) {
            setScores(topScores);
            setLoading(false);
            setRefreshing(false);
            setError(null);
            initialLoadCompleted.current = true;
          }
        } catch (err) {
          console.error('Initial fetch failed:', err);
          if (isMountedRef.current) {
            setError('Failed to load leaderboard data. Please try again.');
            setLoading(false);
            setRefreshing(false);
          }
        }
      }
      
      unsubscribeRef.current = subscribeToLeaderboard(collectionName, limitCount, (newScores) => {
        if (isMountedRef.current) {
          setScores(newScores);
          setLoading(false);
          setRefreshing(false);
          setError(null);
          initialLoadCompleted.current = true;
        }
      }, (err) => {
        if (isMountedRef.current) {
          console.error('Subscription error:', err);
          setError('Connection error. Please try refreshing.');
          setLoading(false);
          setRefreshing(false);
        }
      });
      
      await fetchUserBestScore();
    } catch (err) {
      console.error('Error fetching scores:', err);
      if (isMountedRef.current) {
        setError('Failed to load leaderboard data. Please check your connection.');
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchUserBestScore, getCollectionName, limitCount, refreshing]);

  const handleRefresh = useCallback(() => {
    fetchScores(true);
  }, [fetchScores]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const removeConnectionListener = addConnectionStateListener((online) => {
      if (isMountedRef.current) {
        setIsOnline(online);
        
        if (online && error) {
          fetchScores();
        }
      }
    });
    
    return () => {
      isMountedRef.current = false;
      removeConnectionListener();
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [error, fetchScores]);

  useEffect(() => {
    if (isMountedRef.current) {
      initialLoadCompleted.current = false;
      fetchScores();
    }
  }, [fetchScores, selectedGame, selectedTime]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    
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

  const dropdownOptions = useMemo(() => {
    return {
      games: GAMES.map(game => (
        <option key={game.id} value={game.id}>{game.name}</option>
      )),
      times: REFINER_TIMES.map(time => (
        <option key={time.id} value={time.id}>{time.name}</option>
      ))
    };
  }, []);

  const userScoreSection = useMemo(() => {
    if (!currentUser || !userBestScore) return null;
    
    return (
      <div className="user-best-score">
        <h3>Your Best Score</h3>
        <div className="score-card highlight">
          <div className="score-info">
            <div className="score-user">
              <img 
                src={currentUser.photoURL || '/default-avatar.png'} 
                alt={currentUser.displayName || 'You'} 
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
    );
  }, [currentUser, userBestScore, formatDate, handleAvatarError]);

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
            {dropdownOptions.games}
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
              {dropdownOptions.times}
            </select>
          </div>
        )}
        
        <button 
          className="refresh-button winxp-button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          type="button"
          aria-label="Refresh leaderboard"
        >
          <span className="retry-icon" aria-hidden="true">↻</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {(loading || refreshing) && (
        <div className="leaderboard-loading" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>{loading ? 'Loading scores...' : 'Refreshing scores...'}</p>
        </div>
      )}
      
      {error && !loading && (
        <div className="leaderboard-error" role="alert">
          <p>{error}</p>
          <button 
            className="retry-button winxp-button"
            onClick={() => fetchScores(true)}
            type="button"
          >
            <span className="retry-icon" aria-hidden="true">↻</span> Retry
          </button>
        </div>
      )}
      
      {!isOnline && !loading && (
        <div className="connection-status offline" role="status">
          <span>⚠️ Offline Mode</span>
          <button 
            className="retry-button small winxp-button"
            onClick={() => fetchScores(true)}
            type="button"
            aria-label="Retry connection"
          >
            <span className="retry-icon" aria-hidden="true">↻</span>
          </button>
        </div>
      )}
      
      {!loading && !error && userBestScore && userScoreSection}
      
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
                        src={score.user?.photoURL || '/default-avatar.png'} 
                        alt={score.user?.displayName || 'User'} 
                        className="user-avatar"
                        onError={handleAvatarError}
                        loading="lazy"
                      />
                      <span>{score.user?.displayName || 'Unknown User'}</span>
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