import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
import IPodPlayer from '../iPodPlayer';
import Terminal from '../Terminal/Terminal';
import CodeEditor from '../CodeEditor/CodeEditor';

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
  const [isOnline, setIsOnline] = useState(true);
  const [windowSize, setWindowSize] = useState(INITIAL_WINDOW_SIZE);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    const removeConnectionListener = addConnectionStateListener(setIsOnline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
      removeConnectionListener();
    };
  }, []);

  const addWindow = useCallback((id, title, icon, component) => {
    setWindows(prev => {
      const existingWindowIndex = prev.findIndex(w => w.id === id);
      
      if (existingWindowIndex !== -1) {
        if (minimizedWindows.includes(id)) {
          setMinimizedWindows(prevMinimized => prevMinimized.filter(wId => wId !== id));
        }
        setActiveWindow(id);
        return prev;
      }

      const newWindow = {
        id,
        title,
        icon,
        component,
        isMaximized: false,
        position: { x: 50 + (prev.length * 30), y: 50 + (prev.length * 30) },
        size: { width: 800, height: 600 },
        zIndex: prev.length + 1
      };
      
      setActiveWindow(id);
      setStartMenuOpen(false);
      return [...prev, newWindow];
    });
  }, [minimizedWindows]);

  const closeWindow = useCallback((windowId) => {
    setWindows(prev => {
      const filteredWindows = prev.filter(w => w.id !== windowId);
      
      if (activeWindow === windowId) {
        const remainingWindows = filteredWindows.filter(w => !minimizedWindows.includes(w.id));
        setActiveWindow(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null);
      }
      
      return filteredWindows;
    });
    
    setMinimizedWindows(prev => prev.filter(id => id !== windowId));
  }, [activeWindow, minimizedWindows]);

  const minimizeWindow = useCallback((windowId) => {
    if (!minimizedWindows.includes(windowId)) {
      setMinimizedWindows(prev => [...prev, windowId]);
    }
    
    if (activeWindow === windowId) {
      setWindows(prev => {
        const visibleWindows = prev.filter(w => w.id !== windowId && !minimizedWindows.includes(w.id));
        setActiveWindow(visibleWindows.length > 0 ? visibleWindows[visibleWindows.length - 1].id : null);
        return prev;
      });
    }
  }, [activeWindow, minimizedWindows]);

  const restoreWindow = useCallback((windowId) => {
    setMinimizedWindows(prev => prev.filter(id => id !== windowId));
    setActiveWindow(windowId);
  }, []);

  const activateWindow = useCallback((windowId) => {
    if (activeWindow !== windowId) {
      setActiveWindow(windowId);
      setWindows(prev => {
        const maxZIndex = Math.max(...prev.map(w => w.zIndex));
        return prev.map(w => ({
          ...w,
          zIndex: w.id === windowId ? maxZIndex + 1 : w.zIndex
        }));
      });
    }
  }, [activeWindow]);

  const handleNewNotepad = useCallback(() => {
    const newFile = {
      id: `temp-${Date.now()}`,
      name: 'Untitled.txt',
      content: '',
      type: 'text',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    addWindow(
      `notepad-${Date.now()}`,
      'Untitled.txt - Notepad',
      '📝',
      <Notepad 
        file={newFile} 
        onClose={() => closeWindow(`notepad-${Date.now()}`)} 
      />
    );
  }, [addWindow, closeWindow]);

  const toggleCodeEditor = useCallback((file = null) => {
    const windowId = `codeeditor-${file ? file.id : Date.now()}`;
    const initialTitle = file ? `${file.name} - Code Editor` : 'Untitled.py - Code Editor';
    
    addWindow(
      windowId,
      initialTitle,
      '👨‍💻',
      <CodeEditor 
        file={file}
        onClose={() => closeWindow(windowId)} 
        setWindowTitle={(title) => {
          setWindows(prev => prev.map(w => 
            w.id === windowId ? { ...w, title } : w
          ));
        }}
      />
    );
    setStartMenuOpen(false);
  }, [addWindow, closeWindow, setWindows]);

  const handleOpenFile = useCallback((file) => {
    if (!file || !file.id) return;
    
    if (file.name.toLowerCase().endsWith('.py') || file.name.toLowerCase().endsWith('.pyg')) {
      toggleCodeEditor(file);
      return;
    }
    const notepadId = `notepad-${file.id}`;
    addWindow(
      notepadId,
      `${file.name} - Notepad`,
      '📝',
      <Notepad 
        file={file} 
        onClose={() => closeWindow(notepadId)} 
      />
    );
  }, [addWindow, closeWindow, toggleCodeEditor]);

  const toggleFileExplorer = useCallback(() => {
    addWindow(
      'explorer',
      'File Explorer',
      '📁',
      <FileExplorer onOpenFile={handleOpenFile} />
    );
  }, [addWindow, handleOpenFile]);

  const toggleAboutWindow = useCallback(() => {
    addWindow(
      'about',
      'About OS32.exe',
      'ℹ️',
      <AboutWindow onClose={() => closeWindow('about')} />
    );
    setStartMenuOpen(false);
  }, [addWindow, closeWindow]);

  const toggleInternetExplorer = useCallback(() => {
    addWindow('internet', 'Internet Explorer', '🌐', <InternetExplorer />);
    setStartMenuOpen(false);
  }, [addWindow]);

  const toggleUserProfile = useCallback(() => {
    addWindow('profile', 'User Profile', '👤', <UserProfile onLogout={logOut} />);
    setStartMenuOpen(false);
  }, [addWindow, logOut]);

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

  const toggleIPodPlayer = useCallback(() => {
    addWindow(
      'ipod-player',
      'Music Player',
      '🎵',
      <IPodPlayer onClose={() => closeWindow('ipod-player')} />
    );
    setStartMenuOpen(false);
  }, [addWindow, closeWindow]);

  const toggleTerminal = useCallback(() => {
    addWindow(
      'terminal',
      'Terminal',
      '🖥️',
      <Terminal onLaunchApp={(appId) => {
        switch (appId) {
          case 'explorer':
            toggleFileExplorer();
            break;
          case 'notepad':
            handleNewNotepad();
            break;
          case 'terminal':
            break;
          case 'internet':
            toggleInternetExplorer();
            break;
          case 'ipod-player':
            toggleIPodPlayer();
            break;
          case 'codeeditor':
            toggleCodeEditor();
            break;
          default:
            break;
        }
      }} />
    );
    setStartMenuOpen(false);
  }, [addWindow, toggleFileExplorer, handleNewNotepad, toggleInternetExplorer, toggleIPodPlayer, toggleCodeEditor]);

  const desktopIcons = useMemo(() => (
    <div className="desktop-icons">
      <div className="desktop-icon" onClick={toggleFileExplorer}>
        <div className="icon">📁</div>
        <div className="icon-text">Documents</div>
      </div>

      <div className="desktop-icon" onClick={handleNewNotepad}>
        <div className="icon">📝</div>
        <div className="icon-text">Notepad</div>
      </div>

      <div className="desktop-icon" onClick={toggleTerminal}>
        <div className="icon">🖥️</div>
        <div className="icon-text">Terminal</div>
      </div>

      <div className="desktop-icon" onClick={toggleCodeEditor}>
        <div className="icon">👨‍💻</div>
        <div className="icon-text">Code Editor</div>
      </div>

      {games.map(game => (
        <div 
          key={game.id} 
          className="desktop-icon" 
          onClick={() => navigate(`/game/${game.id}`)}
        >
          <div className="icon">{game.icon}</div>
          <div className="icon-text">{game.title}</div>
        </div>
      ))}
      
      <div className="desktop-icon" onClick={toggleInternetExplorer}>
        <div className="icon">🌐</div>
        <div className="icon-text">Internet Explorer</div>
      </div>

      <div className="desktop-icon" onClick={toggleIPodPlayer}>
        <div className="icon">🎵</div>
        <div className="icon-text">Music Player</div>
      </div>

      {currentUser && (
        <div className="desktop-icon" onClick={toggleUserProfile}>
          <div className="icon">👤</div>
          <div className="icon-text">My Profile</div>
        </div>
      )}
    </div>
  ), [
    currentUser, 
    games, 
    handleNewNotepad, 
    navigate, 
    toggleFileExplorer, 
    toggleInternetExplorer, 
    toggleIPodPlayer, 
    toggleUserProfile,
    toggleTerminal,
    toggleCodeEditor
  ]);

  const renderWindows = useMemo(() => (
    windows.map(window => {
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
    })
  ), [windows, minimizedWindows, activeWindow, closeWindow, minimizeWindow, activateWindow]);

  const taskbarWindows = useMemo(() => (
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
  ), [windows, minimizedWindows, activeWindow, restoreWindow, activateWindow]);

  const startMenu = useMemo(() => (
    startMenuOpen && (
      <div className="start-menu">
        <div className="start-menu-header">
          {currentUser ? (
            <div className="start-user-info">
              <div className="start-user-avatar">
                <img 
                  src={currentUser.photoURL || '/default-avatar.svg'} 
                  alt={currentUser.displayName || 'User'} 
                />
              </div>
              <div className="start-user-name">{currentUser.displayName || 'User'}</div>
            </div>
          ) : (
            <div className="start-user-info">
              <div className="start-user-avatar">
                <img src="/default-avatar.svg" alt="Guest" />
              </div>
              <div className="start-user-name">Guest</div>
            </div>
          )}
        </div>
        
        <div className="start-menu-items">
          <div className="start-menu-left">
            <div className="start-menu-item" onClick={toggleFileExplorer}>
              <div className="start-menu-icon">📁</div>
              <div className="start-menu-text">Documents</div>
            </div>
            
            <div className="start-menu-item" onClick={handleNewNotepad}>
              <div className="start-menu-icon">📝</div>
              <div className="start-menu-text">Notepad</div>
            </div>
            
            <div className="start-menu-item" onClick={toggleTerminal}>
              <div className="start-menu-icon">🖥️</div>
              <div className="start-menu-text">Terminal</div>
            </div>
            
            <div className="start-menu-item" onClick={toggleCodeEditor}>
              <div className="start-menu-icon">👨‍💻</div>
              <div className="start-menu-text">Code Editor</div>
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
            <div className="start-menu-item" onClick={toggleIPodPlayer}>
              <div className="start-menu-icon">🎵</div>
              <div className="start-menu-text">Music Player</div>
            </div>
            {games.map(game => (
              <div 
                key={game.id} 
                className="start-menu-item"
                onClick={() => {
                  const GameComponent = GAME_COMPONENTS[game.id];
                  if (GameComponent) {
                    addWindow(game.id, game.title, game.icon, <GameComponent />);
                  }
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
    )
  ), [
    startMenuOpen,
    currentUser,
    games,
    handleLoginClick,
    handleLogoutClick,
    handleNewNotepad,
    toggleAboutWindow,
    toggleFileExplorer,
    toggleInternetExplorer,
    toggleIPodPlayer,
    toggleStickyNotes,
    toggleUserProfile,
    showStickyNotes,
    addWindow,
    toggleTerminal,
    toggleCodeEditor
  ]);

  return (
    <div className="winxp-desktop" onClick={handleDesktopClick}>
      {desktopIcons}
      
      {showStickyNotes && (
        <StickyNote 
          title="Leaderboard" 
          initialPosition={{ x: windowSize.width - 320, y: 50 }}
          color="#ffff88"
          onClose={() => setShowStickyNotes(false)}
        >
          <Leaderboard initialGame="wordsweeper" limitCount={5} />
        </StickyNote>
      )}
      
      {renderWindows}
      
      <div className="taskbar">
        <div 
          className={`win-start-button ${startMenuOpen ? 'active' : ''}`} 
          onClick={() => setStartMenuOpen(prev => !prev)}
        >
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
          <div className="quick-launch-item" onClick={toggleIPodPlayer}>
            <div className="quick-icon">🎵</div>
          </div>
          <div className="quick-launch-item" onClick={toggleTerminal}>
            <div className="quick-icon">🖥️</div>
          </div>
          <div className="separator"></div>
        </div>
        
        {taskbarWindows}
        
        <div className="system-tray">
          {currentUser && (
            <div 
              className="user-avatar-small"
              onClick={toggleUserProfile}
              title={currentUser.displayName || 'User Profile'}
            >
              <img 
                src={currentUser.photoURL || '/default-avatar.svg'} 
                alt={currentUser.displayName || 'User'} 
                onError={(e) => {e.target.src = '/default-avatar.svg'}} 
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
          <div className="tray-icon connection-indicator" title={isOnline ? "Online" : "Offline"}>
            {isOnline ? "🟢" : "🔴"}
          </div>
          <div className="time">{formatDate(currentTime)}</div>
        </div>
      </div>
      
      {startMenu}
      
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

export default memo(Desktop);