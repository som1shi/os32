import React, { useMemo, memo, useCallback, useState, useEffect } from 'react';
import useChessLogic from './hooks/useChessLogic';
import soundService from '../../../services/soundService';
import './QuantumChess.css';

import whitePawn   from '../../../assets/icons/chess_board/White Pieces/spr_pawn_white.png';
import whiteKnight from '../../../assets/icons/chess_board/White Pieces/spr_knight_white.png';
import whiteBishop from '../../../assets/icons/chess_board/White Pieces/spr_bishop_white.png';
import whiteRook   from '../../../assets/icons/chess_board/White Pieces/spr_tower_white.png';
import whiteQueen  from '../../../assets/icons/chess_board/White Pieces/spr_queen_white.png';
import whiteKing   from '../../../assets/icons/chess_board/White Pieces/spr_king_white.png';
import blackPawn   from '../../../assets/icons/chess_board/Black Pieces/spr_pawn_black.png';
import blackKnight from '../../../assets/icons/chess_board/Black Pieces/spr_knight_black.png';
import blackBishop from '../../../assets/icons/chess_board/Black Pieces/spr_bishop_black.png';
import blackRook   from '../../../assets/icons/chess_board/Black Pieces/spr_tower_black.png';
import blackQueen  from '../../../assets/icons/chess_board/Black Pieces/spr_queen_black.png';
import blackKing   from '../../../assets/icons/chess_board/Black Pieces/spr_king_black.png';

