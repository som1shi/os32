import { useState, useEffect, useRef, useCallback } from 'react';
import useScoreSubmission from '../../../../firebase/useScoreSubmission';

export default function useRefinerLogic() {
    const [numbers, setNumbers] = useState([]);
    const [selectedNumbers, setSelectedNumbers] = useState([]);
    const [targetSum, setTargetSum] = useState(0);
    const [successfulSelections, setSuccessfulSelections] = useState([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [animatingToTarget, setAnimatingToTarget] = useState(false);
    const [scaryCells, setScaryCells] = useState([]);
    const [lastTargetTime, setLastTargetTime] = useState(0);
    const [hintShown, setHintShown] = useState(false);
    
    const [selectionBox, setSelectionBox] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    
    const timerRef = useRef(null);
    const hintTimerRef = useRef(null);
    const gridRef = useRef(null);
    const targetBoxRef = useRef(null);
    
    const [gameDuration, setGameDuration] = useState(60);
    
    const [shareFeedback, setShareFeedback] = useState(false);
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    const { submitGameScore, submitting, error: submitError, success: submitSuccess } = useScoreSubmission();
    const scoreRef = useRef(0);
    const scoreSubmissionInitiatedRef = useRef(false);
    
    const generateRandomNumber = (row, col) => {
        return {
            value: Math.floor(Math.random() * 10),
            id: `n-${Date.now()}-${Math.random()}-${row}-${col}`,
            row,
            col,
            selected: false,
            animating: false,
            scary: false
        };
    };
    
    const findSolution = (allNumbers, target) => {
        const rows = 8;
        const cols = 16;
        const grid = Array(rows).fill().map(() => Array(cols).fill(null));
        
        allNumbers.forEach(n => {
            if (n.row < rows && n.col < cols) {
                grid[n.row][n.col] = n;
            }
        });
        
        for (let height = 1; height <= 4; height++) {
            for (let width = 1; width <= 4; width++) {
                if (height * width < 2 || height * width > 9) continue;
                
                for (let startRow = 0; startRow <= rows - height; startRow++) {
                    for (let startCol = 0; startCol <= cols - width; startCol++) {
                        let sum = 0;
                        let boxNumbers = [];
                        
                        for (let r = startRow; r < startRow + height; r++) {
                            for (let c = startCol; c < startCol + width; c++) {
                                if (grid[r][c]) {
                                    sum += grid[r][c].value;
                                    boxNumbers.push(grid[r][c].id);
                                }
                            }
                        }
                        
                        if (sum === target && boxNumbers.length > 0) {
                            return boxNumbers;
                        }
                    }
                }
            }
        }
        
        for (let startRow = 0; startRow < rows; startRow++) {
            for (let startCol = 0; startCol < cols; startCol++) {
                let sum = 0;
                let lineNumbers = [];
                for (let c = startCol; c < Math.min(startCol + 4, cols); c++) {
                    if (grid[startRow][c]) {
                        sum += grid[startRow][c].value;
                        lineNumbers.push(grid[startRow][c].id);
                        if (sum === target && lineNumbers.length >= 2) {
                            return lineNumbers;
                        }
                    }
                }
                
                sum = 0;
                lineNumbers = [];
                for (let r = startRow; r < Math.min(startRow + 4, rows); r++) {
                    if (grid[r][startCol]) {
                        sum += grid[r][startCol].value;
                        lineNumbers.push(grid[r][startCol].id);
                        if (sum === target && lineNumbers.length >= 2) {
                            return lineNumbers;
                        }
                    }
                }
            }
        }
        
        return [];
    };
    
    const generateNumbers = () => {
        const newNumbers = [];
        const rows = 8;
        const cols = 16;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                newNumbers.push(generateRandomNumber(row, col));
            }
        }
        
        const boxHeight = Math.floor(Math.random() * 3) + 1;
        const boxWidth = Math.floor(Math.random() * 3) + 1;
        
        const startRow = Math.floor(Math.random() * (rows - boxHeight));
        const startCol = Math.floor(Math.random() * (cols - boxWidth));
        
        let sum = 0;
        for (let r = startRow; r < startRow + boxHeight; r++) {
            for (let c = startCol; c < startCol + boxWidth; c++) {
                const index = r * cols + c;
                if (index < newNumbers.length) {
                    sum += newNumbers[index].value;
                }
            }
        }
        
        setTargetSum(sum);
        
        setLastTargetTime(Date.now());
        setHintShown(false);
        setScaryCells([]);
        
        return newNumbers;
    };

    const replaceSelectedNumbers = () => {
        const selectedIds = new Set(selectedNumbers);
        
        const selectedCells = numbers
            .filter(n => selectedIds.has(n.id))
            .map(n => ({
                id: n.id,
                value: n.value,
                element: document.querySelector(`[data-id="${n.id}"]`),
                row: n.row,
                col: n.col
            }));
        
        setSuccessfulSelections(selectedCells.map(n => n.value));
        setAnimatingToTarget(true);
        
        const targetBox = targetBoxRef.current;
        const gridRect = gridRef.current.getBoundingClientRect();
        
        if (targetBox) {
            const targetRect = targetBox.getBoundingClientRect();
            
            selectedCells.forEach(cell => {
                if (cell.element) {
                    const cellRect = cell.element.getBoundingClientRect();
                    
                    const flyingEl = document.createElement('div');
                    flyingEl.className = 'flying-number';
                    flyingEl.textContent = cell.value;
                    
                    flyingEl.style.position = 'fixed';
                    flyingEl.style.left = `${cellRect.left}px`;
                    flyingEl.style.top = `${cellRect.top}px`;
                    flyingEl.style.width = `${cellRect.width}px`;
                    flyingEl.style.height = `${cellRect.height}px`;
                    flyingEl.style.display = 'flex';
                    flyingEl.style.alignItems = 'center';
                    flyingEl.style.justifyContent = 'center';
                    flyingEl.style.fontSize = '16px';
                    flyingEl.style.fontWeight = 'bold';
                    flyingEl.style.color = '#7AF3D0';
                    flyingEl.style.zIndex = '50';
                    
                    document.body.appendChild(flyingEl);
                    
                    setTimeout(() => {
                        flyingEl.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.2)';
                        flyingEl.style.left = `${targetRect.left + targetRect.width/2 - cellRect.width/2}px`;
                        flyingEl.style.top = `${targetRect.top + targetRect.height/2 - cellRect.height/2}px`;
                        flyingEl.style.opacity = '0.8';
                        flyingEl.style.transform = 'scale(0.5)';
                        
                        setTimeout(() => {
                            document.body.removeChild(flyingEl);
                        }, 600);
                    }, 50 + (cell.row + cell.col) * 20);
                }
            });
            
            targetBox.classList.add('receiving');
            
            setTimeout(() => {
                targetBox.classList.remove('receiving');
                
                targetBox.classList.add('changing-target');
                
                const newNumbers = [...numbers];
                let replacements = 0;
                
                for (let i = 0; i < newNumbers.length; i++) {
                    if (selectedIds.has(newNumbers[i].id)) {
                        const { row, col } = newNumbers[i];
                        newNumbers[i] = generateRandomNumber(row, col);
                        replacements++;
                    }
                }
                
                setNumbers(prev => prev.map(n => ({...n, selected: false, animating: selectedIds.has(n.id)})));
                
                setTimeout(() => {
                    setNumbers(newNumbers);
                    setSelectedNumbers([]);
                    setAnimatingToTarget(false);
                    
                    const newTarget = Math.floor(Math.random() * 15) + 5;
                    setTargetSum(newTarget);
                    setLastTargetTime(Date.now());
                    setHintShown(false);
                    setScaryCells([]);
                    
                    setTimeout(() => {
                        targetBox.classList.remove('changing-target');
                    }, 500);
                    
                }, 300);
            }, 800);
        }
    };

    useEffect(() => {
        if (selectedNumbers.length > 0 && !animatingToTarget) {
            const currentSum = getCurrentSum();
            
            if (currentSum === targetSum) {
                const newScore = score + 1;
                scoreRef.current = newScore;
                setScore(newScore);
                
                replaceSelectedNumbers();
            } else if (currentSum > 0) {
                setTimeout(() => {
                    setSelectedNumbers([]);
                    setNumbers(prev => prev.map(n => ({...n, selected: false})));
                }, 300);
            }
        }
    }, [selectedNumbers, targetSum, score]);
    
    useEffect(() => {
        scoreRef.current = score;
    }, [score]);
    
    useEffect(() => {
        if (!gameActive && !gameOver) {
            setScoreSubmitted(false);
            scoreSubmissionInitiatedRef.current = false;
        }
    }, [gameActive, gameOver]);
    
    useEffect(() => {
        if (!gameActive && !gameOver) {
            setNumbers(generateNumbers());
            setScaryCells([]);
        }
    }, [gameActive, gameOver]);
    
    useEffect(() => {
        if (gameActive && numbers.length > 0 && !animatingToTarget) {
            const timeSinceLastTarget = Date.now() - lastTargetTime;
            
            if (timeSinceLastTarget > 10000 && !hintShown) {
                const solution = findSolution(numbers, targetSum);
                
                if (solution.length > 0) {
                    setScaryCells(solution);
                    setHintShown(true);
                }
            }
        }
        
        return () => {};
    }, [gameActive, numbers, targetSum, lastTargetTime, hintShown, timeLeft, animatingToTarget]);
    
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (hintTimerRef.current) {
                clearInterval(hintTimerRef.current);
            }
            
            setGameActive(false);
            setGameOver(false);
            
            const flyingNumbers = document.querySelectorAll('.flying-number');
            flyingNumbers.forEach(el => {
                if (document.body.contains(el)) {
                    document.body.removeChild(el);
                }
            });
        };
    }, []);
    
    const startGame = () => {
        setGameActive(true);
        setGameOver(false);
        setScore(0);
        scoreRef.current = 0;
        setScoreSubmitted(false);
        scoreSubmissionInitiatedRef.current = false;
        
        setTimeLeft(gameDuration);
        setNumbers(generateNumbers());
        setSelectedNumbers([]);
        setSuccessfulSelections([]);
        setAnimatingToTarget(false);
        setScaryCells([]);
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };
    
    const handleMouseDown = useCallback((e) => {
        if (!gameActive || animatingToTarget) return;
        
        e.preventDefault();
        
        setSelectedNumbers([]);
        setNumbers(prev => prev.map(n => ({...n, selected: false})));
        
        const gridRect = gridRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const startX = clientX - gridRect.left;
        const startY = clientY - gridRect.top;
        
        setSelectionStart({ x: startX, y: startY });
        setSelectionBox({
            left: startX,
            top: startY,
            width: 1,
            height: 1
        });
        setIsSelecting(true);
    }, [gameActive, animatingToTarget]);
    
    const handleMouseMove = useCallback((e) => {
        if (!isSelecting || !gameActive || animatingToTarget) return;
        
        e.preventDefault();
        
        const gridRect = gridRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const currentX = Math.max(0, Math.min(clientX - gridRect.left, gridRect.width));
        const currentY = Math.max(0, Math.min(clientY - gridRect.top, gridRect.height));
        
        const left = Math.min(selectionStart.x, currentX);
        const top = Math.min(selectionStart.y, currentY);
        const width = Math.abs(currentX - selectionStart.x);
        const height = Math.abs(currentY - selectionStart.y);
        
        setSelectionBox({ left, top, width, height });
    }, [isSelecting, gameActive, animatingToTarget, selectionStart]);
    
    const handleMouseUp = useCallback((e) => {
        if (!isSelecting || !gameActive) return;
        
        e.preventDefault();
        
        const finalSelectionBox = selectionBox;
        setIsSelecting(false);
        setSelectionBox(null);
        
        const gridRect = gridRef.current.getBoundingClientRect();
        
        const selectedIds = [];
        const cellElements = document.querySelectorAll('.grid-cell');
        
        cellElements.forEach(cell => {
            const cellRect = cell.getBoundingClientRect();

            const cellCenterX = cellRect.left + (cellRect.width / 2) - gridRect.left;
            const cellCenterY = cellRect.top + (cellRect.height / 2) - gridRect.top;

            const isInside = 
                cellCenterX >= finalSelectionBox.left && 
                cellCenterX <= finalSelectionBox.left + finalSelectionBox.width &&
                cellCenterY >= finalSelectionBox.top && 
                cellCenterY <= finalSelectionBox.top + finalSelectionBox.height;
            
            if (isInside) {
                const id = cell.getAttribute('data-id');
                if (id) selectedIds.push(id);
            }
        });
        
        if (selectedIds.length > 0) {
            setSelectedNumbers(selectedIds);
            
            setNumbers(prev => prev.map(n => ({
                ...n,
                selected: selectedIds.includes(n.id)
            })));
        }
    }, [isSelecting, gameActive, selectionBox, numbers]);
    
    const getCurrentSum = useCallback(() => {
        return selectedNumbers.reduce((sum, id) => {
            const number = numbers.find(n => n.id === id);
            return sum + (number ? number.value : 0);
        }, 0);
    }, [selectedNumbers, numbers]);
    
    const endGame = () => {
        clearInterval(timerRef.current);
        setGameActive(false);
        setGameOver(true);
        
        const finalScore = scoreRef.current;
        
        if (!scoreSubmitted && !submitting && !scoreSubmissionInitiatedRef.current) {
            setScoreSubmitted(true);
            scoreSubmissionInitiatedRef.current = true;
            
            submitScore(finalScore);
        }
    };
    
    const submitScore = async (finalScore) => {
        try {
            if (submitting || submitSuccess) {
                return;
            }
            
            const collectionName = `refiner-${gameDuration}`;
            
            const result = await submitGameScore(collectionName, finalScore, {
                gameDuration,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
        } finally {
            setScoreSubmitted(true);
            scoreSubmissionInitiatedRef.current = true;
        }
    };
    
    const shareScore = () => {
        const gameUrl = "https://os32.vercel.app/game/refiner";
        const shareText = `I refined ${score} targets in ${gameDuration} seconds playing Refiner! Can you beat my score?`;
        copyToClipboard(`${shareText}\n\n${gameUrl}`);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
    };
    
    const copyToClipboard = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        textarea.select();
        document.execCommand('copy');
        
        document.body.removeChild(textarea);
        
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
    };

    return {
        numbers,
        selectedNumbers,
        targetSum,
        successfulSelections,
        score,
        timeLeft,
        gameActive,
        gameOver,
        animatingToTarget,
        scaryCells,
        selectionBox,
        isSelecting,
        gameDuration,
        shareFeedback,
        scoreSubmitted,
        submitting,
        submitSuccess,
        submitError,
        gridRef,
        targetBoxRef,
        setGameDuration,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        getCurrentSum,
        startGame,
        shareScore
    };
} 