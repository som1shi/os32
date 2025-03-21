import React from 'react';

const StartScreen = ({ onStart }) => {
  return (
    <div className="cm-start-screen">
      <h2>ColorMania</h2>
      <p>Click an empty tile to remove matching colored tiles.</p>
      <p>When you click on a blank tile, the game checks the first colored tile in each direction (up, down, left, right).</p>
      <p>If at least 2 tiles of the same color are found, they will be removed (become blank).</p>
      <p>You have 120 seconds to play. Each incorrect click (less than 2 matching tiles) reduces your time by 10 seconds.</p>
      <button onClick={onStart}>Start Game</button>
    </div>
  );
};

export default StartScreen; 