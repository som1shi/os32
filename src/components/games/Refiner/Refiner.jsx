import React from 'react';
import './Refiner.css';
import useRefinerLogic from './hooks/useRefinerLogic';
import {
    Header,
    GameBoard,
    TargetBox,
    IntroScreen,
    GameOverScreen
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
        gameDuration,
        shareFeedback,
        scoreSubmitted,
        submitting,
        submitSuccess,
        submitError,
        gridRef,
        targetBoxRef,
        setGameDuration,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        getCurrentSum,
        startGame,
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
                    scoreSubmitted={scoreSubmitted}
                    submitting={submitting}
                    submitSuccess={submitSuccess}
                    submitError={submitError}
                />
            )}
        </div>
    );
};

export default Refiner; 