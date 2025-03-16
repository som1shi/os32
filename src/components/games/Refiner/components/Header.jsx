import React from 'react';

const Header = ({ 
    timeLeft, 
    gameDuration, 
    score
}) => {
    return (
        <div className="mdr-header">
            <div className="timer-container">
                <div 
                    className="timer-progress"
                    style={{ width: `${(timeLeft / gameDuration) * 100}%` }}
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

export default Header; 