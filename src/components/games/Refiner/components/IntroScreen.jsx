import React from 'react';

const IntroScreen = ({ gameDuration, setGameDuration, startGame }) => {
    return (
        <div className="intro-screen">
            <h1>Data Refinement</h1>
            <p>Drag to select numbers that add up to the target sum.</p>
            <p>If you struggle, look around for the scary numbers.</p>
            <div className="duration-options">
                <button 
                    className={`duration-button ${gameDuration === 30 ? 'selected' : ''}`} 
                    onClick={() => setGameDuration(30)}
                >
                    30 Seconds
                </button>
                <button 
                    className={`duration-button ${gameDuration === 60 ? 'selected' : ''}`} 
                    onClick={() => setGameDuration(60)}
                >
                    60 Seconds
                </button>
                <button 
                    className={`duration-button ${gameDuration === 180 ? 'selected' : ''}`} 
                    onClick={() => setGameDuration(180)}
                >
                    3 Minutes
                </button>
                <button 
                    className={`duration-button ${gameDuration === 300 ? 'selected' : ''}`} 
                    onClick={() => setGameDuration(300)}
                >
                    5 Minutes
                </button>
                <button 
                    className={`duration-button ${gameDuration === 600 ? 'selected' : ''}`} 
                    onClick={() => setGameDuration(600)}
                >
                    10 Minutes
                </button>
            </div>
            <button className="mdr-start-button" onClick={startGame}>Begin</button>
        </div>
    );
};

export default IntroScreen; 