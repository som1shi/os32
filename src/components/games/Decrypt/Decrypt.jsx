import { useState, useEffect, useCallback, useRef, memo } from 'react';
import './Decrypt.css';
import soundService from '../../../services/soundService';
import useScoreSubmission from '../../../firebase/useScoreSubmission';

const TOTAL_TIME = 90;
const WRONG_PENALTY = 5;
const CORRECT_BONUS = 3;
const HS_KEY = 'os32.decrypt.highscore';

const WORDS = [
  'kernel', 'buffer', 'malloc', 'socket', 'cipher', 'binary', 'mutex',
  'thread', 'vector', 'parser', 'router', 'daemon', 'static', 'struct',
  'module', 'packet', 'render', 'shader', 'vertex', 'deploy', 'docker',
  'lambda', 'tensor', 'branch', 'commit', 'rebase', 'remote', 'origin',
  'syntax', 'token', 'lexer', 'debug', 'stack', 'queue', 'graph',
  'array', 'index', 'cache', 'proxy', 'query', 'regex', 'async',
  'yield', 'scope', 'class', 'interface', 'pointer', 'typedef',
  'syscall', 'signal', 'process', 'virtual', 'compile', 'linker',
  'segment', 'offset', 'bitwise', 'boolean', 'integer', 'float',
  'string', 'object', 'method', 'export', 'import', 'module',
];

const ENCODINGS = ['reverse', 'rot13', 'anagram'];

