import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Window from './Window';
import AboutWindow from './AboutWindow';
import InternetExplorer from './InternetExplorer';
import FileExplorer from '../FileExplorer/FileExplorer';
import Modal from '../Modal';
import Login from '../Login';
import Leaderboard from '../Leaderboard';
import StickyNote from './StickyNote';
import UserProfile from '../UserProfile';
import RefinerLeaderboardToggle from '../RefinerLeaderboardToggle';

import Minesweeper from '../games/Minesweeper/Minesweeper';
import QuantumChess from '../games/QuantumChess/QuantumChess';
import RotateConnectFour from '../games/RotateConnectFour/RotateConnectFour';
import Refiner from '../games/Refiner/Refiner';
import WikiConnect from '../games/WikiConnect/WikiConnect';
import Notepad from '../Notepad/Notepad';

import { useAuth } from '../../firebase/AuthContext';
import { addConnectionStateListener } from '../../firebase/scoreService';

import './Desktop.css';

const INITIAL_WINDOW_SIZE = {
  width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  height: typeof window !== 'undefined' ? window.innerHeight : 768
};

const GAME_COMPONENTS = {
  'minesweeper': Minesweeper,
  'quantumchess': QuantumChess,
  'rotateconnectfour': RotateConnectFour,
  'refiner': Refiner,
  'wikiconnect': WikiConnect
};

