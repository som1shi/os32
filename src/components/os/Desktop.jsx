import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Desktop.css';
import Window from './Window';
import AboutWindow from './AboutWindow';

import Minesweeper from '../games/Minesweeper/Minesweeper';
import QuantumChess from '../games/QuantumChess/QuantumChess';
import RotateConnectFour from '../games/RotateConnectFour/RotateConnectFour';
import Refiner from '../games/Refiner/Refiner';
import WikiConnect from '../games/WikiConnect/WikiConnect';

const Desktop = ({ games }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [showAbout, setShowAbout] = useState(false);
  
  const gameComponents = {
    'minesweeper': Minesweeper,
    'quantumchess': QuantumChess,
    'rotateconnectfour': RotateConnectFour,
    'refiner': Refiner,
    'wikiconnect': WikiConnect
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
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
        
      </div>
      
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
      
      <div className="taskbar">
        <div 
          className={`win-start-button ${startMenuOpen ? 'active' : ''}`}
          onClick={toggleStartMenu}
        >
          <div className="start-logo"></div>
          <span>Start</span>
        </div>
        
        <div className="quick-launch">
          <div className="quick-launch-item">
            <div className="quick-icon">🌐</div>
          </div>
          <div className="quick-launch-item">
            <div className="quick-icon">📧</div>
          </div>
          <div className="separator"></div>
        </div>
        
        <div className="taskbar-items">
          {openWindows.map(window => {
            const isMinimized = minimizedWindows.includes(window.id);
            const isActive = activeWindowId === window.id && !isMinimized;
            
            return (
              <div 
                key={window.id}
                className={`taskbar-item ${isActive ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`}
                onClick={() => isMinimized ? restoreWindow(window.id) : activateWindow(window.id)}
              >
                <div className="taskbar-icon">{window.icon}</div>
                <div className="taskbar-text">{window.title}</div>
              </div>
            );
          })}
        </div>
        
        <div className="system-tray">
          <div className="tray-icon">🔊</div>
          <div className="tray-icon">🔌</div>
          <div className="time">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
      
      {startMenuOpen && (
        <div className="start-menu">
          <div className="start-header">
            <div className="user-info">
              <div className="user-avatar">👤</div>
              <div className="user-name">User</div>
            </div>
          </div>
          
          <div className="start-content">
            <div className="start-left">
              <div className="pinned-programs">
                <div className="program-item internet-explorer">
                  <div className="program-icon">🌐</div>
                  <div className="program-name">Internet Explorer</div>
                </div>
                <div className="program-item email">
                  <div className="program-icon">📧</div>
                  <div className="program-name">Email</div>
                </div>
                
                <div className="separator"></div>
                
                {games.map(game => (
                  <div 
                    key={game.id} 
                    className="program-item"
                    onClick={() => handleIconClick(game.id)}
                  >
                    <div className="program-icon">{game.icon}</div>
                    <div className="program-name">{game.title}</div>
                  </div>
                ))}
                
                <div className="separator"></div>
                
                <div 
                  className="program-item"
                  onClick={toggleAboutWindow}
                >
                  <div className="program-icon">ℹ️</div>
                  <div className="program-name">About Games Collection</div>
                </div>
              </div>
            </div>
            
            <div className="start-right">
              <div className="system-item my-documents">
                <div className="system-icon">📁</div>
                <div className="system-name">My Documents</div>
              </div>
              <div className="system-item my-pictures">
                <div className="system-icon">🖼️</div>
                <div className="system-name">My Pictures</div>
              </div>
              <div className="system-item my-music">
                <div className="system-icon">🎵</div>
                <div className="system-name">My Music</div>
              </div>
              <div className="system-item my-computer">
                <div className="system-icon">💻</div>
                <div className="system-name">My Computer</div>
              </div>
              
              <div className="separator"></div>
              
              <div className="system-item control-panel">
                <div className="system-icon">⚙️</div>
                <div className="system-name">Control Panel</div>
              </div>
              
              <div className="separator"></div>
              
              <div className="system-item log-off">
                <div className="system-icon">🔒</div>
                <div className="system-name">Log Off</div>
              </div>
              <div className="system-item shut-down">
                <div className="system-icon">⏻</div>
                <div className="system-name">Shut Down</div>
              </div>
            </div>
          </div>
          
          <div className="start-footer">
            <div className="all-programs">
              <div className="all-programs-icon">▶</div>
              <div className="all-programs-text">All Programs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Desktop; 