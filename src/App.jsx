import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import './App.css'
import GameLoader from './components/GameLoader'
import Desktop from './components/os/Desktop'

import Minesweeper from './components/games/Minesweeper/Minesweeper';
import QuantumChess from './components/games/QuantumChess/QuantumChess';
import RotateConnectFour from './components/games/RotateConnectFour/RotateConnectFour';
import Refiner from './components/games/Refiner/Refiner';
import WikiConnect from './components/games/WikiConnect/WikiConnect';

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
      title: 'Macrodata Refinement', 
      icon: '🔢',
      description: 'Sort scary numbers in this Severance-inspired terminal game.'
    },
    { 
      id: 'wikiconnect', 
      title: 'WikiConnect', 
      icon: '🔗',
      description: 'Navigate through Wikipedia to connect two random articles.'
    },
  ];

  return (
    <Routes>
      <Route path="/" element={<Home games={games} />} />
      <Route path="/game/minesweeper" element={<Minesweeper />} />
      <Route path="/game/quantumchess" element={<QuantumChess />} />
      <Route path="/game/rotateconnectfour" element={<RotateConnectFour />} />
      <Route path="/game/refiner" element={<Refiner />} />
      <Route path="/game/wikiconnect" element={<WikiConnect />} />
    </Routes>
  );
}

function Home({ games }) {
  return <Desktop games={games} />;
}

export default App
