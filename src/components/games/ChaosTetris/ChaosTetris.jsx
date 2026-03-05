import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import './ChaosTetris.css';
import soundService from '../../../services/soundService';
import useScoreSubmission from '../../../firebase/useScoreSubmission';

const BOARD_W = 10;
const BOARD_H = 20;
const LINES_PER_FLIP = 4;
const INITIAL_DROP_MS = 600;
const HS_KEY = 'os32.chaostetris.highscore';

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: '#00d4ff' },
  O: { shape: [[1, 1], [1, 1]], color: '#ffd700' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#cc44ff' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#44dd44' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff4455' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#4488ff' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#ff8800' },
};
const PIECE_KEYS = Object.keys(TETROMINOES);

function emptyBoard() {
  return Array.from({ length: BOARD_H }, () => Array(BOARD_W).fill(null));
}

function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const t = TETROMINOES[key];
  return {
    shape: t.shape,
    color: t.color,
    x: Math.floor(BOARD_W / 2) - Math.floor(t.shape[0].length / 2),
    y: 0,
  };
}

function rotate(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

function collides(board, piece, dx = 0, dy = 0, newShape = null) {
  const shape = newShape || piece.shape;
  const nx = piece.x + dx;
  const ny = piece.y + dy;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const bx = nx + c;
      const by = ny + r;
      if (bx < 0 || bx >= BOARD_W || by >= BOARD_H) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

function lockPiece(board, piece) {
  const newBoard = board.map(row => [...row]);
  piece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        const bx = piece.x + c;
        const by = piece.y + r;
        if (by >= 0) newBoard[by][bx] = piece.color;
      }
    });
  });
  return newBoard;
}

function clearLines(board) {
  const cleared = board.filter(row => row.some(cell => !cell));
  const linesCleared = BOARD_H - cleared.length;
  const empty = Array.from({ length: linesCleared }, () => Array(BOARD_W).fill(null));
  return { board: [...empty, ...cleared], linesCleared };
}

function flipBoard(board) {
  return [...board].reverse();
}

function applyGravity(board) {
  const result = emptyBoard();
  for (let c = 0; c < BOARD_W; c++) {
    const col = [];
    for (let r = 0; r < BOARD_H; r++) {
      if (board[r][c]) col.push(board[r][c]);
    }
    for (let i = 0; i < col.length; i++) {
      result[BOARD_H - col.length + i][c] = col[i];
    }
  }
  return result;
}

function getDropMs(level) {
  return Math.max(80, INITIAL_DROP_MS - (level - 1) * 50);
}

