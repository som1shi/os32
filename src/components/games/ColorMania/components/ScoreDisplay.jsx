import React from 'react';

const ScoreDisplay = ({ score }) => {
  return (
    <div className="cm-score-section">
      <div className="cm-score-label">SCORE:</div>
      <div className="cm-score-value">{score}</div>
    </div>
  );
};

export default ScoreDisplay; 