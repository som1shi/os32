import React, { memo, useMemo, useState, useEffect } from 'react';
import soundService from '../../../services/soundService';
import './WikiConnect.css';
import PersonCard from './components/PersonCard';
import ConnectionChain from './components/ConnectionChain';
import GameInput from './components/GameInput';
import GameComplete from './components/GameComplete';
import RulesModal from './components/RulesModal';
import CustomGameModal from './components/CustomGameModal';
import useGameState from './hooks/useGameState';
import useWikipediaSearch from './hooks/useWikipediaSearch';

const WikiConnect = () => {
    const {
        startPerson,
        targetPerson,
        currentPerson,
        personChain,
        loading,
        submittingPerson,
        gameActive,
        gameComplete,
        userInput,
        seconds,
        showRules,
        errorMessage,
        linkedPeople,
        suggestions,
        selectedIndex,
        peopleCache,
        showCustomSetup,
        customStart,
        customTarget,
        customError,
        customLoading,
        timerRef,
        inputRef,
        searchPeople,
        fetchLinkedPeople,
        fetchPersonDetailsWithImage,
        fetchPersonDetailsWithCache,
        fetchLinkedPeopleWithCache,
        handleInputChange,
        handleSubmitPerson,
        fetchRandomPeoplePair,
        startGame,
        handleKeyDown,
        handleSelectSuggestion,
        handleSuccess,
        goBack,
        shareScore,
        formatTime,
        handleFormSubmit,
        getWikipediaUrl,
        validateWikipediaTitle,
        startCustomGame,
        setShowRules,
        setShowCustomSetup,
        setCustomStart,
        setCustomTarget
    } = useGameState();

    const {
        debounce,
    } = useWikipediaSearch();

    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        if (gameComplete) soundService.play('notify');
    }, [gameComplete]);

    const startPersonCard = useMemo(() => (
        <PersonCard
            label="Start"
            person={startPerson}
            getWikipediaUrl={getWikipediaUrl}
        />
    ), [startPerson, getWikipediaUrl]);

    const targetPersonCard = useMemo(() => (
        <PersonCard
            label="Target"
            person={targetPerson}
            getWikipediaUrl={getWikipediaUrl}
        />
    ), [targetPerson, getWikipediaUrl]);

    const currentPersonCard = useMemo(() => (
        <PersonCard
            label="Current"
            person={currentPerson}
            startPerson={startPerson}
            getWikipediaUrl={getWikipediaUrl}
        />
    ), [currentPerson, startPerson, getWikipediaUrl]);
    
    const connectionChainComponent = useMemo(() => (
        <ConnectionChain
            personChain={personChain}
        />
    ), [personChain]);
    
    const gameCompleteComponent = useMemo(() => (
        <GameComplete
            key="game-complete"
            personChain={personChain}
            seconds={seconds}
            startGame={startGame}
            shareScore={shareScore}
            formatTime={formatTime}
        />
    ), [personChain, seconds, startGame, shareScore, formatTime]);

    if (showIntro) {
        return (
            <div className="wiki-connect">
                <div className="wc-intro-screen">
                    <div className="wc-intro-logo">WikiConnect</div>
                    <p className="wc-intro-tagline">
                        Connect two Wikipedia personalities in as few steps as possible.
                    </p>
                    <div className="wc-intro-rules">
                        <h3>How to Play</h3>
                        <ul>
                            <li>You'll get a <strong>Start</strong> and a <strong>Target</strong> Wikipedia person</li>
                            <li>Type the name of anyone who links to your current person</li>
                            <li>Navigate through Wikipedia connections to reach the target</li>
                            <li>Fewer steps and faster time = better score!</li>
                        </ul>
                    </div>
                    <button className="wc-intro-btn" onClick={() => { soundService.play('click'); startGame(); setShowIntro(false); }}>
                        ▶ Play WikiConnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="wiki-connect">
            <div className="wiki-connect-menu-bar">
                <div className="wiki-connect-menu-item">
                    <span>File</span>
                    <div className="wiki-connect-menu-dropdown">
                        <div className="wiki-connect-menu-option" onClick={startGame}>New Game</div>
                        <div className="wiki-connect-menu-option" onClick={() => setShowCustomSetup(true)}>Custom Game</div>
                        <div className="wiki-connect-menu-option" onClick={() => window.location.href = "/"}>Exit</div>
                    </div>
                </div>
                <div className="wiki-connect-menu-item">
                    <span>Help</span>
                    <div className="wiki-connect-menu-dropdown">
                        <div className="wiki-connect-menu-option" onClick={() => setShowRules(true)}>How to Play</div>
                    </div>
                </div>
            </div>
            
            <div className="wiki-header">
                <div className="wiki-header-content">
                    <div className="wiki-stats">
                        <span className="stats-item">
                            Steps: <span className="stats-value">{personChain.length - 1}</span>
                        </span>
                        <span className="stats-divider">|</span>
                        <span className="stats-item">
                            Time: <span className="stats-value">{formatTime(seconds)}</span>
                        </span>
            </div>
                    </div>
                </div>
                
            <div className="game-container">
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Finding random people from Wikipedia...</p>
                        <p className="loading-hint">This may take a moment as we search for real people articles</p>
                    </div>
                ) : (
                    <div className="game-content">
                        <div className="person-connection-path">
                            {startPersonCard}
                            
                            <div className="connection-arrow">→</div>
                            
                            {currentPersonCard}
                            
                            <div className="connection-arrow">→</div>
                            
                            {targetPersonCard}
                        </div>
                        
                        {gameComplete ? (
                            gameCompleteComponent
                        ) : (
                            <div className="word-chain-container">
                                {connectionChainComponent}
                                
                                {currentPerson && (
                                    <GameInput
                                        currentPerson={currentPerson}
                                        userInput={userInput}
                                        suggestions={suggestions}
                                        errorMessage={errorMessage}
                                        loading={loading}
                                        submittingPerson={submittingPerson}
                                        gameComplete={gameComplete}
                                        personChain={personChain}
                                        inputRef={inputRef}
                                        handleInputChange={handleInputChange}
                                        handleKeyDown={handleKeyDown}
                                        handleSelectSuggestion={handleSelectSuggestion}
                                        handleFormSubmit={handleFormSubmit}
                                        goBack={goBack}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {showRules && (
                    <RulesModal
                        setShowRules={setShowRules}
                    />
                )}
                
                {showCustomSetup && (
                    <CustomGameModal
                        customStart={customStart}
                        customTarget={customTarget}
                        customError={customError}
                        customLoading={customLoading}
                        setCustomStart={setCustomStart}
                        setCustomTarget={setCustomTarget}
                        setShowCustomSetup={setShowCustomSetup}
                        startCustomGame={startCustomGame}
                        validateWikipediaTitle={validateWikipediaTitle}
                    />
                )}
            </div>
        </div>
    );
};

export default memo(WikiConnect); 