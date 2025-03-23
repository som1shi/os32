import { useState, useEffect, useRef, useCallback } from 'react';

const ROWS = 7;
const COLS = 7;

export default function useGameLogic() {
    const [board, setBoard] = useState(createEmptyBoard());
    const [currentPlayer, setCurrentPlayer] = useState('red');
    const [gameOver, setGameOver] = useState(false);
    const [diceRoll, setDiceRoll] = useState(null);
    const [canRotate, setCanRotate] = useState(false);
    const [winner, setWinner] = useState(null);
    const [isRotating, setIsRotating] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const diceFaceRef = useRef(null);
    const [isDiceRolling, setIsDiceRolling] = useState(false);

    function createEmptyBoard() {
        return Array(ROWS).fill().map(() => Array(COLS).fill(null));
    }

    const dropPiece = useCallback((col) => {
        if (gameOver || !isPlayerTurn || isRotating || isDiceRolling) return;
        
        const newBoard = [...board.map(row => [...row])];
        
        for (let row = ROWS - 1; row >= 0; row--) {
            if (!newBoard[row][col]) {
                newBoard[row][col] = currentPlayer;
                
                if (checkWin(row, col, newBoard, currentPlayer)) {
                    setBoard(newBoard);
                    setGameOver(true);
                    setWinner(currentPlayer);
                    return;
                }
                
                setBoard(newBoard);
                setIsPlayerTurn(false);
                
                setTimeout(() => {
                    rollDice();
                }, 200);
                return;
            }
        }
    }, [board, currentPlayer, gameOver, isPlayerTurn, isRotating, isDiceRolling]);

    const rollDice = () => {
        setIsDiceRolling(true);
        
        const diceFaceElement = document.querySelector('.rotate-connect-four .dice-face');
        if (diceFaceElement) {
            diceFaceElement.classList.add('rolling');
        }
        
        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setDiceRoll(roll);
            
            if (diceFaceRef.current) {
                diceFaceRef.current.classList.remove('rolling');
                diceFaceRef.current.className = `dice-face face-${roll}`;
            }
            
            if (roll === 6) {
                setCanRotate(true);
                setIsDiceRolling(false);
            } else {
                setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
                setTimeout(() => {
                    setDiceRoll(null);
                    setIsDiceRolling(false);
                    setIsPlayerTurn(true);
                }, 1500);
            }
        }, 800);
    };

    const rotateBoard = useCallback((direction) => {
        if (!canRotate || isRotating) return;
        
        setIsRotating(true);
        
        const newBoard = createEmptyBoard();
        
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                if (direction === 'left') {
                    newBoard[COLS - 1 - j][i] = board[i][j];
                } else {
                    newBoard[j][ROWS - 1 - i] = board[i][j];
                }
            }
        }
        
        const finalBoard = applyGravity(newBoard);
        
        const boardElement = document.querySelector('.rotate-connect-four .board');
        if (boardElement) {
            boardElement.classList.add(direction === 'left' ? 'rotating-left' : 'rotating-right');
            
            setTimeout(() => {
                setBoard(finalBoard);
                setDiceRoll(null);
                setCanRotate(false);
                setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
                boardElement.classList.remove('rotating-left', 'rotating-right');
                setIsRotating(false);
                setIsPlayerTurn(true);
            }, 550);
        } else {
            setBoard(finalBoard);
            setDiceRoll(null);
            setCanRotate(false);
            setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
            setIsRotating(false);
            setIsPlayerTurn(true);
        }
    }, [board, canRotate, currentPlayer, isRotating]);

    const applyGravity = (inputBoard) => {
        const newBoard = createEmptyBoard();
        
        for (let col = 0; col < COLS; col++) {
            let bottomRow = ROWS - 1;
            for (let row = ROWS - 1; row >= 0; row--) {
                if (inputBoard[row][col]) {
                    newBoard[bottomRow][col] = inputBoard[row][col];
                    bottomRow--;
                }
            }
        }
        
        return newBoard;
    };

    const checkWin = (row, col, board, player) => {
        for (let c = 0; c <= COLS - 4; c++) {
            if (col >= c && col < c + 4) {
                if (board[row][c] === player && 
                    board[row][c + 1] === player && 
                    board[row][c + 2] === player && 
                    board[row][c + 3] === player) {
                    return true;
                }
            }
        }

        for (let r = 0; r <= ROWS - 4; r++) {
            if (row >= r && row < r + 4) {
                if (board[r][col] === player && 
                    board[r + 1][col] === player && 
                    board[r + 2][col] === player && 
                    board[r + 3][col] === player) {
                    return true;
                }
            }
        }

        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (row >= r && row < r + 4 && col >= c && col < c + 4) {
                    if (board[r][c] === player && 
                        board[r + 1][c + 1] === player && 
                        board[r + 2][c + 2] === player && 
                        board[r + 3][c + 3] === player) {
                        return true;
                    }
                }
            }
        }

        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (row <= r && row > r - 4 && col >= c && col < c + 4) {
                    if (board[r][c] === player && 
                        board[r - 1][c + 1] === player && 
                        board[r - 2][c + 2] === player && 
                        board[r - 3][c + 3] === player) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    const shareGame = useCallback(() => {
        const shareText = `I just won a game of Rotate Connect Four as ${winner.toUpperCase()}! Can you beat my strategy? Play now!`;

        if (navigator.share) {
            navigator.share({
                title: 'Rotate Connect Four',
                text: shareText
            }).catch(err => {
                copyToClipboard(shareText);
            });
        } else {
            copyToClipboard(shareText);
        }
    }, [winner]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('Game result copied to clipboard! Share it with your friends.');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                alert('Could not share game automatically. Please copy this link manually!');
            });
    };

    const resetGame = useCallback(() => {
        setBoard(createEmptyBoard());
        setCurrentPlayer('red');
        setGameOver(false);
        setDiceRoll(null);
        setCanRotate(false);
        setWinner(null);
        setIsRotating(false);
        setIsDiceRolling(false);
        setIsPlayerTurn(true);
    }, []);

    return {
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
        isPlayerTurn,
        dropPiece,
        rotateBoard,
        shareGame,
        resetGame
    };
} 