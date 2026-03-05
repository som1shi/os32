import { useCallback, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Desktop from './components/os/Desktop'
import { AuthProvider } from './firebase/AuthContext'
import { Analytics } from "@vercel/analytics/react"
import { ICON_KEYS } from './config/iconRegistry'
import RetroBootScreen from './components/os/RetroBootScreen'

import Minesweeper from './components/games/Minesweeper/Minesweeper';
import QuantumChess from './components/games/QuantumChess/QuantumChess';
import RotateConnectFour from './components/games/RotateConnectFour/RotateConnectFour';
import Refiner from './components/games/Refiner/Refiner';
import WikiConnect from './components/games/WikiConnect/WikiConnect';
import ColorMania from './components/games/ColorMania/ColorMania';

const BOOT_SESSION_KEY = 'os32.boot.completed';

function App() {
  const [showBoot, setShowBoot] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => setReducedMotion(mediaQuery.matches);
    syncMotionPreference();

    const hasCompletedBoot = window.sessionStorage.getItem(BOOT_SESSION_KEY) === '1';
    if (!hasCompletedBoot) {
      setShowBoot(true);
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMotionPreference);
      return () => mediaQuery.removeEventListener('change', syncMotionPreference);
    }

    mediaQuery.addListener(syncMotionPreference);
    return () => mediaQuery.removeListener(syncMotionPreference);
  }, []);

  const handleBootComplete = useCallback(() => {
    window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
    setShowBoot(false);
  }, []);

  const games = [
    {
      id: 'minesweeper',
      title: 'WordSweeper',
      iconKey: ICON_KEYS.game.wordsweeper,
      description: 'The Classic Minesweeper game with a twist.'
    },
    {
      id: 'quantumchess',
      title: 'Schrödinger\'s Chess',
      iconKey: ICON_KEYS.game.quantumchess,
      description: 'Chess where pieces exist in quantum superposition until observed.'
    },
    {
      id: 'rotateconnectfour',
      title: 'Rotate Connect Four',
      iconKey: ICON_KEYS.game.rotateconnectfour,
      description: 'Connect Four with dice rolls and board rotation mechanics.'
    },
    {
      id: 'refiner',
      title: 'Refiner',
      iconKey: ICON_KEYS.game.refiner,
      description: 'Sort scary numbers in this Severance-inspired terminal game.'
    },
    {
      id: 'wikiconnect',
      title: 'WikiConnect',
      iconKey: ICON_KEYS.game.wikiconnect,
      description: 'Navigate through Wikipedia to connect two random articles.'
    },
    {
      id: 'colormania',
      title: 'ColorMania',
      iconKey: ICON_KEYS.game.colormania,
      description: 'Match colors of adjacent tiles to fill the board and earn points.'
    },
    {
      id: 'dosemulator',
      title: 'Emulator',
      iconKey: ICON_KEYS.game.dosemulator,
      description: 'Classic DOS game emulator — browse and play legendary 90s titles.'
    },
    {
      id: 'doom',
      title: 'Doom',
      iconKey: ICON_KEYS.game.doom,
      description: 'The iconic 1993 first-person shooter that defined the genre.'
    },
    {
      id: 'chaostetris',
      title: 'Chaos Tetris',
      iconKey: ICON_KEYS.game.chaostetris,
      description: 'Tetris with a twist — every 4 lines cleared flips the board upside down!'
    },
    {
      id: 'decrypt',
      title: 'Decrypt',
      iconKey: ICON_KEYS.game.decrypt,
      description: 'Decode scrambled tech words before the clock runs out.'
    },
  ];

  return (
    <AuthProvider>
      {showBoot && <RetroBootScreen onComplete={handleBootComplete} reducedMotion={reducedMotion} />}
      <Routes>
        <Route path="/" element={<Home games={games} />} />
        <Route path="/game/minesweeper" element={<Minesweeper />} />
        <Route path="/game/quantumchess" element={<QuantumChess />} />
        <Route path="/game/rotateconnectfour" element={<RotateConnectFour />} />
        <Route path="/game/refiner" element={<Refiner />} />
        <Route path="/game/wikiconnect" element={<WikiConnect />} />
        <Route path="/game/colormania" element={<ColorMania />} />
      </Routes>
      <Analytics />
    </AuthProvider>
  );
}

function Home({ games }) {
  return <Desktop games={games} />;
}

export default App
