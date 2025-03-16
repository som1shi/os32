import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Desktop.css';
import Window from './Window';
import AboutWindow from './AboutWindow';
import InternetExplorer from './InternetExplorer';
import Modal from '../Modal';
import Login from '../Login';
import Leaderboard from '../Leaderboard';
import StickyNote from './StickyNote';
import { useAuth } from '../../firebase/AuthContext';
import UserProfile from '../UserProfile';
import RefinerLeaderboardToggle from '../RefinerLeaderboardToggle';
import { addConnectionStateListener } from '../../firebase/scoreService';

import Minesweeper from '../games/Minesweeper/Minesweeper';
import QuantumChess from '../games/QuantumChess/QuantumChess';
import RotateConnectFour from '../games/RotateConnectFour/RotateConnectFour';
import Refiner from '../games/Refiner/Refiner';
import WikiConnect from '../games/WikiConnect/WikiConnect';

const Desktop = ({ games }) => {
  const navigate = useNavigate();
  const { currentUser, logOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showInternetExplorer, setShowInternetExplorer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStickyNotes, setShowStickyNotes] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  
  const gameComponents = {
    'minesweeper': Minesweeper,
    'quantumchess': QuantumChess,
    'rotateconnectfour': RotateConnectFour,
    'refiner': Refiner,
    'wikiconnect': WikiConnect
  };
  
  const [showRefinerLeaderboard, setShowRefinerLeaderboard] = useState(true);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);

    const removeConnectionListener = addConnectionStateListener((online) => {
      setIsOnline(online);
    });
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
      removeConnectionListener();
    };
  }, []);

  const formatDate = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleIconClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };
  
  const openGameWindow = (gameId) => {
    const existingWindow = openWindows.find(w => w.id === gameId);
    
    if (existingWindow) {
      if (minimizedWindows.includes(gameId)) {
        setMinimizedWindows(minimizedWindows.filter(id => id !== gameId));
      }
      setActiveWindowId(gameId);
    } else {
      const game = games.find(g => g.id === gameId);
      if (game) {
        const newWindow = {
          id: gameId,
          title: game.title,
          icon: game.icon,
          isMaximized: false,
          position: { x: 50 + (openWindows.length * 30), y: 50 + (openWindows.length * 30) },
          size: { width: 800, height: 600 },
          zIndex: openWindows.length + 1
        };
        
        setOpenWindows([...openWindows, newWindow]);
        setActiveWindowId(gameId);
        setStartMenuOpen(false);
      }
    }
  };
  
  const closeWindow = (windowId) => {
    setOpenWindows(openWindows.filter(w => w.id !== windowId));
    setMinimizedWindows(minimizedWindows.filter(id => id !== windowId));
    
    if (activeWindowId === windowId) {
      const remainingWindows = openWindows.filter(w => w.id !== windowId && !minimizedWindows.includes(w.id));
      if (remainingWindows.length > 0) {
        setActiveWindowId(remainingWindows[remainingWindows.length - 1].id);
      } else {
        setActiveWindowId(null);
      }
    }
  };
  
  const minimizeWindow = (windowId) => {
    if (!minimizedWindows.includes(windowId)) {
      setMinimizedWindows([...minimizedWindows, windowId]);
    }
    
    if (activeWindowId === windowId) {
      const visibleWindows = openWindows.filter(w => w.id !== windowId && !minimizedWindows.includes(w.id));
      if (visibleWindows.length > 0) {
        setActiveWindowId(visibleWindows[visibleWindows.length - 1].id);
      } else {
        setActiveWindowId(null);
      }
    }
  };
  
  const toggleMaximize = (windowId, isMaximized) => {
    setOpenWindows(openWindows.map(w => 
      w.id === windowId ? { ...w, isMaximized } : w
    ));
  };
  
  const activateWindow = (windowId) => {
    if (activeWindowId !== windowId) {
      setActiveWindowId(windowId);
      
      setOpenWindows(openWindows.map(w => {
        if (w.id === windowId) {
          return { ...w, zIndex: Math.max(...openWindows.map(w => w.zIndex)) + 1 };
        }
        return w;
      }));
    }
  };
  
  const toggleStartMenu = () => {
    setStartMenuOpen(!startMenuOpen);
  };

  const handleDesktopClick = (e) => {
    if (startMenuOpen && !e.target.closest('.start-menu') && !e.target.closest('.win-start-button')) {
      setStartMenuOpen(false);
    }
  };
  
  const restoreWindow = (windowId) => {
    setMinimizedWindows(minimizedWindows.filter(id => id !== windowId));
    activateWindow(windowId);
  };

  const toggleAboutWindow = () => {
    setShowAbout(!showAbout);
    setStartMenuOpen(false);
  };
  
  const toggleInternetExplorer = () => {
    setShowInternetExplorer(!showInternetExplorer);
    setStartMenuOpen(false);
  };

  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
    setStartMenuOpen(false);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
    setStartMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
      await logOut();
      setStartMenuOpen(false);
      setShowUserProfile(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleStickyNotes = () => {
    setShowStickyNotes(!showStickyNotes);
    setStartMenuOpen(false);
  };

  

  return (
    <div className="winxp-desktop" onClick={handleDesktopClick}>
      <div className="desktop-icons">
        {games.map(game => (
          <div 
            key={game.id} 
            className="desktop-icon"
            onClick={() => handleIconClick(game.id)}
            onDoubleClick={() => handleIconClick(game.id)}
          >
            <div className="icon">{game.icon}</div>
            <div className="icon-text">{game.title}</div>
          </div>
        ))}
        
        <div 
          className="desktop-icon"
          onClick={toggleInternetExplorer}
          onDoubleClick={toggleInternetExplorer}
        >
          <div className="icon">🌐</div>
          <div className="icon-text">Internet Explorer</div>
        </div>

        {currentUser && (
          <div 
            className="desktop-icon"
            onClick={toggleUserProfile}
            onDoubleClick={toggleUserProfile}
          >
            <div className="icon">👤</div>
            <div className="icon-text">My Profile</div>
          </div>
        )}
      </div>
      
      {showStickyNotes && (
        <>
          <StickyNote 
            title="WordSweeper Leaderboard" 
            initialPosition={{ x: windowSize.width - 320, y: 50 }}
            color="#ffff88"
            onClose={() => setShowStickyNotes(false)}
          >
            <Leaderboard 
              collectionName="wordsweeper" 
              title="WordSweeper Top Scores"
            />
          </StickyNote>
          
          {showRefinerLeaderboard && (
            <RefinerLeaderboardToggle
              initialPosition={{ x: windowSize.width - 320, y: 350 }}
              onClose={() => setShowRefinerLeaderboard(false)}
            />
          )}
        </>
      )}
      
      {openWindows.map(window => {
        const GameComponent = gameComponents[window.id];
        const isMinimized = minimizedWindows.includes(window.id);
        
        if (isMinimized) return null;
        
        return (
          <Window
            key={window.id}
            title={window.title}
            icon={window.icon}
            isActive={activeWindowId === window.id}
            initialPosition={window.position}
            initialSize={window.size}
            isMaximized={window.isMaximized}
            zIndex={window.zIndex}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            onMaximize={(isMax) => toggleMaximize(window.id, isMax)}
            onClick={() => activateWindow(window.id)}
          >
            {GameComponent && <GameComponent />}
          </Window>
        );
      })}
      
      {showAbout && (
        <Window
          title="About Games Collection"
          icon="ℹ️"
          isActive={true}
          initialPosition={{ x: 100, y: 100 }}
          initialSize={{ width: 400, height: 500 }}
          isMaximized={false}
          zIndex={1000}
          onClose={() => setShowAbout(false)}
        >
          <AboutWindow onClose={() => setShowAbout(false)} />
        </Window>
      )}
      
      {showInternetExplorer && (
        <Window
          title="Internet Explorer"
          icon="🌐"
          isActive={true}
          initialPosition={{ x: 150, y: 150 }}
          initialSize={{ width: 800, height: 600 }}
          isMaximized={false}
          zIndex={1001}
          onClose={() => setShowInternetExplorer(false)}
        >
          <InternetExplorer />
        </Window>
      )}
      
      {showUserProfile && currentUser && (
        <Window
          title="User Profile"
          icon="👤"
          isActive={true}
          initialPosition={{ x: 200, y: 100 }}
          initialSize={{ width: 600, height: 500 }}
          isMaximized={false}
          zIndex={1002}
          onClose={() => setShowUserProfile(false)}
        >
          <UserProfile onLogout={handleLogoutClick} />
        </Window>
      )}
      
      
      <div className="taskbar">
        <div 
          className={`win-start-button ${startMenuOpen ? 'active' : ''}`}
          onClick={toggleStartMenu}
        >
          <div className="start-logo"></div>
          <span>Start</span>
        </div>
        
        <div className="quick-launch">
          <div 
            className="quick-launch-item"
            onClick={toggleInternetExplorer}
          >
            <div className="quick-icon">🌐</div>
          </div>
          <div className="quick-launch-item">
            <div className="quick-icon">📧</div>
          </div>
          <div className="separator"></div>
        </div>
        
        <div className="taskbar-windows">
          {openWindows.map(window => {
            const isMinimized = minimizedWindows.includes(window.id);
            
            return (
              <div 
                key={window.id}
                className={`taskbar-window ${activeWindowId === window.id && !isMinimized ? 'active' : ''}`}
                onClick={() => isMinimized ? restoreWindow(window.id) : activateWindow(window.id)}
              >
                <div className="taskbar-icon">{window.icon}</div>
                <div className="taskbar-text">{window.title}</div>
              </div>
            );
          })}
        </div>
        
        <div className="system-tray">
          {currentUser && (
            <div 
              className="user-avatar-small"
              onClick={toggleUserProfile}
              title={currentUser.displayName || 'User Profile'}
            >
              <img 
                src={currentUser.photoURL || '/default-avatar.png'} 
                alt={currentUser.displayName || 'User'} 
              />
            </div>
          )}
          <div 
            className="tray-icon" 
            onClick={toggleStickyNotes}
            title={showStickyNotes ? "Hide Leaderboards" : "Show Leaderboards"}
          >
            🏆
          </div>
          <div 
            className="tray-icon connection-indicator" 
            title={isOnline ? "Online" : "Offline"}
          >
            {isOnline ? "🟢" : "🔴"}
          </div>
          <div className="time">{formatDate(currentTime)}</div>
        </div>
      </div>
      
      {startMenuOpen && (
        <div className="start-menu">
          <div className="start-menu-header">
            {currentUser ? (
              <div className="start-user-info">
                <div className="start-user-avatar">
                  <img 
                    src={currentUser.photoURL || '/default-avatar.png'} 
                    alt={currentUser.displayName || 'User'} 
                  />
                </div>
                <div className="start-user-name">
                  {currentUser.displayName || 'User'}
                </div>
              </div>
            ) : (
              <div className="start-user-info">
                <div className="start-user-avatar">
                  <img src="/default-avatar.png" alt="Guest" />
                </div>
                <div className="start-user-name">Guest</div>
              </div>
            )}
          </div>
          
          <div className="start-menu-items">
            <div className="start-menu-left">
              <div className="start-menu-item" onClick={toggleAboutWindow}>
                <div className="start-menu-icon">ℹ️</div>
                <div className="start-menu-text">About</div>
              </div>
              
              
              <div className="start-menu-separator"></div>
              
              <div 
                className="start-menu-item"
                onClick={toggleStickyNotes}
              >
                <div className="start-menu-icon">🏆</div>
                <div className="start-menu-text">
                  {showStickyNotes ? "Hide Leaderboards" : "Show Leaderboards"}
                </div>
              </div>
              <div className="start-menu-separator"></div>
              <div className="start-menu-item" onClick={toggleInternetExplorer}>
                <div className="start-menu-icon">🌐</div>
                <div className="start-menu-text">Internet Explorer</div>
              </div>
              {games.map(game => (
                <div 
                  key={game.id} 
                  className="start-menu-item"
                  onClick={() => openGameWindow(game.id)}
                >
                  <div className="start-menu-icon">{game.icon}</div>
                  <div className="start-menu-text">{game.title}</div>
                </div>
              ))}
            </div>
            
            <div className="start-menu-right">
            {currentUser ? (
                <div className="start-menu-item" onClick={toggleUserProfile}>
                  <div className="start-menu-icon">👤</div>
                  <div className="start-menu-text">My Profile</div>
                </div>
              ) : (
                <div className="start-menu-item" onClick={handleLoginClick}>
                  <div className="start-menu-icon">🔑</div>
                  <div className="start-menu-text">Sign In</div>
                </div>
              )}
              {currentUser && (
                <div className="start-menu-item" onClick={handleLogoutClick}>
                  <div className="start-menu-icon">🚪</div>
                  <div className="start-menu-text">Sign Out</div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
      
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign In"
        width="400px"
      >
        <Login onClose={() => setShowLoginModal(false)} />
      </Modal>
    </div>
  );
};

export default Desktop; 