import React from 'react';

const VolumeIcon = ({ volume, isMuted }) => {
    if (isMuted || volume === 0) {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L4 5H2V11H4L8 14V2Z" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 5L10 9" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 5L14 9" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        );
    } else if (volume < 0.4) {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L4 5H2V11H4L8 14V2Z" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 6C11.3 6.8 11.3 9.2 10.5 10" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        );
    } else {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L4 5H2V11H4L8 14V2Z" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 6C11.3 6.8 11.3 9.2 10.5 10" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 4C14.7 5.6 14.7 10.4 13 12" stroke="#7AF3D0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        );
    }
};

const Header = ({ 
    timeLeft, 
    gameDuration, 
    score, 
    isMusicPlaying, 
    volume, 
    toggleMusic, 
    handleVolumeChange 
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
            
            <div className="music-controls">
                <button 
                    className={`music-button ${isMusicPlaying ? 'playing' : ''}`} 
                    onClick={toggleMusic}
                    aria-label={isMusicPlaying ? "Music options" : "Play music"}
                >
                    <VolumeIcon volume={volume} isMuted={!isMusicPlaying} />
                </button>
                
                {isMusicPlaying && (
                    <input 
                        type="range" 
                        min="0" 
                        max="0.8"
                        step="0.1" 
                        value={volume} 
                        onChange={handleVolumeChange}
                        className="volume-slider"
                    />
                )}
            </div>
            
            <div className="company-logo">SOMVANSHI</div>
            
            <div className="back-button" onClick={() => window.history.back()}>×</div>
        </div>
    );
};

export default Header; 