const PIECE_IMAGES = {
    white: { pawn: whitePawn, knight: whiteKnight, bishop: whiteBishop, rook: whiteRook, queen: whiteQueen, king: whiteKing },
    black: { pawn: blackPawn, knight: blackKnight, bishop: blackBishop, rook: blackRook, queen: blackQueen, king: blackKing },
};

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
    } = useChessLogic();

    const [activeMenu, setActiveMenu] = useState(null);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        if (gameOver) soundService.play(winner ? 'notify' : 'error');
    }, [gameOver, winner]);

    const toggleMenu = useCallback((menu) => {
        setActiveMenu(prev => prev === menu ? null : menu);
    }, []);

    const handleClickOutside = useCallback(() => {
        setActiveMenu(null);
    }, []);

    const handleCellClick = useCallback((row, col) => {
        soundService.play('click');
        handlePieceClick(row, col);
    }, [handlePieceClick]);

    const handleNewGame = useCallback(() => {
        initializeBoard();
    }, [initializeBoard]);

    const handleStartGame = useCallback(() => {
        soundService.play('click');
        initializeBoard();
        setShowIntro(false);
    }, [initializeBoard]);

    const handleShowRules = useCallback(() => {
        setShowRules(true);
    }, [setShowRules]);

    const getCapturedPieceDisplay = useCallback((piece) => {
        if (!piece) return null;
        if (!piece.currentType) {
            return <div className={`captured-unknown ${piece.color}`}>?</div>;
        }
        const src = PIECE_IMAGES[piece.color]?.[piece.currentType];
        if (!src) return null;
        return <img src={src} alt={`${piece.color} ${piece.currentType}`} className="piece-img" />;
    }, []);

    const getPieceImage = useCallback((piece) => {
        if (!piece || !piece.currentType) return null;
        const src = PIECE_IMAGES[piece.color]?.[piece.currentType];
        if (!src) return null;
        return <img src={src} alt={`${piece.color} ${piece.currentType}`} className="piece-img" />;
    }, []);

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
                        <li>Click on an unobserved piece to collapse its wave function (counts as your turn)</li>
                        <li>When observed, a piece randomly becomes one of its two potential types</li>
                        <li>Pieces that land on dark squares return to superposition, unless fully collapsed</li>
                    </ul>
                    <h3>Movement Rules</h3>
                    <ul>
                        <li>You can only move pieces that have been observed (have a definite type)</li>
                        <li>Moving in an L-shape collapses a piece to knight; diagonal to bishop; straight to rook</li>
                        <li>Capture the opponent's King to win</li>
                    </ul>
                    <h3>Strategy Tips</h3>
                    <ul>
                        <li>Observe your pieces strategically to reveal advantageous types</li>
                        <li>Force pieces to collapse into specific types by how you move them</li>
                        <li>The uncertainty of piece types adds a layer of strategy!</li>
                    </ul>
                </div>
                <div className="rules-footer">
                    <p>Based on quantum mechanical principles of superposition and wave function collapse.</p>
                </div>
                <button onClick={() => setShowRules(false)}>Got it!</button>
            </div>
        </div>
    ));

    const CapturedPieces = useMemo(() => (
        <div className="captured-pieces">
            <div className="captures-row">
                <div className="captures-side-dot white-dot" title="White captured" />
                <div className="captures-list">
                    {capturedPieces.white.length === 0
                        ? <span className="captures-empty">none</span>
                        : capturedPieces.white.map((piece, i) => (
                            <div key={piece.id || `w-${i}`} className="captured-piece">
                                {getCapturedPieceDisplay(piece)}
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="captures-row">
                <div className="captures-side-dot black-dot" title="Black captured" />
                <div className="captures-list">
                    {capturedPieces.black.length === 0
                        ? <span className="captures-empty">none</span>
                        : capturedPieces.black.map((piece, i) => (
                            <div key={piece.id || `b-${i}`} className="captured-piece">
                                {getCapturedPieceDisplay(piece)}
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    ), [capturedPieces, getCapturedPieceDisplay]);

    const GameBoard = useMemo(() => (
        <div className="board">
            {board.map((row, i) => (
                <div key={`row-${i}`} className="row">
                    {row.map((piece, j) => {
                        const isEvenCell = (i + j) % 2 === 0;
                        const isSelected = selectedPiece && selectedPiece[0] === i && selectedPiece[1] === j;
                        const isPossibleMove = possibleMoves.some(move => move[0] === i && move[1] === j);
                        const isCapture = isPossibleMove && board[i][j] !== null;

                        return (
                            <div
                                key={`cell-${i}-${j}`}
                                className={`cell ${isEvenCell ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isPossibleMove ? 'possible-move' : ''}`}
                                onClick={() => handleCellClick(i, j)}
                                data-capture={isCapture}
                            >
                                {piece && (
                                    <div className={`piece ${piece.color} ${piece.currentType ? 'observed' : 'unobserved'} ${piece.isFullyCollapsed ? 'fully-collapsed' : ''}`}>
                                        {piece.currentType ? (
                                            getPieceImage(piece)
                                        ) : (
                                            <div className="piece-info">
                                                <span className="current-type">?</span>
                                                <div className="potential-types">
                                                    <span className="type1">{piece.type1?.[0]?.toUpperCase() ?? '?'}</span>
                                                    <span className="type2">{piece.type2?.[0]?.toUpperCase() ?? '?'}</span>
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
    ), [board, selectedPiece, possibleMoves, handleCellClick, getPieceImage]);

    if (showIntro) {
        return (
            <div className="quantum-chess">
                <div className="qc-intro-screen">
                    <div className="qc-intro-logo">
                        <span className="qc-logo-schrodinger">Schrödinger's</span>
                        <span className="qc-logo-chess">Chess</span>
                    </div>
                    <p className="qc-intro-tagline">Quantum superposition meets the classic game of chess</p>
                    <div className="qc-intro-rules">
                        <div className="qc-intro-rule"><span>Pieces exist as two types simultaneously until observed</span></div>
                        <div className="qc-intro-rule"><span>Click an unobserved piece (?) to collapse its wave function</span></div>
                        <div className="qc-intro-rule"><span>How you move determines which type a piece collapses to</span></div>
                        <div className="qc-intro-rule"><span>Landing on dark squares sends pieces back to superposition</span></div>
                        <div className="qc-intro-rule"><span>Capture the enemy King to win</span></div>
                    </div>
                    <button className="qc-intro-btn" onClick={handleStartGame}>▶ Start Game</button>
                </div>
            </div>
        );
    }

    return (
        <div className="quantum-chess" onClick={handleClickOutside}>
            <div className="quantum-chess-menu-bar">
                <div
                    className={`quantum-chess-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}
                >
                    <span>File</span>
                    <div className="quantum-chess-menu-dropdown">
                        <div className="quantum-chess-menu-option" onClick={handleNewGame}>New Game</div>
                        <div className="quantum-chess-menu-option" onClick={() => setShowIntro(true)}>Main Menu</div>
                    </div>
                </div>
                <div
                    className={`quantum-chess-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleMenu('help'); }}
                >
                    <span>Help</span>
                    <div className="quantum-chess-menu-dropdown">
                        <div className="quantum-chess-menu-option" onClick={handleShowRules}>How to Play</div>
                    </div>
                </div>
            </div>

            {/* Prominent turn indicator between menu bar and game area */}
            <div className={`qc-turn-bar ${gameOver ? 'qc-turn-over' : `qc-turn-${currentPlayer}`}`}>
                {!gameOver && <div className={`qc-turn-dot qc-dot-${currentPlayer}`} />}
                <span className="qc-turn-text">
                    {gameOver
                        ? (winner ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!` : 'Game Over')
                        : `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`
                    }
                </span>
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
