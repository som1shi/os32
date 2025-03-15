import React from 'react';
import useGameLogic from './hooks/useGameLogic';
import './Minesweeper.css';

const Minesweeper = () => {
    const {
        board,
        gameOver,
        win,
        flagMode,
        minesLeft,
        targetWord,
        customWord,
        showCustomInput,
        score,
        showInfo,
        setFlagMode,
        setShowCustomInput,
        setCustomWord,
        setShowInfo,
        handleCustomWordSubmit,
        startNewGame,
        handleCellClick,
        handleShare
    } = useGameLogic();

    return (
        <div className="minesweeper">
            <div className="window-header">
                <div className="window-title">
                    <span>WordSweeper</span>
                </div>
                <div className="window-controls">
                    <button 
                        className="window-button close"
                        onClick={() => window.location.href = "/"}
                    ></button>
                </div>
            </div>
            
            <div className="menu-bar">
                <div className="menu-item">
                    <span>File</span>
                    <div className="menu-dropdown">
                        <div className="menu-option" onClick={() => startNewGame()}>New Game</div>
                        <div className="menu-option" onClick={() => setShowCustomInput(true)}>Custom Word</div>
                        <div className="menu-option" onClick={() => window.location.href = "/"}>Exit</div>
                    </div>
                </div>
                <div className="menu-item">
                    <span>Help</span>
                    <div className="menu-dropdown">
                        <div className="menu-option" onClick={() => setShowInfo(true)}>How to Play</div>
                    </div>
                </div>
                <div className="menu-item" onClick={() => setFlagMode(!flagMode)}>
                    <span>{flagMode ? 'Flags ON' : 'Flags OFF'}</span>
                </div>
            </div>
            
            <div className="game-container">
                <div className="scoreboard">
                    <div className="score-total">
                        <span className="score-label">SCORE</span>
                        <span className="score-value">{score}</span>
                    </div>
                    <div className="score-display">
                        <span className="score-label">Target Word</span>
                        <span className="score-value">{targetWord}</span>
                    </div>
                    <div className="score-display">
                        <span className="score-label">Mines Left</span>
                        <span className="score-value">{minesLeft}</span>
                    </div>
                </div>
                {showCustomInput && (
                    <>
                        <div className="custom-word-overlay" onClick={() => setShowCustomInput(false)} />
                        <div className="custom-word-input">
                            <input
                                type="text"
                                value={customWord}
                                onChange={(e) => setCustomWord(e.target.value)}
                                placeholder="ENTER A WORD"
                                autoFocus
                            />
                            <button onClick={handleCustomWordSubmit}>START GAME</button>
                        </div>
                    </>
                )}
                {showInfo && (
                    <>
                        <div className="custom-word-overlay" onClick={() => setShowInfo(false)} />
                        <div className="info-modal">
                            <h3>How to Play WordSweeper</h3>
                            <div className="info-content">
                                <p>WordSweeper is a word-based version of Minesweeper where:</p>
                                <ul>
                                    <li>The target word represents mines you need to avoid</li>
                                    <li>Numbers are replaced with related words</li>
                                    <li>Words closer to the target word are more dangerous</li>
                                    <li>Left click to reveal cells</li>
                                    <li>Right click or use Flag Mode to mark potential mines</li>
                                    <li>Clear all safe cells to win!</li>
                                </ul>
                                <p>Word Colors:</p>
                                <ul>
                                    <li><span className="blue-text">Blue</span>: Distantly related words</li>
                                    <li><span className="orange-text">Orange</span>: Moderately related words</li>
                                    <li><span className="red-text">Red</span>: Closely related words</li>
                                </ul>
                            </div>
                            <button onClick={() => setShowInfo(false)}>Got it!</button>
                        </div>
                    </>
                )}
                <div className="board">
                    {board.map((row, i) => (
                        <div key={i} className="row">
                            {row.map((cell, j) => (
                                <div
                                    key={`${i}-${j}`}
                                    className={`cell ${cell.isRevealed ? 'revealed' : ''} ${
                                        cell.isFlagged ? 'flagged' : ''
                                    } ${gameOver && cell.isMine ? 'mine' : ''} ${
                                        cell.word ? `level-${cell.neighborMines}` : ''
                                    }`}
                                    onClick={(e) => handleCellClick(i, j, e)}
                                    onContextMenu={(e) => handleCellClick(i, j, e)}
                                >
                                    {cell.isRevealed && !cell.isMine && cell.word}
                                    {cell.isFlagged && '🚩'}
                                    {cell.isRevealed && cell.isMine && cell.word}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {(gameOver || win) && (
                    <div className="game-over">
                        <h2>{win ? 'You Win!' : 'Game Over!'}</h2>
                        <div className="game-over-buttons">
                            <button onClick={() => startNewGame()}>Play Again</button>
                            {win && <button onClick={handleShare} className="share-button">Share 🔗</button>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Minesweeper;