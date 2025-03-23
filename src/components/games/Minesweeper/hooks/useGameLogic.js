import { useState, useEffect, useCallback, useMemo } from 'react';
import { findSimilarWords, getRandomWord, hasWord } from '../../../../services/embeddings';
import useScoreSubmission from '../../../../firebase/useScoreSubmission';

const BOARD_SIZE = 8;
const MINES_COUNT = 8;

export default function useGameLogic() {
    const [board, setBoard] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [flagMode, setFlagMode] = useState(false);
    const [minesLeft, setMinesLeft] = useState(MINES_COUNT);
    const [targetWord, setTargetWord] = useState('');
    const [customWord, setCustomWord] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [score, setScore] = useState(0);
    const [showInfo, setShowInfo] = useState(false);
    const [shareText, setShareText] = useState('');
    const [showScoreSubmitted, setShowScoreSubmitted] = useState(false);
    const [isFirstClick, setIsFirstClick] = useState(true);
    const [currentSimilarWords, setCurrentSimilarWords] = useState(null);
    
    const { submitGameScore, submitting, error: submitError, success: submitSuccess } = useScoreSubmission();

    const handleCustomWordSubmit = useCallback(async () => {
        try {
            if (!customWord.trim()) {
                alert('Please enter a word');
                return;
            }

            const wordExists = await hasWord(customWord);
            if (!wordExists) {
                alert('Word not found in dictionary!');
                return;
            }

            const similarWords = await findSimilarWords(customWord);
            if (!similarWords) {
                alert('Could not find similar words!');
                return;
            }

            startNewGame(customWord.toUpperCase(), similarWords);
            setShowCustomInput(false);
            setCustomWord('');
        } catch (error) {
            alert('Error processing word!');
        }
    }, [customWord]);

    const createEmptyBoard = useCallback(() => {
        const newBoard = Array(BOARD_SIZE).fill().map(() => 
            Array(BOARD_SIZE).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                word: ''
            }))
        );
        setBoard(newBoard);
        setMinesLeft(MINES_COUNT);
        setIsFirstClick(true);
    }, []);

    const placeMines = useCallback((clickX, clickY, targetWord, similarWords) => {
        setBoard(prevBoard => {
            const newBoard = [...prevBoard.map(row => [...row])];
            
            const safeZone = [];
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    const newX = clickX + di;
                    const newY = clickY + dj;
                    if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
                        safeZone.push({x: newX, y: newY});
                    }
                }
            }
            
            let minesPlaced = 0;
            while (minesPlaced < MINES_COUNT) {
                const x = Math.floor(Math.random() * BOARD_SIZE);
                const y = Math.floor(Math.random() * BOARD_SIZE);
                
                const isInSafeZone = safeZone.some(pos => pos.x === x && pos.y === y);
                
                if (!isInSafeZone && !newBoard[x][y].isMine) {
                    newBoard[x][y].isMine = true;
                    newBoard[x][y].word = targetWord;
                    minesPlaced++;
                }
            }
            
            for (let i = 0; i < BOARD_SIZE; i++) {
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (!newBoard[i][j].isMine) {
                        let count = 0;
                        for (let di = -1; di <= 1; di++) {
                            for (let dj = -1; dj <= 1; dj++) {
                                if (i + di >= 0 && i + di < BOARD_SIZE && 
                                    j + dj >= 0 && j + dj < BOARD_SIZE &&
                                    newBoard[i + di][j + dj].isMine) {
                                    count++;
                                }
                            }
                        }
                        newBoard[i][j].neighborMines = count;
                        if (count > 0) {
                            if (count === 1) newBoard[i][j].word = similarWords.level1[Math.floor(Math.random() * similarWords.level1.length)];
                            else if (count === 2) newBoard[i][j].word = similarWords.level2[Math.floor(Math.random() * similarWords.level2.length)];
                            else newBoard[i][j].word = similarWords.level3[Math.floor(Math.random() * similarWords.level3.length)];
                        }
                    }
                }
            }
            
            return newBoard;
        });
        
        setIsFirstClick(false);
    }, []);

    const startNewGame = useCallback(async (word = null, providedSimilarWords = null) => {
        try {
            const newTargetWord = word || await getRandomWord();
            if (newTargetWord === 'ERROR') {
                alert('Error starting game!');
                return;
            }

            setTargetWord(newTargetWord);
            
            let similarWords = providedSimilarWords;
            if (!similarWords) {
                similarWords = await findSimilarWords(newTargetWord);
                if (!similarWords) {
                    alert('Error finding similar words!');
                    return;
                }
            }
            
            setCurrentSimilarWords(similarWords);
            
            createEmptyBoard();
            
            setGameOver(false);
            setWin(false);
            setMinesLeft(MINES_COUNT);
            if (!win) {
                setScore(0);
            }
            setShowScoreSubmitted(false);
        } catch (error) {
            alert('Error starting game!');
        }
    }, [createEmptyBoard, win]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const revealAllMines = useCallback(() => {
        setBoard(prevBoard => prevBoard.map(row => 
            row.map(cell => ({
                ...cell,
                isRevealed: cell.isMine ? true : cell.isRevealed
            }))
        ));
    }, []);

    const submitScore = useCallback(async (finalScore) => {
        try {
            await submitGameScore('minesweeper', finalScore, {
                targetWord,
                boardSize: BOARD_SIZE,
                minesCount: MINES_COUNT
            });
            
            setShowScoreSubmitted(true);
            
            setTimeout(() => {
                setShowScoreSubmitted(false);
            }, 3000);
        } catch (error) {
        }
    }, [targetWord, submitGameScore]);

    const checkWin = useCallback((currentBoard) => {
        const hasWon = currentBoard.every(row => 
            row.every(cell => 
                (cell.isMine && !cell.isRevealed) || (!cell.isMine && cell.isRevealed)
            )
        );
        if (hasWon) {
            setWin(true);
            const finalScore = score + 500;
            setScore(finalScore);
            
            submitScore(finalScore);
        }
    }, [score, submitScore]);

    const revealCell = useCallback((x, y) => {
        if (gameOver || win || board[x][y].isRevealed || board[x][y].isFlagged) return;

        if (isFirstClick) {
            placeMines(x, y, targetWord, currentSimilarWords);
            
            setBoard(prevBoard => {
                const newBoard = [...prevBoard.map(row => [...row])];
                
                const revealEmpty = (i, j) => {
                    if (i < 0 || i >= BOARD_SIZE || j < 0 || j >= BOARD_SIZE || 
                        newBoard[i][j].isRevealed || newBoard[i][j].isFlagged) return;
                    
                    newBoard[i][j].isRevealed = true;
                    setScore(prev => prev + 10);
                    
                    if (newBoard[i][j].neighborMines === 0) {
                        for (let di = -1; di <= 1; di++) {
                            for (let dj = -1; dj <= 1; dj++) {
                                revealEmpty(i + di, j + dj);
                            }
                        }
                    }
                };
                
                revealEmpty(x, y);
                checkWin(newBoard);
                return newBoard;
            });
            
            return;
        }

        if (board[x][y].isMine) {
            setGameOver(true);
            revealAllMines();
            setScore(0);
            return;
        }

        setBoard(prevBoard => {
            const newBoard = [...prevBoard.map(row => [...row])];
            
            const revealEmpty = (i, j) => {
                if (i < 0 || i >= BOARD_SIZE || j < 0 || j >= BOARD_SIZE || 
                    newBoard[i][j].isRevealed || newBoard[i][j].isFlagged) return;

                newBoard[i][j].isRevealed = true;
                setScore(prev => prev + 10);

                if (newBoard[i][j].neighborMines === 0) {
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            revealEmpty(i + di, j + dj);
                        }
                    }
                }
            };

            revealEmpty(x, y);
            checkWin(newBoard);
            return newBoard;
        });
    }, [board, gameOver, win, isFirstClick, targetWord, currentSimilarWords, placeMines, revealAllMines, checkWin]);

    const toggleFlag = useCallback((x, y) => {
        if (gameOver || win || board[x][y].isRevealed) return;

        if (isFirstClick) return;

        setBoard(prevBoard => {
            const newBoard = [...prevBoard.map(row => [...row])];
            newBoard[x][y].isFlagged = !newBoard[x][y].isFlagged;
            setMinesLeft(prev => newBoard[x][y].isFlagged ? prev - 1 : prev + 1);
            return newBoard;
        });
    }, [board, gameOver, win, isFirstClick]);

    const handleCellClick = useCallback((x, y, e) => {
        e.preventDefault();
        
        if (e.button === 2 || flagMode) {
            toggleFlag(x, y);
        } else if (e.button === 0) {
            revealCell(x, y);
        }
    }, [flagMode, toggleFlag, revealCell]);

    const generateShareText = useCallback(() => {
        let text = `I scored ${score} in WordSweeper\n \n`;
        text += `🎯 Word: ${targetWord}\n`;

        for (let j = 0; j < BOARD_SIZE; j++) { 
            for (let i = 0; i < BOARD_SIZE; i++) {
                const cell = board[i][j];
                if (cell.isMine && (cell.isRevealed || gameOver)) {
                    text += '💣 ';
                } else if (cell.isRevealed) {
                    switch(cell.neighborMines) {
                        case 1: text += '🟦 ';
                            break;
                        case 2: text += '🟧 ';
                            break;
                        case 3: text += '🟥 ';
                            break;
                        default: text += '⬜ ';
                            break;
                    }
                } else if (cell.isFlagged) {
                    text += '🚩 ';
                } else {
                    text += '⬛ ';
                }
            }
            text += '\n';
        }
        
        text += '\nPlay now at: ...\n';
        return text;
    }, [board, gameOver, score, targetWord]);

    const copyToClipboard = useCallback((text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            alert('Result copied to clipboard!');
        } catch (err) {
            alert('Failed to copy results.');
        }
        
        document.body.removeChild(textArea);
    }, []);

    const handleShare = useCallback(() => {
        const text = generateShareText();
        
        if (navigator.share) {
            navigator.share({
                title: 'My WordSweeper Score',
                text: text
            }).catch(() => {
                copyToClipboard(text);
            });
        } else {
            copyToClipboard(text);
        }
        
        setShareText(text);
    }, [generateShareText, copyToClipboard]);

    const gameState = useMemo(() => ({
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
        isFirstClick
    }), [
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
        isFirstClick
    ]);

    return {
        ...gameState,
        setFlagMode,
        setShowCustomInput,
        setCustomWord,
        setShowInfo,
        handleCustomWordSubmit,
        startNewGame,
        handleCellClick,
        handleShare
    };
} 