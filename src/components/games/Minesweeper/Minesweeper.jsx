import React, { useMemo, memo, useCallback } from 'react';
import useGameLogic from './hooks/useGameLogic';
import './Minesweeper.css';

const Minesweeper = memo(() => {
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
        showScoreSubmitted,
        submitting,
        submitError,
        submitSuccess,
        setFlagMode,
        setShowCustomInput,
        setCustomWord,
        setShowInfo,
        handleCustomWordSubmit,
        startNewGame,
        handleCellClick,
        handleShare
    } = useGameLogic();

    const Scoreboard = useMemo(() => (
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
    ), [score, targetWord, minesLeft]);

    const Board = useMemo(() => (
        <div className="board">
            {board.map((row, i) => (
                <div key={i} className="row">
                    {row.map((cell, j) => (
                        <div
                            key={`${i}-${j}`}
                            className={`cell ${cell.isRevealed ? 'revealed' : ''} ${cell.isFlagged ? 'flagged' : ''} ${cell.isMine && cell.isRevealed ? 'mine' : ''} ${cell.neighborMines === 1 ? 'level-1' : cell.neighborMines === 2 ? 'level-2' : cell.neighborMines === 3 ? 'level-3' : ''}`}
                            onClick={(e) => handleCellClick(i, j, e)}
                            onContextMenu={(e) => handleCellClick(i, j, e)}
                        >
                            {cell.isRevealed && (cell.isMine ? cell.word : cell.neighborMines > 0 ? cell.word : '')}
                            {!cell.isRevealed && cell.isFlagged && '🚩'}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ), [board, handleCellClick]);

    const MenuBar = useMemo(() => (
        <div className="minesweeper-menu-bar">
            <div className="minesweeper-menu-item">
                <span>File</span>
                <div className="minesweeper-menu-dropdown">
                    <div className="minesweeper-menu-option" onClick={() => startNewGame()}>New Game</div>
                    <div className="minesweeper-menu-option" onClick={() => setShowCustomInput(true)}>Custom Word</div>
                    <div className="minesweeper-menu-option" onClick={() => window.location.href = "/"}>Exit</div>
                </div>
            </div>
            <div className="minesweeper-menu-item">
                <span>Help</span>
                <div className="minesweeper-menu-dropdown">
                    <div className="minesweeper-menu-option" onClick={() => setShowInfo(true)}>How to Play</div>
                </div>
            </div>
            <div className="minesweeper-menu-item" onClick={() => setFlagMode(!flagMode)}>
                <span>{flagMode ? 'Flags ON' : 'Flags OFF'}</span>
            </div>
        </div>
    ), [flagMode, setFlagMode, setShowCustomInput, startNewGame, setShowInfo]);

    const Header = useMemo(() => (
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
    ), []);

    const handleCloseCustomInput = useCallback(() => setShowCustomInput(false), [setShowCustomInput]);
    const handleCloseInfo = useCallback(() => setShowInfo(false), [setShowInfo]);

    return (
        <div className="minesweeper">
            {Header}
            {MenuBar}
            
            <div className="game-container">
                {Scoreboard}
                {Board}
                
                {gameOver && (
                    <div className="game-over-message">
                        <h2>Game Over!</h2>
                        <p>You hit a mine. Better luck next time!</p>
                        <button onClick={() => startNewGame()}>Play Again</button>
                        <button onClick={handleShare}>Share Result</button>
                    </div>
                )}
                
                {win && (
                    <div className="win-message">
                        <h2>You Win!</h2>
                        <p>Congratulations! You cleared the board!</p>
                        <p>Final Score: {score}</p>
                        {submitting && <p className="score-status submitting">Submitting score...</p>}
                        {submitSuccess && <p className="score-status success">Score submitted successfully!</p>}
                        {submitError && <p className="score-status error">Error submitting score: {submitError}</p>}
                        <button onClick={() => startNewGame()}>Play Again</button>
                        <button onClick={handleShare}>Share Result</button>
                    </div>
                )}
                
                {showScoreSubmitted && !gameOver && !win && (
                    <div className="score-submitted-notification">
                        <p>Score submitted successfully!</p>
                    </div>
                )}
                
                {showCustomInput && (
                    <>
                        <div className="custom-word-overlay" onClick={handleCloseCustomInput} />
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
                        <div className="custom-word-overlay" onClick={handleCloseInfo} />
                        <div className="info-modal">
                            <h3>How to Play WordSweeper</h3>
                            <div className="info-content">
                                <p>WordSweeper is a word-based version of Minesweeper where:</p>
                                <ul>
                                    <li>The target word represents mines you need to avoid</li>
                                    <li>Numbers are replaced with related words</li>
                                    <li>The closer a word is to the target word, the more mines are nearby</li>
                                </ul>
                                <p>Game Rules:</p>
                                <ul>
                                    <li>Click on cells to reveal them</li>
                                    <li>Right-click or toggle "Flags" to mark potential mines</li>
                                    <li>Avoid cells containing the target word</li>
                                    <li>Clear all non-mine cells to win</li>
                                </ul>
                            </div>
                            <button onClick={handleCloseInfo}>Close</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

export default Minesweeper;