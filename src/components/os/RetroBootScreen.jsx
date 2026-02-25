import React, { useCallback, useEffect, useRef, useState } from 'react';
import './RetroBootScreen.css';

const POWER_ON_MS = 300;
const POST_MS = 2500;
const LOADER_MS = 2500;
const POWER_OFF_MS = 450;

const TOTAL_MEMORY_KB = 65536;
const MEMORY_STEPS = [640, 8192, 16384, 32768, 49152, TOTAL_MEMORY_KB];

const POST_LINES_BEFORE_MEMORY = [
  'AMIBIOS (C) 2026 OS32 Systems Inc.',
  'OS32 BIOS v4.51PG — Release 03/2026',
  '',
  'Main Processor : Intel Pentium III 933MHz',
];

const POST_LINES_AFTER_MEMORY = [
  '',
  'Keyboard ............ Detected',
  'Display Adapter ..... SVGA 1024x768',
  'System Clock ........ Set',
  'Boot Device ......... HDD0',
  '',
  'Loading OS32...',
];

const BLOCK_TOTAL = 32;

const RetroBootScreen = ({ onComplete, reducedMotion = false }) => {
  const [stage, setStage] = useState('poweron');
  const [postLines, setPostLines] = useState([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [memoryDone, setMemoryDone] = useState(false);
  const [afterMemoryIndex, setAfterMemoryIndex] = useState(0);
  const [blocksFilled, setBlocksFilled] = useState(0);
  const completedRef = useRef(false);

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setStage('poweroff');
    setTimeout(() => onComplete(), reducedMotion ? 50 : POWER_OFF_MS);
  }, [onComplete, reducedMotion]);

  // Stage: power-on flash
  useEffect(() => {
    if (stage !== 'poweron') return;
    const t = setTimeout(() => setStage('post'), reducedMotion ? 50 : POWER_ON_MS);
    return () => clearTimeout(t);
  }, [stage, reducedMotion]);

  // Stage: POST — print pre-memory lines
  useEffect(() => {
    if (stage !== 'post') return;

    let i = 0;
    const id = setInterval(() => {
      if (i < POST_LINES_BEFORE_MEMORY.length) {
        setPostLines((prev) => [...prev, POST_LINES_BEFORE_MEMORY[i]]);
        i++;
      } else {
        clearInterval(id);
      }
    }, reducedMotion ? 30 : 180);

    return () => clearInterval(id);
  }, [stage, reducedMotion]);

  // Stage: POST — memory count-up (starts after pre-memory lines finish)
  useEffect(() => {
    if (stage !== 'post') return;

    const preDelay = reducedMotion
      ? POST_LINES_BEFORE_MEMORY.length * 30 + 40
      : POST_LINES_BEFORE_MEMORY.length * 180 + 120;

    const startTimer = setTimeout(() => {
      let step = 0;
      const memInterval = setInterval(() => {
        if (step < MEMORY_STEPS.length) {
          setMemoryCount(MEMORY_STEPS[step]);
          step++;
        } else {
          clearInterval(memInterval);
          setMemoryDone(true);
        }
      }, reducedMotion ? 25 : 110);

      return () => clearInterval(memInterval);
    }, preDelay);

    return () => clearTimeout(startTimer);
  }, [stage, reducedMotion]);

  // Stage: POST — after-memory lines, then transition to loader
  useEffect(() => {
    if (!memoryDone || stage !== 'post') return;

    let i = 0;
    const id = setInterval(() => {
      if (i < POST_LINES_AFTER_MEMORY.length) {
        setAfterMemoryIndex(i + 1);
        i++;
      } else {
        clearInterval(id);
        setTimeout(() => setStage('loader'), reducedMotion ? 30 : 300);
      }
    }, reducedMotion ? 25 : 160);

    return () => clearInterval(id);
  }, [memoryDone, stage, reducedMotion]);

  // Stage: loader — fill blocks
  useEffect(() => {
    if (stage !== 'loader') return;

    let filled = 0;
    const id = setInterval(() => {
      filled++;
      setBlocksFilled(filled);
      if (filled >= BLOCK_TOTAL) {
        clearInterval(id);
        setTimeout(() => triggerComplete(), reducedMotion ? 30 : 400);
      }
    }, reducedMotion ? 20 : Math.floor(LOADER_MS / BLOCK_TOTAL));

    return () => clearInterval(id);
  }, [stage, reducedMotion, triggerComplete]);

  // Esc key to skip
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') triggerComplete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [triggerComplete]);

  const progressBar =
    '\u2588'.repeat(blocksFilled) + '\u2591'.repeat(BLOCK_TOTAL - blocksFilled);

  return (
    <div
      className={`crt-boot crt-boot--${stage}`}
      role="dialog"
      aria-label="System boot screen"
    >
      {/* Skip button */}
      {stage !== 'poweroff' && (
        <button
          type="button"
          className="crt-boot__skip"
          onClick={triggerComplete}
        >
          Skip (Esc)
        </button>
      )}

      {/* CRT screen area */}
      <div className="crt-boot__screen">
        {stage === 'poweron' && <div className="crt-boot__flash" />}

        {stage === 'post' && (
          <div className="crt-boot__post" aria-live="polite">
            {postLines.map((line, i) => (
              <p key={i} className="crt-boot__line">
                {line || '\u00A0'}
              </p>
            ))}

            {postLines.length >= POST_LINES_BEFORE_MEMORY.length && (
              <p className="crt-boot__line crt-boot__memory">
                Memory Test : {memoryCount}K
                {memoryDone ? ' OK' : ''}
              </p>
            )}

            {POST_LINES_AFTER_MEMORY.slice(0, afterMemoryIndex).map(
              (line, i) => (
                <p key={`after-${i}`} className="crt-boot__line">
                  {line || '\u00A0'}
                </p>
              )
            )}

            <span className="crt-boot__cursor">_</span>
          </div>
        )}

        {stage === 'loader' && (
          <div className="crt-boot__loader" aria-live="polite">
            <pre className="crt-boot__logo">{`
  ██████╗ ███████╗██████╗ ██████╗
 ██╔═══██╗██╔════╝╚════██╗╚════██╗
 ██║   ██║███████╗ █████╔╝ █████╔╝
 ██║   ██║╚════██║ ╚═══██╗██╔═══╝
 ╚██████╔╝███████║██████╔╝███████╗
  ╚═════╝ ╚══════╝╚═════╝ ╚══════╝`}</pre>
            <p className="crt-boot__loader-text">Starting OS32...</p>
            <p className="crt-boot__progress-bar">[{progressBar}]</p>
          </div>
        )}

        {stage === 'poweroff' && <div className="crt-boot__poweroff" />}
      </div>

      {/* CRT overlays */}
      <div className="crt-boot__scanlines" aria-hidden="true" />
      <div className="crt-boot__vignette" aria-hidden="true" />
    </div>
  );
};

export default RetroBootScreen;
