import React from 'react';
import './Refiner.css';
import useRefinerLogic from './hooks/useRefinerLogic';
import {
    Header,
    GameBoard,
    TargetBox,
    IntroScreen,
    GameOverScreen,
    AudioComponents
} from './components';

const Refiner = () => {
    const {
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
                audioRef, 
                correctSoundRef, 
                completeGameSoundRef, 
                hintRevealSoundRef, 
        wrongSoundRef,
        setGameDuration,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        getCurrentSum,
        startGame,
        toggleMusic,
        handleVolumeChange,
        shareScore
    } = useRefinerLogic();
    
    const currentSum = getCurrentSum();
    const shareButtonText = shareFeedback ? 'Copied to clipboard!' : 'Share Score';

    return (
        <div className="refiner">
            <Header 
                timeLeft={timeLeft}
                gameDuration={gameDuration}
                score={score}
                isMusicPlaying={isMusicPlaying}
                volume={volume}
                toggleMusic={toggleMusic}
                handleVolumeChange={handleVolumeChange}
            />
            
            <div className="refiner-container">
                <GameBoard 
                    numbers={numbers}
                    scaryCells={scaryCells}
                    selectionBox={selectionBox}
                    gridRef={gridRef}
                    handleMouseDown={handleMouseDown}
                    handleMouseMove={handleMouseMove}
                    handleMouseUp={handleMouseUp}
                />
                
                <TargetBox 
                    targetSum={targetSum}
                    successfulSelections={successfulSelections}
                    animatingToTarget={animatingToTarget}
                    selectedNumbers={selectedNumbers}
                    currentSum={currentSum}
                    targetBoxRef={targetBoxRef}
                />
            </div>
            
            {!gameActive && !gameOver && (
                <IntroScreen 
                    gameDuration={gameDuration}
                    setGameDuration={setGameDuration}
                    startGame={startGame}
                />
            )}
            
            {gameOver && (
                <GameOverScreen 
                    score={score}
                    gameDuration={gameDuration}
                    shareScore={shareScore}
                    shareButtonText={shareButtonText}
                />
            )}

            <AudioComponents 
                audioRef={audioRef}
                correctSoundRef={correctSoundRef}
                completeGameSoundRef={completeGameSoundRef}
                hintRevealSoundRef={hintRevealSoundRef}
                wrongSoundRef={wrongSoundRef}
            />
        </div>
    );
};

export default Refiner; 