const ChaosTetris = memo(() => {
  const [showIntro, setShowIntro] = useState(true);
  const [board, setBoard] = useState(emptyBoard());
  const [piece, setPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [linesSinceFlip, setLinesSinceFlip] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem(HS_KEY) || '0', 10));
  const [showRules, setShowRules] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const { submitGameScore, submitting: scoreSubmitting, success: scoreSuccess } = useScoreSubmission();

  const boardRef = useRef(emptyBoard());
  const pieceRef = useRef(null);
  const nextPieceRef = useRef(null);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);
  const isFlippingRef = useRef(false);
  const linesSinceFlipRef = useRef(0);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const dropIntervalRef = useRef(null);

  const spawnPiece = useCallback((nextPieceArg = null) => {
    const newPiece = nextPieceArg || nextPieceRef.current || randomPiece();
    const next = randomPiece();
    if (collides(boardRef.current, newPiece)) {
      gameOverRef.current = true;
      setGameOver(true);
      soundService.play('error');
      const s = scoreRef.current;
      if (s > parseInt(localStorage.getItem(HS_KEY) || '0', 10)) {
        localStorage.setItem(HS_KEY, String(s));
        setHighScore(s);
      }
      submitGameScore('chaostetris', s, { playerName: 'Player' });
      return;
    }
    pieceRef.current = newPiece;
    nextPieceRef.current = next;
    setPiece(newPiece);
    setNextPiece(next);
  }, []);

  const lockAndClear = useCallback((lockedBoard) => {
    const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);
    boardRef.current = clearedBoard;

    const newScore = scoreRef.current + [0, 100, 300, 500, 800][Math.min(linesCleared, 4)];
    const newLines = linesRef.current + linesCleared;
    const newLevel = Math.floor(newLines / 10) + 1;
    const newLinesSinceFlip = linesSinceFlipRef.current + linesCleared;

    scoreRef.current = newScore;
    linesRef.current = newLines;
    levelRef.current = newLevel;
    linesSinceFlipRef.current = newLinesSinceFlip;

    setScore(newScore);
    setLines(newLines);
    setLevel(newLevel);
    setLinesSinceFlip(newLinesSinceFlip);

    if (linesCleared > 0) soundService.play('notify');

    if (newLinesSinceFlip >= LINES_PER_FLIP) {
      linesSinceFlipRef.current = 0;
      setLinesSinceFlip(0);

      isFlippingRef.current = true;
      setIsFlipping(true);
      soundService.play('windowOpen');

      setTimeout(() => {
        const flipped = flipBoard(boardRef.current);
        const settled = applyGravity(flipped);
        boardRef.current = settled;
        setBoard(settled);
        isFlippingRef.current = false;
        setIsFlipping(false);
        spawnPiece();
      }, 500);
    } else {
      setBoard(clearedBoard);
      spawnPiece();
    }
  }, [spawnPiece]);

  const dropPiece = useCallback(() => {
    if (gameOverRef.current || pausedRef.current || isFlippingRef.current) return;
    const p = pieceRef.current;
    if (!p) return;

    if (!collides(boardRef.current, p, 0, 1)) {
      const moved = { ...p, y: p.y + 1 };
      pieceRef.current = moved;
      setPiece(moved);
    } else {
      const locked = lockPiece(boardRef.current, p);
      pieceRef.current = null;
      setPiece(null);
      lockAndClear(locked);
    }
  }, [lockAndClear]);

  useEffect(() => {
    if (showIntro || gameOver || !piece) return;
    if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    dropIntervalRef.current = setInterval(dropPiece, getDropMs(level));
    return () => clearInterval(dropIntervalRef.current);
  }, [level, showIntro, gameOver, piece, dropPiece]);

  const startGame = useCallback(() => {
    const b = emptyBoard();
    boardRef.current = b;
    gameOverRef.current = false;
    pausedRef.current = false;
    isFlippingRef.current = false;
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    linesSinceFlipRef.current = 0;

    setBoard(b);
    setScore(0);
    setLines(0);
    setLevel(1);
    setLinesSinceFlip(0);
    setGameOver(false);
    setPaused(false);
    setIsFlipping(false);
    setShowIntro(false);

    const first = randomPiece();
    const next = randomPiece();
    pieceRef.current = first;
    nextPieceRef.current = next;
    setPiece(first);
    setNextPiece(next);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (showIntro || gameOverRef.current || isFlippingRef.current) return;
      const p = pieceRef.current;
      if (!p) return;

      if (e.key === ' ') {
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
        setPaused(prev => !prev);
        return;
      }

      if (pausedRef.current) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!collides(boardRef.current, p, -1, 0)) {
          const moved = { ...p, x: p.x - 1 };
          pieceRef.current = moved;
          setPiece(moved);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!collides(boardRef.current, p, 1, 0)) {
          const moved = { ...p, x: p.x + 1 };
          pieceRef.current = moved;
          setPiece(moved);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        dropPiece();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const rotated = rotate(p.shape);
        if (!collides(boardRef.current, p, 0, 0, rotated)) {
          const rotPiece = { ...p, shape: rotated };
          pieceRef.current = rotPiece;
          setPiece(rotPiece);
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        let dropY = 0;
        while (!collides(boardRef.current, p, 0, dropY + 1)) dropY++;
        const dropped = { ...p, y: p.y + dropY };
        const locked = lockPiece(boardRef.current, dropped);
        pieceRef.current = null;
        setPiece(null);
        lockAndClear(locked);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showIntro, dropPiece, lockAndClear]);

  const displayBoard = useMemo(() => {
    const display = board.map(row => [...row]);
    if (piece) {
      piece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            const by = piece.y + r;
            const bx = piece.x + c;
            if (by >= 0 && by < BOARD_H && bx >= 0 && bx < BOARD_W) {
              display[by][bx] = piece.color;
            }
          }
        });
      });
    }
    return display;
  }, [board, piece]);

  const ghostPiece = useMemo(() => {
    if (!piece) return null;
    let dropY = 0;
    while (!collides(board, piece, 0, dropY + 1)) dropY++;
    return { ...piece, y: piece.y + dropY };
  }, [piece, board]);

  const displayBoardWithGhost = useMemo(() => {
    const display = displayBoard.map(row => [...row]);
    if (ghostPiece) {
      ghostPiece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            const by = ghostPiece.y + r;
            const bx = ghostPiece.x + c;
            if (by >= 0 && by < BOARD_H && bx >= 0 && bx < BOARD_W && !display[by][bx]) {
              display[by][bx] = 'ghost';
            }
          }
        });
      });
    }
    return display;
  }, [displayBoard, ghostPiece]);

  const nextPieceDisplay = useMemo(() => {
    if (!nextPiece) return null;
    const box = Array.from({ length: 4 }, () => Array(4).fill(null));
    const offsetR = Math.floor((4 - nextPiece.shape.length) / 2);
    const offsetC = Math.floor((4 - nextPiece.shape[0].length) / 2);
    nextPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) box[offsetR + r][offsetC + c] = nextPiece.color;
      });
    });
    return box;
  }, [nextPiece]);

  const chaosProgress = Math.min(linesSinceFlip / LINES_PER_FLIP, 1);

  const toggleMenu = useCallback((menu) => {
    setActiveMenu(prev => prev === menu ? null : menu);
  }, []);

  if (showIntro) {
    return (
      <div className="ct-game" onClick={() => setActiveMenu(null)}>
        <div className="ct-menu-bar">
          <div className={`ct-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}>
            <span>File</span>
            <div className="ct-menu-dropdown">
              <div className="ct-menu-option" onClick={() => { soundService.play('click'); startGame(); }}>New Game</div>
              <div className="ct-menu-option" onClick={() => { window.location.href = '/'; }}>Exit</div>
            </div>
          </div>
          <div className={`ct-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleMenu('help'); }}>
            <span>Help</span>
            <div className="ct-menu-dropdown">
              <div className="ct-menu-option" onClick={(e) => { e.stopPropagation(); setShowRules(true); setActiveMenu(null); }}>How to Play</div>
            </div>
          </div>
        </div>

        <div className="ct-intro-screen">
          <div className="ct-intro-logo">
            <span className="ct-logo-chaos">⚡</span>
            Chaos Tetris
            <span className="ct-logo-chaos">⚡</span>
          </div>
          <p className="ct-intro-tagline">
            Classic Tetris — but every 4 lines cleared, the board flips upside down!
          </p>
          <div className="ct-intro-rules">
            <h3>How to Play</h3>
            <ol>
              <li>Use <strong>← →</strong> to move, <strong>↑</strong> to rotate</li>
              <li>Press <strong>↓</strong> to soft-drop, <strong>Z</strong> to hard-drop</li>
              <li>Clear lines to score — combos score more!</li>
              <li>Every <strong>4 lines</strong> cleared, the board <strong>FLIPS</strong> upside down</li>
              <li>Pieces fall with the new gravity after the flip</li>
              <li>Press <strong>Space</strong> to pause</li>
            </ol>
          </div>
          <div className="ct-intro-hs">High Score: <strong>{highScore}</strong></div>
          <button className="ct-intro-btn" onClick={() => { soundService.play('click'); startGame(); }}>
            ▶ Play Chaos Tetris
          </button>
        </div>

        {showRules && (
          <div className="ct-rules-modal">
            <div className="ct-rules-content">
              <h2>How to Play</h2>
              <ol>
                <li>← → to move, ↑ to rotate</li>
                <li>↓ soft-drop, Z hard-drop</li>
                <li>Clear 4 lines to trigger CHAOS FLIP</li>
                <li>Board flips and pieces fall with new gravity</li>
                <li>Space to pause</li>
              </ol>
              <button onClick={() => setShowRules(false)}>Got it!</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ct-game" onClick={() => setActiveMenu(null)}>
      <div className="ct-menu-bar">
        <div className={`ct-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}>
          <span>File</span>
          <div className="ct-menu-dropdown">
            <div className="ct-menu-option" onClick={(e) => { e.stopPropagation(); soundService.play('click'); startGame(); setActiveMenu(null); }}>New Game</div>
            <div className="ct-menu-option" onClick={() => { window.location.href = '/'; }}>Exit</div>
          </div>
        </div>
        <div className={`ct-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleMenu('help'); }}>
          <span>Help</span>
          <div className="ct-menu-dropdown">
            <div className="ct-menu-option" onClick={(e) => { e.stopPropagation(); setShowRules(true); setActiveMenu(null); }}>How to Play</div>
          </div>
        </div>
      </div>

      <div className="ct-game-area">
        {/* Main board */}
        <div className={`ct-board-wrapper ${isFlipping ? 'ct-flipping' : ''}`}>
          <div className="ct-board">
            {displayBoardWithGhost.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`ct-cell ${cell === 'ghost' ? 'ct-ghost' : cell ? 'ct-filled' : ''}`}
                  style={cell && cell !== 'ghost' ? { backgroundColor: cell } : {}}
                />
              ))
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="ct-panel">
          <div className="ct-panel-section">
            <div className="ct-panel-label">SCORE</div>
            <div className="ct-panel-value">{score}</div>
          </div>
          <div className="ct-panel-section">
            <div className="ct-panel-label">LINES</div>
            <div className="ct-panel-value">{lines}</div>
          </div>
          <div className="ct-panel-section">
            <div className="ct-panel-label">LEVEL</div>
            <div className="ct-panel-value">{level}</div>
          </div>

          <div className="ct-panel-section">
            <div className="ct-panel-label">CHAOS</div>
            <div className="ct-chaos-meter">
              <div className="ct-chaos-fill" style={{ width: `${chaosProgress * 100}%` }} />
            </div>
            <div className="ct-chaos-label">{linesSinceFlip}/{LINES_PER_FLIP} lines</div>
          </div>

          <div className="ct-panel-section">
            <div className="ct-panel-label">NEXT</div>
            <div className="ct-next-box">
              {nextPieceDisplay && nextPieceDisplay.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`ct-next-cell ${cell ? 'ct-filled' : ''}`}
                    style={cell ? { backgroundColor: cell } : {}}
                  />
                ))
              )}
            </div>
          </div>

          <div className="ct-panel-section">
            <div className="ct-panel-label">BEST</div>
            <div className="ct-panel-value ct-panel-value-sm">{Math.max(score, highScore)}</div>
          </div>

          {paused && <div className="ct-paused-badge">PAUSED</div>}
        </div>
      </div>

      {gameOver && (
        <div className="ct-overlay">
          <div className="ct-overlay-box">
            <div className="ct-overlay-title">Game Over</div>
            <div className="ct-overlay-score">Score: {score}</div>
            {score >= highScore && score > 0 && (
              <div className="ct-overlay-hs">New High Score!</div>
            )}
            {scoreSubmitting && <div className="ct-overlay-submitting">Submitting score…</div>}
            {scoreSuccess && !scoreSubmitting && <div className="ct-overlay-submitted">Score submitted!</div>}
            <button className="ct-overlay-btn" onClick={() => { soundService.play('click'); startGame(); }}>
              ▶ Play Again
            </button>
          </div>
        </div>
      )}

      {showRules && (
        <div className="ct-rules-modal">
          <div className="ct-rules-content">
            <h2>How to Play</h2>
            <ol>
              <li>← → to move, ↑ to rotate</li>
              <li>↓ soft-drop, Z hard-drop</li>
              <li>Every 4 lines = CHAOS FLIP</li>
              <li>Board flips, pieces settle with gravity</li>
              <li>Space to pause</li>
            </ol>
            <button onClick={() => setShowRules(false)}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ChaosTetris;
