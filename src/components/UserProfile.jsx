import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { getUserRecentScores } from '../firebase/scoreService';
import AppIcon from './ui/AppIcon';
import { ICON_KEYS } from '../config/iconRegistry';
import './UserProfile.css';

const UserProfile = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const [allScores, setAllScores] = useState([]);
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
    'chaostetris': 'Chaos Tetris',
    'colormania': 'Color Mania',
    'decrypt': 'Decrypt',
  }), []);

  const collectionIcons = useMemo(() => ({
    'wordsweeper': ICON_KEYS.game.wordsweeper,
    'refiner-30': ICON_KEYS.game.refiner,
    'refiner-60': ICON_KEYS.game.refiner,
    'refiner-180': ICON_KEYS.game.refiner,
    'refiner-300': ICON_KEYS.game.refiner,
    'refiner-600': ICON_KEYS.game.refiner,
    'quantumchess': ICON_KEYS.game.quantumchess,
    'wikiconnect': ICON_KEYS.game.wikiconnect,
    'rotateconnectfour': ICON_KEYS.game.rotateconnectfour,
    'chaostetris': ICON_KEYS.game.chaostetris,
    'colormania': ICON_KEYS.game.colormania,
    'decrypt': ICON_KEYS.game.decrypt,
  }), []);

  useEffect(() => {
    let isMounted = true;
    const fetchUserScores = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const scores = await getUserRecentScores(currentUser.uid, 200);
        if (isMounted) setAllScores(scores);
      } catch (err) {
        console.error('Error fetching user scores:', err);
        if (isMounted) setError('Failed to load your scores');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUserScores();
    return () => { isMounted = false; };
  }, [currentUser]);

  // 10 most recent for the Recent Activity tab
  const recentScores = useMemo(() => allScores.slice(0, 10), [allScores]);

  // Per-game stats for the Game Statistics tab
  const gameStats = useMemo(() => {
    const map = {};
    allScores.forEach(s => {
      const key = s.collectionName;
      if (!map[key]) map[key] = { played: 0, best: 0, total: 0 };
      map[key].played += 1;
      map[key].total += s.score;
      if (s.score > map[key].best) map[key].best = s.score;
    });
    return Object.entries(map)
      .map(([key, v]) => ({
        key,
        name: collectionNames[key] || key,
        icon: collectionIcons[key],
        played: v.played,
        best: v.best,
        avg: Math.round(v.total / v.played),
      }))
      .sort((a, b) => b.best - a.best);
  }, [allScores, collectionNames, collectionIcons]);

  const totalGamesPlayed = useMemo(() =>
    gameStats.reduce((sum, g) => sum + g.played, 0), [gameStats]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace(',', '').replace(', ', ' · ');
  }, []);

  const handleLogout = useCallback(() => { if (onLogout) onLogout(); }, [onLogout]);
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  if (!currentUser) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-card">
          <div className="winxp-message-box">
            <div className="winxp-message-icon">
              <AppIcon name={ICON_KEYS.system.signIn} size={28} />
            </div>
            <div className="winxp-message-content">
              <h2>Sign In Required</h2>
              <p>Please sign in to view your profile and game statistics.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const photoURL = currentUser.photoURL || '/user.png';
  const displayName = currentUser.displayName || 'User';

  return (
    <div className="user-profile-container winxp-window-content">
      <div className="user-profile-card">
        <div className="user-profile-header">
          <div className="user-avatar-large">
            <img src={photoURL} alt={displayName} />
          </div>
          <div className="user-info">
            <h2>{displayName}</h2>
            <p className="user-email">{currentUser.email}</p>
            <div className="user-actions" />
          </div>
          <button className="winxp-button logout-button" onClick={handleLogout} type="button" aria-label="Sign Out">
            <span className="button-icon"><AppIcon name={ICON_KEYS.system.signOut} size={14} /></span> Sign Out
          </button>
        </div>

        <div className="winxp-tabs">
          <button className={`winxp-tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => handleTabChange('recent')} type="button">
            Recent Activity
          </button>
          <button className={`winxp-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => handleTabChange('stats')} type="button">
            Game Statistics
          </button>
        </div>

        <div className="user-stats">

          {/* ── Recent Activity ── */}
          {activeTab === 'recent' && (
            <>
              <div className="winxp-section">
                <div className="winxp-section-header">
                  <span className="section-icon" aria-hidden="true"><AppIcon name={ICON_KEYS.app.leaderboard} size={16} /></span>
                  <h3>Your Recent Scores</h3>
                </div>
                {loading ? (
                  <div className="loading-message" aria-live="polite">
                    <div className="winxp-loading-spinner" />
                    Loading your recent scores...
                  </div>
                ) : error ? (
                  <div className="error-message" role="alert">
                    <span className="error-icon" aria-hidden="true">!</span> {error}
                  </div>
                ) : recentScores.length === 0 ? (
                  <div className="no-scores-message">
                    <span className="info-icon" aria-hidden="true"><AppIcon name={ICON_KEYS.app.about} size={12} /></span>
                    You haven't played any games yet. Start playing to see your scores here!
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
                            <td className="profile-game-cell">
                              <span className="game-icon" aria-hidden="true">
                                <AppIcon name={collectionIcons[score.collectionName]} size={14} />
                              </span>
                              <span className="profile-game-name">{collectionNames[score.collectionName] || score.collectionName}</span>
                            </td>
                            <td className="profile-score">{score.score.toLocaleString()}</td>
                            <td className="profile-date">{formatDate(score.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Game Statistics ── */}
          {activeTab === 'stats' && (
            <div className="winxp-section">
              <div className="winxp-section-header">
                <span className="section-icon" aria-hidden="true"><AppIcon name={ICON_KEYS.app.leaderboard} size={16} /></span>
                <h3>Game Statistics</h3>
              </div>

              {loading ? (
                <div className="loading-message" aria-live="polite">
                  <div className="winxp-loading-spinner" />
                  Loading statistics...
                </div>
              ) : gameStats.length === 0 ? (
                <div className="no-scores-message">
                  <span className="info-icon" aria-hidden="true"><AppIcon name={ICON_KEYS.app.about} size={12} /></span>
                  No statistics yet — play some games first!
                </div>
              ) : (
                <>
                  {/* summary banner */}
                  <div className="stats-summary-bar">
                    <div className="stats-summary-item">
                      <span className="stats-summary-value">{totalGamesPlayed}</span>
                      <span className="stats-summary-label">Total Rounds</span>
                    </div>
                    <div className="stats-summary-divider" />
                    <div className="stats-summary-item">
                      <span className="stats-summary-value">{gameStats.length}</span>
                      <span className="stats-summary-label">Games Tried</span>
                    </div>
                    <div className="stats-summary-divider" />
                    <div className="stats-summary-item">
                      <span className="stats-summary-value">
                        {[...gameStats].sort((a, b) => b.played - a.played)[0]?.name ?? '—'}
                      </span>
                      <span className="stats-summary-label">Favorite Game</span>
                    </div>
                  </div>

                  {/* per-game cards */}
                  <div className="stats-cards">
                    {gameStats.map(g => (
                      <div key={g.key} className="stats-card">
                        <div className="stats-card-header">
                          <span className="stats-card-icon"><AppIcon name={g.icon} size={16} /></span>
                          <span className="stats-card-name">{g.name}</span>
                        </div>
                        <div className="stats-card-body">
                          <div className="stats-card-stat">
                            <span className="stats-card-num">{g.played}</span>
                            <span className="stats-card-lbl">Played</span>
                          </div>
                          <div className="stats-card-stat">
                            <span className="stats-card-num">{g.best.toLocaleString()}</span>
                            <span className="stats-card-lbl">Best</span>
                          </div>
                          <div className="stats-card-stat">
                            <span className="stats-card-num">{g.avg.toLocaleString()}</span>
                            <span className="stats-card-lbl">Avg</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="winxp-footer">
            <div className="winxp-tip">
              <span className="tip-icon" aria-hidden="true"><AppIcon name={ICON_KEYS.app.about} size={14} /></span>
              <span className="tip-text">Tip: Play more games to improve your scores!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(UserProfile);