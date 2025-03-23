import React, { useMemo, useCallback, memo, useState } from 'react';
import './RotateConnectFour.css';
import useGameLogic from './hooks/useGameLogic';

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
        isDiceRolling,
        dropPiece,
        rotateBoard,
        shareGame,
        resetGame
    } = useGameLogic();
    const [activeMenu, setActiveMenu] = useState(null);

    const handleExit = useCallback(() => {
        window.location.href = "/";
    }, []);

    const toggleRules = useCallback(() => {
        setShowRules(true);
    }, [setShowRules]);

    const handleRotateLeft = useCallback(() => {
        rotateBoard('left');
    }, [rotateBoard]);

    const handleRotateRight = useCallback(() => {
        rotateBoard('right');
    }, [rotateBoard]);

    const toggleMenu = useCallback((menu) => {
        setActiveMenu(activeMenu === menu ? null : menu);
    }, [activeMenu]);

    const handleClickOutside = useCallback(() => {
        if (activeMenu) {
            setActiveMenu(null);
        }
    }, [activeMenu]);

    const statusMessage = useMemo(() => {
        if (gameOver) {
            return winner ? `${winner.toUpperCase()} Wins!` : 'Game Over!';
        }
        return `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
    }, [gameOver, winner, currentPlayer]);

    const diceMessage = useMemo(() => {
        return canRotate ? "You rolled 6 - You can rotate!" : `Rolled: ${diceRoll}`;
    }, [canRotate, diceRoll]);

    const boardDisplay = useMemo(() => (
        <div className="connect-board">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="connect-row">
                    {row.map((cell, colIndex) => (
                        <div
                            key={colIndex}
                            className={`connect-cell ${cell || ''}`}
                            onClick={() => dropPiece(colIndex)}
                        >
                            {cell && <div className={`connect-piece ${cell}`}></div>}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ), [board, dropPiece]);

    const rulesModal = useMemo(() => showRules && (
        <div className="connect-rules-modal">
            <div className="connect-rules-content">
                <h2>How to Play Rotate Connect Four</h2>
                <p>This is Connect Four with a twist - after dropping a piece, roll a dice to see if you can rotate the board!</p>
                <ol>
                    <li>Players take turns dropping their colored pieces into columns</li>
                    <li>After dropping a piece, a dice is rolled</li>
                    <li>If you roll a 6, you can rotate the board 90° clockwise or counterclockwise</li>
                    <li>After rotation, pieces will fall to reflect the new gravity</li>
                    <li>Connect four pieces in a row (horizontally, vertically, or diagonally) to win</li>
                </ol>
                <button onClick={() => setShowRules(false)}>Got it!</button>
            </div>
        </div>
    ), [showRules, setShowRules]);

    return (
        <div className="connect-game" onClick={handleClickOutside}>
            <div className="connect-window-header">
                <div className="connect-window-title">
                    <span>Rotate Connect Four</span>
                </div>
                <div className="connect-window-controls">
                    <button 
                        className="connect-window-button close"
                        onClick={handleExit}
                    ></button>
                </div>
            </div>
            
            <div className="connect-menu-bar">
                <div 
                    className={`connect-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu('file');
                    }}
                >
                    <span>File</span>
                    <div className="connect-menu-dropdown">
                        <div className="connect-menu-option" onClick={(e) => {
                            e.stopPropagation();
                            resetGame();
                            setActiveMenu(null);
                        }}>New Game</div>
                        <div className="connect-menu-option" onClick={(e) => {
                            e.stopPropagation();
                            handleExit();
                        }}>Exit</div>
                    </div>
                </div>
                <div 
                    className={`connect-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu('help');
                    }}
                >
                    <span>Help</span>
                    <div className="connect-menu-dropdown">
                        <div className="connect-menu-option" onClick={(e) => {
                            e.stopPropagation();
                            toggleRules();
                            setActiveMenu(null);
                        }}>How to Play</div>
                    </div>
                </div>
            </div>
            
            <div className="connect-game-container">
                <div className="connect-controls">
                    
                    {showRules && (
                        <div className="connect-rules-panel">
                            <h3>How to Play Rotate Connect Four</h3>
                            <ol>
                                <li>Players take turns dropping their pieces into the board.</li>
                                <li>After each move, roll the dice.</li>
                                <li>If you roll a 6, you can rotate the board left or right before your turn ends.</li>
                                <li>Connect four of your pieces in a row (horizontally, vertically, or diagonally) to win!</li>
                                <li>When the board rotates, pieces will fall due to gravity.</li>
                            </ol>
                        </div>
                    )}
                    
                    <div className="connect-controls-row">
                        <div className="connect-turn-indicator">
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
                                <button onClick={handleRotateLeft} disabled={isRotating}>Rotate Left</button>
                                <button onClick={handleRotateRight} disabled={isRotating}>Rotate Right</button>
                            </div>
                        </div>
                    )}

                    {gameOver && winner && (
                        <div className="connect-controls-row connect-winner-controls">
                            <div className="connect-winner-message">
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