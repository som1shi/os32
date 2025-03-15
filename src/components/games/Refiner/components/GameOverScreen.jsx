import React from 'react';

const GameOverScreen = ({ score, gameDuration, shareScore, shareButtonText }) => {
    return (
        <div className="game-over">
            <div className="game-over-content">
                <h2>Game Over</h2>
                <div className="score-result">
                    <div className="score-value">{score}</div>
                    <div className="score-label">Targets Refined</div>
                </div>
                
                <div className="duration-result">
                    <div className="duration-value">{gameDuration}</div>
                    <div className="duration-label">Seconds</div>
                </div>
                
                <button className="play-again-button" onClick={() => window.location.reload()}>
                    Play Again
                </button>
                
                <button className="share-button" onClick={shareScore}>
                    {shareButtonText}
                </button>
            </div>
        </div>
    );
};

export default GameOverScreen; 