import React, { useState, useCallback, useEffect } from 'react';
import './Calculator.css';

const MAX_DISPLAY_LEN = 14;

function evaluate(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b !== 0 ? a / b : 'Error';
    default:  return b;
  }
}

function formatDisplay(val) {
  if (val === 'Error') return 'Error';
  const s = String(val);
  if (s.length <= MAX_DISPLAY_LEN) return s;
  const n = Number(val);
  if (isNaN(n)) return 'Error';
  return n.toExponential(6);
}

const Calculator = () => {
  const [display, setDisplay]   = useState('0');
  const [prevVal, setPrevVal]   = useState(null);
  const [operator, setOperator] = useState(null);
  const [waiting, setWaiting]   = useState(false);
  const [memory, setMemory]     = useState(0);

  const pushDigit = useCallback((digit) => {
    setDisplay(prev => {
      if (waiting) {
        setWaiting(false);
        return digit === '.' ? '0.' : digit;
      }
      if (prev === '0' && digit !== '.') return digit;
      if (digit === '.' && prev.includes('.')) return prev;
      if (prev.replace('-', '').replace('.', '').length >= MAX_DISPLAY_LEN) return prev;
      return prev + digit;
    });
  }, [waiting]);

  const pressOperator = useCallback((op) => {
    const current = parseFloat(display);
    if (prevVal !== null && !waiting) {
      const result = evaluate(prevVal, operator, current);
      const formatted = result === 'Error' ? 'Error' : formatDisplay(result);
      setDisplay(formatted);
      setPrevVal(result === 'Error' ? null : result);
    } else {
      setPrevVal(current);
    }
    setOperator(op);
    setWaiting(true);
  }, [display, prevVal, operator, waiting]);

  const pressEquals = useCallback(() => {
    if (prevVal === null || operator === null) return;
    const current = parseFloat(display);
    const result = evaluate(prevVal, operator, current);
    setDisplay(result === 'Error' ? 'Error' : formatDisplay(result));
    setPrevVal(null);
    setOperator(null);
    setWaiting(true);
  }, [display, prevVal, operator]);

  const pressClear = useCallback(() => {
    setDisplay('0');
    setPrevVal(null);
    setOperator(null);
    setWaiting(false);
  }, []);

  const pressCE = useCallback(() => {
    setDisplay('0');
    setWaiting(false);
  }, []);

  const pressBack = useCallback(() => {
    if (waiting) return;
    setDisplay(prev => {
      if (prev === 'Error') return '0';
      const next = prev.length > 1 ? prev.slice(0, -1) : '0';
      return next === '-' ? '0' : next;
    });
  }, [waiting]);

  const pressPlusMinus = useCallback(() => {
    setDisplay(prev => {
      if (prev === '0' || prev === 'Error') return prev;
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  }, []);

  const pressSqrt = useCallback(() => {
    const val = parseFloat(display);
    if (val < 0) { setDisplay('Error'); return; }
    setDisplay(formatDisplay(Math.sqrt(val)));
    setWaiting(true);
  }, [display]);

  const pressPercent = useCallback(() => {
    const val = parseFloat(display);
    setDisplay(formatDisplay(val / 100));
    setWaiting(true);
  }, [display]);

  // Memory ops
  const mc  = useCallback(() => setMemory(0), []);
  const mr  = useCallback(() => { setDisplay(formatDisplay(memory)); setWaiting(false); }, [memory]);
  const ms  = useCallback(() => setMemory(parseFloat(display)), [display]);
  const mp  = useCallback(() => setMemory(m => m + parseFloat(display)), [display]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (/^[0-9]$/.test(e.key)) { pushDigit(e.key); return; }
      if (e.key === '.') { pushDigit('.'); return; }
      if (e.key === '+') pressOperator('+');
      else if (e.key === '-') pressOperator('-');
      else if (e.key === '*') pressOperator('*');
      else if (e.key === '/') { e.preventDefault(); pressOperator('/'); }
      else if (e.key === 'Enter' || e.key === '=') pressEquals();
      else if (e.key === 'Backspace') pressBack();
      else if (e.key === 'Escape') pressClear();
      else if (e.key === 'Delete') pressCE();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pushDigit, pressOperator, pressEquals, pressBack, pressClear, pressCE]);

  const Btn = ({ label, onClick, variant = 'num', wide = false }) => (
    <button
      className={`calc-btn calc-btn-${variant}${wide ? ' calc-btn-wide' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div className="calc-app">
      <div className="calc-display-area">
        <div className="calc-display">{display}</div>
      </div>

      <div className="calc-grid">
        {/* Memory row */}
        <Btn label="MC" onClick={mc}  variant="mem" />
        <Btn label="MR" onClick={mr}  variant="mem" />
        <Btn label="MS" onClick={ms}  variant="mem" />
        <Btn label="M+" onClick={mp}  variant="mem" />

        {/* Back / CE / C */}
        <Btn label="Back" onClick={pressBack}  variant="func" />
        <Btn label="CE"   onClick={pressCE}    variant="func" />
        <Btn label="C"    onClick={pressClear}  variant="func" />
        <Btn label="±"    onClick={pressPlusMinus} variant="func" />

        {/* Row: sqrt % / */}
        <Btn label="√"  onClick={pressSqrt}           variant="func" />
        <Btn label="%"  onClick={pressPercent}         variant="func" />
        <Btn label="1/x" onClick={() => { const v = parseFloat(display); setDisplay(v !== 0 ? formatDisplay(1/v) : 'Error'); setWaiting(true); }} variant="func" />
        <Btn label="÷"  onClick={() => pressOperator('/')} variant="op" />

        {/* 7 8 9 * */}
        <Btn label="7"  onClick={() => pushDigit('7')} />
        <Btn label="8"  onClick={() => pushDigit('8')} />
        <Btn label="9"  onClick={() => pushDigit('9')} />
        <Btn label="×"  onClick={() => pressOperator('*')} variant="op" />

        {/* 4 5 6 - */}
        <Btn label="4"  onClick={() => pushDigit('4')} />
        <Btn label="5"  onClick={() => pushDigit('5')} />
        <Btn label="6"  onClick={() => pushDigit('6')} />
        <Btn label="−"  onClick={() => pressOperator('-')} variant="op" />

        {/* 1 2 3 + */}
        <Btn label="1"  onClick={() => pushDigit('1')} />
        <Btn label="2"  onClick={() => pushDigit('2')} />
        <Btn label="3"  onClick={() => pushDigit('3')} />
        <Btn label="+"  onClick={() => pressOperator('+')} variant="op" />

        {/* 0 . = */}
        <Btn label="0"  onClick={() => pushDigit('0')} wide />
        <Btn label="."  onClick={() => pushDigit('.')} />
        <Btn label="="  onClick={pressEquals} variant="eq" />
      </div>
    </div>
  );
};

export default Calculator;
