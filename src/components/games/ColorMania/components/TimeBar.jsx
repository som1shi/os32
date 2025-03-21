import React from 'react';
import { GAME_TIME } from '../constants';

const TimeBar = ({ timeLeft }) => {
  const timePercentage = (timeLeft / GAME_TIME) * 100;
  
  const renderTimeBarSegments = () => {
    let colorClass = "normal";
    if (timePercentage <= 30) {
      colorClass = "low";
    } else if (timePercentage <= 60) {
      colorClass = "medium";
    }
    
    const totalSegments = 40;
    const activeSegments = Math.ceil((timePercentage / 100) * totalSegments);
    
    const segments = [];
    for (let i = 0; i < activeSegments; i++) {
      segments.push(<div key={`segment-${i}`} className="cm-time-segment"></div>);
    }
    
    return (
      <div className="cm-time-bar" data-percentage={colorClass}>
        {segments}
      </div>
    );
  };
  
  return (
    <div className="cm-time-section">
      <div className="cm-time-header">
        <div className="cm-time-label">TIME REMAINING:</div>
      </div>
      <div className="cm-time-bar-container">
        {renderTimeBarSegments()}
      </div>
    </div>
  );
};

export default TimeBar; 