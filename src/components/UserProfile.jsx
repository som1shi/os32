import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { getUserRecentScores } from '../firebase/scoreService';
import './UserProfile.css';

const UserProfile = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const [recentScores, setRecentScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  
  const collectionNames = useMemo(() => ({
    'wordsweeper': 'WordSweeper',
    'refiner-30': 'Refiner (30s)',
    'refiner-60': 'Refiner (60s)',
    'refiner-180': 'Refiner (3m)',
    'refiner-300': 'Refiner (5m)',
    'refiner-600': 'Refiner (10m)',
    'quantumchess': 'Quantum Chess',
    'wikiconnect': 'Wiki Connect',
    'rotateconnectfour': 'Rotate Connect Four',
  }), []);

  const collectionIcons = useMemo(() => ({
    'wordsweeper': '💣',
    'refiner-30': '🔢',
    'refiner-60': '🔢',
    'refiner-180': '🔢',
    'refiner-300': '🔢',
    'refiner-600': '🔢',
    'quantumchess': '♟️',
    'wikiconnect': '🔗',
    'rotateconnectfour': '🎲',
  }), []);

  useEffect(() => {
    let isMounted = true;
    const fetchUserScores = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const scores = await getUserRecentScores(currentUser.uid);
        if (isMounted) {
          setRecentScores(scores);
        }
      } catch (err) {
        console.error('Error fetching user scores:', err);
        if (isMounted) {
          setError('Failed to load your recent scores');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserScores();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  if (!currentUser) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-card">
          <div className="winxp-message-box">
            <div className="winxp-message-icon">🔑</div>
            <div className="winxp-message-content">
              <h2>Sign In Required</h2>
              <p>Please sign in to view your profile and game statistics.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const photoURL = currentUser.photoURL || '/default-avatar.png';
  const displayName = currentUser.displayName || 'User';
  
  return (
    <div className="user-profile-container winxp-window-content">
      <div className="user-profile-card">
        <div className="user-profile-header">
          <div className="user-avatar-large">
            <img 
              src={photoURL} 
              alt={displayName} 
            />
          </div>
          <div className="user-info">
            <h2>{displayName}</h2>
            <p className="user-email">{currentUser.email}</p>
            <div className="user-actions">
              <button 
                className="winxp-button logout-button" 
                onClick={handleLogout}
                type="button"
                aria-label="Sign Out"
              >
                <span className="button-icon">🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="winxp-tabs">
          <button 
            className={`winxp-tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => handleTabChange('recent')}
            type="button"
          >
            Recent Activity
          </button>
          <button 
            className={`winxp-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => handleTabChange('stats')}
            type="button"
          >
            Game Statistics
          </button>
        </div>
        
        <div className="user-stats">
          {activeTab === 'recent' && (
            <>
              <div className="winxp-section">
                <div className="winxp-section-header">
                  <span className="section-icon" aria-hidden="true">🏆</span>
                  <h3>Your Recent Scores</h3>
                </div>
                
                {loading ? (
                  <div className="loading-message" aria-live="polite">
                    <div className="winxp-loading-spinner"></div>
                    Loading your recent scores...
                  </div>
                ) : error ? (
                  <div className="error-message" role="alert">
                    <span className="error-icon" aria-hidden="true">⚠️</span> {error}
                  </div>
                ) : recentScores.length === 0 ? (
                  <div className="no-scores-message">
                    <span className="info-icon" aria-hidden="true">ℹ️</span> You haven't played any games yet. Start playing to see your scores here!
                  </div>
                ) : (
                  <div className="recent-scores">
                    <table className="scores-table">
                      <thead>
                        <tr>
                          <th scope="col">Game</th>
                          <th scope="col">Score</th>
                          <th scope="col">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentScores.map((score) => (
                          <tr key={score.id}>
                            <td>
                              <span className="game-icon" aria-hidden="true">
                                {collectionIcons[score.collectionName] || '🎮'}
                              </span>
                              {collectionNames[score.collectionName] || score.collectionName}
                            </td>
                            <td className="score-value">{score.score}</td>
                            <td className="score-date">{formatDate(score.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'stats' && (
            <div className="winxp-section">
              <div className="winxp-section-header">
                <span className="section-icon" aria-hidden="true">📊</span>
                <h3>Game Statistics</h3>
              </div>
              <div className="winxp-info-box">
                <p>Game statistics will be available in a future update.</p>
                <p>Check back soon for detailed performance metrics!</p>
              </div>
            </div>
          )}
          
          <div className="winxp-footer">
            <div className="winxp-tip">
              <span className="tip-icon" aria-hidden="true">💡</span> 
              <span className="tip-text">Tip: Play more games to improve your scores and unlock achievements!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(UserProfile); 