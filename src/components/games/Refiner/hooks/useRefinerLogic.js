import { useState, useEffect, useRef } from 'react';

export default function useRefinerLogic() {
    const [numbers, setNumbers] = useState([]);
    const [selectedNumbers, setSelectedNumbers] = useState([]);
    const [targetSum, setTargetSum] = useState(0);
    const [successfulSelections, setSuccessfulSelections] = useState([]);
    const [score, setScore] = useState(0);
    const [targetsHit, setTargetsHit] = useState(0);
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
    
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [volume, setVolume] = useState(0.2);
    const audioRef = useRef(null);
    
    const correctSoundRef = useRef(null);
    const completeGameSoundRef = useRef(null);
    const hintRevealSoundRef = useRef(null);
    const wrongSoundRef = useRef(null);
    
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    
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
                    
                    console.log(`Replaced ${replacements} numbers with new ones. New target: ${newTarget}`);
                }, 300);
            }, 800);
        }
        
        playSound(correctSoundRef);
    };

    useEffect(() => {
        if (selectedNumbers.length > 0 && !animatingToTarget) {
            const currentSum = getCurrentSum();
            
            if (currentSum === targetSum) {
                setScore(prev => prev + 1);
                setTargetsHit(prev => prev + 1);
                
                replaceSelectedNumbers();
            } else if (currentSum > 0) {
                playSound(wrongSoundRef);
                
                setTimeout(() => {
                    setSelectedNumbers([]);
                    setNumbers(prev => prev.map(n => ({...n, selected: false})));
                }, 300);
            }
        }
    }, [selectedNumbers]);
    
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
                    console.log("Activating scary numbers hint");
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
    
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/refiner-ambient.wav');
            audioRef.current.loop = true;
            audioRef.current.volume = volume;
        }
        
        if (!correctSoundRef.current) {
            correctSoundRef.current = new Audio('/sounds/refiner-correct.wav');
            correctSoundRef.current.volume = volume * 0.7;
        }
        
        if (!completeGameSoundRef.current) {
            completeGameSoundRef.current = new Audio('/sounds/refiner-compete.mp3');
            completeGameSoundRef.current.volume = volume * 0.8;
        }
        
        if (!hintRevealSoundRef.current) {
            hintRevealSoundRef.current = new Audio('/sounds/refiner-hint-reveal.wav');
            hintRevealSoundRef.current.volume = volume * 0.6;
        }
        
        if (!wrongSoundRef.current) {
            wrongSoundRef.current = new Audio('/sounds/refiner-wrong.mp3');
            wrongSoundRef.current.volume = volume * 0.6;
        }
        
        const resumeAudio = () => {
            if (audioRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const audioContext = new AudioContext();
                    audioContext.resume();
                }
                
                if (isMusicPlaying) {
                    audioRef.current.play().catch(e => console.log('Auto-play prevented:', e));
                }
            }
        };
        
        window.addEventListener('click', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);
        
        return () => {
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
            
            [
                audioRef, 
                correctSoundRef, 
                completeGameSoundRef, 
                hintRevealSoundRef, 
                wrongSoundRef
            ].forEach(ref => {
                if (ref.current) {
                    ref.current.pause();
                    ref.current.currentTime = 0;
                }
            });
        };
    }, [isMusicPlaying, volume]);
    
    const startGame = () => {
        setGameActive(true);
        setGameOver(false);
        setScore(0);
        setTargetsHit(0);
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
        
        if (!isMusicPlaying && audioRef.current) {
            audioRef.current.play();
            setIsMusicPlaying(true);
        }
        preloadSounds();
    };
    
    const handleMouseDown = (e) => {
        if (!gameActive || animatingToTarget) return;
        
        e.preventDefault();
        
        setSelectedNumbers([]);
        setNumbers(prev => prev.map(n => ({...n, selected: false})));
        
        const gridRect = gridRef.current.getBoundingClientRect();
        const startX = e.clientX - gridRect.left;
        const startY = e.clientY - gridRect.top;
        
        setSelectionStart({ x: startX, y: startY });
        setSelectionBox({
            left: startX,
            top: startY,
            width: 1,
            height: 1
        });
        setIsSelecting(true);
    };
    
    const handleMouseMove = (e) => {
        if (!isSelecting || !gameActive || animatingToTarget) return;
        
        e.preventDefault();
        
        const gridRect = gridRef.current.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - gridRect.left, gridRect.width));
        const currentY = Math.max(0, Math.min(e.clientY - gridRect.top, gridRect.height));
        
        const left = Math.min(selectionStart.x, currentX);
        const top = Math.min(selectionStart.y, currentY);
        const width = Math.abs(currentX - selectionStart.x);
        const height = Math.abs(currentY - selectionStart.y);
        
        setSelectionBox({ left, top, width, height });
    };
    
    const handleMouseUp = (e) => {
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
    };
    
    const getCurrentSum = () => {
        return selectedNumbers.reduce((sum, id) => {
            const number = numbers.find(n => n.id === id);
            return sum + (number ? number.value : 0);
        }, 0);
    };
    
    const endGame = () => {
        clearInterval(timerRef.current);
        setGameActive(false);
        setGameOver(true);
        playSound(completeGameSoundRef);
    };
    
    const shareScore = () => {
        const gameUrl = "https://som1shi.github.io/refiner";
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
    
    const toggleMusic = () => {
        if (!isMusicPlaying) {
            audioRef.current.play().catch(e => console.log('Play prevented:', e));
            setIsMusicPlaying(true);
        } else {
            setShowVolumeControl(!showVolumeControl);
        }
        
        try {
            localStorage.setItem('refinerMusicEnabled', isMusicPlaying ? 'true' : 'false');
        } catch (e) {
            console.log('Could not save music preference');
        }
    };

    const muteMusic = () => {
        audioRef.current.pause();
        setIsMusicPlaying(false);
        setShowVolumeControl(false);
        
        try {
            localStorage.setItem('refinerMusicEnabled', 'false');
        } catch (e) {
            console.log('Could not save music preference');
        }
    };

    const playSound = (soundRef) => {
        if (!soundRef || !soundRef.current) return;
        
        try {
            soundRef.current.pause();
            soundRef.current.currentTime = 0;
            
            if (soundRef === correctSoundRef) {
                soundRef.current.volume = volume * 0.7;
            } else if (soundRef === wrongSoundRef) {
                soundRef.current.volume = volume * 0.6;
            } else if (soundRef === completeGameSoundRef) {
                soundRef.current.volume = volume * 0.8;
            } else if (soundRef === hintRevealSoundRef) {
                soundRef.current.volume = volume * 0.6;
            }
            
            setTimeout(() => {
                const playPromise = soundRef.current.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Sound play prevented:', error);
                        
                        setTimeout(() => {
                            soundRef.current.play().catch(e => console.log('Retry failed:', e));
                        }, 100);
                    });
                }
            }, 10);
        } catch (e) {
            console.error("Error playing sound:", e);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        
        if (correctSoundRef.current) {
            correctSoundRef.current.volume = newVolume * 0.7;
        }
        
        if (completeGameSoundRef.current) {
            completeGameSoundRef.current.volume = newVolume * 0.8;
        }
        
        if (hintRevealSoundRef.current) {
            hintRevealSoundRef.current.volume = newVolume * 0.6;
        }
        
        if (wrongSoundRef.current) {
            wrongSoundRef.current.volume = newVolume * 0.6;
        }
        
        try {
            localStorage.setItem('refinerMusicVolume', newVolume.toString());
        } catch (e) {
            console.log('Could not save volume preference');
        }
    };

    const preloadSounds = () => {
        try {
            if (correctSoundRef.current) {
                correctSoundRef.current.load();
            }
            if (wrongSoundRef.current) {
                wrongSoundRef.current.load();
            }
            if (completeGameSoundRef.current) {
                completeGameSoundRef.current.load();
            }
            if (hintRevealSoundRef.current) {
                hintRevealSoundRef.current.load();
            }
        } catch (e) {
            console.log('Error preloading sounds:', e);
        }
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
        isMusicPlaying,
        volume,
        gameDuration,
        shareFeedback,
        gridRef,
        targetBoxRef,
        diceFaceRef: null,
        audioRef,
        correctSoundRef,
        completeGameSoundRef,
        hintRevealSoundRef,
        wrongSoundRef,
        setGameDuration,
        setShowVolumeControl,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        getCurrentSum,
        startGame,
        toggleMusic,
        handleVolumeChange,
        shareScore
    };
} 