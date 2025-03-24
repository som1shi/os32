import React, { memo, useCallback } from 'react';

const CustomGameModal = ({
    customStart,
    customTarget,
    customError,
    customLoading,
    setCustomStart,
    setCustomTarget,
    setShowCustomSetup,
    startCustomGame,
    validateWikipediaTitle
}) => {
    const handleStartChange = useCallback((e) => {
        setCustomStart(e.target.value);
    }, [setCustomStart]);

    const handleTargetChange = useCallback((e) => {
        setCustomTarget(e.target.value);
    }, [setCustomTarget]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        try {
            await startCustomGame();
        } catch (error) {
            console.error("Error starting custom game:", error);
        }
    }, [startCustomGame]);

    const handleCancel = useCallback(() => {
        setShowCustomSetup(false);
    }, [setShowCustomSetup]);

    const isSubmitDisabled = !customStart || !customTarget || customLoading;

    return (
        <div className="rules-modal">
            <div className="custom-game-content">
                <h2>Create Custom Game</h2>
                <p>Enter the names of two Wikipedia articles about people:</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="custom-game-inputs">
                        <div className="custom-input-group">
                            <label>Starting Person:</label>
                            <input 
                                type="text" 
                                value={customStart || ''}
                                onChange={handleStartChange}
                                placeholder="e.g. Albert Einstein"
                                disabled={customLoading}
                                autoComplete="off"
                            />
                        </div>
                        
                        <div className="custom-input-group">
                            <label>Target Person:</label>
                            <input 
                                type="text" 
                                value={customTarget || ''}
                                onChange={handleTargetChange}
                                placeholder="e.g. Marie Curie"
                                disabled={customLoading}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    
                    {customError && (
                        <div className="custom-error">{customError}</div>
                    )}
                    
                    <div className="custom-game-buttons">
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            disabled={customLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitDisabled}
                        >
                            {customLoading ? "Loading..." : "Start Game"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default memo(CustomGameModal); 