function rot13(str) {
  return str.replace(/[a-z]/gi, c => {
    const base = c >= 'a' ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function shuffleStr(str) {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  if (arr.join('') === str && str.length > 1) {
    const temp = arr[0];
    arr[0] = arr[1];
    arr[1] = temp;
  }
  return arr.join('');
}

function encodeWord(word, encoding) {
  switch (encoding) {
    case 'reverse': return word.split('').reverse().join('');
    case 'rot13': return rot13(word);
    case 'anagram': return shuffleStr(word);
    default: return word;
  }
}

function getEncodingLabel(encoding) {
  switch (encoding) {
    case 'reverse': return 'REVERSED';
    case 'rot13': return 'ROT-13';
    case 'anagram': return 'ANAGRAM';
    default: return encoding.toUpperCase();
  }
}

function pickPuzzle(usedWords = new Set()) {
  const available = WORDS.filter(w => !usedWords.has(w));
  const pool = available.length > 0 ? available : WORDS;
  const word = pool[Math.floor(Math.random() * pool.length)];
  const encoding = ENCODINGS[Math.floor(Math.random() * ENCODINGS.length)];
  return { word, encoding, encoded: encodeWord(word, encoding) };
}

const Decrypt = memo(() => {
  const [showIntro, setShowIntro] = useState(true);
  const [puzzle, setPuzzle] = useState(null);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem(HS_KEY) || '0', 10));
  const [showRules, setShowRules] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [history, setHistory] = useState([]);

  const timerRef = useRef(null);
  const gameOverRef = useRef(false);
  const timeRef = useRef(TOTAL_TIME);
  const scoreRef = useRef(0);
  const solvedRef = useRef(0);
  const usedWordsRef = useRef(new Set());
  const inputRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  const { submitGameScore, submitting: scoreSubmitting, success: scoreSuccess } = useScoreSubmission();

  const endGame = useCallback(() => {
    gameOverRef.current = true;
    clearInterval(timerRef.current);
    setGameOver(true);
    soundService.play('error');
    const s = scoreRef.current;
    if (s > parseInt(localStorage.getItem(HS_KEY) || '0', 10)) {
      localStorage.setItem(HS_KEY, String(s));
      setHighScore(s);
    }
    submitGameScore('decrypt', s, { solvedCount: solvedRef.current });
  }, [submitGameScore]);

  const startGame = useCallback(() => {
    clearInterval(timerRef.current);
    clearTimeout(feedbackTimeoutRef.current);
    gameOverRef.current = false;
    timeRef.current = TOTAL_TIME;
    scoreRef.current = 0;
    solvedRef.current = 0;
    usedWordsRef.current = new Set();

    const p = pickPuzzle();
    usedWordsRef.current.add(p.word);

    setShowIntro(false);
    setGameOver(false);
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setSolvedCount(0);
    setWrongCount(0);
    setPuzzle(p);
    setInput('');
    setFeedback(null);
    setHistory([]);

    timerRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        endGame();
      }
    }, 1000);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [endGame]);

  const nextPuzzle = useCallback(() => {
    const p = pickPuzzle(usedWordsRef.current);
    usedWordsRef.current.add(p.word);
    setPuzzle(p);
    setInput('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!puzzle || gameOverRef.current) return;
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === puzzle.word) {
      const newScore = scoreRef.current + 10 + Math.min(Math.floor(timeRef.current / 10), 5);
      scoreRef.current = newScore;
      solvedRef.current += 1;

      const newTime = Math.min(TOTAL_TIME, timeRef.current + CORRECT_BONUS);
      timeRef.current = newTime;

      setScore(newScore);
      setSolvedCount(s => s + 1);
      setTimeLeft(newTime);
      setFeedback('correct');
      setHistory(prev => [{ word: puzzle.word, encoding: puzzle.encoding }, ...prev].slice(0, 5));

      soundService.play('notify');

      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
        nextPuzzle();
      }, 600);
    } else {
      const newTime = Math.max(0, timeRef.current - WRONG_PENALTY);
      timeRef.current = newTime;
      setTimeLeft(newTime);
      setWrongCount(w => w + 1);
      setFeedback('wrong');
      setInput('');
      soundService.play('error');

      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 500);

      if (newTime <= 0) endGame();
    }
  }, [puzzle, input, nextPuzzle, endGame]);

  const handleSkip = useCallback(() => {
    if (!puzzle || gameOverRef.current) return;
    const newTime = Math.max(0, timeRef.current - 3);
    timeRef.current = newTime;
    setTimeLeft(newTime);
    setHistory(prev => [{ word: `${puzzle.word} (skipped)`, encoding: puzzle.encoding }, ...prev].slice(0, 5));
    nextPuzzle();
    if (newTime <= 0) endGame();
  }, [puzzle, nextPuzzle, endGame]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const toggleMenu = useCallback((menu) => {
    setActiveMenu(prev => prev === menu ? null : menu);
  }, []);

  const timerSegments = Math.ceil((timeLeft / TOTAL_TIME) * 12);
  const timerState = timeLeft > TOTAL_TIME * 0.5 ? 'high' : timeLeft > TOTAL_TIME * 0.25 ? 'medium' : 'low';

  if (showIntro) {
    return (
      <div className="dc-game" onClick={() => setActiveMenu(null)}>
        <div className="dc-menu-bar">
          <div className={`dc-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}>
            <span>File</span>
            <div className="dc-menu-dropdown">
              <div className="dc-menu-option" onClick={() => { soundService.play('click'); startGame(); }}>New Game</div>
              <div className="dc-menu-option" onClick={() => { window.location.href = '/'; }}>Exit</div>
            </div>
          </div>
          <div className={`dc-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleMenu('help'); }}>
            <span>Help</span>
            <div className="dc-menu-dropdown">
              <div className="dc-menu-option" onClick={(e) => { e.stopPropagation(); setShowRules(true); setActiveMenu(null); }}>How to Play</div>
            </div>
          </div>
        </div>

        <div className="dc-intro-screen">
          <div className="dc-intro-logo">
            <span className="dc-logo-bracket">[</span>
            Decrypt
            <span className="dc-logo-bracket">]</span>
          </div>
          <p className="dc-intro-tagline">
            Decode scrambled tech words before the clock runs out.
          </p>
          <div className="dc-intro-rules">
            <h3>How to Play</h3>
            <ol>
              <li>A tech word is shown — <strong>REVERSED</strong>, <strong>ROT-13</strong>, or as an <strong>ANAGRAM</strong></li>
              <li>Type the original word and press <strong>Enter</strong></li>
              <li>Correct: <strong>+3 seconds</strong> bonus time</li>
              <li>Wrong: <strong>−5 seconds</strong> penalty</li>
              <li>Skip (−3 sec) if you're stuck</li>
              <li>Game ends when the clock hits zero!</li>
            </ol>
          </div>
          <div className="dc-intro-hs">High Score: <strong>{highScore}</strong></div>
          <button className="dc-intro-btn" onClick={() => { soundService.play('click'); startGame(); }}>
            ▶ Play Decrypt
          </button>
        </div>

        {showRules && (
          <div className="dc-rules-modal">
            <div className="dc-rules-content">
              <h2>How to Play</h2>
              <ol>
                <li>Decode the scrambled tech word</li>
                <li>Correct → +3 sec, Wrong → −5 sec</li>
                <li>Skip costs −3 sec</li>
                <li>Race the clock!</li>
              </ol>
              <button onClick={() => setShowRules(false)}>Got it!</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dc-game" onClick={() => setActiveMenu(null)}>
      <div className="dc-menu-bar">
        <div className={`dc-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}>
          <span>File</span>
          <div className="dc-menu-dropdown">
            <div className="dc-menu-option" onClick={(e) => { e.stopPropagation(); soundService.play('click'); startGame(); setActiveMenu(null); }}>New Game</div>
            <div className="dc-menu-option" onClick={() => { window.location.href = '/'; }}>Exit</div>
          </div>
        </div>
        <div className={`dc-menu-item ${activeMenu === 'help' ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleMenu('help'); }}>
          <span>Help</span>
          <div className="dc-menu-dropdown">
            <div className="dc-menu-option" onClick={(e) => { e.stopPropagation(); setShowRules(true); setActiveMenu(null); }}>How to Play</div>
          </div>
        </div>
      </div>

      {/* Status panel */}
      <div className="dc-info-panel">
        <div className="dc-time-section">
          <span className="dc-time-label">TIME</span>
          <div className="dc-timer-bar-container">
            <div className="dc-timer-bar" data-state={timerState}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={`dc-timer-segment ${i < timerSegments ? 'active' : ''}`} />
              ))}
            </div>
          </div>
          <span className="dc-time-value" data-state={timerState}>{timeLeft}s</span>
        </div>
        <div className="dc-score-section">
          <div className="dc-score-item">
            <span className="dc-score-label">SCORE</span>
            <span className="dc-score-value">{score}</span>
          </div>
          <div className="dc-score-item">
            <span className="dc-score-label">HIT</span>
            <span className="dc-score-value dc-correct-val">{solvedCount}</span>
          </div>
          <div className="dc-score-item">
            <span className="dc-score-label">MISS</span>
            <span className="dc-score-value dc-wrong-val">{wrongCount}</span>
          </div>
          <div className="dc-score-item">
            <span className="dc-score-label">BEST</span>
            <span className="dc-score-value">{Math.max(score, highScore)}</span>
          </div>
        </div>
      </div>

      {/* Terminal area */}
      <div className="dc-terminal">
        {/* Puzzle */}
        {puzzle && !gameOver && (
          <div className="dc-puzzle-area">
            <div className="dc-encoding-badge">{getEncodingLabel(puzzle.encoding)}</div>
            <div className={`dc-encoded-word ${feedback === 'correct' ? 'dc-flash-correct' : ''} ${feedback === 'wrong' ? 'dc-flash-wrong' : ''}`}>
              {puzzle.encoded}
            </div>
            <div className="dc-hint">length: {puzzle.word.length} letters</div>
          </div>
        )}

        {/* Input */}
        {!gameOver && (
          <div className="dc-input-row">
            <span className="dc-prompt">{'>'}</span>
            <input
              ref={inputRef}
              className="dc-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Tab') { e.preventDefault(); handleSkip(); }
              }}
              placeholder="type your answer..."
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="dc-submit-btn" onClick={handleSubmit}>Enter</button>
            <button className="dc-skip-btn" onClick={handleSkip} title="Skip (−3s)">Skip</button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="dc-history">
            {history.map((h, i) => (
              <div key={i} className="dc-history-item">
                <span className="dc-history-word">{h.word}</span>
                <span className="dc-history-enc">[{getEncodingLabel(h.encoding)}]</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="dc-overlay">
          <div className="dc-overlay-box">
            <div className="dc-overlay-title">Time's Up!</div>
            <div className="dc-overlay-score">Score: {score}</div>
            <div className="dc-overlay-stats">
              Solved: {solvedCount} | Missed: {wrongCount}
            </div>
            {score >= highScore && score > 0 && (
              <div className="dc-overlay-hs">New High Score!</div>
            )}
            {scoreSubmitting && <div className="dc-overlay-submitting">Submitting score…</div>}
            {scoreSuccess && !scoreSubmitting && <div className="dc-overlay-submitted">Score submitted!</div>}
            <button className="dc-overlay-btn" onClick={() => { soundService.play('click'); startGame(); }}>
              ▶ Play Again
            </button>
          </div>
        </div>
      )}

      {showRules && (
        <div className="dc-rules-modal">
          <div className="dc-rules-content">
            <h2>How to Play</h2>
            <ol>
              <li>Decode the scrambled tech word</li>
              <li>Correct → +3 sec; Wrong → −5 sec</li>
              <li>Tab or Skip button to skip (−3 sec)</li>
              <li>Race the clock!</li>
            </ol>
            <button onClick={() => setShowRules(false)}>Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Decrypt;
