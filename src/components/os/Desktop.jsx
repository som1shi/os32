import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Window from './Window';
import AboutWindow from './AboutWindow';
import InternetExplorer from './InternetExplorer';
import FileExplorer from '../FileExplorer/FileExplorer';
import Modal from '../Modal';
import Login from '../Login';
import Leaderboard from '../Leaderboard';
import UserProfile from '../UserProfile';
import IPodPlayer from '../iPodPlayer';
import Terminal from '../Terminal/Terminal';
import CodeEditor from '../CodeEditor/CodeEditor';
import AppIcon from '../ui/AppIcon';
import { ICON_KEYS } from '../../config/iconRegistry';

import Minesweeper from '../games/Minesweeper/Minesweeper';
import QuantumChess from '../games/QuantumChess/QuantumChess';
import RotateConnectFour from '../games/RotateConnectFour/RotateConnectFour';
import Refiner from '../games/Refiner/Refiner';
import WikiConnect from '../games/WikiConnect/WikiConnect';
import ColorMania from '../games/ColorMania/ColorMania';
import DOSEmulator from '../games/DOSEmulator/DOSEmulator';
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
  'wikiconnect': WikiConnect,
  'colormania': ColorMania,
  'dosemulator': DOSEmulator,
};
const Desktop = ({ games }) => {
  const { currentUser, logOut } = useAuth();

  const [windows, setWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
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

  const addWindow = useCallback((id, title, iconKey, component, options = {}) => {
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
        iconKey,
        component,
        isMaximized: options.isMaximized ?? false,
        position: options.position || { x: 50 + (prev.length * 30), y: 50 + (prev.length * 30) },
        size: options.size || { width: 800, height: 600 },
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
      ICON_KEYS.app.notepad,
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
      ICON_KEYS.app.codeEditor,
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
      ICON_KEYS.app.notepad,
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
      ICON_KEYS.app.documents,
      <FileExplorer onOpenFile={handleOpenFile} />
    );
  }, [addWindow, handleOpenFile]);

  const toggleAboutWindow = useCallback(() => {
    addWindow(
      'about',
      'About OS32.exe',
      ICON_KEYS.app.about,
      <AboutWindow onClose={() => closeWindow('about')} />
    );
    setStartMenuOpen(false);
  }, [addWindow, closeWindow]);

  const toggleInternetExplorer = useCallback(() => {
    addWindow('internet', 'Internet Explorer', ICON_KEYS.app.internet, <InternetExplorer />);
    setStartMenuOpen(false);
  }, [addWindow]);

  const toggleUserProfile = useCallback(() => {
    addWindow('profile', 'User Profile', ICON_KEYS.app.profile, <UserProfile onLogout={logOut} />);
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

  const toggleLeaderboard = useCallback(() => {
    const exists = windows.find(w => w.id === 'leaderboard');
    if (exists) {
      closeWindow('leaderboard');
    } else {
      addWindow(
        'leaderboard',
        'Leaderboard',
        ICON_KEYS.app.leaderboard,
        <Leaderboard initialGame="wordsweeper" limitCount={5} />,
        { size: { width: 340, height: 440 } }
      );
    }
    setStartMenuOpen(false);
  }, [windows, addWindow, closeWindow]);

  const handleDesktopClick = useCallback((e) => {
    if (startMenuOpen && !e.target.closest('.start-menu') && !e.target.closest('.win-start-button')) {
      setStartMenuOpen(false);
    }
  }, [startMenuOpen]);

  const handleKeyActivate = useCallback((event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);

  const asButtonProps = useCallback((action, label) => ({
    role: 'button',
    tabIndex: 0,
    onClick: action,
    onKeyDown: (event) => handleKeyActivate(event, action),
    'aria-label': label,
  }), [handleKeyActivate]);

  const formatDate = useCallback((date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const toggleIPodPlayer = useCallback(() => {
    addWindow(
      'ipod-player',
      'Music Player',
      ICON_KEYS.app.music,
      <IPodPlayer onClose={() => closeWindow('ipod-player')} />
    );
    setStartMenuOpen(false);
  }, [addWindow, closeWindow]);

  const toggleTerminal = useCallback(() => {
    addWindow(
      'terminal',
      'Terminal',
      ICON_KEYS.app.terminal,
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
      <div className="desktop-icon" {...asButtonProps(toggleFileExplorer, 'Open Documents')}>
        <div className="icon"><AppIcon name={ICON_KEYS.app.documents} size={44} /></div>
        <div className="icon-text">Documents</div>
      </div>

      <div className="desktop-icon" {...asButtonProps(handleNewNotepad, 'Open Notepad')}>
        <div className="icon"><AppIcon name={ICON_KEYS.app.notepad} size={44} /></div>
        <div className="icon-text">Notepad</div>
      </div>

      <div className="desktop-icon" {...asButtonProps(toggleTerminal, 'Open Terminal')}>
        <div className="icon"><AppIcon name={ICON_KEYS.app.terminal} size={44} /></div>
        <div className="icon-text">Terminal</div>
      </div>

      <div className="desktop-icon" {...asButtonProps(toggleCodeEditor, 'Open Code Editor')}>
        <div className="icon"><AppIcon name={ICON_KEYS.app.codeEditor} size={44} /></div>
        <div className="icon-text">Code Editor</div>
      </div>

      {games.map(game => (
        <div
          key={game.id}
          className="desktop-icon"
          {...asButtonProps(() => {
            const GameComponent = GAME_COMPONENTS[game.id];
            if (GameComponent) {
              addWindow(game.id, game.title, game.iconKey, <GameComponent />, (game.id === 'refiner' || game.id === 'doom') ? { isMaximized: true } : {});
            }
          }, `Launch ${game.title}`)}
        >
          <div className="icon"><AppIcon name={game.iconKey} size={44} /></div>
          <div className="icon-text">{game.title}</div>
        </div>
      ))}

      <div className="desktop-icon" {...asButtonProps(toggleInternetExplorer, 'Open Internet Explorer')}>
        <div className="icon"><AppIcon name={ICON_KEYS.app.internet} size={44} /></div>
        <div className="icon-text">Internet Explorer</div>
      </div>

      <div className="desktop-icon" {...asButtonProps(toggleIPodPlayer, 'Open Music Player')}>
        <div className="icon"><AppIcon name={ICON_KEYS.app.music} size={44} /></div>
        <div className="icon-text">Music Player</div>
      </div>

      {currentUser && (
        <div className="desktop-icon" {...asButtonProps(toggleUserProfile, 'Open My Profile')}>
          <div className="icon"><AppIcon name={ICON_KEYS.app.profile} size={44} /></div>
          <div className="icon-text">My Profile</div>
        </div>
      )}
    </div>
  ), [
    currentUser,
    games,
    handleNewNotepad,
    addWindow,
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
          icon={<AppIcon name={window.iconKey} size={14} />}
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
            {...asButtonProps(
              () => (isMinimized ? restoreWindow(window.id) : activateWindow(window.id)),
              `${isMinimized ? 'Restore' : 'Activate'} ${window.title}`
            )}
          >
            <div className="taskbar-icon"><AppIcon name={window.iconKey} size={14} /></div>
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
                  src={currentUser.photoURL || '/user.png'}
                  alt={currentUser.displayName || 'User'}
                />
              </div>
              <div className="start-user-name">{currentUser.displayName || 'User'}</div>
            </div>
          ) : (
            <div className="start-user-info">
              <div className="start-user-avatar">
                <img src="/user.png" alt="Guest" />
              </div>
              <div className="start-user-name">Guest</div>
            </div>
          )}
        </div>

        <div className="start-menu-items">
          <div className="start-menu-left">
            <div className="start-menu-item" {...asButtonProps(toggleFileExplorer, 'Open Documents')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.documents} size={18} /></div>
              <div className="start-menu-text">Documents</div>
            </div>

            <div className="start-menu-item" {...asButtonProps(handleNewNotepad, 'Open Notepad')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.notepad} size={18} /></div>
              <div className="start-menu-text">Notepad</div>
            </div>

            <div className="start-menu-item" {...asButtonProps(toggleTerminal, 'Open Terminal')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.terminal} size={18} /></div>
              <div className="start-menu-text">Terminal</div>
            </div>

            <div className="start-menu-item" {...asButtonProps(toggleCodeEditor, 'Open Code Editor')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.codeEditor} size={18} /></div>
              <div className="start-menu-text">Code Editor</div>
            </div>

            <div className="start-menu-separator" />

            <div className="start-menu-item" {...asButtonProps(toggleLeaderboard, 'Toggle Leaderboards')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.leaderboard} size={18} /></div>
              <div className="start-menu-text">Leaderboard</div>
            </div>
            <div className="start-menu-separator" />
            <div className="start-menu-item" {...asButtonProps(toggleInternetExplorer, 'Open Internet Explorer')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.internet} size={18} /></div>
              <div className="start-menu-text">Internet Explorer</div>
            </div>
            <div className="start-menu-item" {...asButtonProps(toggleIPodPlayer, 'Open Music Player')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.music} size={18} /></div>
              <div className="start-menu-text">Music Player</div>
            </div>
            {games.map(game => (
              <div
                key={game.id}
                className="start-menu-item"
                {...asButtonProps(() => {
                  const GameComponent = GAME_COMPONENTS[game.id];
                  if (GameComponent) {
                    addWindow(game.id, game.title, game.iconKey, <GameComponent />, game.id === 'refiner' ? { isMaximized: true } : {});
                  }
                }, `Launch ${game.title}`)}
              >
                <div className="start-menu-icon"><AppIcon name={game.iconKey} size={18} /></div>
                <div className="start-menu-text">{game.title}</div>
              </div>
            ))}
          </div>

          <div className="start-menu-right">
            <div className="start-menu-item" {...asButtonProps(toggleAboutWindow, 'Open About')}>
              <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.about} size={18} /></div>
              <div className="start-menu-text">About</div>
            </div>
            {currentUser ? (
              <>
                <div className="start-menu-item" {...asButtonProps(toggleUserProfile, 'Open My Profile')}>
                  <div className="start-menu-icon"><AppIcon name={ICON_KEYS.app.profile} size={18} /></div>
                  <div className="start-menu-text">My Profile</div>
                </div>
                <div className="start-menu-item" {...asButtonProps(handleLogoutClick, 'Sign out')}>
                  <div className="start-menu-icon"><AppIcon name={ICON_KEYS.system.signOut} size={18} /></div>
                  <div className="start-menu-text">Sign Out</div>
                </div>
              </>
            ) : (
              <div className="start-menu-item" {...asButtonProps(handleLoginClick, 'Sign in')}>
                <div className="start-menu-icon"><AppIcon name={ICON_KEYS.system.signIn} size={18} /></div>
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
    toggleLeaderboard,
    toggleUserProfile,
    addWindow,
    toggleTerminal,
    toggleCodeEditor
  ]);

  return (
    <div className="winxp-desktop" onClick={handleDesktopClick}>
      {desktopIcons}

      {renderWindows}

      <div className="taskbar">
        <div
          className={`win-start-button ${startMenuOpen ? 'active' : ''}`}
          {...asButtonProps(() => setStartMenuOpen(prev => !prev), startMenuOpen ? 'Close Start menu' : 'Open Start menu')}
        >
          <div className="start-logo-ascii" style={{
            fontSize: '2px',
            lineHeight: '1.2',
            marginLeft: '-5px',
            marginRight: '6px',
            fontFamily: 'monospace',
            textShadow: 'none',
            display: 'flex',
            alignItems: 'center'
          }}>
            <pre style={{ color: '#ECE9D8', margin: 0 }}>{`██████╗ \n╚════██╗\n █████╔╝\n ╚═══██╗\n██████╔╝\n╚═════╝ `}</pre>
            <pre style={{ color: '#ECE9D8', margin: 0 }}>{`██████╗\n╚════██╗\n █████╔╝\n██╔═══╝\n███████╗\n╚══════╝`}</pre>
          </div>
          <span>Start</span>
        </div>

        <div className="quick-launch">
          <div className="quick-launch-item" {...asButtonProps(toggleInternetExplorer, 'Open Internet Explorer')}>
            <div className="quick-icon"><AppIcon name={ICON_KEYS.app.internet} size={14} /></div>
          </div>
          <div className="quick-launch-item" {...asButtonProps(toggleFileExplorer, 'Open Documents')}>
            <div className="quick-icon"><AppIcon name={ICON_KEYS.app.documents} size={14} /></div>
          </div>
          <div className="quick-launch-item" {...asButtonProps(toggleIPodPlayer, 'Open Music Player')}>
            <div className="quick-icon"><AppIcon name={ICON_KEYS.app.music} size={14} /></div>
          </div>
          <div className="quick-launch-item" {...asButtonProps(toggleTerminal, 'Open Terminal')}>
            <div className="quick-icon"><AppIcon name={ICON_KEYS.app.terminal} size={14} /></div>
          </div>
          <div className="separator"></div>
        </div>

        {taskbarWindows}

        <div className="system-tray">
          {currentUser && (
            <div
              className="user-avatar-small"
              {...asButtonProps(toggleUserProfile, 'Open user profile')}
              title={currentUser.displayName || 'User Profile'}
            >
              <img
                src={currentUser.photoURL || '/user.png'}
                alt={currentUser.displayName || 'User'}
                onError={(e) => { e.target.src = '/user.png' }}
              />
            </div>
          )}
          <div
            className="tray-icon"
            {...asButtonProps(toggleLeaderboard, 'Toggle leaderboards')}
            title="Leaderboard"
          >
            <AppIcon name={ICON_KEYS.app.leaderboard} size={14} />
          </div>
          <div className="tray-icon connection-indicator" title={isOnline ? "Online" : "Offline"}>
            <AppIcon
              name={isOnline ? ICON_KEYS.status.online : ICON_KEYS.status.offline}
              size={12}
              state={isOnline ? 'active' : 'offline'}
            />
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