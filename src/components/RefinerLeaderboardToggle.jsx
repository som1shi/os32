import React, { useState } from 'react';
import StickyNote from './os/StickyNote';
import Leaderboard from './Leaderboard';
import './RefinerLeaderboardToggle.css';

const DURATION_OPTIONS = [
  { value: '30', label: '30s', color: '#ffff88' },
  { value: '60', label: '60s', color: '#a7ffeb' },
  { value: '180', label: '3m', color: '#d7aefb' },
  { value: '300', label: '5m', color: '#ffcce3' },
  { value: '600', label: '10m', color: '#fff475' }
];

const RefinerLeaderboardToggle = ({ initialPosition, onClose }) => {
  const [selectedDuration, setSelectedDuration] = useState('30');
  
  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
  };
  
  const selectedOption = DURATION_OPTIONS.find(option => option.value === selectedDuration);
  const collectionName = `refiner-${selectedDuration}`;
  const title = `Refiner Leaderboard (${selectedOption.label})`;
  
  return (
    <StickyNote 
      title={title}
      initialPosition={initialPosition}
      color={selectedOption.color}
      onClose={onClose}
    >
      <div className="refiner-leaderboard-container">
        <div className="duration-toggle">
          {DURATION_OPTIONS.map(option => (
            <button
              key={option.value}
              className={`duration-button ${selectedDuration === option.value ? 'active' : ''}`}
              onClick={() => handleDurationChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Leaderboard collectionName={collectionName} limit={10} />
      </div>
    </StickyNote>
  );
};

export default React.memo(RefinerLeaderboardToggle); 