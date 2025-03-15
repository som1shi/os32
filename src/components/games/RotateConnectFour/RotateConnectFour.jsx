import React from 'react';
import './RotateConnectFour.css';
import useGameLogic from './hooks/useGameLogic';

const RotateConnectFour = () => {
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

    return (
        <div className="rotate-connect-four">
            <div className="window-header">
                <div className="window-title">
                    <span>Rotate Connect Four</span>
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
                        <div className="menu-option" onClick={resetGame}>New Game</div>
                        <div className="menu-option" onClick={() => window.location.href = "/"}>Exit</div>
                    </div>
                </div>
                <div className="menu-item">
                    <span>Help</span>
                    <div className="menu-dropdown">
                        <div className="menu-option" onClick={() => setShowRules(true)}>How to Play</div>
                    </div>
                </div>
            </div>
            
            <div className="game-container">
                <div className="controls">
                    
                    {showRules && (
                        <div className="rules-panel">
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
                    
                    <div className="controls-row">
                        <div className="turn-indicator">
                            {gameOver ? 
                                (winner ? `${winner.toUpperCase()} Wins!` : 'Game Over!') 
                                : `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`}
                        </div>
                    </div>
                    
                    {diceRoll !== null && (
                        <div className="controls-row dice-container">
                            <div className="dice">
                                <div ref={diceFaceRef} className={`dice-face face-${diceRoll || 1}`}>
                                    <div className="dot dot-1"></div>
                                    <div className="dot dot-2"></div>
                                    <div className="dot dot-3"></div>
                                    <div className="dot dot-4"></div>
                                    <div className="dot dot-5"></div>
                                    <div className="dot dot-6"></div>
                                </div>
                            </div>
                            <div className="dice-message">
                                {canRotate ? "You rolled 6 - You can rotate!" : `Rolled: ${diceRoll}`}
                            </div>
                        </div>
                    )}
                    
                    {canRotate && (
                        <div className="controls-row">
                            <div className="rotation-controls">
                                <button onClick={() => rotateBoard('left')} disabled={isRotating}>Rotate Left</button>
                                <button onClick={() => rotateBoard('right')} disabled={isRotating}>Rotate Right</button>
                            </div>
                        </div>
                    )}

                    {gameOver && winner && (
                        <div className="controls-row winner-controls">
                            <div className="winner-message">
                                {`${winner.toUpperCase()} Wins!`}
                            </div>
                            <button className="share-button" onClick={shareGame}>
                                Share Victory
                            </button>
                        </div>
                    )}
                </div>
                <div className="board">
                    {board.map((row, rowIndex) => (
                        <div key={rowIndex} className="row">
                            {row.map((cell, colIndex) => (
                                <div
                                    key={colIndex}
                                    className={`cell ${cell || ''}`}
                                    onClick={() => dropPiece(colIndex)}
                                >
                                    {cell && <div className={`piece ${cell}`}></div>}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            {showRules && (
                <div className="rules-modal">
                    <div className="rules-content">
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
            )}
        </div>
    );
};

export default RotateConnectFour; 