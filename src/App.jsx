import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import './App.css'
import Desktop from './components/os/Desktop'
import { AuthProvider } from './firebase/AuthContext'
import { Analytics } from "@vercel/analytics/react"

import Minesweeper from './components/games/Minesweeper/Minesweeper';
import QuantumChess from './components/games/QuantumChess/QuantumChess';
import RotateConnectFour from './components/games/RotateConnectFour/RotateConnectFour';
import Refiner from './components/games/Refiner/Refiner';
import WikiConnect from './components/games/WikiConnect/WikiConnect';
import ColorMania from './components/games/ColorMania/ColorMania';

function App() {
  const games = [
    { 
      id: 'minesweeper', 
      title: 'WordSweeper', 
      icon: '💣',
      description: 'The Classic Minesweeper game with a twist.'
    },
    { 
      id: 'quantumchess', 
      title: 'Schrödinger\'s Chess', 
      icon: '♟️',
      description: 'Chess where pieces exist in quantum superposition until observed.'
    },
    { 
      id: 'rotateconnectfour', 
      title: 'Rotate Connect Four', 
      icon: '🎲',
      description: 'Connect Four with dice rolls and board rotation mechanics.'
    },
    { 
      id: 'refiner', 
      title: 'Refiner', 
      icon: '🔢',
      description: 'Sort scary numbers in this Severance-inspired terminal game.'
    },
    { 
      id: 'wikiconnect', 
      title: 'WikiConnect', 
      icon: '🔗',
      description: 'Navigate through Wikipedia to connect two random articles.'
    },
    { 
      id: 'colormania', 
      title: 'ColorMania', 
      icon: '🎨',
      description: 'Match colors of adjacent tiles to fill the board and earn points.'
    },
  ];

  return (
    <AuthProvider>
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
