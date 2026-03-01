import React from 'react';
import './AboutWindow.css';
import AppIcon from './../ui/AppIcon';
import { ICON_KEYS } from '../../config/iconRegistry';

const AboutWindow = ({ onClose }) => {
  return (
    <div className="about-content">
      <div className="about-header">
        <div className="about-logo"><AppIcon name={ICON_KEYS.app.about} size={48} /></div>
        <h2>os32.exe</h2>
        <div className="about-version">Version 2.0</div>
      </div>

      <div className="about-description">
        <p>A Windows XP-inspired operating system interface built with modern web technologies. Experience the nostalgia of the classic Windows XP design while enjoying modern applications and games.</p>
        <p>Developed using React and featuring a suite of productivity tools including Notepad and File Explorer, alongside a collection of unique games that blend classic concepts with innovative mechanics.</p>
      </div>

      <div className="about-games">
        <h3>Applications & Games:</h3>
        <ul>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.game.wordsweeper} size={20} /> <strong>WordSweeper</strong> - A word-based reimagining of the classic Minesweeper.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.game.quantumchess} size={20} /> <strong>Schrödinger's Chess</strong> - A quantum twist on chess where pieces exist in multiple states.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.game.rotateconnectfour} size={20} /> <strong>Rotate Connect Four</strong> - Strategic Connect Four with dynamic board rotation.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.game.refiner} size={20} /> <strong>Refiner</strong> - A terminal-based number sorting game inspired by corporate dystopias.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.game.wikiconnect} size={20} /> <strong>WikiConnect</strong> - Test your knowledge by finding paths between Wikipedia articles.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.game.colormania} size={20} /> <strong>ColorMania</strong> - Match colors of adjacent tiles to fill the board and earn points.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.game.dosemulator} size={20} /> <strong>Emulator</strong> - Classic DOS game emulator to browse and play legendary 90s titles.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.terminal} size={20} /> <strong>Terminal</strong> - A command-line interface featuring the Miracode font.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.codeEditor} size={20} /> <strong>Code Editor</strong> - A versatile editor for Python programming and PYG.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.internet} size={20} /> <strong>Internet Explorer</strong> - A nostalgic recreation of the classic web browser.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.documents} size={20} /> <strong>File Explorer</strong> - Manage your documents with this familiar interface.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.notepad} size={20} /> <strong>Notepad</strong> - A simple yet effective text editor for your writing needs.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.music} size={20} /> <strong>Music Player</strong> - An iPod-inspired music player for your listening enjoyment.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.leaderboard} size={20} /> <strong>Leaderboard</strong> - Global high scores and player rankings.</li>
          <li className="about-list-item"><AppIcon name={ICON_KEYS.app.profile} size={20} /> <strong>Profile</strong> - View and manage your user account settings.</li>
        </ul>
      </div>

      <div className="about-footer">
        <button className="about-button" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default AboutWindow; 