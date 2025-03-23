import React, { memo } from 'react';

const Header = ({ 
    timeLeft, 
    gameDuration, 
    score
}) => {
    const progressPercentage = (timeLeft / gameDuration) * 100;
    
    return (
        <div className="mdr-header">
            <div className="timer-container">
                <div 
                    className="timer-progress"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
                <span className="timer-text">{timeLeft}s</span>
            </div>
            
            <div className="score-display">
                <span>Score: {score}</span>
            </div>

            <div className="company-logo">SOMVANSHI</div>
            
            <div className="back-button" onClick={() => window.history.back()}>×</div>
        </div>

        
    );
};

export default memo(Header); 