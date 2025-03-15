import React from 'react';

const GameComplete = ({ personChain, seconds, startGame, shareScore, formatTime }) => {
    return (
        <div className="game-complete">
            <h2>Success! Connection Complete</h2>
            <div className="word-chain-display">
                {personChain.map((person, index) => (
                    <span key={index}>
                        {person.title}
                        {index < personChain.length - 1 && <span className="chain-arrow">→</span>}
                    </span>
                ))}
            </div>
            <p>Steps: {personChain.length - 1}</p>
            <p>Time: {formatTime(seconds)}</p>
            <div className="complete-buttons">
                <button onClick={startGame}>Play Again</button>
                <button onClick={shareScore}>Share Score</button>
            </div>
        </div>
    );
};

export default GameComplete; 