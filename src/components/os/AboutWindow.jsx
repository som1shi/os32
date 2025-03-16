import React from 'react';
import './AboutWindow.css';

const AboutWindow = ({ onClose }) => {
  return (
    <div className="about-content">
      <div className="about-header">
        <div className="about-logo">🎮</div>
        <h2>OS32.exe</h2>
        <div className="about-version">Version 0.3</div>
      </div>
      
      <div className="about-description">
        <p>A Windows XP-inspired operating system interface built with modern web technologies. Experience the nostalgia of the classic Windows XP design while enjoying modern applications and games.</p>
        <p>Developed using React and featuring a suite of productivity tools including Notepad and File Explorer, alongside a collection of unique games that blend classic concepts with innovative mechanics.</p>
      </div>
      
      <div className="about-games">
        <h3>Applications & Games:</h3>
        <ul>
          <li><strong>WordSweeper</strong> - A word-based reimagining of the classic Minesweeper, where letters reveal hidden words.</li>
          <li><strong>Schrödinger's Chess</strong> - A quantum twist on chess where pieces exist in multiple states until observed.</li>
          <li><strong>Rotate Connect Four</strong> - Strategic Connect Four with dynamic board rotation and dice mechanics.</li>
          <li><strong>Refiner</strong> - A terminal-based number sorting game inspired by corporate dystopias.</li>
          <li><strong>WikiConnect</strong> - Test your knowledge by finding paths between Wikipedia articles.</li>
          <li><strong>Internet Explorer</strong> - A nostalgic recreation of the classic web browser.</li>
          <li><strong>File Explorer</strong> - Manage your documents with this familiar interface.</li>
          <li><strong>Notepad</strong> - A simple yet effective text editor for your writing needs.</li>
        </ul>
      </div>
      
      <div className="about-footer">
        <button className="about-button" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default AboutWindow; 