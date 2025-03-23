import React, { useMemo, memo, useCallback, useState } from 'react';
import useChessLogic from './hooks/useChessLogic';
import './QuantumChess.css';

const QuantumChess = memo(() => {
    const {
        board,
        selectedPiece,
        possibleMoves,
        currentPlayer,
        gameOver,
        winner,
        capturedPieces,
        showRules,
        setShowRules,
        handlePieceClick,
        initializeBoard,
        sharePosition
    } = useChessLogic();
    
    const [activeMenu, setActiveMenu] = useState(null);
    
    const toggleMenu = useCallback((menu) => {
        setActiveMenu(activeMenu === menu ? null : menu);
    }, [activeMenu]);
    
    const handleClickOutside = useCallback(() => {
        if (activeMenu) {
            setActiveMenu(null);
        }
    }, [activeMenu]);

    const RulesModal = memo(() => (
        <div className="rules-modal">
            <div className="rules-content">
                <h2>Quantum Chess Rules</h2>
                <div className="rules-text">
                <h3>Quantum Mechanics</h3>
                <p>In Quantum Chess, pieces exist in superposition until observed:</p>
                <ul>
                    <li>Each piece has two potential types (shown as letters inside unobserved pieces)</li>
                    <li>Kings are always observed from the start</li>
                    <li>Click on an unobserved piece to collapse its wave function (this counts as your turn)</li>
                    <li>When observed, a piece randomly becomes one of its two potential types</li>
                    <li>Pieces that land on dark squares return to quantum superposition, unless they've fully collapsed</li>
                </ul>
                
                <h3>Movement Rules</h3>
                <p>Movement follows standard chess rules with quantum twists:</p>
                <ul>
                    <li>You can only move pieces that have been observed (have a definite type)</li>
                    <li>Moving a piece in a way specific to one of its potential types may cause it to permanently become that type</li>
                    <li>For example, moving in an L-shape (knight move) will collapse a piece to a knight if that's one of its potential types</li>
                    <li>Similarly, diagonal moves may collapse to bishop, and straight moves to rook</li>
                    <li>Capture the opponent's King to win - the game ends immediately when a king is captured</li>
                </ul>

                <h3>Strategy Tips</h3>
                <ul>
                    <li>Observe your pieces strategically to reveal advantageous types</li>
                    <li>Force pieces to collapse into specific types by how you move them</li>
                    <li>Be careful - your opponent can do the same!</li>
                    <li>The uncertainty of piece types adds a layer of strategy beyond traditional chess</li>
                </ul>
            </div>
                    <div className="rules-footer">
                <p>Based on quantum mechanical principles of superposition and wave function collapse.</p>
                    </div>
            <button onClick={() => setShowRules(false)}>Got it!</button>
            </div>
        </div>
    ));

    const getPieceSymbol = useCallback((piece) => {
        if (!piece) return null;
        if (!piece.currentType) return '❓';
        
        const symbols = {
            'white': {
                'pawn': '♙',
                'knight': '♘',
                'bishop': '♗',
                'rook': '♖',
                'queen': '♕',
                'king': '♔'
            },
            'black': {
                'pawn': '♟',
                'knight': '♞',
                'bishop': '♝',
                'rook': '♜',
                'queen': '♛',
                'king': '♚'
            }
        };
        
        return symbols[piece.color][piece.currentType];
    }, []);

    const handleNewGame = useCallback(() => {
        initializeBoard();
    }, [initializeBoard]);

    const handleExitGame = useCallback(() => {
        window.location.href = "/";
    }, []);

    const handleShowRules = useCallback(() => {
        setShowRules(true);
    }, [setShowRules]);

    const CapturedPieces = useMemo(() => (
        <div className="captured-pieces">
            <div className="white">
                {capturedPieces.white.map((piece, i) => (
                    <div key={piece.id || `white-${i}`} className="captured-piece">
                        {getPieceSymbol(piece)}
                    </div>
                ))}
            </div>
            <div className="black">
                {capturedPieces.black.map((piece, i) => (
                    <div key={piece.id || `black-${i}`} className="captured-piece">
                        {getPieceSymbol(piece)}
                    </div>
                ))}
            </div>
        </div>
    ), [capturedPieces, getPieceSymbol]);

    const GameBoard = useMemo(() => (
        <div className="board">
            {board.map((row, i) => (
                <div key={`row-${i}`} className="row">
                    {row.map((piece, j) => {
                        const isEvenCell = (i + j) % 2 === 0;
                        const isSelected = selectedPiece && selectedPiece[0] === i && selectedPiece[1] === j;
                        const isPossibleMove = possibleMoves.some(move => move[0] === i && move[1] === j);
                        const isCapture = isPossibleMove && board[i][j] !== null;
                        
                        const handleCellClick = () => handlePieceClick(i, j);
                        
                        return (
                            <div 
                                key={`cell-${i}-${j}`} 
                                className={`cell ${isEvenCell ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isPossibleMove ? 'possible-move' : ''}`}
                                onClick={handleCellClick}
                                data-capture={isCapture}
                            >
                                {piece && (
                                    <div className={`piece ${piece.color} ${piece.currentType ? 'observed' : 'unobserved'} ${piece.isFullyCollapsed ? 'fully-collapsed' : ''}`}>
                                        {piece.currentType ? (
                                            getPieceSymbol(piece)
                                        ) : (
                                            <div className="piece-info">
                                                <span className="current-type">?</span>
                                                <div className="potential-types">
                                                    <span className="type1">{piece.type1 && piece.type1[0] ? piece.type1[0].toUpperCase() : '?'}</span>
                                                    <span className="type2">{piece.type2 && piece.type2[0] ? piece.type2[0].toUpperCase() : '?'}</span>
                                                </div>
                                                <div className="quantum-indicator"></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    ), [board, selectedPiece, possibleMoves, handlePieceClick, getPieceSymbol]);

    const GameStatus = useMemo(() => (
        <div className="quantum-chess-menu-item">
            {gameOver ? (winner ? `${winner.toUpperCase()} wins!` : 'Game Over') : `${currentPlayer}'s turn`}
        </div>
    ), [gameOver, winner, currentPlayer]);

    return (
        <div className="quantum-chess" onClick={handleClickOutside}>
            <div className="window-header">
                <div className="window-title">
                    <span>Quantum Chess</span>
                </div>
                <div className="window-controls">
                    <button 
                        className="window-button close" 
                        onClick={handleExitGame}
                    ></button>
                </div>
            </div>
            
            <div className="quantum-chess-menu-bar">
                <div 
                    className={`quantum-chess-menu-item ${activeMenu === 'file' ? 'active' : ''}`} 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu('file');
                    }}
                >
                    <span>File</span>
                    <div className="quantum-chess-menu-dropdown">
                        <div className="quantum-chess-menu-option" onClick={handleNewGame}>New Game</div>
                        <div className="quantum-chess-menu-option" onClick={handleExitGame}>Exit</div>
                    </div>
                </div>
                <div 
                    className={`quantum-chess-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu('help');
                    }}
                >
                    <span>Help</span>
                    <div className="quantum-chess-menu-dropdown">
                        <div className="quantum-chess-menu-option" onClick={handleShowRules}>How to Play</div>
                    </div>
                </div>

                {GameStatus}
            </div>
            
            <div className="game-container">
                {CapturedPieces}
                {GameBoard}
                {showRules && <RulesModal />}
            </div>
        </div>
    );
});

export default QuantumChess; 