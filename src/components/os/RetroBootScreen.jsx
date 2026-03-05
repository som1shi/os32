import React, { useCallback, useEffect, useRef, useState } from 'react';
import './RetroBootScreen.css';

const POWER_ON_MS = 500;
const POST_MS = 2500;
const LOADER_MS = 1000;
const POWER_OFF_MS = 450;

const TOTAL_MEMORY_KB = 65536;
const MEMORY_STEPS = [640, 8192, 16384, 32768, 49152, TOTAL_MEMORY_KB];

const getSystemInfo = () => {
  if (typeof navigator === 'undefined') return { browser: 'Unknown', os: 'Unknown', cores: 1, mem: 4, res: '1024x768', colorDepth: 24, language: 'en-US', timezone: 'UTC', connection: 'Unknown', touch: false };
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari')) browser = 'Apple Safari';
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';

  if (ua.includes('Win')) os = 'Microsoft Windows Operating System';
  else if (ua.includes('Mac')) os = 'Apple Macintosh Operating System';
  else if (ua.includes('Linux')) os = 'Linux Operating System';
  else if (ua.includes('Android')) os = 'Android Operating System';
  else if (ua.includes('like Mac')) os = 'iOS Operating System';

  const cores = navigator.hardwareConcurrency || 2;
  const mem = navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'Unknown';
  const res = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '1024x768';
  const colorDepth = typeof screen !== 'undefined' ? screen.colorDepth : 24;
  const language = navigator.language || 'en-US';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const connection = navigator.connection ? navigator.connection.effectiveType.toUpperCase() : 'LAN';
  const touch = navigator.maxTouchPoints > 0;

  return { browser, os, cores, mem, res, colorDepth, language, timezone, connection, touch };
};

const sysInfo = getSystemInfo();

const POST_LINES_BEFORE_MEMORY = [
  'AMIBIOS (C) 2026 OS32 Systems Inc.',
  'OS32 BIOS v4.51PG — Release 03/2026',
  '',
  `Host OS        : ${sysInfo.os}`,
  `Host Browser   : ${sysInfo.browser}`,
  `Locale         : ${sysInfo.language} (${sysInfo.timezone})`,
  `Logical Cores  : ${sysInfo.cores} Processors`,
  `Host Memory    : ${sysInfo.mem} RAM Detected`,
  'Main Processor : Intel Pentium III 933MHz',
];

const POST_LINES_AFTER_MEMORY = [
  '',
  `Network Adapter ..... ${sysInfo.connection} Network Detected`,
  `Display Adapter ..... SVGA ${sysInfo.res} ${sysInfo.colorDepth}-bit`,
  `Input Device(s) ..... Keyboard, Mouse${sysInfo.touch ? ', Touchscreen' : ''}`,
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

  useEffect(() => {
    if (stage !== 'poweron') return;
    const t = setTimeout(() => setStage('post'), reducedMotion ? 50 : POWER_ON_MS);
    return () => clearTimeout(t);
  }, [stage, reducedMotion]);

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
