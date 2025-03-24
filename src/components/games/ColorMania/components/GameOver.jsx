import React, { memo, useCallback } from 'react';
import { GAME_URL } from '../constants';

const GameOver = ({ score, onRestart, submitting, submitSuccess, submitError }) => {
  const handleShare = useCallback(() => {
    const shareText = `I scored ${score} points in ColorMania! Can you beat my score?`;
    
    navigator.clipboard.writeText(`${shareText}\n\n${GAME_URL}`).then(() => {
      alert('Score copied to clipboard! Share with your friends.');
    }).catch(() => {
      alert('Failed to copy to clipboard.');
    });
  }, [score]);
  
  const errorMsg = submitError;
  
  return (
    <div className="cm-game-over-message">
      <h2>Game Over!</h2>
      <p>Your final score: {score}</p>
      
      <div className="cm-score-status-container">
        {submitting && <p className="cm-score-status submitting">Submitting score...</p>}
        {submitSuccess && <p className="cm-score-status success">Score submitted!</p>}
        {submitError && <p className="cm-score-status error">{errorMsg}</p>}
      </div>
      
      <div className="cm-game-over-buttons">
        <button onClick={onRestart}>Play Again</button>
        <button className="cm-share-button" onClick={handleShare}>Share Result</button>
      </div>
    </div>
  );
};

export default memo(GameOver); 