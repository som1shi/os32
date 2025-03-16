import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { getUserRecentScores } from '../firebase/scoreService';
import './UserProfile.css';

const UserProfile = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const [recentScores, setRecentScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  
  const collectionNames = {
    'wordsweeper': 'WordSweeper',
    'refiner-30': 'Refiner (30s)',
    'refiner-60': 'Refiner (60s)',
    'refiner-180': 'Refiner (3m)',
    'refiner-300': 'Refiner (5m)',
    'refiner-600': 'Refiner (10m)',
    'quantumchess': 'Quantum Chess',
    'wikiconnect': 'Wiki Connect',
    'rotateconnectfour': 'Rotate Connect Four',
  };

  const collectionIcons = {
    'wordsweeper': '💣',
    'refiner-30': '🔢',
    'refiner-60': '🔢',
    'refiner-180': '🔢',
    'refiner-300': '🔢',
    'refiner-600': '🔢',
    'quantumchess': '♟️',
    'wikiconnect': '🔗',
    'rotateconnectfour': '🎲',
  };

  useEffect(() => {
    const fetchUserScores = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const scores = await getUserRecentScores(currentUser.uid);
        setRecentScores(scores);
      } catch (err) {
        console.error('Error fetching user scores:', err);
        setError('Failed to load your recent scores');
      } finally {
        setLoading(false);
      }
    };

    fetchUserScores();
  }, [currentUser]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="user-profile-container winxp-window-content">
      <div className="user-profile-card">
        <div className="user-profile-header">
          <div className="user-avatar-large">
            <img 
              src={currentUser.photoURL || '/default-avatar.png'} 
              alt={currentUser.displayName || 'User'} 
            />
          </div>
          <div className="user-info">
            <h2>{currentUser.displayName || 'User'}</h2>
            <p className="user-email">{currentUser.email}</p>
            <div className="user-actions">
              <button className="winxp-button logout-button" onClick={handleLogout}>
                <span className="button-icon">🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="winxp-tabs">
          <div 
            className={`winxp-tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent Activity
          </div>
          <div 
            className={`winxp-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Game Statistics
          </div>
        </div>
        
        <div className="user-stats">
          {activeTab === 'recent' && (
            <>
              <div className="winxp-section">
                <div className="winxp-section-header">
                  <span className="section-icon">🏆</span>
                  <h3>Your Recent Scores</h3>
                </div>
                
                {loading ? (
                  <div className="loading-message">
                    <div className="winxp-loading-spinner"></div>
                    Loading your recent scores...
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span> {error}
                  </div>
                ) : recentScores.length === 0 ? (
                  <div className="no-scores-message">
                    <span className="info-icon">ℹ️</span> You haven't played any games yet. Start playing to see your scores here!
                  </div>
                ) : (
                  <div className="recent-scores">
                    <table className="scores-table">
                      <thead>
                        <tr>
                          <th>Game</th>
                          <th>Score</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentScores.map((score) => (
                          <tr key={score.id}>
                            <td>
                              <span className="game-icon">
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
                <span className="section-icon">📊</span>
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
              <span className="tip-icon">💡</span> 
              <span className="tip-text">Tip: Play more games to improve your scores and unlock achievements!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 