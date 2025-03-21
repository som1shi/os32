import React from 'react';

const InfoModal = ({ onClose }) => {
  return (
    <div className="cm-info-modal">
      <h3>How to Play ColorMania</h3>
      <div className="cm-info-content">
        <ul>
          <li>Click an empty tile to remove matching colored tiles.</li>
          <li>The game checks four directions (up, down, left, right) from the selected tile.</li>
          <li>If at least two matching tiles are found, they are removed.</li>
          <li>For example, if the tiles above and to the right are both red, clicking the blank tile will remove them.</li>
          <li>You have 120 seconds to remove as many tiles as possible.</li>
          <li>Incorrect clicks (fewer than two matching tiles) will subtract 10 seconds from your time.</li>
        </ul>
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default InfoModal; 