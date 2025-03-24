import React, { memo } from 'react';
import TimeBar from './TimeBar';
import ScoreDisplay from './ScoreDisplay';

const DisplayPanel = ({ timeLeft, score }) => {
  return (
    <div className="cm-game-display">
      <div className="cm-display-panel">
        <TimeBar timeLeft={timeLeft} />
        <ScoreDisplay score={score} />
      </div>
    </div>
  );
};

export default memo(DisplayPanel); 