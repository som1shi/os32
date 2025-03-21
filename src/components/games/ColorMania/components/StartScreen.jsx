import React from 'react';

const StartScreen = ({ onStart }) => {
  return (
    <div className="cm-start-screen">
      <h2>ColorMania</h2>
      <p>Click on a blank space to reveal matching colored tiles! If the color of the blank area lines up with its neighbors vertically or horizontally, you'll collect those tiles.</p> 
      <p>Earn 1 point for each tile and watch your score climb!</p> 
      <p>You have 120 seconds to play, but be cautious—every incorrect click costs you 10 seconds!</p>
      <button onClick={onStart}>Start Game</button>
    </div>
  );
};

export default StartScreen; 