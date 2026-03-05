import { useState, memo } from 'react';
import './Minecraft.css';
import soundService from '../../services/soundService';

const MINECRAFT_URL = 'https://classic.minecraft.net';

const Minecraft = memo(() => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleMenu = (menu) => {
    setActiveMenu(prev => prev === menu ? null : menu);
  };

  return (
    <div className="mc-app" onClick={() => setActiveMenu(null)}>
      <div className="mc-menu-bar">
        <div
          className={`mc-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}
        >
          <span>File</span>
          <div className="mc-menu-dropdown">
            <div className="mc-menu-option" onClick={() => { soundService.play('click'); setIsLoading(true); document.getElementById('mc-iframe').src = MINECRAFT_URL; setActiveMenu(null); }}>
              New Game
            </div>
            <div className="mc-menu-separator" />
            <div className="mc-menu-option" onClick={() => { window.location.href = '/'; }}>Exit</div>
          </div>
        </div>
        <div
          className={`mc-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleMenu('help'); }}
        >
          <span>Help</span>
          <div className="mc-menu-dropdown">
            <div className="mc-menu-option" onClick={(e) => { e.stopPropagation(); window.open(MINECRAFT_URL, '_blank'); setActiveMenu(null); }}>
              Open in Browser
            </div>
          </div>
        </div>
      </div>

      <div className="mc-frame-wrapper">
        {isLoading && (
          <div className="mc-loading">
            <div className="mc-loading-box">
              <div className="mc-loading-title">Minecraft Classic</div>
              <div className="mc-loading-bar-wrap">
                <div className="mc-loading-bar" />
              </div>
              <div className="mc-loading-text">Loading...</div>
            </div>
          </div>
        )}
        <iframe
          id="mc-iframe"
          src={MINECRAFT_URL}
          title="Minecraft Classic"
          className="mc-iframe"
          onLoad={() => setIsLoading(false)}
          allow="fullscreen; autoplay"
          sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
        />
      </div>
    </div>
  );
});

export default Minecraft;
