import { useState, useEffect } from 'react';

export default function useChessLogic() {
    const [board, setBoard] = useState([]);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('white');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
    const [showRules, setShowRules] = useState(false);

    function createInitialBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        
        const primaryTypes = ['rook', 'knight', 'bishop', 'king', 'queen', 'bishop', 'knight', 'rook'];
        
        const secondaryPool = [
            'rook', 'rook',
            'knight', 'knight',
            'bishop', 'bishop',
            'queen',
            'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'
        ];
        
        for (let i = secondaryPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [secondaryPool[i], secondaryPool[j]] = [secondaryPool[j], secondaryPool[i]];
        }
        
        for (let i = 0; i < 8; i++) {
            board[7][i] = {
                currentType: primaryTypes[i] === 'king' ? 'king' : null,
                type1: primaryTypes[i],
                type2: primaryTypes[i] === 'king' ? 'king' : secondaryPool.pop(),
                color: 'white',
                isChosen: primaryTypes[i] === 'king'
            };
            board[6][i] = {
                currentType: null,
                type1: 'pawn',
                type2: secondaryPool.pop(),
                color: 'white',
                isChosen: false
            };

            board[0][i] = {
                currentType: primaryTypes[i] === 'king' ? 'king' : null,
                type1: primaryTypes[i],
                type2: primaryTypes[i] === 'king' ? 'king' : secondaryPool.pop(),
                color: 'black',
                isChosen: primaryTypes[i] === 'king'
            };
            board[1][i] = {
                currentType: null,
                type1: 'pawn',
                type2: secondaryPool.pop(),
                color: 'black',
                isChosen: false
            };
        }
        
        return board;
    }

    function initializeBoard() {
        setBoard(createInitialBoard());
        setGameOver(false);
        setCurrentPlayer('white');
        setPossibleMoves([]);
        setSelectedPiece(null);
        setCapturedPieces({ white: [], black: [] });
        setWinner(null);
    }

    useEffect(() => {
        initializeBoard();
    }, []);

    const handlePieceClick = (row, col) => {
        if (gameOver) return;
        
        const piece = board[row][col];
        
        if (selectedPiece) {
            const [selectedRow, selectedCol] = selectedPiece;
            const selectedPieceObj = board[selectedRow][selectedCol];
            
            const isMoveInPossibleMoves = possibleMoves.some(move => move[0] === row && move[1] === col);
            
            if (piece && piece.color === selectedPieceObj.color) {
                setSelectedPiece([row, col]);
                const moves = calculatePossibleMoves(row, col, piece);
                setPossibleMoves(moves);
                return;
            }
            
            if (isMoveInPossibleMoves) {
                movePiece(selectedPiece, row, col);
                setPossibleMoves([]);
                setSelectedPiece(null);
                return;
            }
            
            setPossibleMoves([]);
            setSelectedPiece(null);
            return;
        }
        
        if (!piece || piece.color !== currentPlayer) return;
        
        if (!piece.currentType) {
            observePiece(row, col);
            return;
        }
        
        setSelectedPiece([row, col]);
        const moves = calculatePossibleMoves(row, col, piece);
        setPossibleMoves(moves);
    };

    const movePiece = (selected, newRow, newCol) => {
        const [fromRow, fromCol] = selected;
        const piece = board[fromRow][fromCol];
        const targetPiece = board[newRow][newCol];
        
        const moveType = getMoveType(fromRow, fromCol, newRow, newCol);
        
        const newBoard = [...board.map(row => [...row])];
        
        if (targetPiece) {
            setCapturedPieces(prev => {
                const newCaptured = { ...prev };
                newCaptured[currentPlayer].push(targetPiece);
                return newCaptured;
            });
        }
        
        newBoard[newRow][newCol] = {
            ...piece,
            currentType: piece.currentType
        };
        newBoard[fromRow][fromCol] = null;
        
        if (piece.currentType === 'pawn' && (
            (piece.color === 'white' && newRow === 0) || 
            (piece.color === 'black' && newRow === 7)
        )) {
            newBoard[newRow][newCol].currentType = 'queen';
        }
        
        if (targetPiece && targetPiece.currentType === 'king') {
            setGameOver(true);
            setWinner(currentPlayer);
        }
        
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
        
        if (moveType) {
            updatePieceType(newBoard[newRow][newCol], moveType);
        }
    };

    const observePiece = (row, col) => {
        const piece = board[row][col];
        if (!piece || piece.isChosen || piece.currentType) return;
        
        const newBoard = [...board.map(row => [...row])];
        
        const randomChoice = Math.random() > 0.5 ? 'type1' : 'type2';
        const chosenType = piece[randomChoice];
        
        newBoard[row][col] = {
            ...piece,
            currentType: chosenType,
            isChosen: true
        };
        
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
    };

    const calculatePossibleMoves = (row, col, piece) => {
        if (!piece || !piece.currentType) return [];
        
        const moves = [];
        const { currentType, color } = piece;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (isLegalMove(piece, row, col, i, j, board)) {
                    moves.push([i, j]);
                }
            }
        }
        
        return moves;
    };

    const isValidPosition = (row, col) => {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    };

    const getMoveType = (fromRow, fromCol, toRow, toCol) => {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        
        if (rowDiff === 2 && colDiff === 1) return 'knight';
        if (rowDiff === 1 && colDiff === 2) return 'knight';
        if (rowDiff === colDiff) return 'bishop';
        if (rowDiff === 0 || colDiff === 0) return 'rook';
        
        return null;
    };

    const isLegalMove = (piece, fromRow, fromCol, toRow, toCol, board) => {
        if (!isValidPosition(toRow, toCol)) return false;
        if (fromRow === toRow && fromCol === toCol) return false;
        
        const targetPiece = board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        return isValidMoveForType(piece.currentType, fromRow, fromCol, toRow, toCol, board);
    };

    const updatePieceType = (piece, moveType) => {
        if (!piece || piece.currentType === 'king' || !moveType) return;
        
        const newPiece = { ...piece };
        
        if (moveType === 'knight') {
            if (newPiece.type1 === 'knight' && newPiece.type2 !== 'knight') {
                newPiece.currentType = 'knight';
            } else if (newPiece.type2 === 'knight' && newPiece.type1 !== 'knight') {
                newPiece.currentType = 'knight';
            }
        } else if (moveType === 'bishop') {
            if (newPiece.type1 === 'bishop' && newPiece.type2 !== 'bishop') {
                newPiece.currentType = 'bishop';
            } else if (newPiece.type2 === 'bishop' && newPiece.type1 !== 'bishop') {
                newPiece.currentType = 'bishop';
            }
        } else if (moveType === 'rook') {
            if (newPiece.type1 === 'rook' && newPiece.type2 !== 'rook') {
                newPiece.currentType = 'rook';
            } else if (newPiece.type2 === 'rook' && newPiece.type1 !== 'rook') {
                newPiece.currentType = 'rook';
            }
        }
        
        const [type1, type2] = [newPiece.type1, newPiece.type2];
        if ((type1 === 'queen' || type2 === 'queen') && newPiece.currentType !== 'queen') {
            if (Math.random() < 0.3) {
                newPiece.currentType = 'queen';
            }
        }
    };

    const isValidMoveForType = (type, fromRow, fromCol, toRow, toCol, board) => {
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        
        switch (type) {
            case 'pawn': {
                const direction = board[fromRow][fromCol].color === 'white' ? -1 : 1;
                const startingRow = board[fromRow][fromCol].color === 'white' ? 6 : 1;
                
                if (colDiff === 0) {
                    if (rowDiff === direction && !board[toRow][toCol]) {
                        return true;
                    }
                    if (fromRow === startingRow && rowDiff === 2 * direction && 
                        !board[fromRow + direction][fromCol] && !board[toRow][toCol]) {
                        return true;
                    }
                } else if (absColDiff === 1 && rowDiff === direction) {
                    return board[toRow][toCol] !== null;
                }
                return false;
            }
            case 'knight':
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
            case 'bishop':
                return absRowDiff === absColDiff && isPathClear(fromRow, fromCol, toRow, toCol, board);
            case 'rook':
                return (rowDiff === 0 || colDiff === 0) && isPathClear(fromRow, fromCol, toRow, toCol, board);
            case 'queen':
                return ((rowDiff === 0 || colDiff === 0) || absRowDiff === absColDiff) && 
                       isPathClear(fromRow, fromCol, toRow, toCol, board);
            case 'king':
                return absRowDiff <= 1 && absColDiff <= 1;
            default:
                return false;
        }
    };

    const isPathClear = (fromRow, fromCol, toRow, toCol, board) => {
        const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
        const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (board[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        
        return true;
    };

    const sharePosition = () => {
        let text = "Check out this Quantum Chess position! ";
        
        if (gameOver) {
            text += `${winner.charAt(0).toUpperCase() + winner.slice(1)} won! `;
        }
        
        if (navigator.share) {
            navigator.share({
                title: 'Quantum Chess',
                text: text
            }).catch(err => {
                copyToClipboard(text);
            });
        } else {
            copyToClipboard(text);
        }
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('Position copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy: ', err);
            });
    };

    return {
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
    };
} 