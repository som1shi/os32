import { memo } from 'react';

const COLORS = ['royalblue', 'forestgreen', 'firebrick', 'goldenrod', 'blueviolet', 'darkorange', 'mediumturquoise', 'deeppink', 'sienna', 'midnightblue'];

const StartScreen = ({ onStart }) => {
  return (
    <div className="cm-start-screen">
      <div className="cm-start-logo">
        {'ColorMania'.split('').map((char, i) => (
          <span key={i} className={`cm-logo-char cm-logo-char-${COLORS[i % COLORS.length]}`}>{char}</span>
        ))}
      </div>
      <p className="cm-start-desc">
        Match colors! Reveal blank tiles that align with their colored neighbors to score points.
      </p>
      <div className="cm-start-rules">
        <div className="cm-start-rule">
          <span>Click a blank tile to reveal its color</span>
        </div>
        <div className="cm-start-rule">
          <span>Matching neighbors score 1 point each</span>
        </div>
        <div className="cm-start-rule">
          <span>Wrong clicks cost you 10 seconds</span>
        </div>
        <div className="cm-start-rule">
          <span>120 seconds on the clock — go fast!</span>
        </div>
      </div>
      <button className="cm-start-btn" onClick={onStart}>▶ Start Game</button>
    </div>
  );
};

export default memo(StartScreen);
