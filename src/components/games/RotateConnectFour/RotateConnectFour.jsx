import React, { useMemo, useCallback, memo, useState, useEffect } from 'react';
import './RotateConnectFour.css';
import useGameLogic from './hooks/useGameLogic';
import soundService from '../../../services/soundService';

const RotateConnectFour = memo(() => {
    const {
        board,
        currentPlayer,
        gameOver,
        diceRoll,
        canRotate,
        winner,
        isRotating,
        showRules,
        setShowRules,
        diceFaceRef,
        boardRef,
        isDiceRolling,
        dropPiece,
        rotateBoard,
        shareGame,
        resetGame
    } = useGameLogic();

    const [showIntro, setShowIntro] = useState(true);
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        if (gameOver && winner) soundService.play('notify');
        else if (gameOver && !winner) soundService.play('error');
    }, [gameOver, winner]);

    const handleStartGame = useCallback(() => {
        soundService.play('click');
        resetGame();
        setShowIntro(false);
    }, [resetGame]);

    const handleExit = useCallback(() => {
        window.location.href = "/";
    }, []);

    const toggleRules = useCallback(() => {
        setShowRules(true);
    }, [setShowRules]);

    const handleDropPiece = useCallback((colIndex) => {
        soundService.play('click');
        dropPiece(colIndex);
    }, [dropPiece]);

    const handleRotateLeft = useCallback(() => {
        soundService.play('click');
        rotateBoard('left');
    }, [rotateBoard]);

    const handleRotateRight = useCallback(() => {
        soundService.play('click');
        rotateBoard('right');
    }, [rotateBoard]);

    const toggleMenu = useCallback((menu) => {
        setActiveMenu(activeMenu === menu ? null : menu);
    }, [activeMenu]);

    const handleClickOutside = useCallback(() => {
        if (activeMenu) setActiveMenu(null);
    }, [activeMenu]);

    const statusMessage = useMemo(() => {
        if (gameOver) {
            return winner ? `${winner.toUpperCase()} Wins!` : 'Draw!';
        }
        return `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
    }, [gameOver, winner, currentPlayer]);

    const diceMessage = useMemo(() => {
        return canRotate ? "You rolled 6 — rotate the board!" : `Rolled: ${diceRoll}`;
    }, [canRotate, diceRoll]);

    const boardDisplay = useMemo(() => (
        <div ref={boardRef} className="connect-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="connect-row">
                    {row.map((cell, colIndex) => (
                        <div
                            key={colIndex}
                            className={`connect-cell ${cell || ''}`}
                            onClick={() => handleDropPiece(colIndex)}
                        >
                            {cell && <div className={`connect-piece ${cell}`}></div>}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ), [board, handleDropPiece]);

    const rulesModal = useMemo(() => showRules && (
        <div className="connect-rules-modal">
            <div className="connect-rules-content">
                <h2>How to Play</h2>
                <p>Connect Four with a twist — rolling a 6 lets you rotate the board!</p>
                <ol>
                    <li>Take turns dropping your colored pieces into columns</li>
                    <li>After dropping, a dice is rolled automatically</li>
                    <li>Roll a 6 to rotate the board 90° left or right</li>
                    <li>Pieces fall to reflect the new gravity after rotation</li>
                    <li>Connect four in a row (any direction) to win!</li>
                </ol>
                <button onClick={() => setShowRules(false)}>Got it!</button>
            </div>
        </div>
    ), [showRules, setShowRules]);

    if (showIntro) {
        return (
            <div className="connect-game">
                <div className="connect-menu-bar">
                    <div className="connect-menu-item" onClick={() => { soundService.play('click'); setShowIntro(false); }}>
                        <span>File</span>
                    </div>
                    <div className="connect-menu-item" onClick={() => setShowRules(true)}>
                        <span>Help</span>
                    </div>
                </div>
                <div className="rcf-intro-screen">
                    <div className="rcf-intro-logo">
                        <span className="rcf-logo-red">●</span>
                        <span className="rcf-logo-yellow">●</span>
                        Rotate Connect Four
                        <span className="rcf-logo-yellow">●</span>
                        <span className="rcf-logo-red">●</span>
                    </div>
                    <p className="rcf-intro-tagline">
                        Classic Connect Four — but rolling a 6 lets you spin the board and change everything!
                    </p>
                    <div className="rcf-intro-rules">
                        <h3>How to Play</h3>
                        <ol>
                            <li>Drop your colored piece into any column</li>
                            <li>A dice rolls after each move</li>
                            <li>Roll a <strong>6</strong> to rotate the board 90° left or right</li>
                            <li>Pieces fall with the new gravity after rotation</li>
                            <li>Connect <strong>4 in a row</strong> to win!</li>
                        </ol>
                    </div>
                    <button className="rcf-intro-btn" onClick={handleStartGame}>
                        ▶ Play Rotate Connect Four
                    </button>
                </div>
                {rulesModal}
            </div>
        );
    }

    return (
        <div className="connect-game" onClick={handleClickOutside}>
            <div className="connect-menu-bar">
                <div
                    className={`connect-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}
                >
                    <span>File</span>
                    <div className="connect-menu-dropdown">
                        <div className="connect-menu-option" onClick={(e) => { e.stopPropagation(); resetGame(); setActiveMenu(null); }}>New Game</div>
                        <div className="connect-menu-option" onClick={(e) => { e.stopPropagation(); handleExit(); }}>Exit</div>
                    </div>
                </div>
                <div
                    className={`connect-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleMenu('help'); }}
                >
                    <span>Help</span>
                    <div className="connect-menu-dropdown">
                        <div className="connect-menu-option" onClick={(e) => { e.stopPropagation(); toggleRules(); setActiveMenu(null); }}>How to Play</div>
                    </div>
                </div>
            </div>

            <div className="connect-game-container">
                <div className="connect-controls">

                    <div className="connect-controls-row">
                        <div className="connect-turn-indicator">
                            <span className={`connect-player-dot ${currentPlayer}`}></span>
                            {statusMessage}
                        </div>
                    </div>

                    {diceRoll !== null && (
                        <div className="connect-controls-row connect-dice-container">
                            <div className="connect-dice">
                                <div ref={diceFaceRef} className={`connect-dice-face face-${diceRoll || 1}`}>
                                    <div className="connect-dot connect-dot-1"></div>
                                    <div className="connect-dot connect-dot-2"></div>
                                    <div className="connect-dot connect-dot-3"></div>
                                    <div className="connect-dot connect-dot-4"></div>
                                    <div className="connect-dot connect-dot-5"></div>
                                    <div className="connect-dot connect-dot-6"></div>
                                </div>
                            </div>
                            <div className="connect-dice-message">
                                {diceMessage}
                            </div>
                        </div>
                    )}

                    {canRotate && (
                        <div className="connect-controls-row">
                            <div className="connect-rotation-controls">
                                <button className="connect-rotate-btn" onClick={handleRotateLeft} disabled={isRotating}>↺ Left</button>
                                <button className="connect-rotate-btn" onClick={handleRotateRight} disabled={isRotating}>↻ Right</button>
                            </div>
                        </div>
                    )}

                    {gameOver && winner && (
                        <div className="connect-controls-row connect-winner-controls">
                            <div className="connect-winner-message">
                                <span className={`connect-player-dot ${winner}`}></span>
                                {`${winner.toUpperCase()} Wins!`}
                            </div>
                            <button className="connect-share-button" onClick={shareGame}>
                                Share Victory
                            </button>
                        </div>
                    )}
                </div>

                {boardDisplay}
            </div>

            {rulesModal}
        </div>
    );
});

export default RotateConnectFour;
