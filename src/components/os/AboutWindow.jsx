import React from 'react';
import './AboutWindow.css';

const AboutWindow = ({ onClose }) => {
  return (
    <div className="about-content">
      <div className="about-header">
        <div className="about-logo">🎮</div>
        <h2>Games Collection</h2>
        <div className="about-version">Version 1.0</div>
      </div>
      
      <div className="about-description">
        <p>A collection of fun and challenging games inspired by classic and modern concepts.</p>
        <p>Built with React and styled to resemble the classic Windows XP interface.</p>
      </div>
      
      <div className="about-games">
        <h3>Included Games:</h3>
        <ul>
          <li><strong>WordSweeper</strong> - The Classic Minesweeper game with a twist.</li>
          <li><strong>Schrödinger's Chess</strong> - Chess where pieces exist in quantum superposition until observed.</li>
          <li><strong>Rotate Connect Four</strong> - Connect Four with dice rolls and board rotation mechanics.</li>
          <li><strong>Refiner</strong> - Sort scary numbers in this Severance-inspired terminal game.</li>
          <li><strong>WikiConnect</strong> - Navigate through Wikipedia to connect two random articles.</li>
        </ul>
      </div>
      
      <div className="about-footer">
        <button className="about-button" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default AboutWindow; 