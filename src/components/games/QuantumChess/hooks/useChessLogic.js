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
        
        const primaryTypes = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        
        const validPieceTypes = ['rook', 'knight', 'bishop', 'queen', 'pawn'];
        
        const secondaryPool = [
            'rook', 'rook', 
            'knight', 'knight', 
            'bishop', 'bishop', 
            'queen', 
            'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'  
        ];
        
        for (let i = secondaryPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [secondaryPool[i], secondaryPool[j]] = [secondaryPool[j], secondaryPool[i]];
        }
        
        for (let i = 0; i < 8; i++) {
            board[7][i] = {
                currentType: primaryTypes[i] === 'king' ? 'king' : null,
                type1: primaryTypes[i],
                type2: primaryTypes[i] === 'king' ? 'king' : secondaryPool.pop() || validPieceTypes[Math.floor(Math.random() * validPieceTypes.length)],
                color: 'white',
                isChosen: primaryTypes[i] === 'king',
                id: `white-back-${i}`
            };
            
            board[6][i] = {
                currentType: null,
                type1: 'pawn',
                type2: i < 7 ? (secondaryPool.pop() || validPieceTypes[Math.floor(Math.random() * validPieceTypes.length)]) : 'pawn',
                color: 'white',
                isChosen: false,
                id: `white-pawn-${i}`
            };

            board[0][7-i] = {
                currentType: primaryTypes[i] === 'king' ? 'king' : null,
                type1: primaryTypes[i],
                type2: primaryTypes[i] === 'king' ? 'king' : secondaryPool.pop() || validPieceTypes[Math.floor(Math.random() * validPieceTypes.length)],
                color: 'black',
                isChosen: primaryTypes[i] === 'king',
                id: `black-back-${i}`
            };
            
            board[1][7-i] = {
                currentType: null,
                type1: 'pawn',
                type2: i < 7 ? (secondaryPool.pop() || validPieceTypes[Math.floor(Math.random() * validPieceTypes.length)]) : 'pawn',
                color: 'black',
                isChosen: false,
                id: `black-pawn-${i}`
            };
        }
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j]) {
                    if (!validPieceTypes.includes(board[i][j].type1) && board[i][j].type1 !== 'king') {
                        board[i][j].type1 = validPieceTypes[Math.floor(Math.random() * validPieceTypes.length)];
                    }
                    if (!validPieceTypes.includes(board[i][j].type2) && board[i][j].type2 !== 'king') {
                        board[i][j].type2 = validPieceTypes[Math.floor(Math.random() * validPieceTypes.length)];
                    }
                }
            }
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
                const newCaptured = { 
                    white: [...prev.white],
                    black: [...prev.black]
                };
                const captureCollection = targetPiece.color === 'white' ? 'black' : 'white';
                newCaptured[captureCollection].push({
                    ...targetPiece,
                    id: `${Date.now()}-${Math.random()}`
                });
                return newCaptured;
            });
            
            if (targetPiece.currentType === 'king') {
                setGameOver(true);
                setWinner(currentPlayer);
                
                setBoard(newBoard);
                return;
            }
        }
        
        newBoard[newRow][newCol] = {
            ...piece,
            currentType: piece.currentType
        };
        newBoard[fromRow][fromCol] = null;
        
        if (piece.currentType === 'pawn') {
            const promotionRow = piece.color === 'white' ? 0 : 7;
            
            if (newRow === promotionRow) {
                newBoard[newRow][newCol].currentType = 'queen';
                newBoard[newRow][newCol].type1 = 'queen';
                newBoard[newRow][newCol].type2 = 'queen';
                newBoard[newRow][newCol].isFullyCollapsed = true;
            }
        }
        
        const isDestinationDarkSquare = (newRow + newCol) % 2 !== 0;
        if (isDestinationDarkSquare && !newBoard[newRow][newCol].isFullyCollapsed && 
            newBoard[newRow][newCol].currentType !== 'king') {
            
            newBoard[newRow][newCol] = {
                ...newBoard[newRow][newCol],
                currentType: null,
                isChosen: false
            };
        }
        
        setBoard(newBoard);
        
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
        
        if (moveType && !isDestinationDarkSquare) {
            updatePieceType(newBoard[newRow][newCol], moveType);
        }
    };

    const observePiece = (row, col) => {
        const piece = board[row][col];
        if (!piece || piece.isChosen || piece.currentType) return;
        
        const newBoard = [...board.map(row => [...row])];
        
        const validPieceTypes = ['rook', 'knight', 'bishop', 'queen', 'pawn', 'king'];
        const type1 = validPieceTypes.includes(piece.type1) ? piece.type1 : 'pawn';
        const type2 = validPieceTypes.includes(piece.type2) ? piece.type2 : 'knight';
        
        let probabilityType1 = 0.5;
        
        if (type1 === type2) {
            probabilityType1 = 1.0;
        }
        
        const randomChoice = Math.random() < probabilityType1 ? 'type1' : 'type2';
        const chosenType = piece[randomChoice] || (randomChoice === 'type1' ? type1 : type2);
        
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
        
        const newBoard = [...board.map(row => [...row])];
        
        let pieceRow = -1, pieceCol = -1;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (newBoard[i][j] === piece) {
                    pieceRow = i;
                    pieceCol = j;
                    break;
                }
            }
            if (pieceRow !== -1) break;
        }
        
        if (pieceRow === -1) return;
        
        const pieceToUpdate = newBoard[pieceRow][pieceCol];
        
        const hasPotentialType = (type) => {
            return pieceToUpdate.type1 === type || pieceToUpdate.type2 === type;
        };
        
        let collapsed = false;
        
        if (moveType === 'knight' && hasPotentialType('knight')) {
            pieceToUpdate.currentType = 'knight';
            collapsed = true;
            console.log('Piece collapsed to knight due to L-shaped movement');
        }
        else if (moveType === 'bishop' && hasPotentialType('bishop')) {
            pieceToUpdate.currentType = 'bishop';
            collapsed = true;
            console.log('Piece collapsed to bishop due to diagonal movement');
        }
        else if (moveType === 'rook' && hasPotentialType('rook')) {
            pieceToUpdate.currentType = 'rook';
            collapsed = true;
            console.log('Piece collapsed to rook due to straight movement');
        }
        
        if (!collapsed && hasPotentialType('queen') && 
            (moveType === 'rook' || moveType === 'bishop')) {
            if (Math.random() < 0.3) {
                pieceToUpdate.currentType = 'queen';
                collapsed = true;
                console.log('Piece collapsed to queen');
            }
        }
        
        if (collapsed) {
            pieceToUpdate.isFullyCollapsed = true;
            pieceToUpdate.type1 = pieceToUpdate.currentType;
            pieceToUpdate.type2 = pieceToUpdate.currentType;
        }
        
        setBoard(newBoard);
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