const Desktop = ({ games }) => {
  const navigate = useNavigate();
  const { currentUser, logOut } = useAuth();

  const [windows, setWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStickyNotes, setShowStickyNotes] = useState(true);
  const [showRefinerLeaderboard, setShowRefinerLeaderboard] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [windowSize, setWindowSize] = useState(INITIAL_WINDOW_SIZE);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleResize = () => setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    window.addEventListener('resize', handleResize);
    const removeConnectionListener = addConnectionStateListener(setIsOnline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
      removeConnectionListener();
    };
  }, []);

  const addWindow = useCallback((id, title, icon, component) => {
    const existingWindow = windows.find(w => w.id === id);
    
    if (existingWindow) {
      if (minimizedWindows.includes(id)) {
        setMinimizedWindows(prev => prev.filter(wId => wId !== id));
      }
      setActiveWindow(id);
      return;
    }

    const newWindow = {
      id,
      title,
      icon,
      component,
      isMaximized: false,
      position: { x: 50 + (windows.length * 30), y: 50 + (windows.length * 30) },
      size: { width: 800, height: 600 },
      zIndex: windows.length + 1
    };
    
    setWindows(prev => [...prev, newWindow]);
    setActiveWindow(id);
    setStartMenuOpen(false);
  }, [windows, minimizedWindows]);

  const closeWindow = useCallback((windowId) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    setMinimizedWindows(prev => prev.filter(id => id !== windowId));
    
    if (activeWindow === windowId) {
      const remainingWindows = windows.filter(w => 
        w.id !== windowId && !minimizedWindows.includes(w.id)
      );
      setActiveWindow(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null);
    }
  }, [windows, minimizedWindows, activeWindow]);

  const minimizeWindow = useCallback((windowId) => {
    if (!minimizedWindows.includes(windowId)) {
      setMinimizedWindows(prev => [...prev, windowId]);
    }
    
    if (activeWindow === windowId) {
      const visibleWindows = windows.filter(w => 
        w.id !== windowId && !minimizedWindows.includes(w.id)
      );
      setActiveWindow(visibleWindows.length > 0 ? visibleWindows[visibleWindows.length - 1].id : null);
    }
  }, [windows, minimizedWindows, activeWindow]);

  const restoreWindow = useCallback((windowId) => {
    setMinimizedWindows(prev => prev.filter(id => id !== windowId));
    setActiveWindow(windowId);
  }, []);

  const activateWindow = useCallback((windowId) => {
    if (activeWindow !== windowId) {
      setActiveWindow(windowId);
      setWindows(prev => prev.map(w => ({
        ...w,
        zIndex: w.id === windowId ? Math.max(...prev.map(w => w.zIndex)) + 1 : w.zIndex
      })));
    }
  }, [activeWindow]);

  const handleNewNotepad = useCallback(() => {
    const newFile = {
      id: 'temp',
      name: 'Untitled.txt',
      content: '',
      type: 'text',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    addWindow(
      'notepad',
      'Untitled.txt - Notepad',
      '📝',
      <Notepad file={newFile} onClose={() => closeWindow('notepad')} />
    );
  }, [addWindow, closeWindow]);

  const handleOpenFile = useCallback((file) => {
    addWindow(
      'notepad',
      `${file.name} - Notepad`,
      '📝',
      <Notepad file={file} onClose={() => closeWindow('notepad')} />
    );
  }, [addWindow, closeWindow]);

  const toggleFileExplorer = useCallback(() => {
    addWindow('explorer', 'File Explorer', '📁', <FileExplorer onOpenFile={handleOpenFile} />);
  }, [addWindow, handleOpenFile]);

  const toggleAboutWindow = useCallback(() => {
    addWindow('about', 'About OS32.exe', 'ℹ️', <AboutWindow onClose={() => closeWindow('about')} />);
    setStartMenuOpen(false);
  }, [addWindow, closeWindow]);

  const toggleInternetExplorer = useCallback(() => {
    addWindow('explorer', 'Internet Explorer', '🌐', <InternetExplorer />);
    setStartMenuOpen(false);
  }, [addWindow]);

  const toggleUserProfile = useCallback(() => {
    addWindow('profile', 'User Profile', '👤', <UserProfile onLogout={handleLogoutClick} />);
    setStartMenuOpen(false);
  }, [addWindow]);

  const handleLoginClick = useCallback(() => {
    setShowLoginModal(true);
    setStartMenuOpen(false);
  }, []);

  const handleLogoutClick = useCallback(async () => {
    try {
      await logOut();
      setStartMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logOut]);

  const toggleStickyNotes = useCallback(() => {
    setShowStickyNotes(prev => !prev);
    setStartMenuOpen(false);
  }, []);

  const handleDesktopClick = useCallback((e) => {
    if (startMenuOpen && !e.target.closest('.start-menu') && !e.target.closest('.win-start-button')) {
      setStartMenuOpen(false);
    }
  }, [startMenuOpen]);

  const formatDate = useCallback((date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <div className="winxp-desktop" onClick={handleDesktopClick}>
      {/* Desktop Icons */}
      <div className="desktop-icons">
        <div className="desktop-icon" onClick={toggleFileExplorer} onDoubleClick={toggleFileExplorer}>
          <div className="icon">📁</div>
          <div className="icon-text">My Documents</div>
        </div>

        <div className="desktop-icon" onClick={handleNewNotepad} onDoubleClick={handleNewNotepad}>
          <div className="icon">📝</div>
          <div className="icon-text">Notepad</div>
        </div>

        {games.map(game => (
          <div key={game.id} className="desktop-icon" onClick={() => navigate(`/game/${game.id}`)} onDoubleClick={() => navigate(`/game/${game.id}`)}>
            <div className="icon">{game.icon}</div>
            <div className="icon-text">{game.title}</div>
          </div>
        ))}
        
        <div className="desktop-icon" onClick={toggleInternetExplorer} onDoubleClick={toggleInternetExplorer}>
          <div className="icon">🌐</div>
          <div className="icon-text">Internet Explorer</div>
        </div>

        {currentUser && (
          <div className="desktop-icon" onClick={toggleUserProfile} onDoubleClick={toggleUserProfile}>
            <div className="icon">👤</div>
            <div className="icon-text">My Profile</div>
          </div>
        )}
      </div>
      
      {/* Sticky Notes */}
      {showStickyNotes && (
        <>
          <StickyNote 
            title="WordSweeper Leaderboard" 
            initialPosition={{ x: windowSize.width - 320, y: 50 }}
            color="#ffff88"
            onClose={() => setShowStickyNotes(false)}
          >
            <Leaderboard collectionName="wordsweeper" title="WordSweeper Top Scores" />
          </StickyNote>
          
          {showRefinerLeaderboard && (
            <RefinerLeaderboardToggle
              initialPosition={{ x: windowSize.width - 320, y: 350 }}
              onClose={() => setShowRefinerLeaderboard(false)}
            />
          )}
        </>
      )}
      
      {/* Windows */}
      {windows.map(window => {
        const isMinimized = minimizedWindows.includes(window.id);
        if (isMinimized) return null;

        return (
          <Window
            key={window.id}
            title={window.title}
            icon={window.icon}
            isActive={activeWindow === window.id}
            initialPosition={window.position}
            initialSize={window.size}
            isMaximized={window.isMaximized}
            zIndex={window.zIndex}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            onMaximize={(isMax) => {
              setWindows(prev => prev.map(w => 
                w.id === window.id ? { ...w, isMaximized: isMax } : w
              ));
            }}
            onClick={() => activateWindow(window.id)}
          >
            {window.component}
          </Window>
        );
      })}
      
      {/* Taskbar */}
      <div className="taskbar">
        <div className={`win-start-button ${startMenuOpen ? 'active' : ''}`} onClick={() => setStartMenuOpen(prev => !prev)}>
          <div className="start-logo"></div>
          <span>Start</span>
        </div>
        
        <div className="quick-launch">
          <div className="quick-launch-item" onClick={toggleInternetExplorer}>
            <div className="quick-icon">🌐</div>
          </div>
          <div className="quick-launch-item" onClick={toggleFileExplorer}>
            <div className="quick-icon">📁</div>
          </div>
          <div className="separator"></div>
        </div>
        
        <div className="taskbar-windows">
          {windows.map(window => {
            const isMinimized = minimizedWindows.includes(window.id);
            return (
              <div 
                key={window.id}
                className={`taskbar-window ${activeWindow === window.id && !isMinimized ? 'active' : ''}`}
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
              <img src={currentUser.photoURL || '/default-avatar.png'} alt={currentUser.displayName || 'User'} />
            </div>
          )}
          <div 
            className="tray-icon" 
            onClick={toggleStickyNotes}
            title={showStickyNotes ? "Hide Leaderboards" : "Show Leaderboards"}
          >
            🏆
          </div>
          <div className="tray-icon connection-indicator" title={isOnline ? "Online" : "Offline"}>
            {isOnline ? "🟢" : "🔴"}
          </div>
          <div className="time">{formatDate(currentTime)}</div>
        </div>
      </div>
      
      {/* Start Menu */}
      {startMenuOpen && (
        <div className="start-menu">
          <div className="start-menu-header">
            {currentUser ? (
              <div className="start-user-info">
                <div className="start-user-avatar">
                  <img src={currentUser.photoURL || '/default-avatar.png'} alt={currentUser.displayName || 'User'} />
                </div>
                <div className="start-user-name">{currentUser.displayName || 'User'}</div>
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
              <div className="start-menu-item" onClick={toggleFileExplorer}>
                <div className="start-menu-icon">📁</div>
                <div className="start-menu-text">My Documents</div>
              </div>
              
              <div className="start-menu-item" onClick={handleNewNotepad}>
                <div className="start-menu-icon">📝</div>
                <div className="start-menu-text">Notepad</div>
              </div>
              
              <div className="start-menu-separator" />
              
              <div className="start-menu-item" onClick={toggleStickyNotes}>
                <div className="start-menu-icon">🏆</div>
                <div className="start-menu-text">
                  {showStickyNotes ? "Hide Leaderboards" : "Show Leaderboards"}
                </div>
              </div>
              <div className="start-menu-separator" />
              <div className="start-menu-item" onClick={toggleInternetExplorer}>
                <div className="start-menu-icon">🌐</div>
                <div className="start-menu-text">Internet Explorer</div>
              </div>
              {games.map(game => (
                <div 
                  key={game.id} 
                  className="start-menu-item"
                  onClick={() => {
                    const GameComponent = GAME_COMPONENTS[game.id];
                    addWindow(game.id, game.title, game.icon, <GameComponent />);
                  }}
                >
                  <div className="start-menu-icon">{game.icon}</div>
                  <div className="start-menu-text">{game.title}</div>
                </div>
              ))}
            </div>
            
            <div className="start-menu-right">
              <div className="start-menu-item" onClick={toggleAboutWindow}>
                <div className="start-menu-icon">ℹ️</div>
                <div className="start-menu-text">About</div>
              </div>
              {currentUser ? (
                <>
                  <div className="start-menu-item" onClick={toggleUserProfile}>
                    <div className="start-menu-icon">👤</div>
                    <div className="start-menu-text">My Profile</div>
                  </div>
                  <div className="start-menu-item" onClick={handleLogoutClick}>
                    <div className="start-menu-icon">🚪</div>
                    <div className="start-menu-text">Sign Out</div>
                  </div>
                </>
              ) : (
                <div className="start-menu-item" onClick={handleLoginClick}>
                  <div className="start-menu-icon">🔑</div>
                  <div className="start-menu-text">Sign In</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Login Modal */}
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