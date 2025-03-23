import React, { memo } from 'react';

const GameOverScreen = ({ 
    score, 
    gameDuration, 
    shareScore, 
    shareButtonText,
    scoreSubmitted,
    submitting,
    submitSuccess,
    submitError
}) => {
    const errorMsg = submitError ;
    
    return (
        <div className="game-over">
            <div className="game-over-content">
                <div className="back-button" onClick={() => window.history.back()}>×</div>
                <h2>Game Over</h2>
                
                <div className="score-result">
                    <div className="score-value">{score}</div>
                    <div className="score-label">TARGETS REFINED</div>
                </div>
                
                <div className="duration-result">
                    <div className="duration-value">{gameDuration}</div>
                    <div className="duration-label">SECONDS</div>
                </div>
                
                <div className="score-submission-status">
                    {submitting && (
                        <p className="submitting">Submitting...</p>
                    )}
                    {submitSuccess && (
                        <p className="success">Score saved!</p>
                    )}
                    {submitError && (
                        <p className="error">{errorMsg}</p>
                    )}
                </div>
                
                <button className="play-again-button" onClick={() => window.location.reload()}>
                    PLAY AGAIN
                </button>
                
                <button className="share-button" onClick={shareScore}>
                    {shareButtonText}
                </button>
            </div>
        </div>
    );
};

export default memo(GameOverScreen); 